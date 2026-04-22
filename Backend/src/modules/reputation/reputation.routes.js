const { Router } = require('express');
const authenticate = require('../../middlewares/authMiddleware');
const validate = require('../../middlewares/validateMiddleware');
const { requireRoles, forbidSuperAdminOrgOps } = require('../../middlewares/roleMiddleware');
const { requireTenant } = require('../../middlewares/tenantScopeMiddleware');
const controller = require('./reputation.controller');
const { userIdParam } = require('../../utils/validators');

const router = Router();

router.use(authenticate, forbidSuperAdminOrgOps, requireTenant);
router.get('/me', requireRoles('COLLECTOR', 'PROCESSOR'), controller.me);
router.get('/users/:userId', requireRoles('ORG_ADMIN', 'COLLECTOR', 'PROCESSOR'), validate(userIdParam), controller.getUser);
router.post('/users/:userId/recalculate', requireRoles('ORG_ADMIN'), validate(userIdParam), controller.recalculate);

module.exports = router;
