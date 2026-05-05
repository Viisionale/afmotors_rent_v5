import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { cookies } from 'next/headers';
import { registerUser } from '@/lib/onlineUserClient';
import {
  createBooking,
  updateBookingStatus,
  type BookingCreationPayload,
  type BookingOptional,
} from '@/lib/apiClient';
import { sendRichBookingConfirmation, sendAdminBookingNotification, sendWelcomeEmail } from '@/lib/emailService';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

/**
 * POST /api/checkout/confirm-booking
 *
 * Called after Stripe payment succeeds. Flow:
 * 1. Verify Stripe payment
 * 2. Register guest user OR use existing session (for onlineUser ID)
 * 3. Create booking via POST /touroperator/quotations (full payload)
 * 4. Confirm the reservation via PUT /bookings/{id}/updateStatus
 * 5. Send confirmation email via POST /{bookingId}/sendEmail
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { paymentIntentId, customerEmail, customerName, bookingData = {} } = body;

    console.log('[confirm-booking] Starting. Email:', customerEmail);
    console.log('[confirm-booking] bookingData:', JSON.stringify(bookingData).substring(0, 800));

    // ─── 1. Verify Stripe payment ─────────────────────────────────
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed', status: paymentIntent.status },
        { status: 400 }
      );
    }
    console.log('[confirm-booking] Stripe payment verified ✅');

    // ─── 2. Register or find user ─────────────────────────────────
    let onlineUserId = 0;
    let autoRegistered = false;
    let accountExists = false;

    const [firstName, ...lastParts] = (customerName || '').split(' ');
    const lastName = lastParts.join(' ') || firstName;

    // Check if user already has a session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('af_session');

    if (sessionCookie?.value) {
      try {
        const session = JSON.parse(sessionCookie.value);
        onlineUserId = session.onlineUserId;
        console.log('[confirm-booking] Using existing session, onlineUserId:', onlineUserId);
      } catch {
        console.warn('[confirm-booking] Invalid session cookie');
      }
    }

    if (!onlineUserId) {
      const tempPassword = `AF${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}!`;
      try {
        const regResult = await registerUser(customerEmail, tempPassword);
        onlineUserId = regResult.onlineUserId;
        autoRegistered = true;
        console.log('[confirm-booking] Registered new user:', onlineUserId);

        // Send Welcome Email with generated password
        const welcomeEmailSent = await sendWelcomeEmail(customerName || firstName, customerEmail, tempPassword);
        console.log('[confirm-booking] Welcome email sent:', welcomeEmailSent);

        const sessionData = JSON.stringify({
          onlineUserId,
          authToken: regResult.authToken,
          email: customerEmail,
        });
        cookieStore.set('af_session', sessionData, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 7,
          path: '/',
        });
      } catch (regError: unknown) {
        const regMsg = String(regError).toLowerCase();
        if (
          regMsg.includes('already exist') ||
          regMsg.includes('email already') ||
          regMsg.includes('già esiste')
        ) {
          accountExists = true;
          console.log('[confirm-booking] Account already exists for:', customerEmail);
          // We can still create the booking without an onlineUser ID
          // The touroperator quotations endpoint works with or without it
        } else {
          console.error('[confirm-booking] Registration failed:', regError);
        }
      }
    }

    // ─── 3. Create booking via touroperator/quotations ─────────────
    // This is the CORRECT endpoint: POST /api/v1/touroperator/quotations
    // with a full payload including Customer, VehicleCode, optionals, etc.

    const amountInEur = (paymentIntent.amount / 100); // Stripe amount is in cents

    // Build optionals array from bookingData
    const optionals: BookingOptional[] = [];
    let extrasArray = bookingData.selectedExtras;
    // selectedExtras comes as a JSON string from the frontend
    if (typeof extrasArray === 'string') {
      try { extrasArray = JSON.parse(extrasArray); } catch { extrasArray = []; }
    }
    if (extrasArray && Array.isArray(extrasArray)) {
      for (const extra of extrasArray) {
        optionals.push({
          EquipType: extra.EquipType || extra.code || extra.equipType || '',
          Quantity: String(extra.Quantity || extra.quantity || 1),
          Selected: true,
          Prepaid: false,
        });
      }
    }

    // Parse insuranceId
    const insuranceId = parseInt(String(bookingData.insuranceId || 0), 10) || undefined;


    // Build the booking payload matching the API spec exactly
    const bookingPayload: BookingCreationPayload = {
      startDate: bookingData.pickupDate || bookingData.startDate || '',
      endDate: bookingData.dropoffDate || bookingData.endDate || '',
      pickupLocation: bookingData.pickupLocation || '',
      dropOffLocation: bookingData.dropoffLocation || bookingData.pickupLocation || '',
      flightNumber: bookingData.flightNumber || '',
      Customer: {
        Name: firstName || '',
        Surname: lastName || '',
        email: customerEmail || null,
        phNum1: bookingData.phoneNumber || bookingData.phone || '',
        mobileNumber: bookingData.phoneNumber || bookingData.phone || '',
        street: bookingData.address || '',
        city: bookingData.city || '',
        zip: bookingData.zipCode || '',
        country: bookingData.country || 'ITALIA',
        state: bookingData.state || bookingData.province || '',
        birthPlace: bookingData.birthPlace || '',
        birthDate: bookingData.birthDate || '',
        birthProvince: bookingData.birthProvince || '',
        birthNation: bookingData.birthNation || bookingData.country || '',
        gender: true,
        taxCode: bookingData.taxCode || '',
        vatNumber: bookingData.vatNumber || null,
        document: bookingData.documentType || '',
        documentNumber: bookingData.documentNumber || '',
        licenceType: bookingData.licenceType || 'B',
        issueBy: bookingData.issueBy || '',
        releaseDate: bookingData.releaseDate || '',
        expiryDate: bookingData.expiryDate || '',
        ragioneSociale: bookingData.companyName || null,
        codice: null,
        phNum2: null,
        // If we found clientId from previous flows, include it
        ...(bookingData.clientId ? { clientId: String(bookingData.clientId) } : {}),
      },
      // VehicleCode = the group code (national or international code like "A", "EDMR", "K", etc.)
      VehicleCode: bookingData.vehicleCode || bookingData.groupCode || bookingData.vehicleGroup || '',
      optionals: optionals.length > 0 ? optionals : undefined,
      Fee: {
        Amount: '',
        CurrencyCode: 'EUR',
        Description: '',
      },
      VehicleRequest: {
        PaymentTransactionTypeCode: 'charge',
        // Stripe payment — use CUSTOMCREDITCARD since we handle payment externally
        PaymentType: '---3CUSTOMCREDITCARD---3',
        type: 'Payment',
        PaymentAmount: amountInEur,
        VoucherNumber: paymentIntentId, // Store the Stripe PI ID as voucher reference
      },
      channel: bookingData.channel || 'WEB001',
      ...(onlineUserId > 0 ? { onlineUser: onlineUserId } : {}),
      ...(insuranceId ? { insuranceId } : {}),
    };

    console.log('[confirm-booking] Creating booking with touroperator/quotations...');

    let bookingResult = null;
    let bookingId = '';

    try {
      bookingResult = await createBooking(bookingPayload);
      console.log('[confirm-booking] ✅ createBooking result:', JSON.stringify(bookingResult).substring(0, 500));

      // Extract booking ID from response
      // BookingResponse format: { data: [...] } or { data: { id, ... } }
      const bookingData2 = bookingResult?.data;
      if (Array.isArray(bookingData2) && bookingData2.length > 0) {
        bookingId = bookingData2[0]?.id || '';
      } else if (bookingData2?.id) {
        bookingId = bookingData2.id;
      } else if (bookingResult?.id) {
        bookingId = bookingResult.id;
      }
      console.log('[confirm-booking] Booking ID:', bookingId);
    } catch (bookingError) {
      console.error('[confirm-booking] ❌ createBooking failed:', bookingError);
    }

    // ─── 4. Confirm the reservation ─────────────────────────────────
    if (bookingId) {
      try {
        const statusResult = await updateBookingStatus(bookingId);
        console.log('[confirm-booking] ✅ updateStatus result:', JSON.stringify(statusResult));
      } catch (statusError) {
        console.warn('[confirm-booking] updateStatus failed (may already be confirmed):', statusError);
      }
    }

    // ─── 5. Send confirmation email ─────────────────────────────────
    if (bookingId) {
      try {
        const vehicleName = bookingData.vehicleName || bookingData.vehicleGroup || 'Veicolo Selezionato';
        const emailPayload = {
          to: customerEmail,
          bookingId: bookingId,
          customerName: customerName || firstName || 'Cliente',
          startDate: bookingData.pickupDate || bookingData.startDate || 'Da definire',
          endDate: bookingData.dropoffDate || bookingData.endDate || 'Da definire',
          vehicleName: vehicleName,
          totalAmount: amountInEur.toFixed(2),
          pickupLocation: bookingData.pickupLocation || 'Sede di Ritiro',
          dropoffLocation: bookingData.dropoffLocation || bookingData.pickupLocation || 'Sede di Riconsegna',
          phoneNumber: bookingData.phoneNumber || bookingData.phone || '',
          flightNumber: bookingData.flightNumber || '',
          optionals: optionals,
          insurancePlan: bookingData.protectionPlan || '',
          requestInvoice: bookingData.requestInvoice || 'false',
          companyName: bookingData.companyName || '',
          country: bookingData.country || '',
          taxCode: bookingData.taxCode || '',
          vatNumber: bookingData.vatNumber || '',
          sdiPec: bookingData.sdiPec || '',
        };

        // 5a. Email to Customer
        const emailResult = await sendRichBookingConfirmation(emailPayload);
        console.log('[confirm-booking] ✅ Custom rich confirmation email sent:', emailResult);

        // 5b. Notification to Admin
        const adminEmailResult = await sendAdminBookingNotification(emailPayload);
        console.log('[confirm-booking] ✅ Admin notification email sent:', adminEmailResult);
      } catch (emailErr) {
        console.warn('[confirm-booking] Custom email send failed:', emailErr);
      }
    }

    // ─── 6. Return response ─────────────────────────────────────────
    return NextResponse.json({
      status: 'success',
      paymentIntentId,
      bookingId: bookingId || paymentIntentId,
      reservationCreated: !!bookingId,
      autoRegistered,
      accountExists,
      customerEmail,
      bookingDetails: bookingResult?.data || null,
    });
  } catch (error) {
    console.error('[confirm-booking] Fatal error:', error);
    return NextResponse.json(
      { error: 'Failed to confirm booking', details: String(error) },
      { status: 500 }
    );
  }
}
