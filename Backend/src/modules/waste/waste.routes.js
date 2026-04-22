const { Router } = require('express');
const authenticate = require('../../middlewares/authMiddleware');
const validate = require('../../middlewares/validateMiddleware');
const { requireRoles, forbidSuperAdminOrgOps } = require('../../middlewares/roleMiddleware');
const { requireTenant } = require('../../middlewares/tenantScopeMiddleware');
const controller = require('./waste.controller');
const schemas = require('./waste.validators');
const { idParam } = require('../../utils/validators');

const router = Router();

router.use(authenticate, forbidSuperAdminOrgOps, requireTenant);
router.post('/submissions', requireRoles('COLLECTOR'), validate(schemas.createSubmissionSchema), controller.createSubmission);
router.get('/submissions', requireRoles('ORG_ADMIN', 'COLLECTOR', 'PROCESSOR'), validate(schemas.listSchema), controller.listSubmissions);
router.get('/submissions/:id', requireRoles('ORG_ADMIN', 'COLLECTOR', 'PROCESSOR'), validate(idParam), controller.getSubmission);
router.patch('/submissions/:id', requireRoles('COLLECTOR'), validate(schemas.updateSubmissionSchema), controller.updateSubmission);
router.post('/submissions/:id/under-review', requireRoles('ORG_ADMIN'), validate(schemas.transitionNoteSchema), controller.underReview);
router.post('/submissions/:id/approve', requireRoles('ORG_ADMIN'), validate(schemas.transitionNoteSchema), controller.approve);
router.post('/submissions/:id/reject', requireRoles('ORG_ADMIN'), validate(schemas.rejectSchema), controller.reject);
router.post('/submissions/:id/assign', requireRoles('ORG_ADMIN'), validate(schemas.assignSchema), controller.assign);
router.post('/submissions/:id/receive', requireRoles('PROCESSOR'), validate(schemas.transitionNoteSchema), controller.receive);
router.post('/submissions/:id/start-processing', requireRoles('PROCESSOR'), validate(schemas.transitionNoteSchema), controller.startProcessing);
router.post('/submissions/:id/mark-processed', requireRoles('PROCESSOR'), validate(schemas.transitionNoteSchema), controller.markProcessed);
router.get('/submissions/:id/history', requireRoles('ORG_ADMIN', 'COLLECTOR', 'PROCESSOR'), validate(idParam), controller.history);
router.get('/tags', requireRoles('ORG_ADMIN'), controller.listTags);
router.post('/tags', requireRoles('ORG_ADMIN'), validate(schemas.tagSchema), controller.createTag);

module.exports = router;
