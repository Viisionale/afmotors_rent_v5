import React from 'react';

import {getTranslations} from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({locale, namespace: 'SEO.privacy'});
  return {
    title: t('title'),
    description: t('description')
  };
}

export default async function PrivacyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isIt = locale === 'it';
  
  return (
    <main>
      <div className="page-hero">
        <h1>{isIt ? 'Privacy e Cookie Policy' : 'Privacy and Cookie Policy'}</h1>
        <p>{isIt ? 'Informativa sul trattamento dei dati personali' : 'Information on the processing of personal data'}</p>
      </div>
      <div className="section" style={{ maxWidth: '900px', margin: '0 auto', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
        
        <h2 style={{ color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>
          {isIt ? '1. Titolare del Trattamento' : '1. Data Controller'}
        </h2>
        <p>
          {isIt 
            ? "Il Titolare del Trattamento dei dati è AF Motors s.r.l., con sede legale in Viale Monastir Km. 8.500, 09028 Sestu (CA), Italia."
            : "The Data Controller is AF Motors s.r.l., with registered office at Viale Monastir Km. 8.500, 09028 Sestu (CA), Italy."}
        </p>

        <h2 style={{ color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>
          {isIt ? '2. Finalità del Trattamento' : '2. Purposes of the Processing'}
        </h2>
        <p>
          {isIt 
            ? "I tuoi dati personali sono trattati esclusivamente per le seguenti finalità: gestione amministrativa e operativa della prenotazione del veicolo, gestione di eventuali danni o sinistri stradali, e per l'invio di comunicazioni promozionali solo previo tuo esplicito consenso."
            : "Your personal data is processed exclusively for the following purposes: administrative and operational management of vehicle reservations, management of any vehicle damage or road accidents, and for sending promotional communications only with your explicit consent."}
        </p>

        <h2 style={{ color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>
          {isIt ? '3. Sicurezza e Localizzazione GPS' : '3. Security and GPS Tracking'}
        </h2>
        <p>
          {isIt 
            ? "Per garantire la tua sicurezza e tutelare il nostro patrimonio aziendale, alcuni veicoli possono essere dotati di dispositivi satellitari GPS. Questi sistemi sono utilizzati esclusivamente per finalità di prevenzione frodi, assistenza stradale e tutela antifurto."
            : "To ensure your safety and protect our corporate assets, some vehicles may be equipped with GPS satellite devices. These systems are used exclusively for fraud prevention, roadside assistance, and anti-theft protection."}
        </p>
        <p>
          {isIt 
            ? "I dati di posizione sono gestiti da società esterne specializzate nel settore telematico e vengono conservati in modo sicuro per un periodo massimo di 10 anni dalla fine del contratto di noleggio, come previsto dai termini di legge."
            : "Location data is managed by specialized external telematics companies and is securely stored for a maximum period of 10 years from the end of the rental contract, as required by law."}
        </p>

        <h2 style={{ color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>
          {isIt ? '4. Cookie Policy' : '4. Cookie Policy'}
        </h2>
        <p>
          {isIt 
            ? "Il nostro sito web utilizza cookie tecnici, che sono strettamente necessari per il corretto funzionamento della piattaforma e per la procedura di prenotazione."
            : "Our website uses technical cookies, which are strictly necessary for the proper functioning of the platform and the booking process."}
        </p>
        <p>
          {isIt 
            ? "Inoltre, utilizziamo cookie di terze parti (come Google Analytics, Stripe e servizi collegati) per ottimizzare e analizzare le funzionalità della piattaforma, nonché per garantire pagamenti sicuri. Puoi gestire le tue preferenze sui cookie tramite il banner di consenso (Humanity) presente sul sito."
            : "Additionally, we use third-party cookies (such as Google Analytics, Stripe, and related services) to optimize and analyze platform functionality, as well as to ensure secure payments. You can manage your cookie preferences through the consent banner (Humanity) available on the site."}
        </p>

      </div>
    </main>
  );
}
