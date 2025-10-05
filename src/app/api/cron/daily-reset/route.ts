import { NextRequest, NextResponse } from 'next/server';
import { checkAndResetIfNeeded } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    checkAndResetIfNeeded();
    return NextResponse.json({
      success: true,
      message: 'Daily reset check completed'
    });
  } catch (error) {
    console.error('Failed to check/reset daily routines:', error);
    return NextResponse.json(
      { error: 'Failed to check/reset daily routines' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  return GET(request);
}
