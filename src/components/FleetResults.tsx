"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import {useTranslations, useLocale} from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './FleetResults.module.css';

interface ApiVehicle {
  id: string;
  groupId: number;
  status: string;
  name: string;
  brand: string;
  vendorType: string;
  sipp: string;
  category: string;
  macroClass: string;
  seats: number;
  airCondition: boolean;
  transmission: string | null;
  fuelType: string | null;
  imageUrl: string;
  parameters: Record<string, string>;
  rateTotalAmount: number;
  dailyRate: number;
  youngDriverFee: number;
  seniorDriverFee: number;
  youngDriverFeeDesc: string;
  seniorDriverFeeDesc: string;
  includedOptionals: { equipType: string; description: string; amount: number; image: string | null }[];
  purchasableOptionals: { equipType: string; description: string; amount: number; image: string | null; isMultipliable: boolean }[];
}

/**
 * Generate simulated dates for a 1-day rental to get daily pricing.
 * Pickup: today+2 at 10:00, Return: today+3 at 10:00
 */
function getSimulatedDates() {
  const now = new Date();
  const pickup = new Date(now);
  pickup.setDate(pickup.getDate() + 2);
  pickup.setHours(10, 0, 0, 0);

  const dropoff = new Date(now);
  dropoff.setDate(dropoff.getDate() + 3);
  dropoff.setHours(10, 0, 0, 0);

  const fmt = (d: Date) => d.toISOString().slice(0, 19); // YYYY-MM-DDTHH:mm:ss
  return { pickupDate: fmt(pickup), dropoffDate: fmt(dropoff) };
}

