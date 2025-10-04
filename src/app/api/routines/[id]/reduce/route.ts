import { NextRequest, NextResponse } from 'next/server';
import { RoutinesDB, KidsDB } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { reason } = await request.json();

    const routine = RoutinesDB.getById(params.id);
    if (!routine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }

    if (!routine.completed) {
      return NextResponse.json({ error: 'Can only reduce points for completed tasks' }, { status: 400 });
    }

    // Get kid and reduce lifetime points
    const kid = KidsDB.getById(routine.kidId);
    if (kid) {
      // Reduce lifetime points (half the original points as penalty)
      const pointsToReduce = Math.floor(routine.points / 2);
      KidsDB.update(kid.id, {
        lifetimePoints: Math.max(0, kid.lifetimePoints - pointsToReduce)
      });

      // Mark the routine as uncompleted so it shows as not fully done
      RoutinesDB.update(params.id, {
        completed: false
      });

      // Log the reduction reason (could store this in a separate table later)
      console.log(`Points reduced for routine ${routine.id} (${routine.title}) - Kid: ${kid.name} - Reason: ${reason} - Points reduced: ${pointsToReduce}`);
    }

    // Trigger device sync for kid after reduction
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/terminus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kidId: routine.kidId })
      });
    } catch (e) {
      console.error('Failed to sync with terminus:', e);
    }

    return NextResponse.json({
      success: true,
      routine: RoutinesDB.getById(params.id),
      kid: KidsDB.getById(routine.kidId)
    });
  } catch (error) {
    console.error('Failed to reduce points:', error);
    return NextResponse.json(
      { error: 'Failed to reduce points' },
      { status: 500 }
    );
  }
}
