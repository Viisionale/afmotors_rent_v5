"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {useTranslations, useLocale} from 'next-intl';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import styles from './CheckoutForm.module.css';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

// ── Types ──

interface ApiOptional {
  equipType: string;
  description: string;
  amount: number;
  currency: string;
  taxInclusive: boolean;
  isMultipliable: boolean;
  image: string | null;
  quantity: number;
}

interface ApiVehicle {
  id: string;
  groupId: number;
  quotationRefId: number;
  name: string;
  imageUrl: string;
  rateTotalAmount: number;
  dailyRate: number;
  seats: number;
  category: string;
  sipp: string;
  includedOptionals: { equipType: string; description: string; amount: number }[];
  purchasableOptionals: ApiOptional[];
}

interface InsurancePlan {
  Id?: number;
  Description: string;
  Amount: string | number;
  isRecommended: boolean;
  Specification: string[];
  bookingText?: Record<string, string>;
}

interface PrivacyTerms {
  privacyFileUrl: string;
  conditionFileUrl: string;
  conditionText: string;
}

// ── Insurance EquipType patterns (to separate from extras) ──
const INSURANCE_EQUIP_PATTERNS = ['FK', 'KASKO', 'ASS', 'COP CRIS', 'FKCB', 'FKIB', 'FKP', 'FKG'];

function isInsuranceOptional(equipType: string): boolean {
  const upper = equipType.toUpperCase();
  return INSURANCE_EQUIP_PATTERNS.some(pattern => upper.includes(pattern));
}

// ── Payment Form (inside Stripe Elements) ──

