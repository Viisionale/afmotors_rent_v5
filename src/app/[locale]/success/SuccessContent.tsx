"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import styles from './page.module.css';

interface BookingConfirmation {
  status: string;
  bookingId: string;
  reservationCode?: string;
  autoRegistered?: boolean;
  customerEmail?: string;
  driverEmail?: string;
  vehicle?: {
    name: string;
    imageUrl: string;
    category: string;
  };
  pickupDate?: string;
  dropoffDate?: string;
  pickupLocation?: string;
  dropOffLocation?: string;
  totalPrice?: number;
  rentalCost?: number;
  extrasTotal?: number;
  protectionCost?: number;
  protectionPlan?: string;
  driverName?: string;
  days?: number;
}

export default function SuccessPageContent() {
  const searchParams = useSearchParams();
  const locale = useLocale();
  const isIt = locale === 'it';
  const ref = searchParams.get('ref') || '';

  const [booking, setBooking] = useState<BookingConfirmation | null>(null);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem('bookingConfirmation');
      if (stored) {
        setBooking(JSON.parse(stored));
      }
    } catch {}
  }, []);

  const email = booking?.driverEmail || booking?.customerEmail || '';

  return (
    <main className={styles.page}>
      <div className={styles.confirmationCard}>
        {/* ── Success Header ── */}
        <div className={styles.header}>
          <div className={styles.icon}>✓</div>
          <h1 className={styles.title}>
            {isIt ? 'Prenotazione confermata!' : 'Booking Confirmed!'}
          </h1>
          <p className={styles.subtitle}>
            {isIt
              ? 'Il pagamento è stato elaborato con successo'
              : 'Your payment has been processed successfully'}
          </p>
        </div>

        {/* ── Booking Reference ── */}
        {ref && (
          <div className={styles.refBox}>
            <span className={styles.refLabel}>
              {isIt ? 'Codice prenotazione' : 'Booking Reference'}
            </span>
            <span className={styles.refValue}>{ref}</span>
          </div>
        )}

        {/* ── Vehicle Details ── */}
        {booking?.vehicle && (
          <div className={styles.detailSection}>
            <div className={styles.vehicleRow}>
              {booking.vehicle.imageUrl && (
                <img src={booking.vehicle.imageUrl} alt={booking.vehicle.name} className={styles.vehicleImg} />
              )}
              <div>
                <h3 className={styles.vehicleName}>{booking.vehicle.name}</h3>
                <span className={styles.vehicleCategory}>{booking.vehicle.category}</span>
              </div>
            </div>
          </div>
        )}

        {/* ── Trip Details ── */}
        {booking?.pickupDate && (
          <div className={styles.detailSection}>
            <h3 className={styles.sectionLabel}>
              {isIt ? '📅 Dettagli del viaggio' : '📅 Trip Details'}
            </h3>
            <div className={styles.detailGrid}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>{isIt ? 'Ritiro' : 'Pickup'}</span>
                <strong>{booking.pickupDate && !isNaN(new Date(booking.pickupDate).getTime()) ? new Date(booking.pickupDate).toLocaleDateString(isIt ? 'it-IT' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : booking.pickupDate}</strong>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>{isIt ? 'Riconsegna' : 'Return'}</span>
                <strong>{booking.dropoffDate && !isNaN(new Date(booking.dropoffDate).getTime()) ? new Date(booking.dropoffDate).toLocaleDateString(isIt ? 'it-IT' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : booking.dropoffDate}</strong>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>📍 {isIt ? 'Luogo ritiro' : 'Pickup location'}</span>
                <strong>{booking.pickupLocation === 'AF-Apt' ? 'CAG - Cagliari Airport' : booking.pickupLocation}</strong>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>📍 {isIt ? 'Luogo riconsegna' : 'Return location'}</span>
                <strong>{booking.dropOffLocation === 'AF-Apt' ? 'CAG - Cagliari Airport' : booking.dropOffLocation}</strong>
              </div>
              {booking.days && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>{isIt ? 'Durata' : 'Duration'}</span>
                  <strong>{booking.days} {isIt ? 'giorni' : 'days'}</strong>
                </div>
              )}
            </div>
          </div>
        )}

        {booking?.totalPrice !== undefined && (
          <div className={styles.detailSection}>
            <h3 className={styles.sectionLabel}>
              {isIt ? '💰 Riepilogo costi' : '💰 Price Breakdown'}
            </h3>
            <div className={styles.priceList}>
              {booking.rentalCost !== undefined && (
                <div className={styles.priceRow}>
                  <span>{isIt ? 'Noleggio' : 'Rental'}</span>
                  <span>€{Number(booking.rentalCost).toFixed(2)}</span>
                </div>
              )}
              {booking.protectionCost !== undefined && booking.protectionCost > 0 && (
                <div className={styles.priceRow}>
                  <span>🛡️ {booking.protectionPlan
                    ? booking.protectionPlan.charAt(0).toUpperCase() + booking.protectionPlan.slice(1)
                    : (isIt ? 'Protezione' : 'Protection')
                  }</span>
                  <span>€{Number(booking.protectionCost).toFixed(2)}</span>
                </div>
              )}
              {booking.extrasTotal !== undefined && booking.extrasTotal > 0 && (
                <div className={styles.priceRow}>
                  <span>{isIt ? 'Optional' : 'Extras'}</span>
                  <span>€{Number(booking.extrasTotal).toFixed(2)}</span>
                </div>
              )}
              <div className={styles.totalRow}>
                <span>{isIt ? 'Totale pagato' : 'Total Paid'}</span>
                <strong>€{Number(booking.totalPrice).toFixed(2)}</strong>
              </div>
            </div>
          </div>
        )}

        {/* ── Driver Info ── */}
        {booking?.driverName && (
          <div className={styles.detailSection}>
            <h3 className={styles.sectionLabel}>👤 {isIt ? 'Conducente' : 'Driver'}</h3>
            <p className={styles.driverInfo}>{booking.driverName}</p>
            {email && <p className={styles.driverInfo}>{email}</p>}
          </div>
        )}

        {/* ── Notices ── */}
        <div className={styles.notices}>
          <div className={styles.noticeItem}>
            📧 {isIt
              ? `Email di conferma inviata a ${email || 'il tuo indirizzo email'}`
              : `Confirmation email sent to ${email || 'your email address'}`
            }
          </div>
          {booking?.autoRegistered && (
            <div className={styles.noticeItem}>
              🔑 {isIt
                ? 'Un account è stato creato per te. Controlla la tua email per impostare la password.'
                : 'An account has been created for you. Check your email to set your password.'
              }
            </div>
          )}
        </div>

        {/* ── Coupon Banner ── */}
        <div style={{ backgroundColor: '#fffbeb', border: '2px dashed #f59e0b', padding: '24px', borderRadius: '12px', margin: '30px 0', textAlign: 'center' }}>
          <h3 style={{ color: '#d97706', marginTop: 0, marginBottom: '10px', fontSize: '20px' }}>
            {isIt ? '🎁 Un regalo per te!' : '🎁 A gift for you!'}
          </h3>
          <p style={{ color: '#92400e', marginBottom: '15px', lineHeight: '1.5' }}>
            {isIt 
              ? 'Prenota il tuo alloggio a Cagliari con il nostro partner esclusivo e ottieni uno sconto speciale utilizzando il codice promozionale:'
              : 'Book your accommodation in Cagliari with our exclusive partner and get a special discount using the promo code:'}
          </p>
          <div style={{ display: 'inline-block', backgroundColor: '#fef3c7', border: '1px solid #fcd34d', padding: '10px 20px', borderRadius: '6px', fontSize: '22px', fontWeight: 'bold', color: '#b45309', marginBottom: '20px', letterSpacing: '1px' }}>
            stayincagliari
          </div>
          <div>
            <a href="https://stayincagliari.com/" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{ backgroundColor: '#f59e0b', color: 'white', display: 'inline-block', textDecoration: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold' }}>
              {isIt ? 'Scopri gli alloggi su StayInCagliari' : 'Discover StayInCagliari'}
            </a>
          </div>
        </div>

        {/* ── Actions ── */}
        <div className={styles.actions}>
          <Link href="/dashboard" className="btn-primary">{isIt ? 'Le mie prenotazioni' : 'My Bookings'}</Link>
          <Link href="/" className="btn-outline">{isIt ? 'Torna alla home' : 'Back to Home'}</Link>
        </div>
      </div>
    </main>
  );
}
