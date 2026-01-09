import { query } from '../config/database.js';
import { EmailService, EmailOptions } from './email.service.js';
import logger from '../config/logger.js';

const emailService = new EmailService();

interface QueuedEmail {
  id: string;
  to_email: string;
  subject: string;
  html_content: string;
  text_content: string | null;
  status: 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED';
  attempts: number;
  max_attempts: number;
  last_attempt_at: Date | null;
  sent_at: Date | null;
  error_message: string | null;
  metadata: Record<string, any> | null;
  created_at: Date;
}

export class EmailQueueService {
  /**
   * Add email to queue instead of sending directly
   */
  async queueEmail(options: EmailOptions, metadata?: Record<string, any>): Promise<string> {
    const result = await query<{ id: string }>(
      `INSERT INTO email_queue (to_email, subject, html_content, text_content, metadata)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [options.to, options.subject, options.html, options.text || null, metadata ? JSON.stringify(metadata) : null]
    );

    logger.info('Email queued', {
      type: 'email',
      action: 'queue',
      emailId: result.rows[0].id,
      to: options.to,
      subject: options.subject,
    });

    return result.rows[0].id;
  }

  /**
   * Process pending emails in the queue
   */
  async processQueue(batchSize: number = 10): Promise<{ processed: number; sent: number; failed: number }> {
    // Get pending emails
    const pendingResult = await query<QueuedEmail>(
      `SELECT * FROM email_queue
       WHERE status = 'PENDING'
       AND attempts < max_attempts
       ORDER BY created_at ASC
       LIMIT $1`,
      [batchSize]
    );

    let sent = 0;
    let failed = 0;

    for (const email of pendingResult.rows) {
      // Mark as processing
      await query(
        `UPDATE email_queue SET status = 'PROCESSING', last_attempt_at = NOW() WHERE id = $1`,
        [email.id]
      );

      try {
        await emailService.sendEmail({
          to: email.to_email,
          subject: email.subject,
          html: email.html_content,
          text: email.text_content || undefined,
        });

        // Mark as sent
        await query(
          `UPDATE email_queue SET status = 'SENT', sent_at = NOW(), attempts = attempts + 1 WHERE id = $1`,
          [email.id]
        );

        sent++;

        logger.info('Email sent from queue', {
          type: 'email',
          action: 'sent',
          emailId: email.id,
          to: email.to_email,
        });
      } catch (error: any) {
        const newAttempts = email.attempts + 1;
        const newStatus = newAttempts >= email.max_attempts ? 'FAILED' : 'PENDING';

        await query(
          `UPDATE email_queue SET status = $1, attempts = $2, error_message = $3 WHERE id = $4`,
          [newStatus, newAttempts, error.message, email.id]
        );

        if (newStatus === 'FAILED') {
          failed++;
        }

        logger.error('Email send failed', {
          type: 'email',
          action: 'failed',
          emailId: email.id,
          to: email.to_email,
          attempt: newAttempts,
          maxAttempts: email.max_attempts,
          error: error.message,
        });
      }
    }

    return {
      processed: pendingResult.rows.length,
      sent,
      failed,
    };
  }

  /**
   * Retry failed emails (reset their status)
   */
  async retryFailed(emailId?: string): Promise<number> {
    let result;

    if (emailId) {
      result = await query(
        `UPDATE email_queue SET status = 'PENDING', attempts = 0, error_message = NULL
         WHERE id = $1 AND status = 'FAILED'`,
        [emailId]
      );
    } else {
      result = await query(
        `UPDATE email_queue SET status = 'PENDING', attempts = 0, error_message = NULL
         WHERE status = 'FAILED'`
      );
    }

    return result.rowCount || 0;
  }

  /**
   * Get queue statistics
   */
  async getStats(): Promise<{
    pending: number;
    processing: number;
    sent: number;
    failed: number;
    total: number;
  }> {
    const result = await query<{ status: string; count: string }>(
      `SELECT status, COUNT(*) as count FROM email_queue GROUP BY status`
    );

    const stats = {
      pending: 0,
      processing: 0,
      sent: 0,
      failed: 0,
      total: 0,
    };

    for (const row of result.rows) {
      const count = parseInt(row.count, 10);
      stats.total += count;
      switch (row.status) {
        case 'PENDING':
          stats.pending = count;
          break;
        case 'PROCESSING':
          stats.processing = count;
          break;
        case 'SENT':
          stats.sent = count;
          break;
        case 'FAILED':
          stats.failed = count;
          break;
      }
    }

    return stats;
  }

  /**
   * Clean old sent emails (older than specified days)
   */
  async cleanOldEmails(daysOld: number = 30): Promise<number> {
    const result = await query(
      `DELETE FROM email_queue
       WHERE status = 'SENT'
       AND sent_at < NOW() - INTERVAL '${daysOld} days'`
    );

    return result.rowCount || 0;
  }
}

export const emailQueueService = new EmailQueueService();
