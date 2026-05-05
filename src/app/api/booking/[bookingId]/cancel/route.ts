import { NextResponse } from 'next/server';
import { cancelBooking } from '@/lib/apiClient';

/**
 * POST /api/booking/[bookingId]/cancel
 * Cancels a reservation by booking ID.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params;

  if (!bookingId) {
    return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
  }

  try {
    const data = await cancelBooking(bookingId);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[booking/${bookingId}/cancel] Error:`, error);
    return NextResponse.json(
      { error: 'Failed to cancel booking', details: String(error) },
      { status: 500 }
    );
  }
}
