import { NextResponse } from 'next/server';

/**
 * POST /api/contact
 * Sends a contact form message.
 * 
 * For now, stores the message and returns success.
 * Can be extended with Resend/SendGrid when configured.
 * 
 * Body: { name, email, phone?, subject, message }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, subject, message, phone } = body;

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    // Log the contact message (in production, send via email service)
    console.log('[contact] New message:', { name, email, phone, subject, message, timestamp: new Date().toISOString() });

    // If Resend API key is configured, send email
    if (process.env.RESEND_API_KEY) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: 'AF Motors Rent <onboarding@resend.dev>',
            to: process.env.CONTACT_EMAIL || 'info@afmotorsrent.it',
            subject: `[Contact Form] ${subject || 'New Message'} - ${name}`,
            html: `
              <h2>New Contact Form Message</h2>
              <p><strong>Name:</strong> ${name}</p>
              <p><strong>Email:</strong> ${email}</p>
              ${phone ? `<p><strong>Phone:</strong> ${phone}</p>` : ''}
              <p><strong>Subject:</strong> ${subject || 'N/A'}</p>
              <hr />
              <p>${message.replace(/\n/g, '<br />')}</p>
              <hr />
              <p style="color: #999; font-size: 12px;">Sent from afmotorsrent.it contact form</p>
            `,
          }),
        });

        if (!res.ok) {
          console.warn('[contact] Resend API error:', await res.text());
        }
      } catch (emailErr) {
        console.warn('[contact] Email send failed:', emailErr);
      }
    }

    return NextResponse.json({
      status: 'success',
      message: 'Message received successfully',
    });
  } catch (error) {
    console.error('[contact] Error:', error);
    return NextResponse.json(
      { error: 'Failed to process contact form' },
      { status: 500 }
    );
  }
}
