import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function GET(
  request: NextRequest,
  { params }: { params: { playlistId: string } }
) {
  try {
    const { playlistId } = params;
    
    if (!playlistId) {
      return NextResponse.json(
        { error: 'Playlist ID is required' },
        { status: 400 }
      );
    }

    const externalApiUrl = process.env.TERMINUS_API_URL || 'http://localhost:8080';
    
    try {
      const response = await axios.get(`${externalApiUrl}/api/playlists/${playlistId}/items`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      return NextResponse.json(response.data, { status: response.status });
    } catch (error) {
      console.error('Failed to get playlist items via external API:', error);
      
      if (error.response) {
        return NextResponse.json(
          { error: 'External API error', details: error.response.data },
          { status: error.response.status }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to get playlist items' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to get playlist items:', error);
    return NextResponse.json(
      { error: 'Failed to get playlist items' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { playlistId: string } }
) {
  try {
    const { playlistId } = params;
    const playlistItemData = await request.json();
    
    if (!playlistId) {
      return NextResponse.json(
        { error: 'Playlist ID is required' },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!playlistItemData.playlist_item || !playlistItemData.playlist_item.screen_id) {
      return NextResponse.json(
        { error: 'Missing required fields: playlist_item.screen_id' },
        { status: 400 }
      );
    }

    const externalApiUrl = process.env.TERMINUS_API_URL || 'http://localhost:8080';
    
    try {
      const response = await axios.post(`${externalApiUrl}/api/playlists/${playlistId}/items`, playlistItemData, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      return NextResponse.json(response.data, { status: response.status });
    } catch (error) {
      console.error('Failed to add playlist item via external API:', error);
      
      if (error.response) {
        return NextResponse.json(
          { error: 'External API error', details: error.response.data },
          { status: error.response.status }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to add playlist item' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to add playlist item:', error);
    return NextResponse.json(
      { error: 'Failed to add playlist item' },
      { status: 500 }
    );
  }
}
