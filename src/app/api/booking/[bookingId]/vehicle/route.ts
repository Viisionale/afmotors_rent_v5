import { NextResponse } from 'next/server';
import { getBookingVehicle } from '@/lib/apiClient';

/**
 * GET /api/booking/[bookingId]/vehicle
 * Returns vehicle details assigned to a booking.
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
    const data = await getBookingVehicle(bookingId);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[booking/${bookingId}/vehicle] Error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch booking vehicle', details: String(error) },
      { status: 500 }
    );
  }
}
