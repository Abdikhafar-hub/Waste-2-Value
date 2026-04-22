const prisma = require('../../db/prisma');
const { AUDIT_ACTIONS } = require('../../config/constants');
const { createAuditLog } = require('../../utils/audit');
const { BadRequestError, NotFoundError, ForbiddenError } = require('../../utils/errors');
const { getPagination, buildMeta } = require('../../utils/pagination');
const { toNumber, money } = require('../../utils/decimal');
const { runTransactionWithRetry } = require('../../utils/transaction');

async function ensureWalletUser(tx, organizationId, userId) {
  const user = await tx.user.findFirst({
    where: {
      id: userId,
      organizationId,
      status: 'ACTIVE',
    },
  });
  if (!user) throw new NotFoundError('Wallet user not found in this organization');
  return user;
}

async function getOrCreateWallet(tx, organizationId, userId) {
  await ensureWalletUser(tx, organizationId, userId);
  const existing = await tx.wallet.findUnique({ where: { userId } });
  if (existing) {
    if (existing.organizationId !== organizationId) {
      throw new ForbiddenError('Wallet does not belong to this organization');
    }
    return existing;
  }
  return tx.wallet.create({ data: { organizationId, userId } });
}

async function getBalance(client, walletId) {
  const aggregate = await client.walletTransaction.aggregate({
    where: { walletId },
    _sum: { amount: true },
  });
  return money(aggregate._sum.amount || 0);
}

async function createTransaction(tx, data) {
  const wallet = await getOrCreateWallet(tx, data.organizationId, data.userId);
  if (wallet.status !== 'ACTIVE') throw new ForbiddenError('Wallet is not active');
  const amount = money(toNumber(data.amount));
  if (!Number.isFinite(amount) || amount === 0) throw new BadRequestError('Wallet transaction amount must be non-zero');

  if (data.enforceUniqueReference && data.referenceType && data.referenceId) {
    const existing = await tx.walletTransaction.findFirst({
      where: {
        organizationId: data.organizationId,
        userId: data.userId,
        type: data.type,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
      },
    });
    if (existing) return existing;
  }

  const currentBalance = await getBalance(tx, wallet.id);
  const nextBalance = money(currentBalance + amount);
  if (nextBalance < 0) throw new BadRequestError('Wallet has insufficient credits');
  try {
    return await tx.walletTransaction.create({
      data: {
        organizationId: data.organizationId,
        walletId: wallet.id,
        userId: data.userId,
        type: data.type,
        amount,
        balanceAfter: nextBalance,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        description: data.description,
        metadata: data.metadata,
        createdByUserId: data.createdByUserId,
      },
    });
  } catch (error) {
    if (data.enforceUniqueReference && error?.code === 'P2002' && data.referenceType && data.referenceId) {
      const existing = await tx.walletTransaction.findFirst({
        where: {
          organizationId: data.organizationId,
          userId: data.userId,
          type: data.type,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
        },
      });
      if (existing) return existing;
    }
    throw error;
  }
}

async function getMyWallet(req) {
  const wallet = await prisma.wallet.findUnique({ where: { userId: req.user.id } });
  if (!wallet) throw new NotFoundError('Wallet not found for this user');
  const balance = await getBalance(prisma, wallet.id);
  return { ...wallet, balance };
}

async function listTransactions(req, query) {
  const { page, limit, skip, take } = getPagination(query);
  const where = {
    organizationId: req.user.organizationId,
    ...(req.user.role === 'ORG_ADMIN'
      ? (query.userId ? { userId: query.userId } : {})
      : { userId: req.user.id }),
    ...(query.type ? { type: query.type } : {}),
  };
  if (req.user.role !== 'ORG_ADMIN' && query.userId && query.userId !== req.user.id) {
    throw new ForbiddenError('You can only view your own wallet transactions');
  }
  const [total, transactions] = await Promise.all([
    prisma.walletTransaction.count({ where }),
    prisma.walletTransaction.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
  ]);
  return { transactions, meta: buildMeta(page, limit, total) };
}

async function createRedemption(req, input) {
  return runTransactionWithRetry(prisma, async (tx) => {
    const wallet = await tx.wallet.findUnique({ where: { userId: req.user.id } });
    if (!wallet || wallet.organizationId !== req.user.organizationId) {
      throw new NotFoundError('Wallet not found for this user');
    }
    if (wallet.status !== 'ACTIVE') throw new ForbiddenError('Wallet is not active');
    const balance = await getBalance(tx, wallet.id);
    if (toNumber(input.amount) > balance) throw new BadRequestError('Requested amount exceeds available balance');
    const redemption = await tx.creditRedemptionRequest.create({
      data: {
        organizationId: req.user.organizationId,
        walletId: wallet.id,
        userId: req.user.id,
        amount: input.amount,
        requestedItem: input.requestedItem,
        notes: input.notes,
      },
    });
    await createAuditLog(tx, req, {
      organizationId: req.user.organizationId,
      action: AUDIT_ACTIONS.REDEMPTION_CREATED,
      entityType: 'CreditRedemptionRequest',
      entityId: redemption.id,
      newValues: redemption,
    });
    return redemption;
  });
}

