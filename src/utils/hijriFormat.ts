/** BCP 47 locale for dates in the app language */
export const dateLocale = (language: string) => (language === 'en' ? 'en-US' : 'tr-TR');

/** Whole days from `from` to `to`, ignoring the time of day */
export const daysBetween = (from: Date, to: Date) => {
    const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
    const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
    return Math.round((b.getTime() - a.getTime()) / 86400000);
};
