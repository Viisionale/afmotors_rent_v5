import { NextResponse } from 'next/server';
import { getBookingDriver, updateBookingDriver } from '@/lib/apiClient';

/**
 * GET /api/booking/[bookingId]/driver
 * Returns driver details for a booking.
 *
 * POST /api/booking/[bookingId]/driver
 * Updates or sets driver details for a booking.
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
    const data = await getBookingDriver(bookingId);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[booking/${bookingId}/driver] GET Error:`, error);
    return NextResponse.json(
      { error: 'Failed to fetch driver details', details: String(error) },
      { status: 500 }
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params;

  if (!bookingId) {
    return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
  }

  try {
    const driverData = await request.json();
    const data = await updateBookingDriver(bookingId, driverData);
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[booking/${bookingId}/driver] POST Error:`, error);
    return NextResponse.json(
      { error: 'Failed to update driver details', details: String(error) },
      { status: 500 }
    );
  }
}
