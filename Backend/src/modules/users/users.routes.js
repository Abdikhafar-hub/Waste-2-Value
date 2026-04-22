const { Router } = require('express');
const authenticate = require('../../middlewares/authMiddleware');
const validate = require('../../middlewares/validateMiddleware');
const { requireRoles, forbidSuperAdminOrgOps } = require('../../middlewares/roleMiddleware');
const { requireTenant } = require('../../middlewares/tenantScopeMiddleware');
const controller = require('./users.controller');
const schemas = require('./users.validators');
const { idParam } = require('../../utils/validators');

const router = Router();

router.use(authenticate, forbidSuperAdminOrgOps, requireTenant);
router.get('/', requireRoles('ORG_ADMIN'), validate(schemas.listUsersSchema), controller.listUsers);
router.post('/', requireRoles('ORG_ADMIN'), validate(schemas.createUserSchema), controller.createUser);
router.get('/:id', validate(idParam), controller.getUser);
router.patch('/:id', requireRoles('ORG_ADMIN'), validate(schemas.updateUserSchema), controller.updateUser);
router.patch('/:id/status', requireRoles('ORG_ADMIN'), validate(schemas.updateStatusSchema), controller.updateStatus);

module.exports = router;
