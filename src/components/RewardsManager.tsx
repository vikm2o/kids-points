'use client';

import { useState, useEffect } from 'react';
import { Gift, Plus, Edit2, Trash2, Save, X } from 'lucide-react';
import { Reward, Kid } from '@/types';

interface RewardsManagerProps {
  kids: Kid[];
}

export function RewardsManager({ kids }: RewardsManagerProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    pointsCost: 0,
    icon: '🎁',
    available: true,
    kidId: ''
  });

  useEffect(() => {
    loadRewards();
  }, []);

  const loadRewards = async () => {
    try {
      const response = await fetch('/api/rewards');
      if (response.ok) {
        const data = await response.json();
        setRewards(data);
      }
    } catch (error) {
      console.error('Failed to load rewards:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId ? `/api/rewards/${editingId}` : '/api/rewards';
      const method = editingId ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          kidId: formData.kidId || null
        })
      });

      if (response.ok) {
        await loadRewards();
        setFormData({
          title: '',
          description: '',
          pointsCost: 0,
          icon: '🎁',
          available: true,
          kidId: ''
        });
        setEditingId(null);
      }
    } catch (error) {
      console.error('Failed to save reward:', error);
    }
  };

  const handleEdit = (reward: Reward) => {
    setFormData({
      title: reward.title,
      description: reward.description || '',
      pointsCost: reward.pointsCost,
      icon: reward.icon || '🎁',
      available: reward.available,
      kidId: reward.kidId || ''
    });
    setEditingId(reward.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this reward?')) return;

    try {
      const response = await fetch(`/api/rewards/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadRewards();
      }
    } catch (error) {
      console.error('Failed to delete reward:', error);
    }
  };

  const handleCancel = () => {
    setFormData({
      title: '',
      description: '',
      pointsCost: 0,
      icon: '🎁',
      available: true,
      kidId: ''
    });
    setEditingId(null);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="flex items-center gap-2 mb-6">
        <Gift className="w-5 h-5" />
        <h2 className="text-xl font-semibold">Rewards Management</h2>
      </div>

      {/* Add/Edit Form */}
      <form onSubmit={handleSubmit} className="mb-6 p-4 border rounded-lg bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full border rounded px-3 py-2"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Icon</label>
            <input
              type="text"
              value={formData.icon}
              onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
              className="w-full border rounded px-3 py-2 mb-2"
              placeholder="🎁"
            />
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
                      setFormData({ ...formData, icon: reader.result as string });
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="w-full text-sm"
              />
              {formData.icon && formData.icon.startsWith('data:') && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={formData.icon} alt="Icon preview" className="w-12 h-12 rounded object-cover border" />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, icon: '🎁' })}
                    className="text-xs text-red-600 hover:text-red-800"
                  >
                    Remove image
                  </button>
                </div>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Points Cost *</label>
            <input
              type="number"
              value={formData.pointsCost}
              onChange={(e) => setFormData({ ...formData, pointsCost: parseInt(e.target.value) })}
              className="w-full border rounded px-3 py-2"
              required
              min="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">For Kid (optional)</label>
            <select
              value={formData.kidId}
              onChange={(e) => setFormData({ ...formData, kidId: e.target.value })}
              className="w-full border rounded px-3 py-2"
            >
              <option value="">All Kids</option>
              {kids.map(kid => (
                <option key={kid.id} value={kid.id}>{kid.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="w-full border rounded px-3 py-2"
            rows={2}
          />
        </div>
        <div className="mb-4">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.available}
              onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
              className="rounded"
            />
            <span className="text-sm font-medium">Available</span>
          </label>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {editingId ? 'Update' : 'Add'} Reward
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Rewards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rewards.map(reward => (
          <div
            key={reward.id}
            className={`border rounded-lg p-4 ${reward.available ? 'bg-white' : 'bg-gray-100'}`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="text-3xl">
                {reward.icon && reward.icon.startsWith('data:') ? (
                  <img src={reward.icon} alt={reward.title} className="w-12 h-12 rounded object-cover" />
                ) : (
                  <span>{reward.icon || '🎁'}</span>
                )}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => handleEdit(reward)}
                  className="text-blue-600 hover:text-blue-800 p-1"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(reward.id)}
                  className="text-red-600 hover:text-red-800 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="font-semibold mb-1">{reward.title}</h3>
            {reward.description && (
              <p className="text-sm text-gray-600 mb-2">{reward.description}</p>
            )}
            <div className="flex items-center justify-between text-sm">
              <span className="font-bold text-purple-600">{reward.pointsCost} points</span>
              {reward.kidId && (
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                  {kids.find(k => k.id === reward.kidId)?.name}
                </span>
              )}
            </div>
            {!reward.available && (
              <div className="mt-2 text-xs text-gray-500">Unavailable</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}