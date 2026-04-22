const { Router } = require('express');
const authenticate = require('../../middlewares/authMiddleware');
const validate = require('../../middlewares/validateMiddleware');
const { requireRoles, forbidSuperAdminOrgOps } = require('../../middlewares/roleMiddleware');
const { requireTenant } = require('../../middlewares/tenantScopeMiddleware');
const controller = require('./wallet.controller');
const schemas = require('./wallet.validators');
const { idParam } = require('../../utils/validators');

const router = Router();

router.use(authenticate, forbidSuperAdminOrgOps, requireTenant);
router.get('/me', requireRoles('COLLECTOR', 'PROCESSOR'), controller.getMyWallet);
router.get('/transactions', requireRoles('ORG_ADMIN', 'COLLECTOR', 'PROCESSOR'), validate(schemas.listTransactionsSchema), controller.listTransactions);
router.post('/redemptions', requireRoles('COLLECTOR', 'PROCESSOR'), validate(schemas.redemptionSchema), controller.createRedemption);
router.get('/redemptions', requireRoles('ORG_ADMIN', 'COLLECTOR', 'PROCESSOR'), validate(schemas.listRedemptionsSchema), controller.listRedemptions);
router.get('/redemptions/:id', requireRoles('ORG_ADMIN', 'COLLECTOR', 'PROCESSOR'), validate(idParam), controller.getRedemption);
router.post('/redemptions/:id/approve', requireRoles('ORG_ADMIN'), validate(schemas.reviewRedemptionSchema), controller.approveRedemption);
router.post('/redemptions/:id/reject', requireRoles('ORG_ADMIN'), validate(schemas.reviewRedemptionSchema), controller.rejectRedemption);
router.post('/adjustments', requireRoles('ORG_ADMIN'), validate(schemas.adjustmentSchema), controller.adjustment);

module.exports = router;
