import { buildBookingUrl, buildSkyscannerUrl, fromIsoDate, nightsBetween, otherCity, toIsoDate, UmrahTripData } from '@/utils/umrahTrip';

const trip = (over: Partial<UmrahTripData> = {}): UmrahTripData => ({
    outboundFrom: 'ist', outboundFromName: 'İstanbul', outboundTo: 'Medine', outboundDate: new Date(2027, 0, 10),
    inboundFrom: 'Mekke', inboundTo: 'ist', inboundToName: 'İstanbul', inboundDate: new Date(2027, 0, 20),
    transferDate: null, checklist: {}, customItems: [], ...over,
});

describe('umrah trip dates', () => {
    it('reads web date inputs as local days', () => {
        const date = fromIsoDate('2027-01-10')!;
        expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2027, 0, 10, 0]);
        expect(toIsoDate(date)).toBe('2027-01-10');
        expect(fromIsoDate('')).toBeNull();
        expect(toIsoDate(null)).toBe('');
    });

    it('counts nights and rejects reversed ranges', () => {
        expect(nightsBetween(new Date(2027, 0, 10), new Date(2027, 0, 20))).toBe(10);
        // Across the end of daylight saving time
        expect(nightsBetween(new Date(2026, 9, 20), new Date(2026, 10, 3))).toBe(14);
        expect(nightsBetween(new Date(2027, 0, 20), new Date(2027, 0, 10))).toBeNull();
        expect(nightsBetween(null, new Date())).toBeNull();
    });

    it('builds search links', () => {
        expect(buildSkyscannerUrl(trip())).toContain('/ist/2027-01-10/med/jed/2027-01-20/ist');
        expect(buildSkyscannerUrl(trip({ inboundDate: null }))).toBeNull();
        expect(buildBookingUrl('Mekke', new Date(2027, 0, 15), new Date(2027, 0, 20)))
            .toContain('checkin=2027-01-15&checkout=2027-01-20');
        expect(otherCity('Mekke')).toBe('Medine');
    });
});
