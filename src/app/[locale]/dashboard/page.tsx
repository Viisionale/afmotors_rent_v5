"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { Link } from '@/i18n/routing';
import styles from './page.module.css';

type Tab = 'reservations' | 'quotations' | 'profile';

interface Reservation {
  id?: number;
  reservationId?: number;
  vehicleGroupDescription?: string;
  vehicleDescription?: string;
  pickUpDate?: string;
  dropOffDate?: string;
  pickUpLocationDescription?: string;
  dropOffLocationDescription?: string;
  totalAmount?: number;
  status?: string;
  reservationStatus?: string;
}

interface Quotation {
  id?: number;
  quotationId?: number;
  vehicleGroupDescription?: string;
  vehicleDescription?: string;
  pickUpDate?: string;
  dropOffDate?: string;
  totalAmount?: number;
  status?: string;
}

export default function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = React.use(params);
  const t = useTranslations('Dashboard');
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>('reservations');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  // Profile state
  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/${locale}/login`);
    }
  }, [user, authLoading, router, locale]);

  // Load profile data from user context
  useEffect(() => {
    if (user) {
      setProfileForm({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
      });
    }
  }, [user]);

  // Fetch data when tab changes
  const fetchTabData = useCallback(async (tab: Tab) => {
    if (tab === 'profile') return;
    setLoadingData(true);
    try {
      const endpoint = tab === 'reservations' ? '/api/user/reservations' : '/api/user/quotations';
      const res = await fetch(endpoint);
      if (res.ok) {
        const data = await res.json();
        if (tab === 'reservations') {
          setReservations(data.reservations || []);
        } else {
          setQuotations(data.quotations || []);
        }
      }
    } catch {
      // silently fail
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchTabData(activeTab);
    }
  }, [activeTab, user, fetchTabData]);

  const handleLogout = async () => {
    await logout();
    router.push(`/${locale}/login`);
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm),
      });
      if (res.ok) {
        setProfileMsg({ type: 'ok', text: t('profileSaved') });
      } else {
        setProfileMsg({ type: 'err', text: t('profileError') });
      }
    } catch {
      setProfileMsg({ type: 'err', text: t('profileError') });
    } finally {
      setProfileSaving(false);
    }
  };

  const cancelReservation = async (bookingId: number) => {
    const isIt = locale === 'it';
    const confirmed = window.confirm(
      isIt ? 'Sei sicuro di voler cancellare questa prenotazione?' : 'Are you sure you want to cancel this reservation?'
    );
    if (!confirmed) return;

    setCancellingId(bookingId);
    try {
      const res = await fetch(`/api/booking/${bookingId}/cancel`, { method: 'POST' });
      if (res.ok) {
        // Refresh the reservations list
        fetchTabData('reservations');
      } else {
        alert(isIt ? 'Cancellazione fallita' : 'Cancellation failed');
      }
    } catch {
      alert(isIt ? 'Errore di connessione' : 'Connection error');
    } finally {
      setCancellingId(null);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusLabel = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('confirm') || s === 'active') return t('statusConfirmed');
    if (s.includes('cancel')) return t('statusCancelled');
    if (s.includes('complet') || s.includes('closed')) return t('statusCompleted');
    return t('statusPending');
  };

  const getStatusClass = (status?: string) => {
    const s = (status || '').toLowerCase();
    if (s.includes('confirm') || s === 'active') return styles.statusConfirmed;
    if (s.includes('cancel')) return styles.statusCancelled;
    if (s.includes('complet') || s.includes('closed')) return styles.statusCompleted;
    return styles.statusPending;
  };

  if (authLoading || !user) {
    return (
      <main>
        <div className="page-hero"><h1>{t('loading')}</h1></div>
      </main>
    );
  }

  return (
    <main>
      <div className={styles.heroBar}>
        <div className={styles.heroInner}>
          <div>
            <h1 className={styles.heroTitle}>{t('title')}</h1>
            <p className={styles.heroEmail}>{user.email}</p>
          </div>
          <button onClick={handleLogout} className={styles.logoutBtn} id="dashboard-logout">
            {t('logout')}
          </button>
        </div>
      </div>

      <div className={styles.container}>
        {/* Tabs */}
        <div className={styles.tabs}>
          {(['reservations', 'quotations', 'profile'] as Tab[]).map(tab => (
            <button
              key={tab}
              className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab)}
              id={`tab-${tab}`}
            >
              {tab === 'reservations' && '📋 '}
              {tab === 'quotations' && '📝 '}
              {tab === 'profile' && '👤 '}
              {t(`tab${tab.charAt(0).toUpperCase() + tab.slice(1)}` as 'tabReservations' | 'tabQuotations' | 'tabProfile')}
            </button>
          ))}
        </div>

        {/* Reservations Tab */}
        {activeTab === 'reservations' && (
          <div className={styles.tabContent}>
            {loadingData ? (
              <div className={styles.loading}>{t('loading')}</div>
            ) : reservations.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>📋</div>
                <h3>{t('noReservations')}</h3>
                <p>{t('noReservationsHint')}</p>
                <Link href="/fleet" className="btn-primary" style={{ marginTop: 16 }}>{t('browseFleet')}</Link>
              </div>
            ) : (
              <div className={styles.list}>
                {reservations.map((r, i) => (
                  <div key={r.id || r.reservationId || i} className={styles.card}>
                    <div className={styles.cardTop}>
                      <h3 className={styles.cardVehicle}>
                        {r.vehicleDescription || r.vehicleGroupDescription || t('vehicle')}
                      </h3>
                      <span className={`${styles.badge} ${getStatusClass(r.status || r.reservationStatus)}`}>
                        {getStatusLabel(r.status || r.reservationStatus)}
                      </span>
                    </div>
                    <div className={styles.cardDetails}>
                      <div className={styles.cardDetail}>
                        <span className={styles.cardLabel}>{t('pickup')}</span>
                        <span>{formatDate(r.pickUpDate)}</span>
                      </div>
                      <div className={styles.cardDetail}>
                        <span className={styles.cardLabel}>{t('dropoff')}</span>
                        <span>{formatDate(r.dropOffDate)}</span>
                      </div>
                      {r.totalAmount != null && (
                        <div className={styles.cardDetail}>
                          <span className={styles.cardLabel}>{t('total')}</span>
                          <span className={styles.cardPrice}>€{Number(r.totalAmount).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                    {(r.pickUpLocationDescription || r.dropOffLocationDescription) && (
                      <p className={styles.cardLocation}>
                        {r.pickUpLocationDescription}
                        {r.dropOffLocationDescription && r.dropOffLocationDescription !== r.pickUpLocationDescription
                          ? ` → ${r.dropOffLocationDescription}` : ''}
                      </p>
                    )}
                    {/* Actions */}
                    {!(r.status || r.reservationStatus || '').toLowerCase().includes('cancel') && (
                      <div className={styles.cardActions} style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <Link 
                          href={`/dashboard/pre-checkin/${r.id || r.reservationId}`} 
                          className="btn-primary"
                          style={{ flex: 1, textAlign: 'center', backgroundColor: '#0ea5e9' }}
                        >
                          {locale === 'it' ? 'Completa Pre-Check-in' : 'Complete Pre-Check-in'}
                        </Link>
                        <button
                          type="button"
                          className={styles.cancelBtn}
                          style={{ flex: 1 }}
                          onClick={() => cancelReservation(r.id || r.reservationId!)}
                          disabled={cancellingId === (r.id || r.reservationId)}
                        >
                          {cancellingId === (r.id || r.reservationId)
                            ? (locale === 'it' ? 'Cancellazione...' : 'Cancelling...')
                            : (locale === 'it' ? '❌ Cancella prenotazione' : '❌ Cancel Booking')
                          }
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quotations Tab */}
        {activeTab === 'quotations' && (
          <div className={styles.tabContent}>
            {loadingData ? (
              <div className={styles.loading}>{t('loading')}</div>
            ) : quotations.length === 0 ? (
              <div className={styles.empty}>
                <div className={styles.emptyIcon}>📝</div>
                <h3>{t('noQuotations')}</h3>
                <p>{t('noQuotationsHint')}</p>
                <Link href="/fleet" className="btn-primary" style={{ marginTop: 16 }}>{t('browseFleet')}</Link>
              </div>
            ) : (
              <div className={styles.list}>
                {quotations.map((q, i) => (
                  <div key={q.id || q.quotationId || i} className={styles.card}>
                    <div className={styles.cardTop}>
                      <h3 className={styles.cardVehicle}>
                        {q.vehicleDescription || q.vehicleGroupDescription || t('vehicle')}
                      </h3>
                    </div>
                    <div className={styles.cardDetails}>
                      <div className={styles.cardDetail}>
                        <span className={styles.cardLabel}>{t('pickup')}</span>
                        <span>{formatDate(q.pickUpDate)}</span>
                      </div>
                      <div className={styles.cardDetail}>
                        <span className={styles.cardLabel}>{t('dropoff')}</span>
                        <span>{formatDate(q.dropOffDate)}</span>
                      </div>
                      {q.totalAmount != null && (
                        <div className={styles.cardDetail}>
                          <span className={styles.cardLabel}>{t('total')}</span>
                          <span className={styles.cardPrice}>€{Number(q.totalAmount).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className={styles.tabContent}>
            <form onSubmit={handleProfileSave} className={styles.profileForm}>
              {profileMsg && (
                <div className={profileMsg.type === 'ok' ? styles.successMsg : styles.errorMsg}>
                  {profileMsg.text}
                </div>
              )}
              <div className={styles.profileGrid}>
                <div className={styles.field}>
                  <label className="input-label">{t('profileFirstName')}</label>
                  <input
                    className="input"
                    value={profileForm.firstName}
                    onChange={e => setProfileForm(f => ({ ...f, firstName: e.target.value }))}
                    id="profile-firstName"
                  />
                </div>
                <div className={styles.field}>
                  <label className="input-label">{t('profileLastName')}</label>
                  <input
                    className="input"
                    value={profileForm.lastName}
                    onChange={e => setProfileForm(f => ({ ...f, lastName: e.target.value }))}
                    id="profile-lastName"
                  />
                </div>
                <div className={styles.field}>
                  <label className="input-label">{t('profileEmail')}</label>
                  <input
                    className="input"
                    type="email"
                    value={profileForm.email}
                    onChange={e => setProfileForm(f => ({ ...f, email: e.target.value }))}
                    id="profile-email"
                  />
                </div>
                <div className={styles.field}>
                  <label className="input-label">{t('profilePhone')}</label>
                  <input
                    className="input"
                    type="tel"
                    value={profileForm.phoneNumber}
                    onChange={e => setProfileForm(f => ({ ...f, phoneNumber: e.target.value }))}
                    id="profile-phone"
                  />
                </div>
              </div>
              <button
                type="submit"
                className={`btn-primary ${styles.saveBtn}`}
                disabled={profileSaving}
                id="profile-save"
              >
                {profileSaving ? t('loading') : t('profileSave')}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
