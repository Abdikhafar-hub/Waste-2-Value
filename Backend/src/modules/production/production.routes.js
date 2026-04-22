const { Router } = require('express');
const authenticate = require('../../middlewares/authMiddleware');
const validate = require('../../middlewares/validateMiddleware');
const { requireRoles, forbidSuperAdminOrgOps } = require('../../middlewares/roleMiddleware');
const { requireTenant } = require('../../middlewares/tenantScopeMiddleware');
const controller = require('./production.controller');
const schemas = require('./production.validators');
const { idParam } = require('../../utils/validators');

const router = Router();

router.use(authenticate, forbidSuperAdminOrgOps, requireTenant);
router.post('/batches', requireRoles('PROCESSOR'), validate(schemas.createBatchSchema), controller.createBatch);
router.get('/batches', requireRoles('ORG_ADMIN', 'PROCESSOR'), validate(schemas.listSchema), controller.listBatches);
router.get('/batches/:id', requireRoles('ORG_ADMIN', 'PROCESSOR'), validate(idParam), controller.getBatch);
router.patch('/batches/:id', requireRoles('ORG_ADMIN', 'PROCESSOR'), validate(schemas.updateBatchSchema), controller.updateBatch);
router.post('/batches/:id/complete', requireRoles('PROCESSOR'), validate(schemas.completeBatchSchema), controller.completeBatch);
router.get('/metrics', requireRoles('ORG_ADMIN', 'PROCESSOR'), controller.metrics);

module.exports = router;
