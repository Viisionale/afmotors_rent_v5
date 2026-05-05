import {getTranslations} from 'next-intl/server';
import React from 'react';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({locale, namespace: 'SEO.about'});
  return {
    title: t('title'),
    description: t('description')
  };
}

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isIt = locale === 'it';
  const t = await getTranslations('About');
  
  return (
    <main>
      <div className="page-hero">
        <h1>{t('title')}</h1>
      </div>
      <div className="section">
        <div style={{ maxWidth: '800px', margin: '0 auto', fontSize: '1.125rem', lineHeight: '1.8' }}>
          <p style={{ marginBottom: '24px' }}>{t('description')}</p>
          
          <div style={{ background: 'var(--bg-secondary)', padding: '40px', borderRadius: '16px', marginTop: '48px', textAlign: 'center' }}>
            <h2 style={{ marginBottom: '24px', fontSize: '1.75rem', fontWeight: '800' }}>
              {isIt ? 'La Nostra Missione' : 'Our Mission'}
            </h2>
            <p style={{ margin: 0, fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: '1.25rem' }}>
              "{t('mission')}"
            </p>
          </div>

          <div style={{ marginTop: '64px', borderTop: '1px solid var(--border)', paddingTop: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <a href="https://afmotors.it" target="_blank" rel="noopener noreferrer">
              <img src="https://afmotors.it/wp-content/uploads/2024/11/logo-af-motors.png" alt="AF Motors" style={{ height: '60px', marginBottom: '24px' }} />
            </a>
            <h2 style={{ marginBottom: '16px', fontSize: '1.75rem', fontWeight: '800' }}>
              {isIt ? 'Parte del gruppo AF Motors' : 'Part of the AF Motors Group'}
            </h2>
            <p style={{ margin: 0, fontSize: '1.125rem' }}>
              {isIt
                ? 'AF Motors Rent è una divisione di afmotors.it, una delle più grandi concessionarie auto in Sardegna. Offriamo tutta l\'esperienza, i migliori brand automobilistici e un servizio di assistenza ufficiale per garantirti un noleggio sicuro e affidabile.'
                : 'AF Motors Rent is a division of afmotors.it, one of the largest car dealerships in Sardinia. We offer all the experience, the best automotive brands, and official service to guarantee you a safe and reliable rental.'}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
