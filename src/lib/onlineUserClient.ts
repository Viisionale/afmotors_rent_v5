// src/lib/onlineUserClient.ts — MyRent Online User API Client
// Uses the same base domain but different endpoints for end-user auth

const WEB_BASE = (process.env.MYRENT_API_BASE_URL || 'https://afmotors.myrent.it/MyRentWeb')
  .replace(/\/api\/v1\/touroperator\/?$/, '');

// ── User Registration (v2) ──
export async function registerUser(email: string, password: string) {
  const res = await fetch(`${WEB_BASE}/api/v2/onlineUser/registerBookingUser`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      onlineUserType: 'Company',
      onlineUserRole: 'Operator',
      onlineUserStatus: 'active',
    }),
    cache: 'no-store',
  });

  const data = await res.json();
  // Expected: { status: true, id: "44", authToken: "..." }
  if (!data.status && data.status !== true && data.status !== 'success') {
    throw new Error(data.msg || data.message || 'Registration failed');
  }
  return {
    onlineUserId: parseInt(data.id, 10),
    authToken: data.authToken,
  };
}

// ── User Login (v2) ──
export async function loginUser(email: string, password: string) {
  const res = await fetch(`${WEB_BASE}/api/v2/onlineUser/onlineUserAuthentication`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    cache: 'no-store',
  });

  const data = await res.json();
  // Expected: { status: "success", msg: "Login Successful....", onlineUserId: 44, authToken: "..." }
  if (data.status !== 'success' && data.status !== true) {
    throw new Error(data.msg || data.message || 'Invalid credentials');
  }
  return {
    onlineUserId: data.onlineUserId,
    authToken: data.authToken,
  };
}

