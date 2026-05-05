"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import styles from './VehicleCard.module.css';

interface Vehicle {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  seats: number;
  transmission: string;
  fuel: string;
  imageUrl: string;
}

interface ApiVehicle {
  id: string;
  dailyRate: number;
  rateTotalAmount: number;
}

/**
 * Featured Fleet section for the homepage.
 * Auto-fetches daily prices from the API using simulated 1-day rental dates
 * (today+2 → today+3) so visitors immediately see real pricing.
 */
export default function FeaturedFleet({ vehicles, perDay }: { vehicles: Vehicle[]; perDay: string }) {
  const locale = useLocale();
  const isIt = locale === 'it';
  const router = useRouter();
  const [prices, setPrices] = useState<Record<string, number>>({});

  // Generate simulated 1-day dates
  const simDates = useMemo(() => {
    const now = new Date();
    const pickup = new Date(now);
    pickup.setDate(pickup.getDate() + 2);
    pickup.setHours(10, 0, 0, 0);

    const dropoff = new Date(now);
    dropoff.setDate(dropoff.getDate() + 3);
    dropoff.setHours(10, 0, 0, 0);

    const fmt = (d: Date) => d.toISOString().slice(0, 19);
    return { pickupDate: fmt(pickup), dropoffDate: fmt(dropoff) };
  }, []);

  // Fetch daily prices on mount
  useEffect(() => {
    fetch('/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pickupDate: simDates.pickupDate,
        dropoffDate: simDates.dropoffDate,
        pickupLocation: 'AF-Apt',
        dropOffLocation: 'AF-Apt',
      }),
    })
      .then(r => r.json())
      .then(data => {
        const apiVehicles: ApiVehicle[] = data.vehicles || [];
        const map: Record<string, number> = {};
        for (const v of apiVehicles) {
          // For a 1-day simulation, rateTotalAmount ≈ daily rate
          map[v.id] = v.rateTotalAmount || v.dailyRate || 0;
        }
        setPrices(map);
      })
      .catch(() => {
        // API down — prices stay empty, cards will show "Verifica disponibilità"
      });
  }, [simDates]);

  return (
    <div className="grid-3">
      {vehicles.map(v => {
        const dailyPrice = prices[v.id] || 0;
        return (
          <div
            key={v.id}
            className={styles.card}
            onClick={() => router.push(`/${locale}/fleet/${v.id}`)}
            style={{ cursor: 'pointer' }}
          >
            <div className={styles.image}>
              <img src={v.imageUrl} alt={v.name} className={styles.img} loading="lazy" />
              <span className={styles.badge}>{v.category}</span>
            </div>
            <div className={styles.body}>
              <h3 className={styles.name}>{v.name}</h3>
              <div className={styles.specs}>
                <span>🪑 {v.seats}</span>
                <span>⚙️ {v.transmission}</span>
                <span>⛽ {v.fuel}</span>
              </div>
              <div className={styles.footer}>
                {dailyPrice > 0 ? (
                  <div className={styles.price}>
                    <strong>{isIt ? 'da' : 'from'} €{dailyPrice.toFixed(0)}</strong>
                    <span>{perDay}</span>
                  </div>
                ) : (
                  <div className={styles.price}>
                    <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
                      {isIt ? 'Verifica disponibilità' : 'Check availability'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