export default function FleetResults() {
  const searchParams = useSearchParams();
  const t = useTranslations('Fleet');
  const locale = useLocale();
  const isIt = locale === 'it';
  const router = useRouter();

  const userPickupDate = searchParams.get('pickupDate');
  const userDropoffDate = searchParams.get('dropoffDate');
  const pickupLocation = searchParams.get('pickupLocation') || 'AF-Apt';
  const dropOffLocation = searchParams.get('dropOffLocation') || pickupLocation;
  const hasUserDates = !!userPickupDate && !!userDropoffDate;

  // Memoize simulated dates so they don't change on re-render
  const simDates = useMemo(() => getSimulatedDates(), []);

  // Effective dates: user dates if provided, otherwise simulated 1-day dates
  const effectivePickup = hasUserDates ? userPickupDate! : simDates.pickupDate;
  const effectiveDropoff = hasUserDates ? userDropoffDate! : simDates.dropoffDate;

  const [vehicles, setVehicles] = useState<ApiVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [isSimulated, setIsSimulated] = useState(!hasUserDates);

  // Calculate days for display
  const days = useMemo(() => {
    const start = new Date(effectivePickup);
    const end = new Date(effectiveDropoff);
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  }, [effectivePickup, effectiveDropoff]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setIsSimulated(!hasUserDates);

    fetch('/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pickupDate: effectivePickup,
        dropoffDate: effectiveDropoff,
        pickupLocation,
        dropOffLocation,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        }
        setVehicles(data.vehicles || []);
        setTotal(data.total || 0);
      })
      .catch(err => {
        console.error('Quotation fetch failed:', err);
        setError(isIt ? 'Errore nel caricamento dei veicoli.' : 'Error loading vehicles.');
      })
      .finally(() => setLoading(false));
  }, [effectivePickup, effectiveDropoff, pickupLocation, dropOffLocation, hasUserDates, isIt]);

  const handleBook = (vehicleId: string) => {
    if (!hasUserDates) {
      // If using simulated dates, redirect to fleet page for them to select dates
      // (they'll see the booking form)
      router.push(`/${locale}/fleet/${vehicleId}`);
      return;
    }
    const params = new URLSearchParams({
      vehicleId,
      pickupDate: userPickupDate!,
      dropoffDate: userDropoffDate!,
      pickupLocation,
      dropOffLocation,
    });
    router.push(`/${locale}/checkout?${params.toString()}`);
  };

  return (
    <div className={styles.resultsSection}>
      {/* Search summary */}
      {hasUserDates ? (
        <div className={styles.searchSummary}>
          <span>📍 {pickupLocation} → {dropOffLocation}</span>
          <span>📅 {new Date(userPickupDate!).toLocaleDateString(isIt ? 'it-IT' : 'en-GB', { day: 'numeric', month: 'short' })} — {new Date(userDropoffDate!).toLocaleDateString(isIt ? 'it-IT' : 'en-GB', { day: 'numeric', month: 'short' })} ({days} {isIt ? 'giorni' : 'days'})</span>
          {total > 0 && <span className={styles.totalBadge}>{total} {isIt ? 'veicoli trovati' : 'vehicles found'}</span>}
        </div>
      ) : (
        <div className={styles.searchSummary}>
          <span>🚗 {isIt ? 'La nostra flotta — prezzi indicativi al giorno' : 'Our fleet — indicative daily prices'}</span>
        </div>
      )}

      {loading && (
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <p>{t('loading')}</p>
        </div>
      )}

      {error && <div className={styles.error}>{error}</div>}

      {!loading && vehicles.length === 0 && !error && (
        <div className={styles.empty}>{t('noVehicles')}</div>
      )}

      <div className={styles.grid}>
        {vehicles.filter(v => v.status !== 'Unavailable').map(v => (
          <div key={`${v.id}-${v.groupId}`} className={styles.card}>
            {/* Status badge */}
            {hasUserDates && (
              <div className={`${styles.statusBadge} ${v.status === 'Available' ? styles.available : styles.onRequest}`}>
                {v.status === 'Available' ? (isIt ? '✅ Disponibile' : '✅ Available') : (isIt ? '⏳ Su Richiesta' : '⏳ On Request')}
              </div>
            )}

            {/* Vehicle image */}
            <div className={styles.imageWrap}>
              {v.imageUrl ? (
                <img src={v.imageUrl} alt={v.name} className={styles.image} loading="lazy" />
              ) : (
                <div className={styles.imagePlaceholder}>🚗</div>
              )}
            </div>

            {/* Vehicle info */}
            <div className={styles.info}>
              <span className={styles.category}>{v.category}</span>
              <h3 className={styles.name}>{v.name}</h3>

              <div className={styles.specs}>
                {v.seats > 0 && <span>👤 {v.seats} {t('seats')}</span>}
                {v.airCondition && <span>❄️ A/C</span>}
                {v.transmission && <span>⚙️ {v.transmission}</span>}
                {v.fuelType && <span>⛽ {v.fuelType}</span>}
              </div>

              {/* Included items */}
              {v.includedOptionals && v.includedOptionals.length > 0 && (
                <div className={styles.included}>
                  {v.includedOptionals.map((opt, i) => (
                    <span key={i} className={styles.includedItem}>✅ {opt.description}</span>
                  ))}
                </div>
              )}

              {/* Pricing */}
              <div className={styles.pricing}>
                <div className={styles.priceMain}>
                  {isSimulated ? (
                    /* Simulated 1-day pricing: show as "from €X/day" */
                    v.rateTotalAmount > 0 ? (
                      <>
                        <span className={styles.totalPrice}>{isIt ? 'da' : 'from'} €{v.rateTotalAmount.toFixed(0)}</span>
                        <span className={styles.priceLabel}>{isIt ? '/giorno' : '/day'}</span>
                      </>
                    ) : (
                      <span className={styles.totalPrice} style={{ fontSize: '1rem' }}>{isIt ? 'Contattaci per il prezzo' : 'Contact us for pricing'}</span>
                    )
                  ) : (
                    /* User-selected dates: show total */
                    v.rateTotalAmount > 0 ? (
                      <>
                        <span className={styles.totalPrice}>€{v.rateTotalAmount.toFixed(2)}</span>
                        <span className={styles.priceLabel}>{t('totalForPeriod')}</span>
                      </>
                    ) : (
                      <span className={styles.totalPrice} style={{ fontSize: '1rem' }}>{isIt ? 'Contattaci per il prezzo' : 'Contact us for pricing'}</span>
                    )
                  )}
                </div>
                {!isSimulated && v.dailyRate > 0 && (
                  <span className={styles.dailyRate}>€{v.dailyRate.toFixed(2)}{t('perDay')}</span>
                )}
              </div>

              {/* Young/senior driver fee warning */}
              {v.youngDriverFee > 0 && (
                <div className={styles.feeWarning}>⚠️ {v.youngDriverFeeDesc || (isIt ? 'Supplemento giovane conducente' : 'Young driver surcharge')}: €{v.youngDriverFee}</div>
              )}

              <button className="btn-primary" style={{ width: '100%' }} onClick={() => handleBook(v.id)}>
                {hasUserDates ? `${t('bookNow')} →` : (isIt ? 'Scegli date e prenota →' : 'Choose dates & book →')}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
