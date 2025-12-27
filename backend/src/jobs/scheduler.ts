import cron from 'node-cron';
import { reminderService } from '../services/reminder.service.js';
import { emailQueueService } from '../services/emailQueue.service.js';
import logger from '../config/logger.js';

/**
 * Initialize all scheduled jobs
 */
export function initializeScheduler() {
  logger.info('Initializing scheduler...');

  // Process event reminders every 30 minutes
  // Runs at minute 0 and 30 of every hour
  cron.schedule('0,30 * * * *', async () => {
    logger.info('Running event reminders job');
    try {
      const result = await reminderService.processReminders();
      logger.info('Reminders job completed', {
        type: 'job',
        job: 'reminders',
        sent24h: result.sent24h,
        sent2h: result.sent2h,
      });
    } catch (error: any) {
      logger.error('Error in reminders job', {
        type: 'job',
        job: 'reminders',
        error: error.message,
      });
    }
  });

  // Process email queue every minute
  cron.schedule('* * * * *', async () => {
    try {
      const result = await emailQueueService.processQueue(20);
      if (result.processed > 0) {
        logger.info('Email queue processed', {
          type: 'job',
          job: 'emailQueue',
          processed: result.processed,
          sent: result.sent,
          failed: result.failed,
        });
      }
    } catch (error: any) {
      logger.error('Error processing email queue', {
        type: 'job',
        job: 'emailQueue',
        error: error.message,
      });
    }
  });

  // Clean old emails and webhook logs daily at 3 AM
  cron.schedule('0 3 * * *', async () => {
    logger.info('Running cleanup job');
    try {
      const emailsCleaned = await emailQueueService.cleanOldEmails(30);
      logger.info('Cleanup job completed', {
        type: 'job',
        job: 'cleanup',
        emailsCleaned,
      });
    } catch (error: any) {
      logger.error('Error in cleanup job', {
        type: 'job',
        job: 'cleanup',
        error: error.message,
      });
    }
  });

  logger.info('Scheduler initialized', {
    jobs: ['reminders (30min)', 'emailQueue (1min)', 'cleanup (daily 3AM)'],
  });
}

/**
 * Manually trigger reminders processing (useful for testing)
 */
export async function triggerRemindersManually() {
  console.log('🔧 Manually triggering reminders...');
  return reminderService.processReminders();
}
