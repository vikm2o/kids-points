import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Screen ID is required' },
        { status: 400 }
      );
    }

    const externalApiUrl = process.env.TERMINUS_API_URL || 'http://localhost:8080';

    const response = await axios.delete(`${externalApiUrl}/api/screens/${id}`, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: unknown) {
    console.error('Failed to delete screen:', error);

    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        { error: 'External API error', details: error.response.data },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete screen' },
      { status: 500 }
    );
  }
}