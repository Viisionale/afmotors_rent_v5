"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {useLocale, useTranslations} from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './VehicleBookingWidget.module.css';

interface Vehicle {
  id: string;
  name: string;
  price: number;
}

interface Location {
  locationCode: string;
  locationName: string;
  isAirport: boolean;
}

export default function VehicleBookingWidget({ vehicle }: { vehicle: Vehicle }) {
  const locale = useLocale();
  const isIt = locale === 'it';
  const t = useTranslations('VehicleDetail');
  const router = useRouter();

  const [pickupLocation, setPickupLocation] = useState('CAG');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [sameLocation, setSameLocation] = useState(true);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00');
  const [dropoffDate, setDropoffDate] = useState('');
  const [dropoffTime, setDropoffTime] = useState('10:00');
  const [locations, setLocations] = useState<Location[]>([]);

  const [days, setDays] = useState(0);
  const [apiPrice, setApiPrice] = useState<number | null>(null);
  const [apiDailyRate, setApiDailyRate] = useState<number | null>(null);
  const [priceLoading, setPriceLoading] = useState(false);

  const minDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Fetch locations
  useEffect(() => {
    fetch('/api/locations')
      .then(r => r.json())
      .then(d => {
        const locs = d.locations || [];
        setLocations(locs);
        if (locs.length > 0) setPickupLocation(locs[0].locationCode);
      })
      .catch(() => {
        setLocations([
          { locationCode: 'CAG', locationName: 'Aeroporto di Cagliari Elmas', isAirport: true },
          { locationCode: 'SESTU', locationName: 'AF Motors Rent - Sestu', isAirport: false },
        ]);
      });
  }, []);

  // Calculate days
  useEffect(() => {
    if (pickupDate && dropoffDate) {
      const start = new Date(pickupDate);
      const end = new Date(dropoffDate);
      const d = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
      setDays(d);
    } else {
      setDays(0);
      setApiPrice(null);
      setApiDailyRate(null);
    }
  }, [pickupDate, dropoffDate]);

  // Fetch real-time API pricing when dates change
  const fetchApiPrice = useCallback(() => {
    if (!pickupDate || !dropoffDate || days === 0) return;

    const startDate = `${pickupDate}T${pickupTime}:00`;
    const endDate = `${dropoffDate}T${dropoffTime}:00`;
    const dropLoc = sameLocation ? pickupLocation : (dropoffLocation || pickupLocation);

    setPriceLoading(true);
    setApiPrice(null);
    setApiDailyRate(null);

    fetch('/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pickupDate: startDate,
        dropoffDate: endDate,
        pickupLocation,
        dropOffLocation: dropLoc,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        }
        const vehicles = data.vehicles || [];
        // Find this specific vehicle in the results
        const match = vehicles.find((v: { id: string }) => v.id === vehicle.id);
        if (match) {
          setApiPrice(match.rateTotalAmount);
          setApiDailyRate(match.dailyRate);
        } else {
          // Vehicle not in API results — fall back to static price
          setApiPrice(null);
          setApiDailyRate(null);
        }
      })
      .catch(() => {
        setApiPrice(null);
        setApiDailyRate(null);
      })
      .finally(() => setPriceLoading(false));
  }, [pickupDate, dropoffDate, pickupTime, dropoffTime, pickupLocation, dropoffLocation, sameLocation, days, vehicle.id]);

  useEffect(() => {
    if (days > 0) fetchApiPrice();
  }, [days, fetchApiPrice]);

  const totalPrice = apiPrice ?? (days > 0 && vehicle.price > 0 ? days * vehicle.price : 0);
  const dailyRate = apiDailyRate ?? vehicle.price;
  const hasPricing = totalPrice > 0;

  const handleBook = () => {
    if (!pickupDate || !dropoffDate) return;
    const startDate = `${pickupDate}T${pickupTime}:00`;
    const endDate = `${dropoffDate}T${dropoffTime}:00`;
    const dropLoc = sameLocation ? pickupLocation : (dropoffLocation || pickupLocation);
    const q = new URLSearchParams({
      vehicleId: vehicle.id,
      pickupDate: startDate,
      dropoffDate: endDate,
      pickupLocation,
      dropOffLocation: dropLoc,
    });
    router.push(`/${locale}/checkout?${q.toString()}`);
  };

  return (
    <div className={styles.widget}>
      <h3 className={styles.title}>{isIt ? 'Seleziona le date' : 'Select your dates'}</h3>
      <p className={styles.hint}>{isIt ? 'Lascia un intervallo minimo di 48 ore da oggi' : 'Minimum 48 hours from today'}</p>

      {/* Location selection */}
      <div className={styles.locationSection}>
        <div className={styles.field}>
          <label>📍 {isIt ? 'Ritiro' : 'Pickup'}</label>
          <select className={styles.select} value={pickupLocation} onChange={e => setPickupLocation(e.target.value)}>
            {locations.map(l => (
              <option key={l.locationCode} value={l.locationCode}>
                {l.isAirport ? '✈️ ' : '🏢 '}{l.locationName}
              </option>
            ))}
          </select>
        </div>
        <label className={styles.sameLocToggle}>
          <input type="checkbox" checked={sameLocation} onChange={e => setSameLocation(e.target.checked)} />
          <span>{isIt ? 'Stessa sede riconsegna' : 'Same return location'}</span>
        </label>
        {!sameLocation && (
          <div className={styles.field}>
            <label>📍 {isIt ? 'Riconsegna' : 'Return'}</label>
            <select className={styles.select} value={dropoffLocation || pickupLocation} onChange={e => setDropoffLocation(e.target.value)}>
              {locations.map(l => (
                <option key={l.locationCode} value={l.locationCode}>
                  {l.isAirport ? '✈️ ' : '🏢 '}{l.locationName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Date + time fields */}
      <div className={styles.dateFields}>
        <div className={styles.dateField}>
          <label>{isIt ? '📅 Ritiro' : '📅 Pickup'}</label>
          <input type="date" min={minDate} value={pickupDate} onChange={e => setPickupDate(e.target.value)} />
          <select className={styles.select} value={pickupTime} onChange={e => setPickupTime(e.target.value)}>
            {Array.from({ length: 13 }, (_, i) => i + 8).map(h => (
              <React.Fragment key={h}>
                <option value={`${h.toString().padStart(2, '0')}:00`}>{`${h.toString().padStart(2, '0')}:00`}</option>
                <option value={`${h.toString().padStart(2, '0')}:30`}>{`${h.toString().padStart(2, '0')}:30`}</option>
              </React.Fragment>
            ))}
          </select>
        </div>
        <div className={styles.dateField}>
          <label>{isIt ? '📅 Riconsegna' : '📅 Return'}</label>
          <input type="date" min={pickupDate || minDate} value={dropoffDate} onChange={e => setDropoffDate(e.target.value)} />
          <select className={styles.select} value={dropoffTime} onChange={e => setDropoffTime(e.target.value)}>
            {Array.from({ length: 13 }, (_, i) => i + 8).map(h => (
              <React.Fragment key={h}>
                <option value={`${h.toString().padStart(2, '0')}:00`}>{`${h.toString().padStart(2, '0')}:00`}</option>
                <option value={`${h.toString().padStart(2, '0')}:30`}>{`${h.toString().padStart(2, '0')}:30`}</option>
              </React.Fragment>
            ))}
          </select>
        </div>
      </div>

      {/* Price preview */}
      {days > 0 && (
        <div className={styles.preview}>
          <div className={styles.previewRow}>
            <span>{isIt ? 'Durata' : 'Duration'}</span>
            <strong>{days} {isIt ? 'giorni' : 'days'}</strong>
          </div>
          {priceLoading ? (
            <div className={styles.previewRow}>
              <span>{isIt ? 'Calcolo prezzo...' : 'Calculating price...'}</span>
              <strong>⏳</strong>
            </div>
          ) : hasPricing ? (
            <>
              <div className={styles.previewRow}>
                <span>{isIt ? 'Noleggio' : 'Rental'} ({days} × €{dailyRate.toFixed(2)})</span>
                <strong>€{totalPrice.toFixed(2)}</strong>
              </div>
              {apiPrice !== null && (
                <div className={styles.apiPriceBadge}>
                  ✅ {isIt ? 'Prezzo in tempo reale' : 'Real-time pricing'}
                </div>
              )}
            </>
          ) : (
            <div className={styles.previewRow}>
              <span>{isIt ? 'Prezzo non disponibile' : 'Price unavailable'}</span>
              <strong>{isIt ? 'Contattaci' : 'Contact us'}</strong>
            </div>
          )}
          <div className={styles.previewNote}>
            {isIt ? '+ Protezione e extra opzionali allo step successivo' : '+ Optional protection & extras at checkout'}
          </div>
        </div>
      )}

      <button
        className="btn-primary"
        style={{ width: '100%', marginTop: '16px', opacity: days > 0 && !priceLoading ? 1 : 0.5 }}
        onClick={handleBook}
        disabled={days === 0 || priceLoading}
      >
        {days > 0 && !priceLoading && hasPricing
          ? `${t('bookThisVehicle')} — €${totalPrice.toFixed(2)}`
          : t('bookThisVehicle')
        } →
      </button>
    </div>
  );
}
