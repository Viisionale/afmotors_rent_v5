import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/onlineUserClient';
import { cookies } from 'next/headers';

/**
 * POST /api/auth/auto-register
 * Automatically creates an account for guest checkout.
 * Body: { email: string }
 */
export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // Generate temp password
    const tempPassword = `AF${Date.now().toString(36)}${Math.random().toString(36).substring(2, 6)}!`;

    const result = await registerUser(email, tempPassword);

    // Set session cookie
    const sessionData = JSON.stringify({
      onlineUserId: result.onlineUserId,
      authToken: result.authToken,
      email,
    });

    const cookieStore = await cookies();
    cookieStore.set('af_session', sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return NextResponse.json({
      status: 'success',
      onlineUserId: result.onlineUserId,
      autoRegistered: true,
    });
  } catch (error) {
    console.error('[auto-register] Error:', error);
    const message = error instanceof Error ? error.message : 'Auto-registration failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
