import {getTranslations} from 'next-intl/server';
import React from 'react';
import styles from './page.module.css';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({locale, namespace: 'SEO.faq'});
  return {
    title: t('title'),
    description: t('description')
  };
}

export default async function FAQPage() {
  const t = await getTranslations('FAQ');

  const faqs = [
    { q: t('q1'), a: t('a1') },
    { q: t('q2'), a: t('a2') },
    { q: t('q3'), a: t('a3') },
    { q: t('q4'), a: t('a4') },
    { q: t('q5'), a: t('a5') },
    { q: t('q6'), a: t('a6') },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a
      }
    }))
  };

  return (
    <main>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="page-hero">
        <h1>{t('title')}</h1>
        <p>{t('subtitle')}</p>
      </div>
      <div className="section">
        <div className={styles.faqList}>
          {faqs.map((faq, i) => (
            <details key={i} className={styles.faqItem}>
              <summary className={styles.question}>{faq.q}</summary>
              <p className={styles.answer}>{faq.a}</p>
            </details>
          ))}
        </div>
      </div>
    </main>
  );
}
