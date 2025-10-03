'use client';

import { useState, useEffect } from 'react';
import { Monitor, Wifi, WifiOff, Settings } from 'lucide-react';

interface DeviceSettingsProps {
  onSync: (deviceId?: string) => Promise<boolean>;
}

export function DeviceSettings({ onSync }: DeviceSettingsProps) {
  const [deviceId, setDeviceId] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncStatus, setLastSyncStatus] = useState<'success' | 'error' | null>(null);

  useEffect(() => {
    // Load settings from environment or localStorage
    setApiUrl(process.env.NEXT_PUBLIC_TERMINUS_API_URL || 'http://192.168.68.54:2300');
    setDeviceId(localStorage.getItem('terminus_device_id') || 'trml_001');
  }, []);

  const handleSync = async () => {
    setIsSyncing(true);
    setLastSyncStatus(null);

    try {
      const success = await onSync(deviceId || undefined);
      setLastSyncStatus(success ? 'success' : 'error');

      // Save device ID to localStorage
      if (deviceId) {
        localStorage.setItem('terminus_device_id', deviceId);
      }
    } catch (error) {
      setLastSyncStatus('error');
    } finally {
      setIsSyncing(false);
    }
  };

  const testConnection = async () => {
    try {
      const response = await fetch(apiUrl, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: AbortSignal.timeout(3000)
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');

  const checkConnection = async () => {
    const isConnected = await testConnection();
    setConnectionStatus(isConnected ? 'connected' : 'disconnected');
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [apiUrl]);

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Monitor className="w-5 h-5" />
        <h2 className="text-xl font-semibold">Terminus Device Settings</h2>
      </div>

      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm font-medium">Connection Status</span>
          <div className="flex items-center gap-2">
            {connectionStatus === 'connected' && (
              <>
                <Wifi className="w-4 h-4 text-green-600" />
                <span className="text-sm text-green-600">Connected</span>
              </>
            )}
            {connectionStatus === 'disconnected' && (
              <>
                <WifiOff className="w-4 h-4 text-red-600" />
                <span className="text-sm text-red-600">Disconnected</span>
              </>
            )}
            {connectionStatus === 'unknown' && (
              <>
                <Settings className="w-4 h-4 text-gray-400 animate-spin" />
                <span className="text-sm text-gray-600">Checking...</span>
              </>
            )}
          </div>
        </div>

        {/* API URL Display */}
        <div>
          <label className="block text-sm font-medium mb-1">API URL</label>
          <div className="p-2 bg-gray-50 rounded border text-sm font-mono">
            {apiUrl}
          </div>
        </div>

        {/* Device ID */}
        <div>
          <label htmlFor="deviceId" className="block text-sm font-medium mb-1">
            Device ID
          </label>
          <input
            id="deviceId"
            type="text"
            value={deviceId}
            onChange={(e) => setDeviceId(e.target.value)}
            placeholder="e.g., trml_001, living_room_display"
            className="w-full p-2 border rounded"
          />
          <p className="text-xs text-gray-600 mt-1">
            Optional: Specify a device ID for targeted updates. Leave empty to send to all devices.
          </p>
        </div>

        {/* Sync Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            {isSyncing ? (
              <>
                <Settings className="w-4 h-4 animate-spin" />
                Syncing...
              </>
            ) : (
              <>
                <Monitor className="w-4 h-4" />
                Sync with Device
              </>
            )}
          </button>

          {lastSyncStatus === 'success' && (
            <span className="text-sm text-green-600">✓ Sync successful</span>
          )}
          {lastSyncStatus === 'error' && (
            <span className="text-sm text-red-600">✗ Sync failed</span>
          )}
        </div>

        {/* Sync Info */}
        <div className="text-xs text-gray-600 p-3 bg-blue-50 rounded">
          <strong>Auto-sync:</strong> Dashboard data is automatically synced every 30 seconds when kids complete routines.
          Manual sync allows you to update the device immediately with current data.
        </div>
      </div>
    </div>
  );
}