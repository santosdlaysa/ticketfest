import cron from 'node-cron';
import { reminderService } from '../services/reminder.service.js';

/**
 * Initialize all scheduled jobs
 */
export function initializeScheduler() {
  console.log('📅 Initializing scheduler...');

  // Process event reminders every 30 minutes
  // Runs at minute 0 and 30 of every hour
  cron.schedule('0,30 * * * *', async () => {
    console.log('⏰ Running event reminders job...');
    try {
      const result = await reminderService.processReminders();
      console.log(
        `✅ Reminders job completed: ${result.sent24h} (24h), ${result.sent2h} (2h) emails sent`
      );
    } catch (error) {
      console.error('❌ Error in reminders job:', error);
    }
  });

  console.log('✅ Scheduler initialized - Event reminders will run every 30 minutes');
}

/**
 * Manually trigger reminders processing (useful for testing)
 */
export async function triggerRemindersManually() {
  console.log('🔧 Manually triggering reminders...');
  return reminderService.processReminders();
}
