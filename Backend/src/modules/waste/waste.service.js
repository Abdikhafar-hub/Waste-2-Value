const prisma = require('../../db/prisma');
const { WASTE_TRANSITIONS, AUDIT_ACTIONS } = require('../../config/constants');
const { createAuditLog } = require('../../utils/audit');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { getPagination, buildMeta } = require('../../utils/pagination');
const { toNumber } = require('../../utils/decimal');
const { calculateCollectionCredits, calculateProcessorCredits } = require('../rules/rules.service');
const walletService = require('../wallet/wallet.service');

function roleWhere(req) {
  if (req.user.role === 'ORG_ADMIN') return {};
  if (req.user.role === 'COLLECTOR') return { collectorUserId: req.user.id };
  if (req.user.role === 'PROCESSOR') return { assignedProcessorUserId: req.user.id };
  return { id: '__none__' };
}

function canTransition(fromStatus, toStatus) {
  return (WASTE_TRANSITIONS[fromStatus] || []).includes(toStatus);
}

function assertTransitionRole(req, toStatus) {
  if (['UNDER_REVIEW', 'APPROVED', 'REJECTED', 'ASSIGNED'].includes(toStatus) && req.user.role !== 'ORG_ADMIN') {
    throw new ForbiddenError('Only org admins can perform this transition');
  }
  if (['RECEIVED', 'PROCESSING', 'PROCESSED'].includes(toStatus) && req.user.role !== 'PROCESSOR') {
    throw new ForbiddenError('Only processors can perform this transition');
  }
}

async function getSubmissionForRole(req, id) {
  const submission = await prisma.wasteSubmission.findFirst({
    where: { id, organizationId: req.user.organizationId, ...roleWhere(req) },
    include: { zone: true, collectionPoint: true, processingCenter: true },
  });
  if (!submission) throw new NotFoundError('Waste submission not found');
  return submission;
}

async function validateLocation(req, input) {
  const zone = await prisma.zone.findFirst({ where: { id: input.zoneId, organizationId: req.user.organizationId, isActive: true } });
  if (!zone) throw new BadRequestError('Zone is invalid for this organization');
  if (input.collectionPointId) {
    const point = await prisma.collectionPoint.findFirst({
      where: { id: input.collectionPointId, organizationId: req.user.organizationId, zoneId: input.zoneId, isActive: true },
    });
    if (!point) throw new BadRequestError('Collection point is invalid for this zone');
  }
}

async function createSubmission(req, input) {
  if (req.user.role !== 'COLLECTOR') {
    throw new ForbiddenError('Only collectors can submit waste');
  }
  await validateLocation(req, input);
  return prisma.$transaction(async (tx) => {
    if (input.tagCode) {
      const existingTag = await tx.wasteTag.findUnique({
        where: { organizationId_code: { organizationId: req.user.organizationId, code: input.tagCode } },
      });
      if (existingTag?.linkedWasteSubmissionId) {
        throw new BadRequestError('Tag code is already linked to another submission');
      }
    }
    const submission = await tx.wasteSubmission.create({
      data: {
        organizationId: req.user.organizationId,
        collectorUserId: req.user.id,
        zoneId: input.zoneId,
        collectionPointId: input.collectionPointId,
        wasteType: input.wasteType,
        weightKg: input.weightKg,
        tagCode: input.tagCode,
        source: input.source || 'MANUAL',
        imageUrl: input.imageUrl,
        notes: input.notes,
        metadata: input.metadata,
      },
    });
    await tx.wasteStatusHistory.create({
      data: {
        organizationId: req.user.organizationId,
        wasteSubmissionId: submission.id,
        toStatus: 'SUBMITTED',
        changedByUserId: req.user.id,
        note: 'Submitted by collector',
      },
    });
    if (input.tagCode) {
      await tx.wasteTag.upsert({
        where: { organizationId_code: { organizationId: req.user.organizationId, code: input.tagCode } },
        update: { linkedWasteSubmissionId: submission.id },
        create: { organizationId: req.user.organizationId, code: input.tagCode, linkedWasteSubmissionId: submission.id },
      });
    }
    await createAuditLog(tx, req, {
      organizationId: req.user.organizationId,
      action: AUDIT_ACTIONS.WASTE_CREATED,
      entityType: 'WasteSubmission',
      entityId: submission.id,
      newValues: submission,
    });
    return submission;
  });
}

async function listSubmissions(req, query) {
  const { page, limit, skip, take } = getPagination(query);
  const where = {
    organizationId: req.user.organizationId,
    ...roleWhere(req),
    ...(query.status ? { status: query.status } : {}),
    ...(query.wasteType ? { wasteType: query.wasteType } : {}),
    ...(query.collectorUserId && req.user.role === 'ORG_ADMIN' ? { collectorUserId: query.collectorUserId } : {}),
    ...(query.processorUserId && req.user.role === 'ORG_ADMIN' ? { assignedProcessorUserId: query.processorUserId } : {}),
    ...(query.zoneId ? { zoneId: query.zoneId } : {}),
    ...((query.from || query.to) ? { submittedAt: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } } : {}),
  };
  const [total, submissions] = await Promise.all([
    prisma.wasteSubmission.count({ where }),
    prisma.wasteSubmission.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
  ]);
  return { submissions, meta: buildMeta(page, limit, total) };
}

