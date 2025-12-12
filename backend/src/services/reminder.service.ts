import { query } from '../config/database.js';
import { EmailService } from './email.service.js';

const emailService = new EmailService();

type ReminderType = 'HOURS_24' | 'HOURS_2';

export class ReminderService {
  async processReminders(): Promise<{ sent24h: number; sent2h: number }> {
    const now = new Date();

    // Send 24h reminders
    const sent24h = await this.sendReminders(now, 24, 'HOURS_24');

    // Send 2h reminders
    const sent2h = await this.sendReminders(now, 2, 'HOURS_2');

    console.log(`Reminders processed: ${sent24h} (24h), ${sent2h} (2h)`);

    return { sent24h, sent2h };
  }

  private async sendReminders(
    now: Date,
    hoursBeforeEvent: number,
    reminderType: ReminderType
  ): Promise<number> {
    // Calculate time window
    const minTime = new Date(now.getTime() + hoursBeforeEvent * 60 * 60 * 1000);
    const maxTime = new Date(now.getTime() + (hoursBeforeEvent + 1) * 60 * 60 * 1000);

    // Find events in the time window
    const eventsResult = await query<{
      id: string;
      name: string;
      date: Date;
      location: string;
    }>(
      `SELECT id, name, date, location FROM events
       WHERE date >= $1 AND date < $2 AND status = 'PUBLISHED'`,
      [minTime, maxTime]
    );

    if (eventsResult.rows.length === 0) {
      return 0;
    }

    let sentCount = 0;

    for (const event of eventsResult.rows) {
      // Find orders with confirmed payments for this event
      const ordersResult = await query<{
        order_id: string;
        user_id: string;
        user_email: string;
        user_name: string;
        ticket_count: string;
      }>(
        `SELECT o.id as order_id, o.user_id, u.email as user_email, u.name as user_name,
                COUNT(ti.id) as ticket_count
         FROM orders o
         JOIN users u ON o.user_id = u.id
         JOIN order_items oi ON o.id = oi.order_id
         JOIN ticket_instances ti ON oi.id = ti.order_item_id
         WHERE o.event_id = $1 AND o.status = 'CONFIRMED' AND o.payment_status = 'PAID'
         GROUP BY o.id, o.user_id, u.email, u.name`,
        [event.id]
      );

      for (const order of ordersResult.rows) {
        // Check if reminder was already sent
        const existingResult = await query<{ id: string }>(
          `SELECT id FROM event_reminders
           WHERE order_id = $1 AND reminder_type = $2`,
          [order.order_id, reminderType]
        );

        if (existingResult.rows.length > 0) {
          continue; // Already sent
        }

        const ticketCount = parseInt(order.ticket_count, 10);
        if (ticketCount === 0) {
          continue;
        }

        try {
          // Send reminder email
          await emailService.sendEventReminder(order.user_email, {
            eventName: event.name,
            eventDate: event.date.toLocaleDateString('pt-BR', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              year: 'numeric',
            }),
            eventTime: event.date.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            }),
            eventLocation: event.location,
            ticketCount,
            hoursUntilEvent: hoursBeforeEvent,
          });

          // Record that reminder was sent
          await query(
            `INSERT INTO event_reminders (order_id, event_id, user_id, reminder_type)
             VALUES ($1, $2, $3, $4)`,
            [order.order_id, event.id, order.user_id, reminderType]
          );

          sentCount++;
          console.log(
            `Sent ${hoursBeforeEvent}h reminder to ${order.user_email} for "${event.name}"`
          );
        } catch (error) {
          console.error(
            `Failed to send reminder to ${order.user_email}:`,
            error
          );
        }
      }
    }

    return sentCount;
  }

  async getReminderStats(eventId: string): Promise<{
    total24h: number;
    total2h: number;
  }> {
    const [result24h, result2h] = await Promise.all([
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM event_reminders
         WHERE event_id = $1 AND reminder_type = 'HOURS_24'`,
        [eventId]
      ),
      query<{ count: string }>(
        `SELECT COUNT(*) as count FROM event_reminders
         WHERE event_id = $1 AND reminder_type = 'HOURS_2'`,
        [eventId]
      ),
    ]);

    return {
      total24h: parseInt(result24h.rows[0].count, 10),
      total2h: parseInt(result2h.rows[0].count, 10),
    };
  }
}

export const reminderService = new ReminderService();
