const prisma = require('../../db/prisma');
const { AUDIT_ACTIONS } = require('../../config/constants');
const { createAuditLog } = require('../../utils/audit');
const { BadRequestError, NotFoundError } = require('../../utils/errors');
const { getPagination, buildMeta } = require('../../utils/pagination');

async function list(req, query) {
  const { page, limit, skip, take } = getPagination(query);
  const where = {
    organizationId: req.user.organizationId,
    ...(query.zoneId ? { zoneId: query.zoneId } : {}),
    ...(query.type ? { type: query.type } : {}),
    ...((query.from || query.to) ? { generatedAt: { ...(query.from ? { gte: query.from } : {}), ...(query.to ? { lte: query.to } : {}) } } : {}),
  };
  const [total, insights] = await Promise.all([
    prisma.aIInsight.count({ where }),
    prisma.aIInsight.findMany({ where, skip, take, orderBy: { generatedAt: 'desc' } }),
  ]);
  return { insights, meta: buildMeta(page, limit, total) };
}

async function create(req, input) {
  if (input.zoneId) {
    const zone = await prisma.zone.findFirst({ where: { id: input.zoneId, organizationId: req.user.organizationId } });
    if (!zone) throw new BadRequestError('Zone does not exist in your organization');
  }
  return prisma.$transaction(async (tx) => {
    const insight = await tx.aIInsight.create({
      data: {
        organizationId: req.user.organizationId,
        zoneId: input.zoneId,
        type: input.type,
        title: input.title,
        description: input.description,
        severity: input.severity,
        payload: input.payload,
        generatedAt: input.generatedAt || new Date(),
        createdByUserId: req.user.id,
      },
    });
    await createAuditLog(tx, req, {
      organizationId: req.user.organizationId,
      action: AUDIT_ACTIONS.AI_INSIGHT_CREATED,
      entityType: 'AIInsight',
      entityId: insight.id,
      newValues: insight,
    });
    return insight;
  });
}

async function get(req, id) {
  const insight = await prisma.aIInsight.findFirst({ where: { id, organizationId: req.user.organizationId } });
  if (!insight) throw new NotFoundError('AI insight not found');
  return insight;
}

module.exports = { list, create, get };
