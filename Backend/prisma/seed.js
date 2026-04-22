const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();
const password = process.env.SEED_PASSWORD || 'Password123!';
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
  reputationWeights: { approvalRate: 55, activity: 25, credits: 10, processing: 10 },
});

async function createUser({ organizationId, email, role, firstName, lastName, phone }) {
  return prisma.user.create({
    data: {
      organizationId,
      email,
      role,
      status: 'ACTIVE',
      isEmailVerified: true,
      passwordHash: await bcrypt.hash(password, 10),
      profile: {
        create: { firstName, lastName, phone },
      },
      ...(role === 'BUYER' ? {
        buyerProfile: { create: { organizationId, businessName: `${firstName} ${lastName} Trading`, buyerType: 'LOCAL_BUSINESS', phone } },
      } : {}),
      ...(['COLLECTOR', 'PROCESSOR'].includes(role) ? {
        wallet: { create: { organizationId, status: 'ACTIVE' } },
        reputationProfile: { create: { organizationId } },
      } : {}),
    },
    include: { wallet: true },
  });
}

async function clear() {
  await prisma.auditLog.deleteMany();
  await prisma.energyPaymentRecord.deleteMany();
  await prisma.energyUsageRecord.deleteMany();
  await prisma.energyProductionRecord.deleteMany();
  await prisma.energyConsumer.deleteMany();
  await prisma.energyUnit.deleteMany();
  await prisma.aIInsight.deleteMany();
  await prisma.carbonComputationRecord.deleteMany();
  await prisma.eSGReport.deleteMany();
  await prisma.impactMetricSnapshot.deleteMany();
  await prisma.deliveryRecord.deleteMany();
  await prisma.paymentRecord.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.inventoryMovement.deleteMany();
  await prisma.inventoryLot.deleteMany();
  await prisma.productionOutput.deleteMany();
  await prisma.productionBatchInput.deleteMany();
  await prisma.productionBatch.deleteMany();
  await prisma.creditRedemptionRequest.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.creditRule.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.wasteTag.deleteMany();
  await prisma.wasteStatusHistory.deleteMany();
  await prisma.wasteSubmission.deleteMany();
  await prisma.processingCenter.deleteMany();
  await prisma.collectionPoint.deleteMany();
  await prisma.zone.deleteMany();
  await prisma.buyerProfile.deleteMany();
  await prisma.reputationProfile.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.userProfile.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.organization.deleteMany();
}

