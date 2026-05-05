import {getTranslations} from 'next-intl/server';
import React from 'react';
import TrustIndexWidget from '@/components/TrustIndexWidget';
import styles from './page.module.css';

export default async function HowItWorksPage() {
  const t = await getTranslations('HowItWorks');

  const steps = [
    { icon: '🔍', title: t('step1Title'), desc: t('step1Desc') },
    { icon: '💳', title: t('step2Title'), desc: t('step2Desc') },
    { icon: '🚗', title: t('step3Title'), desc: t('step3Desc') },
  ];

  return (
    <main>
      <div className="page-hero">
        <h1>{t('title')}</h1>
        <p>{t('subtitle')}</p>
      </div>
      <div className="section">
        <div className={styles.timeline}>
          {steps.map((step, i) => (
            <div key={i} className={styles.timelineItem}>
              <div className={styles.number}>{i + 1}</div>
              <div className={styles.content}>
                <div className={styles.icon}>{step.icon}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="section" style={{ background: 'var(--bg-secondary)', paddingTop: '60px', paddingBottom: '60px' }}>
        <TrustIndexWidget src="https://cdn.trustindex.io/loader.js?e419d99704e65251d786fd54aab" />
      </div>
    </main>
  );
}
