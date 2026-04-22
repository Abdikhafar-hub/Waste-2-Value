const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const service = require('./platform.service');

const createOrganization = asyncHandler(async (req, res) => {
  const data = await service.createOrganization(req, req.body);
  return sendSuccess(res, 'Organization created successfully', data, undefined, 201);
});

const listOrganizations = asyncHandler(async (req, res) => {
  const { organizations, meta } = await service.listOrganizations(req.query);
  return sendSuccess(res, 'Organizations loaded successfully', organizations, meta);
});

const getOrganization = asyncHandler(async (req, res) => {
  const data = await service.getOrganization(req.params.id);
  return sendSuccess(res, 'Organization loaded successfully', data);
});

const updateOrganizationStatus = asyncHandler(async (req, res) => {
  const data = await service.updateOrganizationStatus(req, req.params.id, req.body.status);
  return sendSuccess(res, 'Organization status updated successfully', data);
});

const createOrgAdmin = asyncHandler(async (req, res) => {
  const data = await service.createInitialOrgAdmin(req, req.params.id, req.body);
  return sendSuccess(res, 'Organization admin created successfully', data, undefined, 201);
});

const listUsers = asyncHandler(async (req, res) => {
  const { users, meta } = await service.listPlatformUsers(req.query);
  return sendSuccess(res, 'Platform users loaded successfully', users, meta);
});

const getUser = asyncHandler(async (req, res) => {
  const data = await service.getPlatformUser(req.params.id);
  return sendSuccess(res, 'Platform user loaded successfully', data);
});

const updateUserStatus = asyncHandler(async (req, res) => {
  const data = await service.updateUserStatus(req, req.params.id, req.body.status);
  return sendSuccess(res, 'User status updated successfully', data);
});

const summary = asyncHandler(async (_req, res) => {
  const data = await service.platformSummary();
  return sendSuccess(res, 'Platform analytics loaded successfully', data);
});

const audit = asyncHandler(async (req, res) => {
  const { logs, meta } = await service.platformAudit(req.query);
  return sendSuccess(res, 'Platform audit loaded successfully', logs, meta);
});

module.exports = {
  createOrganization,
  listOrganizations,
  getOrganization,
  updateOrganizationStatus,
  createOrgAdmin,
  listUsers,
  getUser,
  updateUserStatus,
  summary,
  audit,
};
