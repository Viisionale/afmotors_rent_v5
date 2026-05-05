"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/components/AuthContext';
import styles from './page.module.css';

export default function PreCheckinPage({ params }: { params: Promise<{ locale: string, id: string }> }) {
  const { locale, id } = React.use(params);
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const t = useTranslations('Dashboard');

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: '',
    phoneNumb1: '',
    birthDate: '',
    birthPlace: '',
    birthProv: '',
    birthNation: 'ITALIA',
    documentNumb: '',
    releaseDate: '',
    expiryDate: '',
    issueBy: 'U.C.O',
    street: '',
    city: '',
    postalCode: '',
    province: '',
    national: 'ITALIA',
  });

  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/${locale}/login`);
    } else if (user) {
      setFormData(f => ({
        ...f,
        name: user.firstName || '',
        surname: user.lastName || '',
        email: user.email || '',
        phoneNumb1: user.phoneNumber || '',
      }));
    }
  }, [user, authLoading, router, locale]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        data.append(key, val);
      });
      data.append('isPhysicalPerson', 'true');
      data.append('document', 'PATENTE');

      if (file) {
        data.append('file', file);
      }

      const res = await fetch(`/api/bookings/${id}/driver`, {
        method: 'POST',
        body: data,
      });

      if (!res.ok) {
        throw new Error('Errore durante l\'invio dei dati');
      }

      setSuccess(true);
      setTimeout(() => {
        router.push(`/${locale}/dashboard`);
      }, 3000);
    } catch (err) {
      setErrorMsg(String(err));
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) return <div className={styles.loadingContainer}>{locale === 'it' ? 'Caricamento...' : 'Loading...'}</div>;

  if (success) {
    return (
      <main className={styles.mainContainer}>
        <div className={styles.successCard}>
          <div className={styles.successIcon}>✅</div>
          <h1>{locale === 'it' ? 'Pre-Check-in Completato!' : 'Pre-Check-in Completed!'}</h1>
          <p>{locale === 'it' ? 'I tuoi documenti sono stati inviati con successo. Verrai reindirizzato alla dashboard.' : 'Your documents have been submitted successfully. You will be redirected to the dashboard.'}</p>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.mainContainer}>
      <div className={styles.formWrapper}>
        <div className={styles.header}>
          <h1>{locale === 'it' ? 'Completa Pre-Check-in' : 'Complete Pre-Check-in'}</h1>
          <p>{locale === 'it' ? `Prenotazione #${id}` : `Booking #${id}`}</p>
        </div>

        {errorMsg && <div className={styles.errorMsg}>{errorMsg}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          
          <div className={styles.section}>
            <h2>{locale === 'it' ? 'Dati Personali' : 'Personal Details'}</h2>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label>{locale === 'it' ? 'Nome' : 'First Name'}</label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label>{locale === 'it' ? 'Cognome' : 'Last Name'}</label>
                <input required type="text" name="surname" value={formData.surname} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label>{locale === 'it' ? 'Data di Nascita' : 'Date of Birth'}</label>
                <input required type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label>{locale === 'it' ? 'Luogo di Nascita' : 'Place of Birth'}</label>
                <input required type="text" name="birthPlace" value={formData.birthPlace} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label>{locale === 'it' ? 'Provincia di Nascita (Sigla)' : 'Birth Province'}</label>
                <input required type="text" name="birthProv" maxLength={2} placeholder="MI" value={formData.birthProv} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label>{locale === 'it' ? 'Nazione di Nascita' : 'Birth Nation'}</label>
                <input required type="text" name="birthNation" value={formData.birthNation} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className={styles.section}>
            <h2>{locale === 'it' ? 'Dati Patente' : 'Driving License Details'}</h2>
            <div className={styles.grid}>
              <div className={styles.field}>
                <label>{locale === 'it' ? 'Numero Patente' : 'License Number'}</label>
                <input required type="text" name="documentNumb" value={formData.documentNumb} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label>{locale === 'it' ? 'Rilasciata da' : 'Issued By'}</label>
                <input required type="text" name="issueBy" placeholder="Es: M.C.T.C" value={formData.issueBy} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label>{locale === 'it' ? 'Data Rilascio' : 'Issue Date'}</label>
                <input required type="date" name="releaseDate" value={formData.releaseDate} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label>{locale === 'it' ? 'Data Scadenza' : 'Expiry Date'}</label>
                <input required type="date" name="expiryDate" value={formData.expiryDate} onChange={handleChange} />
              </div>
            </div>
            <div className={styles.fieldFull}>
              <label>{locale === 'it' ? 'Carica Foto Patente (Opzionale ma consigliato)' : 'Upload License Photo (Recommended)'}</label>
              <input type="file" accept="image/*,.pdf" onChange={handleFileChange} className={styles.fileInput} />
            </div>
          </div>

          <div className={styles.section}>
            <h2>{locale === 'it' ? 'Residenza e Contatti' : 'Address & Contacts'}</h2>
            <div className={styles.grid}>
              <div className={styles.fieldFull}>
                <label>{locale === 'it' ? 'Indirizzo (Via/Piazza, Numero)' : 'Street Address'}</label>
                <input required type="text" name="street" value={formData.street} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label>{locale === 'it' ? 'Città' : 'City'}</label>
                <input required type="text" name="city" value={formData.city} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label>{locale === 'it' ? 'CAP' : 'Postal Code'}</label>
                <input required type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label>{locale === 'it' ? 'Provincia (Sigla)' : 'Province'}</label>
                <input required type="text" name="province" maxLength={2} placeholder="MI" value={formData.province} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label>{locale === 'it' ? 'Nazione' : 'Nation'}</label>
                <input required type="text" name="national" value={formData.national} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label>Email</label>
                <input required type="email" name="email" value={formData.email} onChange={handleChange} />
              </div>
              <div className={styles.field}>
                <label>{locale === 'it' ? 'Telefono' : 'Phone'}</label>
                <input required type="tel" name="phoneNumb1" value={formData.phoneNumb1} onChange={handleChange} />
              </div>
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelBtn} onClick={() => router.back()}>
              {locale === 'it' ? 'Annulla' : 'Cancel'}
            </button>
            <button type="submit" className={styles.submitBtn} disabled={loading}>
              {loading ? (locale === 'it' ? 'Invio in corso...' : 'Submitting...') : (locale === 'it' ? 'Invia Dati' : 'Submit')}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
