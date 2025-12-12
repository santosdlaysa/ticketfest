import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { prisma } from '../../config/database.js';

describe('Cart E2E Tests', () => {
  // Test organizer user
  const organizerUser = {
    email: `cart-organizer-${Date.now()}@example.com`,
    password: 'Test@123456',
    name: 'Cart Test Organizer',
  };

  let organizerToken: string;
  let organizerId: string;
  let eventId: string;
  let ticketId: string;
  let ticketId2: string;
  let sessionId: string;

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

    // Create event
    const eventResponse = await request(app)
      .post('/api/events')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        name: 'Event for Cart',
        description: 'Test event for cart tests',
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

    // Create first ticket type
    const ticketResponse = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        name: 'Regular Ticket',
        description: 'Standard admission',
        price: 50.0,
        quantity: 100,
        salesStart: new Date().toISOString(),
        salesEnd: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        eventId,
      });
    ticketId = ticketResponse.body.id;

    // Create second ticket type
    const ticketResponse2 = await request(app)
      .post('/api/tickets')
      .set('Authorization', `Bearer ${organizerToken}`)
      .send({
        name: 'VIP Ticket',
        description: 'VIP admission',
        price: 150.0,
        quantity: 50,
        salesStart: new Date().toISOString(),
        salesEnd: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString(),
        eventId,
      });
    ticketId2 = ticketResponse2.body.id;

    // Generate a unique session ID for testing
    sessionId = `test-session-${Date.now()}`;
  });

  // Clear cart before each test
  beforeEach(async () => {
    try {
      await prisma.cartItem.deleteMany({
        where: { cart: { sessionId } },
      });
      await prisma.cart.deleteMany({
        where: { sessionId },
      });
    } catch (error) {
      // Ignore errors
    }
  });

  // Cleanup
  afterAll(async () => {
    try {
      // Delete carts
      await prisma.cartItem.deleteMany({
        where: { cart: { sessionId: { startsWith: 'test-session' } } },
      });
      await prisma.cart.deleteMany({
        where: { sessionId: { startsWith: 'test-session' } },
      });

      // Delete tickets
      await prisma.ticket.deleteMany({ where: { eventId } });

      // Delete event
      await prisma.event.deleteMany({ where: { id: eventId } });

      // Delete users
      await prisma.refreshToken.deleteMany({
        where: { user: { email: organizerUser.email } },
      });
      await prisma.user.deleteMany({
        where: { email: organizerUser.email },
      });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  // ============================================
  // GET CART
  // ============================================
  describe('GET /api/cart', () => {
    it('should get empty cart', async () => {
      const response = await request(app)
        .get('/api/cart')
        .set('Cookie', `sessionId=${sessionId}`);

      expect(response.status).toBe(200);
      expect(response.body.items).toBeDefined();
      expect(response.body.items).toEqual([]);
    });

    it('should create cart with session if not exists', async () => {
      const newSessionId = `new-session-${Date.now()}`;

      const response = await request(app)
        .get('/api/cart')
        .set('Cookie', `sessionId=${newSessionId}`);

      expect(response.status).toBe(200);
      expect(response.body).toBeDefined();

      // Cleanup
      await prisma.cart.deleteMany({ where: { sessionId: newSessionId } });
    });
  });

  // ============================================
  // ADD TO CART
  // ============================================
  describe('POST /api/cart/add', () => {
    it('should add item to cart', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({
          ticketId,
          quantity: 2,
        });

      expect(response.status).toBe(200);
      expect(response.body.items).toBeDefined();
      expect(response.body.items.length).toBe(1);
      expect(response.body.items[0].ticketId).toBe(ticketId);
      expect(response.body.items[0].quantity).toBe(2);
    });

    it('should add multiple items to cart', async () => {
      // Add first item
      await request(app)
        .post('/api/cart/add')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({
          ticketId,
          quantity: 1,
        });

      // Add second item
      const response = await request(app)
        .post('/api/cart/add')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({
          ticketId: ticketId2,
          quantity: 2,
        });

      expect(response.status).toBe(200);
      expect(response.body.items.length).toBe(2);
    });

    it('should increase quantity if same ticket added again', async () => {
      // Add item
      await request(app)
        .post('/api/cart/add')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({
          ticketId,
          quantity: 1,
        });

      // Add same item again
      const response = await request(app)
        .post('/api/cart/add')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({
          ticketId,
          quantity: 2,
        });

      expect(response.status).toBe(200);

      const item = response.body.items.find((i: any) => i.ticketId === ticketId);
      expect(item.quantity).toBe(3);
    });

    it('should not add item with invalid ticket', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({
          ticketId: '00000000-0000-0000-0000-000000000000',
          quantity: 1,
        });

      expect(response.status).toBe(404);
    });

    it('should not add item with zero quantity', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({
          ticketId,
          quantity: 0,
        });

      expect(response.status).toBe(400);
    });

    it('should not add item with negative quantity', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({
          ticketId,
          quantity: -1,
        });

      expect(response.status).toBe(400);
    });

    it('should not exceed available quantity', async () => {
      // Try to add more than available
      const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
      const availableQuantity = (ticket?.quantity || 0) - (ticket?.sold || 0);

      const response = await request(app)
        .post('/api/cart/add')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({
          ticketId,
          quantity: availableQuantity + 100,
        });

      expect(response.status).toBe(400);
    });
  });

  // ============================================
  // UPDATE CART ITEM
  // ============================================
  describe('PUT /api/cart/item/:itemId', () => {
    let cartItemId: string;

    beforeEach(async () => {
      // Add an item to cart first
      const addResponse = await request(app)
        .post('/api/cart/add')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({
          ticketId,
          quantity: 2,
        });

      cartItemId = addResponse.body.items[0].id;
    });

    it('should update cart item quantity', async () => {
      const response = await request(app)
        .put(`/api/cart/item/${cartItemId}`)
        .set('Cookie', `sessionId=${sessionId}`)
        .send({
          quantity: 5,
        });

      expect(response.status).toBe(200);

      const item = response.body.items.find((i: any) => i.id === cartItemId);
      expect(item.quantity).toBe(5);
    });

    it('should remove item when quantity is set to 0', async () => {
      const response = await request(app)
        .put(`/api/cart/item/${cartItemId}`)
        .set('Cookie', `sessionId=${sessionId}`)
        .send({
          quantity: 0,
        });

      expect(response.status).toBe(200);
      expect(response.body.items.find((i: any) => i.id === cartItemId)).toBeUndefined();
    });

    it('should not update with negative quantity', async () => {
      const response = await request(app)
        .put(`/api/cart/item/${cartItemId}`)
        .set('Cookie', `sessionId=${sessionId}`)
        .send({
          quantity: -1,
        });

      expect(response.status).toBe(400);
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .put('/api/cart/item/00000000-0000-0000-0000-000000000000')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({
          quantity: 5,
        });

      expect(response.status).toBe(404);
    });

    it('should not exceed available quantity on update', async () => {
      const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
      const availableQuantity = (ticket?.quantity || 0) - (ticket?.sold || 0);

      const response = await request(app)
        .put(`/api/cart/item/${cartItemId}`)
        .set('Cookie', `sessionId=${sessionId}`)
        .send({
          quantity: availableQuantity + 100,
        });

      expect(response.status).toBe(400);
    });
  });

  // ============================================
  // REMOVE FROM CART
  // ============================================
  describe('DELETE /api/cart/item/:itemId', () => {
    let cartItemId: string;

    beforeEach(async () => {
      // Add an item to cart first
      const addResponse = await request(app)
        .post('/api/cart/add')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({
          ticketId,
          quantity: 2,
        });

      cartItemId = addResponse.body.items[0].id;
    });

    it('should remove item from cart', async () => {
      const response = await request(app)
        .delete(`/api/cart/item/${cartItemId}`)
        .set('Cookie', `sessionId=${sessionId}`);

      expect(response.status).toBe(200);
      expect(response.body.items.find((i: any) => i.id === cartItemId)).toBeUndefined();
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .delete('/api/cart/item/00000000-0000-0000-0000-000000000000')
        .set('Cookie', `sessionId=${sessionId}`);

      expect(response.status).toBe(404);
    });
  });

  // ============================================
  // CLEAR CART
  // ============================================
  describe('DELETE /api/cart/clear', () => {
    beforeEach(async () => {
      // Add items to cart first
      await request(app)
        .post('/api/cart/add')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({
          ticketId,
          quantity: 2,
        });

      await request(app)
        .post('/api/cart/add')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({
          ticketId: ticketId2,
          quantity: 1,
        });
    });

    it('should clear all items from cart', async () => {
      const response = await request(app)
        .delete('/api/cart/clear')
        .set('Cookie', `sessionId=${sessionId}`);

      expect(response.status).toBe(200);
      expect(response.body.items).toEqual([]);
    });

    it('should handle clearing empty cart', async () => {
      // Clear first
      await request(app)
        .delete('/api/cart/clear')
        .set('Cookie', `sessionId=${sessionId}`);

      // Clear again
      const response = await request(app)
        .delete('/api/cart/clear')
        .set('Cookie', `sessionId=${sessionId}`);

      expect(response.status).toBe(200);
      expect(response.body.items).toEqual([]);
    });
  });

  // ============================================
  // CART TOTAL CALCULATION
  // ============================================
  describe('Cart Total Calculation', () => {
    it('should calculate cart total correctly', async () => {
      // Add regular ticket (2 x $50 = $100)
      await request(app)
        .post('/api/cart/add')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({
          ticketId,
          quantity: 2,
        });

      // Add VIP ticket (1 x $150 = $150)
      const response = await request(app)
        .post('/api/cart/add')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({
          ticketId: ticketId2,
          quantity: 1,
        });

      expect(response.status).toBe(200);
      expect(response.body.total).toBe(250); // $100 + $150
    });

    it('should update total when item quantity changes', async () => {
      // Add item
      const addResponse = await request(app)
        .post('/api/cart/add')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({
          ticketId,
          quantity: 2,
        });

      const cartItemId = addResponse.body.items[0].id;
      expect(addResponse.body.total).toBe(100); // 2 x $50

      // Update quantity
      const updateResponse = await request(app)
        .put(`/api/cart/item/${cartItemId}`)
        .set('Cookie', `sessionId=${sessionId}`)
        .send({
          quantity: 4,
        });

      expect(updateResponse.body.total).toBe(200); // 4 x $50
    });

    it('should update total when item is removed', async () => {
      // Add regular ticket
      const addResponse1 = await request(app)
        .post('/api/cart/add')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({
          ticketId,
          quantity: 2,
        });

      // Add VIP ticket
      const addResponse2 = await request(app)
        .post('/api/cart/add')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({
          ticketId: ticketId2,
          quantity: 1,
        });

      expect(addResponse2.body.total).toBe(250);

      // Remove regular ticket
      const cartItemId = addResponse2.body.items.find((i: any) => i.ticketId === ticketId).id;

      const removeResponse = await request(app)
        .delete(`/api/cart/item/${cartItemId}`)
        .set('Cookie', `sessionId=${sessionId}`);

      expect(removeResponse.body.total).toBe(150); // Only VIP ticket
    });
  });

  // ============================================
  // CART EXPIRATION
  // ============================================
  describe('Cart Expiration', () => {
    it('should have expiration date on cart', async () => {
      // Add item to create cart
      await request(app)
        .post('/api/cart/add')
        .set('Cookie', `sessionId=${sessionId}`)
        .send({
          ticketId,
          quantity: 1,
        });

      const cart = await prisma.cart.findFirst({
        where: { sessionId },
      });

      expect(cart?.expiresAt).toBeDefined();
      expect(new Date(cart!.expiresAt).getTime()).toBeGreaterThan(Date.now());
    });
  });
});
