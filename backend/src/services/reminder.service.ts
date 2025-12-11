import { prisma } from '../lib/prisma.js';
import { EmailService } from './email.service.js';
import { ReminderType } from '@prisma/client';

const emailService = new EmailService();

export class ReminderService {
  /**
   * Process event reminders for upcoming events
   * Should be called periodically (e.g., every 30 minutes via cron job)
   */
  async processReminders(): Promise<{ sent24h: number; sent2h: number }> {
    const now = new Date();

    // Send 24h reminders
    const sent24h = await this.sendReminders(now, 24, 'HOURS_24');

    // Send 2h reminders
    const sent2h = await this.sendReminders(now, 2, 'HOURS_2');

    console.log(`✅ Reminders processed: ${sent24h} (24h), ${sent2h} (2h)`);

    return { sent24h, sent2h };
  }

  private async sendReminders(
    now: Date,
    hoursBeforeEvent: number,
    reminderType: ReminderType
  ): Promise<number> {
    // Calculate time window
    // For 24h reminder: between 24h and 23h before event
    // For 2h reminder: between 2h and 1h before event
    const minTime = new Date(now.getTime() + hoursBeforeEvent * 60 * 60 * 1000);
    const maxTime = new Date(now.getTime() + (hoursBeforeEvent + 1) * 60 * 60 * 1000);

    // Find events in the time window
    const events = await prisma.event.findMany({
      where: {
        date: {
          gte: minTime,
          lt: maxTime,
        },
        status: 'PUBLISHED',
      },
      select: {
        id: true,
        name: true,
        date: true,
        location: true,
      },
    });

    if (events.length === 0) {
      return 0;
    }

    let sentCount = 0;

    for (const event of events) {
      // Find orders with confirmed payments for this event
      const orders = await prisma.order.findMany({
        where: {
          eventId: event.id,
          status: 'CONFIRMED',
          paymentStatus: 'PAID',
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          items: {
            include: {
              ticketInstances: true,
            },
          },
        },
      });

      for (const order of orders) {
        // Check if reminder was already sent
        const existingReminder = await prisma.eventReminder.findUnique({
          where: {
            orderId_reminderType: {
              orderId: order.id,
              reminderType,
            },
          },
        });

        if (existingReminder) {
          continue; // Already sent
        }

        // Count tickets
        const ticketCount = order.items.reduce(
          (sum, item) => sum + (item.ticketInstances?.length || 0),
          0
        );

        if (ticketCount === 0) {
          continue; // No tickets
        }

        try {
          // Send reminder email
          await emailService.sendEventReminder(order.user.email, {
            eventName: event.name,
            eventDate: new Date(event.date).toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            }),
            eventTime: new Date(event.date).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            eventLocation: event.location,
            ticketCount,
            hoursUntilEvent: hoursBeforeEvent,
          });

          // Record that reminder was sent
          await prisma.eventReminder.create({
            data: {
              orderId: order.id,
              eventId: event.id,
              userId: order.user.id,
              reminderType,
            },
          });

          sentCount++;
          console.log(
            `📧 Sent ${hoursBeforeEvent}h reminder to ${order.user.email} for "${event.name}"`
          );
        } catch (error) {
          console.error(
            `❌ Failed to send reminder to ${order.user.email}:`,
            error
          );
        }
      }
    }

    return sentCount;
  }

  /**
   * Get reminder statistics for an event
   */
  async getReminderStats(eventId: string): Promise<{
    total24h: number;
    total2h: number;
  }> {
    const [total24h, total2h] = await Promise.all([
      prisma.eventReminder.count({
        where: {
          eventId,
          reminderType: 'HOURS_24',
        },
      }),
      prisma.eventReminder.count({
        where: {
          eventId,
          reminderType: 'HOURS_2',
        },
      }),
    ]);

    return { total24h, total2h };
  }
}

export const reminderService = new ReminderService();
