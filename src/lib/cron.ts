import cron from 'node-cron';
import axios from 'axios';
import { getDatabase } from './database';

let cleanupTask: cron.ScheduledTask | null = null;
let dailyResetTask: cron.ScheduledTask | null = null;

// Get timezone from database settings
function getTimezoneFromSettings(): string {
  try {
    const db = getDatabase();
    const timezoneRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('timezone') as { value: string } | undefined;
    return timezoneRow?.value || 'UTC';
  } catch (error) {
    console.error('Failed to get timezone from settings, using UTC:', error);
    return 'UTC';
  }
}

export function startScreenCleanupCron() {
  // Prevent multiple cron instances
  if (cleanupTask) {
    console.log('Screen cleanup cron already running');
    return;
  }

  // Get timezone from settings
  const timezone = getTimezoneFromSettings();

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
    timezone: timezone
  });

  console.log(`Screen cleanup cron job started - will run daily at 2 AM ${timezone}`);
}

export function stopScreenCleanupCron() {
  if (cleanupTask) {
    cleanupTask.stop();
    cleanupTask = null;
    console.log('Screen cleanup cron job stopped');
  }
}

export function startDailyResetCron() {
  // Prevent multiple cron instances
  if (dailyResetTask) {
    console.log('Daily reset cron already running');
    return;
  }

  // Get timezone from settings
  const timezone = getTimezoneFromSettings();

  // Run at midnight every day (cron format: minute hour day month weekday)
  // '0 0 * * *' means: at minute 0, hour 0 (midnight), every day
  dailyResetTask = cron.schedule('0 0 * * *', async () => {
    console.log('Running scheduled daily reset at midnight...');

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      // Step 1: Reset the daily routines
      const resetResponse = await axios.post(`${appUrl}/api/cron/daily-reset`, {}, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('Daily routines reset:', resetResponse.data);

      // Step 2: Clean up old screens from previous days
      try {
        const cleanupResponse = await axios.post(`${appUrl}/api/screens/cleanup`, {}, {
          timeout: 60000,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        console.log('Screen cleanup completed:', cleanupResponse.data);
      } catch (error) {
        console.error('Failed to cleanup old screens:', error);
        // Continue with dashboard sync even if cleanup fails
      }

      // Step 3: Sync all kids' dashboards to update their screens
      // Get all kids first
      const kidsResponse = await axios.get(`${appUrl}/api/kids`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const kids = Array.isArray(kidsResponse.data)
        ? kidsResponse.data
        : (Array.isArray(kidsResponse.data?.data) ? kidsResponse.data.data : []);

      console.log(`Syncing dashboards for ${kids.length} kids...`);

      // Sync each kid's dashboard
      for (const kid of kids) {
        try {
          await axios.post(`${appUrl}/api/dashboard/sync`,
            { kidId: kid.id },
            {
              timeout: 30000,
              headers: {
                'Content-Type': 'application/json',
              }
            }
          );
          console.log(`Dashboard synced for kid: ${kid.name}`);
        } catch (error) {
          console.error(`Failed to sync dashboard for kid ${kid.name}:`, error);
        }
      }

      console.log('Daily reset, screen cleanup, and dashboard sync completed successfully');
    } catch (error) {
      console.error('Failed to run scheduled daily reset:', error);
    }
  }, {
    scheduled: true,
    timezone: timezone
  });

  console.log(`Daily reset cron job started - will run at midnight every day (${timezone})`);
}

export function stopDailyResetCron() {
  if (dailyResetTask) {
    dailyResetTask.stop();
    dailyResetTask = null;
    console.log('Daily reset cron job stopped');
  }
}