function PaymentForm({
  totalPrice,
  isIt,
  onBack,
  onSuccess,
  customerEmail,
  customerName,
  bookingMeta,
  locale,
}: {
  totalPrice: number;
  isIt: boolean;
  onBack: () => void;
  onSuccess: (data: Record<string, unknown>) => void;
  customerEmail: string;
  customerName: string;
  bookingMeta: Record<string, string>;
  locale: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setPaying(true);
    setPayError(null);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/${locale}/success`,
      },
      redirect: 'if_required',
    });

    if (error) {
      setPayError(error.message || (isIt ? 'Pagamento fallito' : 'Payment failed'));
      setPaying(false);
      return;
    }

    if (paymentIntent && paymentIntent.status === 'succeeded') {
      // Confirm booking on our server
      try {
        const res = await fetch('/api/checkout/confirm-booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            customerEmail,
            customerName,
            bookingData: {
              ...bookingMeta,
              quotationRefId: parseInt(bookingMeta.quotationRefId || '0', 10),
            },
          }),
        });
        const data = await res.json();
        onSuccess(data);
      } catch (err) {
        console.error('Booking confirm error:', err);
        // Payment succeeded even if booking call failed
        onSuccess({
          status: 'payment_success_booking_pending',
          paymentIntentId: paymentIntent.id,
        });
      }
    }

    setPaying(false);
  };

  return (
    <form onSubmit={handlePay}>
      <PaymentElement options={{ layout: 'tabs' }} />

      {payError && (
        <div className={styles.payError}>⚠️ {payError}</div>
      )}

      <div className={styles.actions} style={{ marginTop: '24px' }}>
        <button type="button" onClick={onBack} className="btn-outline" style={{ flex: '1' }} disabled={paying}>
          ← {isIt ? 'Indietro' : 'Back'}
        </button>
        <button type="submit" className="btn-primary" style={{ flex: '2' }} disabled={!stripe || paying}>
          {paying
            ? (isIt ? '⏳ Pagamento in corso...' : '⏳ Processing...')
            : `${isIt ? '🔒 Paga' : '🔒 Pay'} — €${totalPrice.toFixed(2)}`
          }
        </button>
      </div>
    </form>
  );
}

// ── Main CheckoutForm ──

export default function CheckoutForm({
  vehicleId, pickupDate, dropoffDate, pickupLocation, dropOffLocation, locale
}: {
  vehicleId: string; pickupDate: string; dropoffDate: string;
  pickupLocation: string; dropOffLocation: string; locale: string;
}) {
  const t = useTranslations('Checkout');
  const tProtect = useTranslations('ProtectionPlans');
  const currentLocale = useLocale();
  const router = useRouter();
  const isIt = currentLocale === 'it';

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [vehicle, setVehicle] = useState<ApiVehicle | null>(null);
  const [selectedOptionals, setSelectedOptionals] = useState<Record<string, number>>({});
  const [selectedProtection, setSelectedProtection] = useState<string>('base'); // 'base', 'plus', 'gold', etc.
  const [insurancePlans, setInsurancePlans] = useState<InsurancePlan[]>([]);
  const [insuranceLoading, setInsuranceLoading] = useState(false);
  const [privacyTerms, setPrivacyTerms] = useState<PrivacyTerms | null>(null);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', age: '25',
    flightNumber: '', requestInvoice: false,
    companyName: '', taxCode: '', vatNumber: '', sdiPec: '', country: 'ITALIA',
  });

  // Stripe
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const start = new Date(pickupDate);
  const end = new Date(dropoffDate);
  const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));

  // ── Fetch quotation ──
  useEffect(() => {
    setLoading(true);
    fetch('/api/quotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pickupDate,
        dropoffDate,
        pickupLocation,
        dropOffLocation,
        age: parseInt(formData.age) || 25,
      }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        }
        const vehicles = data.vehicles || [];
        const match = vehicles.find((v: ApiVehicle) => v.id === vehicleId) || vehicles[0];
        if (match) setVehicle(match);
      })
      .catch(err => console.error('Quotation fetch error:', err))
      .finally(() => setLoading(false));
  }, [pickupDate, dropoffDate, pickupLocation, dropOffLocation, vehicleId, formData.age]);

  // ── Fetch insurance plans when vehicle is loaded ──
  useEffect(() => {
    if (!vehicle) return;

    setInsuranceLoading(true);
    const groupCode = vehicle.sipp || vehicle.id;

    fetch('/api/booking/insurance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        group: groupCode,
        locationCode: pickupLocation,
        startDate: pickupDate,
        endDate: dropoffDate,
      }),
    })
      .then(r => r.json())
      .then(data => {
        const plans = data?.['Booking Insurance'] || [];
        setInsurancePlans(plans);
      })
      .catch(err => console.warn('Insurance fetch error:', err))
      .finally(() => setInsuranceLoading(false));
  }, [vehicle, pickupLocation, pickupDate, dropoffDate]);

  // ── Fetch privacy & terms ──
  useEffect(() => {
    fetch(`/api/booking/privacy-terms?language=${isIt ? 'it' : 'en'}`)
      .then(r => r.json())
      .then(data => setPrivacyTerms(data))
      .catch(err => console.warn('Privacy fetch error:', err));
  }, [isIt]);

  // ── Extras logic (exclude insurance items) ──
  const regularExtras = vehicle?.purchasableOptionals.filter(
    opt => !isInsuranceOptional(opt.equipType)
  ) || [];

  const toggleOptional = (equipType: string) => {
    setSelectedOptionals(prev => {
      const current = prev[equipType] || 0;
      return { ...prev, [equipType]: current > 0 ? 0 : 1 };
    });
  };

  const incrementOptional = (equipType: string) => {
    setSelectedOptionals(prev => ({
      ...prev,
      [equipType]: (prev[equipType] || 0) + 1,
    }));
  };

  const decrementOptional = (equipType: string) => {
    setSelectedOptionals(prev => ({
      ...prev,
      [equipType]: Math.max(0, (prev[equipType] || 0) - 1),
    }));
  };

  // ── Price calculation ──
  const rentalCost = vehicle?.rateTotalAmount || 0;

  const extrasTotal = regularExtras.reduce((sum, opt) => {
    const qty = selectedOptionals[opt.equipType] || 0;
    return sum + (opt.amount * qty);
  }, 0);

  const selectedPlan = insurancePlans.find(
    p => p.Description.toLowerCase().includes(selectedProtection)
  );
  const protectionCost = selectedPlan ? parseFloat(String(selectedPlan.Amount)) || 0 : 0;

  const totalPrice = rentalCost + extrasTotal + protectionCost;

  // ── Step 3: Create PaymentIntent when entering payment step ──
  const createPaymentIntent = useCallback(async () => {
    if (totalPrice <= 0) return;
    setPaymentLoading(true);

    try {
      const res = await fetch('/api/checkout/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: Math.round(totalPrice * 100), // cents
          currency: 'eur',
          customerEmail: formData.email,
          metadata: {
            customerEmail: formData.email,
          },
        }),
      });
      const data = await res.json();
      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      }
    } catch (err) {
      console.error('PaymentIntent error:', err);
    } finally {
      setPaymentLoading(false);
    }
  }, [totalPrice, formData, vehicle, pickupDate, dropoffDate, pickupLocation, dropOffLocation, selectedOptionals, selectedProtection]);

  const goToStep3 = () => {
    if (!privacyAccepted || !termsAccepted) return;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      alert(isIt ? 'Per favore inserisci un indirizzo email valido.' : 'Please enter a valid email address.');
      return;
    }
    setStep(3);
    createPaymentIntent();
  };

  const handlePaymentSuccess = (data: Record<string, unknown>) => {
    // Store booking data in sessionStorage for success page
    sessionStorage.setItem('bookingConfirmation', JSON.stringify({
      ...data,
      vehicle: vehicle ? { name: vehicle.name, imageUrl: vehicle.imageUrl, category: vehicle.category } : null,
      pickupDate,
      dropoffDate,
      pickupLocation,
      dropOffLocation,
      totalPrice,
      rentalCost,
      extrasTotal,
      protectionCost,
      protectionPlan: selectedProtection,
      driverName: `${formData.firstName} ${formData.lastName}`,
      driverEmail: formData.email,
      days,
    }));

    const ref = data.reservationCode || data.bookingId || data.paymentIntentId || '';
    router.push(`/${locale}/success?ref=${ref}`);
  };

  // ── Render ──

  return (
    <div className={styles.layout}>
      {/* Left: Form Steps */}
      <div className={styles.formSide}>
        <div className={styles.progress}>
          {[
            isIt ? '🛡️ Protezione & Extra' : '🛡️ Protection & Extras',
            isIt ? '👤 Dati conducente' : '👤 Driver Details',
            isIt ? '💳 Pagamento' : '💳 Payment',
          ].map((label, i) => (
            <div key={i} className={`${styles.progressStep} ${step >= i + 1 ? styles.active : ''} ${step === i + 1 ? styles.current : ''}`}>
              <div className={styles.dot}>{step > i + 1 ? '✓' : i + 1}</div>
              <span>{label}</span>
            </div>
          ))}
        </div>

        {/* ═══ STEP 1: Protection Plans + Extras ═══ */}
        {step === 1 && (
          <div className={styles.formStep}>
            <h2>{isIt ? '🛡️ Protezione e Optional' : '🛡️ Protection & Extras'}</h2>

            {/* ── Protection Plans ── */}
            <div className={styles.sectionTitle}>
              <h3>{isIt ? 'Piano di protezione' : 'Protection Plan'}</h3>
              <p className={styles.stepDescription}>
                {isIt ? 'Scegli il livello di copertura per il tuo noleggio' : 'Choose your coverage level'}
              </p>
            </div>

            {insuranceLoading ? (
              <div className={styles.loadingPulse}>{isIt ? 'Caricamento piani...' : 'Loading plans...'}</div>
            ) : insurancePlans.length > 0 ? (
              <div className={styles.protectionGrid}>
                {insurancePlans.map((plan, idx) => {
                  const planKey = plan.Description.toLowerCase().includes('gold') ? 'gold'
                    : plan.Description.toLowerCase().includes('plus') ? 'plus'
                    : 'base';
                  const isSelected = selectedProtection === planKey;
                  const amount = parseFloat(String(plan.Amount)) || 0;
                  const isIncluded = amount === 0;

                  return (
                    <div
                      key={idx}
                      className={`${styles.protectionCard} ${isSelected ? styles.protectionSelected : ''} ${plan.isRecommended ? styles.protectionRecommended : ''}`}
                      onClick={() => setSelectedProtection(planKey)}
                    >
                      {plan.isRecommended && (
                        <div className={styles.recommendedBadge}>{isIt ? '⭐ Consigliato' : '⭐ Recommended'}</div>
                      )}
                      <div className={styles.protRadio}>
                        <input type="radio" name="protection" checked={isSelected} onChange={() => setSelectedProtection(planKey)} />
                      </div>
                      <h4>{plan.Description}</h4>
                      <div className={styles.protPrice}>
                        {isIncluded
                          ? <span className={styles.freeTag}>{isIt ? 'INCLUSO' : 'INCLUDED'}</span>
                          : <span>€{amount.toFixed(2)}</span>
                        }
                      </div>
                      
                      {/* Highlight Top vs Base Description */}
                      <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '12px', lineHeight: '1.4' }}>
                        {planKey === 'base' ? tProtect('baseDesc') : tProtect('topDesc')}
                      </p>

                      {plan.Specification && plan.Specification.length > 0 && (
                        <ul className={styles.protFeatures} style={{ marginTop: '16px' }}>
                          {plan.Specification.map((spec, j) => (
                            <li key={j}>✅ {spec}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Fallback: show insurance optionals from quotation */
              <div className={styles.protectionGrid}>
                {vehicle?.purchasableOptionals
                  .filter(opt => isInsuranceOptional(opt.equipType))
                  .map((opt, idx) => {
                    const planKey = opt.equipType.toLowerCase();
                    const isSelected = selectedProtection === planKey;
                    return (
                      <div
                        key={idx}
                        className={`${styles.protectionCard} ${isSelected ? styles.protectionSelected : ''}`}
                        onClick={() => setSelectedProtection(planKey)}
                      >
                        <div className={styles.protRadio}>
                          <input type="radio" name="protection" checked={isSelected} onChange={() => setSelectedProtection(planKey)} />
                        </div>
                        {opt.image && <img src={opt.image} alt={opt.description} className={styles.protImage} />}
                        <h4>{opt.description}</h4>
                        <div className={styles.protPrice}>
                          {opt.amount === 0
                            ? <span className={styles.freeTag}>{isIt ? 'INCLUSO' : 'INCLUDED'}</span>
                            : <span>€{opt.amount.toFixed(2)}</span>
                          }
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}

            {/* ── Included optionals ── */}
            {vehicle?.includedOptionals && vehicle.includedOptionals.length > 0 && (
              <div className={styles.includedSection}>
                <h4>✅ {isIt ? 'Già incluso nel prezzo' : 'Already included'}</h4>
                {vehicle.includedOptionals.map((opt, i) => (
                  <div key={i} className={styles.includedItem}>
                    <span>{opt.description}</span>
                    <span className={styles.freeTag}>{isIt ? 'INCLUSO' : 'INCLUDED'}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ── Regular Extras ── */}
            {regularExtras.length > 0 && (
              <>
                <div className={styles.sectionTitle} style={{ marginTop: '32px' }}>
                  <h3>{isIt ? 'Optional aggiuntivi' : 'Additional Extras'}</h3>
                  <p className={styles.stepDescription}>
                    {isIt ? 'Aggiungi accessori al tuo noleggio' : 'Add accessories to your rental'}
                  </p>
                </div>

                {regularExtras.map(opt => {
                  const qty = selectedOptionals[opt.equipType] || 0;
                  const isSelected = qty > 0;

                  return (
                    <div key={opt.equipType} className={`${styles.extraCard} ${isSelected ? styles.extraSelected : ''}`}>
                      {opt.image && (
                        <img src={opt.image} alt={opt.description} className={styles.extraImage} />
                      )}
                      <div className={styles.extraInfo}>
                        <div className={styles.extraHeader}>
                          <strong>{opt.description}</strong>
                          <span className={styles.extraPrice}>
                            €{opt.amount.toFixed(2)}
                            {opt.taxInclusive && <small> {isIt ? 'IVA incl.' : 'VAT incl.'}</small>}
                          </span>
                        </div>

                        {opt.isMultipliable ? (
                          <div className={styles.quantityControl}>
                            <button type="button" onClick={() => decrementOptional(opt.equipType)} className={styles.qtyBtn}>−</button>
                            <span className={styles.qtyValue}>{qty}</span>
                            <button type="button" onClick={() => incrementOptional(opt.equipType)} className={styles.qtyBtn}>+</button>
                          </div>
                        ) : (
                          <label className={styles.toggleLabel}>
                            <input type="checkbox" checked={isSelected} onChange={() => toggleOptional(opt.equipType)} />
                            <span>{isIt ? 'Aggiungi' : 'Add'}</span>
                          </label>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}

            <div className={styles.actions}>
              <button type="button" onClick={() => setStep(2)} className="btn-primary" style={{ width: '100%' }}>
                {isIt ? 'Continua' : 'Continue'} →
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: Driver Details + Privacy ═══ */}
        {step === 2 && (
          <div className={styles.formStep}>
            <h2>{isIt ? '👤 Dati del conducente' : '👤 Driver Details'}</h2>
            <p className={styles.stepDescription}>{isIt ? 'Inserisci i dati del conducente principale' : 'Enter the main driver details'}</p>

            <div className={styles.fieldGroup}>
              <div className={styles.field}>
                <label className="input-label">{t('firstName')}</label>
                <input className="input" required value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} placeholder={isIt ? 'Es. Mario' : 'e.g. John'} />
              </div>
              <div className={styles.field}>
                <label className="input-label">{t('lastName')}</label>
                <input className="input" required value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} placeholder={isIt ? 'Es. Rossi' : 'e.g. Smith'} />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.field}>
                <label className="input-label">{t('email')}</label>
                <input className="input" type="email" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="email@example.com" />
              </div>
              <div className={styles.field}>
                <label className="input-label">{t('phone')}</label>
                <input className="input" type="tel" required value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="+39 3XX XXX XXXX" />
              </div>
            </div>

            <div className={styles.fieldGroup}>
              <div className={styles.field}>
                <label className="input-label">{isIt ? 'Età conducente' : 'Driver age'}</label>
                <input className="input" type="number" min="18" max="99" value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} />
              </div>
              <div className={styles.field}>
                <label className="input-label">{isIt ? 'Numero di Volo (Opzionale)' : 'Flight Number (Optional)'}</label>
                <input className="input" type="text" value={formData.flightNumber} onChange={e => setFormData({...formData, flightNumber: e.target.value})} placeholder={isIt ? 'Es. AZ1234' : 'e.g. AZ1234'} />
              </div>
            </div>

            {/* Fatturazione */}
            <div className={styles.invoiceSection} style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <label className={styles.checkboxLabel} style={{ marginBottom: formData.requestInvoice ? '15px' : '0', fontWeight: 'bold' }}>
                <input
                  type="checkbox"
                  checked={formData.requestInvoice}
                  onChange={e => setFormData({...formData, requestInvoice: e.target.checked})}
                />
                <span>{isIt ? 'Richiedi Fattura' : 'Request Invoice'}</span>
              </label>

              {formData.requestInvoice && (
                <div className={styles.invoiceFields} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div className={styles.fieldGroup}>
                    <div className={styles.field}>
                      <label className="input-label">{isIt ? 'Ragione Sociale (Opzionale per privati)' : 'Company Name (Optional)'}</label>
                      <input className="input" type="text" value={formData.companyName} onChange={e => setFormData({...formData, companyName: e.target.value})} />
                    </div>
                    <div className={styles.field}>
                      <label className="input-label">{isIt ? 'Nazione' : 'Country'}</label>
                      <select className="input" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})}>
                        <option value="ITALIA">Italia</option>
                        <option value="OTHER">{isIt ? 'Estero' : 'Other'}</option>
                      </select>
                    </div>
                  </div>
                  
                  <div className={styles.fieldGroup}>
                    <div className={styles.field}>
                      <label className="input-label">{isIt ? 'Codice Fiscale' : 'Tax Code'} {formData.country === 'ITALIA' && '*'}</label>
                      <input className="input" type="text" value={formData.taxCode} onChange={e => setFormData({...formData, taxCode: e.target.value})} required={formData.country === 'ITALIA'} />
                    </div>
                    <div className={styles.field}>
                      <label className="input-label">{isIt ? 'Partita IVA' : 'VAT Number'} {formData.country === 'ITALIA' && formData.companyName && '*'}</label>
                      <input className="input" type="text" value={formData.vatNumber} onChange={e => setFormData({...formData, vatNumber: e.target.value})} required={formData.country === 'ITALIA' && !!formData.companyName} />
                    </div>
                  </div>

                  {formData.country === 'ITALIA' && (
                    <div className={styles.field}>
                      <label className="input-label">PEC / Codice SDI (Opzionale)</label>
                      <input className="input" type="text" value={formData.sdiPec} onChange={e => setFormData({...formData, sdiPec: e.target.value})} placeholder="0000000 o email@pec.it" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Privacy & Terms */}
            <div className={styles.privacySection}>
              <h3>{isIt ? 'Termini e Condizioni' : 'Terms & Conditions'}</h3>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={privacyAccepted}
                  onChange={e => setPrivacyAccepted(e.target.checked)}
                />
                <span>
                  {isIt ? 'Ho letto e accetto la ' : 'I have read and accept the '}
                  {privacyTerms?.privacyFileUrl ? (
                    <a href={privacyTerms.privacyFileUrl} target="_blank" rel="noopener noreferrer" className={styles.policyLink}>
                      {isIt ? 'Privacy Policy' : 'Privacy Policy'}
                    </a>
                  ) : (
                    <span>{isIt ? 'Privacy Policy' : 'Privacy Policy'}</span>
                  )}
                </span>
              </label>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={termsAccepted}
                  onChange={e => setTermsAccepted(e.target.checked)}
                />
                <span>
                  {isIt ? 'Accetto i ' : 'I accept the '}
                  {privacyTerms?.conditionFileUrl ? (
                    <a href={privacyTerms.conditionFileUrl} target="_blank" rel="noopener noreferrer" className={styles.policyLink}>
                      {isIt ? 'Termini e Condizioni di noleggio' : 'Rental Terms & Conditions'}
                    </a>
                  ) : (
                    <span>{isIt ? 'Termini e Condizioni' : 'Terms & Conditions'}</span>
                  )}
                </span>
              </label>
            </div>

            <div className={styles.actions}>
              <button type="button" onClick={() => setStep(1)} className="btn-outline" style={{ flex: '1' }}>← {isIt ? 'Indietro' : 'Back'}</button>
              <button
                type="button"
                onClick={goToStep3}
                className="btn-primary"
                style={{ flex: '2' }}
                disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.phone || !privacyAccepted || !termsAccepted}
              >
                {isIt ? 'Vai al pagamento' : 'Go to Payment'} →
              </button>
            </div>
          </div>
        )}

        {/* ═══ STEP 3: Stripe Payment ═══ */}
        {step === 3 && (
          <div className={styles.formStep}>
            <h2>{isIt ? '💳 Pagamento sicuro' : '💳 Secure Payment'}</h2>
            <p className={styles.stepDescription}>
              {isIt ? 'Inserisci i dati della tua carta di credito o debito' : 'Enter your credit or debit card details'}
            </p>

            <div className={styles.stripeSecureBadge}>
              🔒 {isIt ? 'Pagamento protetto da Stripe' : 'Payment secured by Stripe'}
            </div>

            {paymentLoading ? (
              <div className={styles.loadingPulse}>{isIt ? 'Preparazione pagamento...' : 'Preparing payment...'}</div>
            ) : clientSecret ? (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#FF385C',
                      borderRadius: '12px',
                      fontFamily: 'Inter, system-ui, sans-serif',
                    },
                  },
                }}
              >
                <PaymentForm
                  totalPrice={totalPrice}
                  isIt={isIt}
                  onBack={() => setStep(2)}
                  onSuccess={handlePaymentSuccess}
                  customerEmail={formData.email}
                  customerName={`${formData.firstName} ${formData.lastName}`}
                  bookingMeta={{
                    vehicleName: vehicle?.name || '',
                    vehicleId: vehicle?.id || '',
                    vehicleCode: vehicle?.sipp || vehicle?.id || '',
                    groupCode: vehicle?.sipp || '',
                    quotationRefId: String(vehicle?.quotationRefId || 0),
                    pickupDate,
                    dropoffDate,
                    pickupLocation,
                    dropOffLocation,
                    phoneNumber: formData.phone || '',
                    selectedExtras: JSON.stringify(
                      Object.entries(selectedOptionals)
                        .filter(([, qty]) => qty > 0)
                        .map(([equipType, qty]) => {
                          const optObj = vehicle?.purchasableOptionals?.find(o => o.equipType === equipType);
                          return {
                            EquipType: equipType,
                            Quantity: String(qty),
                            Selected: true,
                            Prepaid: false,
                            Description: optObj?.description || equipType,
                          };
                        })
                    ),
                    protectionPlan: selectedProtection,
                    insuranceId: selectedPlan?.Id ? String(selectedPlan.Id) : '',
                    flightNumber: formData.flightNumber || '',
                    requestInvoice: String(formData.requestInvoice),
                    companyName: formData.companyName || '',
                    country: formData.country || 'ITALIA',
                    taxCode: formData.taxCode || '',
                    vatNumber: formData.vatNumber || '',
                    sdiPec: formData.sdiPec || '',
                  }}
                  locale={locale}
                />
              </Elements>
            ) : (
              <div className={styles.payError}>
                {isIt ? 'Errore nella preparazione del pagamento. Riprova.' : 'Payment preparation error. Please try again.'}
                <button type="button" onClick={createPaymentIntent} className="btn-outline" style={{ marginTop: '12px' }}>
                  {isIt ? 'Riprova' : 'Retry'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ═══ Right: Quote Summary (sticky) ═══ */}
      <aside className={styles.summarySide}>
        <div className={styles.summaryCard}>
          {loading ? (
            <div className={styles.loadingPulse}>{isIt ? 'Calcolo preventivo...' : 'Calculating quote...'}</div>
          ) : vehicle ? (
            <>
              <div className={styles.summaryVehicle}>
                {vehicle.imageUrl && <img src={vehicle.imageUrl} alt={vehicle.name} className={styles.summaryImg} />}
                <div>
                  <h3>{vehicle.name}</h3>
                  <p className={styles.summaryCategory}>{vehicle.category}</p>
                </div>
              </div>

              <hr className={styles.divider} />

              <div className={styles.summaryDates}>
                <div className={styles.dateRow}>
                  <span>{isIt ? '📅 Ritiro' : '📅 Pickup'}</span>
                  <strong>{start.toLocaleDateString(isIt ? 'it-IT' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                </div>
                <div className={styles.dateRow}>
                  <span>{isIt ? '📅 Riconsegna' : '📅 Return'}</span>
                  <strong>{end.toLocaleDateString(isIt ? 'it-IT' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</strong>
                </div>
                <div className={styles.dateRow}>
                  <span>{isIt ? '📆 Durata' : '📆 Duration'}</span>
                  <strong>{days} {isIt ? 'giorni' : 'days'}</strong>
                </div>
                <div className={styles.dateRow}>
                  <span>📍 {isIt ? 'Ritiro' : 'Pickup'}</span>
                  <strong>{pickupLocation === 'AF-Apt' ? 'CAG - Cagliari Airport' : pickupLocation}</strong>
                </div>
                <div className={styles.dateRow}>
                  <span>📍 {isIt ? 'Riconsegna' : 'Return'}</span>
                  <strong>{dropOffLocation === 'AF-Apt' ? 'CAG - Cagliari Airport' : dropOffLocation}</strong>
                </div>
              </div>

              <hr className={styles.divider} />

              <div className={styles.priceBreakdown}>
                <div className={styles.priceRow}>
                  <span>{isIt ? 'Noleggio' : 'Rental'}</span>
                  <span>€{rentalCost.toFixed(2)}</span>
                </div>

                {protectionCost > 0 && (
                  <div className={styles.priceRow}>
                    <span>🛡️ {selectedProtection.charAt(0).toUpperCase() + selectedProtection.slice(1)}</span>
                    <span>€{protectionCost.toFixed(2)}</span>
                  </div>
                )}

                {regularExtras
                  .filter(opt => (selectedOptionals[opt.equipType] || 0) > 0)
                  .map(opt => {
                    const qty = selectedOptionals[opt.equipType] || 0;
                    return (
                      <div key={opt.equipType} className={styles.priceRow}>
                        <span>{opt.description}{qty > 1 ? ` ×${qty}` : ''}</span>
                        <span>€{(opt.amount * qty).toFixed(2)}</span>
                      </div>
                    );
                  })}
              </div>

              <hr className={styles.divider} />

              <div className={styles.totalRow}>
                <span>{isIt ? 'Totale' : 'Total'}</span>
                <strong>€{totalPrice.toFixed(2)}</strong>
              </div>

              {/* Included items */}
              {vehicle.includedOptionals.length > 0 && (
                <div className={styles.includedSummary}>
                  {vehicle.includedOptionals.map((opt, i) => (
                    <span key={i}>✅ {opt.description}</span>
                  ))}
                </div>
              )}

              {/* Notes */}
              <div className={styles.notes}>
                <h4>ℹ️ {isIt ? 'Note importanti' : 'Important notes'}</h4>
                <ul>
                  <li>{isIt ? 'Assicurazione RCA inclusa' : 'RCA Insurance included'}</li>
                  <li>{isIt ? 'Chilometraggio illimitato' : 'Unlimited mileage'}</li>
                  <li>{isIt ? 'Cancellazione gratuita fino a 48h prima del ritiro' : 'Free cancellation up to 48h before pickup'}</li>
                  <li>{isIt ? 'Prezzi IVA inclusa' : 'Prices VAT included'}</li>
                </ul>
              </div>
            </>
          ) : (
            <div className={styles.loadingPulse}>{isIt ? 'Veicolo non trovato' : 'Vehicle not found'}</div>
          )}
        </div>
      </aside>
    </div>
  );
}
