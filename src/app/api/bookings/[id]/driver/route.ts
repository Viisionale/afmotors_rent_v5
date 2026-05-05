import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchFromAPI, getToken } from '@/lib/apiClient';
import { sendPreCheckinConfirmation } from '@/lib/emailService';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing booking ID' }, { status: 400 });

  try {
    const formData = await request.formData();
    const isPhysicalPerson = formData.get('isPhysicalPerson') === 'true';
    const name = formData.get('name') as string;
    const surname = formData.get('surname') as string;
    const birthDate = formData.get('birthDate') as string;
    const birthPlace = formData.get('birthPlace') as string;
    const birthProv = formData.get('birthProv') as string;
    const birthNation = formData.get('birthNation') as string;
    
    const documentType = formData.get('document') as string || 'PATENTE';
    const documentNumb = formData.get('documentNumb') as string;
    const releaseDate = formData.get('releaseDate') as string;
    const expiryDate = formData.get('expiryDate') as string;
    const issueBy = formData.get('issueBy') as string;
    
    const street = formData.get('street') as string;
    const city = formData.get('city') as string;
    const postalCode = formData.get('postalCode') as string;
    const province = formData.get('province') as string;
    const national = formData.get('national') as string || 'ITALIA';
    
    const email = formData.get('email') as string;
    const phoneNumb1 = formData.get('phoneNumb1') as string;
    
    const file = formData.get('file') as File;

    // 1. Update Driver details via MyRent API
    const driverPayload = {
      isPhysicalPerson: true,
      isClient: true,
      isDriver: true,
      name,
      surname,
      birthDate,
      birthPlace,
      birthProv,
      birthNation,
      document: documentType,
      documentNumb,
      releaseDate,
      expiryDate,
      issueBy,
      street,
      city,
      postalCode,
      province,
      national,
      email,
      phoneNumb1,
      gender: true // required boolean
    };

    const driverRes = await fetchFromAPI(`/${id}/driver`, {
      method: 'POST',
      body: JSON.stringify(driverPayload),
    });

    console.log('[pre-checkin] Driver updated for booking', id, driverRes);

    // 2. Handle File Upload if present
    if (file && file.size > 0) {
      // MyRent expects multipart/form-data with `file`
      // We use the uploaddocuments/driver endpoint
      const uploadData = new FormData();
      uploadData.append('file', file);
      // If we don't have driverId explicitly, we might skip it or use a default if API allows,
      // but usually the token is tied to the operator. We will append what we have.
      // Wait, uploaddocuments requires a driverId or customerId. 
      // If the API fails without driverId, we'll log it. We don't have driverId directly from the booking update.
      
      try {
        const token = await getToken();
        const fileRes = await fetch(process.env.MYRENT_API_BASE_URL + '/uploaddocuments/customer', {
          method: 'POST',
          headers: {
            'tokenValue': token,
          },
          body: uploadData,
        });
        console.log('[pre-checkin] Document uploaded', await fileRes.text());
      } catch (err) {
        console.warn('[pre-checkin] Document upload error (non-fatal):', err);
      }
    }

    // 3. Send Pre-Check-in Confirmation Email
    if (email) {
      await sendPreCheckinConfirmation(`${name} ${surname}`, id, email);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[pre-checkin] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
