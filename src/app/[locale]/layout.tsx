import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import '@/app/globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import WhatsAppFab from '@/components/WhatsAppFab';
import {AuthProvider} from '@/components/AuthContext';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import SEOHead from '@/components/SEOHead';
import {getTranslations} from 'next-intl/server';
import Script from 'next/script';

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({locale, namespace: 'SEO.home'});
  
  const isBlog = process.env.NEXT_PUBLIC_SITE_TYPE === 'blog';
  const siteUrl = isBlog ? 'https://afmotorsrent.it' : 'https://booking.afmotorsrent.it';

  return {
    title: t('title'),
    description: t('description'),
    keywords: locale === 'it' 
      ? 'noleggio auto cagliari, rent car sardegna, autonoleggio aeroporto cagliari, noleggio senza carta di credito'
      : 'car rental cagliari, rent car sardinia, cagliari airport car hire, rental without credit card',
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: siteUrl,
      siteName: 'AF Motors Rent',
      locale: locale === 'it' ? 'it_IT' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
    },
    alternates: {
      canonical: siteUrl,
      languages: { it: `${siteUrl}/it`, en: `${siteUrl}/en` },
    },
    robots: { index: true, follow: true },
  };
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const { locale } = await params;

  if (!(routing.locales as readonly string[]).includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="icon" href="https://afmotorsrent.it/wp-content/uploads/2024/03/cropped-AF-Motors-Rent-favicon-32x32.png" sizes="32x32" />
        <link rel="icon" href="https://afmotorsrent.it/wp-content/uploads/2024/03/cropped-AF-Motors-Rent-favicon-192x192.png" sizes="192x192" />
        <meta name="theme-color" content="#FF385C" />
        <SEOHead />
        <Script
          id="hu-options"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: `var huOptions = {"appID":"afmotorsrentit-b8b5917","currentLanguage":"${locale}","blocking":true,"globalCookie":false,"googleConsentDefault":{"ad_storage":4,"analytics_storage":2,"functionality_storage":3,"personalization_storage":3,"security_storage":3,"ad_personalization":4,"ad_user_data":4},"facebookConsentDefault":{"consent":4}}` }}
        />
        <Script src="https://cdn.hu-manity.co/hu-banner.min.js" strategy="beforeInteractive" />
      </head>
      <body suppressHydrationWarning>
        <GoogleAnalytics />
        <NextIntlClientProvider messages={messages}>
          <AuthProvider>
            <div className="app-container">
              <Header />
              {children}
              <Footer />
              <WhatsAppFab />
            </div>
          </AuthProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
