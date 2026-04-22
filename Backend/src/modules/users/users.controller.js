const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const service = require('./users.service');

const listUsers = asyncHandler(async (req, res) => {
  const { users, meta } = await service.listUsers(req, req.query);
  return sendSuccess(res, 'Users loaded successfully', users, meta);
});

const getUser = asyncHandler(async (req, res) => {
  const data = await service.getUser(req, req.params.id);
  return sendSuccess(res, 'User loaded successfully', data);
});

const createUser = asyncHandler(async (req, res) => {
  const data = await service.createOrgUser(req, req.user.organizationId, req.body);
  return sendSuccess(res, 'User created successfully', data, undefined, 201);
});

const updateUser = asyncHandler(async (req, res) => {
  const data = await service.updateUser(req, req.params.id, req.body);
  return sendSuccess(res, 'User updated successfully', data);
});

const updateStatus = asyncHandler(async (req, res) => {
  const data = await service.updateStatus(req, req.params.id, req.body.status);
  return sendSuccess(res, 'User status updated successfully', data);
});

module.exports = {
  listUsers,
  getUser,
  createUser,
  updateUser,
  updateStatus,
};
