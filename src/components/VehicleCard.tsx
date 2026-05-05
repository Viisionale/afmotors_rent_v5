import React from 'react';
import {Link} from '@/i18n/routing';
import styles from './VehicleCard.module.css';

interface VehicleProps {
  id: string;
  name: string;
  category: string;
  price: number;
  seats: number;
  transmission: string;
  fuel: string;
  imageUrl: string;
}

export default function VehicleCard({ vehicle, perDay }: { vehicle: VehicleProps; perDay: string }) {
  return (
    <Link href={`/fleet/${vehicle.id}`} className={styles.card}>
      <div className={styles.image}>
        <img src={vehicle.imageUrl} alt={vehicle.name} className={styles.img} loading="lazy" />
        <span className={styles.badge}>{vehicle.category}</span>
      </div>
      <div className={styles.body}>
        <h3 className={styles.name}>{vehicle.name}</h3>
        <div className={styles.specs}>
          <span>🪑 {vehicle.seats}</span>
          <span>⚙️ {vehicle.transmission}</span>
          <span>⛽ {vehicle.fuel}</span>
        </div>
        <div className={styles.footer}>
          {vehicle.price > 0 ? (
            <div className={styles.price}>
              <strong>€{vehicle.price}</strong>
              <span>{perDay}</span>
            </div>
          ) : (
            <div className={styles.price}>
              <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>{perDay === '/giorno' ? 'Verifica disponibilità' : 'Check availability'}</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
