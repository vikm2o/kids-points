'use client';

import { useEffect, useCallback, useRef } from 'react';
import { Kid, RoutineItem } from '@/types';

export function useTerminus(kid: Kid | null, routines: RoutineItem[], nextItem: RoutineItem | null) {
  const lastSyncDateRef = useRef<string>(new Date().toDateString());

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

  // Set up periodic updates every 30 seconds
  useEffect(() => {
    if (kid) {
      const interval = setInterval(updateTerminus, 30000);
      return () => clearInterval(interval);
    }
  }, [kid, updateTerminus]);

  // Check for date change and sync
  useEffect(() => {
    if (!kid) return;

    const checkDateChange = () => {
      const currentDate = new Date().toDateString();
      if (currentDate !== lastSyncDateRef.current) {
        console.log('Date changed, syncing dashboard...');
        lastSyncDateRef.current = currentDate;
        updateTerminus();
      }
    };

    // Check every hour for date change
    const dateCheckInterval = setInterval(checkDateChange, 3600000);

    return () => clearInterval(dateCheckInterval);
  }, [kid, updateTerminus]);

  return { updateTerminus };
}