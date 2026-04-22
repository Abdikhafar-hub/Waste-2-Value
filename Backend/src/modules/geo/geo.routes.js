const { Router } = require('express');
const authenticate = require('../../middlewares/authMiddleware');
const validate = require('../../middlewares/validateMiddleware');
const { requireRoles, forbidSuperAdminOrgOps } = require('../../middlewares/roleMiddleware');
const { requireTenant } = require('../../middlewares/tenantScopeMiddleware');
const controller = require('./geo.controller');
const schemas = require('./geo.validators');

const router = Router();

router.use(authenticate, forbidSuperAdminOrgOps, requireTenant);
router.get('/zones', requireRoles('ORG_ADMIN', 'COLLECTOR', 'PROCESSOR'), validate(schemas.listSchema), controller.listZones);
router.post('/zones', requireRoles('ORG_ADMIN'), validate(schemas.createZoneSchema), controller.createZone);
router.patch('/zones/:id', requireRoles('ORG_ADMIN'), validate(schemas.updateZoneSchema), controller.updateZone);
router.get('/collection-points', requireRoles('ORG_ADMIN', 'COLLECTOR', 'PROCESSOR'), validate(schemas.listSchema), controller.listCollectionPoints);
router.post('/collection-points', requireRoles('ORG_ADMIN'), validate(schemas.createCollectionPointSchema), controller.createCollectionPoint);
router.patch('/collection-points/:id', requireRoles('ORG_ADMIN'), validate(schemas.updateCollectionPointSchema), controller.updateCollectionPoint);
router.get('/processing-centers', requireRoles('ORG_ADMIN', 'PROCESSOR'), validate(schemas.listSchema), controller.listProcessingCenters);
router.post('/processing-centers', requireRoles('ORG_ADMIN'), validate(schemas.createProcessingCenterSchema), controller.createProcessingCenter);
router.patch('/processing-centers/:id', requireRoles('ORG_ADMIN'), validate(schemas.updateProcessingCenterSchema), controller.updateProcessingCenter);
router.get('/hotspots', requireRoles('ORG_ADMIN', 'COLLECTOR', 'PROCESSOR'), controller.hotspots);

module.exports = router;
