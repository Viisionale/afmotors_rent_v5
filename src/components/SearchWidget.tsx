"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {useTranslations} from 'next-intl';
import styles from './SearchWidget.module.css';

interface Location {
  locationCode: string;
  locationName: string;
  isAirport: boolean;
}

export default function SearchWidget({ locale }: { locale: string }) {
  const t = useTranslations('Search');
  const router = useRouter();
  const isIt = locale === 'it';

  const [pickupLocation, setPickupLocation] = useState('CAG');
  const [dropoffLocation, setDropoffLocation] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00');
  const [dropoffDate, setDropoffDate] = useState('');
  const [dropoffTime, setDropoffTime] = useState('10:00');
  const [locations, setLocations] = useState<Location[]>([]);
  const [sameLocation, setSameLocation] = useState(true);

  const minDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Fetch locations from API
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pickupDate || !dropoffDate) return;

    const startDate = `${pickupDate}T${pickupTime}:00`;
    const endDate = `${dropoffDate}T${dropoffTime}:00`;
    const dropLoc = sameLocation ? pickupLocation : (dropoffLocation || pickupLocation);

    const params = new URLSearchParams({
      pickupDate: startDate,
      dropoffDate: endDate,
      pickupLocation,
      dropOffLocation: dropLoc,
    });

    router.push(`/${locale}/fleet?${params.toString()}`);
  };

  return (
    <form className={styles.widget} onSubmit={handleSearch}>
      {/* Location row */}
      <div className={styles.locationRow}>
        <div className={styles.field}>
          <label className={styles.label}>📍 {t('pickupLocation')}</label>
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
            <label className={styles.label}>📍 {t('dropoffLocation')}</label>
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

      {/* Date/time row */}
      <div className={styles.fields}>
        <div className={styles.fieldGroup}>
          <div className={styles.field}>
            <label className={styles.label}>📅 {t('pickupDate')}</label>
            <input type="date" className={styles.input} min={minDate} value={pickupDate} onChange={e => setPickupDate(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>🕐 {t('pickupTime')}</label>
            <select className={styles.select} value={pickupTime} onChange={e => setPickupTime(e.target.value)}>
              {Array.from({ length: 13 }, (_, i) => i + 8).map(h => (
                <React.Fragment key={h}>
                  <option value={`${h.toString().padStart(2, '0')}:00`}>{`${h.toString().padStart(2, '0')}:00`}</option>
                  <option value={`${h.toString().padStart(2, '0')}:30`}>{`${h.toString().padStart(2, '0')}:30`}</option>
                </React.Fragment>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.fieldGroup}>
          <div className={styles.field}>
            <label className={styles.label}>📅 {t('dropoffDate')}</label>
            <input type="date" className={styles.input} min={pickupDate || minDate} value={dropoffDate} onChange={e => setDropoffDate(e.target.value)} required />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>🕐 {t('dropoffTime')}</label>
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
      </div>

      <button type="submit" className={styles.searchBtn}>
        🔍 {t('searchButton')}
      </button>
    </form>
  );
}
