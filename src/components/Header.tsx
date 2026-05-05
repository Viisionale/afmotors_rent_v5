"use client";

import React, { useState } from 'react';
import {useLocale, useTranslations} from 'next-intl';
import {Link, usePathname} from '@/i18n/routing';
import {useAuth} from '@/components/AuthContext';
import styles from './Header.module.css';

export default function Header() {
  const t = useTranslations('Nav');
  const locale = useLocale();
  const pathname = usePathname();
  const {user, loading} = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <Link href="/" className={styles.logo}>
          <img
            src="/images/branding/AF-Motors-Rent-Logo-2.svg"
            alt="AF Motors Rent"
            height={48}
            className={styles.logoImg}
          />
        </Link>

        <nav className={styles.nav}>
          <Link href="/fleet" className={`${styles.navLink} ${pathname === '/fleet' ? styles.active : ''}`}>{t('fleet')}</Link>
          <Link href="/how-it-works" className={`${styles.navLink} ${pathname === '/how-it-works' ? styles.active : ''}`}>{t('howItWorks')}</Link>
          <Link href="/faq" className={`${styles.navLink} ${pathname === '/faq' ? styles.active : ''}`}>{t('faq')}</Link>
          <Link href="/contact" className={`${styles.navLink} ${pathname === '/contact' ? styles.active : ''}`}>{t('contact')}</Link>
        </nav>

        <div className={styles.actions}>
          <a
            href="https://api.whatsapp.com/send?phone=+393440513634"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.whatsappBtn}
            title="WhatsApp"
          >
            💬 WhatsApp
          </a>
          <Link href="/fleet" className={styles.bookNowBtn}>{t('bookNow')}</Link>
          <div className={styles.langSwitch}>
            <a href={`/it${pathname}`} className={locale === 'it' ? styles.langActive : ''}>IT</a>
            <a href={`/en${pathname}`} className={locale === 'en' ? styles.langActive : ''}>EN</a>
          </div>
          {!loading && (
            user ? (
              <Link href="/dashboard" className={styles.userBtn} id="header-user-btn">
                <span className={styles.userAvatar}>
                  {(user.firstName?.[0] || user.email[0]).toUpperCase()}
                </span>
                <span className={styles.userBtnText}>{t('myBookings')}</span>
              </Link>
            ) : (
              <Link href="/login" className={styles.loginBtn} id="header-login-btn">{t('login')}</Link>
            )
          )}
          <button 
            className={styles.hamburger} 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle Menu"
          >
            <span className={`${styles.hamburgerLine} ${isMobileMenuOpen ? styles.line1Open : ''}`}></span>
            <span className={`${styles.hamburgerLine} ${isMobileMenuOpen ? styles.line2Open : ''}`}></span>
            <span className={`${styles.hamburgerLine} ${isMobileMenuOpen ? styles.line3Open : ''}`}></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
        <nav className={styles.mobileNav}>
          <Link href="/fleet" onClick={() => setIsMobileMenuOpen(false)} className={`${styles.mobileNavLink} ${pathname === '/fleet' ? styles.mobileActive : ''}`}>{t('fleet')}</Link>
          <Link href="/how-it-works" onClick={() => setIsMobileMenuOpen(false)} className={`${styles.mobileNavLink} ${pathname === '/how-it-works' ? styles.mobileActive : ''}`}>{t('howItWorks')}</Link>
          <Link href="/faq" onClick={() => setIsMobileMenuOpen(false)} className={`${styles.mobileNavLink} ${pathname === '/faq' ? styles.mobileActive : ''}`}>{t('faq')}</Link>
          <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className={`${styles.mobileNavLink} ${pathname === '/contact' ? styles.mobileActive : ''}`}>{t('contact')}</Link>
        </nav>
        
        <div className={styles.mobileActions}>
          <Link href="/fleet" onClick={() => setIsMobileMenuOpen(false)} className={styles.mobileBookNowBtn}>
            {t('bookNow')}
          </Link>
          <a
            href="https://api.whatsapp.com/send?phone=+393440513634"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mobileWhatsappBtn}
          >
            💬 Contattaci su WhatsApp
          </a>
          {!loading && (
            user ? (
              <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className={styles.mobileUserBtn}>
                 {t('myBookings')}
              </Link>
            ) : (
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className={styles.mobileLoginBtn}>{t('login')}</Link>
            )
          )}
        </div>
      </div>
    </header>
  );
}
