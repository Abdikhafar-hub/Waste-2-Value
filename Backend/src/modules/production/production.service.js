const prisma = require('../../db/prisma');
const { AUDIT_ACTIONS, PRODUCTION_BATCH_TRANSITIONS } = require('../../config/constants');
const { createAuditLog } = require('../../utils/audit');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { getPagination, buildMeta } = require('../../utils/pagination');
const { toNumber, quantity } = require('../../utils/decimal');
const inventoryService = require('../inventory/inventory.service');
const { runTransactionWithRetry } = require('../../utils/transaction');

function batchRoleWhere(req) {
  return req.user.role === 'PROCESSOR' ? { processorUserId: req.user.id } : {};
}

function ensureBatchTransition(currentStatus, nextStatus) {
  if (!nextStatus || currentStatus === nextStatus) return;
  const allowed = PRODUCTION_BATCH_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new BadRequestError(`Cannot move production batch from ${currentStatus} to ${nextStatus}`);
  }
}

async function createBatch(req, input) {
  if (req.user.role !== 'PROCESSOR') {
    throw new ForbiddenError('Only processors can create production batches');
  }
  if (input.processingCenterId) {
    const center = await prisma.processingCenter.findFirst({
      where: { id: input.processingCenterId, organizationId: req.user.organizationId, isActive: true },
    });
    if (!center) throw new BadRequestError('Invalid processing center');
  }
  const submissions = await prisma.wasteSubmission.findMany({
    where: {
      id: { in: input.wasteSubmissionIds },
      organizationId: req.user.organizationId,
      wasteType: input.wasteType,
      assignedProcessorUserId: req.user.id,
      status: { in: ['RECEIVED', 'PROCESSING', 'PROCESSED'] },
    },
  });
  if (submissions.length !== input.wasteSubmissionIds.length) {
    throw new BadRequestError('One or more waste submissions are not processable by this processor');
  }
  const existingUsage = await prisma.productionBatchInput.findFirst({
    where: {
      wasteSubmissionId: { in: input.wasteSubmissionIds },
      productionBatch: {
        status: { not: 'CANCELLED' },
      },
    },
  });
  if (existingUsage) {
    throw new BadRequestError('One or more waste submissions are already linked to another active batch');
  }
  const totalInputWeightKg = quantity(submissions.reduce((sum, item) => sum + toNumber(item.weightKg), 0));
  return runTransactionWithRetry(prisma, async (tx) => {
    const batch = await tx.productionBatch.create({
      data: {
        organizationId: req.user.organizationId,
        processorUserId: req.user.id,
        processingCenterId: input.processingCenterId,
        wasteType: input.wasteType,
        totalInputWeightKg,
        status: 'IN_PROGRESS',
        notes: input.notes,
      },
    });
    await tx.productionBatchInput.createMany({
      data: submissions.map((submission) => ({
        organizationId: req.user.organizationId,
        productionBatchId: batch.id,
        wasteSubmissionId: submission.id,
        inputWeightKg: submission.weightKg,
      })),
    });
    await createAuditLog(tx, req, {
      organizationId: req.user.organizationId,
      action: AUDIT_ACTIONS.PRODUCTION_BATCH_CREATED,
      entityType: 'ProductionBatch',
      entityId: batch.id,
      newValues: { batch, inputs: submissions.map((item) => item.id) },
    });
    return batch;
  });
}

async function listBatches(req, query) {
  const { page, limit, skip, take } = getPagination(query);
  const where = {
    organizationId: req.user.organizationId,
    ...batchRoleWhere(req),
    ...(query.status ? { status: query.status } : {}),
    ...(query.wasteType ? { wasteType: query.wasteType } : {}),
    ...(query.processorUserId && req.user.role === 'ORG_ADMIN' ? { processorUserId: query.processorUserId } : {}),
  };
  const [total, batches] = await Promise.all([
    prisma.productionBatch.count({ where }),
    prisma.productionBatch.findMany({ where, include: { inputs: true, outputs: true }, skip, take, orderBy: { createdAt: 'desc' } }),
  ]);
  return { batches, meta: buildMeta(page, limit, total) };
}

async function getBatch(req, id) {
  const batch = await prisma.productionBatch.findFirst({
    where: { id, organizationId: req.user.organizationId, ...batchRoleWhere(req) },
    include: { inputs: { include: { wasteSubmission: true } }, outputs: { include: { product: true } } },
  });
  if (!batch) throw new NotFoundError('Production batch not found');
  return batch;
}

async function updateBatch(req, id, input) {
  const batch = await getBatch(req, id);
  if (batch.status === 'COMPLETED') throw new BadRequestError('Completed batches cannot be edited');
  if (req.user.role !== 'ORG_ADMIN' && batch.processorUserId !== req.user.id) throw new ForbiddenError();
  if (input.status) ensureBatchTransition(batch.status, input.status);
  return prisma.productionBatch.update({ where: { id }, data: input });
}

