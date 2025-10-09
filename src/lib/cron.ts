import cron from 'node-cron';
import axios from 'axios';

let cleanupTask: cron.ScheduledTask | null = null;
let dailyResetTask: cron.ScheduledTask | null = null;

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

export function startDailyResetCron() {
  // Prevent multiple cron instances
  if (dailyResetTask) {
    console.log('Daily reset cron already running');
    return;
  }

  // Run at midnight every day (cron format: minute hour day month weekday)
  // '0 0 * * *' means: at minute 0, hour 0 (midnight), every day
  dailyResetTask = cron.schedule('0 0 * * *', async () => {
    console.log('Running scheduled daily reset at midnight...');

    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

      // First, reset the daily routines
      const resetResponse = await axios.post(`${appUrl}/api/cron/daily-reset`, {}, {
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
        }
      });
      console.log('Daily routines reset:', resetResponse.data);

      // Then, sync all kids' dashboards to update their screens
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

      console.log('Daily reset and dashboard sync completed successfully');
    } catch (error) {
      console.error('Failed to run scheduled daily reset:', error);
    }
  }, {
    scheduled: true,
    timezone: 'America/New_York' // Change to your timezone
  });

  console.log('Daily reset cron job started - will run at midnight every day');
}

export function stopDailyResetCron() {
  if (dailyResetTask) {
    dailyResetTask.stop();
    dailyResetTask = null;
    console.log('Daily reset cron job stopped');
  }
}