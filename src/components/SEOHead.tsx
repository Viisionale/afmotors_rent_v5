import React from 'react';

export default function SEOHead() {
  const cagliariAirportId = "ChIJlcrti9w35xIR1nne9ccREpM";
  const sestuBaseId = "ChIJefQ6q5c35xIR7uk6jI74NaY";
  
  // URL determination for dual-site setup based on environment variables or defaults
  // NEXT_PUBLIC_SITE_TYPE = 'booking' | 'blog'
  const isBlog = process.env.NEXT_PUBLIC_SITE_TYPE === 'blog';
  const siteUrl = isBlog ? 'https://afmotorsrent.it' : 'https://booking.afmotorsrent.it';

  const orgSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        "name": "AF Motors Rent",
        "url": siteUrl,
        "logo": {
          "@type": "ImageObject",
          "url": "https://afmotors.it/wp-content/uploads/2024/11/logo-af-motors.png",
          "caption": "AF Motors Group"
        },
        "sameAs": [
          "https://www.facebook.com/afmotorsrent/",
          "https://www.instagram.com/afmotorsrent/"
        ]
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        "url": siteUrl,
        "name": "AF Motors Rent",
        "publisher": {
          "@id": `${siteUrl}/#organization`
        }
      },
      {
        "@type": "LocalBusiness",
        "@id": `${siteUrl}/#localbusiness-airport`,
        "name": "AF Motors Rent – Cagliari Airport",
        "url": siteUrl,
        "telephone": "+393440513634",
        "hasMap": `https://www.google.com/maps/place/?q=place_id:${cagliariAirportId}`,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Arrivi, Aeroporto di Cagliari",
          "addressLocality": "Cagliari",
          "addressRegion": "Sardegna",
          "postalCode": "09067",
          "addressCountry": "IT"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 39.2515,
          "longitude": 9.0544
        },
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "08:00",
            "closes": "20:00"
          }
        ]
      },
      {
        "@type": "LocalBusiness",
        "@id": `${siteUrl}/#localbusiness-sestu`,
        "name": "AF Motors Rent – Sestu Base",
        "url": siteUrl,
        "telephone": "+393440513634",
        "hasMap": `https://www.google.com/maps/place/?q=place_id:${sestuBaseId}`,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Viale Monastir, km 8/5",
          "addressLocality": "Sestu",
          "addressRegion": "Sardegna",
          "postalCode": "09028",
          "addressCountry": "IT"
        },
        "geo": {
          "@type": "GeoCoordinates",
          "latitude": 39.3000,
          "longitude": 9.0142
        },
        "openingHoursSpecification": [
          {
            "@type": "OpeningHoursSpecification",
            "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "opens": "08:00",
            "closes": "20:00"
          }
        ]
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
    />
  );
}
