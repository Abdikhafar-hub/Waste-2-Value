const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const service = require('./products.service');

const listProducts = asyncHandler(async (req, res) => {
  const { products, meta } = await service.listProducts(req, req.query);
  return sendSuccess(res, 'Products loaded successfully', products, meta);
});
const getProduct = asyncHandler(async (req, res) => sendSuccess(res, 'Product loaded successfully', await service.getProduct(req, req.params.id)));
const createProduct = asyncHandler(async (req, res) => sendSuccess(res, 'Product created successfully', await service.createProduct(req, req.body), undefined, 201));
const updateProduct = asyncHandler(async (req, res) => sendSuccess(res, 'Product updated successfully', await service.updateProduct(req, req.params.id, req.body)));
const updateStatus = asyncHandler(async (req, res) => sendSuccess(res, 'Product status updated successfully', await service.updateStatus(req, req.params.id, req.body.isActive)));

module.exports = { listProducts, getProduct, createProduct, updateProduct, updateStatus };
