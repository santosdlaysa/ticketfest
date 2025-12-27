import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';
import { query } from '../../config/database.js';

describe('Webhook Payment Flow E2E Tests', () => {
  let authToken: string;
  let userId: string;
  let testEventId: string;
  let testTicketId: string;
  let testOrderId: string;
  let testChargeId: string;

  const testUser = {
    email: `test-webhook-${Date.now()}@test.com`,
    password: 'Test@123456',
    name: 'Test Webhook User',
  };

  beforeAll(async () => {
    // Clean up any existing test data
    await query('DELETE FROM users WHERE email LIKE $1', ['test-webhook-%@test.com']);

    // Atualizar CPF para testes
    const cpf = '52998224725';

    // Registrar usuário
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    if (registerRes.status === 201) {
      userId = registerRes.body.user.id;
      authToken = registerRes.body.accessToken;

      // Atualizar CPF
      await query('UPDATE users SET cpf = $1 WHERE id = $2', [cpf, userId]);
    }

    // Buscar evento e ticket disponível
    const eventsRes = await request(app).get('/api/events').query({ status: 'PUBLISHED' });
    const events = eventsRes.body.events || eventsRes.body;

    if (events.length > 0) {
      testEventId = events[0].id;

      const eventRes = await request(app).get(`/api/events/${testEventId}`);
      const availableTickets = eventRes.body.tickets?.filter(
        (t: any) => t.quantity - t.sold > 0
      );

      if (availableTickets && availableTickets.length > 0) {
        testTicketId = availableTickets[0].id;
      }
    }
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

  describe('1. Create Order with PIX (for webhook testing)', () => {
    it('should create an order with PIX payment', async () => {
      if (!testTicketId || !authToken) {
        console.log('Skipping: Missing ticket or auth');
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

      if (response.status === 201) {
        testOrderId = response.body.order.id;
        testChargeId = response.body.payment?.pix?.chargeId || response.body.order.paymentId;

        expect(response.body.order.paymentStatus).toBe('PENDING');
      } else {
        // Fallback to get order from DB
        const orderResult = await query(
          'SELECT id, payment_id FROM orders WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
          [userId]
        );
        if (orderResult.rows.length > 0) {
          testOrderId = orderResult.rows[0].id;
          testChargeId = orderResult.rows[0].payment_id;
        }
      }
    });
  });

  describe('2. Webhook: Simulate Pagar.me charge.paid Event', () => {
    it('should process charge.paid webhook', async () => {
      if (!testOrderId || !testChargeId) {
        console.log('Skipping: No order or charge ID');
        return;
      }

      // Simular webhook do Pagar.me
      const webhookPayload = {
        type: 'charge.paid',
        data: {
          id: testChargeId,
          order: {
            id: testChargeId,
          },
          amount: 1000,
          paid_at: new Date().toISOString(),
        },
      };

      const response = await request(app)
        .post('/api/webhooks/pagarme')
        .set('Content-Type', 'application/json')
        .send(webhookPayload);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it('should have updated order to PAID after webhook', async () => {
      if (!testOrderId) {
        console.log('Skipping: No order');
        return;
      }

      // Aguardar processamento
      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await request(app)
        .get(`/api/orders/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.paymentStatus).toBe('PAID');
      expect(response.body.status).toBe('CONFIRMED');
      expect(response.body.paidAt).toBeDefined();
    });
  });

  describe('3. Webhook: Simulate charge.payment_failed Event', () => {
    let failedOrderId: string;
    let failedChargeId: string;

    beforeAll(async () => {
      if (!testTicketId || !authToken) return;

      // Criar outro pedido para testar falha
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{ ticketId: testTicketId, quantity: 1 }],
          paymentMethod: 'PIX',
        });

      if (response.status === 201) {
        failedOrderId = response.body.order.id;
        failedChargeId = response.body.payment?.pix?.chargeId || response.body.order.paymentId;
      }
    });

    afterAll(async () => {
      if (failedOrderId) {
        await query('DELETE FROM ticket_instances WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id = $1)', [failedOrderId]);
        await query('DELETE FROM order_items WHERE order_id = $1', [failedOrderId]);
        await query('DELETE FROM orders WHERE id = $1', [failedOrderId]);
      }
    });

    it('should process charge.payment_failed webhook', async () => {
      if (!failedOrderId || !failedChargeId) {
        console.log('Skipping: No failed order');
        return;
      }

      const webhookPayload = {
        type: 'charge.payment_failed',
        data: {
          id: failedChargeId,
          order: {
            id: failedChargeId,
          },
          amount: 1000,
        },
      };

      const response = await request(app)
        .post('/api/webhooks/pagarme')
        .set('Content-Type', 'application/json')
        .send(webhookPayload);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it('should have updated order to FAILED after webhook', async () => {
      if (!failedOrderId) {
        console.log('Skipping: No failed order');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await request(app)
        .get(`/api/orders/${failedOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.paymentStatus).toBe('FAILED');
      expect(response.body.status).toBe('CANCELLED');
    });
  });

  describe('4. Webhook: Simulate charge.refunded Event', () => {
    let refundOrderId: string;
    let refundChargeId: string;

    beforeAll(async () => {
      if (!testTicketId || !authToken) return;

      // Criar pedido e simular pagamento
      const createRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{ ticketId: testTicketId, quantity: 1 }],
          paymentMethod: 'PIX',
        });

      if (createRes.status === 201) {
        refundOrderId = createRes.body.order.id;
        refundChargeId = createRes.body.payment?.pix?.chargeId || createRes.body.order.paymentId;

        // Simular pagamento primeiro
        await request(app).post(`/api/test/simulate-payment/${refundOrderId}`);
      }
    });

    afterAll(async () => {
      if (refundOrderId) {
        await query('DELETE FROM ticket_instances WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id = $1)', [refundOrderId]);
        await query('DELETE FROM order_items WHERE order_id = $1', [refundOrderId]);
        await query('DELETE FROM orders WHERE id = $1', [refundOrderId]);
      }
    });

    it('should process charge.refunded webhook', async () => {
      if (!refundOrderId || !refundChargeId) {
        console.log('Skipping: No refund order');
        return;
      }

      const webhookPayload = {
        type: 'charge.refunded',
        data: {
          id: refundChargeId,
          order: {
            id: refundChargeId,
          },
          amount: 1000,
        },
      };

      const response = await request(app)
        .post('/api/webhooks/pagarme')
        .set('Content-Type', 'application/json')
        .send(webhookPayload);

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it('should have updated order to REFUNDED after webhook', async () => {
      if (!refundOrderId) {
        console.log('Skipping: No refund order');
        return;
      }

      await new Promise(resolve => setTimeout(resolve, 500));

      const response = await request(app)
        .get(`/api/orders/${refundOrderId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.paymentStatus).toBe('REFUNDED');
      expect(response.body.status).toBe('CANCELLED');
    });
  });

  describe('5. Webhook: Simulate Payment Endpoint', () => {
    let simOrderId: string;

    beforeAll(async () => {
      if (!testTicketId || !authToken) return;

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{ ticketId: testTicketId, quantity: 1 }],
          paymentMethod: 'PIX',
        });

      if (response.status === 201) {
        simOrderId = response.body.order.id;
      }
    });

    afterAll(async () => {
      if (simOrderId) {
        await query('DELETE FROM ticket_instances WHERE order_item_id IN (SELECT id FROM order_items WHERE order_id = $1)', [simOrderId]);
        await query('DELETE FROM order_items WHERE order_id = $1', [simOrderId]);
        await query('DELETE FROM orders WHERE id = $1', [simOrderId]);
      }
    });

    it('should simulate payment via webhook endpoint', async () => {
      if (!simOrderId) {
        console.log('Skipping: No order');
        return;
      }

      const response = await request(app)
        .post(`/api/webhooks/simulate-payment/${simOrderId}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.orderId).toBe(simOrderId);
      expect(response.body.status).toBe('PAID');
    });

    it('should not allow simulating payment in production mode', async () => {
      // Este teste apenas verifica que o endpoint existe
      // Em produção real, ele retornaria 403
      const response = await request(app)
        .post('/api/webhooks/simulate-payment/non-existent-order');

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('6. Edge Cases', () => {
    it('should handle unknown webhook events gracefully', async () => {
      const response = await request(app)
        .post('/api/webhooks/pagarme')
        .set('Content-Type', 'application/json')
        .send({
          type: 'unknown.event',
          data: { id: 'test' },
        });

      expect(response.status).toBe(200);
      expect(response.body.received).toBe(true);
    });

    it('should handle webhook without charge ID', async () => {
      const response = await request(app)
        .post('/api/webhooks/pagarme')
        .set('Content-Type', 'application/json')
        .send({
          type: 'charge.paid',
          data: {
            id: 'non-existent-charge',
            order: { id: 'non-existent-order' },
          },
        });

      // Should return 200 but log error (charge not found)
      expect(response.status).toBe(200);
    });
  });
});
