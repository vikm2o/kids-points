import { NextRequest, NextResponse } from 'next/server';
import { DevicesDB } from '@/lib/database';
import { Device } from '@/types';
import axios from 'axios';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const refresh = searchParams.get('refresh') === 'true';
    
    // If refresh is requested, fetch from external API
    if (refresh) {
      const externalApiUrl = process.env.TERMINUS_API_URL || 'http://localhost:8080';
      
      try {
        const response = await axios.get(`${externalApiUrl}/api/devices`, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          }
        });

        // Handle both array and { data: [...] } shapes
        const devicesPayload = Array.isArray(response.data)
          ? response.data
          : (Array.isArray(response.data?.data) ? response.data.data : []);

        if (devicesPayload.length > 0) {
          // Save devices to local database
          for (const deviceData of devicesPayload) {
            const existingDevice = DevicesDB.getById(deviceData.id);
            
            if (existingDevice) {
              // Update existing device
              DevicesDB.update(deviceData.id, deviceData);
            } else {
              // Create new device
              DevicesDB.create(deviceData);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch devices from external API:', error);
        // Continue with local data if external API fails
      }
    }

    // Return devices from local database
    const devices = DevicesDB.getAll();
    return NextResponse.json(devices);
  } catch (error) {
    console.error('Failed to get devices:', error);
    return NextResponse.json(
      { error: 'Failed to get devices' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const deviceData: Device = await request.json();
    
    // Validate required fields
    if (!deviceData.id || !deviceData.friendly_id || !deviceData.mac_address || !deviceData.api_key) {
      return NextResponse.json(
        { error: 'Missing required fields: id, friendly_id, mac_address, api_key' },
        { status: 400 }
      );
    }

    const device = DevicesDB.create(deviceData);
    return NextResponse.json(device, { status: 201 });
  } catch (error) {
    console.error('Failed to create device:', error);
    return NextResponse.json(
      { error: 'Failed to create device' },
      { status: 500 }
    );
  }
}
