"use client";

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import styles from './page.module.css';

export default function ContactPage() {
  const locale = useLocale();
  const isIt = locale === 'it';

  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setResult(null);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ type: 'ok', text: isIt ? 'Messaggio inviato con successo!' : 'Message sent successfully!' });
        setForm({ name: '', email: '', phone: '', subject: '', message: '' });
      } else {
        setResult({ type: 'err', text: data.error || (isIt ? 'Invio fallito' : 'Send failed') });
      }
    } catch {
      setResult({ type: 'err', text: isIt ? 'Errore di connessione' : 'Connection error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <main>
      <div className="page-hero">
        <h1>{isIt ? 'Contattaci' : 'Contact Us'}</h1>
        <p>{isIt ? 'Siamo qui per aiutarti' : 'We are here to help'}</p>
      </div>
      <div className="section">
        <div className={styles.grid}>
          {/* Location & Info */}
          <div className={styles.infoCol}>
            <div className={styles.infoCard}>
              <h3>📍 {isIt ? 'Sedi' : 'Locations'}</h3>
              <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>AF Motors Rent - Aeroporto Cagliari</p>
              <p style={{ marginBottom: '12px' }}>Arrivi Aeroporto di Cagliari Elmas 'Mario Mameli'</p>
              
              <p style={{ fontWeight: 'bold', marginBottom: '4px' }}>AF Motors Rent - Sestu</p>
              <p>Viale Monastir km 8,5 Sestu (CA)</p>
            </div>
            <div className={styles.infoCard}>
              <h3>📞 {isIt ? 'Contatti' : 'Contact'}</h3>
              <p>📞 +39 344 051 3634</p>
              <p>✉️ info@afmotorsrent.it</p>
            </div>
            <div className={styles.infoCard}>
              <h3>🕐 {isIt ? 'Orari' : 'Hours'}</h3>
              <p>{isIt ? 'Lunedì – Sabato: 08:00 – 20:00' : 'Monday – Saturday: 08:00 – 20:00'}</p>
              <p>{isIt ? 'Domenica: 08:00 – 20:00' : 'Sunday: 08:00 – 20:00'}</p>
            </div>
            <div className={styles.mapWrap}>
              <iframe
                src="https://maps.google.com/maps?q=AF+Motors+Rent+Via+dei+Trasvolatori,+09067+Elmas+CA&t=&z=15&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="220"
                style={{border:0,borderRadius:'12px'}}
                allowFullScreen
                loading="lazy"
              ></iframe>
            </div>
          </div>

          {/* Contact Form */}
          <div className={styles.formCol}>
            <h2>{isIt ? 'Inviaci un messaggio' : 'Send us a message'}</h2>

            {result && (
              <div className={result.type === 'ok' ? styles.successMsg : styles.errorMsg}>
                {result.text}
              </div>
            )}

            <form className={styles.form} onSubmit={handleSubmit}>
              <div>
                <label className="input-label">{isIt ? 'Nome' : 'Name'}</label>
                <input className="input" type="text" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="input-label">Email</label>
                <input className="input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="input-label">{isIt ? 'Telefono (opzionale)' : 'Phone (optional)'}</label>
                <input className="input" type="tel" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label className="input-label">{isIt ? 'Oggetto' : 'Subject'}</label>
                <input className="input" type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
              </div>
              <div>
                <label className="input-label">{isIt ? 'Messaggio' : 'Message'}</label>
                <textarea className="input" rows={5} required style={{resize:'vertical'}} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })}></textarea>
              </div>
              <button type="submit" className="btn-primary" style={{width:'100%'}} disabled={sending}>
                {sending ? (isIt ? 'Invio in corso...' : 'Sending...') : (isIt ? 'Invia messaggio' : 'Send Message')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
