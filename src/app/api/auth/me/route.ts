import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserProfile } from '@/lib/onlineUserClient';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('af_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    const session = JSON.parse(sessionCookie.value);
    const { onlineUserId, authToken, email } = session;

    if (!onlineUserId || !authToken) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    // Try to get profile details from MyRent
    let profile = null;
    try {
      const profileData = await getUserProfile(onlineUserId, authToken);
      profile = profileData?.onlineUser || profileData?.user || profileData;
    } catch {
      // Profile fetch failed — token may be expired, but we still return basic session info
      console.warn('Could not fetch user profile, using session data');
    }

    return NextResponse.json({
      authenticated: true,
      onlineUserId,
      email,
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      phoneNumber: profile?.phoneNumber || '',
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}
