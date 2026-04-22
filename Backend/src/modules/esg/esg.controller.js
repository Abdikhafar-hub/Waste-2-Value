const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const service = require('./esg.service');

const summary = asyncHandler(async (req, res) => sendSuccess(res, 'ESG summary loaded successfully', await service.computeSummary(req, req.query)));
const metrics = asyncHandler(async (req, res) => sendSuccess(res, 'ESG metrics loaded successfully', await service.metrics(req, req.query)));
const reports = asyncHandler(async (req, res) => sendSuccess(res, 'ESG reports loaded successfully', await service.reports(req)));
const runReport = asyncHandler(async (req, res) => sendSuccess(res, 'ESG report generated successfully', await service.runReport(req, req.body), undefined, 201));

module.exports = { summary, metrics, reports, runReport };
