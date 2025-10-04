import { NextRequest, NextResponse } from 'next/server';
import { KidsDB, getTodayPoints } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const kid = KidsDB.getById(params.id);
    if (!kid) {
      return NextResponse.json({ error: 'Kid not found' }, { status: 404 });
    }

    // Recalculate lifetime points from today's completed routines
    const todayPoints = getTodayPoints(params.id);

    // Update kid's lifetime points to match today's earned points
    // This assumes we're starting fresh - adjust if you want to preserve history
    const updatedKid = KidsDB.update(params.id, {
      lifetimePoints: todayPoints
    });

    return NextResponse.json({
      success: true,
      kid: updatedKid,
      recalculatedPoints: todayPoints
    });
  } catch (error) {
    console.error('Failed to recalculate points:', error);
    return NextResponse.json(
      { error: 'Failed to recalculate points' },
      { status: 500 }
    );
  }
}
