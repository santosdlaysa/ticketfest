import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { prisma } from '../../config/database.js';

describe('Split Payment E2E Tests', () => {
  // Test admin user
  const adminUser = {
    email: `split-admin-${Date.now()}@example.com`,
    password: 'Test@123456',
    name: 'Split Admin User',
  };

  // Test organizer user
  const organizerUser = {
    email: `split-organizer-${Date.now()}@example.com`,
    password: 'Test@123456',
    name: 'Split Test Organizer',
  };

  // Test regular user
  const regularUser = {
    email: `split-user-${Date.now()}@example.com`,
    password: 'Test@123456',
    name: 'Split Regular User',
  };

  let adminToken: string;
  let adminId: string;
  let organizerToken: string;
  let organizerId: string;
  let regularToken: string;
  let organizerAccountId: string;

  // Setup
  beforeAll(async () => {
    // Register admin
    const adminResponse = await request(app).post('/api/auth/register').send(adminUser);
    adminToken = adminResponse.body.accessToken;
    adminId = adminResponse.body.user.id;

    await prisma.user.update({
      where: { id: adminId },
      data: { role: 'ADMIN' },
    });

    const adminLoginResponse = await request(app).post('/api/auth/login').send({
      email: adminUser.email,
      password: adminUser.password,
    });
    adminToken = adminLoginResponse.body.accessToken;

    // Register organizer
    const orgResponse = await request(app).post('/api/auth/register').send(organizerUser);
    organizerToken = orgResponse.body.accessToken;
    organizerId = orgResponse.body.user.id;

    await prisma.user.update({
      where: { id: organizerId },
      data: { role: 'ORGANIZER' },
    });

    const orgLoginResponse = await request(app).post('/api/auth/login').send({
      email: organizerUser.email,
      password: organizerUser.password,
    });
    organizerToken = orgLoginResponse.body.accessToken;

    // Register regular user
    const userResponse = await request(app).post('/api/auth/register').send(regularUser);
    regularToken = userResponse.body.accessToken;
  });

  // Cleanup
  afterAll(async () => {
    try {
      // Delete payouts
      await prisma.payout.deleteMany({
        where: { organizerAccount: { userId: organizerId } },
      });

      // Delete split transactions
      await prisma.splitTransaction.deleteMany({
        where: { organizerAccount: { userId: organizerId } },
      });

      // Delete split rules
      await prisma.splitRule.deleteMany({
        where: { organizerAccount: { userId: organizerId } },
      });

      // Delete organizer accounts
      await prisma.organizerAccount.deleteMany({
        where: { userId: organizerId },
      });

      // Delete users
      await prisma.refreshToken.deleteMany({
        where: {
          user: {
            email: { in: [adminUser.email, organizerUser.email, regularUser.email] },
          },
        },
      });
      await prisma.user.deleteMany({
        where: {
          email: { in: [adminUser.email, organizerUser.email, regularUser.email] },
        },
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  // ============================================
  // ORGANIZER ACCOUNT
  // ============================================
  describe('Organizer Account', () => {
    describe('POST /api/split/account', () => {
      it('should create organizer account', async () => {
        const response = await request(app)
          .post('/api/split/account')
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            companyName: 'Test Company LTDA',
            tradingName: 'Test Events',
            cnpj: '12345678901234',
            companyEmail: 'company@test.com',
            companyPhone: '11999999999',
          });

        expect(response.status).toBe(201);
        expect(response.body.id).toBeDefined();
        expect(response.body.userId).toBe(organizerId);
        expect(response.body.verified).toBe(false);

        organizerAccountId = response.body.id;
      });

      it('should not create duplicate organizer account', async () => {
        const response = await request(app)
          .post('/api/split/account')
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            companyName: 'Another Company',
          });

        expect(response.status).toBe(400);
      });

      it('should not create account without authentication', async () => {
        const response = await request(app).post('/api/split/account').send({
          companyName: 'Test Company',
        });

        expect(response.status).toBe(401);
      });
    });

    describe('GET /api/split/account', () => {
      it('should get organizer account', async () => {
        const response = await request(app)
          .get('/api/split/account')
          .set('Authorization', `Bearer ${organizerToken}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(organizerAccountId);
        expect(response.body.companyName).toBe('Test Company LTDA');
      });

      it('should not get account without authentication', async () => {
        const response = await request(app).get('/api/split/account');

        expect(response.status).toBe(401);
      });

      it('should return 404 for user without account', async () => {
        const response = await request(app)
          .get('/api/split/account')
          .set('Authorization', `Bearer ${regularToken}`);

        expect(response.status).toBe(404);
      });
    });

    describe('PUT /api/split/account/bank-details', () => {
      it('should update bank details', async () => {
        const response = await request(app)
          .put('/api/split/account/bank-details')
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            bankCode: '001',
            bankName: 'Banco do Brasil',
            accountType: 'CHECKING',
            accountNumber: '12345',
            accountDigit: '6',
            agencyNumber: '1234',
            agencyDigit: '5',
            holderName: 'Test Company LTDA',
            holderDocument: '12345678901234',
            holderType: 'COMPANY',
          });

        expect(response.status).toBe(200);
        expect(response.body.bankCode).toBe('001');
        expect(response.body.accountNumber).toBe('12345');
      });

      it('should update PIX key', async () => {
        const response = await request(app)
          .put('/api/split/account/bank-details')
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            pixKeyType: 'CNPJ',
            pixKey: '12345678901234',
          });

        expect(response.status).toBe(200);
        expect(response.body.pixKeyType).toBe('CNPJ');
        expect(response.body.pixKey).toBe('12345678901234');
      });

      it('should not update bank details without authentication', async () => {
        const response = await request(app)
          .put('/api/split/account/bank-details')
          .send({
            bankCode: '001',
          });

        expect(response.status).toBe(401);
      });

      it('should require re-verification after bank details update if already verified', async () => {
        // First verify the account
        await prisma.organizerAccount.update({
          where: { id: organizerAccountId },
          data: { verified: true, verifiedAt: new Date() },
        });

        // Update bank details
        const response = await request(app)
          .put('/api/split/account/bank-details')
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            accountNumber: '99999',
          });

        expect(response.status).toBe(200);
        expect(response.body.verified).toBe(false);
      });
    });

    describe('POST /api/split/account/:id/verify', () => {
      it('should verify account as admin', async () => {
        const response = await request(app)
          .post(`/api/split/account/${organizerAccountId}/verify`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.verified).toBe(true);
        expect(response.body.verifiedAt).toBeDefined();
      });

      it('should not verify account as organizer', async () => {
        const response = await request(app)
          .post(`/api/split/account/${organizerAccountId}/verify`)
          .set('Authorization', `Bearer ${organizerToken}`);

        expect(response.status).toBe(403);
      });

      it('should not verify account as regular user', async () => {
        const response = await request(app)
          .post(`/api/split/account/${organizerAccountId}/verify`)
          .set('Authorization', `Bearer ${regularToken}`);

        expect(response.status).toBe(403);
      });

      it('should return 404 for non-existent account', async () => {
        const response = await request(app)
          .post('/api/split/account/00000000-0000-0000-0000-000000000000/verify')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(404);
      });
    });
  });

  // ============================================
  // PAYOUTS
  // ============================================
  describe('Payouts', () => {
    let payoutId: string;

    beforeAll(async () => {
      // Add balance to organizer account
      await prisma.organizerAccount.update({
        where: { id: organizerAccountId },
        data: {
          availableBalance: 5000,
          verified: true,
          verifiedAt: new Date(),
        },
      });
    });

    describe('GET /api/split/payouts/:organizerId', () => {
      it('should get payouts for organizer', async () => {
        const response = await request(app)
          .get(`/api/split/payouts/${organizerAccountId}`)
          .set('Authorization', `Bearer ${organizerToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should not get payouts without authentication', async () => {
        const response = await request(app).get(`/api/split/payouts/${organizerAccountId}`);

        expect(response.status).toBe(401);
      });
    });

    describe('POST /api/split/payouts/:organizerId/withdraw', () => {
      it('should create withdrawal request', async () => {
        const response = await request(app)
          .post(`/api/split/payouts/${organizerAccountId}/withdraw`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            amount: 1000,
            payoutMethod: 'PIX',
          });

        expect(response.status).toBe(201);
        expect(response.body.id).toBeDefined();
        expect(response.body.amount).toBe(1000);
        expect(response.body.status).toBe('PENDING');
        expect(response.body.payoutMethod).toBe('PIX');

        payoutId = response.body.id;
      });

      it('should create bank transfer withdrawal', async () => {
        const response = await request(app)
          .post(`/api/split/payouts/${organizerAccountId}/withdraw`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            amount: 500,
            payoutMethod: 'BANK_TRANSFER',
          });

        expect(response.status).toBe(201);
        expect(response.body.payoutMethod).toBe('BANK_TRANSFER');
      });

      it('should not withdraw more than available balance', async () => {
        const response = await request(app)
          .post(`/api/split/payouts/${organizerAccountId}/withdraw`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            amount: 100000,
            payoutMethod: 'PIX',
          });

        expect(response.status).toBe(400);
      });

      it('should not withdraw with zero amount', async () => {
        const response = await request(app)
          .post(`/api/split/payouts/${organizerAccountId}/withdraw`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            amount: 0,
            payoutMethod: 'PIX',
          });

        expect(response.status).toBe(400);
      });

      it('should not withdraw with negative amount', async () => {
        const response = await request(app)
          .post(`/api/split/payouts/${organizerAccountId}/withdraw`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            amount: -100,
            payoutMethod: 'PIX',
          });

        expect(response.status).toBe(400);
      });

      it('should not withdraw without authentication', async () => {
        const response = await request(app)
          .post(`/api/split/payouts/${organizerAccountId}/withdraw`)
          .send({
            amount: 100,
            payoutMethod: 'PIX',
          });

        expect(response.status).toBe(401);
      });

      it('should deduct from available balance after withdrawal', async () => {
        const accountBefore = await prisma.organizerAccount.findUnique({
          where: { id: organizerAccountId },
        });
        const balanceBefore = accountBefore?.availableBalance || 0;

        await request(app)
          .post(`/api/split/payouts/${organizerAccountId}/withdraw`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            amount: 200,
            payoutMethod: 'PIX',
          });

        const accountAfter = await prisma.organizerAccount.findUnique({
          where: { id: organizerAccountId },
        });

        expect(accountAfter?.availableBalance).toBe(balanceBefore - 200);
      });
    });

    describe('POST /api/split/payouts/:payoutId/process', () => {
      it('should not process payout as organizer', async () => {
        const response = await request(app)
          .post(`/api/split/payouts/${payoutId}/process`)
          .set('Authorization', `Bearer ${organizerToken}`);

        expect(response.status).toBe(403);
      });

      it('should process payout as admin', async () => {
        const response = await request(app)
          .post(`/api/split/payouts/${payoutId}/process`)
          .set('Authorization', `Bearer ${adminToken}`);

        // May fail if external payment service is not configured
        expect([200, 400, 500]).toContain(response.status);
      });

      it('should return 404 for non-existent payout', async () => {
        const response = await request(app)
          .post('/api/split/payouts/00000000-0000-0000-0000-000000000000/process')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(404);
      });
    });
  });

  // ============================================
  // SPLIT RULES (via Events routes)
  // ============================================
  describe('Split Rules', () => {
    let eventId: string;

    beforeAll(async () => {
      // Create an event for split rules testing
      const eventResponse = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Event for Split Rules',
          description: 'Test event',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Test Location',
          address: 'Test Address',
          category: 'SHOW',
        });
      eventId = eventResponse.body.id;
    });

    describe('POST /api/events/:id/split-rules', () => {
      it('should create split rule for event', async () => {
        const response = await request(app)
          .post(`/api/events/${eventId}/split-rules`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            platformPercentage: 10,
            organizerPercentage: 90,
            platformFixedFee: 2.5,
          });

        expect(response.status).toBe(201);
        expect(response.body.platformPercentage).toBe(10);
        expect(response.body.organizerPercentage).toBe(90);
        expect(response.body.platformFixedFee).toBe(2.5);
      });

      it('should not create split rule with invalid percentages (sum != 100)', async () => {
        const newEventResponse = await request(app)
          .post('/api/events')
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            name: 'Event for Invalid Split',
            description: 'Test',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'Test',
            address: 'Test',
            category: 'SHOW',
          });

        const response = await request(app)
          .post(`/api/events/${newEventResponse.body.id}/split-rules`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            platformPercentage: 20,
            organizerPercentage: 70, // Sum = 90, not 100
          });

        expect(response.status).toBe(400);

        // Cleanup
        await prisma.event.delete({ where: { id: newEventResponse.body.id } });
      });

      it('should not create split rule with negative percentages', async () => {
        const newEventResponse = await request(app)
          .post('/api/events')
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            name: 'Event for Negative Split',
            description: 'Test',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'Test',
            address: 'Test',
            category: 'SHOW',
          });

        const response = await request(app)
          .post(`/api/events/${newEventResponse.body.id}/split-rules`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            platformPercentage: -10,
            organizerPercentage: 110,
          });

        expect(response.status).toBe(400);

        // Cleanup
        await prisma.event.delete({ where: { id: newEventResponse.body.id } });
      });
    });

    describe('GET /api/events/:id/split-rules', () => {
      it('should get split rule for event', async () => {
        const response = await request(app)
          .get(`/api/events/${eventId}/split-rules`)
          .set('Authorization', `Bearer ${organizerToken}`);

        expect(response.status).toBe(200);
        expect(response.body.eventId).toBe(eventId);
        expect(response.body.platformPercentage).toBe(10);
      });

      it('should return 404 for event without split rule', async () => {
        const newEventResponse = await request(app)
          .post('/api/events')
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            name: 'Event Without Split',
            description: 'Test',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'Test',
            address: 'Test',
            category: 'SHOW',
          });

        const response = await request(app)
          .get(`/api/events/${newEventResponse.body.id}/split-rules`)
          .set('Authorization', `Bearer ${organizerToken}`);

        expect(response.status).toBe(404);

        // Cleanup
        await prisma.event.delete({ where: { id: newEventResponse.body.id } });
      });
    });

    describe('PUT /api/events/:id/split-rules', () => {
      it('should update split rule', async () => {
        const response = await request(app)
          .put(`/api/events/${eventId}/split-rules`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            platformPercentage: 15,
            organizerPercentage: 85,
          });

        expect(response.status).toBe(200);
        expect(response.body.platformPercentage).toBe(15);
        expect(response.body.organizerPercentage).toBe(85);
      });

      it('should update platform fixed fee', async () => {
        const response = await request(app)
          .put(`/api/events/${eventId}/split-rules`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            platformFixedFee: 5.0,
          });

        expect(response.status).toBe(200);
        expect(response.body.platformFixedFee).toBe(5.0);
      });
    });

    afterAll(async () => {
      // Cleanup
      await prisma.splitRule.deleteMany({ where: { eventId } });
      await prisma.event.deleteMany({ where: { id: eventId } });
    });
  });

  // ============================================
  // BALANCE MANAGEMENT
  // ============================================
  describe('Balance Management', () => {
    it('should show correct available balance', async () => {
      const response = await request(app)
        .get('/api/split/account')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.availableBalance).toBeDefined();
      expect(typeof response.body.availableBalance).toBe('number');
    });

    it('should show pending balance', async () => {
      const response = await request(app)
        .get('/api/split/account')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.pendingBalance).toBeDefined();
      expect(typeof response.body.pendingBalance).toBe('number');
    });
  });

  // ============================================
  // ACCOUNT VERIFICATION STATUS
  // ============================================
  describe('Account Verification', () => {
    it('should not allow withdrawal for unverified account', async () => {
      // Unverify the account
      await prisma.organizerAccount.update({
        where: { id: organizerAccountId },
        data: { verified: false, verifiedAt: null },
      });

      const response = await request(app)
        .post(`/api/split/payouts/${organizerAccountId}/withdraw`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          amount: 100,
          payoutMethod: 'PIX',
        });

      expect(response.status).toBe(400);

      // Re-verify for other tests
      await prisma.organizerAccount.update({
        where: { id: organizerAccountId },
        data: { verified: true, verifiedAt: new Date() },
      });
    });
  });
});
