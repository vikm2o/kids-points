'use client';

import { useState, useEffect } from 'react';
import { Gift, Coins, ArrowLeft, CheckCircle } from 'lucide-react';
import { Reward, Kid } from '@/types';

export default function RewardsPage() {
  const [kids, setKids] = useState<Kid[]>([]);
  const [selectedKid, setSelectedKid] = useState<Kid | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadKids();
  }, []);

  useEffect(() => {
    if (selectedKid) {
      loadRewards(selectedKid.id);
    }
  }, [selectedKid]);

  const loadKids = async () => {
    try {
      const response = await fetch('/api/kids');
      if (response.ok) {
        const data = await response.json();
        setKids(data);
      }
    } catch (error) {
      console.error('Failed to load kids:', error);
    }
  };

  const loadRewards = async (kidId: string) => {
    try {
      const response = await fetch(`/api/rewards?kidId=${kidId}`);
      if (response.ok) {
        const data = await response.json();
        setRewards(data);
      }
    } catch (error) {
      console.error('Failed to load rewards:', error);
    }
  };

  const handleRedeem = async (reward: Reward) => {
    if (!selectedKid) return;

    if (selectedKid.totalPoints < reward.pointsCost) {
      setMessage(`Not enough points! You need ${reward.pointsCost} points but only have ${selectedKid.totalPoints}.`);
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (!confirm(`Redeem "${reward.title}" for ${reward.pointsCost} points?`)) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/redemptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kidId: selectedKid.id,
          rewardId: reward.id
        })
      });

      if (response.ok) {
        setMessage(`Success! You redeemed "${reward.title}"!`);
        // Reload kid to get updated points
        await loadKids();
        const updatedKid = kids.find(k => k.id === selectedKid.id);
        if (updatedKid) setSelectedKid(updatedKid);
      } else {
        const error = await response.json();
        setMessage(`Failed: ${error.error}`);
      }
    } catch (error) {
      setMessage('Failed to redeem reward');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  if (!selectedKid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <Gift className="w-20 h-20 mx-auto mb-4 text-white" />
            <h1 className="text-4xl font-bold text-white mb-2">Rewards Store</h1>
            <p className="text-white/90 text-lg">Choose your rewards!</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {kids.map(kid => (
              <button
                key={kid.id}
                onClick={() => setSelectedKid(kid)}
                className="bg-white rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all transform hover:scale-105"
              >
                <div className="text-6xl mb-4">{kid.avatar}</div>
                <h2 className="text-2xl font-bold mb-2">{kid.name}</h2>
                <div className="flex items-center justify-center gap-2 text-purple-600">
                  <Coins className="w-6 h-6" />
                  <span className="text-3xl font-bold">{kid.totalPoints}</span>
                  <span className="text-lg">points</span>
                </div>
              </button>
            ))}
          </div>

          <div className="text-center mt-8">
            <a
              href="/"
              className="text-white hover:text-white/80 flex items-center justify-center gap-2 text-lg"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 to-pink-500 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => setSelectedKid(null)}
            className="text-white hover:text-white/80 flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="bg-white rounded-full px-6 py-3 shadow-lg flex items-center gap-3">
            <span className="text-2xl">{selectedKid.avatar}</span>
            <div>
              <div className="font-bold">{selectedKid.name}</div>
              <div className="flex items-center gap-2 text-purple-600">
                <Coins className="w-4 h-4" />
                <span className="font-bold">{selectedKid.totalPoints} points</span>
              </div>
            </div>
          </div>
        </div>

        {message && (
          <div className="bg-white rounded-lg p-4 mb-6 shadow-lg text-center">
            <p className="text-lg font-semibold">{message}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rewards.length === 0 ? (
            <div className="col-span-full bg-white rounded-2xl p-12 text-center">
              <Gift className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <p className="text-gray-500 text-lg">No rewards available yet!</p>
            </div>
          ) : (
            rewards.map(reward => {
              const canAfford = selectedKid.totalPoints >= reward.pointsCost;
              return (
                <div
                  key={reward.id}
                  className={`bg-white rounded-2xl p-6 shadow-lg ${
                    canAfford ? 'ring-2 ring-green-400' : 'opacity-75'
                  }`}
                >
                  <div className="text-5xl mb-4 text-center flex justify-center">
                    {reward.icon && reward.icon.startsWith('data:') ? (
                      <img src={reward.icon} alt={reward.title} className="w-16 h-16 rounded object-cover" />
                    ) : (
                      <span>{reward.icon || '🎁'}</span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-center">{reward.title}</h3>
                  {reward.description && (
                    <p className="text-gray-600 text-sm mb-4 text-center">{reward.description}</p>
                  )}
                  <div className="flex items-center justify-center gap-2 mb-4 text-purple-600">
                    <Coins className="w-5 h-5" />
                    <span className="text-2xl font-bold">{reward.pointsCost}</span>
                  </div>
                  <button
                    onClick={() => handleRedeem(reward)}
                    disabled={!canAfford || loading}
                    className={`w-full py-3 rounded-lg font-bold text-white transition-all ${
                      canAfford
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {canAfford ? 'Redeem' : 'Need More Points'}
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}