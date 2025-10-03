import { NextRequest, NextResponse } from 'next/server';
import { KidsDB, DevicesDB, getTodayRoutines, getNextRoutineItem } from '@/lib/database';
import { TerminusPayload } from '@/types';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
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
    const device = kid.deviceId ? DevicesDB.getByFriendlyId(kid.deviceId) : null;
    if (!device) {
      return NextResponse.json(
        { error: 'No device associated with this kid' },
        { status: 404 }
      );
    }

    const routines = getTodayRoutines(kidId);
    const nextItem = getNextRoutineItem(kidId);

    // Calculate today's points from routines
    const totalPoints = routines.reduce((sum: number, r: any) => sum + (r.points || 0), 0);
    const earnedPoints = routines.filter((r: any) => r.completed).reduce((sum: number, r: any) => sum + (r.points || 0), 0);

    // Update kid's points in database to reflect today's values only
    const updatedKid = KidsDB.update(kidId, {
      dailyPoints: earnedPoints,
      totalPoints: totalPoints
    });

    // Generate HTML content for the dashboard with updated values
    const htmlContent = generateDashboardHTML(updatedKid || kid, routines, nextItem);

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

function generateDashboardHTML(kid: any, routines: any[], nextItem: any) {
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

  return `
<div class="layout">
  <div>
    <h1>${kid.name} — ${dateStr}</h1>
  </div>

  <h2>Summary</h2>
  <table class="table" data-table-limit="true">
    <tbody>
      <tr>
        <td><span class="title">Today Earned</span></td>
        <td><span class="title">${kid.dailyPoints}</span></td>
      </tr>
      <tr>
        <td><span class="title">Today Total</span></td>
        <td><span class="title">${kid.totalPoints}</span></td>
      </tr>
    </tbody>
  </table>

  <h2>Today's Actions</h2>
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

