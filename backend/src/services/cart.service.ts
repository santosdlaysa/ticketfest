import { query, transaction } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';

interface Cart {
  id: string;
  user_id: string | null;
  session_id: string | null;
  expires_at: Date;
  created_at: Date;
}

interface CartItem {
  id: string;
  cart_id: string;
  ticket_id: string;
  quantity: number;
  created_at: Date;
}

interface Ticket {
  id: string;
  event_id: string;
  name: string;
  description: string | null;
  price: number;
  quantity: number;
  sold: number;
  sales_start: Date;
  sales_end: Date;
}

interface Event {
  id: string;
  name: string;
  date: Date;
  location: string;
  images: string[];
}

export class CartService {
  private async getOrCreateCart(userId?: string, sessionId?: string) {
    // Find existing cart - prioritize sessionId for consistency
    let cartResult;
    if (sessionId) {
      cartResult = await query<Cart>('SELECT * FROM carts WHERE session_id = $1', [sessionId]);
    } else if (userId) {
      cartResult = await query<Cart>('SELECT * FROM carts WHERE user_id = $1', [userId]);
    } else {
      cartResult = { rows: [] };
    }

    let cart: Cart;

    if (cartResult.rows.length === 0) {
      // Create new cart with sessionId (always use sessionId for cart identification)
      const newCartResult = await query<Cart>(
        `INSERT INTO carts (user_id, session_id, expires_at)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [userId || null, sessionId || null, new Date(Date.now() + 24 * 60 * 60 * 1000)]
      );
      cart = newCartResult.rows[0];
    } else {
      cart = cartResult.rows[0];
      // Update userId if user logged in and cart doesn't have one
      if (userId && !cart.user_id) {
        await query('UPDATE carts SET user_id = $1 WHERE id = $2', [userId, cart.id]);
        cart.user_id = userId;
      }
    }

    // Get cart items with ticket and event data
    const itemsResult = await query<{
      cart_item_id: string;
      cart_id: string;
      ticket_id: string;
      cart_item_quantity: number;
      cart_item_created_at: Date;
      ticket_name: string;
      ticket_description: string | null;
      ticket_price: number;
      ticket_quantity: number;
      ticket_sold: number;
      sales_start: Date;
      sales_end: Date;
      event_id: string;
      event_name: string;
      event_date: Date;
      event_location: string;
      event_images: string[];
    }>(
      `SELECT
         ci.id as cart_item_id,
         ci.cart_id,
         ci.ticket_id,
         ci.quantity as cart_item_quantity,
         ci.created_at as cart_item_created_at,
         t.name as ticket_name,
         t.description as ticket_description,
         t.price as ticket_price,
         t.quantity as ticket_quantity,
         t.sold as ticket_sold,
         t.sales_start,
         t.sales_end,
         e.id as event_id,
         e.name as event_name,
         e.date as event_date,
         e.location as event_location,
         e.images as event_images
       FROM cart_items ci
       JOIN tickets t ON ci.ticket_id = t.id
       JOIN events e ON t.event_id = e.id
       WHERE ci.cart_id = $1`,
      [cart.id]
    );

    // Clean expired items
    if (cart.expires_at < new Date()) {
      await query('DELETE FROM cart_items WHERE cart_id = $1', [cart.id]);
      return { ...cart, items: [] };
    }

    const items = itemsResult.rows.map((row) => ({
      id: row.cart_item_id,
      cartId: row.cart_id,
      ticketId: row.ticket_id,
      quantity: row.cart_item_quantity,
      createdAt: row.cart_item_created_at,
      ticket: {
        id: row.ticket_id,
        eventId: row.event_id,
        name: row.ticket_name,
        description: row.ticket_description,
        price: row.ticket_price,
        quantity: row.ticket_quantity,
        sold: row.ticket_sold,
        salesStart: row.sales_start,
        salesEnd: row.sales_end,
        event: {
          id: row.event_id,
          name: row.event_name,
          date: row.event_date,
          location: row.event_location,
          images: row.event_images,
        },
      },
    }));

    return { ...cart, items };
  }

  async getCart(userId?: string, sessionId?: string) {
    const cart = await this.getOrCreateCart(userId, sessionId);

    // Calculate totals
    const subtotal = cart.items.reduce(
      (sum: number, item: any) => sum + item.ticket.price * item.quantity,
      0
    );

    return {
      id: cart.id,
      items: cart.items.map((item: any) => ({
        id: item.id,
        quantity: item.quantity,
        ticket: {
          ...item.ticket,
          available: item.ticket.quantity - item.ticket.sold,
        },
      })),
      subtotal,
      total: subtotal,
      itemCount: cart.items.reduce((sum: number, item: any) => sum + item.quantity, 0),
    };
  }

  async addToCart(
    ticketId: string,
    quantity: number,
    userId?: string,
    sessionId?: string
  ) {
    // Verify ticket exists and is available
    const ticketResult = await query<Ticket>('SELECT * FROM tickets WHERE id = $1', [ticketId]);

    if (ticketResult.rows.length === 0) {
      throw new AppError(404, 'Ticket not found');
    }

    const ticket = ticketResult.rows[0];

    const available = ticket.quantity - ticket.sold;
    if (available < quantity) {
      throw new AppError(400, `Only ${available} tickets available`);
    }

    // Check sales period
    const now = new Date();
    if (now < ticket.sales_start) {
      throw new AppError(400, 'Ticket sales have not started yet');
    }
    if (now > ticket.sales_end) {
      throw new AppError(400, 'Ticket sales have ended');
    }

    const cart = await this.getOrCreateCart(userId, sessionId);

    // Check if ticket already in cart
    const existingItem = cart.items.find((item: any) => item.ticketId === ticketId);

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;

      if (available < newQuantity) {
        throw new AppError(400, `Only ${available} tickets available`);
      }

      await query(
        'UPDATE cart_items SET quantity = $1 WHERE id = $2',
        [newQuantity, existingItem.id]
      );
    } else {
      // Create new item
      await query(
        'INSERT INTO cart_items (cart_id, ticket_id, quantity) VALUES ($1, $2, $3)',
        [cart.id, ticketId, quantity]
      );
    }

    return this.getCart(userId, sessionId);
  }

  async updateCartItem(
    itemId: string,
    quantity: number,
    userId?: string,
    sessionId?: string
  ) {
    const itemResult = await query<CartItem & { user_id: string | null; session_id: string | null; ticket_quantity: number; ticket_sold: number }>(
      `SELECT ci.*, c.user_id, c.session_id, t.quantity as ticket_quantity, t.sold as ticket_sold
       FROM cart_items ci
       JOIN carts c ON ci.cart_id = c.id
       JOIN tickets t ON ci.ticket_id = t.id
       WHERE ci.id = $1`,
      [itemId]
    );

    if (itemResult.rows.length === 0) {
      throw new AppError(404, 'Cart item not found');
    }

    const cartItem = itemResult.rows[0];

    // Verify ownership
    if (
      (userId && cartItem.user_id !== userId) ||
      (sessionId && cartItem.session_id !== sessionId)
    ) {
      throw new AppError(403, 'Unauthorized');
    }

    // Check availability
    const available = cartItem.ticket_quantity - cartItem.ticket_sold;
    if (available < quantity) {
      throw new AppError(400, `Only ${available} tickets available`);
    }

    await query('UPDATE cart_items SET quantity = $1 WHERE id = $2', [quantity, itemId]);

    return this.getCart(userId, sessionId);
  }

  async removeFromCart(itemId: string, userId?: string, sessionId?: string) {
    const itemResult = await query<CartItem & { user_id: string | null; session_id: string | null }>(
      `SELECT ci.*, c.user_id, c.session_id
       FROM cart_items ci
       JOIN carts c ON ci.cart_id = c.id
       WHERE ci.id = $1`,
      [itemId]
    );

    if (itemResult.rows.length === 0) {
      throw new AppError(404, 'Cart item not found');
    }

    const cartItem = itemResult.rows[0];

    // Verify ownership
    if (
      (userId && cartItem.user_id !== userId) ||
      (sessionId && cartItem.session_id !== sessionId)
    ) {
      throw new AppError(403, 'Unauthorized');
    }

    await query('DELETE FROM cart_items WHERE id = $1', [itemId]);

    return this.getCart(userId, sessionId);
  }

  async clearCart(userId?: string, sessionId?: string) {
    // Prioritize sessionId for consistency
    let cartResult;
    if (sessionId) {
      cartResult = await query<Cart>('SELECT id FROM carts WHERE session_id = $1', [sessionId]);
    } else if (userId) {
      cartResult = await query<Cart>('SELECT id FROM carts WHERE user_id = $1', [userId]);
    } else {
      return { message: 'Cart cleared' };
    }

    if (cartResult.rows.length > 0) {
      await query('DELETE FROM cart_items WHERE cart_id = $1', [cartResult.rows[0].id]);
    }

    return { message: 'Cart cleared' };
  }
}
