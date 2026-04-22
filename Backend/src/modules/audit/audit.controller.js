const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const service = require('./audit.service');

const list = asyncHandler(async (req, res) => {
  const { logs, meta } = await service.list(req, req.query);
  return sendSuccess(res, 'Audit logs loaded successfully', logs, meta);
});

module.exports = { list };
