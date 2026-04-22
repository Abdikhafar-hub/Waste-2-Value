const prisma = require('../../db/prisma');
const { getPagination, buildMeta } = require('../../utils/pagination');

async function list(req, query) {
  const { page, limit, skip, take } = getPagination(query);
  const where = {
    organizationId: req.user.organizationId,
    ...(query.entityType ? { entityType: query.entityType } : {}),
    ...(query.action ? { action: query.action } : {}),
  };
  const [total, logs] = await Promise.all([
    prisma.auditLog.count({ where }),
    prisma.auditLog.findMany({ where, skip, take, orderBy: { createdAt: 'desc' } }),
  ]);
  return { logs, meta: buildMeta(page, limit, total) };
}

module.exports = { list };
