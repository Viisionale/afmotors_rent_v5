import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('af_session');
  return NextResponse.json({ status: 'success' });
}
