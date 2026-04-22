const { ForbiddenError } = require('../utils/errors');

function requireTenant(req, _res, next) {
  if (!req.user?.organizationId) {
    return next(new ForbiddenError('Organization-scoped access requires an organization user'));
  }
  req.tenant = { organizationId: req.user.organizationId };
  return next();
}

function assertSameTenant(record, req, message = 'Resource is outside your organization') {
  if (!record || record.organizationId !== req.user.organizationId) {
    throw new ForbiddenError(message);
  }
}

function tenantWhere(req, extra = {}) {
  return {
    ...extra,
    organizationId: req.user.organizationId,
  };
}

module.exports = { requireTenant, assertSameTenant, tenantWhere };
