import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/database';

// GET /api/settings
export async function GET() {
  try {
    const db = getDatabase();

    // Get timezone setting
    const timezoneRow = db.prepare('SELECT value FROM settings WHERE key = ?').get('timezone') as { value: string } | undefined;
    const timezone = timezoneRow?.value || 'UTC';

    return NextResponse.json({ timezone });
  } catch (error) {
    console.error('Failed to get settings:', error);
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 });
  }
}

// POST /api/settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { timezone } = body;

    if (!timezone) {
      return NextResponse.json({ error: 'Timezone is required' }, { status: 400 });
    }

    const db = getDatabase();

    // Update or insert timezone setting
    db.prepare(`
      INSERT OR REPLACE INTO settings (key, value, updated_at)
      VALUES (?, ?, CURRENT_TIMESTAMP)
    `).run('timezone', timezone);

    return NextResponse.json({ success: true, timezone });
  } catch (error) {
    console.error('Failed to update settings:', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
