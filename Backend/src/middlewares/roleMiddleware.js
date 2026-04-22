const { ForbiddenError } = require('../utils/errors');

function requireRoles(...roles) {
  return (req, _res, next) => {
    if (!req.user) return next(new ForbiddenError('Authentication context missing'));
    if (!roles.includes(req.user.role)) {
      return next(new ForbiddenError('Insufficient role permissions'));
    }
    return next();
  };
}

function forbidSuperAdminOrgOps(req, _res, next) {
  if (req.user?.role === 'SUPER_ADMIN') {
    return next(new ForbiddenError('Super admin is platform-only and cannot perform organization operations'));
  }
  return next();
}

module.exports = { requireRoles, forbidSuperAdminOrgOps };
