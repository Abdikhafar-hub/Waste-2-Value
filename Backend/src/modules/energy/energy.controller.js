const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const service = require('./energy.service');

function list(modelName, message) {
  return asyncHandler(async (req, res) => {
    const { rows, meta } = await service.list(modelName, req, req.query);
    return sendSuccess(res, message, rows, meta);
  });
}

const createUnit = asyncHandler(async (req, res) => sendSuccess(res, 'Energy unit created successfully', await service.createUnit(req, req.body), undefined, 201));
const createConsumer = asyncHandler(async (req, res) => sendSuccess(res, 'Energy consumer created successfully', await service.createConsumer(req, req.body), undefined, 201));
const createProduction = asyncHandler(async (req, res) => sendSuccess(res, 'Energy production record created successfully', await service.createProduction(req, req.body), undefined, 201));
const createUsage = asyncHandler(async (req, res) => sendSuccess(res, 'Energy usage record created successfully', await service.createUsage(req, req.body), undefined, 201));
const createPayment = asyncHandler(async (req, res) => sendSuccess(res, 'Energy payment record created successfully', await service.createPayment(req, req.body), undefined, 201));

module.exports = {
  listUnits: list('energyUnit', 'Energy units loaded successfully'),
  listProduction: list('energyProductionRecord', 'Energy production records loaded successfully'),
  listConsumers: list('energyConsumer', 'Energy consumers loaded successfully'),
  listUsage: list('energyUsageRecord', 'Energy usage records loaded successfully'),
  listPayments: list('energyPaymentRecord', 'Energy payment records loaded successfully'),
  createUnit,
  createConsumer,
  createProduction,
  createUsage,
  createPayment,
};
