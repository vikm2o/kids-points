'use client';

import { Kid, RoutineItem } from '@/types';
import { Star, Clock, Target, Monitor } from 'lucide-react';

interface KidCardProps {
  kid: Kid;
  nextItem: RoutineItem | null;
}

export function KidCard({ kid, nextItem }: KidCardProps) {
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
                Lifetime Points
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
        <div className="bg-gradient-to-r from-blue-100 to-purple-100 rounded-xl p-4">
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
    </div>
  );
}