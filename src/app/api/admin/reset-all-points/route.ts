import { NextRequest, NextResponse } from 'next/server';
import { KidsDB } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const kids = KidsDB.getAll();

    // Reset all kids to have lifetime_points = 0 and redeemed_points = 0
    for (const kid of kids) {
      KidsDB.update(kid.id, {
        lifetimePoints: 0,
        redeemedPoints: 0
      });
    }

    return NextResponse.json({
      success: true,
      message: `Reset points for ${kids.length} kids`,
      kids: KidsDB.getAll()
    });
  } catch (error) {
    console.error('Failed to reset points:', error);
    return NextResponse.json(
      { error: 'Failed to reset points' },
      { status: 500 }
    );
  }
}
