// src/lib/apiClient.ts — MyRent Touroperator API Client (exact spec)

let cachedToken: string | null = null;
let tokenExpiry: number | null = null;

const BASE_URL = process.env.MYRENT_API_BASE_URL || 'https://afmotors.myrent.it/MyRentWeb/api/v1/touroperator';

// ── Authentication ──
// POST /authentication → { status, message, result: { tokenValue } }

async function authenticate(): Promise<string> {
  const payload = {
    UserId: process.env.MYRENT_USER_ID,
    Password: process.env.MYRENT_USER_PASSWORD,
    companyCode: process.env.MYRENT_COMPANY_CODE,
  };

  const res = await fetch(`${BASE_URL}/authentication`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Authentication failed (${res.status}): ${body}`);
  }

  const data = await res.json();

  // API returns { status: true, result: { tokenValue: "..." } }
  const token = data?.result?.tokenValue || data?.tokenValue || data?.token || data?.access_token;
  if (!token) throw new Error('Token missing from auth response: ' + JSON.stringify(data));

  cachedToken = token;
  tokenExpiry = Date.now() + 3540000; // 59 minutes
  return token;
}

// ── Generic fetcher with auto-auth ──

export async function getToken(): Promise<string> {
  if (!cachedToken || !tokenExpiry || Date.now() > tokenExpiry) {
    await authenticate();
  }
  return cachedToken!;
}

export async function fetchFromAPI(endpoint: string, options: RequestInit = {}) {
  const token = await getToken();
  const url = `${BASE_URL}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'tokenValue': token, // MyRent uses tokenValue header, NOT Bearer
      ...(options.headers || {}),
    },
    cache: 'no-store',
  });

  if (res.status === 401 || res.status === 403) {
    // Token expired → re-auth and retry once
    cachedToken = null;
    tokenExpiry = null;
    const newToken = await authenticate();
    const retryRes = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'tokenValue': newToken,
        ...(options.headers || {}),
      },
      cache: 'no-store',
    });
    if (!retryRes.ok) {
      const body = await retryRes.text();
      throw new Error(`API Error ${retryRes.status} on ${endpoint}: ${body}`);
    }
    return retryRes.json();
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API Error ${res.status} on ${endpoint}: ${body}`);
  }

  return res.json();
}

// ══════════════════════════════════════════
// Specific API methods matching the OpenAPI spec
// ══════════════════════════════════════════

/**
 * GET /locations
 * Returns array of locations with openings, lat/lng, type, etc.
 */
export async function getLocations() {
  return fetchFromAPI('/locations');
}

/**
 * POST /quotations
 * Main endpoint: returns available vehicles with pricing, optionals, images.
 * 
 * Request body:
 *   startDate, endDate (ISO datetime strings)
 *   pickupLocation, dropOffLocation (location codes)
 *   age (driver age, default 25)
 *   channel (e.g. "WEB001")
 *   showPics, showOptionalImage, showVehicleParameter, showVehicleExtraImage (booleans)
 *   agreementCoupon (optional discount coupon)
 *   isYoungDriverAge, isSeniorDriverAge (booleans)
 * 
 * Response:
 *   data.Vehicles[] — each with Status, Vehicle info, optionals[], TotalCharge
 */
export async function getQuotations(params: {
  startDate: string;
  endDate: string;
  pickupLocation: string;
  dropOffLocation: string;
  age?: number;
  channel?: string;
  agreementCoupon?: string;
  discountValueWithoutVat?: string;
  showBookingDiscount?: boolean;
  isYoungDriverAge?: boolean;
  isSeniorDriverAge?: boolean;
}) {
  const payload = {
    startDate: params.startDate,
    endDate: params.endDate,
    pickupLocation: params.pickupLocation,
    dropOffLocation: params.dropOffLocation,
    age: params.age || 25,
    channel: params.channel || 'WEB001',
    showPics: true,
    showOptionalImage: true,
    showVehicleParameter: true,
    showVehicleExtraImage: true,
    showBookingDiscount: params.showBookingDiscount ?? true,
    isYoungDriverAge: params.isYoungDriverAge ?? false,
    isSeniorDriverAge: params.isSeniorDriverAge ?? false,
    ...(params.agreementCoupon ? { agreementCoupon: params.agreementCoupon } : {}),
    ...(params.discountValueWithoutVat ? { discountValueWithoutVat: params.discountValueWithoutVat } : {}),
  };

  return fetchFromAPI('/quotations', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * GET /damages/{plateNumber}
 * Returns vehicle damages with wireframe image
 */
export async function getDamages(plateNumber: string, lang = 'en_GB') {
  return fetchFromAPI(`/damages/${plateNumber}`, {
    headers: { 'Accept-Language': lang } as Record<string, string>,
  });
}

// ══════════════════════════════════════════
// TypeScript interfaces for API responses
// ══════════════════════════════════════════

export interface MyRentLocation {
  locationCode: string;
  locationName: string;
  locationAddress: string;
  locationNumber: string;
  locationCity: string;
  locationType: number; // 1=pickup only, 2=dropoff only, 3=both
  telephoneNumber: string;
  cellNumber: string;
  email: string;
  latitude: number;
  longitude: number;
  isAirport: boolean;
  isRailway: boolean;
  country: string;
  zipCode: string;
  openings: { dayOfTheWeek: number; dayOfTheWeekName: string; startTime: string; endTime: string }[];
  closing: { dayOfTheWeek: number; dayOfTheWeekName: string; startTime: string; endTime: string }[];
  minimumLeadTimeInHour: number | null;
  locationInfoEN: string | null;
  locationInfoLocal: string | null;
}

export interface MyRentOptional {
  Charge: {
    Amount: number;
    CurrencyCode: string;
    Description: string;
    IncludedInEstTotalInd: boolean;
    IncludedInRate: boolean;
    TaxInclusive: boolean;
  };
  Equipment: {
    Description: string;
    EquipType: string;
    Quantity: number;
    isMultipliable: boolean;
    optionalImage: string | null;
  };
}

export interface MyRentVehicle {
  Status: 'Available' | 'Unavailable' | 'OnRequest';
  Reference: {
    ID: number;
    ID_Context: number;
    Type: number;
  };
  Vehicle: {
    vehicleGroupPic: string;
    VehMakeModel: { Name: string };
    Code: string;
    seats: number;
    VendorCarType: string;
    transmission: string | null;
    fuelType: string | null;
    CodeContext: string;
    macroClass: string;
    SelfService: boolean;
    VendorCarMacroGroup?: string;
    airCondition: boolean;
    groupPic: {
      id: number;
      nationalCode: string;
      internationalCode: string;
      description: string;
      isSelfService: boolean;
    };
    vehicleParameter: {
      'name :': string;
      'description :': string;
      'position :': number;
      'fileUrl :': string;
    }[];
    vehicleExtraImage: string[];
  };
  optionals: MyRentOptional[];
  TotalCharge: {
    EstimatedTotalAmount: number;
    RateTotalAmount: number;
  };
  youngDriverFee?: number;
  seniorDriverFee?: number;
  youngDriverFeeDesc?: string;
  seniorDriverFeeDesc?: string;
}

export interface MyRentQuotationResponse {
  data: {
    total: number;
    PickUpLocation: string;
    ReturnLocation: string;
    PickUpDateTime: string;
    ReturnDateTime: string;
    payNowDis?: number;
    Vehicles: MyRentVehicle[];
  };
}

// ══════════════════════════════════════════
// Priority 1 — Booking Flow API Methods
// ══════════════════════════════════════════

/**
 * GET /booking/config
 * Returns full booking configuration: UI toggles, default times,
 * display settings, filtering options, payment modes, etc.
 */
export async function getBookingConfig(): Promise<BookingConfig> {
  return fetchFromAPI('/booking/config');
}

/**
 * POST /getInsuranceList
 * Returns dynamic insurance/protection plans available for a given
 * group, reservation source, location, and date range.
 */
export async function getInsuranceList(params: {
  group: string;
  reservationSource?: string;
  locationCode: string;
  startDate: string;
  endDate: string;
}): Promise<InsuranceListResponse> {
  return fetchFromAPI('/getInsuranceList', {
    method: 'POST',
    body: JSON.stringify({
      group: params.group,
      reservationSource: params.reservationSource || 'WEB001',
      locationCode: params.locationCode,
      startDate: params.startDate,
      endDate: params.endDate,
    }),
  });
}

/**
 * POST /getInsuranceExtraList
 * Returns detailed insurance specifications with coverage descriptions.
 */
export async function getInsuranceExtraList(extras: { code: string; amount: string }[]): Promise<InsuranceListResponse> {
  return fetchFromAPI('/getInsuranceExtraList', {
    method: 'POST',
    body: JSON.stringify({ extras }),
  });
}

/**
 * GET /bookings/{bookingId}
 * Returns full reservation details by booking ID.
 * Requires `channel` header (defaults to "WEB001").
 */
export async function getBookingDetails(bookingId: string, channel = 'WEB001'): Promise<BookingDetailsResponse> {
  return fetchFromAPI(`/bookings/${encodeURIComponent(bookingId)}`, {
    headers: { channel } as Record<string, string>,
  });
}

/**
 * GET /bookings/{bookingId}/status
 * Returns the current status of a reservation.
 */
export async function getBookingStatus(bookingId: string): Promise<BookingStatusResponse> {
  return fetchFromAPI(`/bookings/${encodeURIComponent(bookingId)}/status`);
}

/**
 * GET /bookings/{bookingId}/cancel
 * Cancels a reservation by booking ID.
 * Requires `channel` header (defaults to "WEB001").
 */
export async function cancelBooking(bookingId: string, channel = 'WEB001'): Promise<CancelBookingResponse> {
  return fetchFromAPI(`/bookings/${encodeURIComponent(bookingId)}/cancel`, {
    headers: { channel } as Record<string, string>,
  });
}

/**
 * PUT /bookings/{bookingId}/updateStatus
 * Updates the reservation status to "confirmed".
 */
export async function updateBookingStatus(bookingId: string): Promise<{ id: string; status: string }> {
  return fetchFromAPI(`/bookings/${encodeURIComponent(bookingId)}/updateStatus`, {
    method: 'PUT',
    body: JSON.stringify({ id: bookingId }),
  });
}

/**
 * PUT /bookings/{bookingId}/updateData
 * Updates reservation properties (isPremium, isSelfService).
 */
export async function updateBookingData(
  bookingId: string,
  data: { isPremium?: boolean; isSelfService?: boolean }
): Promise<{ prefix: string; number: number; voucher: string; status: string }> {
  return fetchFromAPI(`/bookings/${encodeURIComponent(bookingId)}/updateData`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

/**
 * GET /getPrivacyAndTerms
 * Returns CDN URLs for Privacy Policy PDF, Terms & Conditions PDF,
 * and condition text.
 */
export async function getPrivacyAndTerms(language = 'en'): Promise<PrivacyTermsResponse> {
  return fetchFromAPI(`/getPrivacyAndTerms?language=${encodeURIComponent(language)}`);
}

/**
 * POST /{bookingId}/sendEmail
 * Sends a confirmation, refusal, or payment-failure email to the customer
 * with an attached PDF of the reservation invoice.
 */
export async function sendBookingEmail(
  bookingId: string,
  options: { onRequest?: boolean; refuse?: boolean; paymentFailure?: boolean }
): Promise<{ result: string; mailDetails: unknown[] }> {
  const body: Record<string, string> = {};
  if (options.onRequest !== undefined) body.onRequest = String(options.onRequest);
  if (options.refuse !== undefined) body.refuse = String(options.refuse);
  if (options.paymentFailure !== undefined) body.paymentFailure = String(options.paymentFailure);

  return fetchFromAPI(`/${encodeURIComponent(bookingId)}/sendEmail`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// ══════════════════════════════════════════
// TypeScript interfaces — Booking Flow
// ══════════════════════════════════════════

export interface BookingConfig {
  bookingTitle: string;
  websiteUrl: string;
  maxRentalDurationInDays: number | null;
  minLeadTimeInHours: number;
  minRentDays: number;
  minDaysDiscountTwoPrices: number | null;
  defaultCurrency: string;
  checkLocationVehicleAvailability: boolean;
  checkVehicleAvailability: boolean;
  googleAnalyticsCode: string;
  imagePath: string | null;
  defaultPupTime: string;
  defaultDoffTime: string;
  locationReturnEnable: boolean;
  noSabatoDomenica: boolean;
  viewGroupNotavailable: boolean;
  viewAlertGroupNotAvailable: boolean;
  flightNumber: boolean;
  noOneWayToAllLocation: boolean;
  textAreaPrivacyCondition1: boolean;
  textAreaPrivacyCondition2: boolean;
  downloadPrivacyCondition: boolean;
  useDefaultTime: boolean;
  twoPrices: boolean;
  customPayment: boolean;
  headerAndFooter: boolean;
  showWebCodeInput: boolean;
  showGroupDropDown: boolean;
  sortVehicleListByPrice: boolean;
  sortVehicleListByAvailability: boolean;
  enableFilterAvailUnAvail: boolean;
  enableFilterByFuel: boolean;
  enableFilterByType: boolean;
  enableFilterByMacro: boolean;
  enableFilterBySeat: boolean;
  showAmountInCurrency: boolean;
  showMultiCurrency: boolean;
  selfService: boolean;
  reservedArea: boolean;
  webCheckIn: boolean;
  booking: boolean;
  showPassportField: boolean;
  showLicenseField: boolean;
  showCity: boolean;
  showStreet: boolean;
  showZip: boolean;
  showCountry: boolean;
  sendCancelEmail: boolean;
  cancelEmailTo: string;
  showOutOfHourMsg: boolean;
  showPaymentBoxFirst: boolean;
  showCustomerDataFirst: boolean;
  allowBookingForOnRequestGroups: boolean;
  onrequestPayAmount: boolean;
  [key: string]: unknown; // Allow additional fields
}

export interface InsuranceSpec {
  id: number;
  Description: string;
}

export interface BookingInsurance {
  Id?: number;
  Description: string;
  isRecommended: boolean;
  Amount: string | number;
  bookingText?: Record<string, string>;
  Specification: string[];
}

export interface InsuranceListResponse {
  Specification: InsuranceSpec[];
  'Booking Insurance': BookingInsurance[];
}

export interface BookingDetailsResponse {
  data: BookingDetails;
}

export interface BookingDetails {
  id: string;
  Type?: number;
  Instance?: string;
  PickUpLocation: string;
  ReturnLocation: string;
  PickUpDateTime: string;
  ReturnDateTime: string;
  Fees?: {
    CurrencyCode: string;
    IncludedInEstTotalInd: boolean;
    Description: string;
    IncludedInRate: boolean;
    Amount: number;
    Purpose: number;
    TaxInclusive: boolean;
  };
  optionals?: {
    Charge: {
      Amount: number;
      CurrencyCode: string;
      Description: string;
      IncludedInEstTotalInd: boolean;
      IncludedInRate: boolean;
      TaxInclusive: boolean;
    };
    Equipment: {
      Description: string;
      EquipType: string;
      Quantity: number;
      isMultipliable: boolean;
      optionalImage: string | null;
    };
  }[];
  TotalCharge?: {
    EstimatedTotalAmount: number;
    RateTotalAmount: number;
  };
  vehicle?: {
    Code: string;
    CodeContext: string;
    VehMakeModel: { Name: string };
    VendorCarType: string;
    plate_no: string;
    brand: string;
    model: string;
    km: number;
    color: string;
  };
  LocationDetails?: {
    Address: {
      CityName: string;
      CountryName: string;
      PostalCode: string;
      StreetNmbr: string;
    };
    AtAirport: boolean;
    Code: string;
    CodeContext: string;
    Name: string;
    Telephone: string;
  }[];
  PaymentRole?: {
    Amount: string;
    CurrencyCode: string;
    DateTime: string;
    PaymentType: number;
    Percent: number;
    RuleType: number;
    content: string;
  }[];
  customer?: {
    clientId: string;
    Name: string;
    Surname: string;
    firstName: string;
    lastName: string;
    email: string;
    phNum1: string;
    taxCode: string;
    [key: string]: unknown;
  };
  Vendor?: string;
  RentalRate?: {
    CurrencyCode: string;
    TaxAmount: {
      CurrencyCode: string;
      Description: string;
      Percentage: number;
      Total: number;
    };
  };
  rentalDetails?: {
    customerName: string;
    startDate: string;
    endDate: string;
    pickUpLocation: string;
    dropOffLocation: string;
    totalRental: number;
  };
}

export interface BookingStatusResponse {
  id: string;
  status: string;
}

export interface CancelBookingResponse {
  CancelStatus: string;
  id: string;
}

export interface PrivacyTermsResponse {
  data: {
    privacyfileUrl: string;
    termsConditionFile: string;
    comditionText: string; // Note: typo is from the API
  };
  errorMessage: string;
  status: string;
}

// ══════════════════════════════════════════
// Priority 2 — Self-Service Operations
// ══════════════════════════════════════════

/**
 * POST /bookings/{bookingId}/checkout
 * Engages the vehicle and starts the rental.
 * Requires fuel level, odometer, and optionally a signature image.
 */
export async function checkoutBooking(
  bookingId: string,
  data: { fuel: number; odometer: number; signature_image?: string; signature_checksum?: string }
): Promise<CheckoutResponse> {
  return fetchFromAPI(`/bookings/${encodeURIComponent(bookingId)}/checkout`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * POST /bookings/{bookingId}/checkin
 * Returns the vehicle and closes the movement.
 * Requires fuel level, odometer, and optional note.
 */
export async function checkinBooking(
  bookingId: string,
  data: { fuel: number; odometer: number; note?: string }
): Promise<CheckinResponse> {
  return fetchFromAPI(`/bookings/${encodeURIComponent(bookingId)}/checkin`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

/**
 * GET /bookings/{bookingInfo}/driver
 * Returns driver details for a booking.
 */
export async function getBookingDriver(bookingId: string): Promise<{ driver: DriverData }> {
  return fetchFromAPI(`/bookings/${encodeURIComponent(bookingId)}/driver`);
}

/**
 * POST /bookings/{bookingId}/driver
 * Updates or sets driver details for a booking.
 */
export async function updateBookingDriver(
  bookingId: string,
  driver: Partial<DriverData>
): Promise<DriverUpdateResponse> {
  return fetchFromAPI(`/bookings/${encodeURIComponent(bookingId)}/driver`, {
    method: 'POST',
    body: JSON.stringify(driver),
  });
}

/**
 * GET /bookings/{bookingId}/vehicle
 * Returns vehicle details assigned to a booking (plate, brand, model, VIN, damages).
 */
export async function getBookingVehicle(bookingId: string): Promise<BookingVehicleResponse> {
  return fetchFromAPI(`/bookings/${encodeURIComponent(bookingId)}/vehicle`);
}

/**
 * POST /uploaddocuments/driver
 * Uploads a driver document (multipart form: file + driverId).
 * Note: This uses multipart/form-data, so we skip the default JSON content-type.
 */
export async function uploadDriverDocument(driverId: number, file: Blob, fileName: string): Promise<DocumentUploadResponse> {
  const token = await getToken();
  const formData = new FormData();
  formData.append('file', file, fileName);
  formData.append('driverId', String(driverId));

  const res = await fetch(`${BASE_URL}/uploaddocuments/driver`, {
    method: 'POST',
    headers: { tokenValue: token },
    body: formData,
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Upload driver doc failed (${res.status}): ${body}`);
  }
  return res.json();
}

