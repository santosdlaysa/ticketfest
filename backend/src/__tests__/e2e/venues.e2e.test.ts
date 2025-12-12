import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { prisma } from '../../config/database.js';

describe('Venues E2E Tests', () => {
  // Test organizer user
  const organizerUser = {
    email: `venue-organizer-${Date.now()}@example.com`,
    password: 'Test@123456',
    name: 'Venue Test Organizer',
  };

  // Test regular user
  const regularUser = {
    email: `venue-user-${Date.now()}@example.com`,
    password: 'Test@123456',
    name: 'Venue Regular User',
  };

  // Another organizer
  const anotherOrganizerUser = {
    email: `venue-organizer2-${Date.now()}@example.com`,
    password: 'Test@123456',
    name: 'Another Venue Organizer',
  };

  let organizerToken: string;
  let organizerId: string;
  let regularToken: string;
  let anotherOrganizerToken: string;
  let anotherOrganizerId: string;
  let venueId: string;

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
  });

  // Cleanup
  afterAll(async () => {
    try {
      // Delete venues
      await prisma.venue.deleteMany({
        where: {
          organizerId: { in: [organizerId, anotherOrganizerId] },
        },
      });

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
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  // ============================================
  // CREATE VENUE
  // ============================================
  describe('POST /api/venues', () => {
    const venueData = {
      name: 'Test Arena',
      address: 'Rua das Flores, 123',
      city: 'São Paulo',
      state: 'SP',
      zipCode: '01234-567',
      capacity: 5000,
      description: 'A great venue for events',
      phone: '11999999999',
      email: 'arena@test.com',
    };

    it('should create a venue as organizer', async () => {
      const response = await request(app)
        .post('/api/venues')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send(venueData);

      expect(response.status).toBe(201);
      expect(response.body.id).toBeDefined();
      expect(response.body.name).toBe(venueData.name);
      expect(response.body.city).toBe(venueData.city);
      expect(response.body.capacity).toBe(venueData.capacity);
      expect(response.body.organizerId).toBe(organizerId);

      venueId = response.body.id;
    });

    it('should not create venue without authentication', async () => {
      const response = await request(app).post('/api/venues').send(venueData);

      expect(response.status).toBe(401);
    });

    it('should not create venue as regular user', async () => {
      const response = await request(app)
        .post('/api/venues')
        .set('Authorization', `Bearer ${regularToken}`)
        .send(venueData);

      expect(response.status).toBe(403);
    });

    it('should not create venue without required fields', async () => {
      const response = await request(app)
        .post('/api/venues')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Incomplete Venue',
        });

      expect(response.status).toBe(400);
    });

    it('should create venue with coordinates', async () => {
      const response = await request(app)
        .post('/api/venues')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          ...venueData,
          name: 'Venue with Coordinates',
          latitude: -23.5505,
          longitude: -46.6333,
        });

      expect(response.status).toBe(201);
      expect(response.body.latitude).toBe(-23.5505);
      expect(response.body.longitude).toBe(-46.6333);
    });

    it('should create venue with images', async () => {
      const response = await request(app)
        .post('/api/venues')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          ...venueData,
          name: 'Venue with Images',
          images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
        });

      expect(response.status).toBe(201);
      expect(response.body.images).toHaveLength(2);
    });
  });

  // ============================================
  // GET ALL VENUES
  // ============================================
  describe('GET /api/venues', () => {
    it('should get all venues for organizer', async () => {
      const response = await request(app)
        .get('/api/venues')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);

      // All venues should belong to the organizer
      response.body.forEach((venue: any) => {
        expect(venue.organizerId).toBe(organizerId);
      });
    });

    it('should not get venues without authentication', async () => {
      const response = await request(app).get('/api/venues');

      expect(response.status).toBe(401);
    });

    it('should not get venues as regular user', async () => {
      const response = await request(app)
        .get('/api/venues')
        .set('Authorization', `Bearer ${regularToken}`);

      expect(response.status).toBe(403);
    });

    it('should return only own venues for each organizer', async () => {
      // Create a venue for another organizer
      await request(app)
        .post('/api/venues')
        .set('Authorization', `Bearer ${anotherOrganizerToken}`)
        .send({
          name: 'Another Organizer Venue',
          address: 'Other Street, 456',
          city: 'Rio de Janeiro',
          state: 'RJ',
        });

      // Check that first organizer doesn't see other's venues
      const response = await request(app)
        .get('/api/venues')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      response.body.forEach((venue: any) => {
        expect(venue.organizerId).toBe(organizerId);
        expect(venue.name).not.toBe('Another Organizer Venue');
      });
    });
  });

  // ============================================
  // SEARCH VENUES
  // ============================================
  describe('GET /api/venues/search', () => {
    it('should search venues by name', async () => {
      const response = await request(app)
        .get('/api/venues/search')
        .query({ q: 'Arena' })
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should search venues by city', async () => {
      const response = await request(app)
        .get('/api/venues/search')
        .query({ city: 'São Paulo' })
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return empty array for no matches', async () => {
      const response = await request(app)
        .get('/api/venues/search')
        .query({ q: 'NonExistentVenueXYZ123' })
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  // ============================================
  // GET VENUE BY ID
  // ============================================
  describe('GET /api/venues/:id', () => {
    it('should get venue by ID', async () => {
      const response = await request(app)
        .get(`/api/venues/${venueId}`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(venueId);
      expect(response.body.name).toBe('Test Arena');
    });

    it('should not get venue without authentication', async () => {
      const response = await request(app).get(`/api/venues/${venueId}`);

      expect(response.status).toBe(401);
    });

    it('should not get venue of another organizer', async () => {
      const response = await request(app)
        .get(`/api/venues/${venueId}`)
        .set('Authorization', `Bearer ${anotherOrganizerToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent venue', async () => {
      const response = await request(app)
        .get('/api/venues/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // UPDATE VENUE
  // ============================================
  describe('PUT /api/venues/:id', () => {
    it('should update venue', async () => {
      const response = await request(app)
        .put(`/api/venues/${venueId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Updated Arena',
          capacity: 10000,
        });

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Updated Arena');
      expect(response.body.capacity).toBe(10000);
    });

    it('should not update venue without authentication', async () => {
      const response = await request(app).put(`/api/venues/${venueId}`).send({
        name: 'Should Not Update',
      });

      expect(response.status).toBe(401);
    });

    it('should not update venue of another organizer', async () => {
      const response = await request(app)
        .put(`/api/venues/${venueId}`)
        .set('Authorization', `Bearer ${anotherOrganizerToken}`)
        .send({
          name: 'Should Not Update',
        });

      expect(response.status).toBe(403);
    });

    it('should update venue address', async () => {
      const response = await request(app)
        .put(`/api/venues/${venueId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          address: 'Avenida Paulista, 1000',
          zipCode: '01310-100',
        });

      expect(response.status).toBe(200);
      expect(response.body.address).toBe('Avenida Paulista, 1000');
      expect(response.body.zipCode).toBe('01310-100');
    });

    it('should update venue images', async () => {
      const newImages = ['https://example.com/new1.jpg', 'https://example.com/new2.jpg'];

      const response = await request(app)
        .put(`/api/venues/${venueId}`)
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          images: newImages,
        });

      expect(response.status).toBe(200);
      expect(response.body.images).toEqual(newImages);
    });

    it('should return 404 for non-existent venue', async () => {
      const response = await request(app)
        .put('/api/venues/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Should Not Update',
        });

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // DELETE VENUE
  // ============================================
  describe('DELETE /api/venues/:id', () => {
    let venueToDeleteId: string;

    beforeAll(async () => {
      // Create a venue to delete
      const response = await request(app)
        .post('/api/venues')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Venue to Delete',
          address: 'Delete Street, 999',
          city: 'São Paulo',
          state: 'SP',
        });
      venueToDeleteId = response.body.id;
    });

    it('should not delete venue without authentication', async () => {
      const response = await request(app).delete(`/api/venues/${venueToDeleteId}`);

      expect(response.status).toBe(401);
    });

    it('should not delete venue of another organizer', async () => {
      const response = await request(app)
        .delete(`/api/venues/${venueToDeleteId}`)
        .set('Authorization', `Bearer ${anotherOrganizerToken}`);

      expect(response.status).toBe(403);
    });

    it('should delete venue', async () => {
      const response = await request(app)
        .delete(`/api/venues/${venueToDeleteId}`)
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(200);

      // Verify venue is deleted
      const getResponse = await request(app)
        .get(`/api/venues/${venueToDeleteId}`)
        .set('Authorization', `Bearer ${organizerToken}`);
      expect(getResponse.status).toBe(404);
    });

    it('should return 404 for non-existent venue', async () => {
      const response = await request(app)
        .delete('/api/venues/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${organizerToken}`);

      expect(response.status).toBe(404);
    });

    it('should not delete venue with associated events', async () => {
      // Create a venue
      const venueResponse = await request(app)
        .post('/api/venues')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Venue with Event',
          address: 'Event Street, 123',
          city: 'São Paulo',
          state: 'SP',
        });

      const venueWithEventId = venueResponse.body.id;

      // Create an event at this venue
      await request(app)
        .post('/api/events')
        .set('Authorization', `Bearer ${organizerToken}`)
        .send({
          name: 'Event at Venue',
          description: 'Test event',
          date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          location: 'Venue with Event',
          address: 'Event Street, 123',
          category: 'SHOW',
          venueId: venueWithEventId,
        });

      // Try to delete the venue
      const deleteResponse = await request(app)
        .delete(`/api/venues/${venueWithEventId}`)
        .set('Authorization', `Bearer ${organizerToken}`);

      // Should fail because venue has associated events
      expect(deleteResponse.status).toBe(400);

      // Cleanup
      await prisma.event.deleteMany({ where: { venueId: venueWithEventId } });
      await prisma.venue.delete({ where: { id: venueWithEventId } });
    });
  });
});
