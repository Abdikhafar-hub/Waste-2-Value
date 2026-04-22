const { Router } = require('express');
const authenticate = require('../../middlewares/authMiddleware');
const validate = require('../../middlewares/validateMiddleware');
const { requireRoles, forbidSuperAdminOrgOps } = require('../../middlewares/roleMiddleware');
const { requireTenant } = require('../../middlewares/tenantScopeMiddleware');
const controller = require('./orders.controller');
const schemas = require('./orders.validators');
const { idParam } = require('../../utils/validators');

const router = Router();

router.use(authenticate, forbidSuperAdminOrgOps, requireTenant);
router.post('/', requireRoles('BUYER'), validate(schemas.createOrderSchema), controller.createOrder);
router.get('/', requireRoles('ORG_ADMIN', 'BUYER'), validate(schemas.listSchema), controller.listOrders);
router.get('/:id', requireRoles('ORG_ADMIN', 'BUYER'), validate(idParam), controller.getOrder);
router.patch('/:id/status', requireRoles('ORG_ADMIN'), validate(schemas.orderStatusSchema), controller.updateStatus);
router.patch('/:id/payment-status', requireRoles('ORG_ADMIN'), validate(schemas.paymentStatusSchema), controller.updatePaymentStatus);
router.patch('/:id/delivery-status', requireRoles('ORG_ADMIN'), validate(schemas.deliveryStatusSchema), controller.updateDeliveryStatus);

module.exports = router;
