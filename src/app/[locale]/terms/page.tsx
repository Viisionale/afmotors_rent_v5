import React from 'react';

import {getTranslations} from 'next-intl/server';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({locale, namespace: 'SEO.terms'});
  return {
    title: t('title'),
    description: t('description')
  };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isIt = locale === 'it';
  
  return (
    <main>
      <div className="page-hero">
        <h1>{isIt ? 'Termini e Condizioni Generali' : 'General Terms and Conditions'}</h1>
        <p>{isIt ? 'Regole di noleggio e responsabilità economiche' : 'Rental rules and financial responsibilities'}</p>
      </div>
      <div className="section" style={{ maxWidth: '900px', margin: '0 auto', lineHeight: '1.7', color: 'var(--text-secondary)' }}>
        
        <h2 style={{ color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>
          {isIt ? '1. Età e Patente di Guida' : '1. Age and Driving Licence'}
        </h2>
        <p>
          {isIt 
            ? "L'età minima per il noleggio è di 19 anni compiuti, ed è richiesta una patente di guida valida rilasciata da almeno 12 mesi. Sono applicati supplementi specifici 'Young Driver' per i conducenti di età inferiore ai 25 anni e 'Senior Driver' per i conducenti di età superiore ai 75 anni."
            : "The minimum age for rental is 19 years, and a valid driving licence issued for at least 12 months is required. Specific 'Young Driver' supplements apply to drivers under 25, and 'Senior Driver' supplements apply to drivers over 75."}
        </p>

        <h2 style={{ color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>
          {isIt ? '2. Regole di Noleggio' : '2. Rental Rules'}
        </h2>
        <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
          <li><strong>{isIt ? 'Fumo' : 'Smoking'}:</strong> {isIt ? "È severamente vietato fumare all'interno dei veicoli." : "Smoking is strictly prohibited inside the vehicles."}</li>
          <li><strong>{isIt ? 'Carburante' : 'Fuel'}:</strong> {isIt ? "L'auto viene fornita con il pieno e deve essere restituita con il pieno (politica Full-to-Full), pena l'addebito del servizio 'Refuelling' e del carburante mancante." : "The car is provided with a full tank and must be returned with a full tank (Full-to-Full policy), otherwise a 'Refuelling' service charge and the cost of the missing fuel will be applied."}</li>
          <li><strong>{isIt ? 'Tolleranza Riconsegna' : 'Return Tolerance'}:</strong> {isIt ? "È prevista una tolleranza massima di 59 minuti per la riconsegna, dopodiché verrà addebitata una penale pari a un giorno extra di noleggio." : "There is a maximum tolerance of 59 minutes for the return, after which a penalty equal to one extra rental day will be charged."}</li>
        </ul>

        <h2 style={{ color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>
          {isIt ? '3. Responsabilità Economiche e Franchigie' : '3. Financial Responsibilities and Deductibles'}
        </h2>
        <p>
          {isIt 
            ? "In caso di danni (CDW) o furto (TLW), la responsabilità massima varia in base al gruppo del veicolo noleggiato. I massimali standard sono:"
            : "In the event of damage (CDW) or theft (TLW), the maximum responsibility varies based on the rented vehicle group. Standard deductibles are:"}
        </p>
        <ul style={{ paddingLeft: '24px', marginBottom: '16px' }}>
          <li><strong>Gruppi A/A1:</strong> {isIt ? "Fino a €1.600 per danni e €1.800 per furto." : "Up to €1,600 for damage and €1,800 for theft."}</li>
          <li><strong>Gruppi D:</strong> {isIt ? "Fino a €2.000 per danni e €2.200 per furto." : "Up to €2,000 for damage and €2,200 for theft."}</li>
          <li><strong>Gruppi J, SU, SU1:</strong> {isIt ? "Fino a €2.200 per danni e €2.600 per furto." : "Up to €2,200 for damage and €2,600 for theft."}</li>
        </ul>

        <h2 style={{ color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>
          {isIt ? '4. Depositi Cauzionali e Pagamenti' : '4. Security Deposits and Payments'}
        </h2>
        <p>
          {isIt
            ? "È sempre richiesta una carta di credito o debito (Visa, MasterCard, Amex, UnionPay) intestata al guidatore principale. Non sono assolutamente accettate carte prepagate, Postepay, Revolving o Maestro."
            : "A credit or debit card (Visa, MasterCard, Amex, UnionPay) in the name of the main driver is always required. Prepaid cards, Postepay, Revolving, or Maestro cards are absolutely not accepted."}
        </p>
        <p>
          {isIt
            ? "Gli importi standard del deposito cauzionale vanno da €800 a €1.000 in base al gruppo veicolo. Acquistando il pacchetto 'Top Protection', l'importo del deposito è sempre ridotto a soli €100."
            : "Standard security deposit amounts range from €800 to €1,000 based on the vehicle group. By purchasing the 'Top Protection' package, the deposit amount is always reduced to just €100."}
        </p>

        <h2 style={{ color: 'var(--text-primary)', marginTop: '32px', marginBottom: '16px' }}>
          {isIt ? '5. Gestione Sinistri e Multe' : '5. Claims and Fines Management'}
        </h2>
        <p>
          {isIt
            ? "In caso di incidente o furto, il cliente ha l'obbligo di informare l'agenzia entro 24 ore e consegnare il modulo C.A.I. o la regolare denuncia sporta alle autorità competenti."
            : "In the event of an accident or theft, the customer must inform the agency within 24 hours and deliver the European Accident Statement (C.A.I.) form or the official police report."}
        </p>
        <p>
          {isIt
            ? "Eventuali contravvenzioni stradali prese durante il noleggio verranno rinotificate al cliente, con l'addebito delle relative spese di gestione amministrativa per la pratica di rinotifica."
            : "Any traffic fines incurred during the rental will be re-notified to the customer, along with an administrative management fee for the re-notification process."}
        </p>
      </div>
    </main>
  );
}
