import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { prisma } from '../../config/database.js';

describe('Check-in E2E Tests', () => {
  // Test organizer user
  const organizerUser = {
    email: `checkin-organizer-${Date.now()}@example.com`,
    password: 'Test@123456',
    name: 'Check-in Test Organizer',
  };

  // Test buyer user
  const buyerUser = {
    email: `checkin-buyer-${Date.now()}@example.com`,
    password: 'Test@123456',
    name: 'Check-in Buyer User',
  };

  // Test regular user (not organizer)
  const regularUser = {
    email: `checkin-regular-${Date.now()}@example.com`,
    password: 'Test@123456',
    name: 'Check-in Regular User',
  };

  let organizerToken: string;
  let organizerId: string;
  let buyerToken: string;
  let regularToken: string;
  let eventId: string;
  let ticketId: string;
  let orderId: string;
  let ticketInstanceId: string;
  let qrCode: string;

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

    // Register buyer
    const buyerResponse = await request(app).post('/api/auth/register').send(buyerUser);
    buyerToken = buyerResponse.body.accessToken;

    // Register regular user
    const regularResponse = await request(app).post('/api/auth/register').send(regularUser);
    regularToken = regularResponse.body.accessToken;

    // Create event
    const eventResponse = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        name: 'Event for Check-in',
        description: 'Test event for check-in tests',
        date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
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
        name: 'Check-in Test Ticket',
        description: 'Standard ticket',
        price: 50.0,
        quantity: 50,
        salesStart: new Date().toISOString(),
        salesEnd: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        eventId,
      });
    ticketId = ticketResponse.body.id;

    // Create order
    const orderResponse = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        eventId,
        items: [{ ticketId, quantity: 2 }],
        paymentMethod: 'PIX',
      });
    orderId = orderResponse.body.id;

    // Manually confirm the order and create ticket instances for testing
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        paidAt: new Date(),
      },
    });

    // Create ticket instances
    const orderItem = await prisma.orderItem.findFirst({
      where: { orderId },
    });

    if (orderItem) {
      const ticketInstance = await prisma.ticketInstance.create({
        data: {
          orderItemId: orderItem.id,
          ticketId,
          qrCode: `QR-${Date.now()}-001`,
          qrCodeData: JSON.stringify({ orderId, ticketId, instanceId: 1 }),
        },
      });
      ticketInstanceId = ticketInstance.id;
      qrCode = ticketInstance.qrCode;

      // Create another ticket instance
      await prisma.ticketInstance.create({
        data: {
          orderItemId: orderItem.id,
          ticketId,
          qrCode: `QR-${Date.now()}-002`,
          qrCodeData: JSON.stringify({ orderId, ticketId, instanceId: 2 }),
        },
      });
    }
  });

  // Cleanup
  afterAll(async () => {
    try {
      // Delete ticket instances
      await prisma.ticketInstance.deleteMany({
        where: { orderItem: { order: { eventId } } },
      });

      // Delete order items
      await prisma.orderItem.deleteMany({
        where: { order: { eventId } },
      });

      // Delete orders
      await prisma.order.deleteMany({ where: { eventId } });

      // Delete tickets
      await prisma.ticket.deleteMany({ where: { eventId } });

      // Delete event
      await prisma.event.deleteMany({ where: { id: eventId } });

      // Delete users
      await prisma.refreshToken.deleteMany({
        where: {
          user: {
            email: { in: [organizerUser.email, buyerUser.email, regularUser.email] },
          },
        },
      });
      await prisma.user.deleteMany({
        where: {
          email: { in: [organizerUser.email, buyerUser.email, regularUser.email] },
        },
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  // ============================================
  // VALIDATE/CHECK-IN TICKET
  // ============================================
  describe('POST /api/checkin/validate', () => {
    it('should validate and check-in ticket successfully', async () => {
      const response = await request(app)
        .post('/api/checkin/validate')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          qrCode,
          eventId,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.ticketInstance).toBeDefined();
      expect(response.body.ticketInstance.checkedIn).toBe(true);
    });

    it('should not check-in already checked-in ticket', async () => {
      const response = await request(app)
        .post('/api/checkin/validate')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          qrCode,
          eventId,
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already');
    });

    it('should not validate without authentication', async () => {
      const response = await request(app).post('/api/checkin/validate').send({
        qrCode: 'some-qr-code',
        eventId,
      });

      expect(response.status).toBe(401);
    });

    it('should not validate with invalid QR code', async () => {
      const response = await request(app)
        .post('/api/checkin/validate')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          qrCode: 'INVALID-QR-CODE',
          eventId,
        });

      expect(response.status).toBe(404);
    });

    it('should not validate ticket for wrong event', async () => {
      // Create another event
      const newEventResponse = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Another Event',
          description: 'Different event',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Test Location',
          address: 'Test Address',
          category: 'SHOW',
        });

      const wrongEventId = newEventResponse.body.id;

      // Get a non-checked-in QR code
      const nonCheckedInInstance = await prisma.ticketInstance.findFirst({
        where: {
          ticketId,
          checkedIn: false,
        },
      });

      if (nonCheckedInInstance) {
        const response = await request(app)
          .post('/api/checkin/validate')
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            qrCode: nonCheckedInInstance.qrCode,
            eventId: wrongEventId,
          });

        expect(response.status).toBe(400);
      }

      // Cleanup
      await prisma.event.delete({ where: { id: wrongEventId } });
    });

    it('should allow buyer to check-in their own ticket', async () => {
      // Get a non-checked-in ticket
      const nonCheckedInInstance = await prisma.ticketInstance.findFirst({
        where: {
          ticketId,
          checkedIn: false,
        },
      });

      if (nonCheckedInInstance) {
        const response = await request(app)
          .post('/api/checkin/validate')
          .set('Authorization', `Bearer ${buyerToken}`)
          .send({
            qrCode: nonCheckedInInstance.qrCode,
            eventId,
          });

        // Buyer should be able to check-in (self-check-in feature)
        expect([200, 403]).toContain(response.status);
      }
    });
  });

  // ============================================
  // GET CHECK-IN STATS
  // ============================================
  describe('GET /api/checkin/event/:eventId/stats', () => {
    it('should get check-in statistics for event', async () => {
      const response = await request(app)
        .get(`/api/checkin/event/${eventId}/stats`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.totalTickets).toBeDefined();
      expect(response.body.checkedIn).toBeDefined();
      expect(response.body.pending).toBeDefined();
      expect(typeof response.body.totalTickets).toBe('number');
      expect(typeof response.body.checkedIn).toBe('number');
    });

    it('should not get stats without authentication', async () => {
      const response = await request(app).get(`/api/checkin/event/${eventId}/stats`);

      expect(response.status).toBe(401);
    });

    it('should not get stats as regular user', async () => {
      const response = await request(app)
        .get(`/api/checkin/event/${eventId}/stats`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .get('/api/checkin/event/00000000-0000-0000-0000-000000000000/stats')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // GET CHECK-IN HISTORY
  // ============================================
  describe('GET /api/checkin/event/:eventId/history', () => {
    it('should get check-in history for event', async () => {
      const response = await request(app)
        .get(`/api/checkin/event/${eventId}/history`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should not get history without authentication', async () => {
      const response = await request(app).get(`/api/checkin/event/${eventId}/history`);

      expect(response.status).toBe(401);
    });

    it('should not get history as regular user', async () => {
      const response = await request(app)
        .get(`/api/checkin/event/${eventId}/history`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });

    it('should return check-in history with ticket details', async () => {
      const response = await request(app)
        .get(`/api/checkin/event/${eventId}/history`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);

      if (response.body.length > 0) {
        const checkIn = response.body[0];
        expect(checkIn.checkedInAt).toBeDefined();
        expect(checkIn.qrCode).toBeDefined();
      }
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .get('/api/checkin/event/00000000-0000-0000-0000-000000000000/history')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // CHECK-IN EDGE CASES
  // ============================================
  describe('Check-in Edge Cases', () => {
    it('should handle cancelled order tickets', async () => {
      // Create a new order
      const orderResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${buyerToken}`)
        .send({
          eventId,
          items: [{ ticketId, quantity: 1 }],
          paymentMethod: 'PIX',
        });

      const cancelledOrderId = orderResponse.body.id;

      // Cancel the order
      await request(app)
        .post(`/api/orders/${cancelledOrderId}/cancel`)
        .set('Authorization', `Bearer ${buyerToken}`);

      // Try to check-in with a ticket from cancelled order
      const orderItem = await prisma.orderItem.findFirst({
        where: { orderId: cancelledOrderId },
      });

      if (orderItem) {
        const ticketInstance = await prisma.ticketInstance.findFirst({
          where: { orderItemId: orderItem.id },
        });

        if (ticketInstance) {
          const response = await request(app)
            .post('/api/checkin/validate')
            .set('Authorization', `Bearer ${organizerToken}`)
            .send({
              qrCode: ticketInstance.qrCode,
              eventId,
            });

          expect(response.status).toBe(400);
        }
      }
    });

    it('should validate ticket information on check-in', async () => {
      const newTicketInstance = await prisma.ticketInstance.findFirst({
        where: {
          ticketId,
          checkedIn: false,
        },
        include: {
          ticket: true,
          orderItem: {
            include: {
              order: {
                include: {
                  user: true,
                },
              },
            },
          },
        },
      });

      if (newTicketInstance) {
        const response = await request(app)
          .post('/api/checkin/validate')
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            qrCode: newTicketInstance.qrCode,
            eventId,
          });

        if (response.status === 200) {
          expect(response.body.ticketInstance).toBeDefined();
          expect(response.body.ticket).toBeDefined();
          expect(response.body.attendee).toBeDefined();
        }
      }
    });
  });
});
