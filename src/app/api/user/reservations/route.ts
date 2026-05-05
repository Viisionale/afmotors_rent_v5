import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserReservations, getCustomerList, getCustomerReservations } from '@/lib/onlineUserClient';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('af_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const { onlineUserId, authToken } = session;

    // Try getting reservations directly from onlineUser endpoint
    let reservations: unknown[] = [];

    try {
      const data = await getUserReservations(onlineUserId, authToken);
      reservations = data?.reservationList || data?.Data || [];
    } catch (e) {
      console.warn('Direct reservation fetch failed, trying via customer:', e);
    }

    // If no direct reservations, try via customer
    if (reservations.length === 0) {
      try {
        const customerData = await getCustomerList(onlineUserId, authToken);
        const customers = customerData?.customerList || [];

        for (const customer of customers) {
          try {
            const custRes = await getCustomerReservations(onlineUserId, customer.id, authToken);
            const custReservations = custRes?.reservationList || [];
            reservations = [...reservations, ...custReservations];
          } catch {
            // Skip this customer
          }
        }
      } catch {
        // No customers found
      }
    }

    return NextResponse.json({
      status: 'success',
      reservations,
      total: reservations.length,
    });
  } catch (error) {
    console.error('Reservations fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch reservations' }, { status: 500 });
  }
}
