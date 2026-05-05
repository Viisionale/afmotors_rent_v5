import { NextResponse } from 'next/server';
import { getInsuranceList } from '@/lib/apiClient';

/**
 * POST /api/booking/insurance
 * Returns dynamic insurance/protection plans for a given group, location, and dates.
 *
 * Body: { group, reservationSource?, locationCode, startDate, endDate }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { group, reservationSource, locationCode, startDate, endDate } = body;

    if (!group || !locationCode || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'group, locationCode, startDate and endDate are required' },
        { status: 400 }
      );
    }

    const data = await getInsuranceList({
      group,
      reservationSource: reservationSource || 'WEB001',
      locationCode,
      startDate,
      endDate,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('[booking/insurance] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch insurance list', details: String(error) },
      { status: 500 }
    );
  }
}