async function updateSubmission(req, id, input) {
  const submission = await getSubmissionForRole(req, id);
  if (req.user.role !== 'COLLECTOR' || !['SUBMITTED', 'UNDER_REVIEW'].includes(submission.status)) {
    throw new ForbiddenError('Only the collector can edit an early-stage submission');
  }
  return prisma.wasteSubmission.update({ where: { id }, data: input });
}

async function transition(req, id, toStatus, note, extraData = {}) {
  assertTransitionRole(req, toStatus);
  const submission = await prisma.wasteSubmission.findFirst({ where: { id, organizationId: req.user.organizationId } });
  if (!submission) throw new NotFoundError('Waste submission not found');
  if (!canTransition(submission.status, toStatus)) {
    throw new BadRequestError(`Cannot move waste submission from ${submission.status} to ${toStatus}`);
  }
  if (toStatus === 'RECEIVED' && !submission.assignedProcessorUserId) {
    throw new BadRequestError('Submission must be assigned before receipt');
  }
  if (toStatus === 'PROCESSING' && submission.status !== 'RECEIVED') {
    throw new BadRequestError('Submission can only start processing after receipt');
  }
  if (toStatus === 'PROCESSED' && submission.status !== 'PROCESSING') {
    throw new BadRequestError('Submission can only be marked processed from processing');
  }
  if (req.user.role === 'PROCESSOR' && submission.assignedProcessorUserId !== req.user.id) {
    throw new ForbiddenError('Processor can only update assigned submissions');
  }
  return prisma.$transaction(async (tx) => {
    const data = {
      status: toStatus,
      ...extraData,
      ...(toStatus === 'APPROVED' ? { approvedAt: new Date() } : {}),
      ...(toStatus === 'RECEIVED' ? { receivedAt: new Date() } : {}),
      ...(toStatus === 'PROCESSED' ? { processedAt: new Date() } : {}),
    };
    const updated = await tx.wasteSubmission.update({ where: { id }, data });
    await tx.wasteStatusHistory.create({
      data: {
        organizationId: req.user.organizationId,
        wasteSubmissionId: id,
        fromStatus: submission.status,
        toStatus,
        changedByUserId: req.user.id,
        note,
      },
    });
    if (toStatus === 'APPROVED') {
      const credits = await calculateCollectionCredits(req.user.organizationId, submission.wasteType, submission.weightKg);
      if (credits > 0) {
        await walletService.createTransaction(tx, {
          organizationId: req.user.organizationId,
          userId: submission.collectorUserId,
          type: 'CREDIT_EARNED',
          amount: credits,
          referenceType: 'WasteSubmission',
          referenceId: id,
          description: `Credits earned for approved ${submission.wasteType.toLowerCase()} waste`,
          createdByUserId: req.user.id,
          enforceUniqueReference: true,
        });
      }
    }
    if (toStatus === 'PROCESSED' && submission.assignedProcessorUserId) {
      const credits = await calculateProcessorCredits(req.user.organizationId, submission.wasteType, submission.weightKg);
      if (credits > 0) {
        await walletService.createTransaction(tx, {
          organizationId: req.user.organizationId,
          userId: submission.assignedProcessorUserId,
          type: 'CREDIT_REWARD',
          amount: credits,
          referenceType: 'WasteSubmission',
          referenceId: id,
          description: 'Processor reward for completed waste processing',
          createdByUserId: req.user.id,
          enforceUniqueReference: true,
        });
      }
    }
    await createAuditLog(tx, req, {
      organizationId: req.user.organizationId,
      action: toStatus === 'ASSIGNED' ? AUDIT_ACTIONS.WASTE_ASSIGNED : AUDIT_ACTIONS.WASTE_STATUS_CHANGED,
      entityType: 'WasteSubmission',
      entityId: id,
      oldValues: { status: submission.status },
      newValues: { status: toStatus, ...extraData },
    });
    return updated;
  });
}

async function assign(req, id, input) {
  const processor = await prisma.user.findFirst({
    where: { id: input.processorUserId, organizationId: req.user.organizationId, role: 'PROCESSOR', status: 'ACTIVE' },
  });
  if (!processor) throw new BadRequestError('Processor is invalid for this organization');
  if (input.processingCenterId) {
    const center = await prisma.processingCenter.findFirst({
      where: { id: input.processingCenterId, organizationId: req.user.organizationId, isActive: true },
    });
    if (!center) throw new BadRequestError('Processing center is invalid for this organization');
  }
  return transition(req, id, 'ASSIGNED', input.note, {
    assignedProcessorUserId: input.processorUserId,
    processingCenterId: input.processingCenterId,
  });
}

async function history(req, id) {
  await getSubmissionForRole(req, id);
  return prisma.wasteStatusHistory.findMany({
    where: { organizationId: req.user.organizationId, wasteSubmissionId: id },
    orderBy: { createdAt: 'asc' },
  });
}

async function listTags(req) {
  return prisma.wasteTag.findMany({
    where: { organizationId: req.user.organizationId },
    orderBy: { createdAt: 'desc' },
  });
}

async function createTag(req, input) {
  return prisma.wasteTag.create({ data: { organizationId: req.user.organizationId, ...input } });
}

module.exports = {
  createSubmission,
  listSubmissions,
  getSubmissionForRole,
  updateSubmission,
  transition,
  assign,
  history,
  listTags,
  createTag,
};
