import { NextResponse } from 'next/server';
import { getQuotations, type MyRentQuotationResponse, type MyRentVehicle, type MyRentOptional } from '@/lib/apiClient';
import { vehicles as localVehicles } from '@/lib/vehicles';

/**
 * Mapping from MyRent group names → local vehicle catalog.
 * Maps exactly to the groups configured in the MyRent system.
 * Any changes to groups should be made in MyRent first, then reflected here.
 */
const GROUP_TO_VEHICLES: Record<string, string[]> = {
  'UTILITARIE':    ['fiat-panda'],
  'UTILITARIA':    ['fiat-panda'],
  'MEDIA':         ['hyundai-i20'],
  'COMPATTA':      ['hyundai-bayon', 'fiat-tipo', 'peugeot-208'],
  'COMPACT':       ['hyundai-bayon', 'fiat-tipo', 'peugeot-208'],
  'MINI SUV':      ['jeep-avenger'],
  'SUV':           ['jeep-compass', 'hyundai-tucson'],
  'SUV ATM':       ['hyundai-tucson-at', 'hyundai-kona-ev', 'hyundai-kona-hybrid'],
  'SUV AUT':       ['hyundai-tucson-at', 'hyundai-kona-ev', 'hyundai-kona-hybrid'],
  'STATION WAGON': ['byd-dolphin', 'opel-frontera', 'jeep-renegade'],
  'CABRIO':        ['opel-corsa'],
};

function findLocalVehicles(groupName: string): typeof localVehicles {
  // Exact match
  const upper = groupName.toUpperCase().trim();
  const ids = GROUP_TO_VEHICLES[upper];
  if (ids) {
    return ids.map(id => localVehicles.find(v => v.id === id)).filter(Boolean) as typeof localVehicles;
  }
  // Partial match
  for (const [key, vehicleIds] of Object.entries(GROUP_TO_VEHICLES)) {
    if (upper.includes(key) || key.includes(upper)) {
      return vehicleIds.map(id => localVehicles.find(v => v.id === id)).filter(Boolean) as typeof localVehicles;
    }
  }
  return [];
}

