import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { prisma } from '../../config/database.js';

describe('Stats E2E Tests', () => {
  // Test organizer user
  const organizerUser = {
    email: `stats-organizer-${Date.now()}@example.com`,
    password: 'Test@123456',
    name: 'Stats Test Organizer',
  };

  // Test regular user
  const regularUser = {
    email: `stats-user-${Date.now()}@example.com`,
    password: 'Test@123456',
    name: 'Stats Regular User',
  };

  // Another organizer for isolation testing
  const anotherOrganizerUser = {
    email: `stats-organizer2-${Date.now()}@example.com`,
    password: 'Test@123456',
    name: 'Another Stats Organizer',
  };

  let organizerToken: string;
  let organizerId: string;
  let regularToken: string;
  let anotherOrganizerToken: string;
  let anotherOrganizerId: string;
  let eventId: string;
  let ticketId: string;
  let orderId: string;

  // Setup
  beforeAll(async () => {
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
    const loginResponse = await request(app).post('/api/auth/login').send({
      email: organizerUser.email,
      password: organizerUser.password,
    });
    organizerToken = loginResponse.body.accessToken;

    // Register regular user
    const userResponse = await request(app).post('/api/auth/register').send(regularUser);
    regularToken = userResponse.body.accessToken;

    // Register another organizer
    const anotherOrgResponse = await request(app).post('/api/auth/register').send(anotherOrganizerUser);
    anotherOrganizerToken = anotherOrgResponse.body.accessToken;
    anotherOrganizerId = anotherOrgResponse.body.user.id;

    await prisma.user.update({
      where: { id: anotherOrganizerId },
      data: { role: 'ORGANIZER' },
    });

    const anotherLoginResponse = await request(app).post('/api/auth/login').send({
      email: anotherOrganizerUser.email,
      password: anotherOrganizerUser.password,
    });
    anotherOrganizerToken = anotherLoginResponse.body.accessToken;

    // Create event
    const eventResponse = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        name: 'Event for Stats',
        description: 'Test event for stats tests',
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

    // Create tickets
    const ticketResponse = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        name: 'Stats Test Ticket',
        description: 'Standard ticket',
        price: 75.0,
        quantity: 100,
        salesStart: new Date().toISOString(),
        salesEnd: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        eventId,
      });
    ticketId = ticketResponse.body.id;

    // Create VIP ticket
    await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        name: 'VIP Stats Ticket',
        description: 'VIP ticket',
        price: 200.0,
        quantity: 30,
        salesStart: new Date().toISOString(),
        salesEnd: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        eventId,
      });

    // Create some orders for stats
    for (let i = 0; i < 3; i++) {
      const buyerResponse = await request(app).post('/api/auth/register').send({
        email: `stats-buyer-${Date.now()}-${i}@example.com`,
        password: 'Test@123456',
        name: `Stats Buyer ${i}`,
      });

      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerResponse.body.accessToken}`)
        .send({
          eventId,
          items: [{ ticketId, quantity: 2 }],
          paymentMethod: i % 2 === 0 ? 'CREDIT_CARD' : 'PIX',
        });

      if (i === 0) {
        orderId = orderResponse.body.id;
      }

      // Confirm order
      await prisma.order.update({
        where: { id: orderResponse.body.id },
        data: {
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
          paidAt: new Date(),
        },
      });
    }
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
            email: { in: [organizerUser.email, regularUser.email, anotherOrganizerUser.email] },
          },
        },
      });
      await prisma.user.deleteMany({
        where: {
          email: { in: [organizerUser.email, regularUser.email, anotherOrganizerUser.email] },
        },
      });

      // Delete test buyers
      await prisma.refreshToken.deleteMany({
        where: { user: { email: { contains: 'stats-buyer' } } },
      });
      await prisma.user.deleteMany({
        where: { email: { contains: 'stats-buyer' } },
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  // ============================================
  // ORGANIZER STATS
  // ============================================
  describe('GET /api/stats/organizer', () => {
    it('should get organizer stats', async () => {
      const response = await request(app)
        .get('/api/stats/organizer')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
      expect(response.body.totalEvents).toBeDefined();
      expect(response.body.totalOrders).toBeDefined();
      expect(response.body.totalRevenue).toBeDefined();
    });

    it('should not get organizer stats without authentication', async () => {
      const response = await request(app).get('/api/stats/organizer');

      expect(response.status).toBe(401);
    });

    it('should not get organizer stats as regular user', async () => {
      const response = await request(app)
        .get('/api/stats/organizer')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });

    it('should return correct total events count', async () => {
      const response = await request(app)
        .get('/api/stats/organizer')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.totalEvents).toBeGreaterThanOrEqual(1);
    });

    it('should return correct total orders count', async () => {
      const response = await request(app)
        .get('/api/stats/organizer')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.totalOrders).toBeGreaterThanOrEqual(3);
    });

    it('should return correct total revenue', async () => {
      const response = await request(app)
        .get('/api/stats/organizer')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      // 3 orders x 2 tickets x $75 = $450
      expect(response.body.totalRevenue).toBeGreaterThanOrEqual(450);
    });

    it('should include recent orders', async () => {
      const response = await request(app)
        .get('/api/stats/organizer')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      if (response.body.recentOrders) {
        expect(Array.isArray(response.body.recentOrders)).toBe(true);
      }
    });

    it('should include upcoming events', async () => {
      const response = await request(app)
        .get('/api/stats/organizer')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      if (response.body.upcomingEvents) {
        expect(Array.isArray(response.body.upcomingEvents)).toBe(true);
      }
    });

    it('should only show own stats to organizer', async () => {
      // Get stats for another organizer who has no events
      const response = await request(app)
        .get('/api/stats/organizer')
        .set('Authorization', `Bearer ${anotherOrganizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.totalEvents).toBe(0);
      expect(response.body.totalOrders).toBe(0);
    });
  });

  // ============================================
  // EVENT STATS
  // ============================================
  describe('GET /api/stats/event/:eventId', () => {
    it('should get event stats', async () => {
      const response = await request(app)
        .get(`/api/stats/event/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();
    });

    it('should not get event stats without authentication', async () => {
      const response = await request(app).get(`/api/stats/event/${eventId}`);

      expect(response.status).toBe(401);
    });

    it('should not get event stats as regular user', async () => {
      const response = await request(app)
        .get(`/api/stats/event/${eventId}`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .get('/api/stats/event/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(404);
    });

    it('should return tickets sold count', async () => {
      const response = await request(app)
        .get(`/api/stats/event/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.ticketsSold).toBeDefined();
      expect(response.body.ticketsSold).toBeGreaterThanOrEqual(6); // 3 orders x 2 tickets
    });

    it('should return total available tickets', async () => {
      const response = await request(app)
        .get(`/api/stats/event/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.totalTickets).toBeDefined();
      expect(response.body.totalTickets).toBe(130); // 100 + 30
    });

    it('should return revenue for event', async () => {
      const response = await request(app)
        .get(`/api/stats/event/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.revenue).toBeDefined();
      expect(response.body.revenue).toBeGreaterThanOrEqual(450);
    });

    it('should return check-in stats', async () => {
      const response = await request(app)
        .get(`/api/stats/event/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.checkedIn).toBeDefined();
      expect(response.body.checkedIn).toBeGreaterThanOrEqual(0);
    });

    it('should return orders by payment method', async () => {
      const response = await request(app)
        .get(`/api/stats/event/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      if (response.body.ordersByPaymentMethod) {
        expect(response.body.ordersByPaymentMethod).toBeDefined();
      }
    });

    it('should return ticket type breakdown', async () => {
      const response = await request(app)
        .get(`/api/stats/event/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      if (response.body.ticketBreakdown) {
        expect(Array.isArray(response.body.ticketBreakdown)).toBe(true);
      }
    });

    it('should not get stats for event of another organizer', async () => {
      const response = await request(app)
        .get(`/api/stats/event/${eventId}`)
        .set('Authorization', `Bearer ${anotherOrganizerToken}`);

      expect(response.status).toBe(403);
    });
  });

  // ============================================
  // STATS CALCULATIONS
  // ============================================
  describe('Stats Calculations', () => {
    it('should calculate correct average order value', async () => {
      const response = await request(app)
        .get(`/api/stats/event/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      if (response.body.averageOrderValue) {
        // Each order is 2 x $75 = $150
        expect(response.body.averageOrderValue).toBe(150);
      }
    });

    it('should calculate correct sellout percentage', async () => {
      const response = await request(app)
        .get(`/api/stats/event/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      if (response.body.selloutPercentage) {
        // 6 sold / 130 total = ~4.6%
        expect(response.body.selloutPercentage).toBeGreaterThan(0);
        expect(response.body.selloutPercentage).toBeLessThan(100);
      }
    });
  });

  // ============================================
  // TIME-BASED STATS
  // ============================================
  describe('Time-based Stats', () => {
    it('should return sales by date', async () => {
      const response = await request(app)
        .get(`/api/stats/event/${eventId}`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      if (response.body.salesByDate) {
        expect(Array.isArray(response.body.salesByDate)).toBe(true);
      }
    });

    it('should filter organizer stats by date range', async () => {
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = new Date().toISOString();

      const response = await request(app)
        .get('/api/stats/organizer')
        .query({ startDate, endDate })
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
    });
  });
});
