const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const service = require('./geo.service');

function list(modelName, message) {
  return asyncHandler(async (req, res) => {
    const { rows, meta } = await service.list(modelName, req, req.query);
    return sendSuccess(res, message, rows, meta);
  });
}

const createZone = asyncHandler(async (req, res) => sendSuccess(res, 'Zone created successfully', await service.createZone(req, req.body), undefined, 201));
const updateZone = asyncHandler(async (req, res) => sendSuccess(res, 'Zone updated successfully', await service.updateZone(req, req.params.id, req.body)));
const createCollectionPoint = asyncHandler(async (req, res) => sendSuccess(res, 'Collection point created successfully', await service.createCollectionPoint(req, req.body), undefined, 201));
const updateCollectionPoint = asyncHandler(async (req, res) => sendSuccess(res, 'Collection point updated successfully', await service.updateCollectionPoint(req, req.params.id, req.body)));
const createProcessingCenter = asyncHandler(async (req, res) => sendSuccess(res, 'Processing center created successfully', await service.createProcessingCenter(req, req.body), undefined, 201));
const updateProcessingCenter = asyncHandler(async (req, res) => sendSuccess(res, 'Processing center updated successfully', await service.updateProcessingCenter(req, req.params.id, req.body)));
const hotspots = asyncHandler(async (req, res) => sendSuccess(res, 'Hotspots loaded successfully', await service.hotspots(req)));

module.exports = {
  listZones: list('zone', 'Zones loaded successfully'),
  listCollectionPoints: list('collectionPoint', 'Collection points loaded successfully'),
  listProcessingCenters: list('processingCenter', 'Processing centers loaded successfully'),
  createZone,
  updateZone,
  createCollectionPoint,
  updateCollectionPoint,
  createProcessingCenter,
  updateProcessingCenter,
  hotspots,
};
