import { NextResponse } from 'next/server';
import { getBookingDetails } from '@/lib/apiClient';

/**
 * GET /api/booking/[bookingId]
 * Returns full reservation details by booking ID.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params;

  if (!bookingId) {
    return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
  }

  try {
    const data = await getBookingDetails(bookingId);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[booking/${bookingId}] Error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch booking details', details: String(error) },
      { status: 500 }
    );
  }
}