async function seedOrganization(slug, name, prefix, createdByUserId) {
  const org = await prisma.organization.create({
    data: { slug, name, description: `${name} demo tenant`, status: 'ACTIVE', createdByUserId },
  });
  await prisma.systemSetting.create({
    data: { organizationId: org.id, key: 'rules', scope: 'ORGANIZATION', value: DEFAULT_RULES },
  });
  await prisma.creditRule.createMany({
    data: [
      { organizationId: org.id, actionType: 'COLLECTION', wasteType: 'ORGANIC', creditsPerKg: 2, isActive: true },
      { organizationId: org.id, actionType: 'COLLECTION', wasteType: 'PLASTIC', creditsPerKg: 4, isActive: true },
      { organizationId: org.id, actionType: 'PROCESSING', flatCredits: 5, isActive: true },
    ],
  });
  const admin = await createUser({ organizationId: org.id, email: `admin@${prefix}.w2v.local`, role: 'ORG_ADMIN', firstName: 'Amina', lastName: 'Admin', phone: '+254700000001' });
  const collector1 = await createUser({ organizationId: org.id, email: `collector1@${prefix}.w2v.local`, role: 'COLLECTOR', firstName: 'Grace', lastName: 'Collector', phone: '+254700000002' });
  const collector2 = await createUser({ organizationId: org.id, email: `collector2@${prefix}.w2v.local`, role: 'COLLECTOR', firstName: 'Samuel', lastName: 'Collector', phone: '+254700000003' });
  const processor = await createUser({ organizationId: org.id, email: `processor@${prefix}.w2v.local`, role: 'PROCESSOR', firstName: 'Peter', lastName: 'Processor', phone: '+254700000004' });
  const buyer = await createUser({ organizationId: org.id, email: `buyer@${prefix}.w2v.local`, role: 'BUYER', firstName: 'Nia', lastName: 'Buyer', phone: '+254700000005' });

  const zone = await prisma.zone.create({ data: { organizationId: org.id, name: 'Block A', code: `${prefix.toUpperCase()}-A`, latitude: -1.2921, longitude: 36.8219 } });
  const point = await prisma.collectionPoint.create({ data: { organizationId: org.id, zoneId: zone.id, name: 'Community Collection Point', latitude: -1.291, longitude: 36.822 } });
  const center = await prisma.processingCenter.create({ data: { organizationId: org.id, zoneId: zone.id, name: 'Circular Processing Center', latitude: -1.293, longitude: 36.823 } });

  const larvae = await prisma.product.create({ data: { organizationId: org.id, name: 'Black Soldier Fly Larvae', slug: 'bsf-larvae', category: 'LARVAE', unit: 'kg', sellingPrice: 120 } });
  const fertilizer = await prisma.product.create({ data: { organizationId: org.id, name: 'Organic Fertilizer', slug: 'organic-fertilizer', category: 'FERTILIZER', unit: 'kg', sellingPrice: 80 } });
  const bricks = await prisma.product.create({ data: { organizationId: org.id, name: 'Plastic Bricks', slug: 'plastic-bricks', category: 'BRICKS', unit: 'piece', sellingPrice: 45 } });
  const stakes = await prisma.product.create({ data: { organizationId: org.id, name: 'Garden Stakes', slug: 'garden-stakes', category: 'GARDEN_STAKES', unit: 'piece', sellingPrice: 25 } });

  const waste1 = await prisma.wasteSubmission.create({
    data: {
      organizationId: org.id,
      collectorUserId: collector1.id,
      zoneId: zone.id,
      collectionPointId: point.id,
      assignedProcessorUserId: processor.id,
      processingCenterId: center.id,
      wasteType: 'ORGANIC',
      weightKg: 42,
      tagCode: `${prefix}-ORG-001`,
      source: 'QR',
      status: 'CONVERTED',
      approvedAt: new Date(),
      receivedAt: new Date(),
      processedAt: new Date(),
    },
  });
  const waste2 = await prisma.wasteSubmission.create({
    data: {
      organizationId: org.id,
      collectorUserId: collector2.id,
      zoneId: zone.id,
      collectionPointId: point.id,
      assignedProcessorUserId: processor.id,
      processingCenterId: center.id,
      wasteType: 'PLASTIC',
      weightKg: 30,
      tagCode: `${prefix}-PLA-001`,
      source: 'MANUAL',
      status: 'PROCESSED',
      approvedAt: new Date(),
      receivedAt: new Date(),
      processedAt: new Date(),
    },
  });
  await prisma.wasteStatusHistory.createMany({
    data: [
      { organizationId: org.id, wasteSubmissionId: waste1.id, toStatus: 'SUBMITTED', changedByUserId: collector1.id },
      { organizationId: org.id, wasteSubmissionId: waste1.id, fromStatus: 'SUBMITTED', toStatus: 'APPROVED', changedByUserId: admin.id },
      { organizationId: org.id, wasteSubmissionId: waste1.id, fromStatus: 'APPROVED', toStatus: 'ASSIGNED', changedByUserId: admin.id },
      { organizationId: org.id, wasteSubmissionId: waste1.id, fromStatus: 'ASSIGNED', toStatus: 'RECEIVED', changedByUserId: processor.id },
      { organizationId: org.id, wasteSubmissionId: waste1.id, fromStatus: 'RECEIVED', toStatus: 'PROCESSING', changedByUserId: processor.id },
      { organizationId: org.id, wasteSubmissionId: waste1.id, fromStatus: 'PROCESSING', toStatus: 'PROCESSED', changedByUserId: processor.id },
      { organizationId: org.id, wasteSubmissionId: waste1.id, fromStatus: 'PROCESSED', toStatus: 'CONVERTED', changedByUserId: processor.id },
    ],
  });
  await prisma.wasteTag.createMany({
    data: [
      { organizationId: org.id, code: `${prefix}-ORG-001`, linkedWasteSubmissionId: waste1.id },
      { organizationId: org.id, code: `${prefix}-PLA-001`, linkedWasteSubmissionId: waste2.id },
    ],
  });

  await prisma.walletTransaction.createMany({
    data: [
      { organizationId: org.id, walletId: collector1.wallet.id, userId: collector1.id, type: 'CREDIT_EARNED', amount: 84, balanceAfter: 84, referenceType: 'WasteSubmission', referenceId: waste1.id, description: 'Approved organic waste credits', createdByUserId: admin.id },
      { organizationId: org.id, walletId: collector2.wallet.id, userId: collector2.id, type: 'CREDIT_EARNED', amount: 120, balanceAfter: 120, referenceType: 'WasteSubmission', referenceId: waste2.id, description: 'Approved plastic waste credits', createdByUserId: admin.id },
      { organizationId: org.id, walletId: processor.wallet.id, userId: processor.id, type: 'CREDIT_REWARD', amount: 36.5, balanceAfter: 36.5, referenceType: 'WasteSubmission', referenceId: waste1.id, description: 'Processing reward', createdByUserId: processor.id },
    ],
  });

  const batch = await prisma.productionBatch.create({
    data: { organizationId: org.id, processorUserId: processor.id, processingCenterId: center.id, wasteType: 'ORGANIC', totalInputWeightKg: 42, status: 'COMPLETED', completedAt: new Date() },
  });
  await prisma.productionBatchInput.create({ data: { organizationId: org.id, productionBatchId: batch.id, wasteSubmissionId: waste1.id, inputWeightKg: 42 } });
  await prisma.productionOutput.createMany({
    data: [
      { organizationId: org.id, productionBatchId: batch.id, productId: larvae.id, quantity: 8, unit: 'kg' },
      { organizationId: org.id, productionBatchId: batch.id, productId: fertilizer.id, quantity: 18, unit: 'kg' },
    ],
  });
  const larvaeLot = await prisma.inventoryLot.create({ data: { organizationId: org.id, productId: larvae.id, quantityAvailable: 3, unit: 'kg', sourceProductionBatchId: batch.id } });
  const fertilizerLot = await prisma.inventoryLot.create({ data: { organizationId: org.id, productId: fertilizer.id, quantityAvailable: 18, unit: 'kg', sourceProductionBatchId: batch.id } });
  const brickLot = await prisma.inventoryLot.create({ data: { organizationId: org.id, productId: bricks.id, quantityAvailable: 250, unit: 'piece' } });
  await prisma.inventoryMovement.createMany({
    data: [
      { organizationId: org.id, productId: larvae.id, inventoryLotId: larvaeLot.id, type: 'PRODUCTION_IN', quantity: 8, referenceType: 'ProductionBatch', referenceId: batch.id, createdByUserId: processor.id },
      { organizationId: org.id, productId: larvae.id, inventoryLotId: larvaeLot.id, type: 'SALE_OUT', quantity: -5, referenceType: 'OrderSeed', referenceId: 'seed', createdByUserId: buyer.id },
      { organizationId: org.id, productId: fertilizer.id, inventoryLotId: fertilizerLot.id, type: 'PRODUCTION_IN', quantity: 18, referenceType: 'ProductionBatch', referenceId: batch.id, createdByUserId: processor.id },
      { organizationId: org.id, productId: bricks.id, inventoryLotId: brickLot.id, type: 'ADJUSTMENT', quantity: 250, createdByUserId: admin.id },
    ],
  });
  const order = await prisma.order.create({
    data: {
      organizationId: org.id,
      buyerUserId: buyer.id,
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      deliveryStatus: 'DELIVERED',
      subtotalAmount: 600,
      totalAmount: 600,
      items: { create: [{ organizationId: org.id, productId: larvae.id, quantity: 5, unitPrice: 120, lineTotal: 600 }] },
      payments: { create: [{ organizationId: org.id, amount: 600, status: 'PAID', method: 'CASH', reference: `${prefix}-PAY-001` }] },
      deliveries: { create: [{ organizationId: org.id, status: 'DELIVERED', recipientName: 'Nia Buyer', address: 'Local market', deliveredAt: new Date() }] },
    },
  });

  await prisma.impactMetricSnapshot.create({
    data: { organizationId: org.id, periodStart: new Date('2026-01-01'), periodEnd: new Date('2026-12-31'), totalWasteKg: 72, organicWasteKg: 42, plasticWasteKg: 30, emissionsAvoidedKgCo2e: 75.36, plasticDivertedKg: 30, creditsIssued: 240.5, revenueAmount: 600, activeParticipants: 3 },
  });
  await prisma.aIInsight.create({
    data: { organizationId: org.id, zoneId: zone.id, type: 'HOTSPOT', title: 'Rising plastic volume', description: 'Plastic submissions are increasing around Block A.', severity: 'medium', payload: { recommendedAction: 'Add pickup window' }, createdByUserId: admin.id },
  });
  const energyUnit = await prisma.energyUnit.create({ data: { organizationId: org.id, name: 'Bio-digester Unit 1', type: 'BIOGAS', capacity: 150 } });
  const energyConsumer = await prisma.energyConsumer.create({ data: { organizationId: org.id, name: 'Community Kitchen', type: 'COMMUNITY', contact: '+254700000030' } });
  await prisma.energyProductionRecord.create({ data: { organizationId: org.id, energyUnitId: energyUnit.id, quantity: 40, unit: 'kWh', recordedAt: new Date() } });
  await prisma.energyUsageRecord.create({ data: { organizationId: org.id, energyConsumerId: energyConsumer.id, quantity: 18, unit: 'kWh', recordedAt: new Date() } });
  await prisma.energyPaymentRecord.create({ data: { organizationId: org.id, energyConsumerId: energyConsumer.id, amount: 250, status: 'PAID', reference: `${prefix}-ENERGY-001`, paidAt: new Date() } });
  await prisma.reputationProfile.update({ where: { userId: collector1.id }, data: { totalSubmissions: 1, approvedSubmissions: 1, totalCreditsEarned: 84, reliabilityScore: 82, lastCalculatedAt: new Date() } });
  await prisma.reputationProfile.update({ where: { userId: processor.id }, data: { totalProcessedBatches: 1, totalCreditsEarned: 36.5, reliabilityScore: 74, lastCalculatedAt: new Date() } });
  await prisma.auditLog.createMany({
    data: [
      { organizationId: org.id, actorUserId: admin.id, action: 'SEED_ORG_CREATED', entityType: 'Organization', entityId: org.id, newValues: { slug: org.slug } },
      { organizationId: org.id, actorUserId: buyer.id, action: 'ORDER_CREATED', entityType: 'Order', entityId: order.id },
    ],
  });
  return { org, admin, collector1, collector2, processor, buyer };
}

async function main() {
  await clear();
  const superAdmin = await prisma.user.create({
    data: {
      email: 'superadmin@w2v.local',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      isEmailVerified: true,
      passwordHash: await bcrypt.hash(password, 10),
      profile: { create: { firstName: 'Platform', lastName: 'Owner', phone: '+254700000000' } },
    },
  });
  await prisma.systemSetting.create({ data: { key: 'rules', scope: 'PLATFORM', value: DEFAULT_RULES } });
  await seedOrganization('organization-a', 'Organization A Circular Hub', 'orga', superAdmin.id);
  await seedOrganization('organization-b', 'Organization B Green Works', 'orgb', superAdmin.id);
  await prisma.auditLog.create({
    data: { actorUserId: superAdmin.id, action: 'SEED_COMPLETED', entityType: 'Platform', newValues: { organizations: 2 } },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log(`Seed completed. Demo password: ${password}`);
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
