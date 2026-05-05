import React from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/routing';
import TrustIndexWidget from './TrustIndexWidget';
import styles from './Footer.module.css';

export default function Footer() {
  const t = useTranslations('Footer');
  const tNav = useTranslations('Nav');

  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <div className={styles.brand}>
          <Link href="/">
            <img 
              src="/images/branding/AF-Motors-Rent-Logo-2.svg" 
              alt="AF Motors Rent" 
              style={{ height: '60px', marginBottom: '16px' }} 
            />
          </Link>
          <p style={{ marginBottom: '12px' }}>{t('tagline')}</p>
          <a href="https://afmotors.it" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', fontWeight: 'bold', textDecoration: 'none' }}>
            <img src="https://afmotors.it/wp-content/uploads/2024/11/logo-af-motors.png" alt="AF Motors" style={{ height: '18px', filter: 'brightness(0) saturate(100%) invert(43%) sepia(87%) saturate(1904%) hue-rotate(320deg) brightness(101%) contrast(105%)' }} />
            afmotors.it
          </a>
          <div className="trustindex-footer-embed" style={{ marginTop: '20px' }}>
            <TrustIndexWidget src="https://cdn.trustindex.io/loader.js?5fad17d7067e52671e361b3ef5c" />
          </div>
        </div>

        <div className={styles.col}>
          <h4>{t('quickLinks')}</h4>
          <Link href="/about">Chi Siamo / About</Link>
          <Link href="/fleet">{tNav('fleet')}</Link>
          <Link href="/how-it-works">{tNav('howItWorks')}</Link>
          <Link href="/faq">{tNav('faq')}</Link>
        </div>

        <div className={styles.col}>
          <h4>📍 {tNav('location') || 'Sede'}</h4>
          <a href="https://maps.app.goo.gl/j53FQ2DDTeWCb7pGe" target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginBottom: '8px' }}>
            <strong>AF Motors Rent - Aeroporto Cagliari</strong><br/>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Arrivi Aeroporto di Cagliari Elmas 'Mario Mameli'</span>
          </a>
          <a href="#" target="_blank" rel="noopener noreferrer" style={{ display: 'block', marginBottom: '8px' }}>
            <strong>AF Motors Rent - Sestu</strong><br/>
            <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Viale Monastir km 8,5 Sestu (CA)</span>
          </a>
          <div style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
            <strong>Orari:</strong> Lun–Sab 08:00–20:00 | Dom 08:00–20:00<br/>
            <strong>Tel:</strong> +39 3440513634<br/>
            <strong>Email:</strong> info@afmotorsrent.it
          </div>
        </div>

        <div className={styles.col}>
          <h4>{t('support')}</h4>
          <Link href="/contact">{t('contact')}</Link>
          <Link href="/terms">{t('terms')}</Link>
          <Link href="/privacy">{t('privacy')}</Link>
        </div>
      </div>

      <div className={styles.bottom}>
        <p>&copy; {new Date().getFullYear()} {t('company')}. {t('copyright')}</p>
      </div>
    </footer>
  );
}
