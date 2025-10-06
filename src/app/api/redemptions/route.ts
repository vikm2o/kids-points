import { NextRequest, NextResponse } from 'next/server';
import { RedemptionsDB, RewardsDB, KidsDB, getAvailablePoints } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const kidId = searchParams.get('kidId');

    let redemptions;
    if (kidId) {
      redemptions = RedemptionsDB.getByKidId(kidId);
    } else {
      redemptions = RedemptionsDB.getAll();
    }

    return NextResponse.json(redemptions);
  } catch (error) {
    console.error('Failed to get redemptions:', error);
    return NextResponse.json(
      { error: 'Failed to get redemptions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { kidId, rewardId } = await request.json();

    if (!kidId || !rewardId) {
      return NextResponse.json(
        { error: 'Missing required fields: kidId, rewardId' },
        { status: 400 }
      );
    }

    // Get kid and reward
    const kid = KidsDB.getById(kidId);
    const reward = RewardsDB.getById(rewardId);

    if (!kid) {
      return NextResponse.json(
        { error: 'Kid not found' },
        { status: 404 }
      );
    }

    if (!reward) {
      return NextResponse.json(
        { error: 'Reward not found' },
        { status: 404 }
      );
    }

    if (!reward.available) {
      return NextResponse.json(
        { error: 'Reward is not available' },
        { status: 400 }
      );
    }

    // Check if kid has enough points
    const availablePoints = getAvailablePoints(kidId);
    if (availablePoints < reward.pointsCost) {
      return NextResponse.json(
        { error: 'Not enough points' },
        { status: 400 }
      );
    }

    // Create redemption
    const redemption = RedemptionsDB.create({
      kidId,
      rewardId,
      pointsSpent: reward.pointsCost,
      status: 'completed'
    });

    // Add to redeemed points
    KidsDB.update(kidId, {
      redeemedPoints: kid.redeemedPoints + reward.pointsCost
    });

    return NextResponse.json(redemption, { status: 201 });
  } catch (error) {
    console.error('Failed to create redemption:', error);
    return NextResponse.json(
      { error: 'Failed to create redemption' },
      { status: 500 }
    );
  }
}