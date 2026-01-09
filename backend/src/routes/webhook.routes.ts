import { Router, Request, Response } from 'express';
import { query, transaction } from '../config/database.js';
import { pagarmeService } from '../services/pagarme.service.js';
import { EmailService } from '../services/email.service.js';

const router = Router();
const emailService = new EmailService();

// Pagar.me Webhook
router.post('/pagarme', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-hub-signature'] as string;
    const payload = JSON.stringify(req.body);

    // Verify webhook signature
    if (!pagarmeService.verifyWebhookSignature(payload, signature)) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const event = req.body;
    console.log('Pagar.me webhook received:', event.type);

    switch (event.type) {
      case 'charge.paid':
        await handleChargePaid(event.data);
        break;

      case 'charge.payment_failed':
        await handleChargePaymentFailed(event.data);
        break;

      case 'charge.refunded':
        await handleChargeRefunded(event.data);
        break;

      case 'charge.pending':
        // PIX generated, waiting for payment
        console.log('Charge pending:', event.data.id);
        break;

      default:
        console.log('Unhandled webhook event:', event.type);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handleChargePaid(chargeData: any) {
  const chargeId = chargeData.id;
  const pagarmeOrderId = chargeData.order?.id;

  console.log(`Processing paid charge: ${chargeId}`);

  // Find order by paymentId
  const orderResult = await query<any>(
    `SELECT o.*, u.id as user_id, u.email as user_email, u.name as user_name,
            e.id as event_id, e.name as event_name, e.date as event_date, e.location as event_location
     FROM orders o
     JOIN users u ON o.user_id = u.id
     JOIN events e ON o.event_id = e.id
     WHERE o.payment_id = $1 OR o.payment_id = $2`,
    [chargeId, pagarmeOrderId]
  );

  if (orderResult.rows.length === 0) {
    console.error(`Order not found for charge ${chargeId}`);
    return;
  }

  const order = orderResult.rows[0];

  if (order.payment_status === 'PAID') {
    console.log(`Order ${order.id} already marked as paid`);
    return;
  }

  // Update order status
  await query(
    "UPDATE orders SET payment_status = 'PAID', status = 'CONFIRMED', paid_at = NOW() WHERE id = $1",
    [order.id]
  );

  console.log(`Order ${order.id} marked as paid`);

  // Get order items with tickets and instances
  const itemsResult = await query<any>(
    `SELECT oi.*, t.name as ticket_name
     FROM order_items oi
     JOIN tickets t ON oi.ticket_id = t.id
     WHERE oi.order_id = $1`,
    [order.id]
  );

  const instancesResult = await query<any>(
    `SELECT ti.*, oi.id as order_item_id, t.name as ticket_name
     FROM ticket_instances ti
     JOIN order_items oi ON ti.order_item_id = oi.id
     JOIN tickets t ON ti.ticket_id = t.id
     WHERE oi.order_id = $1`,
    [order.id]
  );

  // Send confirmation email
  try {
    await emailService.sendOrderConfirmation(order.user_email, {
      orderId: order.id,
      eventName: order.event_name,
      eventDate: new Date(order.event_date).toLocaleDateString('pt-BR'),
      tickets: itemsResult.rows.map((item: any) => ({
        name: item.ticket_name,
        quantity: item.quantity,
        price: item.price,
      })),
      total: order.total,
    });

    // Send tickets with QR codes
    const tickets = instancesResult.rows.map((instance: any) => ({
      eventName: order.event_name,
      eventDate: new Date(order.event_date).toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      eventLocation: order.event_location,
      ticketName: instance.ticket_name,
      qrCode: instance.qr_code,
      ticketCode: instance.id.slice(0, 8).toUpperCase(),
    }));

    await emailService.sendTickets(order.user_email, tickets);
    console.log(`Confirmation email sent for order ${order.id}`);
  } catch (emailError) {
    console.error('Failed to send confirmation email:', emailError);
  }
}

async function handleChargePaymentFailed(chargeData: any) {
  const chargeId = chargeData.id;
  const pagarmeOrderId = chargeData.order?.id;

  console.log(`Processing failed charge: ${chargeId}`);

  const orderResult = await query<any>(
    'SELECT id FROM orders WHERE payment_id = $1 OR payment_id = $2',
    [chargeId, pagarmeOrderId]
  );

  if (orderResult.rows.length === 0) {
    console.error(`Order not found for charge ${chargeId}`);
    return;
  }

  const orderId = orderResult.rows[0].id;

  // Update order status and restore ticket counts
  await transaction(async (client) => {
    await client.query(
      "UPDATE orders SET payment_status = 'FAILED', status = 'CANCELLED' WHERE id = $1",
      [orderId]
    );

    const itemsResult = await client.query<{ ticket_id: string; quantity: number }>(
      'SELECT ticket_id, quantity FROM order_items WHERE order_id = $1',
      [orderId]
    );

    for (const item of itemsResult.rows) {
      await client.query(
        'UPDATE tickets SET sold = sold - $1 WHERE id = $2',
        [item.quantity, item.ticket_id]
      );
    }
  });

  console.log(`Order ${orderId} marked as failed`);
}

async function handleChargeRefunded(chargeData: any) {
  const chargeId = chargeData.id;
  const pagarmeOrderId = chargeData.order?.id;

  console.log(`Processing refunded charge: ${chargeId}`);

  const orderResult = await query<any>(
    'SELECT id FROM orders WHERE payment_id = $1 OR payment_id = $2',
    [chargeId, pagarmeOrderId]
  );

  if (orderResult.rows.length === 0) {
    console.error(`Order not found for charge ${chargeId}`);
    return;
  }

  const orderId = orderResult.rows[0].id;

  // Update order status and restore ticket counts
  await transaction(async (client) => {
    await client.query(
      "UPDATE orders SET payment_status = 'REFUNDED', status = 'CANCELLED' WHERE id = $1",
      [orderId]
    );

    const itemsResult = await client.query<{ ticket_id: string; quantity: number }>(
      'SELECT ticket_id, quantity FROM order_items WHERE order_id = $1',
      [orderId]
    );

    for (const item of itemsResult.rows) {
      await client.query(
        'UPDATE tickets SET sold = sold - $1 WHERE id = $2',
        [item.quantity, item.ticket_id]
      );
    }
  });

  console.log(`Order ${orderId} marked as refunded`);
}

// Simular pagamento PIX (apenas para desenvolvimento)
router.post('/simulate-payment/:orderId', async (req: Request, res: Response) => {
  // Apenas em desenvolvimento
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not allowed in production' });
  }

  const { orderId } = req.params;

  try {
    // Buscar pedido
    const orderResult = await query<any>(
      `SELECT o.*, u.email as user_email, u.name as user_name,
              e.name as event_name, e.date as event_date, e.location as event_location
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN events e ON o.event_id = e.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const order = orderResult.rows[0];

    if (order.payment_status === 'PAID') {
      return res.status(400).json({ error: 'Pedido já foi pago' });
    }

    // Simular o webhook de pagamento
    await handleChargePaid({
      id: order.payment_id,
      order: { id: order.payment_id },
    });

    return res.json({
      success: true,
      message: 'Pagamento simulado com sucesso',
      orderId: order.id,
      status: 'PAID'
    });
  } catch (error) {
    console.error('Erro ao simular pagamento:', error);
    return res.status(500).json({ error: 'Erro ao simular pagamento' });
  }
});

export default router;