// ── Generic fetcher with user auth token ──
async function fetchUserAPI(endpoint: string, authToken: string, options: RequestInit = {}) {
  const url = `${WEB_BASE}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'tokenValue': authToken,
      ...(options.headers || {}),
    },
    cache: 'no-store',
  });

  const bodyText = await res.text();
  console.log(`[OnlineUserAPI] ${options.method || 'GET'} ${endpoint} → ${res.status}:`, bodyText.substring(0, 500));

  if (!res.ok) {
    throw new Error(`API Error ${res.status} on ${endpoint}: ${bodyText}`);
  }

  try {
    return JSON.parse(bodyText);
  } catch {
    // Some endpoints return non-JSON on success
    return { raw: bodyText };
  }
}

// ── Get User Profile ──
export async function getUserProfile(onlineUserId: number, authToken: string) {
  return fetchUserAPI(`/api/v1/onlineUser/${onlineUserId}`, authToken);
}

// ── Update User Profile ──
export async function updateUserProfile(
  onlineUserId: number,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
    password?: string;
  },
  authToken: string
) {
  return fetchUserAPI(`/api/v1/onlineUser/${onlineUserId}`, authToken, {
    method: 'PUT',
    body: JSON.stringify({
      ...data,
      userType: 1,
      userRole: 2,
      userStatus: 1,
    }),
  });
}

// ── Get User Reservations (via onlineUser endpoint) ──
export async function getUserReservations(
  onlineUserId: number,
  authToken: string,
  params?: { max?: number; offset?: number; order?: string; fromDate?: string; toDate?: string }
) {
  const query = new URLSearchParams();
  if (params?.max) query.set('max', String(params.max));
  if (params?.offset) query.set('offset', String(params.offset));
  if (params?.order) query.set('order', params.order);
  if (params?.fromDate) query.set('fromDate', params.fromDate);
  if (params?.toDate) query.set('toDate', params.toDate);
  query.set('showVehicleImage', 'true');
  const qs = query.toString();
  return fetchUserAPI(`/api/v1/onlineUser/${onlineUserId}/reservation${qs ? `?${qs}` : ''}`, authToken);
}

// ── Get User Quotations ──
export async function getUserQuotations(onlineUserId: number, authToken: string) {
  return fetchUserAPI(`/api/v1/onlineUser/${onlineUserId}/quotation`, authToken);
}

// ── Get User Rentals ──
export async function getUserRentals(onlineUserId: number, authToken: string) {
  return fetchUserAPI(`/api/v1/onlineUser/${onlineUserId}/rental`, authToken);
}

// ── Get Customer List ──
export async function getCustomerList(onlineUserId: number, authToken: string) {
  return fetchUserAPI(`/api/v1/onlineUser/${onlineUserId}/customer`, authToken);
}

// ── Get Customer Reservations ──
export async function getCustomerReservations(
  onlineUserId: number,
  customerId: number,
  authToken: string
) {
  return fetchUserAPI(
    `/api/v1/onlineUser/${onlineUserId}/customer/${customerId}/reservation`,
    authToken
  );
}

// ── Get Customer Quotations ──
export async function getCustomerQuotations(
  onlineUserId: number,
  customerId: number,
  authToken: string
) {
  return fetchUserAPI(
    `/api/v1/onlineUser/${onlineUserId}/customer/${customerId}/quotation`,
    authToken
  );
}

// ── Create Reservation from Quotation ──
export async function createReservationFromQuotation(
  onlineUserId: number,
  customerId: number,
  quotationId: number,
  authToken: string
) {
  return fetchUserAPI(
    `/api/v1/onlineUser/${onlineUserId}/customer/${customerId}/quotation/${quotationId}/createReservation`,
    authToken,
    { method: 'POST' }
  );
}

// ── Search Online User by Email ──
export async function searchUserByEmail(email: string, authToken: string) {
  return fetchUserAPI(`/api/v1/onlineUser/search?email=${encodeURIComponent(email)}`, authToken);
}

// ── Create Customer under an OnlineUser ──
export async function createCustomer(
  onlineUserId: number,
  customerData: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    birthDate?: string;
    licenceNumber?: string;
    licenceExpiryDate?: string;
    nationality?: string;
    address?: string;
    zipCode?: string;
    city?: string;
    country?: string;
  },
  authToken: string
) {
  // MyRent uses 'name'/'surname' NOT 'firstName'/'lastName'
  // Also requires isPhysicalPerson, isClient, isDriver booleans
  return fetchUserAPI(
    `/api/v1/onlineUser/${onlineUserId}/customer`,
    authToken,
    {
      method: 'POST',
      body: JSON.stringify({
        name: customerData.firstName,
        surname: customerData.lastName,
        email: customerData.email,
        phoneNumb1: customerData.phoneNumber || '',
        birthDate: customerData.birthDate || null,
        drivingLicense: customerData.licenceNumber || null,
        expiryDate: customerData.licenceExpiryDate || null,
        national: customerData.nationality || customerData.country || 'ITALIA',
        street: customerData.address || '',
        postalCode: customerData.zipCode || '',
        city: customerData.city || '',
        isPhysicalPerson: 'true',
        isIndividualCompany: 'false',
        isClient: true,
        isDriver: true,
      }),
    }
  );
}

// ── Create Quotation for a Customer ──
// Uses MyRent's internal Italian field names from the quotation object schema
export async function createCustomerQuotation(
  onlineUserId: number,
  customerId: number,
  quotationData: {
    pickUpDate: string;
    dropOffDate: string;
    pickUpLocationCode: string;
    dropOffLocationCode: string;
    vehicleGroupCode?: string;
  },
  authToken: string
) {
  // Build the body matching MyRent's quotation object structure
  // Fields: inizio, fine, sediByIdSedeUscita, sediByIdSedeRientroPrevisto, gruppi
  const body: Record<string, unknown> = {
    inizio: quotationData.pickUpDate,
    fine: quotationData.dropOffDate,
    sediByIdSedeUscita: { location: quotationData.pickUpLocationCode },
    sediByIdSedeRientroPrevisto: { location: quotationData.dropOffLocationCode },
  };
  if (quotationData.vehicleGroupCode) {
    body.gruppi = { group: quotationData.vehicleGroupCode };
  }

  console.log('[onlineUserClient] createQuotation body:', JSON.stringify(body));

  return fetchUserAPI(
    `/api/v1/onlineUser/${onlineUserId}/customer/${customerId}/quotation`,
    authToken,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );
}
