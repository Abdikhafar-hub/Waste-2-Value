const prisma = require('../../db/prisma');
const esgService = require('../esg/esg.service');
const inventoryService = require('../inventory/inventory.service');
const { toNumber, money } = require('../../utils/decimal');

async function dashboard(req) {
  const [esg, users, orders, batches, inventory] = await Promise.all([
    esgService.computeSummary(req, {}),
    prisma.user.groupBy({ by: ['role'], where: { organizationId: req.user.organizationId }, _count: { _all: true } }),
    prisma.order.groupBy({ by: ['status'], where: { organizationId: req.user.organizationId }, _count: { _all: true }, _sum: { totalAmount: true } }),
    prisma.productionBatch.groupBy({ by: ['status'], where: { organizationId: req.user.organizationId }, _count: { _all: true }, _sum: { totalInputWeightKg: true } }),
    inventoryService.inventory(req, { page: 1, limit: 100 }),
  ]);
  return { esg, users, orders, batches, inventory: inventory.rows };
}

async function wasteByZone(req) {
  const rows = await prisma.wasteSubmission.groupBy({
    by: ['zoneId', 'wasteType'],
    where: { organizationId: req.user.organizationId },
    _sum: { weightKg: true },
    _count: { _all: true },
  });
  const zones = await prisma.zone.findMany({ where: { organizationId: req.user.organizationId } });
  return zones.map((zone) => ({
    zone,
    rows: rows.filter((row) => row.zoneId === zone.id),
    totalWasteKg: rows.filter((row) => row.zoneId === zone.id).reduce((sum, row) => sum + toNumber(row._sum.weightKg), 0),
  }));
}

async function collectorPerformance(req) {
  const rows = await prisma.wasteSubmission.groupBy({
    by: ['collectorUserId', 'status'],
    where: { organizationId: req.user.organizationId },
    _sum: { weightKg: true },
    _count: { _all: true },
  });
  return rows;
}

async function processorPerformance(req) {
  return prisma.productionBatch.groupBy({
    by: ['processorUserId', 'status'],
    where: { organizationId: req.user.organizationId },
    _sum: { totalInputWeightKg: true },
    _count: { _all: true },
  });
}

async function revenue(req) {
  const rows = await prisma.order.groupBy({
    by: ['paymentStatus'],
    where: { organizationId: req.user.organizationId },
    _sum: { totalAmount: true },
    _count: { _all: true },
  });
  return {
    rows,
    paidRevenue: money(rows.filter((row) => row.paymentStatus === 'PAID').reduce((sum, row) => sum + toNumber(row._sum.totalAmount), 0)),
  };
}

async function marketSummary(req) {
  const [orders, products, movements] = await Promise.all([
    prisma.order.aggregate({ where: { organizationId: req.user.organizationId }, _count: { _all: true }, _sum: { totalAmount: true } }),
    prisma.product.count({ where: { organizationId: req.user.organizationId, isActive: true } }),
    prisma.inventoryMovement.groupBy({ by: ['type'], where: { organizationId: req.user.organizationId }, _sum: { quantity: true }, _count: { _all: true } }),
  ]);
  return { orders, activeProducts: products, movements };
}

module.exports = { dashboard, wasteByZone, collectorPerformance, processorPerformance, revenue, marketSummary };
