const { Router } = require('express');
const authenticate = require('../../middlewares/authMiddleware');
const validate = require('../../middlewares/validateMiddleware');
const { requireRoles, forbidSuperAdminOrgOps } = require('../../middlewares/roleMiddleware');
const { requireTenant } = require('../../middlewares/tenantScopeMiddleware');
const controller = require('./ai.controller');
const schemas = require('./ai.validators');

const router = Router();

router.use(authenticate, forbidSuperAdminOrgOps, requireTenant, requireRoles('ORG_ADMIN'));
router.get('/insights', validate(schemas.listSchema), controller.list);
router.post('/insights', validate(schemas.createInsightSchema), controller.create);
router.get('/insights/:id', validate(schemas.idParam), controller.get);

module.exports = router;
