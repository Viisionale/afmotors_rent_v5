import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getUserProfile, updateUserProfile } from '@/lib/onlineUserClient';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('af_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const { onlineUserId, authToken } = session;

    const data = await getUserProfile(onlineUserId, authToken);
    const profile = data?.onlineUser || data?.user || data;

    return NextResponse.json({
      status: 'success',
      profile: {
        id: profile?.id || onlineUserId,
        firstName: profile?.firstName || '',
        lastName: profile?.lastName || '',
        email: profile?.email || session.email,
        phoneNumber: profile?.phoneNumber || '',
      },
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    return NextResponse.json({ error: 'Failed to fetch profile' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('af_session');

    if (!sessionCookie?.value) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const { onlineUserId, authToken } = session;
    const body = await request.json();

    const result = await updateUserProfile(onlineUserId, {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      phoneNumber: body.phoneNumber,
    }, authToken);

    return NextResponse.json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    console.error('Profile update error:', error);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}
