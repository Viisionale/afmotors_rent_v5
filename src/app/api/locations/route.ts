import { NextResponse } from 'next/server';
import { getLocations } from '@/lib/apiClient';

export async function GET() {
  try {
    const data = await getLocations();
    // data is an array of locations
    const locations = Array.isArray(data) ? data : data?.locations || data?.data || [];
    return NextResponse.json({ source: 'api', locations });
  } catch (error) {
    console.warn('MyRent locations API error, using fallback:', error);
    // Fallback with known AF Motors locations
    return NextResponse.json({
      source: 'local',
      locations: [
        {
          locationCode: 'CAG',
          locationName: 'Aeroporto di Cagliari Elmas',
          locationAddress: 'Via dei Trasvolatori',
          locationCity: 'Elmas',
          locationType: 3,
          telephoneNumber: '+393440513634',
          email: 'info@afmotorsrent.it',
          latitude: 39.248,
          longitude: 9.054,
          isAirport: true,
          country: 'ITALIA',
          zipCode: '09067',
          openings: [
            { dayOfTheWeek: 1, dayOfTheWeekName: 'Monday', startTime: '08:00', endTime: '20:00' },
            { dayOfTheWeek: 2, dayOfTheWeekName: 'Tuesday', startTime: '08:00', endTime: '20:00' },
            { dayOfTheWeek: 3, dayOfTheWeekName: 'Wednesday', startTime: '08:00', endTime: '20:00' },
            { dayOfTheWeek: 4, dayOfTheWeekName: 'Thursday', startTime: '08:00', endTime: '20:00' },
            { dayOfTheWeek: 5, dayOfTheWeekName: 'Friday', startTime: '08:00', endTime: '20:00' },
            { dayOfTheWeek: 6, dayOfTheWeekName: 'Saturday', startTime: '08:00', endTime: '20:00' },
            { dayOfTheWeek: 7, dayOfTheWeekName: 'Sunday', startTime: '08:00', endTime: '20:00' },
          ],
        },
        {
          locationCode: 'SESTU',
          locationName: 'AF Motors Rent - Sestu',
          locationAddress: 'Viale Monastir km 8,5',
          locationCity: 'Sestu',
          locationType: 3,
          telephoneNumber: '+393440513634',
          email: 'info@afmotorsrent.it',
          latitude: 39.296,
          longitude: 9.098,
          isAirport: false,
          country: 'ITALIA',
          zipCode: '09028',
          openings: [
            { dayOfTheWeek: 1, dayOfTheWeekName: 'Monday', startTime: '08:00', endTime: '20:00' },
            { dayOfTheWeek: 2, dayOfTheWeekName: 'Tuesday', startTime: '08:00', endTime: '20:00' },
            { dayOfTheWeek: 3, dayOfTheWeekName: 'Wednesday', startTime: '08:00', endTime: '20:00' },
            { dayOfTheWeek: 4, dayOfTheWeekName: 'Thursday', startTime: '08:00', endTime: '20:00' },
            { dayOfTheWeek: 5, dayOfTheWeekName: 'Friday', startTime: '08:00', endTime: '20:00' },
            { dayOfTheWeek: 6, dayOfTheWeekName: 'Saturday', startTime: '08:00', endTime: '20:00' },
            { dayOfTheWeek: 7, dayOfTheWeekName: 'Sunday', startTime: '08:00', endTime: '20:00' },
          ],
        },
      ],
    });
  }
}
