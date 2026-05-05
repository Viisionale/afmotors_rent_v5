export interface Vehicle {
  id: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  /** Fallback price per day — 0 means "price from API only" */
  price: number;
  seats: number;
  transmission: string;
  fuel: string;
  year: number;
  imageUrl: string;
}

/**
 * Local vehicle catalog — matches the real AF Motors Rent fleet on MyRent.
 * Prices are 0 because all pricing comes from the MyRent API.
 * Images are served locally from /images/vehicles/{id}.png
 *
 * MyRent Groups → Vehicles:
 *   UTILITARIE  → fiat-panda
 *   MEDIA       → hyundai-i20
 *   COMPATTA    → hyundai-bayon, fiat-tipo, peugeot-208
 *   MINI SUV    → jeep-avenger
 *   SUV         → jeep-compass, hyundai-tucson
 *   SUV ATM     → hyundai-tucson-at, hyundai-kona-ev, hyundai-kona-hybrid
 *   STATION WAGON → byd-dolphin, opel-frontera, jeep-renegade
 *   CABRIO      → opel-corsa
 */
export const vehicles: Vehicle[] = [
  // ── UTILITARIE ──
  {
    id: 'fiat-panda',
    name: 'Fiat Panda',
    brand: 'Fiat',
    model: 'Panda 1.0 Hybrid',
    category: 'Utilitarie',
    price: 0,
    seats: 5,
    transmission: 'Manuale',
    fuel: 'Ibrida',
    year: 2025,
    imageUrl: '/images/vehicles/fiat-panda.png',
  },

  // ── MEDIA ──
  {
    id: 'hyundai-i20',
    name: 'Hyundai i20',
    brand: 'Hyundai',
    model: 'i20 1.0 T-GDI',
    category: 'Media',
    price: 0,
    seats: 5,
    transmission: 'Manuale',
    fuel: 'Benzina',
    year: 2025,
    imageUrl: '/images/vehicles/hyundai-i20.png',
  },

  // ── COMPATTA ──
  {
    id: 'hyundai-bayon',
    name: 'Hyundai Bayon',
    brand: 'Hyundai',
    model: 'Bayon 1.0 T-GDI',
    category: 'Compatta',
    price: 0,
    seats: 5,
    transmission: 'Manuale',
    fuel: 'Benzina',
    year: 2025,
    imageUrl: '/images/vehicles/hyundai-bayon.png',
  },
  {
    id: 'fiat-tipo',
    name: 'Fiat Tipo',
    brand: 'Fiat',
    model: 'Tipo 1.5 Hybrid AT',
    category: 'Compatta',
    price: 0,
    seats: 5,
    transmission: 'Automatico',
    fuel: 'Ibrida',
    year: 2025,
    imageUrl: '/images/vehicles/fiat-tipo.png',
  },
  {
    id: 'peugeot-208',
    name: 'Peugeot 208',
    brand: 'Peugeot',
    model: '208 BlueHDi',
    category: 'Compatta',
    price: 0,
    seats: 5,
    transmission: 'Manuale',
    fuel: 'Diesel',
    year: 2023,
    imageUrl: '/images/vehicles/peugeot-208.png',
  },

  // ── MINI SUV ──
  {
    id: 'jeep-avenger',
    name: 'Jeep Avenger',
    brand: 'Jeep',
    model: 'Avenger Summit 1.2',
    category: 'Mini SUV',
    price: 0,
    seats: 5,
    transmission: 'Manuale',
    fuel: 'Benzina',
    year: 2025,
    imageUrl: '/images/vehicles/jeep-avenger.png',
  },

  // ── SUV ──
  {
    id: 'jeep-compass',
    name: 'Jeep Compass',
    brand: 'Jeep',
    model: 'Compass 1.6 MJT',
    category: 'SUV',
    price: 0,
    seats: 5,
    transmission: 'Manuale',
    fuel: 'Diesel',
    year: 2023,
    imageUrl: '/images/vehicles/jeep-compass.png',
  },
  {
    id: 'hyundai-tucson',
    name: 'Hyundai Tucson',
    brand: 'Hyundai',
    model: 'Tucson Business',
    category: 'SUV',
    price: 0,
    seats: 5,
    transmission: 'Manuale',
    fuel: 'Ibrida',
    year: 2025,
    imageUrl: '/images/vehicles/hyundai-tucson.png',
  },

  // ── SUV ATM (Automatico) ──
  {
    id: 'hyundai-tucson-at',
    name: 'Hyundai Tucson AT',
    brand: 'Hyundai',
    model: 'Tucson X-Tech AT',
    category: 'SUV ATM',
    price: 0,
    seats: 5,
    transmission: 'Automatico',
    fuel: 'Ibrida',
    year: 2025,
    imageUrl: '/images/vehicles/hyundai-tucson-at.png',
  },
  {
    id: 'hyundai-kona-ev',
    name: 'Hyundai Kona EV',
    brand: 'Hyundai',
    model: 'Kona EV X Class',
    category: 'SUV ATM',
    price: 0,
    seats: 5,
    transmission: 'Automatico',
    fuel: 'Elettrica',
    year: 2024,
    imageUrl: '/images/vehicles/hyundai-kona-ev.png',
  },
  {
    id: 'hyundai-kona-hybrid',
    name: 'Hyundai Kona Hybrid',
    brand: 'Hyundai',
    model: 'Kona 1.6 Hybrid AT',
    category: 'SUV ATM',
    price: 0,
    seats: 5,
    transmission: 'Automatico',
    fuel: 'Ibrida',
    year: 2025,
    imageUrl: '/images/vehicles/hyundai-kona-hybrid.png',
  },

  // ── STATION WAGON ──
  {
    id: 'byd-dolphin',
    name: 'BYD Dolphin',
    brand: 'BYD',
    model: 'Dolphin',
    category: 'Station Wagon',
    price: 0,
    seats: 5,
    transmission: 'Automatico',
    fuel: 'Elettrica',
    year: 2025,
    imageUrl: '/images/vehicles/byd-dolphin.png',
  },
  {
    id: 'opel-frontera',
    name: 'Opel Frontera',
    brand: 'Opel',
    model: 'Frontera',
    category: 'Station Wagon',
    price: 0,
    seats: 5,
    transmission: 'Automatico',
    fuel: 'Ibrida',
    year: 2025,
    imageUrl: '/images/vehicles/opel-frontera.png',
  },
  {
    id: 'jeep-renegade',
    name: 'Jeep Renegade',
    brand: 'Jeep',
    model: 'Renegade',
    category: 'Station Wagon',
    price: 0,
    seats: 5,
    transmission: 'Manuale',
    fuel: 'Ibrida',
    year: 2024,
    imageUrl: '/images/vehicles/jeep-renegade.png',
  },

  // ── CABRIO ──
  {
    id: 'opel-corsa',
    name: 'Opel Corsa',
    brand: 'Opel',
    model: 'Corsa 1.5',
    category: 'Cabrio',
    price: 0,
    seats: 5,
    transmission: 'Manuale',
    fuel: 'Benzina',
    year: 2023,
    imageUrl: '/images/vehicles/opel-corsa.png',
  },
];

