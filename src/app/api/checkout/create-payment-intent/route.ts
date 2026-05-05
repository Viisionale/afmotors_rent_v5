import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia',
});

/**
 * POST /api/checkout/create-payment-intent
 * Creates a Stripe PaymentIntent with the booking total.
 *
 * Body: {
 *   amount: number (cents),
 *   currency: string,
 *   customerEmail: string,
 *   metadata: { vehicleId, vehicleName, pickupDate, dropoffDate, pickupLocation, dropOffLocation, ... }
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { amount, currency, customerEmail, metadata } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // amount in cents
      currency: currency || 'eur',
      receipt_email: customerEmail,
      metadata: {
        customerEmail: customerEmail,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('[create-payment-intent] Error:', error);
    const message = error instanceof Error ? error.message : 'Payment intent creation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
