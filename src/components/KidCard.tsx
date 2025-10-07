'use client';

import { Kid, RoutineItem, Redemption, Reward } from '@/types';
import { Star, Clock, Target, Monitor, Gift } from 'lucide-react';
import { useEffect, useState } from 'react';

interface KidCardProps {
  kid: Kid;
  nextItem: RoutineItem | null;
}

export function KidCard({ kid, nextItem }: KidCardProps) {
  const [redemptions, setRedemptions] = useState<(Redemption & { reward?: Reward })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRedemptions = async () => {
      try {
        const response = await fetch(`/api/redemptions?kidId=${kid.id}`);
        if (response.ok) {
          const data = await response.json();

          // Fetch reward details for each redemption
          const redemptionsWithRewards = await Promise.all(
            data.map(async (redemption: Redemption) => {
              try {
                const rewardResponse = await fetch(`/api/rewards/${redemption.rewardId}`);
                if (rewardResponse.ok) {
                  const reward = await rewardResponse.json();
                  return { ...redemption, reward };
                }
              } catch (error) {
                console.error('Failed to load reward:', error);
              }
              return redemption;
            })
          );

          setRedemptions(redemptionsWithRewards);
        }
      } catch (error) {
        console.error('Failed to load redemptions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadRedemptions();
  }, [kid.id]);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 trml:p-8 dashboard-card">
      {/* Kid Info */}
      <div className="text-center mb-6">
        <div className="text-6xl trml:text-8xl mb-3 flex justify-center">
          {kid.avatar && kid.avatar.startsWith('data:') ? (
            <img src={kid.avatar} alt={kid.name} className="w-24 h-24 trml:w-32 trml:h-32 rounded-full object-cover" />
          ) : (
            <span>{kid.avatar}</span>
          )}
        </div>
        <h2 className="text-2xl trml:text-3xl font-bold text-gray-800 mb-2">
          {kid.name}
        </h2>
      </div>

      {/* Points Display */}
      <div className="space-y-4 mb-6">
        <div className="bg-gradient-to-r from-yellow-100 to-yellow-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-600" />
              <span className="text-lg font-medium text-yellow-800">
                Available Points
              </span>
            </div>
            <span className="text-2xl trml:text-3xl font-bold text-yellow-800">
              {kid.totalPoints}
            </span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-100 to-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-6 h-6 text-green-600" />
              <span className="text-lg font-medium text-green-800">
                Today's Points
              </span>
            </div>
            <span className="text-2xl trml:text-3xl font-bold text-green-800">
              {kid.dailyPoints}
            </span>
          </div>
        </div>
      </div>

      {/* Device Info */}
      {kid.deviceId && (
        <div className="bg-gradient-to-r from-gray-100 to-gray-200 rounded-xl p-3 mb-4">
          <div className="flex items-center justify-center gap-2">
            <Monitor className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              Syncing to: <code className="text-xs bg-white px-1 rounded">{kid.deviceId}</code>
            </span>
          </div>
        </div>
      )}

      {/* Next Item */}
      {nextItem && (
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="font-medium text-blue-800">Up Next</span>
          </div>
          <div className="text-lg trml:text-xl font-semibold text-gray-800 mb-1">
            {nextItem.title}
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">{nextItem.time}</span>
            <span className="bg-blue-200 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
              +{nextItem.points} pts
            </span>
          </div>
        </div>
      )}

      {/* Redemption History */}
      <div className="border-t pt-4 mt-4">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-gray-800">Recent Rewards</span>
        </div>

        {loading ? (
          <div className="text-center py-3 text-gray-500 text-sm">Loading...</div>
        ) : redemptions.length === 0 ? (
          <div className="text-center py-3 text-gray-500 text-sm">
            No rewards redeemed yet
          </div>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {redemptions.slice(0, 5).map((redemption) => (
              <div
                key={redemption.id}
                className="bg-purple-50 rounded-lg p-3 border border-purple-100"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {redemption.reward?.icon && (
                        <span className="text-xl flex-shrink-0">
                          {redemption.reward.icon.startsWith('data:') ? (
                            <img
                              src={redemption.reward.icon}
                              alt=""
                              className="w-6 h-6 rounded object-cover"
                            />
                          ) : (
                            redemption.reward.icon
                          )}
                        </span>
                      )}
                      <span className="font-medium text-gray-800 text-sm truncate">
                        {redemption.reward?.title || 'Unknown Reward'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-600">
                        {new Date(redemption.redeemedAt).toLocaleDateString()}
                      </span>
                      <span className="text-xs font-semibold text-purple-700">
                        -{redemption.pointsSpent} pts
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ${
                      redemption.status === 'completed'
                        ? 'bg-green-100 text-green-700'
                        : redemption.status === 'approved'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}
                  >
                    {redemption.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}