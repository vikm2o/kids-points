import { NextResponse } from 'next/server';
import { startScreenCleanupCron } from '@/lib/cron';

// This endpoint is called once when the app starts to initialize cron jobs
export async function POST() {
  try {
    startScreenCleanupCron();

    return NextResponse.json({
      success: true,
      message: 'Cron jobs initialized successfully'
    });
  } catch (error) {
    console.error('Failed to initialize cron jobs:', error);
    return NextResponse.json(
      { error: 'Failed to initialize cron jobs' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Cron initialization endpoint. Use POST to initialize.'
  });
}