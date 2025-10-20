import { prisma } from '../config/database.js';
import { AppError } from '../middlewares/errorHandler.js';

export class CartService {
  private async getOrCreateCart(userId?: string, sessionId?: string) {
    let cart = await prisma.cart.findFirst({
      where: userId ? { userId } : { sessionId },
      include: {
        items: {
          include: {
            ticket: {
              include: {
                event: {
                  select: {
                    id: true,
                    name: true,
                    date: true,
                    location: true,
                    images: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!cart) {
      cart = await prisma.cart.create({
        data: {
          userId,
          sessionId,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        },
        include: {
          items: {
            include: {
              ticket: {
                include: {
                  event: {
                    select: {
                      id: true,
                      name: true,
                      date: true,
                      location: true,
                      images: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    // Clean expired items
    if (cart.expiresAt < new Date()) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
      cart.items = [];
    }

    return cart;
  }

  async getCart(userId?: string, sessionId?: string) {
    const cart = await this.getOrCreateCart(userId, sessionId);

    // Calculate totals
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.ticket.price * item.quantity,
      0
    );

    return {
      id: cart.id,
      items: cart.items.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        ticket: {
          ...item.ticket,
          available: item.ticket.quantity - item.ticket.sold,
        },
      })),
      subtotal,
      total: subtotal,
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    };
  }

  async addToCart(
    ticketId: string,
    quantity: number,
    userId?: string,
    sessionId?: string
  ) {
    // Verify ticket exists and is available
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new AppError(404, 'Ticket not found');
    }

    const available = ticket.quantity - ticket.sold;
    if (available < quantity) {
      throw new AppError(400, `Only ${available} tickets available`);
    }

    // Check sales period
    const now = new Date();
    if (now < ticket.salesStart) {
      throw new AppError(400, 'Ticket sales have not started yet');
    }
    if (now > ticket.salesEnd) {
      throw new AppError(400, 'Ticket sales have ended');
    }

    const cart = await this.getOrCreateCart(userId, sessionId);

    // Check if ticket already in cart
    const existingItem = cart.items.find((item) => item.ticketId === ticketId);

    if (existingItem) {
      // Update quantity
      const newQuantity = existingItem.quantity + quantity;

      if (available < newQuantity) {
        throw new AppError(400, `Only ${available} tickets available`);
      }

      await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: newQuantity },
      });
    } else {
      // Create new item
      await prisma.cartItem.create({
        data: {
          cartId: cart.id,
          ticketId,
          quantity,
        },
      });
    }

    return this.getCart(userId, sessionId);
  }

  async updateCartItem(
    itemId: string,
    quantity: number,
    userId?: string,
    sessionId?: string
  ) {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: {
        cart: true,
        ticket: true,
      },
    });

    if (!cartItem) {
      throw new AppError(404, 'Cart item not found');
    }

    // Verify ownership
    if (
      (userId && cartItem.cart.userId !== userId) ||
      (sessionId && cartItem.cart.sessionId !== sessionId)
    ) {
      throw new AppError(403, 'Unauthorized');
    }

    // Check availability
    const available = cartItem.ticket.quantity - cartItem.ticket.sold;
    if (available < quantity) {
      throw new AppError(400, `Only ${available} tickets available`);
    }

    await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    return this.getCart(userId, sessionId);
  }

  async removeFromCart(itemId: string, userId?: string, sessionId?: string) {
    const cartItem = await prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!cartItem) {
      throw new AppError(404, 'Cart item not found');
    }

    // Verify ownership
    if (
      (userId && cartItem.cart.userId !== userId) ||
      (sessionId && cartItem.cart.sessionId !== sessionId)
    ) {
      throw new AppError(403, 'Unauthorized');
    }

    await prisma.cartItem.delete({ where: { id: itemId } });

    return this.getCart(userId, sessionId);
  }

  async clearCart(userId?: string, sessionId?: string) {
    const cart = await prisma.cart.findFirst({
      where: userId ? { userId } : { sessionId },
    });

    if (cart) {
      await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
    }

    return { message: 'Cart cleared' };
  }
}
