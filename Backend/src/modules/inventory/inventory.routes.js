const { Router } = require('express');
const authenticate = require('../../middlewares/authMiddleware');
const validate = require('../../middlewares/validateMiddleware');
const { requireRoles, forbidSuperAdminOrgOps } = require('../../middlewares/roleMiddleware');
const { requireTenant } = require('../../middlewares/tenantScopeMiddleware');
const controller = require('./inventory.controller');
const schemas = require('./inventory.validators');

const router = Router();

router.use(authenticate, forbidSuperAdminOrgOps, requireTenant, requireRoles('ORG_ADMIN'));
router.get('/', validate(schemas.listSchema), controller.inventory);
router.get('/lots', validate(schemas.listSchema), controller.lots);
router.get('/movements', validate(schemas.listSchema), controller.movements);
router.post('/adjustments', validate(schemas.adjustmentSchema), controller.adjustment);

module.exports = router;
