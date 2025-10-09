# Automatic Daily Reset - Server-Side Implementation

## Overview

The Kids Points Dashboard now uses a **fully server-side** approach for automatic daily resets and screen management. All date changes, routine resets, and screen updates are handled by server-side cron jobs.

## How It Works

### Server-Side Cron Jobs

Two cron jobs run automatically on the server:

#### 1. Daily Reset (Midnight)
**Schedule**: `0 0 * * *` (Every day at 12:00 AM)
**Timezone**: America/New_York (configurable)

**Actions**:
1. Checks if it's a new day (using timezone-aware date comparison)
2. Resets all daily routines (unchecks completed tasks)
3. Updates the `last_reset_date` in the database
4. Syncs all kids' dashboards to their assigned devices
5. Updates all screen displays with fresh data

**Code Location**: `src/lib/cron.ts` - `startDailyResetCron()`

#### 2. Screen Cleanup (2 AM)
**Schedule**: `0 2 * * *` (Every day at 2:00 AM)
**Timezone**: America/New_York (configurable)

**Actions**:
1. Deletes old screens created before the current day
2. Removes them from playlists
3. Frees up storage and keeps the system clean

**Code Location**: `src/lib/cron.ts` - `startScreenCleanupCron()`

### Client-Side Behavior

The client (Dashboard) now:
- **Does NOT** check for date changes
- **Does NOT** trigger resets
- **Only** refreshes data from the server every 5 minutes
- Updates the Terminus display when data changes

**Code Location**: `src/hooks/useTerminus.ts`

## Setup

### 1. Initialize Cron Jobs

The cron jobs must be initialized when the app starts. You can do this in two ways:

#### Option A: Via Admin Interface (Recommended)
1. Go to `/admin`
2. Click the "Init Cron" button
3. You'll see a confirmation that both cron jobs are running

#### Option B: Via API Endpoint
```bash
curl -X POST http://localhost:3000/api/cron/init
```

### 2. Verify Cron Jobs Are Running

Check your server logs for:
```
Daily reset cron job started - will run at midnight every day
Screen cleanup cron job started - will run daily at 2 AM
```

### 3. Configure Timezone (Optional)

Edit `src/lib/cron.ts` to change the timezone:
```typescript
timezone: 'America/New_York' // Change to your timezone
```

Common timezones:
- `America/New_York` (Eastern)
- `America/Chicago` (Central)
- `America/Denver` (Mountain)
- `America/Los_Angeles` (Pacific)
- `UTC` (Universal)

Also set your timezone in System Settings via the Admin interface.

## Flow Diagram

```
Midnight (00:00)
    ↓
[Daily Reset Cron Triggers]
    ↓
Check if it's a new day
    ↓
YES → Reset all daily routines (uncheck tasks)
    ↓
Update last_reset_date in database
    ↓
Get all kids from database
    ↓
For each kid:
    - Sync dashboard data
    - Update screen on device
    - Reflect new day's tasks
    ↓
[Screens now show fresh data for new day]
    ↓
2 AM (02:00)
    ↓
[Screen Cleanup Cron Triggers]
    ↓
Delete all screens created before today
    ↓
Remove from playlists
    ↓
[Old screens cleaned up]
```

## Key Files

### Server-Side
- `src/lib/cron.ts` - Cron job definitions
- `src/lib/database.ts` - `checkAndResetIfNeeded()`, `resetDailyRoutines()`
- `src/app/api/cron/init/route.ts` - Cron initialization endpoint
- `src/app/api/cron/daily-reset/route.ts` - Daily reset endpoint
- `src/app/api/screens/cleanup/route.ts` - Screen cleanup endpoint
- `src/app/api/dashboard/sync/route.ts` - Dashboard sync endpoint

### Client-Side
- `src/hooks/useTerminus.ts` - Client refresh logic (no reset logic)
- `src/components/Dashboard.tsx` - Main dashboard component

## Troubleshooting

### Screens Not Resetting Automatically

1. **Check if cron jobs are initialized**:
   - Go to `/admin` and click "Init Cron"
   - Check server logs for initialization messages

2. **Verify timezone is correct**:
   - Check `src/lib/cron.ts` timezone setting
   - Check System Settings in Admin interface

3. **Check server logs at midnight**:
   - Look for: "Running scheduled daily reset at midnight..."
   - Look for: "Daily routines reset"
   - Look for: "Dashboard synced for kid: [name]"

4. **Verify the app is running**:
   - Cron jobs only work if the Node.js process is running
   - If using Docker, ensure the container is running
   - If using PM2 or similar, ensure the process is active

### Manual Reset

If you need to manually trigger a reset:

1. **Via Admin Interface**:
   - Go to `/admin`
   - Click "Reset Daily" button

2. **Via API**:
   ```bash
   curl -X POST http://localhost:3000/api/cron/daily-reset
   ```

## Production Deployment

For production deployment:

1. **Docker**: Cron jobs will run inside the container as long as it's running
2. **PM2**: The process will stay alive and run cron jobs
3. **Vercel/Netlify**: Serverless platforms don't support cron jobs
   - Use external cron services (e.g., GitHub Actions, Vercel Cron)
   - Or use a webhook to trigger `/api/cron/daily-reset` daily

## Benefits of Server-Side Approach

1. ✅ **Reliable**: Resets happen at exact time, regardless of client activity
2. ✅ **Consistent**: All devices reset simultaneously
3. ✅ **Efficient**: No duplicate reset requests from multiple clients
4. ✅ **Centralized**: Easy to debug and monitor from server logs
5. ✅ **Battery-friendly**: Clients don't need to run background checks

## Migration Notes

If you were using the old client-side date checking:
- Client now only refreshes data every 5 minutes
- All reset logic moved to server-side cron
- No breaking changes to API or data structure
