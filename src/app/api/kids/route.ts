import { NextRequest, NextResponse } from 'next/server';
import { KidsDB, getTodayPoints, getAvailablePoints } from '@/lib/database';

export async function GET() {
  try {
    const kids = KidsDB.getAll();
    // Add calculated points to each kid
    const kidsWithPoints = kids.map(kid => ({
      ...kid,
      dailyPoints: getTodayPoints(kid.id),
      totalPoints: getAvailablePoints(kid.id)
    }));
    return NextResponse.json(kidsWithPoints);
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