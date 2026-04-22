const prisma = require('../../db/prisma');
const { getRuleSettings } = require('../rules/rules.service');
const { ForbiddenError, NotFoundError } = require('../../utils/errors');
const { toNumber, money } = require('../../utils/decimal');

async function recalculate(req, userId) {
  if (req.user.role !== 'ORG_ADMIN' && req.user.id !== userId) {
    throw new ForbiddenError('You can only recalculate your own reputation');
  }
  const user = await prisma.user.findFirst({
    where: { id: userId, organizationId: req.user.organizationId, role: { in: ['COLLECTOR', 'PROCESSOR'] } },
  });
  if (!user) throw new NotFoundError('Reputation user not found');
  const [submissions, processedBatches, credits, settings] = await Promise.all([
    prisma.wasteSubmission.groupBy({
      by: ['status'],
      where: { organizationId: req.user.organizationId, collectorUserId: userId },
      _count: { _all: true },
    }),
    prisma.productionBatch.count({ where: { organizationId: req.user.organizationId, processorUserId: userId, status: 'COMPLETED' } }),
    prisma.walletTransaction.aggregate({
      where: { organizationId: req.user.organizationId, userId, amount: { gt: 0 } },
      _sum: { amount: true },
    }),
    getRuleSettings(req.user.organizationId),
  ]);
  const totalSubmissions = submissions.reduce((sum, row) => sum + row._count._all, 0);
  const approvedSubmissions = submissions.filter((row) => ['APPROVED', 'ASSIGNED', 'RECEIVED', 'PROCESSING', 'PROCESSED', 'CONVERTED'].includes(row.status)).reduce((sum, row) => sum + row._count._all, 0);
  const rejectedSubmissions = submissions.find((row) => row.status === 'REJECTED')?._count._all || 0;
  const approvalRate = totalSubmissions ? approvedSubmissions / totalSubmissions : 0;
  const activityScore = Math.min(totalSubmissions / 20, 1);
  const creditScore = Math.min(toNumber(credits._sum.amount || 0) / 500, 1);
  const processingScore = Math.min(processedBatches / 10, 1);
  const weights = settings.reputationWeights;
  const reliabilityScore = money(
    approvalRate * weights.approvalRate
    + activityScore * weights.activity
    + creditScore * weights.credits
    + processingScore * weights.processing,
  );
  return prisma.reputationProfile.upsert({
    where: { userId },
    update: {
      totalSubmissions,
      approvedSubmissions,
      rejectedSubmissions,
      totalProcessedBatches: processedBatches,
      totalCreditsEarned: money(credits._sum.amount || 0),
      reliabilityScore,
      lastCalculatedAt: new Date(),
    },
    create: {
      organizationId: req.user.organizationId,
      userId,
      totalSubmissions,
      approvedSubmissions,
      rejectedSubmissions,
      totalProcessedBatches: processedBatches,
      totalCreditsEarned: money(credits._sum.amount || 0),
      reliabilityScore,
      lastCalculatedAt: new Date(),
    },
  });
}

async function me(req) {
  return recalculate(req, req.user.id);
}

async function getUserReputation(req, userId) {
  if (req.user.role !== 'ORG_ADMIN' && req.user.id !== userId) {
    throw new ForbiddenError('You can only view your own reputation');
  }
  const profile = await prisma.reputationProfile.findFirst({ where: { organizationId: req.user.organizationId, userId } });
  return profile || recalculate(req, userId);
}

module.exports = { recalculate, me, getUserReputation };
