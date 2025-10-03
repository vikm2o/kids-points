# Screen Cleanup System

Automatic cleanup system to delete old screens created before the current day.

## Features

### 1. Manual Cleanup
- **Endpoint**: `POST /api/screens/cleanup`
- **Function**: Deletes all screens with `created_at` before today
- **Access**: Admin Dashboard → "Cleanup Screens" button
- **Response**:
  ```json
  {
    "success": true,
    "message": "Screen cleanup completed",
    "summary": {
      "total_screens": 150,
      "old_screens_found": 145,
      "deleted": 143,
      "failed": 2
    },
    "deleted_screen_ids": [1, 2, 3, ...],
    "failed_screens": [
      { "id": 99, "error": "..." }
    ]
  }
  ```

### 2. Automatic Cleanup (Cron Job)
- **Schedule**: Daily at 2:00 AM
- **Timezone**: America/New_York (configurable in `/src/lib/cron.ts`)
- **Initialization**:
  - Automatic: Initialize on app startup
  - Manual: Admin Dashboard → "Init Cron" button

### 3. Additional Endpoints

#### List All Screens
```bash
GET /api/screens
```
Returns all screens from Terminus API.

#### Delete Single Screen
```bash
DELETE /api/screens/{id}
```
Deletes a specific screen by ID.

## Setup

### 1. Install Dependencies
```bash
npm install
```
This will install `node-cron` and `@types/node-cron`.

### 2. Configure Timezone
Edit `/src/lib/cron.ts` to change the timezone:
```typescript
timezone: 'America/New_York' // Change to your timezone
```

### 3. Initialize Cron Job
- Option A: Click "Init Cron" button in Admin Dashboard
- Option B: Make a POST request to `/api/cron/init`

## Usage

### Manual Cleanup
1. Go to Admin Dashboard
2. Click "Cleanup Screens" button
3. Confirm the action
4. View cleanup summary

### Automatic Cleanup
1. Click "Init Cron" button once
2. Cleanup will run automatically every day at 2 AM
3. Check server logs for cleanup results

## Files Created

- `/src/app/api/screens/route.ts` - GET endpoint added
- `/src/app/api/screens/[id]/route.ts` - DELETE endpoint
- `/src/app/api/screens/cleanup/route.ts` - Cleanup endpoint
- `/src/lib/cron.ts` - Cron job configuration
- `/src/app/api/cron/init/route.ts` - Cron initialization endpoint
- `/src/app/admin/page.tsx` - UI buttons added

## How It Works

1. **List Screens**: Fetches all screens from `${TERMINUS_API_URL}/api/screens`
2. **Filter Old Screens**: Compares each screen's `created_at` with today's date
3. **Delete**: Iterates through old screens and deletes them one by one
4. **Report**: Returns summary of deleted and failed screens

## Logging

All cleanup operations are logged to the console:
```
Fetching all screens for cleanup...
Found 150 total screens
Found 145 screens to delete (created before 2025-09-30T00:00:00.000Z)
Deleted screen 1 (dashboard_1_1759123456789)
Deleted screen 2 (dashboard_2_1759123457890)
...
Cleanup complete: 143 deleted, 2 failed
```

## Error Handling

- Continues deleting even if some screens fail
- Reports failed deletions in response
- Does not throw errors for partial failures
- Logs all errors to console

## Timezone Configuration

Available timezone options (commonly used):
- `America/New_York` (EST/EDT)
- `America/Los_Angeles` (PST/PDT)
- `America/Chicago` (CST/CDT)
- `Europe/London` (GMT/BST)
- `Asia/Tokyo` (JST)
- `UTC` (Coordinated Universal Time)

See full list: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones