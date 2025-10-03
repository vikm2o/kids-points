import Database from 'better-sqlite3';
import path from 'path';
import { Kid, RoutineItem, Device, Reward, Redemption } from '@/types';

let db: Database.Database | null = null;

export function getDatabase() {
  if (!db) {
    // Use a persistent data directory
    const dataDir = process.env.NODE_ENV === 'production'
      ? path.join(process.cwd(), 'data')
      : process.cwd();

    // Ensure data directory exists
    if (!require('fs').existsSync(dataDir)) {
      require('fs').mkdirSync(dataDir, { recursive: true });
    }

    const dbPath = path.join(dataDir, 'kids-points.db');
    db = new Database(dbPath);

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Initialize tables
    initializeTables();

    // Seed with initial data if empty
    seedDatabase();
  }
  return db;
}

function initializeTables() {
  const db = getDatabase();

  // Kids table
  db.exec(`
    CREATE TABLE IF NOT EXISTS kids (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      avatar TEXT,
      total_points INTEGER DEFAULT 0,
      daily_points INTEGER DEFAULT 0,
      device_id TEXT,
      access_token TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add access_token column if it doesn't exist (for existing databases)
  try {
    db.exec(`ALTER TABLE kids ADD COLUMN access_token TEXT`);
  } catch (error) {
    // Column might already exist, ignore the error
  }

  // Routines table
  db.exec(`
    CREATE TABLE IF NOT EXISTS routines (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      points INTEGER DEFAULT 0,
      time TEXT NOT NULL,
      end_time TEXT,
      completed BOOLEAN DEFAULT FALSE,
      kid_id TEXT NOT NULL,
      days_of_week TEXT NOT NULL, -- JSON array of days
      date_override TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (kid_id) REFERENCES kids(id) ON DELETE CASCADE
    )
  `);

  // Add end_time column if it doesn't exist
  try {
    db.exec(`ALTER TABLE routines ADD COLUMN end_time TEXT`);
  } catch (e) {
    // ignore if exists
  }
  try {
    db.exec(`ALTER TABLE routines ADD COLUMN date_override TEXT`);
  } catch (e) {
    // ignore if exists
  }

  // Devices table
  db.exec(`
    CREATE TABLE IF NOT EXISTS devices (
      id INTEGER PRIMARY KEY,
      model_id INTEGER NOT NULL,
      playlist_id INTEGER NOT NULL,
      friendly_id TEXT NOT NULL,
      label TEXT,
      mac_address TEXT NOT NULL,
      api_key TEXT NOT NULL,
      firmware_version TEXT,
      firmware_beta BOOLEAN DEFAULT FALSE,
      wifi INTEGER,
      battery REAL,
      refresh_rate INTEGER,
      image_timeout INTEGER,
      width INTEGER,
      height INTEGER,
      proxy BOOLEAN DEFAULT FALSE,
      firmware_update BOOLEAN DEFAULT FALSE,
      sleep_start_at TEXT,
      sleep_stop_at TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Rewards table
  db.exec(`
    CREATE TABLE IF NOT EXISTS rewards (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      points_cost INTEGER NOT NULL,
      icon TEXT,
      available BOOLEAN DEFAULT TRUE,
      kid_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (kid_id) REFERENCES kids(id) ON DELETE CASCADE
    )
  `);

  // Redemptions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS redemptions (
      id TEXT PRIMARY KEY,
      kid_id TEXT NOT NULL,
      reward_id TEXT NOT NULL,
      points_spent INTEGER NOT NULL,
      redeemed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (kid_id) REFERENCES kids(id) ON DELETE CASCADE,
      FOREIGN KEY (reward_id) REFERENCES rewards(id) ON DELETE CASCADE
    )
  `);

  // Create indexes for better performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_routines_kid_id ON routines(kid_id);
    CREATE INDEX IF NOT EXISTS idx_routines_time ON routines(time);
    CREATE INDEX IF NOT EXISTS idx_devices_friendly_id ON devices(friendly_id);
    CREATE INDEX IF NOT EXISTS idx_devices_mac_address ON devices(mac_address);
    CREATE INDEX IF NOT EXISTS idx_rewards_kid_id ON rewards(kid_id);
    CREATE INDEX IF NOT EXISTS idx_redemptions_kid_id ON redemptions(kid_id);
  `);
}

function seedDatabase() {
  const db = getDatabase();

  // Check if we already have data
  const kidCount = db.prepare('SELECT COUNT(*) as count FROM kids').get() as { count: number };

  if (kidCount.count === 0) {
    console.log('Seeding database with initial data...');

    // Insert sample kids
    const insertKid = db.prepare(`
      INSERT INTO kids (id, name, avatar, total_points, daily_points, device_id)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    insertKid.run('1', 'Emma', '👧', 145, 25, 'trml_emma');
    insertKid.run('2', 'Alex', '👦', 128, 30, 'trml_alex');

    // Insert sample routines
    const insertRoutine = db.prepare(`
      INSERT INTO routines (id, title, description, points, time, completed, kid_id, days_of_week)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Emma's routines
    insertRoutine.run('1', 'Wake up & Get Dressed', 'Get out of bed and put on clothes', 5, '07:00', true, '1', JSON.stringify([1, 2, 3, 4, 5]));
    insertRoutine.run('2', 'Brush Teeth', 'Brush teeth for 2 minutes', 3, '07:15', true, '1', JSON.stringify([0, 1, 2, 3, 4, 5, 6]));
    insertRoutine.run('3', 'Eat Breakfast', 'Finish breakfast without being reminded', 5, '07:30', false, '1', JSON.stringify([0, 1, 2, 3, 4, 5, 6]));
    insertRoutine.run('4', 'Pack School Bag', 'Pack homework and lunch', 5, '08:00', false, '1', JSON.stringify([1, 2, 3, 4, 5]));
    insertRoutine.run('5', 'After School Snack', 'Healthy snack after school', 3, '15:30', false, '1', JSON.stringify([1, 2, 3, 4, 5]));
    insertRoutine.run('6', 'Homework Time', 'Complete all homework assignments', 10, '16:00', false, '1', JSON.stringify([1, 2, 3, 4, 5]));
    insertRoutine.run('7', 'Dinner', 'Eat dinner with family', 5, '18:00', false, '1', JSON.stringify([0, 1, 2, 3, 4, 5, 6]));
    insertRoutine.run('8', 'Bedtime Routine', 'Brush teeth, read, and get ready for bed', 5, '20:00', false, '1', JSON.stringify([0, 1, 2, 3, 4, 5, 6]));
    insertRoutine.run('9', 'Family Time', 'Spend quality time with family', 10, '10:00', false, '1', JSON.stringify([0, 6]));

    // Alex's routines
    insertRoutine.run('10', 'Morning Exercise', '10 minutes of stretching or light exercise', 8, '07:30', false, '2', JSON.stringify([1, 3, 5]));

    console.log('Database seeded successfully!');
  }
}

// Database operations for Kids
export const KidsDB = {
  getAll(): Kid[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM kids ORDER BY name').all() as any[];
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      avatar: row.avatar,
      totalPoints: row.total_points,
      dailyPoints: row.daily_points,
      deviceId: row.device_id,
      accessToken: row.access_token
    }));
  },

  getById(id: string): Kid | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM kids WHERE id = ?').get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      name: row.name,
      avatar: row.avatar,
      totalPoints: row.total_points,
      dailyPoints: row.daily_points,
      deviceId: row.device_id,
      accessToken: row.access_token
    };
  },

  create(kid: Omit<Kid, 'id'>): Kid {
    const db = getDatabase();
    const id = Date.now().toString();

    db.prepare(`
      INSERT INTO kids (id, name, avatar, total_points, daily_points, device_id, access_token)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, kid.name, kid.avatar, kid.totalPoints, kid.dailyPoints, kid.deviceId, kid.accessToken);

    return { id, ...kid };
  },

  update(id: string, updates: Partial<Kid>): Kid | null {
    const db = getDatabase();
    const current = this.getById(id);
    if (!current) return null;

    const updated = { ...current, ...updates };

    db.prepare(`
      UPDATE kids
      SET name = ?, avatar = ?, total_points = ?, daily_points = ?, device_id = ?, access_token = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(updated.name, updated.avatar, updated.totalPoints, updated.dailyPoints, updated.deviceId, updated.accessToken, id);

    return updated;
  },

  delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM kids WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

// Database operations for Routines
export const RoutinesDB = {
  getAll(): RoutineItem[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM routines ORDER BY time').all() as any[];
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      points: row.points,
      time: row.time,
      endTime: row.end_time,
      completed: Boolean(row.completed),
      kidId: row.kid_id,
      daysOfWeek: JSON.parse(row.days_of_week),
      dateOverride: row.date_override || undefined
    }));
  },

  getByKidId(kidId: string): RoutineItem[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM routines WHERE kid_id = ? ORDER BY time').all(kidId) as any[];
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      points: row.points,
      time: row.time,
      endTime: row.end_time,
      completed: Boolean(row.completed),
      kidId: row.kid_id,
      daysOfWeek: JSON.parse(row.days_of_week),
      dateOverride: row.date_override || undefined
    }));
  },

  create(routine: Omit<RoutineItem, 'id'>): RoutineItem {
    const db = getDatabase();
    const id = Date.now().toString();

    // Ensure daysOfWeek is valid
    if (!Array.isArray(routine.daysOfWeek)) {
      throw new Error(`daysOfWeek must be an array, got: ${typeof routine.daysOfWeek}`);
    }

    const daysOfWeekStr = JSON.stringify(routine.daysOfWeek);

    db.prepare(`
      INSERT INTO routines (id, title, description, points, time, end_time, completed, kid_id, days_of_week, date_override)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      routine.title,
      routine.description,
      routine.points,
      routine.time,
      routine.endTime || null,
      routine.completed ? 1 : 0,
      routine.kidId,
      daysOfWeekStr,
      routine.dateOverride || null
    );

    return { id, ...routine };
  },

  update(id: string, updates: Partial<RoutineItem>): RoutineItem | null {
    const db = getDatabase();
    const current = this.getById(id);
    if (!current) return null;

    const updated = { ...current, ...updates };

    db.prepare(`
      UPDATE routines
      SET title = ?, description = ?, points = ?, time = ?, end_time = ?, completed = ?, kid_id = ?, days_of_week = ?, date_override = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      updated.title,
      updated.description ?? null,
      updated.points,
      updated.time,
      updated.endTime ?? null,
      updated.completed ? 1 : 0,
      updated.kidId,
      JSON.stringify(updated.daysOfWeek),
      updated.dateOverride ?? null,
      id
    );

    return updated;
  },

  getById(id: string): RoutineItem | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM routines WHERE id = ?').get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      points: row.points,
      time: row.time,
      endTime: row.end_time,
      completed: Boolean(row.completed),
      kidId: row.kid_id,
      daysOfWeek: JSON.parse(row.days_of_week),
      dateOverride: row.date_override || undefined
    };
  },

  delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM routines WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

// Helper functions
export function getTodayRoutines(kidId: string): RoutineItem[] {
  const now = new Date();
  const todayDow = now.getDay();
  const todayISO = now.toISOString().slice(0, 10);
  const routines = RoutinesDB.getByKidId(kidId);
  const overrides = routines.filter(r => r.dateOverride === todayISO);
  if (overrides.length > 0) {
    return overrides.sort((a, b) => (a.time || '').localeCompare(b.time || ''));
  }
  return routines
    .filter(routine => routine.daysOfWeek.includes(todayDow))
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));
}

export function getNextRoutineItem(kidId: string): RoutineItem | null {
  const todayRoutines = getTodayRoutines(kidId);
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const nextItem = todayRoutines
    .filter(item => !item.completed && item.time >= currentTime)
    .sort((a, b) => a.time.localeCompare(b.time))[0];

  return nextItem || null;
}

// Database operations for Devices
export const DevicesDB = {
  getAll(): Device[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM devices ORDER BY friendly_id').all() as any[];
    return rows.map(row => ({
      id: row.id,
      model_id: row.model_id,
      playlist_id: row.playlist_id,
      friendly_id: row.friendly_id,
      label: row.label,
      mac_address: row.mac_address,
      api_key: row.api_key,
      firmware_version: row.firmware_version,
      firmware_beta: Boolean(row.firmware_beta),
      wifi: row.wifi,
      battery: row.battery,
      refresh_rate: row.refresh_rate,
      image_timeout: row.image_timeout,
      width: row.width,
      height: row.height,
      proxy: Boolean(row.proxy),
      firmware_update: Boolean(row.firmware_update),
      sleep_start_at: row.sleep_start_at,
      sleep_stop_at: row.sleep_stop_at,
      created_at: row.created_at,
      updated_at: row.updated_at
    }));
  },

  getById(id: number): Device | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM devices WHERE id = ?').get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      model_id: row.model_id,
      playlist_id: row.playlist_id,
      friendly_id: row.friendly_id,
      label: row.label,
      mac_address: row.mac_address,
      api_key: row.api_key,
      firmware_version: row.firmware_version,
      firmware_beta: Boolean(row.firmware_beta),
      wifi: row.wifi,
      battery: row.battery,
      refresh_rate: row.refresh_rate,
      image_timeout: row.image_timeout,
      width: row.width,
      height: row.height,
      proxy: Boolean(row.proxy),
      firmware_update: Boolean(row.firmware_update),
      sleep_start_at: row.sleep_start_at,
      sleep_stop_at: row.sleep_stop_at,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  },

  getByFriendlyId(friendlyId: string): Device | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM devices WHERE friendly_id = ?').get(friendlyId) as any;
    if (!row) return null;

    return {
      id: row.id,
      model_id: row.model_id,
      playlist_id: row.playlist_id,
      friendly_id: row.friendly_id,
      label: row.label,
      mac_address: row.mac_address,
      api_key: row.api_key,
      firmware_version: row.firmware_version,
      firmware_beta: Boolean(row.firmware_beta),
      wifi: row.wifi,
      battery: row.battery,
      refresh_rate: row.refresh_rate,
      image_timeout: row.image_timeout,
      width: row.width,
      height: row.height,
      proxy: Boolean(row.proxy),
      firmware_update: Boolean(row.firmware_update),
      sleep_start_at: row.sleep_start_at,
      sleep_stop_at: row.sleep_stop_at,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  },

  create(device: Device): Device {
    const db = getDatabase();

    db.prepare(`
      INSERT INTO devices (
        id, model_id, playlist_id, friendly_id, label, mac_address, api_key,
        firmware_version, firmware_beta, wifi, battery, refresh_rate, image_timeout,
        width, height, proxy, firmware_update, sleep_start_at, sleep_stop_at,
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      device.id,
      device.model_id,
      device.playlist_id,
      device.friendly_id,
      device.label,
      device.mac_address,
      device.api_key,
      device.firmware_version,
      device.firmware_beta ? 1 : 0,
      device.wifi,
      device.battery,
      device.refresh_rate,
      device.image_timeout,
      device.width,
      device.height,
      device.proxy ? 1 : 0,
      device.firmware_update ? 1 : 0,
      device.sleep_start_at,
      device.sleep_stop_at,
      device.created_at,
      device.updated_at
    );

    return device;
  },

  update(id: number, updates: Partial<Device>): Device | null {
    const db = getDatabase();
    const current = this.getById(id);
    if (!current) return null;

    const updated = { ...current, ...updates };

    db.prepare(`
      UPDATE devices
      SET model_id = ?, playlist_id = ?, friendly_id = ?, label = ?, mac_address = ?, api_key = ?,
          firmware_version = ?, firmware_beta = ?, wifi = ?, battery = ?, refresh_rate = ?, image_timeout = ?,
          width = ?, height = ?, proxy = ?, firmware_update = ?, sleep_start_at = ?, sleep_stop_at = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(
      updated.model_id,
      updated.playlist_id,
      updated.friendly_id,
      updated.label,
      updated.mac_address,
      updated.api_key,
      updated.firmware_version,
      updated.firmware_beta ? 1 : 0,
      updated.wifi,
      updated.battery,
      updated.refresh_rate,
      updated.image_timeout,
      updated.width,
      updated.height,
      updated.proxy ? 1 : 0,
      updated.firmware_update ? 1 : 0,
      updated.sleep_start_at,
      updated.sleep_stop_at,
      id
    );

    return updated;
  },

  delete(id: number): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM devices WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

// Database operations for Rewards
export const RewardsDB = {
  getAll(): Reward[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM rewards ORDER BY points_cost').all() as any[];
    return rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      pointsCost: row.points_cost,
      icon: row.icon,
      available: Boolean(row.available),
      kidId: row.kid_id
    }));
  },

  getById(id: string): Reward | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM rewards WHERE id = ?').get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      pointsCost: row.points_cost,
      icon: row.icon,
      available: Boolean(row.available),
      kidId: row.kid_id
    };
  },

  getAvailableForKid(kidId: string): Reward[] {
    const db = getDatabase();
    const rows = db.prepare(
      'SELECT * FROM rewards WHERE available = 1 AND (kid_id IS NULL OR kid_id = ?) ORDER BY points_cost'
    ).all(kidId) as any[];

    return rows.map(row => ({
      id: row.id,
      title: row.title,
      description: row.description,
      pointsCost: row.points_cost,
      icon: row.icon,
      available: Boolean(row.available),
      kidId: row.kid_id
    }));
  },

  create(reward: Omit<Reward, 'id'>): Reward {
    const db = getDatabase();
    const id = Date.now().toString();

    db.prepare(`
      INSERT INTO rewards (id, title, description, points_cost, icon, available, kid_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(id, reward.title, reward.description, reward.pointsCost, reward.icon, reward.available ? 1 : 0, reward.kidId);

    return { id, ...reward };
  },

  update(id: string, updates: Partial<Reward>): Reward | null {
    const db = getDatabase();
    const current = this.getById(id);
    if (!current) return null;

    const updated = { ...current, ...updates };

    db.prepare(`
      UPDATE rewards
      SET title = ?, description = ?, points_cost = ?, icon = ?, available = ?, kid_id = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(updated.title, updated.description, updated.pointsCost, updated.icon, updated.available ? 1 : 0, updated.kidId, id);

    return updated;
  },

  delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM rewards WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

// Database operations for Redemptions
export const RedemptionsDB = {
  getAll(): Redemption[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM redemptions ORDER BY redeemed_at DESC').all() as any[];
    return rows.map(row => ({
      id: row.id,
      kidId: row.kid_id,
      rewardId: row.reward_id,
      pointsSpent: row.points_spent,
      redeemedAt: row.redeemed_at,
      status: row.status
    }));
  },

  getByKidId(kidId: string): Redemption[] {
    const db = getDatabase();
    const rows = db.prepare('SELECT * FROM redemptions WHERE kid_id = ? ORDER BY redeemed_at DESC').all(kidId) as any[];
    return rows.map(row => ({
      id: row.id,
      kidId: row.kid_id,
      rewardId: row.reward_id,
      pointsSpent: row.points_spent,
      redeemedAt: row.redeemed_at,
      status: row.status
    }));
  },

  create(redemption: Omit<Redemption, 'id' | 'redeemedAt'>): Redemption {
    const db = getDatabase();
    const id = Date.now().toString();
    const redeemedAt = new Date().toISOString();

    db.prepare(`
      INSERT INTO redemptions (id, kid_id, reward_id, points_spent, redeemed_at, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, redemption.kidId, redemption.rewardId, redemption.pointsSpent, redeemedAt, redemption.status);

    return { id, ...redemption, redeemedAt };
  },

  updateStatus(id: string, status: 'pending' | 'approved' | 'completed'): Redemption | null {
    const db = getDatabase();
    const current = this.getById(id);
    if (!current) return null;

    db.prepare(`
      UPDATE redemptions
      SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(status, id);

    return { ...current, status };
  },

  getById(id: string): Redemption | null {
    const db = getDatabase();
    const row = db.prepare('SELECT * FROM redemptions WHERE id = ?').get(id) as any;
    if (!row) return null;

    return {
      id: row.id,
      kidId: row.kid_id,
      rewardId: row.reward_id,
      pointsSpent: row.points_spent,
      redeemedAt: row.redeemed_at,
      status: row.status
    };
  },

  delete(id: string): boolean {
    const db = getDatabase();
    const result = db.prepare('DELETE FROM redemptions WHERE id = ?').run(id);
    return result.changes > 0;
  }
};