import { NextRequest, NextResponse } from 'next/server';
import { RewardsDB } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kidId = searchParams.get('kidId');

    let rewards;
    if (kidId) {
      rewards = RewardsDB.getAvailableForKid(kidId);
    } else {
      rewards = RewardsDB.getAll();
    }

    return NextResponse.json(rewards);
  } catch (error) {
    console.error('Failed to get rewards:', error);
    return NextResponse.json(
      { error: 'Failed to get rewards' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const rewardData = await request.json();

    if (!rewardData.title || rewardData.pointsCost === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: title, pointsCost' },
        { status: 400 }
      );
    }

    const reward = RewardsDB.create(rewardData);
    return NextResponse.json(reward, { status: 201 });
  } catch (error) {
    console.error('Failed to create reward:', error);
    return NextResponse.json(
      { error: 'Failed to create reward' },
      { status: 500 }
    );
  }
}