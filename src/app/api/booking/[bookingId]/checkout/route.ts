import { NextResponse } from 'next/server';
import { checkoutBooking } from '@/lib/apiClient';

/**
 * POST /api/booking/[bookingId]/checkout
 * Engages the vehicle and starts the rental.
 * Body: { fuel: number, odometer: number, signature_image?: string, signature_checksum?: string }
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
    const { fuel, odometer, signature_image, signature_checksum } = body;

    if (fuel === undefined || odometer === undefined) {
      return NextResponse.json(
        { error: 'fuel and odometer are required' },
        { status: 400 }
      );
    }

    const data = await checkoutBooking(bookingId, {
      fuel,
      odometer,
      signature_image,
      signature_checksum,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error(`[booking/${bookingId}/checkout] Error:`, error);
    return NextResponse.json(
      { error: 'Failed to checkout booking', details: String(error) },
      { status: 500 }
    );
  }
}
