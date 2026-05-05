"use client";

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { Link } from '@/i18n/routing';
import styles from './page.module.css';

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const isIt = locale === 'it';

  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (res.ok) {
        setSent(true);
      } else {
        setError(data.error || (isIt ? 'Errore, riprova.' : 'Error, please try again.'));
      }
    } catch {
      setError(isIt ? 'Errore di connessione.' : 'Connection error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className={styles.page}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.header}>
          <div className={styles.icon}>🔑</div>
          <h1 className={styles.title}>
            {isIt ? 'Password dimenticata?' : 'Forgot your password?'}
          </h1>
          <p className={styles.subtitle}>
            {isIt
              ? 'Inserisci la tua email e ti invieremo un link per reimpostarla.'
              : 'Enter your email and we\'ll send you a reset link.'}
          </p>
        </div>

        {sent ? (
          <div className={styles.successBox}>
            <div className={styles.successIcon}>✉️</div>
            <h2>
              {isIt ? 'Email inviata!' : 'Email sent!'}
            </h2>
            <p>
              {isIt
                ? `Controlla ${email} — riceverai il link entro pochi minuti.`
                : `Check ${email} — you'll receive the reset link shortly.`}
            </p>
            <p className={styles.spamNote}>
              {isIt ? 'Controlla anche la cartella spam.' : 'Check your spam folder too.'}
            </p>
            <Link href="/login" className="btn-primary" style={{ marginTop: 24, display: 'inline-block' }}>
              {isIt ? 'Torna al login' : 'Back to Login'}
            </Link>
          </div>
        ) : (
          <>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.field}>
              <label className="input-label">Email</label>
              <input
                className="input"
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
                placeholder={isIt ? 'La tua email' : 'Your email'}
                id="forgot-email"
              />
            </div>

            <button
              type="submit"
              className={`btn-primary ${styles.submitBtn}`}
              disabled={submitting}
              id="forgot-submit"
            >
              {submitting
                ? (isIt ? 'Invio in corso...' : 'Sending...')
                : (isIt ? 'Invia link di reset' : 'Send reset link')}
            </button>

            <div className={styles.back}>
              <Link href="/login" className={styles.backLink}>
                ← {isIt ? 'Torna al login' : 'Back to Login'}
              </Link>
            </div>
          </>
        )}
      </form>
    </main>
  );
}
