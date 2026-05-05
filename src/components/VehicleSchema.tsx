import React from 'react';
import { Vehicle } from '@/lib/vehicles';
import { useTranslations } from 'next-intl';

export default function VehicleSchema({ vehicle }: { vehicle: Vehicle }) {
  const t = useTranslations('Vehicle');
  
  // Use price from API if available, otherwise fallback.
  // The schema expects a number/string. If price is 0, we could omit it or say it varies.
  // For Product schema, if price is unknown, we can just omit Offers or set price to 0.
  const price = vehicle.price > 0 ? vehicle.price : "Varies";
  
  const isBlog = process.env.NEXT_PUBLIC_SITE_TYPE === 'blog';
  const siteUrl = isBlog ? 'https://afmotorsrent.it' : 'https://booking.afmotorsrent.it';
  const vehicleUrl = `${siteUrl}/fleet/${vehicle.id}`;
  const imageUrl = `${siteUrl}${vehicle.imageUrl}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": vehicle.name,
    "description": `Noleggio ${vehicle.name} in Sardegna. Categoria: ${vehicle.category}.`,
    "image": imageUrl,
    "brand": {
      "@type": "Brand",
      "name": vehicle.brand
    },
    "category": vehicle.category,
    "additionalProperty": [
      {
        "@type": "PropertyValue",
        "name": "Pick-up location",
        "value": t('pickupDefault')
      },
      {
        "@type": "PropertyValue",
        "name": "Fuel Type",
        "value": vehicle.fuel
      },
      {
        "@type": "PropertyValue",
        "name": "Transmission",
        "value": vehicle.transmission
      },
      {
        "@type": "PropertyValue",
        "name": "Seating Capacity",
        "value": vehicle.seats.toString()
      }
    ]
  };

  if (price !== "Varies") {
    // @ts-ignore
    jsonLd.offers = {
      "@type": "Offer",
      "priceCurrency": "EUR",
      "price": price.toString(),
      "availability": "https://schema.org/InStock",
      "url": vehicleUrl
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
