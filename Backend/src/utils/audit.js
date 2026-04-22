const prisma = require('../db/prisma');

function requestAuditMeta(req) {
  return {
    ipAddress: req.ip,
    userAgent: req.get('user-agent') || null,
  };
}

async function createAuditLog(txOrPrisma, req, payload) {
  const client = txOrPrisma || prisma;
  return client.auditLog.create({
    data: {
      organizationId: payload.organizationId || null,
      actorUserId: payload.actorUserId || req?.user?.id || null,
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId || null,
      oldValues: payload.oldValues || undefined,
      newValues: payload.newValues || undefined,
      metadata: payload.metadata || undefined,
      ...(req ? requestAuditMeta(req) : {}),
    },
  });
}

module.exports = { createAuditLog, requestAuditMeta };
