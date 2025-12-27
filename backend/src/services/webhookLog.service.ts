import { query } from '../config/database.js';
import logger from '../config/logger.js';

interface WebhookLog {
  id: string;
  source: string;
  event_type: string;
  payload: Record<string, any>;
  status: 'RECEIVED' | 'PROCESSED' | 'FAILED';
  processing_error: string | null;
  processed_at: Date | null;
  created_at: Date;
}

export class WebhookLogService {
  /**
   * Log incoming webhook
   */
  async logIncoming(
    source: string,
    eventType: string,
    payload: Record<string, any>
  ): Promise<string> {
    const result = await query<{ id: string }>(
      `INSERT INTO webhook_logs (source, event_type, payload, status)
       VALUES ($1, $2, $3, 'RECEIVED')
       RETURNING id`,
      [source, eventType, JSON.stringify(payload)]
    );

    logger.info('Webhook received', {
      type: 'webhook',
      action: 'received',
      webhookId: result.rows[0].id,
      source,
      eventType,
    });

    return result.rows[0].id;
  }

  /**
   * Mark webhook as processed
   */
  async markProcessed(webhookId: string): Promise<void> {
    await query(
      `UPDATE webhook_logs SET status = 'PROCESSED', processed_at = NOW() WHERE id = $1`,
      [webhookId]
    );

    logger.info('Webhook processed', {
      type: 'webhook',
      action: 'processed',
      webhookId,
    });
  }

  /**
   * Mark webhook as failed
   */
  async markFailed(webhookId: string, error: string): Promise<void> {
    await query(
      `UPDATE webhook_logs SET status = 'FAILED', processing_error = $1, processed_at = NOW() WHERE id = $2`,
      [error, webhookId]
    );

    logger.error('Webhook processing failed', {
      type: 'webhook',
      action: 'failed',
      webhookId,
      error,
    });
  }

  /**
   * Get webhook logs with pagination
   */
  async getLogs(
    options: {
      source?: string;
      status?: 'RECEIVED' | 'PROCESSED' | 'FAILED';
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ logs: WebhookLog[]; total: number }> {
    const { source, status, page = 1, limit = 50 } = options;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: any[] = [];
    let paramIndex = 1;

    if (source) {
      whereClause += ` AND source = $${paramIndex++}`;
      params.push(source);
    }

    if (status) {
      whereClause += ` AND status = $${paramIndex++}`;
      params.push(status);
    }

    const countResult = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM webhook_logs WHERE 1=1 ${whereClause}`,
      params
    );

    const logsResult = await query<WebhookLog>(
      `SELECT * FROM webhook_logs WHERE 1=1 ${whereClause}
       ORDER BY created_at DESC
       LIMIT $${paramIndex++} OFFSET $${paramIndex}`,
      [...params, limit, offset]
    );

    return {
      logs: logsResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  /**
   * Get failed webhooks for retry
   */
  async getFailedWebhooks(source?: string): Promise<WebhookLog[]> {
    let queryStr = `SELECT * FROM webhook_logs WHERE status = 'FAILED'`;
    const params: any[] = [];

    if (source) {
      queryStr += ` AND source = $1`;
      params.push(source);
    }

    queryStr += ` ORDER BY created_at DESC LIMIT 100`;

    const result = await query<WebhookLog>(queryStr, params);
    return result.rows;
  }

  /**
   * Clean old processed webhooks
   */
  async cleanOldLogs(daysOld: number = 30): Promise<number> {
    const result = await query(
      `DELETE FROM webhook_logs
       WHERE status = 'PROCESSED'
       AND processed_at < NOW() - INTERVAL '${daysOld} days'`
    );

    return result.rowCount || 0;
  }

  /**
   * Get webhook statistics
   */
  async getStats(source?: string): Promise<{
    received: number;
    processed: number;
    failed: number;
    total: number;
  }> {
    let whereClause = '';
    const params: any[] = [];

    if (source) {
      whereClause = 'WHERE source = $1';
      params.push(source);
    }

    const result = await query<{ status: string; count: string }>(
      `SELECT status, COUNT(*) as count FROM webhook_logs ${whereClause} GROUP BY status`,
      params
    );

    const stats = {
      received: 0,
      processed: 0,
      failed: 0,
      total: 0,
    };

    for (const row of result.rows) {
      const count = parseInt(row.count, 10);
      stats.total += count;
      switch (row.status) {
        case 'RECEIVED':
          stats.received = count;
          break;
        case 'PROCESSED':
          stats.processed = count;
          break;
        case 'FAILED':
          stats.failed = count;
          break;
      }
    }

    return stats;
  }
}

export const webhookLogService = new WebhookLogService();
