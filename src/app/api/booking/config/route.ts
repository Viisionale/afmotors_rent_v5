import { NextResponse } from 'next/server';
import { getBookingConfig } from '@/lib/apiClient';

/**
 * GET /api/booking/config
 * Returns the full booking configuration from MyRent.
 */
export async function GET() {
  try {
    const config = await getBookingConfig();
    return NextResponse.json(config);
  } catch (error) {
    console.error('[booking/config] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch booking configuration', details: String(error) },
      { status: 500 }
    );
  }
}