/**
 * POST /uploaddocuments/customer
 * Uploads a customer document (multipart form: file + customerId).
 */
export async function uploadCustomerDocument(customerId: number, file: Blob, fileName: string): Promise<DocumentUploadResponse> {
  const token = await getToken();
  const formData = new FormData();
  formData.append('file', file, fileName);
  formData.append('customerId', String(customerId));

  const res = await fetch(`${BASE_URL}/uploaddocuments/customer`, {
    method: 'POST',
    headers: { tokenValue: token },
    body: formData,
    cache: 'no-store',
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Upload customer doc failed (${res.status}): ${body}`);
  }
  return res.json();
}

// ══════════════════════════════════════════
// TypeScript interfaces — Self-Service
// ══════════════════════════════════════════

export interface CheckoutResponse {
  rentalPrefix: string;
  rentalNumber: string;
  rentalStatus: string; // e.g. "ONGOING"
  startDate: string;
  rentalId: number;
  vehicleStatus: string; // e.g. "ENGAGED"
}

export interface CheckinResponse {
  status: string;
  id: string;
}

export interface DriverData {
  id: number;
  isPhysicalPerson: boolean;
  isClient: boolean;
  isDriver: boolean;
  name: string;
  surname: string;
  birthNation: string;
  birthPlace: string;
  birthProv: string;
  gender: boolean;
  birthDate: string;
  phoneNumb1: string;
  phoneNumb2: string | null;
  taxCode: string;
  companyName: string | null;
  document: string;
  releaseDate: string;
  expiryDate: string;
  documentNumb: string;
  drivingLicense: string;
  document1?: string;
  releaseDate1?: string;
  expiryDate1?: string;
  documentNumb1?: string;
  issueBy: string;
  issueBy1?: string;
  email: string;
  street: string;
  number: number | string;
  postalCode: string;
  national: string;
  province: string;
  city: string;
  clientId?: string | number;
}

export interface DriverUpdateResponse {
  data: {
    id: string;
    driver: string;
    status: string;
  };
}

export interface BookingVehicleResponse {
  id: number;
  location: string;
  description: string;
  national_code: string;
  international_code: string;
  plate_no: string;
  brand: string;
  model: string;
  version: string;
  chasis_no: string;
  park: string;
  fuel_type: string;
  engine_size: number;
  level: number;
  tankCapacity: number;
  km: number;
  color: string;
  seats: number;
  carwash: boolean;
  isBulkhead: boolean;
  isPower: boolean;
  isSuitable: boolean;
  car_class: string;
  companyName: string;
  damages: {
    description: string;
    damageType: string | null;
    damageDictionary: string;
    x: number;
    y: number;
    percentage_x: number;
    percentage_y: number;
  }[];
  wireframeImage: {
    image: string;
    height: number;
    width: number;
  } | null;
}

export interface DocumentUploadResponse {
  id: number;
  status: string;
  msg: string;
}

// ══════════════════════════════════════════
// Booking Creation — POST /quotations (dual-purpose endpoint)
// When called with Customer + VehicleCode + optionals + VehicleRequest
// it CREATES a reservation (not just fetches rates).
// ══════════════════════════════════════════

export interface BookingCustomer {
  Name: string;
  Surname: string;
  clientId?: string;
  ragioneSociale?: string | null;
  codice?: string | null;
  street?: string;
  num?: string;
  city?: string;
  zip?: string;
  country?: string;
  state?: string;
  phNum1?: string;
  phNum2?: string | null;
  mobileNumber?: string;
  email?: string | null;
  vatNumber?: string | null;
  birthPlace?: string;
  birthDate?: string;
  birthProvince?: string;
  birthNation?: string;
  gender?: boolean;
  taxCode?: string;
  document?: string;
  documentNumber?: string;
  licenceType?: string;
  issueBy?: string;
  releaseDate?: string;
  expiryDate?: string;
  eInvoiceEmail?: string;
  eInvoiceCode?: string;
}

export interface BookingOptional {
  EquipType: string;
  Quantity: string;
  Selected: boolean;
  Prepaid: boolean;
}

export interface BookingVehicleRequest {
  PaymentTransactionTypeCode: string;
  PaymentType: string;
  type: string;
  PaymentAmount: number;
  VoucherNumber?: string;
}

export interface BookingCreationPayload {
  startDate: string;
  endDate: string;
  pickupLocation: string;
  dropOffLocation: string;
  flightNumber?: string;
  Customer: BookingCustomer;
  VehicleCode: string;
  optionals?: BookingOptional[];
  Fee?: { Amount: string; CurrencyCode: string; Description: string };
  VehicleRequest: BookingVehicleRequest;
  channel: string;
  onlineUser?: number;
  insuranceId?: number;
  agreementCoupon?: string;
  discountValueWithoutVat?: string;
  PayNowDis?: string;
  isYoungDriverAge?: boolean;
  isSeniorDriverAge?: boolean;
  noFeeAge?: boolean;
  TransactionStatusCode?: string;
}

/**
 * POST /quotations (with full booking payload)
 * Creates a reservation in MyRent. This is the SAME endpoint as getQuotations
 * but with a complete payload that includes Customer, VehicleCode, optionals,
 * VehicleRequest (payment), channel, and optionally onlineUser.
 * 
 * Response: BookingResponse schema — contains the created reservation data.
 */
export async function createBooking(payload: BookingCreationPayload) {
  console.log('[apiClient] createBooking payload:', JSON.stringify(payload).substring(0, 500));
  return fetchFromAPI('/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

