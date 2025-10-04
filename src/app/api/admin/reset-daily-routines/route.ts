import { NextRequest, NextResponse } from 'next/server';
import { resetDailyRoutines } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    resetDailyRoutines();
    return NextResponse.json({
      success: true,
      message: 'Daily routines reset successfully'
    });
  } catch (error) {
    console.error('Failed to reset daily routines:', error);
    return NextResponse.json(
      { error: 'Failed to reset daily routines' },
      { status: 500 }
    );
  }
}
