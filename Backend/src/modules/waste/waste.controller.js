const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const service = require('./waste.service');

const createSubmission = asyncHandler(async (req, res) => sendSuccess(res, 'Waste submission created successfully', await service.createSubmission(req, req.body), undefined, 201));
const listSubmissions = asyncHandler(async (req, res) => {
  const { submissions, meta } = await service.listSubmissions(req, req.query);
  return sendSuccess(res, 'Waste submissions loaded successfully', submissions, meta);
});
const getSubmission = asyncHandler(async (req, res) => sendSuccess(res, 'Waste submission loaded successfully', await service.getSubmissionForRole(req, req.params.id)));
const updateSubmission = asyncHandler(async (req, res) => sendSuccess(res, 'Waste submission updated successfully', await service.updateSubmission(req, req.params.id, req.body)));
const underReview = asyncHandler(async (req, res) => sendSuccess(res, 'Waste submission moved under review', await service.transition(req, req.params.id, 'UNDER_REVIEW', req.body.note)));
const approve = asyncHandler(async (req, res) => sendSuccess(res, 'Waste submission approved successfully', await service.transition(req, req.params.id, 'APPROVED', req.body.note)));
const reject = asyncHandler(async (req, res) => sendSuccess(res, 'Waste submission rejected successfully', await service.transition(req, req.params.id, 'REJECTED', req.body.note)));
const assign = asyncHandler(async (req, res) => sendSuccess(res, 'Waste submission assigned successfully', await service.assign(req, req.params.id, req.body)));
const receive = asyncHandler(async (req, res) => sendSuccess(res, 'Waste submission received successfully', await service.transition(req, req.params.id, 'RECEIVED', req.body.note)));
const startProcessing = asyncHandler(async (req, res) => sendSuccess(res, 'Waste submission moved to processing', await service.transition(req, req.params.id, 'PROCESSING', req.body.note)));
const markProcessed = asyncHandler(async (req, res) => sendSuccess(res, 'Waste submission marked processed', await service.transition(req, req.params.id, 'PROCESSED', req.body.note)));
const history = asyncHandler(async (req, res) => sendSuccess(res, 'Waste submission history loaded successfully', await service.history(req, req.params.id)));
const listTags = asyncHandler(async (req, res) => sendSuccess(res, 'Waste tags loaded successfully', await service.listTags(req)));
const createTag = asyncHandler(async (req, res) => sendSuccess(res, 'Waste tag created successfully', await service.createTag(req, req.body), undefined, 201));

module.exports = {
  createSubmission,
  listSubmissions,
  getSubmission,
  updateSubmission,
  underReview,
  approve,
  reject,
  assign,
  receive,
  startProcessing,
  markProcessed,
  history,
  listTags,
  createTag,
};
