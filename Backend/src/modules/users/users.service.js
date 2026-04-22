const prisma = require('../../db/prisma');
const { AUDIT_ACTIONS, ORG_ROLES } = require('../../config/constants');
const { hashPassword } = require('../../utils/password');
const { createAuditLog } = require('../../utils/audit');
const { BadRequestError, ForbiddenError, NotFoundError, ConflictError } = require('../../utils/errors');
const { getPagination, getSort, buildMeta } = require('../../utils/pagination');
const { toPublicUser } = require('../auth/auth.service');

async function ensureEmailAvailable(email) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new ConflictError('A user with this email already exists');
}

async function provisionRoleResources(tx, user) {
  if (['COLLECTOR', 'PROCESSOR'].includes(user.role)) {
    await tx.wallet.create({ data: { organizationId: user.organizationId, userId: user.id } });
    await tx.reputationProfile.create({
      data: { organizationId: user.organizationId, userId: user.id },
    });
  }
  if (user.role === 'BUYER') {
    await tx.buyerProfile.create({
      data: { organizationId: user.organizationId, userId: user.id },
    });
  }
}

async function createOrgUser(req, organizationId, input, allowedRoles = ['COLLECTOR', 'PROCESSOR', 'BUYER']) {
  if (!allowedRoles.includes(input.role)) throw new ForbiddenError('Role cannot be created in this context');
  if (req.user.role === 'ORG_ADMIN' && req.user.organizationId !== organizationId) {
    throw new ForbiddenError('Org admin cannot create users in another organization');
  }
  if (input.role === 'ORG_ADMIN' && req.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Only super admin can create organization admins');
  }
  await ensureEmailAvailable(input.email);
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        organizationId,
        email: input.email,
        passwordHash: await hashPassword(input.password),
        role: input.role,
        isEmailVerified: true,
        profile: { create: input.profile },
      },
      include: { profile: true },
    });
    await provisionRoleResources(tx, user);
    if (input.role === 'BUYER' && input.buyerProfile) {
      await tx.buyerProfile.update({
        where: { userId: user.id },
        data: input.buyerProfile,
      });
    }
    await createAuditLog(tx, req, {
      organizationId,
      action: input.role === 'ORG_ADMIN' ? AUDIT_ACTIONS.ORG_ADMIN_CREATED : AUDIT_ACTIONS.USER_CREATED,
      entityType: 'User',
      entityId: user.id,
      newValues: { email: user.email, role: user.role },
    });
    return toPublicUser(user);
  });
}

async function listUsers(req, query) {
  const { page, limit, skip, take } = getPagination(query);
  const where = {
    organizationId: req.user.organizationId,
    ...(query.role ? { role: query.role } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.search ? {
      OR: [
        { email: { contains: query.search, mode: 'insensitive' } },
        { profile: { firstName: { contains: query.search, mode: 'insensitive' } } },
        { profile: { lastName: { contains: query.search, mode: 'insensitive' } } },
      ],
    } : {}),
  };
  const orderBy = getSort(query, ['createdAt', 'email', 'role', 'status'], 'createdAt');
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, include: { profile: true }, skip, take, orderBy }),
  ]);
  return { users: users.map(toPublicUser), meta: buildMeta(page, limit, total) };
}

async function getUser(req, id) {
  const user = await prisma.user.findFirst({
    where: { id, organizationId: req.user.organizationId },
    include: { profile: true, buyerProfile: true, wallet: true, reputationProfile: true },
  });
  if (!user) throw new NotFoundError('User not found');
  if (req.user.role !== 'ORG_ADMIN' && req.user.id !== id) {
    throw new ForbiddenError('You can only view your own user details');
  }
  return { ...toPublicUser(user), buyerProfile: user.buyerProfile, wallet: user.wallet, reputationProfile: user.reputationProfile };
}

async function updateUser(req, id, input) {
  const target = await prisma.user.findFirst({ where: { id, organizationId: req.user.organizationId }, include: { profile: true } });
  if (!target) throw new NotFoundError('User not found');
  if (!ORG_ROLES.includes(target.role) || target.role === 'ORG_ADMIN') {
    throw new BadRequestError('Only collector, processor, and buyer users can be updated here');
  }
  const updated = await prisma.$transaction(async (tx) => {
    if (input.profile) {
      await tx.userProfile.upsert({
        where: { userId: id },
        update: input.profile,
        create: { userId: id, firstName: input.profile.firstName || target.profile?.firstName || '', lastName: input.profile.lastName || target.profile?.lastName || '' },
      });
    }
    if (input.buyerProfile && target.role === 'BUYER') {
      await tx.buyerProfile.upsert({
        where: { userId: id },
        update: input.buyerProfile,
        create: { organizationId: req.user.organizationId, userId: id, ...input.buyerProfile },
      });
    }
    await createAuditLog(tx, req, {
      organizationId: req.user.organizationId,
      action: AUDIT_ACTIONS.USER_UPDATED,
      entityType: 'User',
      entityId: id,
      oldValues: { profile: target.profile },
      newValues: input,
    });
    return tx.user.findUnique({ where: { id }, include: { profile: true, buyerProfile: true } });
  });
  return { ...toPublicUser(updated), buyerProfile: updated.buyerProfile };
}

async function updateStatus(req, id, status) {
  if (id === req.user.id && status !== 'ACTIVE') throw new BadRequestError('You cannot suspend your own account');
  const target = await prisma.user.findFirst({ where: { id, organizationId: req.user.organizationId } });
  if (!target) throw new NotFoundError('User not found');
  if (target.role === 'ORG_ADMIN') throw new ForbiddenError('Org admins cannot suspend other org admins here');
  const updated = await prisma.$transaction(async (tx) => {
    const user = await tx.user.update({ where: { id }, data: { status }, include: { profile: true } });
    await createAuditLog(tx, req, {
      organizationId: req.user.organizationId,
      action: AUDIT_ACTIONS.USER_STATUS_CHANGED,
      entityType: 'User',
      entityId: id,
      oldValues: { status: target.status },
      newValues: { status },
    });
    return user;
  });
  return toPublicUser(updated);
}

module.exports = {
  createOrgUser,
  listUsers,
  getUser,
  updateUser,
  updateStatus,
  ensureEmailAvailable,
  provisionRoleResources,
};
