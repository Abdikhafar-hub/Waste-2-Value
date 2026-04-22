const { Router } = require('express');
const authenticate = require('../../middlewares/authMiddleware');
const validate = require('../../middlewares/validateMiddleware');
const { requireRoles, forbidSuperAdminOrgOps } = require('../../middlewares/roleMiddleware');
const { requireTenant } = require('../../middlewares/tenantScopeMiddleware');
const controller = require('./esg.controller');
const schemas = require('./esg.validators');

const router = Router();

router.use(authenticate, forbidSuperAdminOrgOps, requireTenant, requireRoles('ORG_ADMIN'));
router.get('/summary', validate(schemas.periodQuery), controller.summary);
router.get('/metrics', validate(schemas.periodQuery), controller.metrics);
router.get('/reports', controller.reports);
router.post('/reports/run', validate(schemas.runReportSchema), controller.runReport);

module.exports = router;
