'use client';

import { useState } from 'react';
import { Kid } from '@/types';
import { Plus, Minus, Coins } from 'lucide-react';

interface PointsAdjustmentProps {
  kids: Kid[];
  onAdjustment: () => void;
}

export function PointsAdjustment({ kids, onAdjustment }: PointsAdjustmentProps) {
  const [selectedKid, setSelectedKid] = useState<string | null>(null);
  const [points, setPoints] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAdjust = async (kidId: string, adjustment: number) => {
    if (adjustment === 0) {
      setMessage('Please enter a non-zero amount');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/kids/${kidId}/adjust-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: adjustment, reason })
      });

      if (response.ok) {
        const kid = kids.find(k => k.id === kidId);
        setMessage(`${adjustment > 0 ? 'Added' : 'Removed'} ${Math.abs(adjustment)} points ${adjustment > 0 ? 'to' : 'from'} ${kid?.name}`);
        setPoints(0);
        setReason('');
        setSelectedKid(null);
        onAdjustment();
      } else {
        setMessage('Failed to adjust points');
      }
    } catch (error) {
      setMessage('Failed to adjust points');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 5000);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Coins className="w-6 h-6 text-blue-600" />
        Adjust Lifetime Points
      </h2>

      {message && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-800">
          {message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kids.map(kid => (
          <div key={kid.id} className="border rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="text-3xl">
                {kid.avatar && kid.avatar.startsWith('data:') ? (
                  <img src={kid.avatar} alt={kid.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <span>{kid.avatar}</span>
                )}
              </div>
              <div>
                <div className="font-semibold">{kid.name}</div>
                <div className="text-sm text-gray-600">
                  Lifetime: <span className="font-bold text-blue-600">{kid.lifetimePoints}</span>
                </div>
              </div>
            </div>

            {selectedKid === kid.id ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Points to Add/Remove</label>
                  <input
                    type="number"
                    value={points}
                    onChange={(e) => setPoints(parseInt(e.target.value) || 0)}
                    className="w-full p-2 border rounded text-sm"
                    placeholder="e.g., 50 or -50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Reason (optional)</label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-2 border rounded text-sm"
                    placeholder="e.g., Bonus for good behavior"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAdjust(kid.id, points)}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm font-medium disabled:opacity-50"
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => {
                      setSelectedKid(null);
                      setPoints(0);
                      setReason('');
                    }}
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 rounded text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedKid(kid.id)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm font-medium flex items-center justify-center gap-1"
                >
                  <Coins className="w-4 h-4" />
                  Adjust
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
