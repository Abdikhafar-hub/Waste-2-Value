const prisma = require('../../db/prisma');
const { AUDIT_ACTIONS } = require('../../config/constants');
const { createAuditLog } = require('../../utils/audit');
const { calculateImpact } = require('../rules/rules.service');
const { toNumber, money } = require('../../utils/decimal');
const { parseDate } = require('../../utils/date');
const { BadRequestError } = require('../../utils/errors');

function periodWhere(req, input = {}) {
  const to = parseDate(input.to || input.periodEnd, new Date());
  const from = parseDate(input.from || input.periodStart, new Date(to.getFullYear(), to.getMonth(), 1));
  return { from, to, where: { organizationId: req.user.organizationId, submittedAt: { gte: from, lte: to }, status: { not: 'REJECTED' } } };
}

async function computeSummary(req, input = {}) {
  const { from, to, where } = periodWhere(req, input);
  const [wasteRows, credits, revenue, participants, outputs] = await Promise.all([
    prisma.wasteSubmission.findMany({ where, select: { wasteType: true, weightKg: true, collectorUserId: true } }),
    prisma.walletTransaction.aggregate({
      where: { organizationId: req.user.organizationId, createdAt: { gte: from, lte: to }, amount: { gt: 0 } },
      _sum: { amount: true },
    }),
    prisma.order.aggregate({
      where: { organizationId: req.user.organizationId, paymentStatus: 'PAID', createdAt: { gte: from, lte: to } },
      _sum: { totalAmount: true },
    }),
    prisma.wasteSubmission.groupBy({ by: ['collectorUserId'], where }),
    prisma.productionOutput.aggregate({
      where: { organizationId: req.user.organizationId, createdAt: { gte: from, lte: to } },
      _sum: { quantity: true },
    }),
  ]);
  const impact = await calculateImpact(req.user.organizationId, wasteRows);
  return {
    periodStart: from,
    periodEnd: to,
    ...impact,
    creditsIssued: money(credits._sum.amount || 0),
    revenueAmount: money(revenue._sum.totalAmount || 0),
    activeParticipants: participants.length,
    totalProductsProduced: toNumber(outputs._sum.quantity || 0),
  };
}

async function metrics(req, query) {
  const summary = await computeSummary(req, query);
  const byType = await prisma.wasteSubmission.groupBy({
    by: ['wasteType'],
    where: periodWhere(req, query).where,
    _sum: { weightKg: true },
    _count: { _all: true },
  });
  return { summary, byType };
}

async function reports(req) {
  return prisma.eSGReport.findMany({ where: { organizationId: req.user.organizationId }, orderBy: { createdAt: 'desc' } });
}

async function runReport(req, input) {
  if (input.periodEnd <= input.periodStart) throw new BadRequestError('periodEnd must be after periodStart');
  const summary = await computeSummary(req, input);
  return prisma.$transaction(async (tx) => {
    const report = await tx.eSGReport.create({
      data: {
        organizationId: req.user.organizationId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        summary,
        generatedByUserId: req.user.id,
      },
    });
    await tx.impactMetricSnapshot.create({
      data: {
        organizationId: req.user.organizationId,
        periodStart: input.periodStart,
        periodEnd: input.periodEnd,
        totalWasteKg: summary.totalWasteKg,
        organicWasteKg: summary.organicWasteKg,
        plasticWasteKg: summary.plasticWasteKg,
        emissionsAvoidedKgCo2e: summary.emissionsAvoidedKgCo2e,
        plasticDivertedKg: summary.plasticDivertedKg,
        creditsIssued: summary.creditsIssued,
        revenueAmount: summary.revenueAmount,
        activeParticipants: summary.activeParticipants,
        metadata: { formulaVersion: summary.formulaVersion },
      },
    });
    await tx.carbonComputationRecord.create({
      data: {
        organizationId: req.user.organizationId,
        referenceType: 'ESGReport',
        referenceId: report.id,
        formulaVersion: summary.formulaVersion,
        valueKgCo2e: summary.emissionsAvoidedKgCo2e,
        metadata: summary,
      },
    });
    await createAuditLog(tx, req, {
      organizationId: req.user.organizationId,
      action: AUDIT_ACTIONS.ESG_REPORT_GENERATED,
      entityType: 'ESGReport',
      entityId: report.id,
      newValues: report,
    });
    return report;
  });
}

module.exports = { computeSummary, metrics, reports, runReport };
