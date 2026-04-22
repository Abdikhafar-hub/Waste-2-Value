const { Router } = require('express');
const authenticate = require('../../middlewares/authMiddleware');
const validate = require('../../middlewares/validateMiddleware');
const { requireRoles } = require('../../middlewares/roleMiddleware');
const controller = require('./platform.controller');
const schemas = require('./platform.validators');
const { idParam } = require('../../utils/validators');

const router = Router();

router.use(authenticate, requireRoles('SUPER_ADMIN'));
router.post('/organizations', validate(schemas.createOrganizationSchema), controller.createOrganization);
router.get('/organizations', validate(schemas.listSchema), controller.listOrganizations);
router.get('/organizations/:id', validate(idParam), controller.getOrganization);
router.patch('/organizations/:id/status', validate(schemas.updateOrganizationStatusSchema), controller.updateOrganizationStatus);
router.post('/organizations/:id/org-admin', validate(schemas.createOrgAdminSchema), controller.createOrgAdmin);
router.get('/users', validate(schemas.listUsersSchema), controller.listUsers);
router.get('/users/:id', validate(idParam), controller.getUser);
router.patch('/users/:id/status', validate(schemas.updateUserStatusSchema), controller.updateUserStatus);
router.get('/analytics/summary', controller.summary);
router.get('/audit', controller.audit);

module.exports = router;
