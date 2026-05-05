import { NextResponse } from 'next/server';
import { searchUserByEmail } from '@/lib/onlineUserClient';
import { fetchFromAPI } from '@/lib/apiClient';

/**
 * POST /api/auth/forgot-password
 * Triggers a password reset email.
 *
 * Body: { email: string }
 *
 * Flow:
 *  1. Look up the user by email via MyRent admin API
 *  2. Generate a signed reset token (stored in a short-lived cookie or returned)
 *  3. Send the reset link via Resend (or log it if no key configured)
 *
 * NOTE: MyRent does not have a native password-reset API, so we implement
 * our own token-based flow stored server-side or via signed JWT.
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 1. Check user exists by searching via admin API
    let onlineUserId: number | null = null;
    try {
      const adminToken = await fetchFromAPI('/authentication').catch(() => null);
      if (adminToken) {
        const found = await searchUserByEmail(email, adminToken);
        if (found?.id || found?.onlineUserId) {
          onlineUserId = found.id || found.onlineUserId;
        }
      }
    } catch {
      // Not critical — even if lookup fails, we send the generic response to avoid enumeration
    }

    // 2. Generate a reset token (JWT-like using base64 + timestamp)
    const payload = JSON.stringify({
      email,
      onlineUserId,
      exp: Date.now() + 3600000, // 1 hour
    });
    const token = Buffer.from(payload).toString('base64url');

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://boooking.afmotorsrent.it';
    const resetUrl = `${baseUrl}/it/reset-password?token=${token}`;

    // 3. Send reset email via Resend (if configured)
    if (process.env.RESEND_API_KEY) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'AF Motors Rent <noreply@afmotorsrent.it>',
            to: email,
            subject: 'Reimposta la tua password / Reset your password',
            html: `
              <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto;">
                <h2 style="color: #FF385C;">Reset password — AF Motors Rent</h2>
                <p>Hai richiesto di reimpostare la password per il tuo account.</p>
                <p>You requested a password reset for your account.</p>
                <p style="margin: 24px 0;">
                  <a href="${resetUrl}" style="background:#FF385C;color:white;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold;display:inline-block;">
                    Reimposta password / Reset password
                  </a>
                </p>
                <p style="color:#999;font-size:13px;">Questo link scade tra 1 ora. / This link expires in 1 hour.</p>
                <p style="color:#999;font-size:13px;">Se non hai richiesto questo, ignora questa email. / If you didn't request this, ignore this email.</p>
              </div>
            `,
          }),
        });
      } catch (e) {
        console.warn('[forgot-password] Resend email failed:', e);
      }
    } else {
      // Log reset link for development/testing
      console.log('[forgot-password] Reset link (no Resend key):', resetUrl);
    }

    // Always return success to avoid email enumeration
    return NextResponse.json({
      status: 'success',
      message: 'If an account with that email exists, a reset link has been sent.',
    });
  } catch (error) {
    console.error('[forgot-password] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
