const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');
const service = require('./wallet.service');

const getMyWallet = asyncHandler(async (req, res) => sendSuccess(res, 'Wallet loaded successfully', await service.getMyWallet(req)));
const listTransactions = asyncHandler(async (req, res) => {
  const { transactions, meta } = await service.listTransactions(req, req.query);
  return sendSuccess(res, 'Wallet transactions loaded successfully', transactions, meta);
});
const createRedemption = asyncHandler(async (req, res) => sendSuccess(res, 'Redemption request created successfully', await service.createRedemption(req, req.body), undefined, 201));
const listRedemptions = asyncHandler(async (req, res) => {
  const { redemptions, meta } = await service.listRedemptions(req, req.query);
  return sendSuccess(res, 'Redemptions loaded successfully', redemptions, meta);
});
const getRedemption = asyncHandler(async (req, res) => sendSuccess(res, 'Redemption loaded successfully', await service.getRedemption(req, req.params.id)));
const approveRedemption = asyncHandler(async (req, res) => sendSuccess(res, 'Redemption approved successfully', await service.approveRedemption(req, req.params.id, req.body.notes)));
const rejectRedemption = asyncHandler(async (req, res) => sendSuccess(res, 'Redemption rejected successfully', await service.rejectRedemption(req, req.params.id, req.body.notes)));
const adjustment = asyncHandler(async (req, res) => sendSuccess(res, 'Wallet adjustment recorded successfully', await service.adjustment(req, req.body), undefined, 201));

module.exports = {
  getMyWallet,
  listTransactions,
  createRedemption,
  listRedemptions,
  getRedemption,
  approveRedemption,
  rejectRedemption,
  adjustment,
};
