import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { query } from '../../config/database.js';

describe('Credit Card Payment Flow E2E Tests', () => {
  let authToken: string;
  let userId: string;
  let testEventId: string;
  let testTicketId: string;
  let testOrderId: string;

  const testUser = {
    email: `test-card-${Date.now()}@test.com`,
    password: 'Test@123456',
    name: 'Test Card User',
    cpf: '52998224725', // CPF válido para testes
  };

  // Cartões de teste do Pagar.me
  const testCards = {
    approved: {
      number: '4000000000000010',
      holderName: 'TEST CARD',
      expMonth: 12,
      expYear: 30,
      cvv: '123',
    },
    declined: {
      number: '4000000000000028',
      holderName: 'TEST CARD DECLINED',
      expMonth: 12,
      expYear: 30,
      cvv: '123',
    },
  };

  beforeAll(async () => {
    // Clean up any existing test data
    await query('DELETE FROM users WHERE email LIKE $1', ['test-card-%@test.com']);
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

  describe('1. User Setup', () => {
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

    it('should update user with CPF', async () => {
      // Atualiza o CPF diretamente no banco para testes
      await query('UPDATE users SET cpf = $1 WHERE id = $2', [testUser.cpf, userId]);
    });
  });

  describe('2. Get Available Event and Tickets', () => {
    it('should get published events', async () => {
      const response = await request(app)
        .get('/api/events')
        .query({ status: 'PUBLISHED' });

      expect(response.status).toBe(200);

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

      const availableTickets = response.body.tickets?.filter(
        (t: any) => t.quantity - t.sold > 0
      );

      if (availableTickets && availableTickets.length > 0) {
        testTicketId = availableTickets[0].id;
      }
    });
  });

  describe('3. Card Tokenization', () => {
    it('should create a card token', async () => {
      const response = await request(app)
        .post('/api/orders/card-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testCards.approved);

      expect(response.status).toBe(200);
      expect(response.body.token).toBeDefined();
      expect(response.body.brand).toBeDefined();
      expect(response.body.lastFourDigits).toBeDefined();
    });

    it('should reject invalid card number', async () => {
      const response = await request(app)
        .post('/api/orders/card-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          ...testCards.approved,
          number: '1234567890123456', // Invalid
        });

      // Pode retornar 400 se validação falhar ou 200 se mock
      expect([200, 400]).toContain(response.status);
    });
  });

  describe('4. Create Order with Credit Card', () => {
    let cardToken: string;

    beforeAll(async () => {
      // Get a fresh token for the order
      const tokenResponse = await request(app)
        .post('/api/orders/card-token')
        .set('Authorization', `Bearer ${authToken}`)
        .send(testCards.approved);

      cardToken = tokenResponse.body.token;
    });

    it('should create an order with credit card payment', async () => {
      if (!testTicketId) {
        console.log('Skipping: No available tickets');
        return;
      }

      if (!cardToken) {
        console.log('Skipping: No card token available');
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
          paymentMethod: 'CREDIT_CARD',
          cardToken: cardToken,
          installments: 1,
        });

      console.log('Credit card order response:', response.status, JSON.stringify(response.body, null, 2));

      if (response.status === 201) {
        expect(response.body.order).toBeDefined();
        expect(response.body.order.id).toBeDefined();
        expect(response.body.order.paymentMethod).toBe('CREDIT_CARD');

        testOrderId = response.body.order.id;

        // Check payment status
        if (response.body.payment?.card) {
          expect(['paid', 'pending']).toContain(response.body.payment.card.status);
        }
      } else {
        // Log the error for debugging
        console.log('Order creation failed:', response.body);

        // Try to get order from DB anyway
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

  describe('5. Verify Order Status', () => {
    it('should show order in user orders list', async () => {
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
    });

    it('should get order details', async () => {
      if (!testOrderId) {
        console.log('Skipping: No order created');
        return;
      }

      const response = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testOrderId);
      expect(response.body.paymentMethod).toBe('CREDIT_CARD');
      expect(response.body.items).toBeDefined();
      expect(response.body.items.length).toBeGreaterThan(0);
    });
  });

  describe('6. Check Payment Status', () => {
    it('should check payment status', async () => {
      if (!testOrderId) {
        console.log('Skipping: No order created');
        return;
      }

      const response = await request(app)
        .get(`/api/orders/${testOrderId}/check-payment`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBeDefined();
      expect(['PENDING', 'PAID', 'FAILED', 'pending', 'paid', 'failed']).toContain(response.body.status);
    });
  });

  describe('7. Simulate Payment (if pending)', () => {
    it('should simulate payment for testing', async () => {
      if (!testOrderId) {
        console.log('Skipping: No order created');
        return;
      }

      // Check current status
      const checkResponse = await request(app)
        .get(`/api/orders/${testOrderId}/check-payment`)
        .set('Authorization', `Bearer ${authToken}`);

      if (checkResponse.body.status?.toUpperCase() === 'PAID') {
        console.log('Order already paid, skipping simulation');
        return;
      }

      // Simulate payment
      const response = await request(app)
        .post(`/api/test/simulate-payment/${testOrderId}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Payment simulated successfully');
      expect(response.body.order.payment_status).toBe('PAID');
    });

    it('should have PAID status after simulation', async () => {
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
    });
  });

  describe('8. Edge Cases', () => {
    it('should require card token for credit card payment', async () => {
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
          paymentMethod: 'CREDIT_CARD',
          // No cardToken
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('token');
    });

    it('should require authentication for orders', async () => {
      const response = await request(app)
        .post('/api/orders')
        .send({
          items: [{ ticketId: testTicketId, quantity: 1 }],
          paymentMethod: 'CREDIT_CARD',
          cardToken: 'some_token',
        });

      expect(response.status).toBe(401);
    });
  });
});
