const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const prisma = require('../../db/prisma');
const env = require('../../config/env');
const { AUDIT_ACTIONS } = require('../../config/constants');
const { hashPassword, verifyPassword } = require('../../utils/password');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../../utils/jwt');
const { createAuditLog } = require('../../utils/audit');
const { addDays } = require('../../utils/date');
const { UnauthorizedError, ForbiddenError, BadRequestError } = require('../../utils/errors');

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function toPublicUser(user) {
  return {
    id: user.id,
    organizationId: user.organizationId,
    email: user.email,
    role: user.role,
    status: user.status,
    isEmailVerified: user.isEmailVerified,
    lastLoginAt: user.lastLoginAt,
    profile: user.profile || null,
    createdAt: user.createdAt,
  };
}

async function issueTokens(user, tx = prisma) {
  const tokenId = uuidv4();
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user, tokenId);
  const refreshPayload = verifyRefreshToken(refreshToken);
  await tx.refreshToken.create({
    data: {
      id: tokenId,
      userId: user.id,
      tokenHash: sha256(refreshToken),
      expiresAt: refreshPayload.exp ? new Date(refreshPayload.exp * 1000) : addDays(new Date(), 7),
    },
  });
  return { accessToken, refreshToken };
}

async function login(req, credentials) {
  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
    include: { profile: true, organization: true },
  });
  if (!user || !(await verifyPassword(credentials.password, user.passwordHash))) {
    throw new UnauthorizedError('Invalid email or password');
  }
  if (user.status !== 'ACTIVE') throw new ForbiddenError('Account is not active');
  if (user.organizationId && user.organization?.status !== 'ACTIVE') {
    throw new ForbiddenError('Organization is not active');
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      include: { profile: true },
    });
    const tokens = await issueTokens(updated, tx);
    await createAuditLog(tx, req, {
      organizationId: updated.organizationId,
      actorUserId: updated.id,
      action: AUDIT_ACTIONS.LOGIN,
      entityType: 'User',
      entityId: updated.id,
    });
    return { user: updated, tokens };
  });

  return { user: toPublicUser(result.user), ...result.tokens };
}

async function refresh(refreshToken) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (_error) {
    throw new UnauthorizedError('Invalid or expired refresh token');
  }
  const tokenHash = sha256(refreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { id: payload.tokenId } });
  if (!stored || stored.userId !== payload.sub || stored.tokenHash !== tokenHash || stored.revokedAt || stored.expiresAt < new Date()) {
    throw new UnauthorizedError('Refresh token has been revoked or expired');
  }
  const user = await prisma.user.findUnique({
    where: { id: payload.sub },
    include: { profile: true, organization: true },
  });
  if (!user || user.status !== 'ACTIVE') throw new ForbiddenError('Account is not active');
  if (user.organizationId && user.organization?.status !== 'ACTIVE') {
    throw new ForbiddenError('Organization is not active');
  }

  return prisma.$transaction(async (tx) => {
    await tx.refreshToken.update({ where: { id: stored.id }, data: { revokedAt: new Date() } });
    const tokens = await issueTokens(user, tx);
    return { user: toPublicUser(user), ...tokens };
  });
}

async function logout(req, refreshToken) {
  if (refreshToken) {
    const tokenHash = sha256(refreshToken);
    await prisma.refreshToken.updateMany({
      where: { tokenHash, userId: req.user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  } else {
    await prisma.refreshToken.updateMany({
      where: { userId: req.user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
  await createAuditLog(prisma, req, {
    organizationId: req.user?.organizationId || null,
    actorUserId: req.user?.id || null,
    action: AUDIT_ACTIONS.LOGOUT,
    entityType: 'User',
    entityId: req.user?.id || null,
  });
}

async function me(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { profile: true } });
  if (!user) throw new UnauthorizedError();
  return toPublicUser(user);
}

async function changePassword(userId, input) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !(await verifyPassword(input.currentPassword, user.passwordHash))) {
    throw new BadRequestError('Current password is incorrect');
  }
  if (input.currentPassword === input.newPassword) {
    throw new BadRequestError('New password must be different from current password');
  }
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(input.newPassword) },
    });
    await tx.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  });
}

async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { issued: true };
  const plainToken = crypto.randomBytes(32).toString('hex');
  await prisma.$transaction(async (tx) => {
    await tx.passwordResetToken.updateMany({
      where: { userId: user.id, usedAt: null, expiresAt: { gt: new Date() } },
      data: { usedAt: new Date() },
    });
    await tx.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash: sha256(plainToken),
        expiresAt: addDays(new Date(), 1),
      },
    });
  });
  return {
    issued: true,
    resetToken: env.NODE_ENV === 'production' ? undefined : plainToken,
  };
}

async function resetPassword(token, newPassword) {
  const tokenHash = sha256(token);
  const record = await prisma.passwordResetToken.findFirst({
    where: { tokenHash, usedAt: null, expiresAt: { gt: new Date() } },
  });
  if (!record) throw new BadRequestError('Invalid or expired reset token');
  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: record.userId },
      data: { passwordHash: await hashPassword(newPassword) },
    });
    await tx.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } });
    await tx.passwordResetToken.updateMany({
      where: { userId: record.userId, usedAt: null },
      data: { usedAt: new Date() },
    });
    await tx.refreshToken.updateMany({
      where: { userId: record.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  });
}

module.exports = {
  login,
  refresh,
  logout,
  me,
  changePassword,
  forgotPassword,
  resetPassword,
  issueTokens,
  toPublicUser,
};
