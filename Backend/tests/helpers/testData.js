const bcrypt = require('bcryptjs');
const prisma = require('../../src/db/prisma');

const PASSWORD = 'Password123!';

async function clearDatabase() {
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

async function createUser({ organizationId, email, role }) {
  return prisma.user.create({
    data: {
      organizationId,
      email,
      role,
      status: 'ACTIVE',
      isEmailVerified: true,
      passwordHash: await bcrypt.hash(PASSWORD, 10),
      profile: { create: { firstName: role, lastName: 'User' } },
      ...(role === 'BUYER' ? { buyerProfile: { create: { organizationId } } } : {}),
      ...(['COLLECTOR', 'PROCESSOR'].includes(role) ? {
        wallet: { create: { organizationId } },
        reputationProfile: { create: { organizationId } },
      } : {}),
    },
    include: { wallet: true },
  });
}

async function seedTestTenants() {
  await clearDatabase();
  const superAdmin = await createUser({ email: 'super@test.local', role: 'SUPER_ADMIN' });
  const orgA = await prisma.organization.create({ data: { name: 'Org A', slug: 'org-a', status: 'ACTIVE', createdByUserId: superAdmin.id } });
  const orgB = await prisma.organization.create({ data: { name: 'Org B', slug: 'org-b', status: 'ACTIVE', createdByUserId: superAdmin.id } });
  const adminA = await createUser({ organizationId: orgA.id, email: 'admin-a@test.local', role: 'ORG_ADMIN' });
  const collectorA = await createUser({ organizationId: orgA.id, email: 'collector-a@test.local', role: 'COLLECTOR' });
  const processorA = await createUser({ organizationId: orgA.id, email: 'processor-a@test.local', role: 'PROCESSOR' });
  const buyerA = await createUser({ organizationId: orgA.id, email: 'buyer-a@test.local', role: 'BUYER' });
  const adminB = await createUser({ organizationId: orgB.id, email: 'admin-b@test.local', role: 'ORG_ADMIN' });
  const collectorB = await createUser({ organizationId: orgB.id, email: 'collector-b@test.local', role: 'COLLECTOR' });
  const zoneA = await prisma.zone.create({ data: { organizationId: orgA.id, name: 'Zone A', code: 'A' } });
  const pointA = await prisma.collectionPoint.create({ data: { organizationId: orgA.id, zoneId: zoneA.id, name: 'Point A' } });
  const centerA = await prisma.processingCenter.create({ data: { organizationId: orgA.id, zoneId: zoneA.id, name: 'Center A' } });
  const productA = await prisma.product.create({ data: { organizationId: orgA.id, name: 'Larvae', slug: 'larvae', category: 'LARVAE', unit: 'kg', sellingPrice: 10 } });
  const lotA = await prisma.inventoryLot.create({ data: { organizationId: orgA.id, productId: productA.id, quantityAvailable: 20, unit: 'kg' } });
  await prisma.inventoryMovement.create({ data: { organizationId: orgA.id, productId: productA.id, inventoryLotId: lotA.id, type: 'ADJUSTMENT', quantity: 20, createdByUserId: adminA.id } });
  const zoneB = await prisma.zone.create({ data: { organizationId: orgB.id, name: 'Zone B', code: 'B' } });
  const wasteB = await prisma.wasteSubmission.create({ data: { organizationId: orgB.id, collectorUserId: collectorB.id, zoneId: zoneB.id, wasteType: 'ORGANIC', weightKg: 5, source: 'MANUAL' } });
  return { superAdmin, orgA, orgB, adminA, collectorA, processorA, buyerA, adminB, collectorB, zoneA, pointA, centerA, productA, wasteB };
}

module.exports = { prisma, PASSWORD, clearDatabase, seedTestTenants };
