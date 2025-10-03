import { NextRequest, NextResponse } from 'next/server';
import { KidsDB } from '@/lib/database';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const kid = KidsDB.getById(params.id);
    if (!kid) {
      return NextResponse.json({ error: 'Kid not found' }, { status: 404 });
    }
    return NextResponse.json(kid);
  } catch (error) {
    console.error('Failed to get kid:', error);
    return NextResponse.json(
      { error: 'Failed to get kid' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const updates = await request.json();
    const updatedKid = KidsDB.update(params.id, updates);
    if (!updatedKid) {
      return NextResponse.json({ error: 'Kid not found' }, { status: 404 });
    }
    return NextResponse.json(updatedKid);
  } catch (error) {
    console.error('Failed to update kid:', error);
    return NextResponse.json(
      { error: 'Failed to update kid' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const success = KidsDB.delete(params.id);
    if (!success) {
      return NextResponse.json({ error: 'Kid not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete kid:', error);
    return NextResponse.json(
      { error: 'Failed to delete kid' },
      { status: 500 }
    );
  }
}