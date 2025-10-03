import axios from 'axios';
import { TerminusPayload, TerminusConfig } from '@/types';

const defaultConfig: TerminusConfig = {
  apiUrl: process.env.TERMINUS_API_URL || 'http://localhost:2300',
  endpoint: '/api/screens',
  deviceId: process.env.TERMINUS_DEVICE_ID || undefined
};

export class TerminusAPI {
  private config: TerminusConfig;

  constructor(config?: Partial<TerminusConfig>) {
    this.config = { ...defaultConfig, ...config };
  }

  private generateHTML(payload: TerminusPayload): string {
    const next = payload.next_todo || 'All done';
    const todos = payload.todos || [];
    const totalTodos = todos.length;
    const completedTodos = todos.filter(t => t.completed).length;
    const percent = totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0;
    const now = new Date();
    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const dayOfWeek = dayNames[now.getDay()];
    const dateStr = `${dayOfWeek}, ${now.getDate()} ${monthNames[now.getMonth()]} ${now.getFullYear()}`;
    // TRMNL Framework v2-compatible markup: no <head>/<style>, device runtime provides CSS
    return `
<div class="layout">
  <div>
    <h1>${payload.kid_name} — ${dateStr}</h1>
  </div>

  <h2>Summary</h2>
  <table class="table" data-table-limit="true">
    <tbody>
      <tr>
        <td><span class="title">Today</span></td>
        <td><span class="title">${payload.daily_points}</span></td>
      </tr>
      <tr>
        <td><span class="title">Week</span></td>
        <td><span class="title">${payload.weekly_points ?? payload.total_points}</span></td>
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
        const sorted = [...todos].sort((a,b) => (a.time||'').localeCompare(b.time||''));
        return sorted.map((t, idx) => {
          const next = sorted[idx + 1];
          const end = next?.time || '';
          return `
        <tr class="${t.is_next ? 'is-next' : ''}">
          <td><span class=\"title\">&nbsp;${idx + 1}&nbsp;</span></td>
          <td><span class=\"title\">&nbsp;${t.title}&nbsp;</span></td>
          <td><span class=\"value\">&nbsp;${t.points ?? ''}&nbsp;</span></td>
          <td><span class=\"value\">&nbsp;${t.completed ? (t.points ?? '') : ''}&nbsp;</span></td>
          <td><span class=\"title\">&nbsp;${t.time || ''}&nbsp;</span></td>
          <td><span class=\"title\">&nbsp;${end}&nbsp;</span></td>
          <td><span class=\"title\">&nbsp;${t.completed ? '✓' : '○'}&nbsp;</span></td>
        </tr>`;
        }).join('');
      })()}
    </tbody>
  </table>
</div>`;
  }

  async sendHTMLContent(payload: TerminusPayload, deviceId?: string): Promise<boolean> {
    try {
      console.log('Sending to Terminus with deviceId:', deviceId);
      console.log('Payload access_token:', payload.access_token ? 'provided' : 'missing');

      const html = this.generateHTML(payload);

      const timestamp = Date.now();
      const requestPayload = {
        screen: {
          content: html,
          model_id: 1, // Default model ID for 7-inch display
          label: `Dashboard for ${payload.kid_name} ${timestamp}`,
          name: `dashboard_${payload.kid_name.toLowerCase().replace(/\s+/g, '_')}_${timestamp}`,
          ...(deviceId && { device_id: deviceId })
        }
      };

      console.log('Request payload:', JSON.stringify(requestPayload, null, 2));

      const headers: any = {
        'Content-Type': 'application/json',
      };

      // Add access token from payload if provided
      if (payload.access_token) {
        headers['Access-Token'] = payload.access_token;
      }

      // Add device ID header if provided
      if (deviceId) {
        headers['ID'] = deviceId;
      }

      const response = await axios.post(
        `${this.config.apiUrl}${this.config.endpoint}`,
        requestPayload,
        {
          headers,
          timeout: 10000, // 10 second timeout
        }
      );

      console.log('Terminus API response:', response.status, response.statusText);
      return response.status === 200 || response.status === 201;
    } catch (error) {
      console.error('Failed to send HTML content to Terminus:', error);
      if (error.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
        console.error('Response headers:', error.response.headers);
      }
      return false;
    }
  }

  async updateDisplay(payload: TerminusPayload): Promise<void> {
    const success = await this.sendHTMLContent(payload, payload.device_id);
    if (!success) {
      throw new Error('Failed to update Terminus display');
    }
  }
}

export const terminus = new TerminusAPI();