import { NextResponse } from 'next/server';
import { getPrivacyAndTerms } from '@/lib/apiClient';

/**
 * GET /api/booking/privacy-terms?language=en
 * Returns CDN URLs for Privacy Policy and Terms & Conditions PDFs.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const language = searchParams.get('language') || 'en';

  try {
    const data = await getPrivacyAndTerms(language);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[booking/privacy-terms] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch privacy and terms', details: String(error) },
      { status: 500 }
    );
  }
}
