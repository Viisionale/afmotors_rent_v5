import React from 'react';
import {getTranslations} from 'next-intl/server';
import CheckoutForm from '@/components/CheckoutForm';

export default async function CheckoutPage({
  searchParams,
  params,
}: {
  searchParams: Promise<{
    vehicleId?: string;
    pickupDate?: string;
    dropoffDate?: string;
    pickupLocation?: string;
    dropOffLocation?: string;
  }>;
  params: Promise<{ locale: string }>;
}) {
  const { vehicleId, pickupDate, dropoffDate, pickupLocation = 'CAG', dropOffLocation } = await searchParams;
  const { locale } = await params;
  const t = await getTranslations('Checkout');
  const isIt = locale === 'it';

  if (!vehicleId || !pickupDate || !dropoffDate) {
    return (
      <div style={{ padding: '6rem 2rem', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
        <h2 style={{ marginBottom: '1rem' }}>{isIt ? 'Dati mancanti' : 'Missing Information'}</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
          {isIt
            ? 'Per procedere con la prenotazione, seleziona prima le date di ritiro e riconsegna dal veicolo scelto.'
            : 'To proceed with booking, first select pickup and return dates from your chosen vehicle.'}
        </p>
      </div>
    );
  }

  return (
    <main>
      <div className="page-hero">
        <h1>{t('title')}</h1>
      </div>
      <CheckoutForm
        vehicleId={vehicleId}
        pickupDate={pickupDate}
        dropoffDate={dropoffDate}
        pickupLocation={pickupLocation}
        dropOffLocation={dropOffLocation || pickupLocation}
        locale={locale}
      />
    </main>
  );
}
