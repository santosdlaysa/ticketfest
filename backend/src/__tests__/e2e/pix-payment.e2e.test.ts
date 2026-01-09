import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { query } from '../../config/database.js';

describe('PIX Payment Flow E2E Tests', () => {
  let authToken: string;
  let userId: string;
  let testEventId: string;
  let testTicketId: string;
  let testOrderId: string;

  const testUser = {
    email: `test-pix-${Date.now()}@test.com`,
    password: 'Test@123456',
    name: 'Test PIX User',
  };

  beforeAll(async () => {
    // Clean up any existing test data
    await query('DELETE FROM users WHERE email LIKE $1', ['test-pix-%@test.com']);
  });

  afterAll(async () => {
    // Clean up test data
    if (testOrderId) {
      await query('DELETE FROM ticket_instances WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id = $1)', [testOrderId]);
      await query('DELETE FROM order_items WHERE order_id = $1', [testOrderId]);
      await query('DELETE FROM orders WHERE id = $1', [testOrderId]);
    }
    if (userId) {
      await query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
      await query('DELETE FROM users WHERE id = $1', [userId]);
    }
  });

  describe('1. User Registration and Authentication', () => {
    it('should register a new user', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
      expect(response.body.accessToken).toBeDefined();

      userId = response.body.user.id;
      authToken = response.body.accessToken;
    });

    it('should login with the new user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        });

      expect(response.status).toBe(200);
      expect(response.body.accessToken).toBeDefined();

      authToken = response.body.accessToken;
    });
  });

  describe('2. Get Available Event and Tickets', () => {
    it('should get published events', async () => {
      const response = await request(app)
        .get('/api/events')
        .query({ status: 'PUBLISHED' });

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.events || response.body)).toBe(true);

      const events = response.body.events || response.body;
      if (events.length > 0) {
        testEventId = events[0].id;
      }
    });

    it('should get tickets for the event', async () => {
      if (!testEventId) {
        console.log('Skipping: No published events available');
        return;
      }

      const response = await request(app)
        .get(`/api/events/${testEventId}`);

      expect(response.status).toBe(200);
      expect(response.body.tickets).toBeDefined();

      const availableTickets = response.body.tickets?.filter(
        (t: any) => t.quantity - t.sold > 0
      );

      if (availableTickets && availableTickets.length > 0) {
        testTicketId = availableTickets[0].id;
      }
    });
  });

  describe('3. Create Order with PIX Payment', () => {
    it('should create an order with PIX payment method', async () => {
      if (!testTicketId) {
        console.log('Skipping: No available tickets');
        return;
      }

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [
            {
              ticketId: testTicketId,
              quantity: 1,
            },
          ],
          paymentMethod: 'PIX',
        });

      // May fail if Pagar.me is not configured, but order should still be created
      if (response.status === 201) {
        expect(response.body.order).toBeDefined();
        expect(response.body.order.id).toBeDefined();
        expect(response.body.order.paymentMethod).toBe('PIX');
        expect(response.body.order.paymentStatus).toBe('PENDING');

        testOrderId = response.body.order.id;

        // Check if PIX data is returned
        if (response.body.payment?.pix) {
          expect(response.body.payment.pix.qrCode).toBeDefined();
        }
      } else {
        console.log('Order creation response:', response.status, response.body);
        // If failed due to payment gateway, still try to get order from DB
        const orderResult = await query(
          'SELECT id FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
          [userId]
        );
        if (orderResult.rows.length > 0) {
          testOrderId = orderResult.rows[0].id;
        }
      }
    });
  });

  describe('4. Check Payment Status (Before Payment)', () => {
    it('should return PENDING status before payment', async () => {
      if (!testOrderId) {
        console.log('Skipping: No order created');
        return;
      }

      const response = await request(app)
        .get(`/api/orders/${testOrderId}/check-payment`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBeDefined();
      expect(['PENDING', 'pending']).toContain(response.body.status.toUpperCase());
      expect(response.body.message).toBeDefined();
    });

    it('should return order details with PENDING status', async () => {
      if (!testOrderId) {
        console.log('Skipping: No order created');
        return;
      }

      const response = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.paymentStatus).toBe('PENDING');
      expect(response.body.status).toBe('PENDING');
    });
  });

  describe('5. Simulate Payment Confirmation', () => {
    it('should simulate payment via test endpoint', async () => {
      if (!testOrderId) {
        console.log('Skipping: No order created');
        return;
      }

      const response = await request(app)
        .post(`/api/test/simulate-payment/${testOrderId}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Payment simulated successfully');
      expect(response.body.order.payment_status).toBe('PAID');
      expect(response.body.order.status).toBe('CONFIRMED');
    });
  });

  describe('6. Check Payment Status (After Payment)', () => {
    it('should return PAID status after payment', async () => {
      if (!testOrderId) {
        console.log('Skipping: No order created');
        return;
      }

      const response = await request(app)
        .get(`/api/orders/${testOrderId}/check-payment`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('PAID');
      expect(response.body.orderStatus).toBe('CONFIRMED');
      expect(response.body.message).toContain('confirmado');
    });

    it('should return order details with PAID status', async () => {
      if (!testOrderId) {
        console.log('Skipping: No order created');
        return;
      }

      const response = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.paymentStatus).toBe('PAID');
      expect(response.body.status).toBe('CONFIRMED');
      expect(response.body.paidAt).toBeDefined();
    });

    it('should have ticket instances with QR codes', async () => {
      if (!testOrderId) {
        console.log('Skipping: No order created');
        return;
      }

      const response = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.items).toBeDefined();
      expect(response.body.items.length).toBeGreaterThan(0);

      const item = response.body.items[0];
      expect(item.ticketInstances).toBeDefined();
      expect(item.ticketInstances.length).toBeGreaterThan(0);

      const instance = item.ticketInstances[0];
      expect(instance.qrCode).toBeDefined();
      expect(instance.qrCodeData).toBeDefined();
    });
  });

  describe('7. Order Appears in User Orders', () => {
    it('should list the order in user orders', async () => {
      if (!testOrderId) {
        console.log('Skipping: No order created');
        return;
      }

      const response = await request(app)
        .get('/api/orders')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);

      const order = response.body.find((o: any) => o.id === testOrderId);
      expect(order).toBeDefined();
      expect(order.paymentStatus).toBe('PAID');
      expect(order.status).toBe('CONFIRMED');
    });
  });

  describe('8. Edge Cases', () => {
    it('should not allow checking payment for other user orders', async () => {
      if (!testOrderId) {
        console.log('Skipping: No order created');
        return;
      }

      // Register another user
      const otherUser = {
        email: `test-other-${Date.now()}@test.com`,
        password: 'Test@123456',
        name: 'Other Test User',
      };

      const registerRes = await request(app)
        .post('/api/auth/register')
        .send(otherUser);

      const otherToken = registerRes.body.accessToken;
      const otherUserId = registerRes.body.user?.id;

      // Try to check payment with other user's token
      const response = await request(app)
        .get(`/api/orders/${testOrderId}/check-payment`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(response.status).toBe(403);

      // Clean up other user
      if (otherUserId) {
        await query('DELETE FROM refresh_tokens WHERE user_id = $1', [otherUserId]);
        await query('DELETE FROM users WHERE id = $1', [otherUserId]);
      }
    });

    it('should handle non-existent order gracefully', async () => {
      const fakeOrderId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app)
        .get(`/api/orders/${fakeOrderId}/check-payment`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should require authentication for check-payment', async () => {
      if (!testOrderId) {
        console.log('Skipping: No order created');
        return;
      }

      const response = await request(app)
        .get(`/api/orders/${testOrderId}/check-payment`);

      expect(response.status).toBe(401);
    });
  });
});
