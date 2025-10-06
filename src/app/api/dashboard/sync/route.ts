import { NextRequest, NextResponse } from 'next/server';
import { KidsDB, DevicesDB, RewardsDB, RedemptionsDB, getTodayRoutines, getNextRoutineItem, getTodayPoints, getTodayTotalPoints, getAvailablePoints, checkAndResetIfNeeded } from '@/lib/database';
import { TerminusPayload } from '@/types';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    // Check and reset routines if it's a new day
    checkAndResetIfNeeded();

    const { kidId } = await request.json();

    if (!kidId) {
      return NextResponse.json(
        { error: 'Kid ID is required' },
        { status: 400 }
      );
    }

    const kid = KidsDB.getById(kidId);
    if (!kid) {
      return NextResponse.json(
        { error: 'Kid not found' },
        { status: 404 }
      );
    }

    // Get the device associated with this kid
    let device = kid.deviceId ? DevicesDB.getByFriendlyId(kid.deviceId) : null;

    // If device not found in local DB, try refreshing from external API
    if (!device && kid.deviceId) {
      try {
        const externalApiUrl = process.env.TERMINUS_API_URL || 'http://localhost:8080';
        const response = await axios.get(`${externalApiUrl}/api/devices`, {
          timeout: 10000,
          headers: { 'Content-Type': 'application/json' }
        });

        const devicesPayload = Array.isArray(response.data)
          ? response.data
          : (Array.isArray(response.data?.data) ? response.data.data : []);

        // Save all devices to local database
        for (const deviceData of devicesPayload) {
          const existingDevice = DevicesDB.getById(deviceData.id);
          if (existingDevice) {
            DevicesDB.update(deviceData.id, deviceData);
          } else {
            DevicesDB.create(deviceData);
          }
        }

        // Try to get the device again after refresh
        device = kid.deviceId ? DevicesDB.getByFriendlyId(kid.deviceId) : null;
      } catch (error) {
        console.error('Failed to refresh devices:', error);
      }
    }

    if (!device) {
      return NextResponse.json(
        { error: 'No device associated with this kid' },
        { status: 404 }
      );
    }

    const routines = getTodayRoutines(kidId);
    const nextItem = getNextRoutineItem(kidId);
    const rewards = RewardsDB.getAvailableForKid(kidId);
    const redemptions = RedemptionsDB.getByKidId(kidId);
    const lastRedemption = redemptions.length > 0 ? redemptions[0] : null;
    const lastRedemptionReward = lastRedemption ? RewardsDB.getById(lastRedemption.rewardId) : null;

    // Calculate points dynamically
    const todayTotalPoints = getTodayTotalPoints(kidId); // Max possible points today
    const todayEarnedPoints = getTodayPoints(kidId); // Points earned so far today

    // Debug logging
    console.log('=== DASHBOARD SYNC DEBUG ===');
    console.log('Kid:', kid.name);
    console.log('Lifetime Points:', kid.lifetimePoints);
    console.log('Redeemed Points:', kid.redeemedPoints);
    console.log('Today Total (max possible):', todayTotalPoints);
    console.log('Today Earned (so far):', todayEarnedPoints);
    console.log('Completed routines:', routines.filter(r => r.completed).map(r => ({ title: r.title, points: r.points })));
    console.log('============================');

    // Generate HTML content for the dashboard
    const htmlContent = generateDashboardHTML(kid, routines, nextItem, rewards, todayTotalPoints, todayEarnedPoints, lastRedemptionReward);

    // Create screen - the /api/screens endpoint will handle playlist updates automatically
    const screenResponse = await createScreen(device, kid, htmlContent);
    if (!screenResponse.success) {
      return NextResponse.json(
        { error: 'Failed to create screen', details: screenResponse.error },
        { status: 500 }
      );
    }

    const screenId = screenResponse.data.id;

    return NextResponse.json({
      success: true,
      screenId,
      playlistId: device.playlist_id,
      message: 'Dashboard synced successfully'
    });

  } catch (error) {
    console.error('Failed to sync dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to sync dashboard' },
      { status: 500 }
    );
  }
}

