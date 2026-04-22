const { Router } = require('express');
const prisma = require('../../db/prisma');
const asyncHandler = require('../../utils/asyncHandler');
const { sendSuccess } = require('../../utils/apiResponse');

const router = Router();

router.get('/', (_req, res) => sendSuccess(res, 'Waste2Value API is healthy', { status: 'ok', timestamp: new Date().toISOString() }));
router.get('/ready', asyncHandler(async (_req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  return sendSuccess(res, 'Waste2Value API is ready', { database: 'ok' });
}));

module.exports = router;
