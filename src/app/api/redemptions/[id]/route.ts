import { NextRequest, NextResponse } from 'next/server';
import { RedemptionsDB } from '@/lib/database';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { status } = await request.json();

    if (!status || !['pending', 'approved', 'completed'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    const redemption = RedemptionsDB.updateStatus(id, status);
    if (!redemption) {
      return NextResponse.json(
        { error: 'Redemption not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(redemption);
  } catch (error) {
    console.error('Failed to update redemption:', error);
    return NextResponse.json(
      { error: 'Failed to update redemption' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const success = RedemptionsDB.delete(id);

    if (!success) {
      return NextResponse.json(
        { error: 'Redemption not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete redemption:', error);
    return NextResponse.json(
      { error: 'Failed to delete redemption' },
      { status: 500 }
    );
  }
}