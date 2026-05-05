import {getTranslations} from 'next-intl/server';
import React, {Suspense} from 'react';
import FleetResults from '@/components/FleetResults';
import SearchWidget from '@/components/SearchWidget';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({locale, namespace: 'SEO.fleet'});
  return {
    title: t('title'),
    description: t('description')
  };
}

export default async function FleetPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('Fleet');

  return (
    <main>
      <div className="page-hero">
        <h1>{t('title')}</h1>
        <p>{t('subtitle')}</p>
      </div>

      <div className="section">
        {/* Search Widget at top of fleet page */}
        <SearchWidget locale={locale} />

        {/* API-driven results (shown when search params in URL) */}
        <Suspense fallback={<div style={{ textAlign: 'center', padding: '40px' }}>{t('loading')}</div>}>
          <FleetResults />
        </Suspense>
      </div>
    </main>
  );
}
