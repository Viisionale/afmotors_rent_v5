"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useLocale } from 'next-intl';
import { useSearchParams, useRouter } from 'next/navigation';
import { Link } from '@/i18n/routing';
import styles from '../forgot-password/page.module.css';

function ResetContent() {
  const locale = useLocale();
  const isIt = locale === 'it';
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);

  // Validate token expiry client-side as a quick check
  useEffect(() => {
    if (!token) { setTokenValid(false); return; }
    try {
      const decoded = JSON.parse(atob(token.replace(/-/g, '+').replace(/_/g, '/')));
      setTokenValid(Date.now() < decoded.exp);
    } catch {
      setTokenValid(false);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError(isIt ? 'Le password non coincidono.' : 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError(isIt ? 'La password deve avere almeno 6 caratteri.' : 'Password must be at least 6 characters.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password }),
      });
      const data = await res.json();
      if (res.ok) {
        setDone(true);
        setTimeout(() => router.push(`/${locale}/dashboard`), 3000);
      } else {
        setError(data.error || (isIt ? 'Errore, riprova.' : 'Error, please try again.'));
      }
    } catch {
      setError(isIt ? 'Errore di connessione.' : 'Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  if (tokenValid === false) {
    return (
      <div className={styles.form}>
        <div className={styles.header}>
          <div className={styles.icon}>⚠️</div>
          <h1 className={styles.title}>{isIt ? 'Link non valido' : 'Invalid Link'}</h1>
          <p className={styles.subtitle}>
            {isIt
              ? 'Questo link è scaduto o non valido. Richiedi un nuovo link.'
              : 'This reset link has expired or is invalid. Please request a new one.'}
          </p>
        </div>
        <Link href="/forgot-password" className="btn-primary" style={{ display: 'inline-block', marginTop: 16 }}>
          {isIt ? 'Nuovo link' : 'Request new link'}
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className={styles.form}>
        <div className={styles.header}>
          <div className={styles.successIcon} style={{ fontSize: '2.5rem', marginBottom: 16 }}>✅</div>
          <h1 className={styles.title}>{isIt ? 'Password aggiornata!' : 'Password Updated!'}</h1>
          <p className={styles.subtitle}>{isIt ? 'Accesso automatico in corso...' : 'Logging you in automatically...'}</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles.header}>
        <div className={styles.icon}>🔐</div>
        <h1 className={styles.title}>{isIt ? 'Nuova password' : 'New Password'}</h1>
        <p className={styles.subtitle}>
          {isIt ? 'Scegli una nuova password sicura.' : 'Choose a new secure password.'}
        </p>
      </div>

      {error && <div className={styles.error}>{error}</div>}

      <div className={styles.field}>
        <label className="input-label">{isIt ? 'Nuova password' : 'New Password'}</label>
        <input
          className="input"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
          id="reset-password"
        />
      </div>

      <div className={styles.field}>
        <label className="input-label">{isIt ? 'Conferma password' : 'Confirm Password'}</label>
        <input
          className="input"
          type="password"
          required
          minLength={6}
          value={confirm}
          onChange={e => setConfirm(e.target.value)}
          autoComplete="new-password"
          id="reset-confirm"
        />
      </div>

      <button
        type="submit"
        className={`btn-primary ${styles.submitBtn}`}
        disabled={submitting || !token}
        id="reset-submit"
      >
        {submitting ? (isIt ? 'Aggiornamento...' : 'Updating...') : (isIt ? 'Aggiorna password' : 'Update Password')}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className={styles.page}>
      <Suspense fallback={<div style={{ padding: 48, textAlign: 'center' }}>Loading...</div>}>
        <ResetContent />
      </Suspense>
    </main>
  );
}