export const reviews = [
  { name: 'Philipp Thomas', date: '04/07/2025', rating: 5, text: 'Beste Autovermietung, besser geht es nicht! Freundliche Mitarbeiter, jederzeit erreichbar via WhatsApp, Auto im top Zustand, persönliche Abholung ohne Wartezeit am Flughafen.' },
  { name: 'Francesco Ricci', date: '01/07/2025', rating: 5, text: 'Ottimo Servizio, mi sono trovato bene. Ci hanno preso all\'aeroporto e ci hanno riportato. Se torno in Sardegna so già a chi affidarmi.' },
  { name: 'family Kyivskyi', date: '01/07/2025', rating: 5, text: 'Top service. The rental company is part of a large car dealership. We were met at the airport. Our Fiat Panda 1.3 hybrid was practically new. Overall, I highly recommend AF Motors Rent.' },
  { name: 'Antonella Beltramo', date: '30/06/2025', rating: 5, text: 'Ho affittato una Fiat Panda per 1 settimana con assicurazione full casco. Prezzo valido. Servizio professionale. Consigliatissimo.' },
  { name: 'Jonas W.', date: '30/06/2025', rating: 5, text: 'Insgesamt sehr guter Eindruck. Die Menschen hier sind super freundlich und professionell, keine Tricks, kein Upselling, 100% zufrieden.' },
  { name: 'M M', date: '26/06/2025', rating: 5, text: 'Everything perfect, low cost cars, low deposit, new & clean cars, nice staff. Totally suggest this over any other car rental in Cagliari. 🤝' },
  { name: 'Francesco Chiapperini', date: '26/06/2025', rating: 5, text: 'Esperienza di noleggio ottima. Personale gentile e auto perfette, nuove di zecca. Ci ritornerò.' },
  { name: 'Maria O', date: '26/06/2025', rating: 5, text: 'Cogimos un coche para recorrer la isla dos días y genial. Son encantadores y muy puntuales. De verdad los recomiendo mucho.' },
  { name: 'Sirio Folliero', date: '24/06/2025', rating: 5, text: 'Servizio di noleggio top! Gestione impeccabile del ritardo con supporto real time via WhatsApp. Quando tornerò in Sardegna mi rivolgerò sicuramente ad AF Motors Rent.' },
];

export const protectionPlans = {
  base: {
    name: 'Noleggio Base',
    deposit: 1100,
    protectionCost: 0,
    theftLiability: true,
    description: 'Copertura essenziale con assicurazione RCA. Responsabile fino alla franchigia per danni o furto.',
    descriptionEn: 'Essential coverage with basic RCA insurance. Liable up to the excess for damages or theft.',
    included: ['Assicurazione RCA', 'Chilometraggio illimitato', 'Tasse e Supplementi'],
    includedEn: ['RCA Insurance', 'Unlimited Mileage', 'Taxes & Fees'],
  },
  top: {
    name: 'Top Protection',
    deposit: 100,
    protectionCost: 42,
    theftLiability: false,
    description: 'Franchigie azzerate per furto e danni, deposito ridotto a €100, protezione anti-infortuni (P.A.I.) e assistenza stradale potenziata.',
    descriptionEn: 'Zero excess for theft and damages, deposit reduced to €100, personal accident insurance (P.A.I.) and enhanced roadside assistance.',
    included: ['Franchigia Zero Danni', 'Franchigia Zero Furto', 'P.A.I. Anti-Infortuni', 'Road Assistance Plus', 'Deposito solo €100'],
    includedEn: ['Zero Damage Excess', 'Zero Theft Excess', 'Personal Accident Insurance', 'Road Assistance Plus', 'Deposit only €100'],
  },
};
