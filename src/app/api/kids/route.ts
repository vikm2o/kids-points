import { NextRequest, NextResponse } from 'next/server';
import { KidsDB } from '@/lib/database';

export async function GET() {
  try {
    const kids = KidsDB.getAll();
    return NextResponse.json(kids);
  } catch (error) {
    console.error('Failed to get kids:', error);
    return NextResponse.json(
      { error: 'Failed to get kids' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const kidData = await request.json();
    const newKid = KidsDB.create(kidData);
    return NextResponse.json(newKid);
  } catch (error) {
    console.error('Failed to create kid:', error);
    return NextResponse.json(
      { error: 'Failed to create kid' },
      { status: 500 }
    );
  }
}