import { NextRequest, NextResponse } from 'next/server';
import { RoutinesDB, KidsDB } from '@/lib/database';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const routine = RoutinesDB.getById(params.id);
    if (!routine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }

    // Toggle completion
    const updatedRoutine = RoutinesDB.update(params.id, {
      completed: !routine.completed
    });

    if (!updatedRoutine) {
      return NextResponse.json({ error: 'Failed to update routine' }, { status: 500 });
    }

    // Update kid's points
    const kid = KidsDB.getById(routine.kidId);
    if (kid) {
      if (updatedRoutine.completed) {
        KidsDB.update(kid.id, {
          dailyPoints: kid.dailyPoints + routine.points,
          totalPoints: kid.totalPoints + routine.points
        });
      } else {
        KidsDB.update(kid.id, {
          dailyPoints: Math.max(0, kid.dailyPoints - routine.points),
          totalPoints: Math.max(0, kid.totalPoints - routine.points)
        });
      }
    }

    // Trigger device sync for kid after toggle
    try { await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/terminus`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kidId: routine.kidId }) }); } catch (e) {}

    return NextResponse.json({
      routine: updatedRoutine,
      kid: KidsDB.getById(routine.kidId)
    });
  } catch (error) {
    console.error('Failed to toggle routine:', error);
    return NextResponse.json(
      { error: 'Failed to toggle routine' },
      { status: 500 }
    );
  }
}