'use client';

import { useState, useEffect } from 'react';
import { Globe, Save } from 'lucide-react';
import { TIMEZONE_OPTIONS, clearTimezoneCache } from '@/lib/timezone';

export function SystemSettings() {
  const [timezone, setTimezone] = useState('UTC');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setTimezone(data.timezone || 'UTC');
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ timezone })
      });

      if (response.ok) {
        clearTimezoneCache();
        alert('Settings saved! Please refresh the page for changes to take effect.');
      } else {
        alert('Failed to save settings. Please try again.');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <p className="text-gray-500">Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center gap-3 mb-6">
        <Globe className="w-6 h-6 text-gray-600" />
        <h2 className="text-xl font-semibold">System Settings</h2>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Timezone
            <span className="text-xs text-gray-500 ml-2">
              This affects date/time display across the app
            </span>
          </label>
          <div className="flex gap-3">
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {TIMEZONE_OPTIONS.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Current Time:</strong> {new Date().toLocaleString('en-US', { timeZone: timezone })}
          </p>
        </div>
      </div>
    </div>
  );
}
