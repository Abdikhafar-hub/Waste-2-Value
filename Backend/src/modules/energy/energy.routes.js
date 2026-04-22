const { Router } = require('express');
const authenticate = require('../../middlewares/authMiddleware');
const validate = require('../../middlewares/validateMiddleware');
const { requireRoles, forbidSuperAdminOrgOps } = require('../../middlewares/roleMiddleware');
const { requireTenant } = require('../../middlewares/tenantScopeMiddleware');
const controller = require('./energy.controller');
const schemas = require('./energy.validators');

const router = Router();

router.use(authenticate, forbidSuperAdminOrgOps, requireTenant, requireRoles('ORG_ADMIN'));
router.get('/units', validate(schemas.listSchema), controller.listUnits);
router.post('/units', validate(schemas.unitSchema), controller.createUnit);
router.get('/production', validate(schemas.listSchema), controller.listProduction);
router.post('/production', validate(schemas.productionSchema), controller.createProduction);
router.get('/consumers', validate(schemas.listSchema), controller.listConsumers);
router.post('/consumers', validate(schemas.consumerSchema), controller.createConsumer);
router.get('/usage', validate(schemas.listSchema), controller.listUsage);
router.post('/usage', validate(schemas.usageSchema), controller.createUsage);
router.get('/payments', validate(schemas.listSchema), controller.listPayments);
router.post('/payments', validate(schemas.paymentSchema), controller.createPayment);

module.exports = router;