function generateDashboardHTML(kid: any, routines: any[], nextItem: any, rewards: any[], todayTotalPoints: number, todayEarnedPoints: number, lastRedemption: any) {
  const now = new Date();
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dayOfWeek = dayNames[now.getDay()];
  const dateStr = `${dayOfWeek}, ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;

  // Helper function to convert 24-hour time to 12-hour AM/PM format
  const formatTime12Hour = (time24: string): string => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':').map(Number);
    if (isNaN(hours) || isNaN(minutes)) return time24;

    const period = hours >= 12 ? 'PM' : 'AM';
    const hours12 = hours % 12 || 12;
    const mins = String(minutes);
    const paddedMins = mins.length === 1 ? '0' + mins : mins;
    return `${hours12}:${paddedMins} ${period}`;
  };

  // Get top 3 rewards: affordable ones first, then others to fill up to 3
  const availablePoints = kid.lifetimePoints - kid.redeemedPoints;
  const affordableRewards = rewards
    .filter((r: any) => r.pointsCost <= availablePoints)
    .sort((a: any, b: any) => a.pointsCost - b.pointsCost);

  const unaffordableRewards = rewards
    .filter((r: any) => r.pointsCost > availablePoints)
    .sort((a: any, b: any) => a.pointsCost - b.pointsCost);

  // Combine: affordable first, then unaffordable, limit to 3 total
  const topRewards = [...affordableRewards, ...unaffordableRewards].slice(0, 3);

  return `
<div class="layout">
  <div>
    <h1 style="font-size: 1.5em;">${kid.name} — ${dateStr}</h1>
  </div>

  <h2 style="font-size: 1.3em;">Summary &amp; Rewards</h2>
  ${lastRedemption ? `<p style="margin: -0.5em 0 0.5em 0; font-size: 0.9em; font-weight: bold; opacity: 0.85;">Last redeemed: ${lastRedemption.title}</p>` : ''}
  <table class="table" data-table-limit="true">
    <thead>
      <tr>
        <th><span class="title">Today</span></th>
        <th><span class="title">Earned</span></th>
        <th><span class="title">Lifetime</span></th>
        ${topRewards.map((_: any, idx: number) => `<th><span class="title">Reward ${idx + 1}</span></th>`).join('')}
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><span class="value">${todayTotalPoints}</span></td>
        <td><span class="value">${todayEarnedPoints}</span></td>
        <td><span class="value">${availablePoints}</span></td>
        ${topRewards.length > 0 ? topRewards.map((reward: any) => `
        <td><span class="title">${reward.title} (${reward.pointsCost})</span></td>
        `).join('') : `
        <td colspan="3"><span class="title">Keep earning!</span></td>
        `}
      </tr>
    </tbody>
  </table>

  <h2 style="font-size: 1.3em;">Today's Actions</h2>
  <table class="table" data-table-limit="true" data-table-max-height="auto">
    <thead>
      <tr>
        <th><span class="title">#&nbsp;&nbsp;</span></th>
        <th><span class="title">Action&nbsp;&nbsp;&nbsp;</span></th>
        <th><span class="title">Points&nbsp;&nbsp;</span></th>
        <th><span class="title">Got&nbsp;&nbsp;</span></th>
        <th><span class="title">Start&nbsp;&nbsp;</span></th>
        <th><span class="title">End&nbsp;&nbsp;</span></th>
        <th><span class="title">Status&nbsp;&nbsp;</span></th>
      </tr>
    </thead>
    <tbody>
      ${(() => {
        const sorted = routines.slice().sort((a: any, b: any) => (a.time || '').localeCompare(b.time || ''));
        return sorted.map((todo: any, idx: number) => {
          // Use endTime if available, otherwise use next item's start time as fallback
          const end = todo.endTime || sorted[idx + 1]?.time || '';
          return `
        <tr class="${nextItem && todo.id === nextItem.id ? 'is-next' : ''}">
          <td><span class="title">&nbsp;${idx + 1}&nbsp;</span></td>
          <td><span class="title">&nbsp;${todo.title}&nbsp;</span></td>
          <td><span class="value">&nbsp;${todo.points ?? ''}&nbsp;</span></td>
          <td><span class="value">&nbsp;${todo.completed ? (todo.points ?? '') : ''}&nbsp;</span></td>
          <td><span class="title">&nbsp;${formatTime12Hour(todo.time || '')}&nbsp;</span></td>
          <td><span class="title">&nbsp;${formatTime12Hour(end)}&nbsp;</span></td>
          <td><span class="title">&nbsp;${todo.completed ? '✓' : '○'}&nbsp;</span></td>
        </tr>`;
        }).join('');
      })()}
    </tbody>
  </table>
</div>`;
}

async function createScreen(device: any, kid: any, content: string) {
  try {
    // Generate unique name with timestamp to ensure uniqueness
    const timestamp = Date.now();
    const uniqueName = `dashboard_${kid.id}_${timestamp}`;
    
    // Debug: Check if name is being set
    console.log('Dashboard sync - kid.id:', kid.id);
    console.log('Dashboard sync - timestamp:', timestamp);
    console.log('Dashboard sync - uniqueName:', uniqueName);
    console.log('Dashboard sync - uniqueName type:', typeof uniqueName);
    console.log('Dashboard sync - uniqueName length:', uniqueName.length);
    
    const screenPayload = {
      screen: {
        label: `${kid.name}'s Dashboard ${timestamp}`,
        content: content,
        name: uniqueName,
        model_id: device.model_id.toString()
      },
      device_id: device.id  // Pass device.id at root level for playlist update
    };
    
    // Debug: Log the payload being sent
    console.log('Dashboard sync - sending screen payload:', JSON.stringify(screenPayload, null, 2));
    console.log('Dashboard sync - name field:', screenPayload.screen.name);
    console.log('Dashboard sync - name field type:', typeof screenPayload.screen.name);
    console.log('Dashboard sync - name field exists:', 'name' in screenPayload.screen);
    
    const response = await axios.post(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/screens`,
      screenPayload,
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    return { success: true, data: response.data.data };
  } catch (error: any) {
    console.error('Failed to create screen:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return { success: false, error: error.message };
  }
}

