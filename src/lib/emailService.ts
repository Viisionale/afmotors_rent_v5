import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'mail.afmotorsrent.it',
  port: parseInt(process.env.SMTP_PORT || '465', 10),
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  tls: {
    // do not fail on invalid certs if any
    rejectUnauthorized: false
  }
});

interface BookingEmailProps {
  to: string;
  bookingId: string;
  customerName: string;
  startDate: string;
  endDate: string;
  vehicleName: string;
  totalAmount: string;
  pickupLocation: string;
  dropoffLocation: string;
  phoneNumber?: string;
  flightNumber?: string;
  optionals?: any[];
  insurancePlan?: string;
  requestInvoice?: string;
  companyName?: string;
  vatNumber?: string;
  taxCode?: string;
  sdiPec?: string;
  country?: string;
}

const formatDateTime = (dateString: string) => {
  if (!dateString || dateString === 'Da definire') return dateString;
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleString('it-IT', { 
      day: '2-digit', month: '2-digit', year: 'numeric', 
      hour: '2-digit', minute: '2-digit'
    });
  } catch {
    return dateString;
  }
};

const buildOptionalsHtml = (optionals?: any[], insurancePlan?: string) => {
  let html = '';
  if (insurancePlan && insurancePlan !== 'base') {
    html += `
      <tr>
        <td style="padding: 4px 0; font-size: 14px;">Assicurazione:</td>
        <td style="padding: 4px 0; text-align: right; font-size: 14px; font-weight: bold;">${insurancePlan.toUpperCase()}</td>
      </tr>
    `;
  }
  if (optionals && optionals.length > 0) {
    optionals.forEach(opt => {
      html += `
        <tr>
          <td style="padding: 4px 0; font-size: 14px;">Extra:</td>
          <td style="padding: 4px 0; text-align: right; font-size: 14px;">${opt.Description || opt.description || opt.EquipType || opt.equipType} (Qtà: ${opt.Quantity || opt.quantity || 1})</td>
        </tr>
      `;
    });
  }
  return html;
};

export const sendRichBookingConfirmation = async (data: BookingEmailProps) => {
  const fStart = formatDateTime(data.startDate);
  const fEnd = formatDateTime(data.endDate);
  const optHtml = buildOptionalsHtml(data.optionals, data.insurancePlan);

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
      <div style="background-color: #0f172a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #ffffff; margin: 0;">Conferma Prenotazione</h1>
      </div>
      
      <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Gentile <strong>${data.customerName}</strong>,</p>
        <p>Grazie per aver scelto AF Motors Rent! La tua prenotazione è stata confermata con successo.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h2 style="color: #0f172a; font-size: 18px; margin-top: 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Dettagli Prenotazione #${data.bookingId}</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Veicolo:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${data.vehicleName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Ritiro:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${fStart} <br/><small>${data.pickupLocation === 'AF-Apt' ? 'CAG - Cagliari Airport' : data.pickupLocation}</small></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Riconsegna:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${fEnd} <br/><small>${data.dropoffLocation === 'AF-Apt' ? 'CAG - Cagliari Airport' : data.dropoffLocation}</small></td>
            </tr>
            ${data.flightNumber ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Volo:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${data.flightNumber}</td>
            </tr>` : ''}
            ${optHtml ? `
            <tr>
              <td colspan="2" style="padding: 15px 0 5px 0; border-bottom: 1px solid #e2e8f0;"><strong>Optional e Protezione:</strong></td>
            </tr>
            ${optHtml}
            ` : ''}
            <tr>
              <td style="padding: 15px 0 8px 0;"><strong>Importo Pagato:</strong></td>
              <td style="padding: 15px 0 8px 0; text-align: right; color: #16a34a; font-weight: bold;">€${data.totalAmount}</td>
            </tr>
          </table>
        </div>

        <p style="text-align: center; margin-top: 30px;">
          <a href="https://booking.afmotorsrent.it/dashboard" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Vai alla tua Area Riservata
          </a>
        </p>

        <p style="margin-top: 30px; font-size: 14px; color: #64748b;">
          Per accelerare la consegna del veicolo, ti preghiamo di accedere alla tua Area Riservata (utilizzando l'indirizzo email e la password inviati nell'email di Benvenuto) e completare il <strong>Pre-Check-in Online</strong> caricando i documenti necessari.<br/><br/>
          <em>Se avevi già effettuato prenotazioni in passato o hai già un account e non ricordi la password, utilizza la funzione "Password dimenticata?" nella schermata di Login. Se invece è la tua prima prenotazione, dovresti aver ricevuto una seconda email con le tue credenziali temporanee.</em>
        </p>
        
        <div style="background-color: #dcf8c6; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
          <p style="margin: 0; color: #128c7e; font-weight: bold;">Hai bisogno di assistenza immediata?</p>
          <p style="margin: 5px 0 0 0;">
            <a href="https://wa.me/390701234567" style="color: #075e54; text-decoration: none; font-weight: bold;">📱 Contattaci su WhatsApp (+39 070 123 4567)</a>
          </p>
        </div>

        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        
        <p style="font-size: 12px; color: #94a3b8; text-align: center;">
          AF Motors Rent<br/>
          Sede: Via dei Trasvolatori, 09067 Elmas CA (Aeroporto di Cagliari)<br/>
          Email: <a href="mailto:info@afmotorsrent.it" style="color: #0ea5e9;">info@afmotorsrent.it</a>
        </p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: '"AF Motors Rent" <info@afmotorsrent.it>',
      to: data.to,
      subject: `Conferma Prenotazione AF Motors Rent #${data.bookingId}`,
      html: htmlTemplate,
    });
    console.log('[emailService] Booking confirmation sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('[emailService] Error sending booking confirmation:', error);
    return false;
  }
};

