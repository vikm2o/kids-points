import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const { kidId } = await request.json();

    if (!kidId) {
      return NextResponse.json(
        { error: 'Kid ID is required' },
        { status: 400 }
      );
    }

    // Delegate to /api/dashboard/sync which handles both screen creation and playlist updates
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/dashboard/sync`,
      { kidId },
      {
        headers: { 'Content-Type': 'application/json' },
        timeout: 30000
      }
    );

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: unknown) {
    console.error('Failed to update Terminus display:', error);

    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        { error: 'Failed to sync dashboard', details: error.response.data },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update display' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Return current status for all kids
    const allKids = KidsDB.getAll();
    const status = allKids.map(kid => {
      const routines = getTodayRoutines(kid.id);
      const nextItem = getNextRoutineItem(kid.id);

      return {
        kid,
        routines,
        nextItem,
        completedCount: routines.filter(r => r.completed).length,
        totalCount: routines.length
      };
    });

    return NextResponse.json(status);
  } catch (error) {
    console.error('Failed to get status:', error);
    return NextResponse.json(
      { error: 'Failed to get status' },
      { status: 500 }
    );
  }
}