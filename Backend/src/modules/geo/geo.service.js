const prisma = require('../../db/prisma');
const { NotFoundError, BadRequestError } = require('../../utils/errors');
const { getPagination, buildMeta } = require('../../utils/pagination');
const { toNumber } = require('../../utils/decimal');

function listWhere(modelName, req, query) {
  return {
    organizationId: req.user.organizationId,
    ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
    ...(query.zoneId && modelName !== 'zone' ? { zoneId: query.zoneId } : {}),
    ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
  };
}

async function ensureZone(req, zoneId) {
  if (!zoneId) return null;
  const zone = await prisma.zone.findFirst({ where: { id: zoneId, organizationId: req.user.organizationId } });
  if (!zone) throw new BadRequestError('Zone does not exist in your organization');
  return zone;
}

async function list(modelName, req, query) {
  const { page, limit, skip, take } = getPagination(query);
  const where = listWhere(modelName, req, query);
  const [total, rows] = await Promise.all([
    prisma[modelName].count({ where }),
    prisma[modelName].findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
  ]);
  return { rows, meta: buildMeta(page, limit, total) };
}

async function createZone(req, input) {
  return prisma.zone.create({ data: { ...input, organizationId: req.user.organizationId } });
}

async function updateZone(req, id, input) {
  const existing = await prisma.zone.findFirst({ where: { id, organizationId: req.user.organizationId } });
  if (!existing) throw new NotFoundError('Zone not found');
  return prisma.zone.update({ where: { id }, data: input });
}

async function createCollectionPoint(req, input) {
  await ensureZone(req, input.zoneId);
  return prisma.collectionPoint.create({ data: { ...input, organizationId: req.user.organizationId } });
}

async function updateCollectionPoint(req, id, input) {
  const existing = await prisma.collectionPoint.findFirst({ where: { id, organizationId: req.user.organizationId } });
  if (!existing) throw new NotFoundError('Collection point not found');
  if (input.zoneId) await ensureZone(req, input.zoneId);
  return prisma.collectionPoint.update({ where: { id }, data: input });
}

async function createProcessingCenter(req, input) {
  if (input.zoneId) await ensureZone(req, input.zoneId);
  return prisma.processingCenter.create({ data: { ...input, organizationId: req.user.organizationId } });
}

async function updateProcessingCenter(req, id, input) {
  const existing = await prisma.processingCenter.findFirst({ where: { id, organizationId: req.user.organizationId } });
  if (!existing) throw new NotFoundError('Processing center not found');
  if (input.zoneId) await ensureZone(req, input.zoneId);
  return prisma.processingCenter.update({ where: { id }, data: input });
}

async function hotspots(req) {
  const byZone = await prisma.wasteSubmission.groupBy({
    by: ['zoneId', 'wasteType'],
    where: { organizationId: req.user.organizationId },
    _sum: { weightKg: true },
    _count: { _all: true },
  });
  const zones = await prisma.zone.findMany({ where: { organizationId: req.user.organizationId } });
  return zones.map((zone) => {
    const rows = byZone.filter((row) => row.zoneId === zone.id);
    const totalWasteKg = rows.reduce((sum, row) => sum + toNumber(row._sum.weightKg), 0);
    return {
      zone,
      totalWasteKg,
      submissions: rows.reduce((sum, row) => sum + row._count._all, 0),
      byType: rows,
      hotspotScore: Math.round(totalWasteKg * 10) / 10,
    };
  }).sort((a, b) => b.hotspotScore - a.hotspotScore);
}

module.exports = {
  list,
  createZone,
  updateZone,
  createCollectionPoint,
  updateCollectionPoint,
  createProcessingCenter,
  updateProcessingCenter,
  hotspots,
  ensureZone,
};