export const sendPreCheckinConfirmation = async (customerName: string, bookingId: string, email: string) => {
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
      <div style="background-color: #16a34a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #ffffff; margin: 0;">Pre-Check-in Completato</h1>
      </div>
      
      <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Gentile <strong>${customerName}</strong>,</p>
        <p>Ti confermiamo di aver ricevuto correttamente i tuoi documenti e i dati patente per la prenotazione <strong>#${bookingId}</strong>.</p>
        <p>Il tuo Pre-Check-in è andato a buon fine. Al tuo arrivo in filiale, la consegna del veicolo sarà molto più rapida!</p>
        
        <p style="margin-top: 30px;">Ti aspettiamo,<br/><strong>Il Team di AF Motors Rent</strong></p>
      </div>
    </div>
  `;

  try {
    const adminEmail = process.env.CONTACT_EMAIL || 'info@afmotorsrent.it';
    const info = await transporter.sendMail({
      from: '"AF Motors Rent" <info@afmotorsrent.it>',
      to: email,
      bcc: adminEmail,
      subject: `Pre-Check-in Ricevuto - Prenotazione #${bookingId}`,
      html: htmlTemplate,
    });
    console.log('[emailService] Pre-checkin confirmation sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('[emailService] Error sending pre-checkin confirmation:', error);
    return false;
  }
};

