import cron from 'node-cron';
import axios from 'axios';

let cleanupTask: cron.ScheduledTask | null = null;

export function startScreenCleanupCron() {
  // Prevent multiple cron instances
  if (cleanupTask) {
    console.log('Screen cleanup cron already running');
    return;
  }

  // Run at 2 AM every day (cron format: minute hour day month weekday)
  // '0 2 * * *' means: at minute 0, hour 2, every day
  cleanupTask = cron.schedule('0 2 * * *', async () => {
    console.log('Running scheduled screen cleanup at 2 AM...');

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const response = await axios.post(`${appUrl}/api/screens/cleanup`, {}, {
        timeout: 60000, // 60 second timeout for cleanup
        headers: {
          'Content-Type': 'application/json',
        }
      });

      console.log('Screen cleanup completed:', response.data);
    } catch (error) {
      console.error('Failed to run scheduled screen cleanup:', error);
    }
  }, {
    scheduled: true,
    timezone: 'America/New_York' // Change to your timezone
  });

  console.log('Screen cleanup cron job started - will run daily at 2 AM');
}

export function stopScreenCleanupCron() {
  if (cleanupTask) {
    cleanupTask.stop();
    cleanupTask = null;
    console.log('Screen cleanup cron job stopped');
  }
}