'use client';

import { useEffect, useCallback, useRef } from 'react';
import { Kid, RoutineItem } from '@/types';
import { getTimezone, getTodayDate } from '@/lib/timezone';

export function useTerminus(
  kid: Kid | null,
  routines: RoutineItem[],
  nextItem: RoutineItem | null,
  onDateChange?: () => void | Promise<void>
) {
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
      console.log('[Date Check] Running scheduled date change check...');
      const tz = await getTimezone();
      const currentDate = getTodayDate(tz);
      console.log(`[Date Check] Current date: ${currentDate}, Last synced date: ${lastSyncDateRef.current}`);

      if (currentDate !== lastSyncDateRef.current) {
        console.log('[Date Check] Date changed, syncing dashboard and resetting daily routines...');
        lastSyncDateRef.current = currentDate;

        // Call the date change callback to refresh data (which will trigger reset on server)
        if (onDateChange) {
          await onDateChange();
        }

        // Update Terminus display
        await updateTerminus();
      } else {
        console.log('[Date Check] No date change detected');
      }
    };

    // Initialize the ref with current date only if not already set
    if (!lastSyncDateRef.current) {
      console.log('[Date Check] Initializing date tracking...');
      getTimezone().then(tz => {
        const today = getTodayDate(tz);
        lastSyncDateRef.current = today;
        console.log(`[Date Check] Initialized with date: ${today}`);
      });
    }

    // Run immediate check
    checkDateChange();

    // Check every hour for date change
    const dateCheckInterval = setInterval(checkDateChange, 3600000);

    return () => clearInterval(dateCheckInterval);
  }, [kid, updateTerminus, onDateChange]);

  return { updateTerminus };
}