async function completeBatch(req, id, input) {
  const batchFromView = await getBatch(req, id);
  if (batchFromView.status === 'COMPLETED') throw new BadRequestError('Batch is already completed');
  if (batchFromView.status === 'CANCELLED') throw new BadRequestError('Cancelled batch cannot be completed');
  if (req.user.role !== 'PROCESSOR' || batchFromView.processorUserId !== req.user.id) {
    throw new ForbiddenError('Only the assigned processor can complete this batch');
  }
  for (const output of input.outputs) {
    await inventoryService.ensureProduct(req, output.productId);
  }
  return runTransactionWithRetry(prisma, async (tx) => {
    const batch = await tx.productionBatch.findFirst({
      where: { id, organizationId: req.user.organizationId, processorUserId: req.user.id },
      include: { inputs: { include: { wasteSubmission: true } } },
    });
    if (!batch) throw new NotFoundError('Production batch not found');
    if (batch.status === 'COMPLETED') throw new BadRequestError('Batch is already completed');
    if (batch.status === 'CANCELLED') throw new BadRequestError('Cancelled batch cannot be completed');
    if (batch.status !== 'IN_PROGRESS') {
      throw new BadRequestError('Only in-progress batches can be completed');
    }
    if (batch.inputs.some((inputRow) => inputRow.wasteSubmission.status !== 'PROCESSED')) {
      throw new BadRequestError('All batch inputs must be PROCESSED before batch completion');
    }

    const updated = await tx.productionBatch.update({
      where: { id },
      data: { status: 'COMPLETED', completedAt: new Date(), notes: input.notes || batch.notes },
    });
    const outputs = [];
    for (const output of input.outputs) {
      const productionOutput = await tx.productionOutput.create({
        data: {
          organizationId: req.user.organizationId,
          productionBatchId: id,
          productId: output.productId,
          quantity: output.quantity,
          unit: output.unit,
          notes: output.notes,
        },
      });
      outputs.push(productionOutput);
      await inventoryService.addStock(tx, {
        organizationId: req.user.organizationId,
        productId: output.productId,
        quantity: output.quantity,
        unit: output.unit,
        sourceProductionBatchId: id,
        type: 'PRODUCTION_IN',
        referenceType: 'ProductionBatch',
        referenceId: id,
        notes: output.notes,
        createdByUserId: req.user.id,
      });
    }
    for (const inputRow of batch.inputs) {
      await tx.wasteSubmission.update({ where: { id: inputRow.wasteSubmissionId }, data: { status: 'CONVERTED' } });
      await tx.wasteStatusHistory.create({
        data: {
          organizationId: req.user.organizationId,
          wasteSubmissionId: inputRow.wasteSubmissionId,
          fromStatus: inputRow.wasteSubmission.status,
          toStatus: 'CONVERTED',
          changedByUserId: req.user.id,
          note: `Converted in production batch ${id}`,
        },
      });
      await createAuditLog(tx, req, {
        organizationId: req.user.organizationId,
        action: AUDIT_ACTIONS.WASTE_STATUS_CHANGED,
        entityType: 'WasteSubmission',
        entityId: inputRow.wasteSubmissionId,
        oldValues: { status: inputRow.wasteSubmission.status },
        newValues: { status: 'CONVERTED' },
        metadata: { productionBatchId: id },
      });
    }
    await createAuditLog(tx, req, {
      organizationId: req.user.organizationId,
      action: AUDIT_ACTIONS.PRODUCTION_BATCH_COMPLETED,
      entityType: 'ProductionBatch',
      entityId: id,
      oldValues: { status: batch.status },
      newValues: { status: 'COMPLETED', outputs },
    });
    return { ...updated, outputs };
  });
}

async function metrics(req) {
  const [byStatus, byWasteType, outputs] = await Promise.all([
    prisma.productionBatch.groupBy({
      by: ['status'],
      where: { organizationId: req.user.organizationId },
      _count: { _all: true },
      _sum: { totalInputWeightKg: true },
    }),
    prisma.productionBatch.groupBy({
      by: ['wasteType'],
      where: { organizationId: req.user.organizationId },
      _count: { _all: true },
      _sum: { totalInputWeightKg: true },
    }),
    prisma.productionOutput.groupBy({
      by: ['productId'],
      where: { organizationId: req.user.organizationId },
      _sum: { quantity: true },
    }),
  ]);
  return { byStatus, byWasteType, outputs };
}

module.exports = { createBatch, listBatches, getBatch, updateBatch, completeBatch, metrics };
