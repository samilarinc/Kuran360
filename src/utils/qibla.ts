const KAABA = { latitude: 21.422487, longitude: 39.826206 };
const EARTH_RADIUS_KM = 6371;

const toRad = (deg: number) => (deg * Math.PI) / 180;
const toDeg = (rad: number) => (rad * 180) / Math.PI;

export const normalizeDegrees = (deg: number) => ((deg % 360) + 360) % 360;

/** Signed shortest rotation from `from` to `to`, in the range [-180, 180). */
export const shortestAngleDelta = (from: number, to: number) =>
    normalizeDegrees(to - from + 180) - 180;

/** Initial great-circle bearing (clockwise from true north) from a point towards the Kaaba. */
export const getQiblaBearing = (latitude: number, longitude: number) => {
    const phi1 = toRad(latitude);
    const phi2 = toRad(KAABA.latitude);
    const dLambda = toRad(KAABA.longitude - longitude);
    const y = Math.sin(dLambda) * Math.cos(phi2);
    const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLambda);
    return normalizeDegrees(toDeg(Math.atan2(y, x)));
};

/** Great-circle distance from a point to the Kaaba, in kilometres (haversine). */
export const getKaabaDistanceKm = (latitude: number, longitude: number) => {
    const dPhi = toRad(KAABA.latitude - latitude);
    const dLambda = toRad(KAABA.longitude - longitude);
    const a =
        Math.sin(dPhi / 2) ** 2 +
        Math.cos(toRad(latitude)) * Math.cos(toRad(KAABA.latitude)) * Math.sin(dLambda / 2) ** 2;
    return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
};
