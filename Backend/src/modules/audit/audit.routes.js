const { Router } = require('express');
const authenticate = require('../../middlewares/authMiddleware');
const { requireRoles, forbidSuperAdminOrgOps } = require('../../middlewares/roleMiddleware');
const { requireTenant } = require('../../middlewares/tenantScopeMiddleware');
const controller = require('./audit.controller');

const router = Router();

router.use(authenticate, forbidSuperAdminOrgOps, requireTenant, requireRoles('ORG_ADMIN'));
router.get('/logs', controller.list);

module.exports = router;
