import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(request: NextRequest) {
  try {
    const externalApiUrl = process.env.TERMINUS_API_URL || 'http://localhost:8080';

    // Step 1: Get all screens
    console.log('Fetching all screens for cleanup...');
    const screensResponse = await axios.get(`${externalApiUrl}/api/screens`, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    const screens = screensResponse.data?.data || [];
    console.log(`Found ${screens.length} total screens`);

    // Step 2: Filter screens created before today
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayStartISO = todayStart.toISOString();

    const oldScreens = screens.filter((screen: any) => {
      const createdAt = new Date(screen.created_at);
      return createdAt < todayStart;
    });

    console.log(`Found ${oldScreens.length} screens to delete (created before ${todayStartISO})`);

    // Step 3: Delete old screens
    const deletedScreens = [];
    const failedScreens = [];

    for (const screen of oldScreens) {
      try {
        await axios.delete(`${externalApiUrl}/api/screens/${screen.id}`, {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
          }
        });
        deletedScreens.push(screen.id);
        console.log(`Deleted screen ${screen.id} (${screen.name})`);
      } catch (error) {
        console.error(`Failed to delete screen ${screen.id}:`, error);
        failedScreens.push({ id: screen.id, error: axios.isAxiosError(error) ? error.message : 'Unknown error' });
      }
    }

    console.log(`Cleanup complete: ${deletedScreens.length} deleted, ${failedScreens.length} failed`);

    return NextResponse.json({
      success: true,
      message: 'Screen cleanup completed',
      summary: {
        total_screens: screens.length,
        old_screens_found: oldScreens.length,
        deleted: deletedScreens.length,
        failed: failedScreens.length
      },
      deleted_screen_ids: deletedScreens,
      failed_screens: failedScreens
    });

  } catch (error: unknown) {
    console.error('Failed to cleanup screens:', error);

    if (axios.isAxiosError(error) && error.response) {
      return NextResponse.json(
        { error: 'External API error', details: error.response.data },
        { status: error.response.status }
      );
    }

    return NextResponse.json(
      { error: 'Failed to cleanup screens' },
      { status: 500 }
    );
  }
}