export const sendAdminBookingNotification = async (data: BookingEmailProps) => {
  const fStart = formatDateTime(data.startDate);
  const fEnd = formatDateTime(data.endDate);
  const optHtml = buildOptionalsHtml(data.optionals, data.insurancePlan);

  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
      <div style="background-color: #f59e0b; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #ffffff; margin: 0;">Nuova Prenotazione Ricevuta!</h1>
      </div>
      
      <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        <p>È stata registrata una nuova prenotazione (<strong>#${data.bookingId}</strong>) da parte di <strong>${data.customerName}</strong>.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
          <h2 style="color: #0f172a; font-size: 18px; margin-top: 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Dettagli Prenotazione</h2>
          
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Cliente:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${data.customerName}<br/><a href="mailto:${data.to}">${data.to}</a></td>
            </tr>
            ${data.phoneNumber ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Telefono:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${data.phoneNumber}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Veicolo:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${data.vehicleName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Ritiro:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${fStart} <br/><small>${data.pickupLocation === 'AF-Apt' ? 'CAG - Cagliari Airport' : data.pickupLocation}</small></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Riconsegna:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${fEnd} <br/><small>${data.dropoffLocation === 'AF-Apt' ? 'CAG - Cagliari Airport' : data.dropoffLocation}</small></td>
            </tr>
            ${data.flightNumber ? `
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Volo:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right;">${data.flightNumber}</td>
            </tr>` : ''}
            
            ${optHtml ? `
            <tr>
              <td colspan="2" style="padding: 15px 0 5px 0; border-bottom: 1px solid #e2e8f0;"><strong>Optional e Protezione:</strong></td>
            </tr>
            ${optHtml}
            ` : ''}

            <tr>
              <td style="padding: 15px 0 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Importo Pagato:</strong></td>
              <td style="padding: 15px 0 8px 0; border-bottom: 1px solid #e2e8f0; text-align: right; color: #16a34a; font-weight: bold;">€${data.totalAmount}</td>
            </tr>
            ${data.requestInvoice === 'true' ? `
            <tr>
              <td colspan="2" style="padding: 15px 0 5px 0;"><strong>Dati Fatturazione Richiesti:</strong></td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-size: 14px;">Ragione Sociale:</td>
              <td style="padding: 4px 0; text-align: right; font-size: 14px;">${data.companyName || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-size: 14px;">Nazione:</td>
              <td style="padding: 4px 0; text-align: right; font-size: 14px;">${data.country || 'ITALIA'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-size: 14px;">Codice Fiscale:</td>
              <td style="padding: 4px 0; text-align: right; font-size: 14px;">${data.taxCode || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-size: 14px;">Partita IVA:</td>
              <td style="padding: 4px 0; text-align: right; font-size: 14px;">${data.vatNumber || '-'}</td>
            </tr>
            <tr>
              <td style="padding: 4px 0; font-size: 14px;">PEC / SDI:</td>
              <td style="padding: 4px 0; text-align: right; font-size: 14px;">${data.sdiPec || '-'}</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <p style="font-size: 14px; color: #64748b; text-align: center;">Accedi al gestionale MyRent per ulteriori dettagli.</p>
      </div>
    </div>
  `;

  try {
    const adminEmail = process.env.CONTACT_EMAIL || 'info@afmotorsrent.it';
    const info = await transporter.sendMail({
      from: '"AF Motors System" <info@afmotorsrent.it>',
      to: adminEmail,
      subject: `[NUOVA PRENOTAZIONE] ${data.customerName} - #${data.bookingId}`,
      html: htmlTemplate,
    });
    console.log('[emailService] Admin notification sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('[emailService] Error sending admin notification:', error);
    return false;
  }
};

export const sendWelcomeEmail = async (customerName: string, email: string, temporaryPassword: string) => {
  const htmlTemplate = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
      <div style="background-color: #0f172a; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: #ffffff; margin: 0;">Benvenuto in AF Motors Rent!</h1>
      </div>
      
      <div style="padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px;">
        <p>Gentile <strong>${customerName}</strong>,</p>
        <p>Grazie per aver noleggiato con noi! Abbiamo creato per te un account nel nostro portale che ti permetterà di gestire le tue prenotazioni ed effettuare il Pre-Check-in.</p>
        
        <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center;">
          <h2 style="color: #0f172a; font-size: 18px; margin-top: 0; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Le tue Credenziali</h2>
          <p style="margin: 10px 0;"><strong>Email:</strong> ${email}</p>
          <p style="margin: 10px 0;"><strong>Password:</strong> ${temporaryPassword}</p>
        </div>
        
        <p style="text-align: center; margin-top: 30px;">
          <a href="https://booking.afmotorsrent.it/dashboard" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
            Accedi all'Area Riservata
          </a>
        </p>

        <p style="font-size: 14px; color: #64748b; margin-top: 30px;">
          Potrai modificare questa password temporanea dalla tua area personale in qualsiasi momento.
        </p>
      </div>
    </div>
  `;

  try {
    const info = await transporter.sendMail({
      from: '"AF Motors Rent" <info@afmotorsrent.it>',
      to: email,
      subject: 'Benvenuto in AF Motors Rent - Le tue credenziali',
      html: htmlTemplate,
    });
    console.log('[emailService] Welcome email sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('[emailService] Error sending welcome email:', error);
    return false;
  }
};
// Force recompile
