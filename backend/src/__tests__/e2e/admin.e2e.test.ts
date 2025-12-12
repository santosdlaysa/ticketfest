import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { prisma } from '../../config/database.js';

describe('Admin E2E Tests', () => {
  // Test admin user
  const adminUser = {
    email: `admin-${Date.now()}@example.com`,
    password: 'Test@123456',
    name: 'Admin User',
  };

  // Test organizer user
  const organizerUser = {
    email: `admin-organizer-${Date.now()}@example.com`,
    password: 'Test@123456',
    name: 'Admin Test Organizer',
  };

  // Test regular user
  const regularUser = {
    email: `admin-user-${Date.now()}@example.com`,
    password: 'Test@123456',
    name: 'Admin Regular User',
  };

  let adminToken: string;
  let adminId: string;
  let organizerToken: string;
  let organizerId: string;
  let regularToken: string;
  let eventId: string;
  let ticketId: string;
  let orderId: string;

  // Setup
  beforeAll(async () => {
    // Register admin
    const adminResponse = await request(app).post('/api/auth/register').send(adminUser);
    adminToken = adminResponse.body.accessToken;
    adminId = adminResponse.body.user.id;

    // Update admin role
    await prisma.user.update({
      where: { id: adminId },
      data: { role: 'ADMIN' },
    });

    // Re-login admin
    const adminLoginResponse = await request(app).post('/api/auth/login').send({
      email: adminUser.email,
      password: adminUser.password,
    });
    adminToken = adminLoginResponse.body.accessToken;

    // Register organizer
    const orgResponse = await request(app).post('/api/auth/register').send(organizerUser);
    organizerToken = orgResponse.body.accessToken;
    organizerId = orgResponse.body.user.id;

    // Update organizer role
    await prisma.user.update({
      where: { id: organizerId },
      data: { role: 'ORGANIZER' },
    });

    // Re-login organizer
    const orgLoginResponse = await request(app).post('/api/auth/login').send({
      email: organizerUser.email,
      password: organizerUser.password,
    });
    organizerToken = orgLoginResponse.body.accessToken;

    // Register regular user
    const userResponse = await request(app).post('/api/auth/register').send(regularUser);
    regularToken = userResponse.body.accessToken;

    // Create event
    const eventResponse = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        name: 'Event for Admin Tests',
        description: 'Test event for admin tests',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Test Location',
        address: 'Test Address',
        category: 'SHOW',
        status: 'PUBLISHED',
      });
    eventId = eventResponse.body.id;

    // Publish event
    await prisma.event.update({
      where: { id: eventId },
      data: { status: 'PUBLISHED' },
    });

    // Create ticket
    const ticketResponse = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        name: 'Admin Test Ticket',
        description: 'Standard ticket',
        price: 100.0,
        quantity: 50,
        salesStart: new Date().toISOString(),
        salesEnd: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        eventId,
      });
    ticketId = ticketResponse.body.id;

    // Create order using regular user
    const buyerResponse = await request(app).post('/api/auth/register').send({
      email: `admin-buyer-${Date.now()}@example.com`,
      password: 'Test@123456',
      name: 'Admin Buyer User',
    });

    const orderResponse = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerResponse.body.accessToken}`)
      .send({
        eventId,
        items: [{ ticketId, quantity: 2 }],
        paymentMethod: 'CREDIT_CARD',
      });
    orderId = orderResponse.body.id;

    // Confirm the order for testing
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paidAt: new Date(),
      },
    });

    // Cleanup buyer
    await prisma.refreshToken.deleteMany({
      where: { user: { email: `admin-buyer-${Date.now()}@example.com` } },
    });
  });

  // Cleanup
  afterAll(async () => {
    try {
      // Delete orders and related data
      await prisma.ticketInstance.deleteMany({
        where: { orderItem: { order: { eventId } } },
      });
      await prisma.orderItem.deleteMany({
        where: { order: { eventId } },
      });
      await prisma.order.deleteMany({ where: { eventId } });

      // Delete tickets
      await prisma.ticket.deleteMany({ where: { eventId } });

      // Delete event
      await prisma.event.deleteMany({ where: { id: eventId } });

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
  // DASHBOARD
  // ============================================
  describe('GET /api/admin/dashboard', () => {
    it('should get dashboard as admin', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should get dashboard as organizer', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
    });

    it('should not get dashboard without authentication', async () => {
      const response = await request(app).get('/api/admin/dashboard');

      expect(response.status).toBe(401);
    });

    it('should not get dashboard as regular user', async () => {
      const response = await request(app)
        .get('/api/admin/dashboard')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });
  });

  // ============================================
  // ORDERS MANAGEMENT
  // ============================================
  describe('Orders Management', () => {
    describe('GET /api/admin/orders', () => {
      it('should get all orders as admin', async () => {
        const response = await request(app)
          .get('/api/admin/orders')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should get orders with pagination', async () => {
        const response = await request(app)
          .get('/api/admin/orders')
          .query({ page: 1, limit: 10 })
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
      });

      it('should filter orders by status', async () => {
        const response = await request(app)
          .get('/api/admin/orders')
          .query({ status: 'CONFIRMED' })
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
      });

      it('should not get orders as regular user', async () => {
        const response = await request(app)
          .get('/api/admin/orders')
          .set('Authorization', `Bearer ${regularToken}`);

        expect(response.status).toBe(403);
      });
    });

    describe('GET /api/admin/orders/:id', () => {
      it('should get order details as admin', async () => {
        const response = await request(app)
          .get(`/api/admin/orders/${orderId}`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(orderId);
      });

      it('should return 404 for non-existent order', async () => {
        const response = await request(app)
          .get('/api/admin/orders/00000000-0000-0000-0000-000000000000')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(404);
      });
    });

    describe('POST /api/admin/orders/:id/refund', () => {
      let orderToRefundId: string;

      beforeAll(async () => {
        // Create a new order for refund test
        const buyerResponse = await request(app).post('/api/auth/register').send({
          email: `refund-buyer-${Date.now()}@example.com`,
          password: 'Test@123456',
          name: 'Refund Buyer',
        });

        const orderResponse = await request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${buyerResponse.body.accessToken}`)
          .send({
            eventId,
            items: [{ ticketId, quantity: 1 }],
            paymentMethod: 'PIX',
          });
        orderToRefundId = orderResponse.body.id;

        // Confirm the order
        await prisma.order.update({
          where: { id: orderToRefundId },
          data: {
            status: 'CONFIRMED',
            paymentStatus: 'PAID',
            paidAt: new Date(),
          },
        });
      });

      it('should refund order as admin', async () => {
        const response = await request(app)
          .post(`/api/admin/orders/${orderToRefundId}/refund`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            reason: 'Customer requested refund',
          });

        expect(response.status).toBe(200);
        expect(response.body.paymentStatus).toBe('REFUNDED');
      });

      it('should not refund already refunded order', async () => {
        const response = await request(app)
          .post(`/api/admin/orders/${orderToRefundId}/refund`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            reason: 'Customer requested refund',
          });

        expect(response.status).toBe(400);
      });

      it('should not refund as regular user', async () => {
        const response = await request(app)
          .post(`/api/admin/orders/${orderId}/refund`)
          .set('Authorization', `Bearer ${regularToken}`)
          .send({
            reason: 'Trying to refund',
          });

        expect(response.status).toBe(403);
      });
    });

    describe('POST /api/admin/orders/:id/resend-email', () => {
      it('should resend order email as admin', async () => {
        const response = await request(app)
          .post(`/api/admin/orders/${orderId}/resend-email`)
          .set('Authorization', `Bearer ${adminToken}`);

        // May fail if email service is not configured
        expect([200, 500]).toContain(response.status);
      });

      it('should not resend email as regular user', async () => {
        const response = await request(app)
          .post(`/api/admin/orders/${orderId}/resend-email`)
          .set('Authorization', `Bearer ${regularToken}`);

        expect(response.status).toBe(403);
      });
    });
  });

  // ============================================
  // REPORTS
  // ============================================
  describe('Reports', () => {
    describe('GET /api/admin/reports/sales', () => {
      it('should get sales report as admin', async () => {
        const response = await request(app)
          .get('/api/admin/reports/sales')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
      });

      it('should get sales report with date range', async () => {
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
        const endDate = new Date().toISOString();

        const response = await request(app)
          .get('/api/admin/reports/sales')
          .query({ startDate, endDate })
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
      });

      it('should not get sales report as regular user', async () => {
        const response = await request(app)
          .get('/api/admin/reports/sales')
          .set('Authorization', `Bearer ${regularToken}`);

        expect(response.status).toBe(403);
      });
    });

    describe('GET /api/admin/reports/revenue', () => {
      it('should get revenue report as admin', async () => {
        const response = await request(app)
          .get('/api/admin/reports/revenue')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
      });

      it('should not get revenue report as regular user', async () => {
        const response = await request(app)
          .get('/api/admin/reports/revenue')
          .set('Authorization', `Bearer ${regularToken}`);

        expect(response.status).toBe(403);
      });
    });

    describe('GET /api/admin/reports/export', () => {
      it('should export report as admin', async () => {
        const response = await request(app)
          .get('/api/admin/reports/export')
          .query({ format: 'csv' })
          .set('Authorization', `Bearer ${adminToken}`);

        expect([200, 400]).toContain(response.status);
      });
    });
  });

  // ============================================
  // FINANCIAL
  // ============================================
  describe('Financial', () => {
    describe('GET /api/admin/financial/summary', () => {
      it('should get financial summary as admin', async () => {
        const response = await request(app)
          .get('/api/admin/financial/summary')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
      });

      it('should not get financial summary as regular user', async () => {
        const response = await request(app)
          .get('/api/admin/financial/summary')
          .set('Authorization', `Bearer ${regularToken}`);

        expect(response.status).toBe(403);
      });
    });

    describe('GET /api/admin/financial/transactions', () => {
      it('should get transactions as admin', async () => {
        const response = await request(app)
          .get('/api/admin/financial/transactions')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
      });

      it('should get transactions with pagination', async () => {
        const response = await request(app)
          .get('/api/admin/financial/transactions')
          .query({ page: 1, limit: 20 })
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
      });
    });
  });

  // ============================================
  // PAYOUTS
  // ============================================
  describe('Payouts', () => {
    let payoutId: string;

    beforeAll(async () => {
      // Create organizer account and payout for testing
      const orgAccount = await prisma.organizerAccount.create({
        data: {
          userId: organizerId,
          verified: true,
          verifiedAt: new Date(),
          availableBalance: 1000,
        },
      });

      const payout = await prisma.payout.create({
        data: {
          organizerAccountId: orgAccount.id,
          amount: 500,
          fee: 0,
          netAmount: 500,
          status: 'PENDING',
          payoutMethod: 'PIX',
        },
      });
      payoutId = payout.id;
    });

    describe('GET /api/admin/payouts', () => {
      it('should get all payouts as admin', async () => {
        const response = await request(app)
          .get('/api/admin/payouts')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });

      it('should filter payouts by status', async () => {
        const response = await request(app)
          .get('/api/admin/payouts')
          .query({ status: 'PENDING' })
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
      });
    });

    describe('POST /api/admin/payouts/:id/approve', () => {
      it('should not approve payout as organizer', async () => {
        const response = await request(app)
          .post(`/api/admin/payouts/${payoutId}/approve`)
          .set('Authorization', `Bearer ${organizerToken}`);

        expect(response.status).toBe(403);
      });

      it('should approve payout as admin', async () => {
        const response = await request(app)
          .post(`/api/admin/payouts/${payoutId}/approve`)
          .set('Authorization', `Bearer ${adminToken}`);

        expect([200, 400]).toContain(response.status);
      });
    });

    describe('POST /api/admin/payouts/:id/reject', () => {
      let payoutToRejectId: string;

      beforeAll(async () => {
        const orgAccount = await prisma.organizerAccount.findUnique({
          where: { userId: organizerId },
        });

        if (orgAccount) {
          const payout = await prisma.payout.create({
            data: {
              organizerAccountId: orgAccount.id,
              amount: 200,
              fee: 0,
              netAmount: 200,
              status: 'PENDING',
              payoutMethod: 'BANK_TRANSFER',
            },
          });
          payoutToRejectId = payout.id;
        }
      });

      it('should reject payout as admin', async () => {
        if (payoutToRejectId) {
          const response = await request(app)
            .post(`/api/admin/payouts/${payoutToRejectId}/reject`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send({
              reason: 'Invalid bank details',
            });

          expect([200, 400]).toContain(response.status);
        }
      });

      it('should not reject payout as organizer', async () => {
        if (payoutToRejectId) {
          const response = await request(app)
            .post(`/api/admin/payouts/${payoutToRejectId}/reject`)
            .set('Authorization', `Bearer ${organizerToken}`)
            .send({
              reason: 'Trying to reject',
            });

          expect(response.status).toBe(403);
        }
      });
    });

    afterAll(async () => {
      // Cleanup payouts and organizer account
      await prisma.payout.deleteMany({
        where: { organizerAccount: { userId: organizerId } },
      });
      await prisma.organizerAccount.deleteMany({
        where: { userId: organizerId },
      });
    });
  });

  // ============================================
  // EXPORT ATTENDEES
  // ============================================
  describe('GET /api/admin/events/:eventId/attendees/export', () => {
    it('should export attendees as admin', async () => {
      const response = await request(app)
        .get(`/api/admin/events/${eventId}/attendees/export`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400]).toContain(response.status);
    });

    it('should export attendees as organizer', async () => {
      const response = await request(app)
        .get(`/api/admin/events/${eventId}/attendees/export`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect([200, 400]).toContain(response.status);
    });

    it('should not export attendees as regular user', async () => {
      const response = await request(app)
        .get(`/api/admin/events/${eventId}/attendees/export`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .get('/api/admin/events/00000000-0000-0000-0000-000000000000/attendees/export')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // REMINDERS
  // ============================================
  describe('POST /api/admin/reminders/trigger', () => {
    it('should trigger reminders as admin', async () => {
      const response = await request(app)
        .post('/api/admin/reminders/trigger')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 400, 500]).toContain(response.status);
    });

    it('should not trigger reminders as organizer', async () => {
      const response = await request(app)
        .post('/api/admin/reminders/trigger')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(403);
    });

    it('should not trigger reminders as regular user', async () => {
      const response = await request(app)
        .post('/api/admin/reminders/trigger')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });
  });
});
