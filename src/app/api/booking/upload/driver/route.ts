import { NextResponse } from 'next/server';
import { uploadDriverDocument } from '@/lib/apiClient';

/**
 * POST /api/booking/upload/driver
 * Uploads a driver document. Expects multipart form data with:
 *   - file: the document file
 *   - driverId: the driver's ID
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob | null;
    const driverId = formData.get('driverId') as string | null;
    const fileName = (formData.get('file') as File)?.name || 'document';

    if (!file || !driverId) {
      return NextResponse.json(
        { error: 'file and driverId are required' },
        { status: 400 }
      );
    }

    const data = await uploadDriverDocument(parseInt(driverId, 10), file, fileName);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[booking/upload/driver] Error:', error);
    return NextResponse.json(
      { error: 'Failed to upload driver document', details: String(error) },
      { status: 500 }
    );
  }
}
