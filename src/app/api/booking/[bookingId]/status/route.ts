import { NextResponse } from 'next/server';
import { getBookingStatus } from '@/lib/apiClient';

/**
 * GET /api/booking/[bookingId]/status
 * Returns the current status of a reservation.
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
    const data = await getBookingStatus(bookingId);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[booking/${bookingId}/status] Error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch booking status', details: String(error) },
      { status: 500 }
    );
  }
}
