'use client';

import { useState, useEffect } from 'react';
import { getAllKids, getAllRoutines, getRoutinesByKidId, addRoutine, updateRoutine, deleteRoutine } from '@/lib/data';
import { Kid, RoutineItem } from '@/types';
import { Plus, Edit2, Trash2, Save, Settings, LogOut, RefreshCw, Clock } from 'lucide-react';
import { Login } from '@/components/Login';
import { KidManager } from '@/components/KidManager';
import { DaySelector } from '@/components/DaySelector';
import { DeviceSettings } from '@/components/DeviceSettings';
import { DeviceAssignments } from '@/components/DeviceAssignments';
import { RewardsManager } from '@/components/RewardsManager';
import { PointsAdjustment } from '@/components/PointsAdjustment';
import { SystemSettings } from '@/components/SystemSettings';
import { isAuthenticated, logout } from '@/lib/auth';

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [kids, setKids] = useState<Kid[]>([]);
  const [routines, setRoutines] = useState<RoutineItem[]>([]);
  const [selectedKid, setSelectedKid] = useState<string>('');
  const [editingRoutine, setEditingRoutine] = useState<RoutineItem | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    setAuthenticated(isAuthenticated());
    if (isAuthenticated()) {
      loadData();
    }
  }, []);

  const loadData = async () => {
    try {
      const loadedKids = await getAllKids();
      const loadedRoutines = await getAllRoutines();
      setKids(loadedKids);
      setRoutines(loadedRoutines);
      if (loadedKids.length > 0 && !selectedKid) {
        setSelectedKid(loadedKids[0].id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  };

  if (!authenticated) {
    return <Login onLogin={() => setAuthenticated(true)} />;
  }

  const filteredRoutines = routines.filter(r => r.kidId === selectedKid);

  const handleSaveRoutine = async (routine: RoutineItem) => {
    try {
      if (editingRoutine) {
        await updateRoutine(routine.id, routine);
      } else {
        await addRoutine(routine);
      }
      setEditingRoutine(null);
      setShowAddForm(false);
      await loadData(); // Refresh data from database
    } catch (error) {
      console.error('Failed to save routine:', error);
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    if (confirm('Are you sure you want to delete this routine?')) {
      try {
        await deleteRoutine(id);
        await loadData(); // Refresh data from database
      } catch (error) {
        console.error('Failed to delete routine:', error);
      }
    }
  };

  const handleLogout = () => {
    logout();
    setAuthenticated(false);
  };

  const syncWithTerminus = async () => {
    try {
      const response = await fetch('/api/terminus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kidId: selectedKid
        }),
      });

      if (response.ok) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  };

  const syncKidToDevice = async (kidId: string) => {
    const kid = kids.find(k => k.id === kidId);
    if (!kid) return false;

    try {
      const response = await fetch('/api/terminus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kidId: kid.id
        }),
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const syncDashboardToDevice = async (kidId: string) => {
    const kid = kids.find(k => k.id === kidId);
    if (!kid) return false;

    try {
      const response = await fetch('/api/dashboard/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kidId: kid.id
        }),
      });

      return response.ok;
    } catch (error) {
      return false;
    }
  };

  const cleanupOldScreens = async () => {
    if (!confirm('This will delete all screens created before today. Continue?')) {
      return;
    }

    try {
      const response = await fetch('/api/screens/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        const data = await response.json();
        alert(`Cleanup completed!\nDeleted: ${data.summary.deleted}\nFailed: ${data.summary.failed}`);
      } else {
        alert('Cleanup failed. Check console for details.');
      }
    } catch (error) {
      console.error('Failed to cleanup screens:', error);
      alert('Cleanup failed. Check console for details.');
    }
  };

  const initializeCron = async () => {
    try {
      const response = await fetch('/api/cron/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        alert('Cron jobs initialized! Screen cleanup will run daily at 2 AM.');
      } else {
        alert('Failed to initialize cron jobs.');
      }
    } catch (error) {
      console.error('Failed to initialize cron:', error);
      alert('Failed to initialize cron jobs.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Settings className="w-8 h-8" />
            Admin Dashboard
          </h1>
          <div className="flex gap-3">
            <button
              onClick={async () => {
                if (confirm('Reset daily routines? This will uncheck all recurring tasks.')) {
                  try {
                    const response = await fetch('/api/admin/reset-daily-routines', { method: 'POST' });
                    if (response.ok) {
                      alert('Daily routines reset!');
                      window.location.reload();
                    }
                  } catch (error) {
                    console.error('Failed to reset routines:', error);
                  }
                }
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              title="Reset daily routines (uncheck all recurring tasks)"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Daily
            </button>
            <button
              onClick={async () => {
                if (confirm('Reset ALL kids points to 0? This will clear lifetime and redeemed points.')) {
                  try {
                    const response = await fetch('/api/admin/reset-all-points', { method: 'POST' });
                    if (response.ok) {
                      alert('All points reset to 0!');
                      window.location.reload();
                    }
                  } catch (error) {
                    console.error('Failed to reset points:', error);
                  }
                }
              }}
              className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              title="Reset all kids points to 0"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Points
            </button>
            <button
              onClick={cleanupOldScreens}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              title="Delete screens created before today"
            >
              <RefreshCw className="w-4 h-4" />
              Cleanup Screens
            </button>
            <button
              onClick={initializeCron}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
              title="Initialize automatic cleanup at 2 AM daily"
            >
              <Clock className="w-4 h-4" />
              Init Cron
            </button>
            <a
              href="/"
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
            >
              Back to Dashboard
            </a>
            <button
              onClick={handleLogout}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>

        {/* System Settings */}
        <SystemSettings />

        {/* Device Assignments */}
        <DeviceAssignments kids={kids} onSyncKid={syncKidToDevice} onSyncDashboard={syncDashboardToDevice} />

        {/* Kids Management */}
        <KidManager
          kids={kids}
          onKidsUpdate={async () => {
            await loadData(); // Refresh all data from database
          }}
        />

        {/* Rewards Management */}
        <RewardsManager kids={kids} />

        {/* Lifetime Points Adjustment */}
        <PointsAdjustment kids={kids} onAdjustment={loadData} />

        {/* Kid Selector for Routines */}
        {kids.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Select Kid for Routine Management</h2>
            <div className="flex gap-4">
              {kids.map(kid => (
                <button
                  key={kid.id}
                  onClick={() => setSelectedKid(kid.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedKid === kid.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-3xl mb-2 flex justify-center">
                    {kid.avatar && kid.avatar.startsWith('data:') ? (
                      <img src={kid.avatar} alt={kid.name} className="w-12 h-12 rounded-full object-cover" />
                    ) : (
                      <span>{kid.avatar}</span>
                    )}
                  </div>
                  <div className="font-medium">{kid.name}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Routines Management */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">
              Routines for {kids.find(k => k.id === selectedKid)?.name}
            </h2>
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Routine
            </button>
          </div>

          {/* Routine List */}
          <div className="space-y-3">
            {filteredRoutines
              .slice()
              .sort((a, b) => a.time.localeCompare(b.time))
              .map(routine => (
              <div key={routine.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <h3 className="font-medium">{routine.title}</h3>
                  <p className="text-sm text-gray-600">{routine.description}</p>
                  <div className="flex items-center gap-4 mt-1 text-sm">
                    <span>Time: {routine.time}{routine.endTime ? ` - ${routine.endTime}` : ''}</span>
                    <span>Points: {routine.points}</span>
                    {routine.dateOverride && (
                      <span>Override: {routine.dateOverride}</span>
                    )}
                    <span>Days: {
                      routine.daysOfWeek.length === 7 ? 'Every Day' :
                      routine.daysOfWeek.length === 5 && routine.daysOfWeek.every(d => d >= 1 && d <= 5) ? 'Weekdays' :
                      routine.daysOfWeek.map(d => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')
                    }</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingRoutine(routine)}
                    className="text-blue-600 hover:text-blue-800 p-1"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRoutine(routine.id)}
                    className="text-red-600 hover:text-red-800 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add/Edit Form */}
          {(showAddForm || editingRoutine) && (
            <RoutineForm
              routine={editingRoutine}
              kidId={selectedKid}
              onSave={handleSaveRoutine}
              onCancel={() => {
                setShowAddForm(false);
                setEditingRoutine(null);
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface RoutineFormProps {
  routine?: RoutineItem | null;
  kidId: string;
  onSave: (routine: RoutineItem) => void;
  onCancel: () => void;
}

function RoutineForm({ routine, kidId, onSave, onCancel }: RoutineFormProps) {
  const [formData, setFormData] = useState({
    title: routine?.title || '',
    description: routine?.description || '',
    points: routine?.points || 5,
    time: routine?.time || '08:00',
    endTime: routine?.endTime || '',
    dateOverride: routine?.dateOverride || '',
    daysOfWeek: routine?.daysOfWeek || [1, 2, 3, 4, 5], // Default to weekdays
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: routine?.id || '',
      ...formData,
      kidId,
      completed: routine?.completed || false,
    });
  };

  return (
    <div className="mt-6 p-4 border rounded-lg bg-gray-50">
      <h3 className="text-lg font-medium mb-4">
        {routine ? 'Edit Routine' : 'Add New Routine'}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Start Time</label>
            <input
              type="time"
              value={formData.time}
              onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
              className="w-full p-2 border rounded"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">End Time (optional)</label>
            <input
              type="time"
              value={formData.endTime}
              onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Override Date (optional)
              <span className="text-xs text-gray-500 ml-2">For one-time tasks on specific date</span>
            </label>
            <div className="flex gap-2">
              <input
                type="date"
                value={formData.dateOverride}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    dateOverride: newValue,
                    // Clear days of week if date override is set
                    daysOfWeek: newValue ? [] : prev.daysOfWeek
                  }));
                }}
                className="flex-1 p-2 border rounded"
              />
              {formData.dateOverride && (
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({
                    ...prev,
                    dateOverride: '',
                    // Restore default weekdays when clearing
                    daysOfWeek: [1, 2, 3, 4, 5]
                  }))}
                  className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded text-sm"
                  title="Clear override date"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full p-2 border rounded"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Points</label>
            <input
              type="number"
              value={formData.points}
              onChange={(e) => setFormData(prev => ({ ...prev, points: parseInt(e.target.value) }))}
              className="w-full p-2 border rounded"
              min="1"
              required
            />
          </div>
          {!formData.dateOverride && (
            <div>
              <DaySelector
                selectedDays={formData.daysOfWeek}
                onChange={(days) => setFormData(prev => ({ ...prev, daysOfWeek: days }))}
                label="Days of Week"
              />
            </div>
          )}
          {formData.dateOverride && (
            <div className="flex items-center text-sm text-gray-600 bg-blue-50 p-3 rounded">
              <span>📅 One-time task on {formData.dateOverride}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}