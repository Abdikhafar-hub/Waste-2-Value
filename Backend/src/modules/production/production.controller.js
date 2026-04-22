const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const service = require('./production.service');

const createBatch = asyncHandler(async (req, res) => sendSuccess(res, 'Production batch created successfully', await service.createBatch(req, req.body), undefined, 201));
const listBatches = asyncHandler(async (req, res) => {
  const { batches, meta } = await service.listBatches(req, req.query);
  return sendSuccess(res, 'Production batches loaded successfully', batches, meta);
});
const getBatch = asyncHandler(async (req, res) => sendSuccess(res, 'Production batch loaded successfully', await service.getBatch(req, req.params.id)));
const updateBatch = asyncHandler(async (req, res) => sendSuccess(res, 'Production batch updated successfully', await service.updateBatch(req, req.params.id, req.body)));
const completeBatch = asyncHandler(async (req, res) => sendSuccess(res, 'Production batch completed successfully', await service.completeBatch(req, req.params.id, req.body)));
const metrics = asyncHandler(async (req, res) => sendSuccess(res, 'Production metrics loaded successfully', await service.metrics(req)));

module.exports = { createBatch, listBatches, getBatch, updateBatch, completeBatch, metrics };
