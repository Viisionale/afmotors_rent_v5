import { NextResponse } from 'next/server';
import { uploadCustomerDocument } from '@/lib/apiClient';

/**
 * POST /api/booking/upload/customer
 * Uploads a customer document. Expects multipart form data with:
 *   - file: the document file
 *   - customerId: the customer's ID
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as Blob | null;
    const customerId = formData.get('customerId') as string | null;
    const fileName = (formData.get('file') as File)?.name || 'document';

    if (!file || !customerId) {
      return NextResponse.json(
        { error: 'file and customerId are required' },
        { status: 400 }
      );
    }

    const data = await uploadCustomerDocument(parseInt(customerId, 10), file, fileName);
    return NextResponse.json(data);
  } catch (error) {
    console.error('[booking/upload/customer] Error:', error);
    return NextResponse.json(
      { error: 'Failed to upload customer document', details: String(error) },
      { status: 500 }
    );
  }
}
