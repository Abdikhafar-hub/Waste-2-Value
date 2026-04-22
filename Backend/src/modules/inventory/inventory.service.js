const prisma = require('../../db/prisma');
const { AUDIT_ACTIONS } = require('../../config/constants');
const { createAuditLog } = require('../../utils/audit');
const { BadRequestError, NotFoundError } = require('../../utils/errors');
const { getPagination, buildMeta } = require('../../utils/pagination');
const { toNumber, quantity } = require('../../utils/decimal');
const { runTransactionWithRetry } = require('../../utils/transaction');

async function ensureProduct(reqOrOrgId, productId, tx = prisma) {
  const organizationId = typeof reqOrOrgId === 'string' ? reqOrOrgId : reqOrOrgId.user.organizationId;
  const product = await tx.product.findFirst({ where: { id: productId, organizationId } });
  if (!product) throw new NotFoundError('Product not found');
  return product;
}

async function availableStock(organizationId, productId, tx = prisma) {
  const result = await tx.inventoryLot.aggregate({
    where: { organizationId, productId },
    _sum: { quantityAvailable: true },
  });
  return quantity(result._sum.quantityAvailable || 0);
}

async function addStock(tx, data) {
  const qty = quantity(data.quantity);
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new BadRequestError('Inventory increase quantity must be positive');
  }
  const product = await ensureProduct(data.organizationId, data.productId, tx);
  if (data.unit !== product.unit) {
    throw new BadRequestError(`Inventory unit mismatch for ${product.name}: expected ${product.unit}`);
  }

  const lot = await tx.inventoryLot.create({
    data: {
      organizationId: data.organizationId,
      productId: data.productId,
      quantityAvailable: qty,
      unit: data.unit,
      sourceProductionBatchId: data.sourceProductionBatchId,
      notes: data.notes,
    },
  });
  const movement = await tx.inventoryMovement.create({
    data: {
      organizationId: data.organizationId,
      productId: data.productId,
      inventoryLotId: lot.id,
      type: data.type || 'PRODUCTION_IN',
      quantity: qty,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      notes: data.notes,
      createdByUserId: data.createdByUserId,
    },
  });
  return { lot, movement };
}

async function deductStock(tx, data) {
  let remaining = quantity(data.quantity);
  if (!Number.isFinite(remaining) || remaining <= 0) {
    throw new BadRequestError('Inventory deduction quantity must be positive');
  }
  const available = await availableStock(data.organizationId, data.productId, tx);
  if (available < remaining) throw new BadRequestError('Insufficient stock');
  const lots = await tx.inventoryLot.findMany({
    where: { organizationId: data.organizationId, productId: data.productId, quantityAvailable: { gt: 0 } },
    orderBy: { createdAt: 'asc' },
  });
  const movements = [];
  for (const lot of lots) {
    if (remaining <= 0) break;
    const lotQty = toNumber(lot.quantityAvailable);
    const take = Math.min(lotQty, remaining);
    await tx.inventoryLot.update({
      where: { id: lot.id },
      data: { quantityAvailable: quantity(lotQty - take) },
    });
    movements.push(await tx.inventoryMovement.create({
      data: {
        organizationId: data.organizationId,
        productId: data.productId,
        inventoryLotId: lot.id,
        type: data.type || 'SALE_OUT',
        quantity: -take,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        notes: data.notes,
        createdByUserId: data.createdByUserId,
      },
    }));
    remaining = quantity(remaining - take);
  }
  if (remaining > 0) throw new BadRequestError('Unable to complete stock deduction');
  return movements;
}

async function inventory(req, query) {
  const { page, limit, skip, take } = getPagination(query);
  const where = {
    organizationId: req.user.organizationId,
    ...(query.productId ? { id: query.productId } : {}),
  };
  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
  ]);
  const rows = await Promise.all(products.map(async (product) => ({
    product,
    quantityAvailable: await availableStock(req.user.organizationId, product.id),
  })));
  return { rows, meta: buildMeta(page, limit, total) };
}

async function listLots(req, query) {
  const { page, limit, skip, take } = getPagination(query);
  const where = { organizationId: req.user.organizationId, ...(query.productId ? { productId: query.productId } : {}) };
  const [total, lots] = await Promise.all([
    prisma.inventoryLot.count({ where }),
    prisma.inventoryLot.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
  ]);
  return { lots, meta: buildMeta(page, limit, total) };
}

async function listMovements(req, query) {
  const { page, limit, skip, take } = getPagination(query);
  const where = {
    organizationId: req.user.organizationId,
    ...(query.productId ? { productId: query.productId } : {}),
    ...(query.type ? { type: query.type } : {}),
  };
  const [total, movements] = await Promise.all([
    prisma.inventoryMovement.count({ where }),
    prisma.inventoryMovement.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
  ]);
  return { movements, meta: buildMeta(page, limit, total) };
}

async function adjustment(req, input) {
  await ensureProduct(req, input.productId);
  return runTransactionWithRetry(prisma, async (tx) => {
    const result = input.quantity > 0
      ? await addStock(tx, {
        organizationId: req.user.organizationId,
        productId: input.productId,
        quantity: input.quantity,
        unit: input.unit,
        type: 'ADJUSTMENT',
        notes: input.notes,
        createdByUserId: req.user.id,
      })
      : await deductStock(tx, {
        organizationId: req.user.organizationId,
        productId: input.productId,
        quantity: Math.abs(input.quantity),
        type: 'ADJUSTMENT',
        notes: input.notes,
        createdByUserId: req.user.id,
      });
    await createAuditLog(tx, req, {
      organizationId: req.user.organizationId,
      action: AUDIT_ACTIONS.INVENTORY_ADJUSTED,
      entityType: 'Product',
      entityId: input.productId,
      newValues: input,
    });
    return result;
  });
}

module.exports = {
  ensureProduct,
  availableStock,
  addStock,
  deductStock,
  inventory,
  listLots,
  listMovements,
  adjustment,
};
