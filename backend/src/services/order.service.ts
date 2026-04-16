import { query, transaction } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';
import { QRCodeService } from './qrcode.service.js';
import { PaymentService } from './payment.service.js';
import { EmailService } from './email.service.js';
import { PagarmeSplit } from './pagarme.service.js';
import { env } from '../config/env.js';

const qrCodeService = new QRCodeService();
const paymentService = new PaymentService();
const emailService = new EmailService();

export interface CreateOrderData {
  items: Array<{
    ticketId: string;
    quantity: number;
  }>;
  couponCode?: string;
  paymentMethod: 'CREDIT_CARD' | 'DEBIT_CARD' | 'PIX' | 'BOLETO';
  cardToken?: string;
  installments?: number;
}

interface Ticket {
  id: string;
  event_id: string;
  name: string;
  price: number;
  quantity: number;
  sold: number;
  sales_start: Date;
  sales_end: Date;
}

interface Coupon {
  id: string;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  valid_from: Date;
  valid_until: Date;
  event_id: string | null;
  min_purchase: number | null;
  active: boolean;
}

interface Order {
  id: string;
  user_id: string;
  event_id: string;
  subtotal: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_status: string;
  payment_id: string | null;
  status: string;
  coupon_code: string | null;
  created_at: Date;
  paid_at: Date | null;
}

interface User {
  id: string;
  email: string;
  name: string;
  cpf: string | null;
  phone: string | null;
}

