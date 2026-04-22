const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const service = require('./reputation.service');

const me = asyncHandler(async (req, res) => sendSuccess(res, 'Reputation loaded successfully', await service.me(req)));
const getUser = asyncHandler(async (req, res) => sendSuccess(res, 'User reputation loaded successfully', await service.getUserReputation(req, req.params.userId)));
const recalculate = asyncHandler(async (req, res) => sendSuccess(res, 'Reputation recalculated successfully', await service.recalculate(req, req.params.userId)));

module.exports = { me, getUser, recalculate };
