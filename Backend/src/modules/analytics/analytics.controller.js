const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const service = require('./analytics.service');

const dashboard = asyncHandler(async (req, res) => sendSuccess(res, 'Dashboard analytics loaded successfully', await service.dashboard(req)));
const wasteByZone = asyncHandler(async (req, res) => sendSuccess(res, 'Waste by zone loaded successfully', await service.wasteByZone(req)));
const collectorPerformance = asyncHandler(async (req, res) => sendSuccess(res, 'Collector performance loaded successfully', await service.collectorPerformance(req)));
const processorPerformance = asyncHandler(async (req, res) => sendSuccess(res, 'Processor performance loaded successfully', await service.processorPerformance(req)));
const revenue = asyncHandler(async (req, res) => sendSuccess(res, 'Revenue analytics loaded successfully', await service.revenue(req)));
const marketSummary = asyncHandler(async (req, res) => sendSuccess(res, 'Market summary loaded successfully', await service.marketSummary(req)));

module.exports = { dashboard, wasteByZone, collectorPerformance, processorPerformance, revenue, marketSummary };
