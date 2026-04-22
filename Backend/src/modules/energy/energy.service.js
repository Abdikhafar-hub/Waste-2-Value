const prisma = require('../../db/prisma');
const { AUDIT_ACTIONS } = require('../../config/constants');
const { createAuditLog } = require('../../utils/audit');
const { BadRequestError } = require('../../utils/errors');
const { getPagination, buildMeta } = require('../../utils/pagination');

async function list(modelName, req, query) {
  const { page, limit, skip, take } = getPagination(query);
  const where = { organizationId: req.user.organizationId };
  if (query.isActive !== undefined && ['energyUnit', 'energyConsumer'].includes(modelName)) where.isActive = query.isActive;
  if (query.energyUnitId && modelName === 'energyProductionRecord') where.energyUnitId = query.energyUnitId;
  if (query.energyConsumerId && ['energyUsageRecord', 'energyPaymentRecord'].includes(modelName)) where.energyConsumerId = query.energyConsumerId;
  const [total, rows] = await Promise.all([
    prisma[modelName].count({ where }),
    prisma[modelName].findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
  ]);
  return { rows, meta: buildMeta(page, limit, total) };
}

async function ensureUnit(req, id) {
  const unit = await prisma.energyUnit.findFirst({ where: { id, organizationId: req.user.organizationId, isActive: true } });
  if (!unit) throw new BadRequestError('Energy unit is invalid');
}

async function ensureConsumer(req, id) {
  const consumer = await prisma.energyConsumer.findFirst({ where: { id, organizationId: req.user.organizationId, isActive: true } });
  if (!consumer) throw new BadRequestError('Energy consumer is invalid');
}

async function createUnit(req, input) {
  return prisma.energyUnit.create({ data: { organizationId: req.user.organizationId, ...input } });
}

async function createConsumer(req, input) {
  return prisma.energyConsumer.create({ data: { organizationId: req.user.organizationId, ...input } });
}

async function createProduction(req, input) {
  await ensureUnit(req, input.energyUnitId);
  return prisma.$transaction(async (tx) => {
    const record = await tx.energyProductionRecord.create({ data: { organizationId: req.user.organizationId, ...input } });
    await createAuditLog(tx, req, {
      organizationId: req.user.organizationId,
      action: AUDIT_ACTIONS.ENERGY_RECORD_CREATED,
      entityType: 'EnergyProductionRecord',
      entityId: record.id,
      newValues: record,
    });
    return record;
  });
}

async function createUsage(req, input) {
  await ensureConsumer(req, input.energyConsumerId);
  return prisma.$transaction(async (tx) => {
    const record = await tx.energyUsageRecord.create({ data: { organizationId: req.user.organizationId, ...input } });
    await createAuditLog(tx, req, {
      organizationId: req.user.organizationId,
      action: AUDIT_ACTIONS.ENERGY_RECORD_CREATED,
      entityType: 'EnergyUsageRecord',
      entityId: record.id,
      newValues: record,
    });
    return record;
  });
}

async function createPayment(req, input) {
  await ensureConsumer(req, input.energyConsumerId);
  return prisma.$transaction(async (tx) => {
    const record = await tx.energyPaymentRecord.create({ data: { organizationId: req.user.organizationId, ...input } });
    await createAuditLog(tx, req, {
      organizationId: req.user.organizationId,
      action: AUDIT_ACTIONS.ENERGY_RECORD_CREATED,
      entityType: 'EnergyPaymentRecord',
      entityId: record.id,
      newValues: record,
    });
    return record;
  });
}

module.exports = { list, createUnit, createConsumer, createProduction, createUsage, createPayment };
