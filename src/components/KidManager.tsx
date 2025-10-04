'use client';

import { useState } from 'react';
import { Kid } from '@/types';
import { updateKid, addKid, deleteKid } from '@/lib/data';
import { Plus, Edit2, Trash2, Save, X, User, Monitor, RefreshCw } from 'lucide-react';

interface KidManagerProps {
  kids: Kid[];
  onKidsUpdate: (kids: Kid[]) => void;
}

export function KidManager({ kids, onKidsUpdate }: KidManagerProps) {
  const [editingKid, setEditingKid] = useState<Kid | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  const handleSaveKid = async (kidData: Omit<Kid, 'id'> | Kid) => {
    try {
      if ('id' in kidData && kidData.id) {
        // Update existing kid
        const updated = await updateKid(kidData.id, kidData);
        if (updated) {
          onKidsUpdate(kids.map(k => k.id === kidData.id ? updated : k));
        }
      } else {
        // Add new kid
        const newKid = await addKid(kidData);
        onKidsUpdate([...kids, newKid]);
      }
      setEditingKid(null);
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to save kid:', error);
    }
  };

  const handleDeleteKid = async (kidId: string) => {
    if (confirm('Are you sure? This will delete the kid and all their routines.')) {
      try {
        await deleteKid(kidId);
        onKidsUpdate(kids.filter(k => k.id !== kidId));
      } catch (error) {
        console.error('Failed to delete kid:', error);
      }
    }
  };

  const handleRecalculatePoints = async (kidId: string) => {
    if (confirm('This will recalculate lifetime points based on today\'s completed tasks. Continue?')) {
      try {
        const response = await fetch(`/api/kids/${kidId}/recalculate-points`, {
          method: 'POST'
        });
        if (response.ok) {
          // Refresh the kids list
          window.location.reload();
        }
      } catch (error) {
        console.error('Failed to recalculate points:', error);
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <User className="w-5 h-5" />
          Kids Management
        </h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Kid
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {kids.map(kid => (
          <div key={kid.id} className="border rounded-lg p-4">
            <div className="text-center mb-4">
              <div className="text-4xl mb-2 flex justify-center">
                {kid.avatar && kid.avatar.startsWith('data:') ? (
                  <img src={kid.avatar} alt={kid.name} className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <span>{kid.avatar}</span>
                )}
              </div>
              <h3 className="font-semibold text-lg">{kid.name}</h3>
              <div className="text-sm text-gray-600 mt-2">
                <div>Total: {kid.totalPoints} points</div>
                <div>Today: {kid.dailyPoints} points</div>
                {kid.deviceId && (
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <Monitor className="w-3 h-3" />
                    <span className="text-xs">{kid.deviceId}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingKid(kid)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
                <button
                  onClick={() => handleDeleteKid(kid.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1"
                >
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
              </div>
              <button
                onClick={() => handleRecalculatePoints(kid.id)}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded text-sm flex items-center justify-center gap-1"
                title="Recalculate lifetime points from today's completed tasks"
              >
                <RefreshCw className="w-3 h-3" />
                Recalc Points
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Form */}
      {(showAddForm || editingKid) && (
        <KidForm
          kid={editingKid}
          onSave={handleSaveKid}
          onCancel={() => {
            setShowAddForm(false);
            setEditingKid(null);
          }}
        />
      )}
    </div>
  );
}

interface KidFormProps {
  kid?: Kid | null;
  onSave: (kid: Omit<Kid, 'id'> | Kid) => void;
  onCancel: () => void;
}

function KidForm({ kid, onSave, onCancel }: KidFormProps) {
  const [formData, setFormData] = useState({
    name: kid?.name || '',
    avatar: kid?.avatar || '👶',
    lifetimePoints: kid?.lifetimePoints || 0,
    redeemedPoints: kid?.redeemedPoints || 0,
    deviceId: kid?.deviceId || '',
    accessToken: kid?.accessToken || '',
  });

  const avatarOptions = ['👶', '👧', '👦', '🧒', '👨', '👩', '🐶', '🐱', '🦄', '🌟'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (kid) {
      onSave({ ...kid, ...formData });
    } else {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">
            {kid ? 'Edit Kid' : 'Add New Kid'}
          </h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-2 border rounded"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Avatar</label>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {avatarOptions.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, avatar: emoji }))}
                  className={`p-2 text-2xl border rounded hover:bg-gray-50 ${
                    formData.avatar === emoji ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Or upload an image:</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                      setFormData(prev => ({ ...prev, avatar: reader.result as string }));
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full text-sm"
              />
              {formData.avatar && !avatarOptions.includes(formData.avatar) && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={formData.avatar} alt="Avatar preview" className="w-16 h-16 rounded-full object-cover border-2 border-blue-500" />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, avatar: '👶' }))}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Remove image
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Device ID</label>
              <input
                type="text"
                value={formData.deviceId}
                onChange={(e) => setFormData(prev => ({ ...prev, deviceId: e.target.value }))}
                className="w-full p-2 border rounded"
                placeholder="e.g., 9C6457, A1B2C3D4E5F6"
              />
              <p className="text-xs text-gray-600 mt-1">
                Optional: Terminus device ID (MAC address)
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Access Token</label>
              <input
                type="password"
                value={formData.accessToken}
                onChange={(e) => setFormData(prev => ({ ...prev, accessToken: e.target.value }))}
                className="w-full p-2 border rounded"
                placeholder="Device-specific access token"
              />
              <p className="text-xs text-gray-600 mt-1">
                Optional: Terminus API access token for this device
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}