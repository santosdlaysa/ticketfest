import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { prisma } from '../../config/database.js';

describe('Events E2E Tests', () => {
  // Test organizer user
  const organizerUser = {
    email: `organizer-${Date.now()}@example.com`,
    password: 'Test@123456',
    name: 'Test Organizer',
  };

  // Test regular user
  const regularUser = {
    email: `user-${Date.now()}@example.com`,
    password: 'Test@123456',
    name: 'Regular User',
  };

  let organizerToken: string;
  let organizerId: string;
  let regularToken: string;
  let createdEventId: string;
  let createdEventSlug: string;
  let venueId: string;

  // Setup: Create users and get tokens
  beforeAll(async () => {
    // Register organizer
    const orgResponse = await request(app).post('/api/auth/register').send(organizerUser);
    organizerToken = orgResponse.body.accessToken;
    organizerId = orgResponse.body.user.id;

    // Update organizer role to ORGANIZER
    await prisma.user.update({
      where: { id: organizerId },
      data: { role: 'ORGANIZER' },
    });

    // Re-login to get updated token with new role
    const loginResponse = await request(app).post('/api/auth/login').send({
      email: organizerUser.email,
      password: organizerUser.password,
    });
    organizerToken = loginResponse.body.accessToken;

    // Register regular user
    const userResponse = await request(app).post('/api/auth/register').send(regularUser);
    regularToken = userResponse.body.accessToken;

    // Create a venue for events
    const venueResponse = await request(app)
      .post('/api/venues')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        name: 'Test Venue',
        address: 'Test Address 123',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567',
        capacity: 1000,
      });
    venueId = venueResponse.body.id;
  });

  // Cleanup
  afterAll(async () => {
    try {
      // Delete created event
      if (createdEventId) {
        await prisma.event.deleteMany({ where: { id: createdEventId } });
      }

      // Delete venue
      if (venueId) {
        await prisma.venue.deleteMany({ where: { id: venueId } });
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
  // CREATE EVENT
  // ============================================
  describe('POST /api/events', () => {
    const eventData = {
      name: 'Test Event',
      description: 'A test event description',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      location: 'Test Location',
      address: 'Test Address 123',
      category: 'SHOW',
      status: 'DRAFT',
    };

    it('should create an event as organizer', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({ ...eventData, venueId });

      expect(response.status).toBe(201);
      expect(response.body.name).toBe(eventData.name);
      expect(response.body.slug).toBeDefined();
      expect(response.body.organizerId).toBe(organizerId);

      createdEventId = response.body.id;
      createdEventSlug = response.body.slug;
    });

    it('should not create event without authentication', async () => {
      const response = await request(app).post('/api/events').send(eventData);

      expect(response.status).toBe(401);
    });

    it('should not create event as regular user', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${regularToken}`)
        .send(eventData);

      expect(response.status).toBe(403);
    });

    it('should not create event without required fields', async () => {
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Incomplete Event',
        });

      expect(response.status).toBe(400);
    });
  });

  // ============================================
  // GET EVENTS (Public)
  // ============================================
  describe('GET /api/events', () => {
    it('should list all published events', async () => {
      // First publish the event
      await prisma.event.update({
        where: { id: createdEventId },
        data: { status: 'PUBLISHED' },
      });

      const response = await request(app).get('/api/events');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should get event by ID', async () => {
      const response = await request(app).get(`/api/events/${createdEventId}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(createdEventId);
      expect(response.body.name).toBe('Test Event');
    });

    it('should get event by slug', async () => {
      const response = await request(app).get(`/api/events/slug/${createdEventSlug}`);

      expect(response.status).toBe(200);
      expect(response.body.slug).toBe(createdEventSlug);
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app).get('/api/events/non-existent-id');

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // GET FEATURED EVENTS
  // ============================================
  describe('GET /api/events/featured', () => {
    it('should get featured events', async () => {
      const response = await request(app).get('/api/events/featured');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  // ============================================
  // GET EVENTS BY CATEGORY
  // ============================================
  describe('GET /api/events/category/:category', () => {
    it('should get events by category', async () => {
      const response = await request(app).get('/api/events/category/SHOW');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return empty array for non-existent category', async () => {
      const response = await request(app).get('/api/events/category/NON_EXISTENT');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  // ============================================
  // UPDATE EVENT
  // ============================================
  describe('PUT /api/events/:id', () => {
    it('should update event as organizer', async () => {
      const response = await request(app)
        .put(`/api/events/${createdEventId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Updated Event Name',
          description: 'Updated description',
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Event Name');
    });

    it('should not update event without authentication', async () => {
      const response = await request(app).put(`/api/events/${createdEventId}`).send({
        name: 'Should Not Update',
      });

      expect(response.status).toBe(401);
    });

    it('should not update event as regular user', async () => {
      const response = await request(app)
        .put(`/api/events/${createdEventId}`)
        .set('Authorization', `Bearer ${regularToken}`)
        .send({
          name: 'Should Not Update',
        });

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .put('/api/events/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Should Not Update',
        });

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // SPLIT RULES
  // ============================================
  describe('Split Rules', () => {
    let organizerAccountId: string;

    beforeAll(async () => {
      // Create organizer account for split rules
      const accountResponse = await request(app)
        .post('/api/split/account')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          companyName: 'Test Company',
          cnpj: '12345678901234',
        });

      organizerAccountId = accountResponse.body.id;

      // Verify the account (simulate admin action)
      await prisma.organizerAccount.update({
        where: { id: organizerAccountId },
        data: { verified: true, verifiedAt: new Date() },
      });
    });

    describe('POST /api/events/:id/split-rules', () => {
      it('should create split rule for event', async () => {
        const response = await request(app)
          .post(`/api/events/${createdEventId}/split-rules`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            platformPercentage: 10,
            organizerPercentage: 90,
            platformFixedFee: 0,
          });

        expect(response.status).toBe(201);
        expect(response.body.platformPercentage).toBe(10);
        expect(response.body.organizerPercentage).toBe(90);
      });

      it('should not create split rule without authentication', async () => {
        const response = await request(app)
          .post(`/api/events/${createdEventId}/split-rules`)
          .send({
            platformPercentage: 10,
            organizerPercentage: 90,
          });

        expect(response.status).toBe(401);
      });

      it('should not create split rule with invalid percentages', async () => {
        // Create another event for this test
        const eventResponse = await request(app)
          .post('/api/events')
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            name: 'Event for Invalid Split',
            description: 'Test description',
            date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'Test Location',
            address: 'Test Address',
            category: 'SHOW',
          });

        const newEventId = eventResponse.body.id;

        const response = await request(app)
          .post(`/api/events/${newEventId}/split-rules`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            platformPercentage: 50,
            organizerPercentage: 60, // Sum > 100%
          });

        expect(response.status).toBe(400);

        // Cleanup
        await prisma.event.delete({ where: { id: newEventId } });
      });
    });

    describe('GET /api/events/:id/split-rules', () => {
      it('should get split rules for event', async () => {
        const response = await request(app)
          .get(`/api/events/${createdEventId}/split-rules`)
          .set('Authorization', `Bearer ${organizerToken}`);

        expect(response.status).toBe(200);
        expect(response.body.eventId).toBe(createdEventId);
      });

      it('should not get split rules without authentication', async () => {
        const response = await request(app).get(`/api/events/${createdEventId}/split-rules`);

        expect(response.status).toBe(401);
      });
    });

    describe('PUT /api/events/:id/split-rules', () => {
      it('should update split rules', async () => {
        const response = await request(app)
          .put(`/api/events/${createdEventId}/split-rules`)
          .set('Authorization', `Bearer ${organizerToken}`)
          .send({
            platformPercentage: 15,
            organizerPercentage: 85,
          });

        expect(response.status).toBe(200);
        expect(response.body.platformPercentage).toBe(15);
        expect(response.body.organizerPercentage).toBe(85);
      });
    });

    afterAll(async () => {
      // Cleanup organizer account
      if (organizerAccountId) {
        await prisma.splitRule.deleteMany({ where: { organizerAccountId } });
        await prisma.organizerAccount.deleteMany({ where: { id: organizerAccountId } });
      }
    });
  });

  // ============================================
  // DELETE EVENT
  // ============================================
  describe('DELETE /api/events/:id', () => {
    let eventToDeleteId: string;

    beforeAll(async () => {
      // Create an event specifically for deletion test
      const response = await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Event to Delete',
          description: 'This event will be deleted',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Test Location',
          address: 'Test Address',
          category: 'SHOW',
        });
      eventToDeleteId = response.body.id;
    });

    it('should not delete event without authentication', async () => {
      const response = await request(app).delete(`/api/events/${eventToDeleteId}`);

      expect(response.status).toBe(401);
    });

    it('should not delete event as regular user', async () => {
      const response = await request(app)
        .delete(`/api/events/${eventToDeleteId}`)
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });

    it('should delete event as organizer', async () => {
      const response = await request(app)
        .delete(`/api/events/${eventToDeleteId}`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);

      // Verify event is deleted
      const getResponse = await request(app).get(`/api/events/${eventToDeleteId}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent event', async () => {
      const response = await request(app)
        .delete('/api/events/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(404);
    });
  });
});
