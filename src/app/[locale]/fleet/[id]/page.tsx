import {getTranslations} from 'next-intl/server';
import React from 'react';
import {vehicles} from '@/lib/vehicles';
import {notFound} from 'next/navigation';
import VehicleBookingWidget from '@/components/VehicleBookingWidget';
import TrustIndexWidget from '@/components/TrustIndexWidget';
import VehicleSchema from '@/components/VehicleSchema';
import styles from './page.module.css';

export default async function VehicleDetailPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const t = await getTranslations('VehicleDetail');
  const isIt = locale === 'it';

  const vehicle = vehicles.find(v => v.id === id);
  if (!vehicle) notFound();

  return (
    <main className="section">
      <VehicleSchema vehicle={vehicle} />
      <div className={styles.detail}>
        <div className={styles.imageSection}>
          <div className={styles.mainImage}>
            <img src={vehicle.imageUrl} alt={vehicle.name} className={styles.img} />
          </div>
        </div>

        <div className={styles.info}>
          <span className={styles.category}>{vehicle.category}</span>
          <h1 className={styles.name}>{vehicle.name}</h1>
          <div className={styles.priceBlock}>
            {vehicle.price > 0 ? (
              <>
                <span className={styles.priceLabel}>{t('from')}</span>
                <span className={styles.priceAmount}>€{vehicle.price}</span>
                <span className={styles.pricePeriod}>{t('perDay')}</span>
              </>
            ) : (
              <span className={styles.priceLabel}>{isIt ? 'Seleziona le date per il prezzo' : 'Select dates for pricing'}</span>
            )}
          </div>

          <div className={styles.specsGrid}>
            <div className={styles.spec}><span className={styles.specLabel}>{t('seats')}</span><span className={styles.specValue}>{vehicle.seats}</span></div>
            <div className={styles.spec}><span className={styles.specLabel}>{t('transmission')}</span><span className={styles.specValue}>{vehicle.transmission}</span></div>
            <div className={styles.spec}><span className={styles.specLabel}>{t('fuel')}</span><span className={styles.specValue}>{vehicle.fuel}</span></div>
            <div className={styles.spec}><span className={styles.specLabel}>{isIt ? 'Anno' : 'Year'}</span><span className={styles.specValue}>{vehicle.year}</span></div>
          </div>

          <div className={styles.included}>
            <h3>{t('included')}</h3>
            <ul>
              <li>✅ {t('insurance')}</li>
              <li>✅ {t('mileage')}</li>
              <li>✅ {t('support')}</li>
              <li>✅ {t('cancellation')}</li>
            </ul>
          </div>

          {/* Booking Widget with date selection & price preview */}
          <VehicleBookingWidget vehicle={{ id: vehicle.id, name: vehicle.name, price: vehicle.price }} />

          <a
            href={`https://api.whatsapp.com/send?phone=+393440513634&text=${encodeURIComponent(isIt ? `Ciao! Vorrei informazioni sul ${vehicle.name}` : `Hi! I'd like info about the ${vehicle.name}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-outline"
            style={{width:'100%',textAlign:'center',marginTop:'12px',display:'block',color:'#25D366',borderColor:'#25D366'}}
          >
            💬 {isIt ? 'Chiedi info su WhatsApp' : 'Ask on WhatsApp'}
          </a>
        </div>
      </div>

      {/* ── TrustIndex Under the Car ── */}
      <div style={{ marginTop: '60px' }}>
        <TrustIndexWidget src="https://cdn.trustindex.io/loader.js?e419d99704e65251d786fd54aab" />
      </div>
    </main>
  );
}
