'use client';

import { useState, useEffect } from 'react';
import { Kid, RoutineItem } from '@/types';
import { getAllKids, getTodayRoutines, getNextRoutineItem, toggleRoutineCompletion } from '@/lib/data';
import { KidCard } from './KidCard';
import { RoutineList } from './RoutineList';
import { useTerminus } from '@/hooks/useTerminus';
import { Clock, Star, Gift } from 'lucide-react';

export function Dashboard() {
  const [kids, setKids] = useState<Kid[]>([]);
  const [currentKid, setCurrentKid] = useState<Kid | null>(null);
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [nextItem, setNextItem] = useState<RoutineItem | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        const loadedKids = await getAllKids();
        setKids(loadedKids);
        if (loadedKids.length > 0) {
          setCurrentKid(loadedKids[0]);
        }
      } catch (error) {
        console.error('Failed to load kids:', error);
      }
    };
    loadData();
  }, []);

  // Terminus integration
  useTerminus(currentKid, routines, nextItem);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (currentKid) {
      const loadRoutines = async () => {
        try {
          const todayRoutines = await getTodayRoutines(currentKid.id);
          const nextRoutineItem = await getNextRoutineItem(currentKid.id);
          setRoutines(todayRoutines);
          setNextItem(nextRoutineItem);
        } catch (error) {
          console.error('Failed to load routines:', error);
        }
      };
      loadRoutines();
    }
  }, [currentKid]);

  const toggleRoutineComplete = async (routineId: string) => {
    if (!currentKid) return;

    try {
      const result = await toggleRoutineCompletion(routineId);
      if (result) {
        // Refresh data from API
        const refreshedKids = await getAllKids();
        const refreshedCurrentKid = refreshedKids.find(k => k.id === currentKid.id);
        const refreshedRoutines = await getTodayRoutines(currentKid.id);
        const refreshedNextItem = await getNextRoutineItem(currentKid.id);

        setKids(refreshedKids);
        if (refreshedCurrentKid) {
          setCurrentKid(refreshedCurrentKid);
        }
        setRoutines(refreshedRoutines);
        setNextItem(refreshedNextItem);
      }
    } catch (error) {
      console.error('Failed to toggle routine:', error);
    }
  };

  const handleReducePoints = async (routineId: string, reason: string) => {
    if (!currentKid) return;

    try {
      const response = await fetch(`/api/routines/${routineId}/reduce`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        // Refresh data from API
        const refreshedKids = await getAllKids();
        const refreshedCurrentKid = refreshedKids.find(k => k.id === currentKid.id);
        const refreshedRoutines = await getTodayRoutines(currentKid.id);
        const refreshedNextItem = await getNextRoutineItem(currentKid.id);

        setKids(refreshedKids);
        if (refreshedCurrentKid) {
          setCurrentKid(refreshedCurrentKid);
        }
        setRoutines(refreshedRoutines);
        setNextItem(refreshedNextItem);
      }
    } catch (error) {
      console.error('Failed to reduce points:', error);
    }
  };

  return (
    <div className="min-h-screen p-4 trml:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 trml:mb-8">
          <div className="flex items-center gap-3">
            <Star className="w-8 h-8 text-yellow-500" />
            <h1 className="text-2xl trml:text-3xl font-bold text-gray-800">
              Kids Points Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/rewards"
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Gift className="w-5 h-5" />
              <span className="hidden sm:inline">Rewards</span>
            </a>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="w-5 h-5" />
              <span className="text-lg trml:text-xl font-mono">
                {currentTime.toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Kid Selector */}
        <div className="flex gap-4 mb-6">
          {kids.map(kid => (
            <button
              key={kid.id}
              onClick={() => setCurrentKid(kid)}
              className={`p-3 rounded-xl border-2 transition-all ${
                currentKid?.id === kid.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="text-2xl mb-1 flex justify-center">
                {kid.avatar && kid.avatar.startsWith('data:') ? (
                  <img src={kid.avatar} alt={kid.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <span>{kid.avatar}</span>
                )}
              </div>
              <div className="text-sm font-medium">{kid.name}</div>
            </button>
          ))}
        </div>

        {/* Main Dashboard Grid */}
        {currentKid && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Kid Stats Card */}
            <div className="lg:col-span-1">
              <KidCard kid={currentKid} nextItem={nextItem} />
            </div>

            {/* Routine List */}
            <div className="lg:col-span-2">
              <RoutineList
                routines={routines}
                nextItem={nextItem}
                onToggleComplete={toggleRoutineComplete}
                onReducePoints={handleReducePoints}
              />
            </div>
          </div>
        )}

        {kids.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">👋</div>
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Welcome to Kids Points!</h2>
            <p className="text-gray-600 mb-4">No kids have been added yet.</p>
            <a
              href="/admin"
              className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium"
            >
              Add Your First Kid
            </a>
          </div>
        )}
      </div>
    </div>
  );
}