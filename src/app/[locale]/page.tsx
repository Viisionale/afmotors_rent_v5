import {getTranslations} from 'next-intl/server';
import React from 'react';
import TrustIndexWidget from '@/components/TrustIndexWidget';
import SearchWidget from '@/components/SearchWidget';
import FeaturedFleet from '@/components/FeaturedFleet';
import {Link} from '@/i18n/routing';
import {vehicles, reviews, protectionPlans} from '@/lib/vehicles';
import styles from './page.module.css';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations('Hero');
  const tFleet = await getTranslations('Fleet');
  const tHow = await getTranslations('HowItWorks');
  const tProtect = await getTranslations('ProtectionPlans');
  const tPlanner = await getTranslations('TravelPlanner');
  const isIt = locale === 'it';

  const featured = vehicles.slice(0, 6);
  const basePlan = protectionPlans.base;
  const topPlan = protectionPlans.top;

  return (
    <main>
      {/* ── Hero ── */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <img
            src="/images/branding/AF-Motors-Rent-Logo-2.svg"
            alt="AF Motors Rent"
            className={styles.heroLogo}
            width={280}
            height={90}
          />
          <h1 className={styles.heroTitle}>{t('title')}</h1>
          <p className={styles.heroSubtitle}>{t('subtitle')}</p>
          <SearchWidget locale={locale} />
          <div className={styles.trustBadges}>
            <span>⭐ 4.9/5 — 156 {isIt ? 'recensioni' : 'reviews'}</span>
            <span>🚗 {isIt ? 'Flotta nuova 2025' : 'New 2025 Fleet'}</span>
            <span>✈️ {isIt ? 'Ritiro Aeroporto' : 'Airport Pickup'}</span>
          </div>
        </div>
      </section>

      {/* ── Featured Fleet ── */}
      <section className="section">
        <div className="section-header" style={{display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:'16px'}}>
          <div>
            <h2 className="section-title">{tFleet('title')}</h2>
            <p className="section-subtitle">{tFleet('subtitle')}</p>
          </div>
          <Link href="/fleet" className="btn-outline">{isIt ? 'Vedi Tutta la Flotta' : 'View Full Fleet'} →</Link>
        </div>
        <FeaturedFleet vehicles={featured} perDay={tFleet('perDay')} />
      </section>

      {/* ── Protection Plans ── */}
      <section style={{background:'var(--bg-secondary)'}}>
        <div className="section">
          <div className="section-header" style={{textAlign:'center'}}>
            <h2 className="section-title">{isIt ? 'Piani di Protezione' : 'Protection Plans'}</h2>
            <p className="section-subtitle" style={{margin:'0 auto'}}>{isIt ? 'Scegli il pacchetto protezione per un noleggio senza pensieri e riduci o elimina franchigie e deposito.' : 'Choose your protection package for a worry-free rental and reduce or eliminate excess and deposit.'}</p>
          </div>
          <div className={styles.plans}>
            {/* Base Plan */}
            <div className={styles.planCard}>
              <h3>{tProtect('baseTitle')}</h3>
              <div className={styles.planPrice}>
                <span className={styles.planAmount}>€0</span>
                <span>{isIt ? '/giorno' : '/day'}</span>
              </div>
              <p className={styles.planDesc}>{tProtect('baseDesc')}</p>
              <div className={styles.planDeposit}>
                {isIt ? 'Deposito' : 'Deposit'}: <strong>€{basePlan.deposit}</strong>
              </div>
              <ul className={styles.planFeatures}>
                {(isIt ? basePlan.included : basePlan.includedEn).map((item, i) => (
                  <li key={i}>✓ {item}</li>
                ))}
              </ul>
            </div>

            {/* Top Plan */}
            <div className={`${styles.planCard} ${styles.planFeatured}`}>
              <div className={styles.planBadge}>{isIt ? 'Consigliato' : 'Recommended'}</div>
              <h3>{tProtect('topTitle')}</h3>
              <div className={styles.planPrice}>
                <span className={styles.planAmount}>€{topPlan.protectionCost}</span>
                <span>{isIt ? '/giorno' : '/day'}</span>
              </div>
              <p className={styles.planDesc}>{tProtect('topDesc')}</p>
              <div className={styles.planDeposit}>
                {isIt ? 'Deposito' : 'Deposit'}: <strong>€{topPlan.deposit}</strong>
              </div>
              <ul className={styles.planFeatures}>
                {(isIt ? topPlan.included : topPlan.includedEn).map((item, i) => (
                  <li key={i}>✓ {item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="section">
        <div className="section-header" style={{textAlign:'center'}}>
          <h2 className="section-title">{tHow('title')}</h2>
          <p className="section-subtitle" style={{margin:'0 auto'}}>{tHow('subtitle')}</p>
        </div>
        <div className={styles.steps}>
          <div className={styles.step}>
            <div className={styles.stepIcon}>🔍</div>
            <h3>{tHow('step1Title')}</h3>
            <p>{tHow('step1Desc')}</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepIcon}>💳</div>
            <h3>{tHow('step2Title')}</h3>
            <p>{tHow('step2Desc')}</p>
          </div>
          <div className={styles.step}>
            <div className={styles.stepIcon}>🚗</div>
            <h3>{tHow('step3Title')}</h3>
            <p>{tHow('step3Desc')}</p>
          </div>
        </div>
      </section>

      {/* ── Reviews ── */}
      <section style={{background:'var(--bg-secondary)'}}>
        <div className="section">
          <div className="section-header" style={{textAlign:'center'}}>
            <h2 className="section-title">⭐ {isIt ? 'Le recensioni dei nostri clienti' : 'What our Customers Say'}</h2>
            <p className="section-subtitle" style={{margin:'0 auto'}}>
              {isIt ? 'ECCELLENTE — 4.9/5 su Google (156 recensioni)' : 'EXCELLENT — 4.9/5 on Google (156 reviews)'}
            </p>
          </div>
          <div style={{ marginTop: '30px' }}>
            <TrustIndexWidget src="https://cdn.trustindex.io/loader.js?e419d99704e65251d786fd54aab" />
          </div>
        </div>
      </section>

      {/* ── Travel Planner CTA ── */}
      <section style={{background:'var(--primary)', color:'white', textAlign:'center'}}>
        <div className="section" style={{padding: '80px 20px'}}>
          <h2 style={{fontSize:'2rem', marginBottom:'24px', lineHeight:'1.4'}}>{tPlanner('cta')}</h2>
          <a href="https://afmotorsrent.it/travel-planner/" className="btn" style={{background:'white', color:'var(--primary)', fontSize:'1.1rem', padding:'14px 28px', display: 'inline-block', textDecoration: 'none', fontWeight: 'bold', borderRadius: '24px'}}>
            {tPlanner('button')}
          </a>
        </div>
      </section>

      {/* ── Included ── */}
      <section className="section">
        <div className="section-header" style={{textAlign:'center'}}>
          <h2 className="section-title">{isIt ? 'Sempre incluso nel noleggio' : 'Always included in your rental'}</h2>
        </div>
        <div className={styles.includedGrid}>
          <div className={styles.includedItem}>
            <span className={styles.includedIcon}>🛡️</span>
            <h4>{isIt ? 'Assicurazione RCA' : 'RCA Insurance'}</h4>
          </div>
          <div className={styles.includedItem}>
            <span className={styles.includedIcon}>🛣️</span>
            <h4>{isIt ? 'Chilometraggio illimitato' : 'Unlimited Mileage'}</h4>
          </div>
          <div className={styles.includedItem}>
            <span className={styles.includedIcon}>✈️</span>
            <h4>{isIt ? 'Ritiro in Aeroporto' : 'Airport Pickup'}</h4>
          </div>
          <div className={styles.includedItem}>
            <span className={styles.includedIcon}>📱</span>
            <h4>{isIt ? 'Supporto WhatsApp' : 'WhatsApp Support'}</h4>
          </div>
          <div className={styles.includedItem}>
            <span className={styles.includedIcon}>❌</span>
            <h4>{isIt ? 'Nessun costo nascosto' : 'No Hidden Fees'}</h4>
          </div>
          <div className={styles.includedItem}>
            <span className={styles.includedIcon}>🆓</span>
            <h4>{isIt ? 'Cancellazione gratuita 48h' : 'Free cancellation 48h'}</h4>
          </div>
        </div>
      </section>

      {/* ── Location ── */}
      <section style={{background:'var(--bg-secondary)'}}>
        <div className="section" style={{textAlign:'center'}}>
          <h2 className="section-title">📍 {isIt ? 'Dove Siamo' : 'Our Locations'}</h2>
          <div className={styles.locations}>
            <div className={styles.locCard}>
              <h4>✈️ Aeroporto di Cagliari Elmas</h4>
              <p>Via dei Trasvolatori, 09067 Elmas CA</p>
            </div>
            <div className={styles.locCard}>
              <h4>🏢 AF Motors Rent – Sestu</h4>
              <p>Viale Monastir km 8,5 Sestu (CA)</p>
            </div>
          </div>
          <p style={{color:'var(--text-secondary)',marginBottom:'24px',marginTop:'16px'}}>
            {isIt ? 'Lun – Dom: 08:00 – 20:00' : 'Mon – Sun: 08:00 – 20:00'}
          </p>
          <div className={styles.mapContainer}>
            <iframe
              src="https://maps.google.com/maps?q=AF+Motors+Rent+Via+dei+Trasvolatori,+09067+Elmas+CA&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="400"
              style={{border:0,borderRadius:'16px'}}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </div>
      </section>
    </main>
  );
}
