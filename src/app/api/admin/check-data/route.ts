import { NextResponse } from 'next/server';
import { KidsDB, RoutinesDB, RewardsDB, DevicesDB } from '@/lib/database';

export async function GET() {
  try {
    const kids = KidsDB.getAll();
    const routines = RoutinesDB.getAll();
    const rewards = RewardsDB.getAll();
    const devices = DevicesDB.getAll();

    return NextResponse.json({
      summary: {
        kids: kids.length,
        routines: routines.length,
        rewards: rewards.length,
        devices: devices.length
      },
      kids: kids.map(k => ({ id: k.id, name: k.name, lifetimePoints: k.lifetimePoints })),
      routines: routines.map(r => ({ id: r.id, title: r.title, kidId: r.kidId, completed: r.completed })),
      rewards: rewards.map(r => ({ id: r.id, title: r.title })),
      devices: devices.map(d => ({ id: d.id, friendly_id: d.friendly_id }))
    });
  } catch (error) {
    console.error('Failed to check data:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