export class OrderService {
  async createOrder(data: CreateOrderData, userId: string) {
    // Validate and get tickets
    const tickets = await Promise.all(
      data.items.map(async (item) => {
        const ticketResult = await query<Ticket & { event_name: string }>(
          `SELECT t.*, e.name as event_name FROM tickets t
           JOIN events e ON t.event_id = e.id
           WHERE t.id = $1`,
          [item.ticketId]
        );

        if (ticketResult.rows.length === 0) {
          throw new AppError(404, `Ticket ${item.ticketId} not found`);
        }

        const ticket = ticketResult.rows[0];
        const available = ticket.quantity - ticket.sold;

        if (available < item.quantity) {
          throw new AppError(400, `Only ${available} tickets available for ${ticket.name}`);
        }

        const now = new Date();
        if (now < ticket.sales_start || now > ticket.sales_end) {
          throw new AppError(400, `Ticket ${ticket.name} is not available for sale`);
        }

        return { ticket, quantity: item.quantity };
      })
    );

    // Ensure all tickets are from the same event
    const eventIds = new Set(tickets.map((t) => t.ticket.event_id));
    if (eventIds.size > 1) {
      throw new AppError(400, 'All tickets must be from the same event');
    }

    const eventId = tickets[0].ticket.event_id;

    // Fetch event organizer's Pagar.me recipient to set up payment split
    const organizerResult = await query<{ organizer_id: string; pagarme_recipient_id: string | null }>(
      `SELECT e.organizer_id, oa.pagarme_recipient_id
       FROM events e
       LEFT JOIN organizer_accounts oa ON oa.user_id = e.organizer_id
       WHERE e.id = $1`,
      [eventId]
    );

    if (organizerResult.rows.length === 0) {
      throw new AppError(404, 'Event not found');
    }

    const organizerRecipientId = organizerResult.rows[0].pagarme_recipient_id;
    const masterRecipientId = env.PAGARME_MASTER_RECIPIENT_ID;

    // If Pagar.me is configured for production, both recipients are required
    if (env.PAGARME_SECRET_KEY) {
      if (!organizerRecipientId) {
        throw new AppError(
          400,
          'Organizador deste evento ainda não concluiu o cadastro bancário. Compra temporariamente indisponível.'
        );
      }
      if (!masterRecipientId) {
        console.error('[createOrder] PAGARME_MASTER_RECIPIENT_ID not configured');
        throw new AppError(500, 'Configuração de pagamento incompleta. Tente novamente mais tarde.');
      }
    }

    // Calculate totals
    let subtotal = tickets.reduce((sum, t) => sum + t.ticket.price * t.quantity, 0);
    let discount = 0;

    // Apply coupon if provided
    if (data.couponCode) {
      const couponResult = await query<Coupon>(
        'SELECT * FROM coupons WHERE code = $1',
        [data.couponCode]
      );

      if (couponResult.rows.length === 0 || !couponResult.rows[0].active) {
        throw new AppError(404, 'Invalid coupon code');
      }

      const coupon = couponResult.rows[0];
      const now = new Date();

      if (now < coupon.valid_from || now > coupon.valid_until) {
        throw new AppError(400, 'Coupon expired or not yet valid');
      }

      if (coupon.max_uses && coupon.used_count >= coupon.max_uses) {
        throw new AppError(400, 'Coupon usage limit reached');
      }

      if (coupon.event_id && coupon.event_id !== eventId) {
        throw new AppError(400, 'Coupon not valid for this event');
      }

      if (coupon.min_purchase && subtotal < coupon.min_purchase) {
        throw new AppError(400, `Minimum purchase of R$ ${coupon.min_purchase} required`);
      }

      // Calculate discount
      if (coupon.discount_type === 'PERCENTAGE') {
        discount = (subtotal * coupon.discount_value) / 100;
      } else {
        discount = coupon.discount_value;
      }

      // Update coupon usage
      await query(
        'UPDATE coupons SET used_count = used_count + 1 WHERE code = $1',
        [data.couponCode]
      );
    }

    const total = subtotal - discount;

    // Create order in transaction
    const order = await transaction(async (client) => {
      // Create order
      const orderResult = await client.query<Order>(
        `INSERT INTO orders (user_id, event_id, subtotal, discount, total, payment_method, payment_status, status, coupon_code)
         VALUES ($1, $2, $3, $4, $5, $6, 'PENDING', 'PENDING', $7)
         RETURNING *`,
        [userId, eventId, subtotal, discount, total, data.paymentMethod, data.couponCode || null]
      );

      const newOrder = orderResult.rows[0];

      // Create order items and ticket instances
      for (const { ticket, quantity } of tickets) {
        const orderItemResult = await client.query<{ id: string }>(
          `INSERT INTO order_items (order_id, ticket_id, quantity, price)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [newOrder.id, ticket.id, quantity, ticket.price]
        );

        const orderItemId = orderItemResult.rows[0].id;

        // Generate QR codes for each ticket instance
        for (let i = 0; i < quantity; i++) {
          const qrData = {
            ticketId: ticket.id,
            orderId: newOrder.id,
            userId,
            eventId,
            timestamp: Date.now(),
          };

          const { code, data: encryptedData } = qrCodeService.generateQRCode(qrData);

          await client.query(
            `INSERT INTO ticket_instances (order_item_id, ticket_id, qr_code, qr_code_data)
             VALUES ($1, $2, $3, $4)`,
            [orderItemId, ticket.id, code, encryptedData]
          );
        }

        // Update ticket sold count
        await client.query(
          'UPDATE tickets SET sold = sold + $1 WHERE id = $2',
          [quantity, ticket.id]
        );
      }

      return newOrder;
    });

    // Get user for payment
    const userResult = await query<User>('SELECT * FROM users WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      throw new AppError(404, 'User not found');
    }

    const user = userResult.rows[0];

    // Validate CPF for payment methods that require it
    if ((data.paymentMethod === 'PIX' || data.paymentMethod === 'BOLETO') && !user.cpf) {
      throw new AppError(400, 'CPF é obrigatório para pagamento via PIX ou Boleto. Atualize seu perfil.');
    }

    // Prepare customer data for Pagar.me
    const customerData = {
      name: user.name,
      email: user.email,
      document: user.cpf || '',
      phone: user.phone || undefined,
    };

    // Prepare items for payment
    const paymentItems = tickets.map(({ ticket, quantity }) => ({
      name: ticket.name,
      quantity,
      price: ticket.price,
      id: ticket.id,
    }));

    // Build Pagar.me split rules: organizer gets (100 - platformFee)%, Lumera gets platformFee%
    // Remainder cents favor Lumera (platform) via Math.ceil on the fee amount.
    let split: PagarmeSplit[] | undefined = undefined;
    if (organizerRecipientId && masterRecipientId) {
      const totalCents = Math.round(total * 100);
      const feePercentage = parseFloat(env.PLATFORM_FEE_PERCENTAGE) || 5;
      const feeCents = Math.ceil((totalCents * feePercentage) / 100);
      const organizerCents = Math.max(0, totalCents - feeCents);

      split = [
        {
          recipient_id: organizerRecipientId,
          amount: organizerCents,
          type: 'flat',
          options: {
            charge_processing_fee: true,
            charge_remainder_fee: false,
            liable: true,
          },
        },
        {
          recipient_id: masterRecipientId,
          amount: feeCents,
          type: 'flat',
          options: {
            charge_processing_fee: false,
            charge_remainder_fee: true,
            liable: true,
          },
        },
      ];
    }

    // Process payment
    let paymentData: any = {};

    try {
      if (data.paymentMethod === 'CREDIT_CARD') {
        if (!data.cardToken) {
          throw new AppError(400, 'Card token is required for credit card payment');
        }

        const cardPayment = await paymentService.createCreditCardPayment(
          customerData,
          paymentItems,
          data.cardToken,
          data.installments || 1,
          { orderId: order.id, userId },
          split
        );

        paymentData = { card: cardPayment };

        await query(
          'UPDATE orders SET payment_id = $1 WHERE id = $2',
          [cardPayment.chargeId, order.id]
        );

        if (cardPayment.status === 'paid') {
          await query(
            "UPDATE orders SET payment_status = 'PAID', status = 'CONFIRMED', paid_at = NOW() WHERE id = $1",
            [order.id]
          );
        }
      } else if (data.paymentMethod === 'DEBIT_CARD') {
        if (!data.cardToken) {
          throw new AppError(400, 'Card token is required for debit card payment');
        }

        const cardPayment = await paymentService.createDebitCardPayment(
          customerData,
          paymentItems,
          data.cardToken,
          { orderId: order.id, userId },
          split
        );

        paymentData = { card: cardPayment };

        await query(
          'UPDATE orders SET payment_id = $1 WHERE id = $2',
          [cardPayment.chargeId, order.id]
        );

        if (cardPayment.status === 'paid') {
          await query(
            "UPDATE orders SET payment_status = 'PAID', status = 'CONFIRMED', paid_at = NOW() WHERE id = $1",
            [order.id]
          );
        }
      } else if (data.paymentMethod === 'PIX') {
        const pixPayment = await paymentService.createPixPayment(
          customerData,
          paymentItems,
          3600,
          { orderId: order.id, userId },
          split
        );

        paymentData = { pix: pixPayment };

        await query(
          'UPDATE orders SET payment_id = $1 WHERE id = $2',
          [pixPayment.chargeId, order.id]
        );
      } else if (data.paymentMethod === 'BOLETO') {
        const boletoPayment = await paymentService.createBoletoPayment(
          customerData,
          paymentItems,
          3, // 3 days to expire
          'Pagar ate a data de vencimento. Apos o vencimento, multa de 2% e juros de 1% ao mes.',
          { orderId: order.id, userId },
          split
        );

        paymentData = { boleto: boletoPayment };

        await query(
          'UPDATE orders SET payment_id = $1 WHERE id = $2',
          [boletoPayment.chargeId, order.id]
        );
      }
    } catch (paymentError) {
      // Payment failed - cancel the order and restore ticket counts
      console.error('Payment failed, cancelling order:', paymentError);

      await transaction(async (client) => {
        // Update order status to CANCELLED
        await client.query(
          `UPDATE orders SET status = 'CANCELLED', payment_status = 'FAILED' WHERE id = $1`,
          [order.id]
        );

        // Restore ticket counts
        for (const { ticket, quantity } of tickets) {
          await client.query(
            'UPDATE tickets SET sold = sold - $1 WHERE id = $2',
            [quantity, ticket.id]
          );
        }

        // Restore coupon usage if applied
        if (data.couponCode) {
          await client.query(
            'UPDATE coupons SET used_count = used_count - 1 WHERE code = $1',
            [data.couponCode]
          );
        }
      });

      // Re-throw the error
      throw paymentError;
    }

    // Get full order with relations
    const fullOrder = await this.getOrderWithDetails(order.id);

    return {
      order: fullOrder,
      payment: paymentData,
    };
  }

  private async getOrderWithDetails(orderId: string) {
    const orderResult = await query<Order & { event_name: string; event_date: Date; event_location: string; event_images: string[] }>(
      `SELECT o.*, e.name as event_name, e.date as event_date, e.location as event_location, e.images as event_images
       FROM orders o
       JOIN events e ON o.event_id = e.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) return null;

    const order = orderResult.rows[0];

    const itemsResult = await query<{
      id: string;
      order_id: string;
      ticket_id: string;
      quantity: number;
      price: number;
      ticket_name: string;
      ticket_description: string;
    }>(
      `SELECT oi.*, t.name as ticket_name, t.description as ticket_description
       FROM order_items oi
       JOIN tickets t ON oi.ticket_id = t.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    const ticketInstancesResult = await query<{
      id: string;
      order_item_id: string;
      ticket_id: string;
      qr_code: string;
      qr_code_data: string;
      checked_in: boolean;
      checked_in_at: Date | null;
    }>(
      `SELECT ti.* FROM ticket_instances ti
       JOIN order_items oi ON ti.order_item_id = oi.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    const instancesByItem = new Map<string, any[]>();
    for (const instance of ticketInstancesResult.rows) {
      if (!instancesByItem.has(instance.order_item_id)) {
        instancesByItem.set(instance.order_item_id, []);
      }
      // Generate QR code image on-demand from encrypted data
      const qrCodeImage = await qrCodeService.generateQRCodeImage(instance.qr_code_data);
      instancesByItem.get(instance.order_item_id)!.push({
        id: instance.id,
        ticketId: instance.ticket_id,
        qrCode: qrCodeImage,
        qrCodeData: instance.qr_code_data,
        checkedIn: instance.checked_in,
        checkedInAt: instance.checked_in_at,
      });
    }

    return {
      id: order.id,
      userId: order.user_id,
      eventId: order.event_id,
      subtotal: order.subtotal,
      discount: order.discount,
      total: order.total,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      paymentId: order.payment_id,
      status: order.status,
      couponCode: order.coupon_code,
      createdAt: order.created_at,
      paidAt: order.paid_at,
      event: {
        id: order.event_id,
        name: order.event_name,
        date: order.event_date,
        location: order.event_location,
        images: order.event_images,
      },
      items: itemsResult.rows.map((item) => ({
        id: item.id,
        orderId: item.order_id,
        ticketId: item.ticket_id,
        quantity: item.quantity,
        price: item.price,
        ticket: {
          id: item.ticket_id,
          name: item.ticket_name,
          description: item.ticket_description,
        },
        ticketInstances: instancesByItem.get(item.id) || [],
      })),
    };
  }

  async getOrderById(orderId: string, userId: string, userRole: string) {
    const orderResult = await query<Order & { user_name: string; user_email: string }>(
      `SELECT o.*, u.name as user_name, u.email as user_email
       FROM orders o
       JOIN users u ON o.user_id = u.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      throw new AppError(404, 'Order not found');
    }

    const order = orderResult.rows[0];

    if (userRole !== 'ADMIN' && order.user_id !== userId) {
      throw new AppError(403, 'Unauthorized');
    }

    const fullOrder = await this.getOrderWithDetails(orderId);
    return {
      ...fullOrder,
      user: {
        id: order.user_id,
        name: order.user_name,
        email: order.user_email,
      },
    };
  }

  async getUserOrders(userId: string) {
    const ordersResult = await query<Order & { event_name: string; event_date: Date; event_location: string; event_images: string[] }>(
      `SELECT o.*, e.name as event_name, e.date as event_date, e.location as event_location, e.images as event_images
       FROM orders o
       JOIN events e ON o.event_id = e.id
       WHERE o.user_id = $1
       ORDER BY o.created_at DESC`,
      [userId]
    );

    const orderIds = ordersResult.rows.map((o) => o.id);
    if (orderIds.length === 0) return [];

    // Get order items
    const itemsResult = await query<{
      id: string;
      order_id: string;
      ticket_id: string;
      quantity: number;
      price: number;
      ticket_name: string;
    }>(
      `SELECT oi.*, t.name as ticket_name
       FROM order_items oi
       JOIN tickets t ON oi.ticket_id = t.id
       WHERE oi.order_id = ANY($1)`,
      [orderIds]
    );

    // Get all order item IDs
    const orderItemIds = itemsResult.rows.map((i) => i.id);

    // Get ticket instances for all order items
    const instancesResult = orderItemIds.length > 0 ? await query<{
      id: string;
      order_item_id: string;
      qr_code: string;
      qr_code_data: string;
      checked_in: boolean;
      checked_in_at: Date | null;
    }>(
      `SELECT id, order_item_id, qr_code, qr_code_data, checked_in, checked_in_at
       FROM ticket_instances
       WHERE order_item_id = ANY($1)`,
      [orderItemIds]
    ) : { rows: [] };

    // Group instances by order item and generate QR code images
    const instancesByOrderItem = new Map<string, any[]>();

    // Generate QR code images for all instances
    await Promise.all(
      instancesResult.rows.map(async (instance) => {
        const qrCodeImage = await qrCodeService.generateQRCodeImage(instance.qr_code_data);

        if (!instancesByOrderItem.has(instance.order_item_id)) {
          instancesByOrderItem.set(instance.order_item_id, []);
        }
        instancesByOrderItem.get(instance.order_item_id)!.push({
          id: instance.id,
          qrCode: qrCodeImage,
          qrCodeData: instance.qr_code_data,
          checkedIn: instance.checked_in,
          checkedInAt: instance.checked_in_at,
        });
      })
    );

    // Group items by order
    const itemsByOrder = new Map<string, any[]>();
    itemsResult.rows.forEach((item) => {
      if (!itemsByOrder.has(item.order_id)) {
        itemsByOrder.set(item.order_id, []);
      }
      itemsByOrder.get(item.order_id)!.push({
        id: item.id,
        ticketId: item.ticket_id,
        quantity: item.quantity,
        price: item.price,
        ticket: {
          id: item.ticket_id,
          name: item.ticket_name,
          price: item.price,
        },
        ticketInstances: instancesByOrderItem.get(item.id) || [],
      });
    });

    return ordersResult.rows.map((order) => ({
      id: order.id,
      userId: order.user_id,
      eventId: order.event_id,
      subtotal: order.subtotal,
      discount: order.discount,
      total: order.total,
      paymentMethod: order.payment_method,
      paymentStatus: order.payment_status,
      status: order.status,
      createdAt: order.created_at,
      event: {
        id: order.event_id,
        name: order.event_name,
        date: order.event_date,
        location: order.event_location,
        images: order.event_images,
      },
      items: itemsByOrder.get(order.id) || [],
    }));
  }

  async confirmPayment(orderId: string, paymentId: string) {
    const orderResult = await query<Order & { user_email: string; user_name: string; event_name: string; event_date: Date }>(
      `SELECT o.*, u.email as user_email, u.name as user_name, e.name as event_name, e.date as event_date
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN events e ON o.event_id = e.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      throw new AppError(404, 'Order not found');
    }

    const order = orderResult.rows[0];

    // Verify payment with payment gateway
    const paymentStatus = await paymentService.verifyPayment(paymentId);

    if (paymentStatus.status !== 'paid') {
      throw new AppError(400, 'Payment not confirmed');
    }

    // Update order
    await query(
      "UPDATE orders SET payment_status = 'PAID', status = 'CONFIRMED', paid_at = NOW() WHERE id = $1",
      [orderId]
    );

    // Get order items for email
    const itemsResult = await query<{ ticket_name: string; quantity: number; price: number }>(
      `SELECT t.name as ticket_name, oi.quantity, oi.price
       FROM order_items oi
       JOIN tickets t ON oi.ticket_id = t.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    // Send confirmation email
    await emailService.sendOrderConfirmation(order.user_email, {
      orderId: order.id,
      eventName: order.event_name,
      eventDate: order.event_date.toLocaleDateString('pt-BR'),
      tickets: itemsResult.rows.map((item) => ({
        name: item.ticket_name,
        quantity: item.quantity,
        price: item.price,
      })),
      total: order.total,
    });

    // Get ticket instances for email
    const instancesResult = await query<{ qr_code: string; ticket_name: string }>(
      `SELECT ti.qr_code, t.name as ticket_name
       FROM ticket_instances ti
       JOIN order_items oi ON ti.order_item_id = oi.id
       JOIN tickets t ON ti.ticket_id = t.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    const tickets = instancesResult.rows.map((instance) => ({
      eventName: order.event_name,
      ticketName: instance.ticket_name,
      qrCode: instance.qr_code,
    }));

    await emailService.sendTickets(order.user_email, tickets);

    return { ...order, paymentStatus: 'PAID', status: 'CONFIRMED', paidAt: new Date() };
  }

  async cancelOrder(orderId: string, userId: string, userRole: string) {
    const orderResult = await query<Order>(
      'SELECT * FROM orders WHERE id = $1',
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      throw new AppError(404, 'Order not found');
    }

    const order = orderResult.rows[0];

    if (userRole !== 'ADMIN' && order.user_id !== userId) {
      throw new AppError(403, 'Unauthorized');
    }

    if (order.status === 'CANCELLED') {
      throw new AppError(400, 'Order already cancelled');
    }

    // Process refund if paid
    if (order.payment_status === 'PAID' && order.payment_id) {
      await paymentService.processRefund(order.payment_id);
    }

    // Update order and restore ticket counts
    await transaction(async (client) => {
      await client.query(
        `UPDATE orders SET status = 'CANCELLED', payment_status = $1 WHERE id = $2`,
        [order.payment_status === 'PAID' ? 'REFUNDED' : order.payment_status, orderId]
      );

      // Get items to restore counts
      const itemsResult = await client.query<{ ticket_id: string; quantity: number }>(
        'SELECT ticket_id, quantity FROM order_items WHERE order_id = $1',
        [orderId]
      );

      // Restore ticket counts
      for (const item of itemsResult.rows) {
        await client.query(
          'UPDATE tickets SET sold = sold - $1 WHERE id = $2',
          [item.quantity, item.ticket_id]
        );
      }
    });

    return { message: 'Order cancelled successfully' };
  }

  async checkAndUpdatePaymentStatus(orderId: string, userId: string) {
    // Get order
    const orderResult = await query<Order & { user_email: string; user_name: string; event_name: string; event_date: Date }>(
      `SELECT o.*, u.email as user_email, u.name as user_name, e.name as event_name, e.date as event_date
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN events e ON o.event_id = e.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      throw new AppError(404, 'Order not found');
    }

    const order = orderResult.rows[0];

    // Check if user owns the order
    if (order.user_id !== userId) {
      throw new AppError(403, 'Unauthorized');
    }

    // If already paid, return current status
    if (order.payment_status === 'PAID') {
      return {
        status: 'PAID',
        orderStatus: order.status,
        message: 'Pagamento já confirmado',
      };
    }

    // If no payment_id, can't check
    if (!order.payment_id) {
      return {
        status: order.payment_status,
        orderStatus: order.status,
        message: 'Aguardando pagamento',
      };
    }

    // Check payment status with gateway
    try {
      const paymentStatus = await paymentService.verifyPayment(order.payment_id);

      if (paymentStatus.status === 'paid') {
        // Update order to paid
        await query(
          "UPDATE orders SET payment_status = 'PAID', status = 'CONFIRMED', paid_at = NOW() WHERE id = $1",
          [orderId]
        );

        // Send confirmation emails
        const itemsResult = await query<{ ticket_name: string; quantity: number; price: number }>(
          `SELECT t.name as ticket_name, oi.quantity, oi.price
           FROM order_items oi
           JOIN tickets t ON oi.ticket_id = t.id
           WHERE oi.order_id = $1`,
          [orderId]
        );

        await emailService.sendOrderConfirmation(order.user_email, {
          orderId: order.id,
          eventName: order.event_name,
          eventDate: order.event_date.toLocaleDateString('pt-BR'),
          tickets: itemsResult.rows.map((item) => ({
            name: item.ticket_name,
            quantity: item.quantity,
            price: item.price,
          })),
          total: order.total,
        });

        // Send tickets
        const instancesResult = await query<{ qr_code: string; ticket_name: string }>(
          `SELECT ti.qr_code, t.name as ticket_name
           FROM ticket_instances ti
           JOIN order_items oi ON ti.order_item_id = oi.id
           JOIN tickets t ON ti.ticket_id = t.id
           WHERE oi.order_id = $1`,
          [orderId]
        );

        const tickets = instancesResult.rows.map((instance) => ({
          eventName: order.event_name,
          ticketName: instance.ticket_name,
          qrCode: instance.qr_code,
        }));

        await emailService.sendTickets(order.user_email, tickets);

        return {
          status: 'PAID',
          orderStatus: 'CONFIRMED',
          message: 'Pagamento confirmado com sucesso!',
        };
      }

      return {
        status: paymentStatus.status.toUpperCase(),
        orderStatus: order.status,
        message: paymentStatus.status === 'pending' ? 'Aguardando pagamento' : `Status: ${paymentStatus.status}`,
      };
    } catch (error) {
      console.error('Error checking payment status:', error);
      return {
        status: order.payment_status,
        orderStatus: order.status,
        message: 'Não foi possível verificar o status do pagamento',
      };
    }
  }

  async confirmPaymentManual(orderId: string) {
    const orderResult = await query<Order & { user_email: string; user_name: string; event_name: string; event_date: Date; user_id: string; event_id: string }>(
      `SELECT o.*, u.email as user_email, u.name as user_name, e.name as event_name, e.date as event_date
       FROM orders o
       JOIN users u ON o.user_id = u.id
       JOIN events e ON o.event_id = e.id
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      throw new AppError(404, 'Pedido não encontrado');
    }

    const order = orderResult.rows[0];

    if (order.payment_status === 'PAID') {
      throw new AppError(400, 'Pedido já está pago');
    }

    // Get order items with ticket info
    const itemsResult = await query<{ id: string; ticket_id: string; ticket_name: string; quantity: number; price: number }>(
      `SELECT oi.id, oi.ticket_id, t.name as ticket_name, oi.quantity, oi.price
       FROM order_items oi
       JOIN tickets t ON oi.ticket_id = t.id
       WHERE oi.order_id = $1`,
      [orderId]
    );

    // Check if ticket instances exist, create them if not
    for (const item of itemsResult.rows) {
      const existingInstances = await query<{ count: string }>(
        'SELECT COUNT(*) as count FROM ticket_instances WHERE order_item_id = $1',
        [item.id]
      );

      const instanceCount = parseInt(existingInstances.rows[0].count, 10);

      if (instanceCount === 0) {
        // Create ticket instances for this order item
        for (let i = 0; i < item.quantity; i++) {
          const qrData = {
            ticketId: item.ticket_id,
            orderId: orderId,
            userId: order.user_id,
            eventId: order.event_id,
            timestamp: Date.now(),
          };

          const { code, data: encryptedData } = qrCodeService.generateQRCode(qrData);

          await query(
            `INSERT INTO ticket_instances (order_item_id, ticket_id, qr_code, qr_code_data)
             VALUES ($1, $2, $3, $4)`,
            [item.id, item.ticket_id, code, encryptedData]
          );
        }

        // Update ticket sold count
        await query(
          'UPDATE tickets SET sold = sold + $1 WHERE id = $2',
          [item.quantity, item.ticket_id]
        );
      }
    }

    // Update order to PAID and CONFIRMED
    await query(
      `UPDATE orders SET
        payment_status = 'PAID',
        status = 'CONFIRMED',
        payment_id = $2,
        paid_at = NOW()
       WHERE id = $1`,
      [orderId, `MANUAL_${Date.now()}`]
    );

    // Send confirmation email
    try {
      await emailService.sendOrderConfirmation(order.user_email, {
        orderId: order.id,
        eventName: order.event_name,
        eventDate: order.event_date.toLocaleDateString('pt-BR'),
        tickets: itemsResult.rows.map((item) => ({
          name: item.ticket_name,
          quantity: item.quantity,
          price: item.price,
        })),
        total: order.total,
      });

      // Get ticket instances for email
      const instancesResult = await query<{ qr_code: string; ticket_name: string }>(
        `SELECT ti.qr_code, t.name as ticket_name
         FROM ticket_instances ti
         JOIN order_items oi ON ti.order_item_id = oi.id
         JOIN tickets t ON ti.ticket_id = t.id
         WHERE oi.order_id = $1`,
        [orderId]
      );

      const tickets = instancesResult.rows.map((instance) => ({
        eventName: order.event_name,
        ticketName: instance.ticket_name,
        qrCode: instance.qr_code,
      }));

      await emailService.sendTickets(order.user_email, tickets);
    } catch (emailError) {
      console.error('Erro ao enviar emails:', emailError);
      // Continue mesmo se o email falhar
    }

    return {
      ...order,
      payment_status: 'PAID',
      status: 'CONFIRMED',
      paid_at: new Date(),
      message: 'Pagamento confirmado manualmente com sucesso!'
    };
  }
}
