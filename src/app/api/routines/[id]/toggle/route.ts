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

    // Toggle completion and track completion date
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD format
    const updatedRoutine = RoutinesDB.update(params.id, {
      completed: !routine.completed,
      completedDate: !routine.completed ? today : null
    });

    if (!updatedRoutine) {
      return NextResponse.json({ error: 'Failed to update routine' }, { status: 500 });
    }

    // Update kid's lifetime points
    const kid = KidsDB.getById(routine.kidId);
    if (kid) {
      if (updatedRoutine.completed) {
        // Add points to lifetime when completing
        KidsDB.update(kid.id, {
          lifetimePoints: kid.lifetimePoints + routine.points
        });
      } else {
        // Remove points from lifetime when uncompleting
        KidsDB.update(kid.id, {
          lifetimePoints: Math.max(0, kid.lifetimePoints - routine.points)
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