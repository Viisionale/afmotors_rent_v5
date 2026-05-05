import { NextResponse } from 'next/server';
import { registerUser } from '@/lib/onlineUserClient';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    const result = await registerUser(email, password);

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
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return NextResponse.json({
      status: 'success',
      onlineUserId: result.onlineUserId,
      email,
    });
  } catch (error) {
    console.error('Registration error:', error);
    const message = error instanceof Error ? error.message : 'Registration failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