async function listRedemptions(req, query) {
  const { page, limit, skip, take } = getPagination(query);
  const where = {
    organizationId: req.user.organizationId,
    ...(req.user.role === 'ORG_ADMIN' ? {} : { userId: req.user.id }),
  };
  const [total, redemptions] = await Promise.all([
    prisma.creditRedemptionRequest.count({ where }),
    prisma.creditRedemptionRequest.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
  ]);
  return { redemptions, meta: buildMeta(page, limit, total) };
}

async function getRedemption(req, id) {
  const where = { id, organizationId: req.user.organizationId };
  const redemption = await prisma.creditRedemptionRequest.findFirst({ where });
  if (!redemption) throw new NotFoundError('Redemption request not found');
  if (req.user.role !== 'ORG_ADMIN' && redemption.userId !== req.user.id) {
    throw new ForbiddenError('You can only view your own redemptions');
  }
  return redemption;
}

async function approveRedemption(req, id, notes) {
  if (req.user.role !== 'ORG_ADMIN') {
    throw new ForbiddenError('Only org admins can approve redemptions');
  }
  return runTransactionWithRetry(prisma, async (tx) => {
    const redemption = await tx.creditRedemptionRequest.findFirst({
      where: { id, organizationId: req.user.organizationId },
    });
    if (!redemption) throw new NotFoundError('Redemption request not found');
    if (redemption.status !== 'REQUESTED') throw new BadRequestError('Only requested redemptions can be approved');

    await createTransaction(tx, {
      organizationId: req.user.organizationId,
      userId: redemption.userId,
      type: 'CREDIT_REDEEMED',
      amount: -Math.abs(toNumber(redemption.amount)),
      referenceType: 'CreditRedemptionRequest',
      referenceId: redemption.id,
      description: notes || `Redemption approved for ${redemption.requestedItem || 'credits'}`,
      createdByUserId: req.user.id,
      enforceUniqueReference: true,
    });
    const updated = await tx.creditRedemptionRequest.update({
      where: { id: redemption.id },
      data: { status: 'APPROVED', reviewedByUserId: req.user.id, reviewedAt: new Date(), notes: notes || redemption.notes },
    });
    await createAuditLog(tx, req, {
      organizationId: req.user.organizationId,
      action: AUDIT_ACTIONS.REDEMPTION_REVIEWED,
      entityType: 'CreditRedemptionRequest',
      entityId: id,
      oldValues: { status: redemption.status },
      newValues: { status: 'APPROVED' },
    });
    return updated;
  });
}

async function rejectRedemption(req, id, notes) {
  if (req.user.role !== 'ORG_ADMIN') {
    throw new ForbiddenError('Only org admins can reject redemptions');
  }
  return runTransactionWithRetry(prisma, async (tx) => {
    const redemption = await tx.creditRedemptionRequest.findFirst({
      where: { id, organizationId: req.user.organizationId },
    });
    if (!redemption) throw new NotFoundError('Redemption request not found');
    if (redemption.status !== 'REQUESTED') throw new BadRequestError('Only requested redemptions can be rejected');
    const updated = await tx.creditRedemptionRequest.update({
      where: { id: redemption.id },
      data: { status: 'REJECTED', reviewedByUserId: req.user.id, reviewedAt: new Date(), notes: notes || redemption.notes },
    });
    await createAuditLog(tx, req, {
      organizationId: req.user.organizationId,
      action: AUDIT_ACTIONS.REDEMPTION_REVIEWED,
      entityType: 'CreditRedemptionRequest',
      entityId: id,
      oldValues: { status: redemption.status },
      newValues: { status: 'REJECTED' },
    });
    return updated;
  });
}

async function adjustment(req, input) {
  if (req.user.role !== 'ORG_ADMIN') {
    throw new ForbiddenError('Only org admins can create manual wallet adjustments');
  }
  return runTransactionWithRetry(prisma, async (tx) => {
    const user = await tx.user.findFirst({
      where: { id: input.userId, organizationId: req.user.organizationId, role: { in: ['COLLECTOR', 'PROCESSOR'] }, status: 'ACTIVE' },
    });
    if (!user) throw new NotFoundError('Wallet user not found');
    const transaction = await createTransaction(tx, {
      organizationId: req.user.organizationId,
      userId: input.userId,
      type: 'CREDIT_ADJUSTMENT',
      amount: input.amount,
      description: input.description,
      metadata: input.metadata,
      createdByUserId: req.user.id,
    });
    await createAuditLog(tx, req, {
      organizationId: req.user.organizationId,
      action: AUDIT_ACTIONS.WALLET_ADJUSTED,
      entityType: 'WalletTransaction',
      entityId: transaction.id,
      newValues: transaction,
    });
    return transaction;
  });
}

module.exports = {
  getOrCreateWallet,
  getBalance,
  createTransaction,
  getMyWallet,
  listTransactions,
  createRedemption,
  listRedemptions,
  getRedemption,
  approveRedemption,
  rejectRedemption,
  adjustment,
};
