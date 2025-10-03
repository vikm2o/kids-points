'use client';

import { useState } from 'react';

interface DaySelectorProps {
  selectedDays: number[];
  onChange: (days: number[]) => void;
  label?: string;
}

const DAYS = [
  { value: 0, label: 'Sun', fullName: 'Sunday' },
  { value: 1, label: 'Mon', fullName: 'Monday' },
  { value: 2, label: 'Tue', fullName: 'Tuesday' },
  { value: 3, label: 'Wed', fullName: 'Wednesday' },
  { value: 4, label: 'Thu', fullName: 'Thursday' },
  { value: 5, label: 'Fri', fullName: 'Friday' },
  { value: 6, label: 'Sat', fullName: 'Saturday' },
];

const PRESETS = [
  { label: 'Every Day', days: [0, 1, 2, 3, 4, 5, 6] },
  { label: 'Weekdays', days: [1, 2, 3, 4, 5] },
  { label: 'Weekends', days: [0, 6] },
  { label: 'Mon/Wed/Fri', days: [1, 3, 5] },
  { label: 'Tue/Thu', days: [2, 4] },
];

export function DaySelector({ selectedDays, onChange, label = "Days of Week" }: DaySelectorProps) {
  const toggleDay = (day: number) => {
    const newDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day].sort((a, b) => a - b);
    onChange(newDays);
  };

  const selectPreset = (presetDays: number[]) => {
    onChange(presetDays);
  };

  const getDaysDisplay = () => {
    if (selectedDays.length === 7) return 'Every Day';
    if (selectedDays.length === 5 && selectedDays.every(d => d >= 1 && d <= 5)) return 'Weekdays';
    if (selectedDays.length === 2 && selectedDays.includes(0) && selectedDays.includes(6)) return 'Weekends';
    if (selectedDays.length === 0) return 'No days selected';

    return selectedDays
      .map(day => DAYS[day].label)
      .join(', ');
  };

  return (
    <div>
      <label className="block text-sm font-medium mb-2">{label}</label>

      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2 mb-3">
        {PRESETS.map(preset => (
          <button
            key={preset.label}
            type="button"
            onClick={() => selectPreset(preset.days)}
            className={`px-3 py-1 text-xs rounded-full border transition-colors ${
              JSON.stringify(selectedDays.sort()) === JSON.stringify(preset.days.sort())
                ? 'bg-blue-100 border-blue-300 text-blue-700'
                : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Individual Day Toggles */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAYS.map(day => (
          <button
            key={day.value}
            type="button"
            onClick={() => toggleDay(day.value)}
            className={`
              p-2 text-sm rounded border transition-colors
              ${selectedDays.includes(day.value)
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
              }
            `}
          >
            {day.label}
          </button>
        ))}
      </div>

      {/* Selected Days Display */}
      <div className="text-sm text-gray-600">
        <strong>Selected:</strong> {getDaysDisplay()}
      </div>
    </div>
  );
}