import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosError } from 'axios';
import { DevicesDB } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const externalApiUrl = process.env.TERMINUS_API_URL || 'http://localhost:8080';

    const response = await axios.get(`${externalApiUrl}/api/screens`, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: unknown) {
    console.error('Failed to fetch screens:', error);

    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        { error: 'External API error', details: error.response.data },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch screens' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const screenData = await request.json();

    // Validate required fields
    if (!screenData.screen || !screenData.screen.label || !screenData.screen.content || !screenData.screen.name || !screenData.screen.model_id) {
      return NextResponse.json(
        { error: 'Missing required fields: screen.label, screen.content, screen.name, screen.model_id' },
        { status: 400 }
      );
    }

    const externalApiUrl = process.env.TERMINUS_API_URL || 'http://localhost:8080';

    // Debug: Log the payload being sent
    console.log('Sending screen data to external API:', JSON.stringify(screenData, null, 2));

    try {
      // Step 1: Create the screen
      const response = await axios.post(`${externalApiUrl}/api/screens`, screenData, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const createdScreen = response.data;
      const screenId = createdScreen.data?.id;
      const deviceId = screenData.device_id;

      // Step 2: If device_id is provided, get playlist_id and update the playlist
      if (deviceId && screenId) {
        try {
          // Step 2.1: Get device to find playlist_id
          const device = DevicesDB.getById(deviceId);

          if (!device) {
            console.error(`Device ${deviceId} not found in local database`);
            return NextResponse.json({
              ...createdScreen,
              playlist_update_error: 'Screen created but device not found'
            }, { status: response.status });
          }

          const playlistId = device.playlist_id;
          console.log(`Device ${deviceId} has playlist_id: ${playlistId}`);

          // Step 2.2: Get all playlist items from Terminus API
          console.log(`Fetching playlist items from: ${externalApiUrl}/api/playlists/${playlistId}/items`);
          const playlistItemsResponse = await axios.get(`${externalApiUrl}/api/playlists/${playlistId}/items`, {
            timeout: 10000,
            headers: {
              'Content-Type': 'application/json',
            }
          });

          const playlistItems = playlistItemsResponse.data?.data || [];
          console.log(`Found ${playlistItems.length} playlist items`);

          // Step 2.3: Find and delete the item at position 1
          const itemAtPosition1 = playlistItems.find((item: any) => item.position === 1);
          if (itemAtPosition1) {
            console.log(`Deleting playlist item ${itemAtPosition1.id} at position 1`);
            await axios.delete(`${externalApiUrl}/api/playlists/${playlistId}/items/${itemAtPosition1.id}`, {
              timeout: 10000,
              headers: {
                'Content-Type': 'application/json',
              }
            });
            console.log(`Successfully deleted playlist item ${itemAtPosition1.id}`);
          } else {
            console.log('No item found at position 1');
          }

          // Step 2.4: Add the new screen to the playlist at position 1
          console.log(`Adding screen ${screenId} to playlist ${playlistId} at position 1`);
          const addItemResponse = await axios.post(`${externalApiUrl}/api/playlists/${playlistId}/items`, {
            playlist_item: {
              screen_id: screenId,
              position: 1
            }
          }, {
            timeout: 10000,
            headers: {
              'Content-Type': 'application/json',
            }
          });
          console.log(`Successfully added screen ${screenId} to playlist. Response:`, addItemResponse.data);
        } catch (playlistError) {
          console.error('Failed to update playlist:', playlistError);
          // Return the screen creation response even if playlist update fails
          return NextResponse.json({
            ...createdScreen,
            playlist_update_error: 'Screen created but failed to update playlist'
          }, { status: response.status });
        }
      }

      return NextResponse.json(createdScreen, { status: response.status });
    } catch (error: unknown) {
      console.error('Failed to create screen via external API:', error);

      if (axios.isAxiosError(error) && error.response) {
        return NextResponse.json(
          { error: 'External API error', details: error.response.data },
          { status: error.response.status }
        );
      }

      return NextResponse.json(
        { error: 'Failed to create screen' },
        { status: 500 }
      );
    }
  } catch (error: unknown) {
    console.error('Failed to create screen:', error);
    return NextResponse.json(
      { error: 'Failed to create screen' },
      { status: 500 }
    );
  }
}
