export interface Kid {
  id: string;
  name: string;
  avatar?: string;
  lifetimePoints: number; // Total points earned all time (includes redeemed)
  redeemedPoints: number; // Total points spent on rewards
  deviceId?: string; // Optional Terminus device ID for this kid
  accessToken?: string; // Optional Terminus access token for this kid's device
}

export interface RoutineItem {
  id: string;
  title: string;
  description?: string;
  points: number;
  time: string; // HH:MM format
  endTime?: string; // HH:MM format (optional)
  completed: boolean;
  completedDate?: string; // YYYY-MM-DD - date when task was completed
  kidId: string;
  daysOfWeek: number[]; // Array of 0-6 (Sunday-Saturday), e.g., [1,2,3,4,5] for weekdays
  dateOverride?: string; // YYYY-MM-DD for custom one-off routine on a date
}

export interface DaySchedule {
  date: string;
  items: RoutineItem[];
}

export interface TerminusPayload {
  device_id?: string; // Optional device ID for specific device targeting
  access_token?: string; // Optional access token for device authentication
  kid_name: string;
  total_points: number;
  daily_points: number;
  weekly_points?: number;
  next_todo: string;
  todos: {
    title: string;
    time: string;
    completed: boolean;
    is_next: boolean;
    points?: number;
  }[];
}

export interface TerminusConfig {
  apiUrl: string;
  endpoint: string;
  deviceId?: string; // Optional device ID
}

export interface Device {
  id: number;
  model_id: number;
  playlist_id: number;
  friendly_id: string;
  label: string;
  mac_address: string;
  api_key: string;
  firmware_version: string;
  firmware_beta: boolean;
  wifi: number;
  battery: number;
  refresh_rate: number;
  image_timeout: number;
  width: number;
  height: number;
  proxy: boolean;
  firmware_update: boolean;
  sleep_start_at: string | null;
  sleep_stop_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Screen {
  id: number;
  model_id: number;
  label: string;
  name: string;
  created_at: string;
  updated_at: string;
  filename: string;
  mime_type: string;
  bit_depth: number;
  width: number;
  height: number;
  size: number;
  uri: string;
}

export interface PlaylistItem {
  id: number;
  playlist_id: number;
  screen_id: number;
  position: number;
  repeat_interval: number;
  repeat_type: string;
  repeat_days: number[];
  last_day_of_month: boolean;
  start_at: string | null;
  stop_at: string | null;
  hidden_at: string | null;
  created_at: string;
  updated_at: string;
  screen: Screen;
}

export interface Reward {
  id: string;
  title: string;
  description?: string;
  pointsCost: number;
  icon?: string;
  available: boolean;
  kidId?: string; // Optional - if null, available to all kids
}

export interface Redemption {
  id: string;
  kidId: string;
  rewardId: string;
  pointsSpent: number;
  redeemedAt: string;
  status: 'pending' | 'approved' | 'completed';
}