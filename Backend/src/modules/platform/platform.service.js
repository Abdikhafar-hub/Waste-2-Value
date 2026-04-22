const prisma = require('../../db/prisma');
const { AUDIT_ACTIONS } = require('../../config/constants');
const { createAuditLog } = require('../../utils/audit');
const { NotFoundError, ConflictError, BadRequestError, ForbiddenError } = require('../../utils/errors');
const { getPagination, getSort, buildMeta } = require('../../utils/pagination');
const { toPublicUser } = require('../auth/auth.service');
const usersService = require('../users/users.service');

async function createOrganization(req, input) {
  const existing = await prisma.organization.findUnique({ where: { slug: input.slug } });
  if (existing) throw new ConflictError('Organization slug is already in use');
  return prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name: input.name,
        slug: input.slug,
        description: input.description,
        createdByUserId: req.user.id,
      },
    });
    await createAuditLog(tx, req, {
      action: AUDIT_ACTIONS.ORGANIZATION_CREATED,
      entityType: 'Organization',
      entityId: organization.id,
      newValues: organization,
    });
    return organization;
  });
}

async function listOrganizations(query) {
  const { page, limit, skip, take } = getPagination(query);
  const where = {
    ...(query.status ? { status: query.status } : {}),
    ...(query.search ? {
      OR: [
        { name: { contains: query.search, mode: 'insensitive' } },
        { slug: { contains: query.search, mode: 'insensitive' } },
      ],
    } : {}),
  };
  const orderBy = getSort(query, ['createdAt', 'name', 'slug', 'status'], 'createdAt');
  const [total, organizations] = await Promise.all([
    prisma.organization.count({ where }),
    prisma.organization.findMany({ where, skip, take, orderBy }),
  ]);
  return { organizations, meta: buildMeta(page, limit, total) };
}

async function getOrganization(id) {
  const organization = await prisma.organization.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          users: true,
        },
      },
    },
  });
  if (!organization) throw new NotFoundError('Organization not found');
  return organization;
}

async function updateOrganizationStatus(req, id, status) {
  const organization = await prisma.organization.findUnique({ where: { id } });
  if (!organization) throw new NotFoundError('Organization not found');
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.organization.update({ where: { id }, data: { status } });
    await createAuditLog(tx, req, {
      action: AUDIT_ACTIONS.ORGANIZATION_STATUS_CHANGED,
      entityType: 'Organization',
      entityId: id,
      oldValues: { status: organization.status },
      newValues: { status },
    });
    return result;
  });
  return updated;
}

async function createInitialOrgAdmin(req, organizationId, input) {
  const organization = await prisma.organization.findUnique({ where: { id: organizationId } });
  if (!organization) throw new NotFoundError('Organization not found');
  if (organization.status !== 'ACTIVE') throw new BadRequestError('Cannot create admin for an inactive organization');
  const existingAdmin = await prisma.user.findFirst({
    where: { organizationId, role: 'ORG_ADMIN', status: 'ACTIVE' },
  });
  if (existingAdmin) throw new ConflictError('This organization already has an active org admin');
  return usersService.createOrgUser(req, organizationId, {
    email: input.email,
    password: input.password,
    role: 'ORG_ADMIN',
    profile: input.profile,
  }, ['ORG_ADMIN']);
}

async function listPlatformUsers(query) {
  const { page, limit, skip, take } = getPagination(query);
  const where = {
    ...(query.role ? { role: query.role } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.organizationId ? { organizationId: query.organizationId } : {}),
    ...(query.search ? { email: { contains: query.search, mode: 'insensitive' } } : {}),
  };
  const orderBy = getSort(query, ['createdAt', 'email', 'role', 'status'], 'createdAt');
  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({ where, include: { profile: true, organization: true }, skip, take, orderBy }),
  ]);
  return { users: users.map((user) => ({ ...toPublicUser(user), organization: user.organization })), meta: buildMeta(page, limit, total) };
}

async function getPlatformUser(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { profile: true, organization: true, wallet: true, reputationProfile: true, buyerProfile: true },
  });
  if (!user) throw new NotFoundError('User not found');
  return { ...toPublicUser(user), organization: user.organization, wallet: user.wallet, reputationProfile: user.reputationProfile, buyerProfile: user.buyerProfile };
}

async function updateUserStatus(req, id, status) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) throw new NotFoundError('User not found');
  if (user.id === req.user.id && status !== 'ACTIVE') throw new ForbiddenError('Super admin cannot suspend self');
  if (user.role === 'SUPER_ADMIN' && user.id !== req.user.id) {
    throw new ForbiddenError('Super admin accounts cannot be suspended by another account');
  }
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.user.update({ where: { id }, data: { status }, include: { profile: true } });
    await createAuditLog(tx, req, {
      organizationId: user.organizationId,
      action: AUDIT_ACTIONS.USER_STATUS_CHANGED,
      entityType: 'User',
      entityId: id,
      oldValues: { status: user.status },
      newValues: { status },
    });
    return result;
  });
  return toPublicUser(updated);
}

async function platformSummary() {
  const [organizations, users, waste, revenue] = await Promise.all([
    prisma.organization.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.user.groupBy({ by: ['role'], _count: { _all: true } }),
    prisma.wasteSubmission.aggregate({ _sum: { weightKg: true }, _count: { _all: true } }),
    prisma.order.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { totalAmount: true }, _count: { _all: true } }),
  ]);
  return { organizations, users, waste, revenue };
}

async function platformAudit(query) {
  const { page, limit, skip, take } = getPagination(query);
  const where = query.organizationId ? { organizationId: query.organizationId } : {};
  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ where, orderBy: { createdAt: 'desc' }, skip, take }),
  ]);
  return { logs, meta: buildMeta(page, limit, total) };
}

module.exports = {
  createOrganization,
  listOrganizations,
  getOrganization,
  updateOrganizationStatus,
  createInitialOrgAdmin,
  listPlatformUsers,
  getPlatformUser,
  updateUserStatus,
  platformSummary,
  platformAudit,
};
