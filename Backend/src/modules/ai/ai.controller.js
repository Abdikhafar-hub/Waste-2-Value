const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const service = require('./ai.service');

const list = asyncHandler(async (req, res) => {
  const { insights, meta } = await service.list(req, req.query);
  return sendSuccess(res, 'AI insights loaded successfully', insights, meta);
});
const create = asyncHandler(async (req, res) => sendSuccess(res, 'AI insight created successfully', await service.create(req, req.body), undefined, 201));
const get = asyncHandler(async (req, res) => sendSuccess(res, 'AI insight loaded successfully', await service.get(req, req.params.id)));

module.exports = { list, create, get };
