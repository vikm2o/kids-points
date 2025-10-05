import { NextRequest, NextResponse } from 'next/server';
import { RoutinesDB, getTodayRoutines, getNextRoutineItem, checkAndResetIfNeeded } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Check and reset routines if it's a new day
    checkAndResetIfNeeded();

    const { searchParams } = new URL(request.url);
    const kidId = searchParams.get('kidId');
    const today = searchParams.get('today');

    if (kidId && today) {
      const routines = getTodayRoutines(kidId);
      const nextItem = getNextRoutineItem(kidId);
      return NextResponse.json({ routines, nextItem });
    } else if (kidId) {
      const routines = RoutinesDB.getByKidId(kidId);
      return NextResponse.json(routines);
    } else {
      const routines = RoutinesDB.getAll();
      return NextResponse.json(routines);
    }
  } catch (error) {
    console.error('Failed to get routines:', error);
    return NextResponse.json(
      { error: 'Failed to get routines' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const routineData = await request.json();
    const newRoutine = RoutinesDB.create(routineData);
    // Trigger device sync for kid after create
    try { await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/terminus`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kidId: newRoutine.kidId }) }); } catch (e) {}
    return NextResponse.json(newRoutine);
  } catch (error) {
    console.error('Failed to create routine:', error);
    return NextResponse.json(
      { error: 'Failed to create routine' },
      { status: 500 }
    );
  }
}