export async function POST(request: Request) {
  const body = await request.json();
  const {
    pickupDate,
    dropoffDate,
    pickupLocation = 'CAG',
    dropOffLocation,
    age = 25,
    coupon,
  } = body;

  if (!pickupDate || !dropoffDate) {
    return NextResponse.json({ error: 'pickupDate and dropoffDate required' }, { status: 400 });
  }

  const start = new Date(pickupDate);
  const end = new Date(dropoffDate);
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  try {
    const apiResponse: MyRentQuotationResponse = await getQuotations({
      startDate: pickupDate,
      endDate: dropoffDate,
      pickupLocation: pickupLocation,
      dropOffLocation: dropOffLocation || pickupLocation,
      age,
      agreementCoupon: coupon || undefined,
    });

    const apiData = apiResponse.data || apiResponse;

    // ── Detect API-level errors (HTTP 200 but error in body) ──
    // MyRent sometimes returns { status: "error", data: { errors: { Error: { Code: 366, ... } } } }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiResponseAny = apiResponse as any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiDataAny = apiData as any;
    if (apiResponseAny.status === 'error' || apiDataAny?.errors) {
      const errInfo = apiDataAny?.errors?.Error || apiDataAny?.errors;
      console.warn('[MyRent API] API returned error in body:', JSON.stringify(errInfo));
      throw new Error(`MyRent API error: ${errInfo?.ShortText || errInfo?.Code || 'Unknown error'}`);
    }

    // Log raw API response shape for debugging
    console.log('[MyRent API] RAW apiResponse keys:', Object.keys(apiResponse));
    console.log('[MyRent API] RAW apiData keys:', Object.keys(apiData));
    console.log('[MyRent API] RAW apiData.total:', apiData.total);
    console.log('[MyRent API] RAW apiData.Vehicles?:', Array.isArray(apiData.Vehicles), 'length:', apiData.Vehicles?.length);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const apiDataDebug = apiData as any;
    console.log('[MyRent API] RAW apiData.vehicles?:', Array.isArray(apiDataDebug.vehicles), 'length:', apiDataDebug.vehicles?.length);
    console.log('[MyRent API] RAW response stringified (first 2000 chars):', JSON.stringify(apiResponse).substring(0, 2000));

    // Log raw API response for debugging
    // Deep-log raw API shape for debugging
    const rawVehicles = apiData.Vehicles || apiDataAny.vehicles || [];
    if (rawVehicles.length > 0) {
      const sample = rawVehicles[0];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sampleAny = sample as any;
      console.log('[MyRent API] RAW first vehicle keys:', Object.keys(sample));
      console.log('[MyRent API] RAW optionals key check:', 'optionals' in sample, 'Optionals' in sampleAny, 'PricedEquips' in sampleAny);
      const opts = sample.optionals || sampleAny.Optionals || sampleAny.PricedEquips || [];
      console.log('[MyRent API] RAW first vehicle optionals count:', opts.length);
      if (opts.length > 0) {
        console.log('[MyRent API] RAW first optional keys:', Object.keys(opts[0]));
        console.log('[MyRent API] RAW first optional:', JSON.stringify(opts[0]).substring(0, 500));
      }
      console.log('[MyRent API] RAW first vehicle:', JSON.stringify(sample).substring(0, 1000));
    }

    console.log('[MyRent API] Response total:', apiData.total,
      'vehicles:', rawVehicles.map((v: MyRentVehicle) => ({
        name: v.Vehicle?.VehMakeModel?.Name,
        status: v.Status,
        rate: v.TotalCharge?.RateTotalAmount,
        daily: v.Reference?.ID_Context,
        optionalsCount: (v.optionals || []).length,
      }))
    );

    // Expand API vehicle GROUPS into individual local cars
    const vehicles: ReturnType<typeof expandGroup>[] = [];

    for (const apiGroup of rawVehicles) {
      const groupName = apiGroup.Vehicle?.VehMakeModel?.Name || '';
      const localMatches = findLocalVehicles(groupName);

      // Optionals — handle multiple possible key names from MyRent API
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apiGroupAny = apiGroup as any;
      const rawOptionals: MyRentOptional[] = apiGroup.optionals 
        || apiGroupAny.Optionals
        || apiGroupAny.PricedEquips
        || [];
      
      const includedOpts = rawOptionals.filter(o => o?.Charge?.IncludedInRate === true);
      const purchasableOpts = rawOptionals.filter(o => o?.Charge?.IncludedInRate !== true);

      const apiRate = apiGroup.TotalCharge?.RateTotalAmount || 0;

      if (localMatches.length > 0) {
        // Map to individual local cars with API pricing & optionals
        for (const local of localMatches) {
          vehicles.push(expandGroup(apiGroup, local, days, apiRate, includedOpts, purchasableOpts));
        }
      } else {
        // No local match — show the API group as-is with basic info
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const noMatchApiAny = apiGroup as any;
        const dmgAccess = noMatchApiAny.Vehicle?.damageAccessAmount || 1500;
        vehicles.push({
          id: apiGroup.Vehicle?.Code || groupName.toLowerCase().replace(/\s+/g, '-'),
          groupId: apiGroup.Vehicle?.groupPic?.id || 0,
          quotationRefId: apiGroup.Reference?.ID || 0,
          status: apiGroup.Status,
          name: apiGroupAny.Vehicle?.groupWebDescription || groupName,
          brand: '',
          vendorType: apiGroup.Vehicle?.VendorCarType || '',
          sipp: apiGroup.Vehicle?.Code || '',
          category: apiGroup.Vehicle?.groupPic?.description || apiGroup.Vehicle?.macroClass || groupName,
          macroClass: apiGroup.Vehicle?.macroClass || '',
          seats: apiGroup.Vehicle?.seats || 5,
          airCondition: apiGroup.Vehicle?.airCondition || false,
          transmission: apiGroup.Vehicle?.transmission ?? '',
          fuelType: apiGroup.Vehicle?.fuelType ?? '',
          imageUrl: apiGroup.Vehicle?.vehicleGroupPic || '',
          rateTotalAmount: apiRate,
          dailyRate: apiRate > 0 ? Math.round(apiRate / days * 100) / 100 : 0,
          youngDriverFee: apiGroup.youngDriverFee || 0,
          seniorDriverFee: apiGroup.seniorDriverFee || 0,
          youngDriverFeeDesc: apiGroup.youngDriverFeeDesc || '',
          seniorDriverFeeDesc: apiGroup.seniorDriverFeeDesc || '',
          damageAccess: dmgAccess,
          theftAccess: noMatchApiAny.Vehicle?.theftAccessAmount || 1500,
          deposit: dmgAccess,
          depositWithTopProtection: 100,
          includedOptionals: includedOpts.length > 0 ? includedOpts.map(formatOptional) : [
            { equipType: 'RCA', description: 'Assicurazione RCA / RCA Insurance', amount: 0, image: null },
            { equipType: 'KM', description: 'Chilometraggio illimitato / Unlimited Mileage', amount: 0, image: null },
          ],
          purchasableOptionals: purchasableOpts.length > 0 ? purchasableOpts.map(formatPurchasableOptional) : [
            { equipType: 'TOP', description: `Top Protection (deposit €100 instead of €${dmgAccess})`, amount: 42 * days, currency: 'EUR', taxInclusive: true, isMultipliable: false, image: null, quantity: 0 },
            { equipType: 'BBS', description: 'Baby Seat / Seggiolino (0-13 kg)', amount: 8 * days, currency: 'EUR', taxInclusive: true, isMultipliable: true, image: null, quantity: 0 },
            { equipType: 'CLS', description: 'Child Seat / Seggiolino (9-36 kg)', amount: 8 * days, currency: 'EUR', taxInclusive: true, isMultipliable: true, image: null, quantity: 0 },
          ],
        });
      }
    }

    return NextResponse.json({
      source: 'api',
      total: vehicles.length,
      pickupLocation: apiData.PickUpLocation,
      returnLocation: apiData.ReturnLocation,
      pickupDateTime: apiData.PickUpDateTime,
      returnDateTime: apiData.ReturnDateTime,
      payNowDiscount: apiData.payNowDis || 0,
      days,
      vehicles,
    });
  } catch (error) {
    console.error('[MyRent API] Quotations fetch error:', error);

    // Instead of falling back to local vehicles and showing them as available,
    // we return a clear error so the frontend can display an error message.
    return NextResponse.json(
      { error: 'Errore di connessione con il gestionale', details: String(error) },
      { status: 500 }
    );
  }
}

