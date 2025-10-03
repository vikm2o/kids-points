'use client';

import { useState, useEffect } from 'react';
import { Kid, Device } from '@/types';
import { Monitor, Wifi, WifiOff, RefreshCw, Send, Plus, Link, Unlink } from 'lucide-react';

interface DeviceAssignmentsProps {
  kids: Kid[];
  onSyncKid: (kidId: string) => Promise<boolean>;
  onSyncDashboard: (kidId: string) => Promise<boolean>;
}

export function DeviceAssignments({ kids, onSyncKid, onSyncDashboard }: DeviceAssignmentsProps) {
  const [syncingKids, setSyncingKids] = useState<Set<string>>(new Set());
  const [lastSyncResults, setLastSyncResults] = useState<Record<string, 'success' | 'error'>>({});
  const [devices, setDevices] = useState<Device[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(false);
  const [showDeviceManager, setShowDeviceManager] = useState(true);
  const [associatingKid, setAssociatingKid] = useState<string | null>(null);
  const [syncingDashboard, setSyncingDashboard] = useState<Set<string>>(new Set());
  const [dashboardSyncResults, setDashboardSyncResults] = useState<Record<string, 'success' | 'error'>>({});

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoadingDevices(true);
    try {
      const response = await fetch('/api/devices?refresh=true');
      if (response.ok) {
        const json = await response.json();
        const devicesData = Array.isArray(json) ? json : (Array.isArray(json?.data) ? json.data : []);
        setDevices(devicesData);
      }
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoadingDevices(false);
    }
  };

  const handleAssociateDevice = async (kidId: string, deviceId: string) => {
    setAssociatingKid(kidId);
    try {
      const response = await fetch(`/api/kids/${kidId}/device`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendly_id: deviceId || null })
      });
      
      if (response.ok) {
        // Reload the page to update the UI
        window.location.reload();
      }
    } catch (error) {
      console.error('Failed to associate device:', error);
    } finally {
      setAssociatingKid(null);
    }
  };

  const handleSyncKid = async (kidId: string) => {
    setSyncingKids(prev => new Set(prev).add(kidId));
    setLastSyncResults(prev => ({ ...prev, [kidId]: undefined as any }));

    try {
      const success = await onSyncKid(kidId);
      setLastSyncResults(prev => ({ ...prev, [kidId]: success ? 'success' : 'error' }));
    } catch (error) {
      setLastSyncResults(prev => ({ ...prev, [kidId]: 'error' }));
    } finally {
      setSyncingKids(prev => {
        const newSet = new Set(prev);
        newSet.delete(kidId);
        return newSet;
      });
    }
  };

  const handleSyncDashboard = async (kidId: string) => {
    setSyncingDashboard(prev => new Set(prev).add(kidId));
    setDashboardSyncResults(prev => ({ ...prev, [kidId]: undefined as any }));

    try {
      const success = await onSyncDashboard(kidId);
      setDashboardSyncResults(prev => ({ ...prev, [kidId]: success ? 'success' : 'error' }));
    } catch (error) {
      setDashboardSyncResults(prev => ({ ...prev, [kidId]: 'error' }));
    } finally {
      setSyncingDashboard(prev => {
        const newSet = new Set(prev);
        newSet.delete(kidId);
        return newSet;
      });
    }
  };

  const syncAllKids = async () => {
    const kidsWithDevices = kids.filter(k => k.deviceId);
    for (const kid of kidsWithDevices) {
      await handleSyncKid(kid.id);
      // Small delay between syncs to avoid overwhelming the network
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const kidsWithDevices = kids.filter(k => k.deviceId);
  const kidsWithoutDevices = kids.filter(k => !k.deviceId);

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Monitor className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Device Assignments</h2>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDeviceManager(!showDeviceManager)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Manage Devices
          </button>
          {kidsWithDevices.length > 0 && (
            <button
              onClick={syncAllKids}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Sync All Devices
            </button>
          )}
        </div>
      </div>

      {/* Device Manager */}
      {showDeviceManager && (
        <div className="mb-6 p-4 border rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Available Devices</h3>
            <button
              onClick={loadDevices}
              disabled={loadingDevices}
              className="bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
            >
              {loadingDevices ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <RefreshCw className="w-3 h-3" />
              )}
              Refresh
            </button>
          </div>
          
          {devices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {devices.map(device => {
                const assignedKid = kids.find(k => k.deviceId === device.friendly_id);
                return (
                  <div key={device.id} className="border rounded-lg p-3 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium text-sm">{device.label || device.friendly_id}</div>
                      <div className="text-xs text-gray-500">ID: {device.id}</div>
                    </div>
                    <div className="text-xs text-gray-600 mb-2">
                      <div>MAC: {device.mac_address}</div>
                      <div>Friendly ID: {device.friendly_id}</div>
                      <div>Model: {device.model_id}</div>
                    </div>
                    {assignedKid ? (
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-green-600">
                          Assigned to: {assignedKid.name}
                        </div>
                        <button
                          onClick={() => handleAssociateDevice(assignedKid.id, '')}
                          disabled={associatingKid === assignedKid.id}
                          className="text-red-600 hover:text-red-800 p-1"
                          title="Unassign device"
                        >
                          <Unlink className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="text-xs text-gray-500 mb-2">Available for assignment</div>
                        {kidsWithoutDevices.length > 0 ? (
                          <select
                            onChange={(e) => {
                              const targetKidId = e.target.value;
                              if (targetKidId) {
                                handleAssociateDevice(targetKidId, device.friendly_id);
                              }
                            }}
                            className="text-xs border rounded px-2 py-1"
                            defaultValue=""
                          >
                            <option value="">Assign to kid…</option>
                            {kidsWithoutDevices.map(k => (
                              <option key={k.id} value={k.id}>{k.name}</option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-xs text-gray-400">All kids already have devices</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <Monitor className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No devices found. Click refresh to load devices from the external API.</p>
            </div>
          )}
        </div>
      )}

      {/* Kids with Devices */}
      {kidsWithDevices.length > 0 && (
        <div className="mb-6">
          <h3 className="text-lg font-medium mb-3">Kids with Assigned Devices</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kidsWithDevices.map(kid => (
              <div key={kid.id} className="border rounded-lg p-4 bg-green-50 border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{kid.avatar}</div>
                    <div>
                      <div className="font-medium">{kid.name}</div>
                      <div className="text-sm text-gray-600 flex items-center gap-1">
                        <Monitor className="w-3 h-3" />
                        <code className="text-xs bg-gray-100 px-1 rounded">{kid.deviceId}</code>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {lastSyncResults[kid.id] === 'success' && (
                      <span className="text-green-600 text-sm">✓</span>
                    )}
                    {lastSyncResults[kid.id] === 'error' && (
                      <span className="text-red-600 text-sm">✗</span>
                    )}
                    <button
                      onClick={() => handleSyncKid(kid.id)}
                      disabled={syncingKids.has(kid.id)}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                    >
                      {syncingKids.has(kid.id) ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Send className="w-3 h-3" />
                      )}
                      Sync
                    </button>
                    <button
                      onClick={() => handleSyncDashboard(kid.id)}
                      disabled={syncingDashboard.has(kid.id)}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                      title="Sync Dashboard to Device"
                    >
                      {syncingDashboard.has(kid.id) ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <Monitor className="w-3 h-3" />
                      )}
                      Dashboard
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Kids without Devices */}
      {kidsWithoutDevices.length > 0 && (
        <div>
          <h3 className="text-lg font-medium mb-3">Kids without Device Assignment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {kidsWithoutDevices.map(kid => (
              <div key={kid.id} className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{kid.avatar}</div>
                    <div>
                      <div className="font-medium">{kid.name}</div>
                      <div className="text-sm text-yellow-700">No device assigned</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-yellow-600">
                      <WifiOff className="w-4 h-4" />
                    </div>
                    {devices.length > 0 && (
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            handleAssociateDevice(kid.id, e.target.value);
                          }
                        }}
                        disabled={associatingKid === kid.id}
                        className="text-xs border rounded px-2 py-1"
                        defaultValue=""
                      >
                        <option value="">Assign Device</option>
                        {devices
                          .filter(device => !kids.find(k => k.deviceId === device.friendly_id))
                          .map(device => (
                            <option key={device.id} value={device.friendly_id}>
                              {device.label || device.friendly_id}
                            </option>
                          ))}
                      </select>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Use the "Manage Devices" button above to load available devices, then assign them to kids using the dropdown.
          </p>
        </div>
      )}

      {kids.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Monitor className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No kids found. Add kids to manage device assignments.</p>
        </div>
      )}
    </div>
  );
}