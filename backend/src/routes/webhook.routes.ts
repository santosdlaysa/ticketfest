import { Router, Request, Response } from 'express';
import { prisma } from '../config/database.js';
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

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

async function handleChargePaid(chargeData: any) {
  const chargeId = chargeData.id;
  const pagarmeOrderId = chargeData.order?.id;

  console.log(`Processing paid charge: ${chargeId}`);

  // Find order by paymentId (which stores the chargeId)
  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { paymentId: chargeId },
        { paymentId: pagarmeOrderId },
      ],
    },
    include: {
      user: true,
      event: true,
      items: {
        include: {
          ticket: true,
          ticketInstances: true,
        },
      },
    },
  });

  if (!order) {
    console.error(`Order not found for charge ${chargeId}`);
    return;
  }

  if (order.paymentStatus === 'PAID') {
    console.log(`Order ${order.id} already marked as paid`);
    return;
  }

  // Update order status
  await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: 'PAID',
      status: 'CONFIRMED',
      paidAt: new Date(),
    },
  });

  console.log(`Order ${order.id} marked as paid`);

  // Send confirmation email
  try {
    await emailService.sendOrderConfirmation(order.user.email, {
      orderId: order.id,
      eventName: order.event.name,
      eventDate: order.event.date.toLocaleDateString('pt-BR'),
      tickets: order.items.map((item) => ({
        name: item.ticket.name,
        quantity: item.quantity,
        price: item.price,
      })),
      total: order.total,
    });

    // Send tickets with QR codes
    const tickets = order.items.flatMap((item) =>
      item.ticketInstances.map((instance) => ({
        eventName: order.event.name,
        eventDate: order.event.date.toLocaleDateString('pt-BR', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        eventLocation: order.event.location,
        ticketName: item.ticket.name,
        qrCode: instance.qrCode,
        ticketCode: instance.id.slice(0, 8).toUpperCase(),
      }))
    );

    await emailService.sendTickets(order.user.email, tickets);
    console.log(`Confirmation email sent for order ${order.id}`);
  } catch (emailError) {
    console.error('Failed to send confirmation email:', emailError);
  }
}

async function handleChargePaymentFailed(chargeData: any) {
  const chargeId = chargeData.id;
  const pagarmeOrderId = chargeData.order?.id;

  console.log(`Processing failed charge: ${chargeId}`);

  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { paymentId: chargeId },
        { paymentId: pagarmeOrderId },
      ],
    },
    include: {
      items: true,
    },
  });

  if (!order) {
    console.error(`Order not found for charge ${chargeId}`);
    return;
  }

  // Update order status and restore ticket counts
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'FAILED',
        status: 'CANCELLED',
      },
    });

    // Restore ticket counts
    for (const item of order.items) {
      await tx.ticket.update({
        where: { id: item.ticketId },
        data: { sold: { decrement: item.quantity } },
      });
    }
  });

  console.log(`Order ${order.id} marked as failed`);
}

async function handleChargeRefunded(chargeData: any) {
  const chargeId = chargeData.id;
  const pagarmeOrderId = chargeData.order?.id;

  console.log(`Processing refunded charge: ${chargeId}`);

  const order = await prisma.order.findFirst({
    where: {
      OR: [
        { paymentId: chargeId },
        { paymentId: pagarmeOrderId },
      ],
    },
    include: {
      items: true,
    },
  });

  if (!order) {
    console.error(`Order not found for charge ${chargeId}`);
    return;
  }

  // Update order status and restore ticket counts
  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus: 'REFUNDED',
        status: 'CANCELLED',
      },
    });

    // Restore ticket counts
    for (const item of order.items) {
      await tx.ticket.update({
        where: { id: item.ticketId },
        data: { sold: { decrement: item.quantity } },
      });
    }
  });

  console.log(`Order ${order.id} marked as refunded`);
}

export default router;
