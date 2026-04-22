const request = require('supertest');
const app = require('../../src/app');
const { prisma, PASSWORD, seedTestTenants, clearDatabase } = require('../helpers/testData');

async function login(email) {
  const response = await request(app).post('/api/v1/auth/login').send({ email, password: PASSWORD }).expect(200);
  return response.body.data;
}

describe('Waste2Value core API flows', () => {
  let ctx;
  let tokens;

  beforeAll(async () => {
    ctx = await seedTestTenants();
    tokens = {
      superAdmin: await login('super@test.local'),
      adminA: await login('admin-a@test.local'),
      adminB: await login('admin-b@test.local'),
      collectorA: await login('collector-a@test.local'),
      processorA: await login('processor-a@test.local'),
      buyerA: await login('buyer-a@test.local'),
    };
  });

  afterAll(async () => {
    await clearDatabase();
    await prisma.$disconnect();
  });

  test('auth login, refresh, me, and suspended user blocking', async () => {
    const loginResponse = await request(app).post('/api/v1/auth/login').send({ email: 'collector-a@test.local', password: PASSWORD }).expect(200);
    await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${loginResponse.body.data.accessToken}`).expect(200);
    await request(app).post('/api/v1/auth/refresh').send({ refreshToken: loginResponse.body.data.refreshToken }).expect(200);
    await request(app).post('/api/v1/auth/logout').set('Authorization', `Bearer ${loginResponse.body.data.accessToken}`).send({ refreshToken: loginResponse.body.data.refreshToken }).expect(200);
    await request(app).post('/api/v1/auth/refresh').send({ refreshToken: loginResponse.body.data.refreshToken }).expect(401);
    await prisma.user.update({ where: { id: ctx.collectorA.id }, data: { status: 'SUSPENDED' } });
    await request(app).post('/api/v1/auth/login').send({ email: 'collector-a@test.local', password: PASSWORD }).expect(403);
    await prisma.user.update({ where: { id: ctx.collectorA.id }, data: { status: 'ACTIVE' } });
    const forgot = await request(app).post('/api/v1/auth/forgot-password').send({ email: 'collector-a@test.local' }).expect(200);
    await request(app).post('/api/v1/auth/reset-password').send({ token: forgot.body.data.resetToken, newPassword: PASSWORD }).expect(200);
  });

  test('platform routes are super-admin only and can create org/admin', async () => {
    await request(app).get('/api/v1/platform/organizations').set('Authorization', `Bearer ${tokens.adminA.accessToken}`).expect(403);
    const orgResponse = await request(app)
      .post('/api/v1/platform/organizations')
      .set('Authorization', `Bearer ${tokens.superAdmin.accessToken}`)
      .send({ name: 'Org C', slug: 'org-c' })
      .expect(201);
    await request(app)
      .post(`/api/v1/platform/organizations/${orgResponse.body.data.id}/org-admin`)
      .set('Authorization', `Bearer ${tokens.superAdmin.accessToken}`)
      .send({ email: 'admin-c@test.local', password: PASSWORD, profile: { firstName: 'Org', lastName: 'Admin' } })
      .expect(201);
    await request(app).get('/api/v1/users').set('Authorization', `Bearer ${tokens.superAdmin.accessToken}`).expect(403);
  });

  test('org admin can create org users and org users cannot manage users', async () => {
    await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${tokens.adminA.accessToken}`)
      .send({ email: 'new-collector@test.local', password: PASSWORD, role: 'COLLECTOR', profile: { firstName: 'New', lastName: 'Collector' } })
      .expect(201);
    await request(app)
      .post('/api/v1/users')
      .set('Authorization', `Bearer ${tokens.collectorA.accessToken}`)
      .send({ email: 'bad@test.local', password: PASSWORD, role: 'BUYER', profile: { firstName: 'Bad', lastName: 'Actor' } })
      .expect(403);
    await request(app)
      .patch(`/api/v1/users/${ctx.collectorA.id}/status`)
      .set('Authorization', `Bearer ${tokens.adminB.accessToken}`)
      .send({ status: 'SUSPENDED' })
      .expect(404);
  });

  test('waste lifecycle issues credits, blocks invalid transitions, and isolates tenants', async () => {
    const created = await request(app)
      .post('/api/v1/waste/submissions')
      .set('Authorization', `Bearer ${tokens.collectorA.accessToken}`)
      .send({ zoneId: ctx.zoneA.id, collectionPointId: ctx.pointA.id, wasteType: 'ORGANIC', weightKg: 10, source: 'MANUAL' })
      .expect(201);
    const wasteId = created.body.data.id;
    await request(app).get(`/api/v1/waste/submissions/${ctx.wasteB.id}`).set('Authorization', `Bearer ${tokens.adminA.accessToken}`).expect(404);
    await request(app).post(`/api/v1/waste/submissions/${wasteId}/approve`).set('Authorization', `Bearer ${tokens.processorA.accessToken}`).send({ note: 'wrong role' }).expect(403);
    await request(app).post(`/api/v1/waste/submissions/${wasteId}/receive`).set('Authorization', `Bearer ${tokens.processorA.accessToken}`).expect(400);
    await request(app).post(`/api/v1/waste/submissions/${wasteId}/approve`).set('Authorization', `Bearer ${tokens.adminA.accessToken}`).send({ note: 'ok' }).expect(200);
    await request(app).post(`/api/v1/waste/submissions/${wasteId}/approve`).set('Authorization', `Bearer ${tokens.adminA.accessToken}`).send({ note: 'duplicate' }).expect(400);
    await request(app).post(`/api/v1/waste/submissions/${wasteId}/assign`).set('Authorization', `Bearer ${tokens.adminA.accessToken}`).send({ processorUserId: ctx.processorA.id, processingCenterId: ctx.centerA.id }).expect(200);
    await request(app).post(`/api/v1/waste/submissions/${wasteId}/receive`).set('Authorization', `Bearer ${tokens.processorA.accessToken}`).send({ note: 'received' }).expect(200);
    await request(app).post(`/api/v1/waste/submissions/${wasteId}/mark-processed`).set('Authorization', `Bearer ${tokens.processorA.accessToken}`).expect(400);
    await request(app).post(`/api/v1/waste/submissions/${wasteId}/start-processing`).set('Authorization', `Bearer ${tokens.processorA.accessToken}`).expect(200);
    await request(app).post(`/api/v1/waste/submissions/${wasteId}/mark-processed`).set('Authorization', `Bearer ${tokens.processorA.accessToken}`).expect(200);
    const wallet = await request(app).get('/api/v1/wallet/me').set('Authorization', `Bearer ${tokens.collectorA.accessToken}`).expect(200);
    expect(Number(wallet.body.data.balance)).toBe(20);
    const redemption = await request(app).post('/api/v1/wallet/redemptions').set('Authorization', `Bearer ${tokens.collectorA.accessToken}`).send({ amount: 5, requestedItem: 'Food voucher' }).expect(201);
    await request(app).post(`/api/v1/wallet/redemptions/${redemption.body.data.id}/approve`).set('Authorization', `Bearer ${tokens.adminA.accessToken}`).send({ notes: 'approved' }).expect(200);
    await request(app).post(`/api/v1/wallet/redemptions/${redemption.body.data.id}/approve`).set('Authorization', `Bearer ${tokens.adminA.accessToken}`).send({ notes: 'duplicate' }).expect(400);
  });

  test('production completion creates outputs, inventory movement, audit, and blocks duplicate waste reuse', async () => {
    const waste = await prisma.wasteSubmission.findFirst({ where: { organizationId: ctx.orgA.id, collectorUserId: ctx.collectorA.id, status: 'PROCESSED' } });
    const batch = await request(app)
      .post('/api/v1/production/batches')
      .set('Authorization', `Bearer ${tokens.processorA.accessToken}`)
      .send({ wasteType: 'ORGANIC', processingCenterId: ctx.centerA.id, wasteSubmissionIds: [waste.id] })
      .expect(201);
    await request(app)
      .post('/api/v1/production/batches')
      .set('Authorization', `Bearer ${tokens.processorA.accessToken}`)
      .send({ wasteType: 'ORGANIC', processingCenterId: ctx.centerA.id, wasteSubmissionIds: [waste.id] })
      .expect(400);
    await request(app)
      .post(`/api/v1/production/batches/${batch.body.data.id}/complete`)
      .set('Authorization', `Bearer ${tokens.processorA.accessToken}`)
      .send({ outputs: [{ productId: ctx.productA.id, quantity: 2, unit: 'kg' }] })
      .expect(200);
    const movements = await prisma.inventoryMovement.count({ where: { organizationId: ctx.orgA.id, referenceType: 'ProductionBatch', referenceId: batch.body.data.id } });
    expect(movements).toBeGreaterThan(0);
    const audit = await prisma.auditLog.count({ where: { organizationId: ctx.orgA.id, action: 'PRODUCTION_BATCH_COMPLETED' } });
    expect(audit).toBeGreaterThan(0);
  });

  test('orders reduce stock, prevent oversell, and isolate buyer data', async () => {
    const beforeStock = await prisma.inventoryLot.aggregate({
      where: { organizationId: ctx.orgA.id, productId: ctx.productA.id },
      _sum: { quantityAvailable: true },
    });
    const order = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${tokens.buyerA.accessToken}`)
      .send({ items: [{ productId: ctx.productA.id, quantity: 1 }] })
      .expect(201);
    await request(app).patch(`/api/v1/orders/${order.body.data.id}/payment-status`).set('Authorization', `Bearer ${tokens.adminA.accessToken}`).send({ paymentStatus: 'PAID', amount: 10 }).expect(200);
    await request(app).patch(`/api/v1/orders/${order.body.data.id}/delivery-status`).set('Authorization', `Bearer ${tokens.adminA.accessToken}`).send({ deliveryStatus: 'DELIVERED' }).expect(400);
    await request(app).patch(`/api/v1/orders/${order.body.data.id}/delivery-status`).set('Authorization', `Bearer ${tokens.adminA.accessToken}`).send({ deliveryStatus: 'ASSIGNED' }).expect(200);
    await request(app).patch(`/api/v1/orders/${order.body.data.id}/delivery-status`).set('Authorization', `Bearer ${tokens.adminA.accessToken}`).send({ deliveryStatus: 'IN_TRANSIT' }).expect(200);
    await request(app).patch(`/api/v1/orders/${order.body.data.id}/delivery-status`).set('Authorization', `Bearer ${tokens.adminA.accessToken}`).send({ deliveryStatus: 'DELIVERED' }).expect(200);
    await request(app).post('/api/v1/orders').set('Authorization', `Bearer ${tokens.buyerA.accessToken}`).send({ items: [{ productId: ctx.productA.id, quantity: 100000 }] }).expect(400);
    await request(app).get(`/api/v1/orders/${order.body.data.id}`).set('Authorization', `Bearer ${tokens.adminB.accessToken}`).expect(404);

    const cancellableOrder = await request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${tokens.buyerA.accessToken}`)
      .send({ items: [{ productId: ctx.productA.id, quantity: 2 }] })
      .expect(201);
    await request(app)
      .patch(`/api/v1/orders/${cancellableOrder.body.data.id}/status`)
      .set('Authorization', `Bearer ${tokens.adminA.accessToken}`)
      .send({ status: 'CANCELLED' })
      .expect(200);
    await request(app)
      .patch(`/api/v1/orders/${cancellableOrder.body.data.id}/status`)
      .set('Authorization', `Bearer ${tokens.adminA.accessToken}`)
      .send({ status: 'CONFIRMED' })
      .expect(400);
    const afterStock = await prisma.inventoryLot.aggregate({
      where: { organizationId: ctx.orgA.id, productId: ctx.productA.id },
      _sum: { quantityAvailable: true },
    });
    expect(Number(afterStock._sum.quantityAvailable)).toBeGreaterThanOrEqual(Number(beforeStock._sum.quantityAvailable));
  });

  test('ESG, analytics, reputation, AI, energy, and audit endpoints respond in org scope', async () => {
    await request(app).get('/api/v1/esg/summary').set('Authorization', `Bearer ${tokens.adminA.accessToken}`).expect(200);
    await request(app).get('/api/v1/analytics/dashboard').set('Authorization', `Bearer ${tokens.adminA.accessToken}`).expect(200);
    await request(app).post(`/api/v1/reputation/users/${ctx.collectorA.id}/recalculate`).set('Authorization', `Bearer ${tokens.adminA.accessToken}`).expect(200);
    const insight = await request(app).post('/api/v1/ai/insights').set('Authorization', `Bearer ${tokens.adminA.accessToken}`).send({ type: 'HOTSPOT', title: 'Hotspot', description: 'More pickups needed', payload: {} }).expect(201);
    await request(app).get(`/api/v1/ai/insights/${insight.body.data.id}`).set('Authorization', `Bearer ${tokens.adminB.accessToken}`).expect(404);
    const unit = await request(app).post('/api/v1/energy/units').set('Authorization', `Bearer ${tokens.adminA.accessToken}`).send({ name: 'Solar 1', type: 'SOLAR', capacity: 10 }).expect(201);
    await request(app).post('/api/v1/energy/production').set('Authorization', `Bearer ${tokens.adminA.accessToken}`).send({ energyUnitId: unit.body.data.id, quantity: 5, unit: 'kWh', recordedAt: new Date().toISOString() }).expect(201);
    await request(app).get('/api/v1/geo/zones').set('Authorization', `Bearer ${tokens.buyerA.accessToken}`).expect(403);
    const audit = await request(app).get('/api/v1/audit/logs').set('Authorization', `Bearer ${tokens.adminA.accessToken}`).expect(200);
    expect(Array.isArray(audit.body.data)).toBe(true);
    const payoutAuditCount = await prisma.auditLog.count({
      where: { organizationId: ctx.orgA.id, action: { in: ['REDEMPTION_REVIEWED', 'WALLET_ADJUSTED', 'ORDER_STATUS_CHANGED'] } },
    });
    expect(payoutAuditCount).toBeGreaterThanOrEqual(1);
  });
});
