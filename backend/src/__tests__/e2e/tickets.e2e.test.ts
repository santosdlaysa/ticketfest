import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { prisma } from '../../config/database.js';

describe('Tickets E2E Tests', () => {
  // Test organizer user
  const organizerUser = {
    email: `ticket-organizer-${Date.now()}@example.com`,
    password: 'Test@123456',
    name: 'Ticket Test Organizer',
  };

  // Test regular user
  const regularUser = {
    email: `ticket-user-${Date.now()}@example.com`,
    password: 'Test@123456',
    name: 'Ticket Regular User',
  };

  let organizerToken: string;
  let organizerId: string;
  let regularToken: string;
  let eventId: string;
  let ticketId: string;

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

    // Re-login
    const loginResponse = await request(app).post('/api/auth/login').send({
      email: organizerUser.email,
      password: organizerUser.password,
    });
    organizerToken = loginResponse.body.accessToken;

    // Register regular user
    const userResponse = await request(app).post('/api/auth/register').send(regularUser);
    regularToken = userResponse.body.accessToken;

    // Create an event for tickets
    const eventResponse = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        name: 'Event for Tickets',
        description: 'Test event for ticket tests',
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        location: 'Test Location',
        address: 'Test Address',
        category: 'SHOW',
      });
    eventId = eventResponse.body.id;
  });

  // Cleanup
  afterAll(async () => {
    try {
      // Delete tickets first
      await prisma.ticket.deleteMany({ where: { eventId } });

      // Delete event
      if (eventId) {
        await prisma.event.deleteMany({ where: { id: eventId } });
      }

      // Delete users
      await prisma.refreshToken.deleteMany({
        where: {
          user: {
            email: { in: [organizerUser.email, regularUser.email] },
          },
        },
      });
      await prisma.user.deleteMany({
        where: {
          email: { in: [organizerUser.email, regularUser.email] },
        },
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  // ============================================
  // CREATE TICKET
  // ============================================
  describe('POST /api/tickets', () => {
    const ticketData = {
      name: 'VIP Ticket',
      description: 'VIP access with all benefits',
      price: 150.0,
      quantity: 100,
      salesStart: new Date().toISOString(),
      salesEnd: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(), // 6 days
      features: ['VIP Area', 'Free Drinks', 'Meet & Greet'],
    };

    it('should create a ticket as organizer', async () => {
      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ ...ticketData, eventId });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(ticketData.name);
      expect(response.body.price).toBe(ticketData.price);
      expect(response.body.quantity).toBe(ticketData.quantity);
      expect(response.body.eventId).toBe(eventId);

      ticketId = response.body.id;
    });

    it('should not create ticket without authentication', async () => {
      const response = await request(app)
        .post('/api/tickets')
        .send({ ...ticketData, eventId });

      expect(response.status).toBe(401);
    });

    it('should not create ticket as regular user', async () => {
      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${regularToken}`)
        .send({ ...ticketData, eventId });

      expect(response.status).toBe(403);
    });

    it('should not create ticket without required fields', async () => {
      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Incomplete Ticket',
          eventId,
        });

      expect(response.status).toBe(400);
    });

    it('should not create ticket with invalid price', async () => {
      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          ...ticketData,
          eventId,
          price: -50,
        });

      expect(response.status).toBe(400);
    });

    it('should not create ticket with salesEnd before salesStart', async () => {
      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          ...ticketData,
          eventId,
          salesStart: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          salesEnd: new Date().toISOString(),
        });

      expect(response.status).toBe(400);
    });

    it('should create multiple ticket types for same event', async () => {
      const regularTicket = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Regular Ticket',
          description: 'Standard admission',
          price: 50.0,
          quantity: 500,
          salesStart: new Date().toISOString(),
          salesEnd: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
          eventId,
        });

      expect(regularTicket.status).toBe(201);
      expect(regularTicket.body.name).toBe('Regular Ticket');
    });
  });

  // ============================================
  // GET TICKETS BY EVENT (Public)
  // ============================================
  describe('GET /api/tickets/event/:eventId', () => {
    it('should get all tickets for an event', async () => {
      const response = await request(app).get(`/api/tickets/event/${eventId}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);
    });

    it('should return empty array for event without tickets', async () => {
      // Create a new event without tickets
      const newEventResponse = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Event Without Tickets',
          description: 'No tickets yet',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Test Location',
          address: 'Test Address',
          category: 'SHOW',
        });

      const newEventId = newEventResponse.body.id;

      const response = await request(app).get(`/api/tickets/event/${newEventId}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);

      // Cleanup
      await prisma.event.delete({ where: { id: newEventId } });
    });
  });

  // ============================================
  // GET TICKET BY ID (Public)
  // ============================================
  describe('GET /api/tickets/:id', () => {
    it('should get ticket by ID', async () => {
      const response = await request(app).get(`/api/tickets/${ticketId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(ticketId);
      expect(response.body.name).toBe('VIP Ticket');
    });

    it('should return 404 for non-existent ticket', async () => {
      const response = await request(app).get('/api/tickets/00000000-0000-0000-0000-000000000000');

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // UPDATE TICKET
  // ============================================
  describe('PUT /api/tickets/:id', () => {
    it('should update ticket as organizer', async () => {
      const response = await request(app)
        .put(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Super VIP Ticket',
          price: 200.0,
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Super VIP Ticket');
      expect(response.body.price).toBe(200.0);
    });

    it('should not update ticket without authentication', async () => {
      const response = await request(app).put(`/api/tickets/${ticketId}`).send({
        name: 'Should Not Update',
      });

      expect(response.status).toBe(401);
    });

    it('should not update ticket as regular user', async () => {
      const response = await request(app)
        .put(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          name: 'Should Not Update',
        });

      expect(response.status).toBe(403);
    });

    it('should update ticket quantity', async () => {
      const response = await request(app)
        .put(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          quantity: 150,
        });

      expect(response.status).toBe(200);
      expect(response.body.quantity).toBe(150);
    });

    it('should update ticket features', async () => {
      const newFeatures = ['VIP Area', 'Free Drinks', 'Meet & Greet', 'Backstage Access'];

      const response = await request(app)
        .put(`/api/tickets/${ticketId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          features: newFeatures,
        });

      expect(response.status).toBe(200);
      expect(response.body.features).toEqual(newFeatures);
    });

    it('should return 404 for non-existent ticket', async () => {
      const response = await request(app)
        .put('/api/tickets/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Should Not Update',
        });

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // DELETE TICKET
  // ============================================
  describe('DELETE /api/tickets/:id', () => {
    let ticketToDeleteId: string;

    beforeAll(async () => {
      // Create a ticket to delete
      const response = await request(app)
        .post('/api/tickets')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Ticket to Delete',
          description: 'This will be deleted',
          price: 30.0,
          quantity: 50,
          salesStart: new Date().toISOString(),
          salesEnd: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
          eventId,
        });
      ticketToDeleteId = response.body.id;
    });

    it('should not delete ticket without authentication', async () => {
      const response = await request(app).delete(`/api/tickets/${ticketToDeleteId}`);

      expect(response.status).toBe(401);
    });

    it('should not delete ticket as regular user', async () => {
      const response = await request(app)
        .delete(`/api/tickets/${ticketToDeleteId}`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });

    it('should delete ticket as organizer', async () => {
      const response = await request(app)
        .delete(`/api/tickets/${ticketToDeleteId}`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);

      // Verify ticket is deleted
      const getResponse = await request(app).get(`/api/tickets/${ticketToDeleteId}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent ticket', async () => {
      const response = await request(app)
        .delete('/api/tickets/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // TICKET AVAILABILITY
  // ============================================
  describe('Ticket Availability', () => {
    it('should show correct available quantity', async () => {
      const response = await request(app).get(`/api/tickets/${ticketId}`);

      expect(response.status).toBe(200);
      expect(response.body.quantity).toBeDefined();
      expect(response.body.sold).toBeDefined();
      expect(response.body.quantity - response.body.sold).toBeGreaterThanOrEqual(0);
    });
  });
});
