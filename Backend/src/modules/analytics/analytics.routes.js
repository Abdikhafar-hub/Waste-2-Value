const { Router } = require('express');
const authenticate = require('../../middlewares/authMiddleware');
const { requireRoles, forbidSuperAdminOrgOps } = require('../../middlewares/roleMiddleware');
const { requireTenant } = require('../../middlewares/tenantScopeMiddleware');
const controller = require('./analytics.controller');

const router = Router();

router.use(authenticate, forbidSuperAdminOrgOps, requireTenant, requireRoles('ORG_ADMIN'));
router.get('/dashboard', controller.dashboard);
router.get('/waste-by-zone', controller.wasteByZone);
router.get('/collector-performance', controller.collectorPerformance);
router.get('/processor-performance', controller.processorPerformance);
router.get('/revenue', controller.revenue);
router.get('/market-summary', controller.marketSummary);

module.exports = router;
