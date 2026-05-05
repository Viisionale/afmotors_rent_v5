import { NextResponse } from 'next/server';
import { checkinBooking } from '@/lib/apiClient';

/**
 * POST /api/booking/[bookingId]/checkin
 * Returns the vehicle and closes the rental movement.
 * Body: { fuel: number, odometer: number, note?: string }
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const { bookingId } = await params;

  if (!bookingId) {
    return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { fuel, odometer, note } = body;

    if (fuel === undefined || odometer === undefined) {
      return NextResponse.json(
        { error: 'fuel and odometer are required' },
        { status: 400 }
      );
    }

    const data = await checkinBooking(bookingId, { fuel, odometer, note });
    return NextResponse.json(data);
  } catch (error) {
    console.error(`[booking/${bookingId}/checkin] Error:`, error);
    return NextResponse.json(
      { error: 'Failed to checkin booking', details: String(error) },
      { status: 500 }
    );
  }
}
