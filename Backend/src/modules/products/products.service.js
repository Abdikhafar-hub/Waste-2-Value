const prisma = require('../../db/prisma');
const { AUDIT_ACTIONS } = require('../../config/constants');
const { createAuditLog } = require('../../utils/audit');
const { NotFoundError, ConflictError } = require('../../utils/errors');
const { getPagination, buildMeta } = require('../../utils/pagination');

async function listProducts(req, query) {
  const { page, limit, skip, take } = getPagination(query);
  const where = {
    organizationId: req.user.organizationId,
    ...(req.user.role === 'BUYER' ? { isActive: true } : {}),
    ...(query.isActive !== undefined && req.user.role === 'ORG_ADMIN' ? { isActive: query.isActive } : {}),
    ...(query.category ? { category: query.category } : {}),
    ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
  };
  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
  ]);
  return { products, meta: buildMeta(page, limit, total) };
}

async function getProduct(req, id) {
  const product = await prisma.product.findFirst({ where: { id, organizationId: req.user.organizationId } });
  if (!product || (req.user.role === 'BUYER' && !product.isActive)) throw new NotFoundError('Product not found');
  const stock = await prisma.inventoryLot.aggregate({
    where: { organizationId: req.user.organizationId, productId: id },
    _sum: { quantityAvailable: true },
  });
  return { ...product, quantityAvailable: stock._sum.quantityAvailable || 0 };
}

async function createProduct(req, input) {
  const existing = await prisma.product.findUnique({
    where: { organizationId_slug: { organizationId: req.user.organizationId, slug: input.slug } },
  });
  if (existing) throw new ConflictError('Product slug already exists in this organization');
  return prisma.$transaction(async (tx) => {
    const product = await tx.product.create({ data: { ...input, organizationId: req.user.organizationId } });
    await createAuditLog(tx, req, {
      organizationId: req.user.organizationId,
      action: AUDIT_ACTIONS.PRODUCT_CREATED,
      entityType: 'Product',
      entityId: product.id,
      newValues: product,
    });
    return product;
  });
}

async function updateProduct(req, id, input) {
  const product = await prisma.product.findFirst({ where: { id, organizationId: req.user.organizationId } });
  if (!product) throw new NotFoundError('Product not found');
  return prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({ where: { id }, data: input });
    await createAuditLog(tx, req, {
      organizationId: req.user.organizationId,
      action: AUDIT_ACTIONS.PRODUCT_UPDATED,
      entityType: 'Product',
      entityId: id,
      oldValues: product,
      newValues: updated,
    });
    return updated;
  });
}

async function updateStatus(req, id, isActive) {
  const product = await prisma.product.findFirst({ where: { id, organizationId: req.user.organizationId } });
  if (!product) throw new NotFoundError('Product not found');
  return prisma.$transaction(async (tx) => {
    const updated = await tx.product.update({ where: { id }, data: { isActive } });
    await createAuditLog(tx, req, {
      organizationId: req.user.organizationId,
      action: AUDIT_ACTIONS.PRODUCT_UPDATED,
      entityType: 'Product',
      entityId: id,
      oldValues: { isActive: product.isActive },
      newValues: { isActive },
    });
    return updated;
  });
}

module.exports = { listProducts, getProduct, createProduct, updateProduct, updateStatus };
