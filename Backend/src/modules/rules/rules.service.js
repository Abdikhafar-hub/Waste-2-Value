const prisma = require('../../db/prisma');
const { toNumber, money } = require('../../utils/decimal');

const DEFAULT_RULES = Object.freeze({
  formulaVersion: 'w2v-default-v1',
  credits: {
    collectionPerKg: { ORGANIC: 2, PLASTIC: 4 },
    processorPerKg: { ORGANIC: 0.75, PLASTIC: 1 },
    processorBatchBonus: 5,
  },
  yields: {
    ORGANIC: { LARVAE: 0.18, FERTILIZER: 0.42 },
    PLASTIC: { BRICKS: 0.55, GARDEN_STAKES: 0.2 },
  },
  emissionsAvoidedKgCo2ePerKg: { ORGANIC: 0.58, PLASTIC: 1.7 },
  reputationWeights: {
    approvalRate: 55,
    activity: 25,
    credits: 10,
    processing: 10,
  },
});

async function getRuleSettings(organizationId) {
  const settings = await prisma.systemSetting.findMany({
    where: {
      isActive: true,
      OR: [
        { scope: 'PLATFORM', organizationId: null },
        { scope: 'ORGANIZATION', organizationId },
      ],
    },
  });

  return settings.reduce((merged, setting) => {
    if (setting.key === 'rules' && setting.value && typeof setting.value === 'object') {
      return deepMerge(merged, setting.value);
    }
    return merged;
  }, JSON.parse(JSON.stringify(DEFAULT_RULES)));
}

function deepMerge(target, source) {
  for (const [key, value] of Object.entries(source || {})) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      target[key] = deepMerge(target[key] || {}, value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

async function calculateCollectionCredits(organizationId, wasteType, weightKg) {
  const settings = await getRuleSettings(organizationId);
  return money(toNumber(weightKg) * toNumber(settings.credits.collectionPerKg[wasteType] || 0));
}

async function calculateProcessorCredits(organizationId, wasteType, weightKg) {
  const settings = await getRuleSettings(organizationId);
  return money(
    toNumber(weightKg) * toNumber(settings.credits.processorPerKg[wasteType] || 0)
      + toNumber(settings.credits.processorBatchBonus || 0),
  );
}

async function calculateImpact(organizationId, rows) {
  const settings = await getRuleSettings(organizationId);
  const organicWasteKg = rows
    .filter((row) => row.wasteType === 'ORGANIC')
    .reduce((sum, row) => sum + toNumber(row.weightKg || row._sum?.weightKg), 0);
  const plasticWasteKg = rows
    .filter((row) => row.wasteType === 'PLASTIC')
    .reduce((sum, row) => sum + toNumber(row.weightKg || row._sum?.weightKg), 0);
  const totalWasteKg = organicWasteKg + plasticWasteKg;
  const emissionsAvoidedKgCo2e = money(
    organicWasteKg * settings.emissionsAvoidedKgCo2ePerKg.ORGANIC
      + plasticWasteKg * settings.emissionsAvoidedKgCo2ePerKg.PLASTIC,
  );
  return {
    formulaVersion: settings.formulaVersion,
    totalWasteKg,
    organicWasteKg,
    plasticWasteKg,
    plasticDivertedKg: plasticWasteKg,
    emissionsAvoidedKgCo2e,
  };
}

function estimateOutputs(settings, wasteType, weightKg) {
  const rates = settings.yields[wasteType] || {};
  return Object.entries(rates).map(([category, rate]) => ({
    category,
    quantity: money(toNumber(weightKg) * toNumber(rate)),
  }));
}

module.exports = {
  DEFAULT_RULES,
  getRuleSettings,
  calculateCollectionCredits,
  calculateProcessorCredits,
  calculateImpact,
  estimateOutputs,
};
