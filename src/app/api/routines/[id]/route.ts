import { NextRequest, NextResponse } from 'next/server';
import { RoutinesDB, KidsDB } from '@/lib/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json();
    const currentRoutine = RoutinesDB.getById(params.id);

    if (!currentRoutine) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }

    // Check if task was completed on a previous day - if so, reset completion
    const today = new Date().toISOString().slice(0, 10);
    if (currentRoutine.completed && currentRoutine.completedDate && currentRoutine.completedDate !== today) {
      updates.completed = false;
      updates.completedDate = null;
    }

    const updatedRoutine = RoutinesDB.update(params.id, updates);
    if (!updatedRoutine) {
      return NextResponse.json({ error: 'Failed to update routine' }, { status: 404 });
    }
    // Trigger device sync for kid after update
    try { await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ''}/api/terminus`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kidId: updatedRoutine.kidId }) }); } catch (e) {}
    return NextResponse.json(updatedRoutine);
  } catch (error) {
    console.error('Failed to update routine:', error);
    return NextResponse.json(
      { error: 'Failed to update routine' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = RoutinesDB.delete(params.id);
    if (!success) {
      return NextResponse.json({ error: 'Routine not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete routine:', error);
    return NextResponse.json(
      { error: 'Failed to delete routine' },
      { status: 500 }
    );
  }
}