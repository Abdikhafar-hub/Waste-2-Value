const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const service = require('./inventory.service');

const inventory = asyncHandler(async (req, res) => {
  const { rows, meta } = await service.inventory(req, req.query);
  return sendSuccess(res, 'Inventory loaded successfully', rows, meta);
});
const lots = asyncHandler(async (req, res) => {
  const { lots: data, meta } = await service.listLots(req, req.query);
  return sendSuccess(res, 'Inventory lots loaded successfully', data, meta);
});
const movements = asyncHandler(async (req, res) => {
  const { movements: data, meta } = await service.listMovements(req, req.query);
  return sendSuccess(res, 'Inventory movements loaded successfully', data, meta);
});
const adjustment = asyncHandler(async (req, res) => sendSuccess(res, 'Inventory adjustment recorded successfully', await service.adjustment(req, req.body), undefined, 201));

module.exports = { inventory, lots, movements, adjustment };
