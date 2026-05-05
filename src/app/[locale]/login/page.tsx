"use client";

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/AuthContext';
import { Link } from '@/i18n/routing';
import styles from './page.module.css';

export default function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = React.use(params);
  const t = useTranslations('Login');
  const router = useRouter();
  const { user, login, register, loading: authLoading } = useAuth();

  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!authLoading && user) {
      router.replace(`/${locale}/dashboard`);
    }
  }, [user, authLoading, router, locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isRegister && password !== confirmPassword) {
      setError(t('errorPasswordMismatch'));
      return;
    }

    setSubmitting(true);

    try {
      if (isRegister) {
        await register(email, password);
        setSuccess(t('successRegistration'));
        router.push(`/${locale}/dashboard`);
      } else {
        await login(email, password);
        router.push(`/${locale}/dashboard`);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '';
      const msgLower = msg.toLowerCase();
      if (msgLower.includes('already exist') || msgLower.includes('già esiste') || msgLower.includes('email already')) {
        setError('__ALREADY_EXISTS__');
      } else if (msgLower.includes('invalid') || msgLower.includes('credentials') || msgLower.includes('password')) {
        setError(t('errorInvalidCredentials'));
      } else {
        setError(msg || t('errorGeneric'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading) return null;

  return (
    <main className={styles.page}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.header}>
          <h1 className={styles.title}>{isRegister ? t('registerTitle') : t('title')}</h1>
          <p className={styles.subtitle}>{isRegister ? t('registerSubtitle') : t('subtitle')}</p>
        </div>

        {error === '__ALREADY_EXISTS__' ? (
          <div className={styles.infoBox}>
            <strong>📧 {t('errorEmailExists') || 'Account already exists'}.</strong><br />
            <span>{t('errorEmailExistsHint') || 'Use this email to log in, or '}  </span>
            <button type="button" className={styles.toggleBtn} onClick={() => { setIsRegister(false); setError(''); }}>
              {t('signIn') || 'sign in'}
            </button>.
          </div>
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : null}
        {success && <div className={styles.success}>{success}</div>}

        <div className={styles.field}>
          <label className="input-label">{t('email')}</label>
          <input
            className="input"
            type="email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            autoComplete="email"
            id="login-email"
          />
        </div>

        <div className={styles.field}>
          <label className="input-label">{t('password')}</label>
          <input
            className="input"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={e => setPassword(e.target.value)}
            autoComplete={isRegister ? 'new-password' : 'current-password'}
            id="login-password"
          />
        </div>

        {isRegister && (
          <div className={styles.field}>
            <label className="input-label">{t('confirmPassword')}</label>
            <input
              className="input"
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              id="login-confirm-password"
            />
          </div>
        )}

        <button
          type="submit"
          className={`btn-primary ${styles.submitBtn}`}
          disabled={submitting}
          id="login-submit"
        >
          {submitting ? t('loading') : isRegister ? t('register') : t('login')}
        </button>

        <div className={styles.toggle}>
          <span>{isRegister ? t('haveAccount') : t('noAccount')}</span>
          {' '}
          <button
            type="button"
            className={styles.toggleBtn}
            onClick={() => { setIsRegister(!isRegister); setError(''); setSuccess(''); }}
            id="login-toggle"
          >
            {isRegister ? t('signIn') : t('signUp')}
          </button>
        </div>

        {!isRegister && (
          <div className={styles.forgot}>
            <Link href="/forgot-password" className={styles.forgotLink}>
              {t('forgotPassword') || 'Forgot password?'}
            </Link>
          </div>
        )}
      </form>
    </main>
  );
}
