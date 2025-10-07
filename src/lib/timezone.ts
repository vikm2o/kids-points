// Timezone utility functions

// Common timezone options for the dropdown
export const TIMEZONE_OPTIONS = [
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
  { value: 'America/New_York', label: 'Eastern Time (US & Canada)' },
  { value: 'America/Chicago', label: 'Central Time (US & Canada)' },
  { value: 'America/Denver', label: 'Mountain Time (US & Canada)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (US & Canada)' },
  { value: 'America/Anchorage', label: 'Alaska' },
  { value: 'Pacific/Honolulu', label: 'Hawaii' },
  { value: 'Europe/London', label: 'London' },
  { value: 'Europe/Paris', label: 'Paris' },
  { value: 'Europe/Berlin', label: 'Berlin' },
  { value: 'Asia/Dubai', label: 'Dubai' },
  { value: 'Asia/Kolkata', label: 'India (IST)' },
  { value: 'Asia/Shanghai', label: 'China' },
  { value: 'Asia/Singapore', label: 'Singapore' },
  { value: 'Asia/Hong_Kong', label: 'Hong Kong' },
  { value: 'Asia/Tokyo', label: 'Tokyo' },
  { value: 'Asia/Seoul', label: 'Seoul' },
  { value: 'Australia/Sydney', label: 'Sydney' },
  { value: 'Pacific/Auckland', label: 'Auckland' },
];

let cachedTimezone: string | null = null;

// Get the configured timezone from the settings
export async function getTimezone(): Promise<string> {
  if (cachedTimezone) {
    return cachedTimezone;
  }

  try {
    const response = await fetch('/api/settings');
    if (response.ok) {
      const data = await response.json();
      cachedTimezone = data.timezone || 'UTC';
      return cachedTimezone;
    }
  } catch (error) {
    console.error('Failed to fetch timezone:', error);
  }

  return 'UTC';
}

// Clear the cached timezone (call after updating settings)
export function clearTimezoneCache() {
  cachedTimezone = null;
}

// Get current date/time in the configured timezone
export function getNow(timezone: string): Date {
  // Create a date string in the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });

  const parts = formatter.formatToParts(new Date());
  const partsMap: Record<string, string> = {};
  parts.forEach(part => {
    if (part.type !== 'literal') {
      partsMap[part.type] = part.value;
    }
  });

  // Construct ISO-like string
  const dateStr = `${partsMap.year}-${partsMap.month}-${partsMap.day}T${partsMap.hour}:${partsMap.minute}:${partsMap.second}`;
  return new Date(dateStr);
}

// Get current time string (HH:MM) in the configured timezone
export function getCurrentTime(timezone: string): string {
  const now = getNow(timezone);
  return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
}

// Get today's date string (YYYY-MM-DD) in the configured timezone
export function getTodayDate(timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });

  const parts = formatter.formatToParts(new Date());
  const partsMap: Record<string, string> = {};
  parts.forEach(part => {
    if (part.type !== 'literal') {
      partsMap[part.type] = part.value;
    }
  });

  return `${partsMap.year}-${partsMap.month}-${partsMap.day}`;
}

// Get day of week (0-6, Sunday = 0) in the configured timezone
export function getDayOfWeek(timezone: string): number {
  const now = getNow(timezone);
  return now.getDay();
}

// Format date for display in the configured timezone
export function formatDate(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  }).format(date);
}

// Format time for display in the configured timezone
export function formatTime(date: Date, timezone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date);
}

// Get date string for Terminus display
export function getDateString(timezone: string): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const dateStr = formatter.format(new Date());
  return dateStr;
}
