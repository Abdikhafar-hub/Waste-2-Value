const prisma = require('../../db/prisma');
const {
  AUDIT_ACTIONS,
  ORDER_STATUS_TRANSITIONS,
  PAYMENT_STATUS_TRANSITIONS,
  DELIVERY_STATUS_TRANSITIONS,
} = require('../../config/constants');
const { createAuditLog } = require('../../utils/audit');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { getPagination, buildMeta } = require('../../utils/pagination');
const { toNumber, money } = require('../../utils/decimal');
const inventoryService = require('../inventory/inventory.service');
const { runTransactionWithRetry } = require('../../utils/transaction');

function orderRoleWhere(req) {
  return req.user.role === 'BUYER' ? { buyerUserId: req.user.id } : {};
}

function ensureStatusTransition(map, current, next, label) {
  if (current === next) return;
  const allowed = map[current] || [];
  if (!allowed.includes(next)) {
    throw new BadRequestError(`Cannot transition ${label} from ${current} to ${next}`);
  }
}

async function getOrderForAdmin(tx, organizationId, id) {
  const order = await tx.order.findFirst({
    where: { id, organizationId },
    include: { items: { include: { product: true } }, deliveries: true, payments: true },
  });
  if (!order) throw new NotFoundError('Order not found');
  return order;
}

async function createOrder(req, input) {
  if (req.user.role !== 'BUYER') {
    throw new ForbiddenError('Only buyers can create orders');
  }
  return runTransactionWithRetry(prisma, async (tx) => {
    const productIds = input.items.map((item) => item.productId);
    if (new Set(productIds).size !== productIds.length) throw new BadRequestError('Duplicate product lines are not allowed');
    const products = await tx.product.findMany({
      where: { id: { in: productIds }, organizationId: req.user.organizationId, isActive: true },
    });
    if (products.length !== productIds.length) throw new BadRequestError('One or more products are unavailable');
    const lines = [];
    for (const item of input.items) {
      const product = products.find((row) => row.id === item.productId);
      const available = await inventoryService.availableStock(req.user.organizationId, item.productId, tx);
      if (available < toNumber(item.quantity)) {
        throw new BadRequestError(`Insufficient stock for ${product.name}`);
      }
      const lineTotal = money(toNumber(item.quantity) * toNumber(product.sellingPrice));
      lines.push({ product, quantity: item.quantity, unitPrice: product.sellingPrice, lineTotal });
    }
    const subtotalAmount = money(lines.reduce((sum, line) => sum + toNumber(line.lineTotal), 0));

    const order = await tx.order.create({
      data: {
        organizationId: req.user.organizationId,
        buyerUserId: req.user.id,
        subtotalAmount,
        totalAmount: subtotalAmount,
        notes: input.notes,
        items: {
          create: lines.map((line) => ({
            organizationId: req.user.organizationId,
            productId: line.product.id,
            quantity: line.quantity,
            unitPrice: line.unitPrice,
            lineTotal: line.lineTotal,
          })),
        },
      },
      include: { items: true },
    });
    for (const line of lines) {
      await inventoryService.deductStock(tx, {
        organizationId: req.user.organizationId,
        productId: line.product.id,
        quantity: line.quantity,
        type: 'SALE_OUT',
        referenceType: 'Order',
        referenceId: order.id,
        notes: `Order ${order.id}`,
        createdByUserId: req.user.id,
      });
    }
    await tx.deliveryRecord.create({
      data: {
        organizationId: req.user.organizationId,
        orderId: order.id,
        status: 'PENDING',
        recipientName: input.delivery?.recipientName,
        recipientPhone: input.delivery?.recipientPhone,
        address: input.delivery?.address,
      },
    });
    await createAuditLog(tx, req, {
      organizationId: req.user.organizationId,
      action: AUDIT_ACTIONS.ORDER_CREATED,
      entityType: 'Order',
      entityId: order.id,
      newValues: order,
    });
    return order;
  });
}

async function listOrders(req, query) {
  const { page, limit, skip, take } = getPagination(query);
  const where = {
    organizationId: req.user.organizationId,
    ...orderRoleWhere(req),
    ...(query.status ? { status: query.status } : {}),
    ...(query.paymentStatus ? { paymentStatus: query.paymentStatus } : {}),
    ...(query.deliveryStatus ? { deliveryStatus: query.deliveryStatus } : {}),
    ...(query.buyerUserId && req.user.role === 'ORG_ADMIN' ? { buyerUserId: query.buyerUserId } : {}),
  };
  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({ where, include: { items: true, deliveries: true, payments: true }, skip, take, orderBy: { createdAt: 'desc' } }),
  ]);
  return { orders, meta: buildMeta(page, limit, total) };
}

async function getOrder(req, id) {
  const order = await prisma.order.findFirst({
    where: { id, organizationId: req.user.organizationId, ...orderRoleWhere(req) },
    include: { items: { include: { product: true } }, deliveries: true, payments: true },
  });
  if (!order) throw new NotFoundError('Order not found');
  return order;
}

async function updateStatus(req, id, status) {
  if (req.user.role !== 'ORG_ADMIN') {
    throw new ForbiddenError('Only org admins can update order status');
  }
  return runTransactionWithRetry(prisma, async (tx) => {
    const order = await getOrderForAdmin(tx, req.user.organizationId, id);
    ensureStatusTransition(ORDER_STATUS_TRANSITIONS, order.status, status, 'order status');

    const updated = await tx.order.update({ where: { id }, data: { status } });

    if (status === 'CANCELLED') {
      for (const item of order.items) {
        await inventoryService.addStock(tx, {
          organizationId: req.user.organizationId,
          productId: item.productId,
          quantity: item.quantity,
          unit: item.product.unit,
          type: 'RETURN',
          referenceType: 'Order',
          referenceId: id,
          notes: `Order ${id} cancelled`,
          createdByUserId: req.user.id,
        });
      }
    }

    await createAuditLog(tx, req, {
      organizationId: req.user.organizationId,
      action: AUDIT_ACTIONS.ORDER_STATUS_CHANGED,
      entityType: 'Order',
      entityId: id,
      oldValues: { status: order.status },
      newValues: { status },
    });
    return updated;
  });
}

async function updatePaymentStatus(req, id, input) {
  if (req.user.role !== 'ORG_ADMIN') {
    throw new ForbiddenError('Only org admins can update payment status');
  }
  return runTransactionWithRetry(prisma, async (tx) => {
    const order = await getOrderForAdmin(tx, req.user.organizationId, id);
    ensureStatusTransition(PAYMENT_STATUS_TRANSITIONS, order.paymentStatus, input.paymentStatus, 'payment status');

    const updated = await tx.order.update({ where: { id }, data: { paymentStatus: input.paymentStatus } });
    await tx.paymentRecord.create({
      data: {
        organizationId: req.user.organizationId,
        orderId: id,
        amount: input.amount ?? (input.paymentStatus === 'PAID' ? order.totalAmount : 0),
        status: input.paymentStatus,
        method: input.method,
        reference: input.reference,
        notes: input.notes,
      },
    });
    await createAuditLog(tx, req, {
      organizationId: req.user.organizationId,
      action: AUDIT_ACTIONS.ORDER_STATUS_CHANGED,
      entityType: 'Order',
      entityId: id,
      oldValues: { paymentStatus: order.paymentStatus },
      newValues: { paymentStatus: input.paymentStatus },
    });
    return updated;
  });
}

async function updateDeliveryStatus(req, id, input) {
  if (req.user.role !== 'ORG_ADMIN') {
    throw new ForbiddenError('Only org admins can update delivery status');
  }
  return runTransactionWithRetry(prisma, async (tx) => {
    const order = await getOrderForAdmin(tx, req.user.organizationId, id);
    ensureStatusTransition(DELIVERY_STATUS_TRANSITIONS, order.deliveryStatus, input.deliveryStatus, 'delivery status');

    const updated = await tx.order.update({ where: { id }, data: { deliveryStatus: input.deliveryStatus } });
    const deliveryUpdate = await tx.deliveryRecord.updateMany({
      where: { orderId: id, organizationId: req.user.organizationId },
      data: {
        status: input.deliveryStatus,
        notes: input.notes,
        ...(input.deliveryStatus === 'IN_TRANSIT' ? { dispatchedAt: new Date() } : {}),
        ...(input.deliveryStatus === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
      },
    });
    if (deliveryUpdate.count === 0) {
      await tx.deliveryRecord.create({
        data: {
          organizationId: req.user.organizationId,
          orderId: id,
          status: input.deliveryStatus,
          notes: input.notes,
          ...(input.deliveryStatus === 'IN_TRANSIT' ? { dispatchedAt: new Date() } : {}),
          ...(input.deliveryStatus === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
        },
      });
    }
    await createAuditLog(tx, req, {
      organizationId: req.user.organizationId,
      action: AUDIT_ACTIONS.ORDER_STATUS_CHANGED,
      entityType: 'Order',
      entityId: id,
      oldValues: { deliveryStatus: order.deliveryStatus },
      newValues: { deliveryStatus: input.deliveryStatus },
    });
    return updated;
  });
}

module.exports = { createOrder, listOrders, getOrder, updateStatus, updatePaymentStatus, updateDeliveryStatus };
