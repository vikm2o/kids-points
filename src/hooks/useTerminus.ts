'use client';

import { useEffect, useCallback, useRef } from 'react';
import { Kid, RoutineItem } from '@/types';
import { getTimezone, getTodayDate } from '@/lib/timezone';

export function useTerminus(kid: Kid | null, routines: RoutineItem[], nextItem: RoutineItem | null) {
  const lastSyncDateRef = useRef<string>('');

  const updateTerminus = useCallback(async () => {
    if (!kid) {
      return;
    }

    try {
      const response = await fetch('/api/terminus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kidId: kid.id,
          deviceId: kid.deviceId // Use kid's specific device ID
        }),
      });

      if (!response.ok) {
        console.error('Failed to update Terminus display');
      }
    } catch (error) {
      console.error('Error updating Terminus:', error);
    }
  }, [kid?.id, kid?.deviceId]);

  // Update Terminus whenever data changes
  useEffect(() => {
    if (kid) {
      updateTerminus();
    }
  }, [kid, routines, nextItem, updateTerminus]);

  // Check for date change and sync
  useEffect(() => {
    if (!kid) return;

    const checkDateChange = async () => {
      const tz = await getTimezone();
      const currentDate = getTodayDate(tz);
      if (currentDate !== lastSyncDateRef.current) {
        console.log('Date changed, syncing dashboard...');
        lastSyncDateRef.current = currentDate;
        updateTerminus();
      }
    };

    // Initialize the ref with current date
    getTimezone().then(tz => {
      lastSyncDateRef.current = getTodayDate(tz);
    });

    // Check every hour for date change
    const dateCheckInterval = setInterval(checkDateChange, 3600000);

    return () => clearInterval(dateCheckInterval);
  }, [kid, updateTerminus]);

  return { updateTerminus };
}