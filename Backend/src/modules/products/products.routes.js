const { Router } = require('express');
const authenticate = require('../../middlewares/authMiddleware');
const validate = require('../../middlewares/validateMiddleware');
const { requireRoles, forbidSuperAdminOrgOps } = require('../../middlewares/roleMiddleware');
const { requireTenant } = require('../../middlewares/tenantScopeMiddleware');
const controller = require('./products.controller');
const schemas = require('./products.validators');
const { idParam } = require('../../utils/validators');

const router = Router();

router.use(authenticate, forbidSuperAdminOrgOps, requireTenant);
router.get('/', requireRoles('ORG_ADMIN', 'BUYER'), validate(schemas.listSchema), controller.listProducts);
router.get('/:id', requireRoles('ORG_ADMIN', 'BUYER'), validate(idParam), controller.getProduct);
router.post('/', requireRoles('ORG_ADMIN'), validate(schemas.createProductSchema), controller.createProduct);
router.patch('/:id', requireRoles('ORG_ADMIN'), validate(schemas.updateProductSchema), controller.updateProduct);
router.patch('/:id/status', requireRoles('ORG_ADMIN'), validate(schemas.updateStatusSchema), controller.updateStatus);

module.exports = router;
