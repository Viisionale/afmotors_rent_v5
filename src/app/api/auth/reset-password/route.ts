import { NextResponse } from 'next/server';
import { loginUser } from '@/lib/onlineUserClient';

/**
 * POST /api/auth/reset-password
 * Validates a reset token and sets the new password.
 *
 * Body: { token: string, newPassword: string }
 */
export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();

    if (!token || !newPassword) {
      return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 });
    }

    if (newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    // 1. Decode and validate token
    let email: string;
    let exp: number;
    try {
      const decoded = JSON.parse(Buffer.from(token, 'base64url').toString('utf8'));
      email = decoded.email;
      exp = decoded.exp;
    } catch {
      return NextResponse.json({ error: 'Invalid reset token' }, { status: 400 });
    }

    if (!email || Date.now() > exp) {
      return NextResponse.json(
        { error: 'Reset link has expired. Please request a new one.' },
        { status: 400 }
      );
    }

    // 2. Update password via MyRent API
    // Try to login with a temp password to get token, then update profile
    // Since we don't have old password, we use the admin update endpoint
    const WEB_BASE = (process.env.MYRENT_API_BASE_URL || 'https://afmotors.myrent.it/MyRentWeb')
      .replace(/\/api\/v1\/touroperator\/?$/, '');

    // First, find the user's onlineUserId by searching
    // then update via admin-level API
    const adminRes = await fetch(`${WEB_BASE}/api/v1/onlineUser/search?email=${encodeURIComponent(email)}`, {
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    if (!adminRes.ok) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    const userData = await adminRes.json();
    const onlineUserId = userData?.id || userData?.onlineUserId;

    if (!onlineUserId) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // 3. Update password
    const updateRes = await fetch(`${WEB_BASE}/api/v1/onlineUser/${onlineUserId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: newPassword, userType: 1, userRole: 2, userStatus: 1 }),
      cache: 'no-store',
    });

    if (!updateRes.ok) {
      const body = await updateRes.text();
      console.error('[reset-password] Update failed:', body);
      return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
    }

    // 4. Log user in with new password and set session cookie
    try {
      const { onlineUserId: uid, authToken } = await loginUser(email, newPassword);
      const sessionData = JSON.stringify({ onlineUserId: uid, authToken, email });

      const response = NextResponse.json({ status: 'success', message: 'Password updated successfully' });
      response.cookies.set('af_session', sessionData, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
      return response;
    } catch {
      // Password was set but auto-login failed — still return success
      return NextResponse.json({ status: 'success', message: 'Password updated. Please log in.' });
    }
  } catch (error) {
    console.error('[reset-password] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
