import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { playlistId: string; itemId: string } }
) {
  try {
    const { playlistId, itemId } = params;
    
    if (!playlistId || !itemId) {
      return NextResponse.json(
        { error: 'Playlist ID and Item ID are required' },
        { status: 400 }
      );
    }

    const externalApiUrl = process.env.TERMINUS_API_URL || 'http://localhost:8080';
    
    try {
      const response = await axios.delete(`${externalApiUrl}/api/playlists/${playlistId}/items/${itemId}`, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        }
      });

      return NextResponse.json(response.data, { status: response.status });
    } catch (error) {
      console.error('Failed to delete playlist item via external API:', error);
      
      if (error.response) {
        return NextResponse.json(
          { error: 'External API error', details: error.response.data },
          { status: error.response.status }
        );
      }
      
      return NextResponse.json(
        { error: 'Failed to delete playlist item' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Failed to delete playlist item:', error);
    return NextResponse.json(
      { error: 'Failed to delete playlist item' },
      { status: 500 }
    );
  }
}
