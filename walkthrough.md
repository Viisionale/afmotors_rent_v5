# AF Motors Rent — API Integration & Quoting

## API Routes Created

| Route | Method | Purpose |
|---|---|---|
| `/api/availability` | GET | Vehicle search by dates (MyRent API → local fallback) |
| `/api/extras` | GET | Available extras & insurance (MyRent API → local fallback) |
| `/api/quote` | POST | Calculate quote: rental cost, extras, total, deposit, notes |

## Flow: Search → Vehicle → Quote → Checkout

1. **Search Widget** → routes to `/fleet?pickupDate=...&dropoffDate=...`
2. **Vehicle Detail** → `VehicleBookingWidget` with date picker and live price preview
3. **Click "Book"** → routes to `/checkout?vehicleId=...&pickupDate=...&dropoffDate=...`
4. **Checkout** → calls `/api/quote` for real-time pricing, calls `/api/extras` for available add-ons

## Checkout Flow

### Left Column (3 steps):
1. **Extras** — checkboxes for Top Protection (€42/day), GPS (€5/day), Child Seat (€8/day), Additional Driver (€5/day)
2. **Driver Details** — name, surname, email, phone with placeholders
3. **Payment** — card number, expiry, CVC with total on the pay button

### Right Column (sticky sidebar):
- Vehicle image + name + daily price
- Pickup/Return dates + duration
- Cost breakdown (rental × days + each extra)
- **Total** in bold
- **Deposit** amount (€1100 base / €100 with Top Protection)
- **Notes** panel (yellow) with 7 important notes in IT/EN

## Notes Shown
- RCA Insurance included
- Unlimited mileage
- Excess / Top Protection status
- Free cancellation 48h
- Pickup locations
- 48h minimum booking
- Document requirements

## Build
```
14 routes: 11 pages + 3 API endpoints
✓ Compiled successfully
Exit code: 0
```
