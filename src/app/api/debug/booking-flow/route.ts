import { NextResponse } from 'next/server';
import { registerUser, getCustomerList, createCustomer, createCustomerQuotation, createReservationFromQuotation } from '@/lib/onlineUserClient';

const TOUROPERATOR_BASE = process.env.MYRENT_API_BASE_URL || 'https://afmotors.myrent.it/MyRentWeb/api/v1/touroperator';

/**
 * GET /api/debug/booking-flow?email=test@test.com&testQuotation=true
 * Traces the full booking creation chain step by step.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email') || 'debug5@afmotorsrent.it';
  const testQuotation = searchParams.get('testQuotation') === 'true';

  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    params: { email, testQuotation },
    steps: {} as Record<string, unknown>,
  };
  const steps = results.steps as Record<string, unknown>;

  // Step 1: Admin auth
  let adminToken = '';
  try {
    const authRes = await fetch(`${TOUROPERATOR_BASE}/authentication`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        UserId: process.env.MYRENT_USER_ID,
        Password: process.env.MYRENT_USER_PASSWORD,
        companyCode: process.env.MYRENT_COMPANY_CODE,
      }),
      cache: 'no-store',
    });
    const authData = await authRes.json();
    adminToken = authData?.result?.tokenValue || authData?.tokenValue || '';
    steps['1_admin_auth'] = { ok: !!adminToken, tokenPreview: adminToken ? adminToken.substring(0, 12) + '...' : null };
  } catch (e) {
    steps['1_admin_auth'] = { error: String(e) };
    return NextResponse.json(results);
  }

  // Step 2: Register/find user
  let onlineUserId = 0;
  try {
    const regRes = await registerUser(email, `AFdiag_${Date.now().toString(36)}!`);
    onlineUserId = regRes.onlineUserId;
    steps['2_user'] = { ok: true, onlineUserId };
  } catch (e) {
    steps['2_user'] = { registrationError: String(e) };
    // Try search
    try {
      const WEB_BASE = TOUROPERATOR_BASE.replace(/\/api\/v1\/touroperator\/?$/, '');
      const res = await fetch(`${WEB_BASE}/api/v1/onlineUser/search?email=${encodeURIComponent(email)}`, {
        headers: { 'Content-Type': 'application/json', 'tokenValue': adminToken }, cache: 'no-store',
      });
      const data = await res.json();
      const users = data?.userList || [];
      if (users[0]?.id) { onlineUserId = users[0].id; }
      steps['2b_search'] = { found: !!onlineUserId, onlineUserId };
    } catch (e2) {
      steps['2b_search'] = { error: String(e2) };
    }
  }
  if (!onlineUserId) return NextResponse.json({ ...results, fatal: 'No onlineUserId' });

  // Step 3: Get/create customer
  let customerId: number | null = null;
  try {
    const cData = await getCustomerList(onlineUserId, adminToken);
    const customers = cData?.customerList || [];
    if (Array.isArray(customers) && customers.length > 0) {
      customerId = customers[0].id;
      steps['3_customer'] = { exists: true, customerId };
    }
  } catch (e) { steps['3_customer_err'] = String(e); }

  if (!customerId) {
    try {
      const c = await createCustomer(onlineUserId, { firstName: 'Test', lastName: 'AFMotors', email }, adminToken);
      customerId = c?.id;
      steps['3_customer'] = { created: true, customerId, raw: c };
    } catch (e) { steps['3_customer'] = { error: String(e) }; }
  }
  if (!customerId) return NextResponse.json({ ...results, fatal: 'No customerId' });

  // Step 4: Create quotation (if testQuotation=true)
  if (testQuotation) {
    try {
      const qResult = await createCustomerQuotation(
        onlineUserId,
        customerId,
        {
          pickUpDate: '2026-06-01T10:00:00',
          dropOffDate: '2026-06-05T10:00:00',
          pickUpLocationCode: 'AF-Apt',
          dropOffLocationCode: 'AF-Apt',
          vehicleGroupCode: 'B', // MINI group
        },
        adminToken
      );
      steps['4_create_quotation'] = { ok: true, result: qResult };

      const quotationId = qResult?.id || qResult?.quotationId || null;
      steps['4_quotation_id'] = quotationId;

      // Step 5: Convert to reservation
      if (quotationId) {
        try {
          const resResult = await createReservationFromQuotation(
            onlineUserId, customerId, quotationId, adminToken
          );
          steps['5_create_reservation'] = { ok: true, result: resResult };
        } catch (e) {
          steps['5_create_reservation'] = { error: String(e) };
        }
      } else {
        steps['5_create_reservation'] = { skipped: true, reason: 'No quotation ID returned' };
      }
    } catch (e) {
      steps['4_create_quotation'] = { error: String(e) };
    }
  } else {
    steps['4_create_quotation'] = { skipped: true, hint: 'Add ?testQuotation=true to test the full flow' };
  }

  return NextResponse.json(results);
}
