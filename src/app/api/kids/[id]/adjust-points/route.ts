import { NextRequest, NextResponse } from 'next/server';
import { KidsDB } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { points, reason } = await request.json();

    if (typeof points !== 'number') {
      return NextResponse.json(
        { error: 'Points must be a number' },
        { status: 400 }
      );
    }

    const kid = KidsDB.getById(params.id);
    if (!kid) {
      return NextResponse.json({ error: 'Kid not found' }, { status: 404 });
    }

    // Adjust lifetime points (can be positive or negative)
    const newLifetimePoints = Math.max(0, kid.lifetimePoints + points);

    const updatedKid = KidsDB.update(params.id, {
      lifetimePoints: newLifetimePoints
    });

    console.log(`Adjusted points for ${kid.name}: ${points > 0 ? '+' : ''}${points} (Reason: ${reason || 'N/A'})`);

    return NextResponse.json({
      success: true,
      kid: updatedKid,
      adjustment: points,
      reason: reason || null
    });
  } catch (error) {
    console.error('Failed to adjust points:', error);
    return NextResponse.json(
      { error: 'Failed to adjust points' },
      { status: 500 }
    );
  }
}
