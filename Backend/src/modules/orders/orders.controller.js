const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const service = require('./orders.service');

const createOrder = asyncHandler(async (req, res) => sendSuccess(res, 'Order created successfully', await service.createOrder(req, req.body), undefined, 201));
const listOrders = asyncHandler(async (req, res) => {
  const { orders, meta } = await service.listOrders(req, req.query);
  return sendSuccess(res, 'Orders loaded successfully', orders, meta);
});
const getOrder = asyncHandler(async (req, res) => sendSuccess(res, 'Order loaded successfully', await service.getOrder(req, req.params.id)));
const updateStatus = asyncHandler(async (req, res) => sendSuccess(res, 'Order status updated successfully', await service.updateStatus(req, req.params.id, req.body.status)));
const updatePaymentStatus = asyncHandler(async (req, res) => sendSuccess(res, 'Order payment status updated successfully', await service.updatePaymentStatus(req, req.params.id, req.body)));
const updateDeliveryStatus = asyncHandler(async (req, res) => sendSuccess(res, 'Order delivery status updated successfully', await service.updateDeliveryStatus(req, req.params.id, req.body)));

module.exports = { createOrder, listOrders, getOrder, updateStatus, updatePaymentStatus, updateDeliveryStatus };