// ── Helper: expand an API group into one local vehicle result ──

function expandGroup(
  apiGroup: MyRentVehicle,
  local: (typeof localVehicles)[number],
  days: number,
  apiRate: number,
  includedOpts: MyRentVehicle['optionals'],
  purchasableOpts: MyRentVehicle['optionals'],
) {
  // All pricing comes from the API — local.price is 0 (no hardcoded prices)
  const totalAmount = apiRate;
  const daily = apiRate > 0 ? Math.round((apiRate / days) * 100) / 100 : 0;

  // If API returned no optionals, inject our local extras catalog
  // AF Motors' MyRent configuration may not expose extras via API
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const apiGroupAny = apiGroup as any;
  const damageAccess = apiGroupAny.Vehicle?.damageAccessAmount || 1500;
  const theftAccess = apiGroupAny.Vehicle?.theftAccessAmount || 1500;

  const localIncluded = [
    { equipType: 'RCA', description: 'Assicurazione RCA / RCA Insurance', amount: 0, image: null },
    { equipType: 'KM', description: 'Chilometraggio illimitato / Unlimited Mileage', amount: 0, image: null },
    { equipType: 'ASSIST', description: 'Assistenza stradale 24/7 / 24/7 Roadside Assistance', amount: 0, image: null },
  ];

  const localPurchasable = [
    {
      equipType: 'TOP',
      description: `Top Protection — Franchigia Zero / Zero Excess (deposit €100 instead of €${damageAccess})`,
      amount: 42 * days,
      currency: 'EUR',
      taxInclusive: true,
      isMultipliable: false,
      image: null,
      quantity: 0,
    },
    {
      equipType: 'NAV',
      description: 'GPS Navigation / Navigatore GPS',
      amount: 5 * days,
      currency: 'EUR',
      taxInclusive: true,
      isMultipliable: false,
      image: null,
      quantity: 0,
    },
    {
      equipType: 'BBS',
      description: 'Baby Seat / Seggiolino Neonato (0-13 kg)',
      amount: 8 * days,
      currency: 'EUR',
      taxInclusive: true,
      isMultipliable: true,
      image: null,
      quantity: 0,
    },
    {
      equipType: 'CLS',
      description: 'Child Seat / Seggiolino Bambino (9-36 kg)',
      amount: 8 * days,
      currency: 'EUR',
      taxInclusive: true,
      isMultipliable: true,
      image: null,
      quantity: 0,
    },
    {
      equipType: 'BST',
      description: 'Booster Seat / Rialzo (15-36 kg)',
      amount: 5 * days,
      currency: 'EUR',
      taxInclusive: true,
      isMultipliable: true,
      image: null,
      quantity: 0,
    },
    {
      equipType: 'DRV2',
      description: 'Additional Driver / Conducente Aggiuntivo',
      amount: 5 * days,
      currency: 'EUR',
      taxInclusive: true,
      isMultipliable: false,
      image: null,
      quantity: 0,
    },
  ];

  // Use API optionals if available, otherwise fall back to local catalog
  const finalIncluded = includedOpts.length > 0 
    ? includedOpts.map(formatOptional) 
    : localIncluded;
  const finalPurchasable = purchasableOpts.length > 0 
    ? purchasableOpts.map(formatPurchasableOptional) 
    : localPurchasable;

  return {
    id: local.id,
    groupId: apiGroup.Vehicle?.groupPic?.id || 0,
    quotationRefId: apiGroup.Reference?.ID || 0,
    status: apiGroup.Status,
    name: local.name,
    brand: local.brand,
    vendorType: apiGroup.Vehicle?.VendorCarType || '',
    sipp: apiGroup.Vehicle?.Code || '',
    category: local.category,
    macroClass: apiGroup.Vehicle?.macroClass || local.category,
    seats: local.seats,
    airCondition: true,
    transmission: local.transmission,
    fuelType: local.fuel,
    imageUrl: local.imageUrl,
    rateTotalAmount: totalAmount,
    dailyRate: daily,
    youngDriverFee: apiGroup.youngDriverFee || 0,
    seniorDriverFee: apiGroup.seniorDriverFee || 0,
    youngDriverFeeDesc: apiGroup.youngDriverFeeDesc || '',
    seniorDriverFeeDesc: apiGroup.seniorDriverFeeDesc || '',
    damageAccess,
    theftAccess,
    deposit: damageAccess, // base deposit without Top Protection
    depositWithTopProtection: 100,
    includedOptionals: finalIncluded,
    purchasableOptionals: finalPurchasable,
  };
}

function formatOptional(o: MyRentVehicle['optionals'][number]) {
  return {
    equipType: o.Equipment.EquipType,
    description: o.Charge.Description,
    amount: o.Charge.Amount,
    image: o.Equipment.optionalImage,
  };
}

function formatPurchasableOptional(o: MyRentVehicle['optionals'][number]) {
  return {
    equipType: o.Equipment.EquipType,
    description: o.Charge.Description,
    amount: o.Charge.Amount,
    currency: o.Charge.CurrencyCode,
    taxInclusive: o.Charge.TaxInclusive,
    isMultipliable: o.Equipment.isMultipliable,
    image: o.Equipment.optionalImage,
    quantity: 0,
  };
}
