import { getQiblaBearing, getKaabaDistanceKm, normalizeDegrees, shortestAngleDelta } from '@/utils/qibla';

describe('qibla', () => {
    it('points to the published qibla angles of Turkish cities', () => {
        expect(getQiblaBearing(41.0082, 28.9784)).toBeCloseTo(151.6, 0); // İstanbul
        expect(getQiblaBearing(39.9334, 32.8597)).toBeCloseTo(160.2, 0); // Ankara
    });

    it('measures the distance to the Kaaba', () => {
        expect(getKaabaDistanceKm(41.0082, 28.9784)).toBeGreaterThan(2350);
        expect(getKaabaDistanceKm(41.0082, 28.9784)).toBeLessThan(2450);
        expect(getKaabaDistanceKm(21.422487, 39.826206)).toBeCloseTo(0, 5);
    });

    it('turns the compass the short way round', () => {
        expect(normalizeDegrees(-30)).toBe(330);
        expect(shortestAngleDelta(350, 10)).toBe(20);
        expect(shortestAngleDelta(10, 350)).toBe(-20);
    });
});
