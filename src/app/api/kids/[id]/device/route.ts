import { NextRequest, NextResponse } from 'next/server';
import { KidsDB, DevicesDB } from '@/lib/database';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { friendly_id } = await request.json();

    const kid = KidsDB.getById(params.id);
    if (!kid) {
      return NextResponse.json({ error: 'Kid not found' }, { status: 404 });
    }

    // Unassign if empty or null
    if (!friendly_id) {
      const updated = KidsDB.update(params.id, { deviceId: undefined });
      return NextResponse.json(updated);
    }

    const device = DevicesDB.getByFriendlyId(friendly_id);
    if (!device) {
      return NextResponse.json({ error: 'Device not found' }, { status: 404 });
    }

    const updatedKid = KidsDB.update(params.id, { deviceId: friendly_id });
    return NextResponse.json(updatedKid);
  } catch (error) {
    console.error('Failed to link device to kid:', error);
    return NextResponse.json(
      { error: 'Failed to link device to kid' },
      { status: 500 }
    );
  }
}


