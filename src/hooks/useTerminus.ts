'use client';

import { useEffect, useCallback } from 'react';
import { Kid, RoutineItem } from '@/types';

export function useTerminus(
  kid: Kid | null,
  routines: RoutineItem[],
  nextItem: RoutineItem | null,
  onDataRefresh?: () => void | Promise<void>
) {
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

  // Periodically refresh data from server (server handles date changes and resets via cron)
  useEffect(() => {
    if (!kid || !onDataRefresh) return;

    // Refresh data every 5 minutes to pick up any server-side changes
    const refreshInterval = setInterval(async () => {
      console.log('[Client] Refreshing data from server...');
      await onDataRefresh();
    }, 300000); // 5 minutes

    return () => clearInterval(refreshInterval);
  }, [kid, onDataRefresh]);

  return { updateTerminus };
}