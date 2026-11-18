export type HolyCity = 'Mekke' | 'Medine';

export interface CustomChecklistItem {
    id: string;
    text: string;
}

export interface UmrahTripData {
    outboundFrom: string;
    outboundFromName: string;
    outboundTo: HolyCity;
    outboundDate: Date | null;

    inboundFrom: HolyCity;
    inboundTo: string;
    inboundToName: string;
    inboundDate: Date | null;

    transferDate: Date | null;
    checklist: Record<string, boolean>;
    customItems: CustomChecklistItem[];
}

export const otherCity = (city: HolyCity): HolyCity => (city === 'Mekke' ? 'Medine' : 'Mekke');

/** YYYY-MM-DD in local time, used by flight/hotel search URLs and web date inputs */
export const toIsoDate = (date: Date | null): string => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/** Parses a web <input type="date"> value as a local date (new Date('YYYY-MM-DD') would be UTC midnight) */
export const fromIsoDate = (value: string): Date | null => {
    const [y, m, d] = value.split('-').map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
};

/** Whole nights between two dates, or null when either is missing or the range is reversed */
export const nightsBetween = (from: Date | null, to: Date | null): number | null => {
    if (!from || !to) return null;
    const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
    const end = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
    const nights = Math.round((end - start) / 86400000);
    return nights >= 0 ? nights : null;
};

/** Both holy cities sit behind one airport each: Mecca pilgrims land in Jeddah, Medina has its own */
const AIRPORT: Record<HolyCity, string> = { Mekke: 'jed', Medine: 'med' };

export const buildSkyscannerUrl = (trip: UmrahTripData): string | null => {
    if (!trip.outboundFrom || !trip.inboundTo || !trip.outboundDate || !trip.inboundDate) return null;
    return `https://www.skyscanner.com.tr/tasima/d/${trip.outboundFrom}/${toIsoDate(trip.outboundDate)}/${AIRPORT[trip.outboundTo]}/${AIRPORT[trip.inboundFrom]}/${toIsoDate(trip.inboundDate)}/${trip.inboundTo}?adultsv2=1&cabinclass=economy&childrenv2=&ref=home`;
};

/**
 * Booking.com search by place name. Booking's numeric dest_id for a city can change,
 * so we let Booking resolve the name itself; the country keeps it from picking a namesake.
 */
const BOOKING_QUERY: Record<HolyCity, string> = {
    Mekke: 'Mekke, Suudi Arabistan',
    Medine: 'Medine, Suudi Arabistan',
};

export const buildBookingUrl = (city: HolyCity, checkin: Date, checkout: Date): string =>
    `https://www.booking.com/searchresults.tr.html?ss=${encodeURIComponent(BOOKING_QUERY[city])}&checkin=${toIsoDate(checkin)}&checkout=${toIsoDate(checkout)}&group_adults=1&no_rooms=1&group_children=0&lang=tr`;

export const HARAMAIN_TRAIN_URL = 'https://sar.hhr.sa/home#/';
export const SAUDI_EVISA_URL = 'https://visa.visitsaudi.com/';
export const NUSUK_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.moh.nusukapp&hl=tr';
export const NUSUK_APP_STORE_URL = 'https://apps.apple.com/tr/app/nusuk-%D9%86%D8%B3%D9%83/id6469515422?l=tr';
