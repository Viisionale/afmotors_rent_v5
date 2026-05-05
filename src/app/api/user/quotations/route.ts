import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserQuotations, getCustomerList, getCustomerQuotations } from '@/lib/onlineUserClient';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('af_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const { onlineUserId, authToken } = session;

    let quotations: unknown[] = [];

    try {
      const data = await getUserQuotations(onlineUserId, authToken);
      quotations = data?.quotatioList || data?.quotationList || [];
    } catch (e) {
      console.warn('Direct quotation fetch failed, trying via customer:', e);
    }

    // If no direct quotations, try via customer
    if (quotations.length === 0) {
      try {
        const customerData = await getCustomerList(onlineUserId, authToken);
        const customers = customerData?.customerList || [];

        for (const customer of customers) {
          try {
            const custQuot = await getCustomerQuotations(onlineUserId, customer.id, authToken);
            const custQuotations = custQuot?.quotatioList || custQuot?.quotationList || [];
            quotations = [...quotations, ...custQuotations];
          } catch {
            // Skip
          }
        }
      } catch {
        // No customers
      }
    }

    return NextResponse.json({
      status: 'success',
      quotations,
      total: quotations.length,
    });
  } catch (error) {
    console.error('Quotations fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch quotations' }, { status: 500 });
  }
}
