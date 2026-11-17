import pageMappingData from './pageMapping.json';

// [surahNumber, fromVerse, toVerse] — a verse always belongs entirely to one page
// (approximated to the page it starts on in the standard 604-page Madani Mushaf).
export type PageVerseRange = [number, number, number];

const pages = (pageMappingData as unknown as { pages: Record<string, PageVerseRange[]> }).pages;

export const TOTAL_MUSHAF_PAGES = pageMappingData.totalPages;

export function getVerseRangesForPage(pageNumber: number): PageVerseRange[] {
  return pages[String(pageNumber)] ?? [];
}

let verseToPageIndex: Map<string, number> | null = null;

function buildVerseToPageIndex(): Map<string, number> {
  const index = new Map<string, number>();
  for (const [pageKey, ranges] of Object.entries(pages)) {
    const pageNumber = Number(pageKey);
    for (const [surahNumber, fromVerse, toVerse] of ranges) {
      for (let verse = fromVerse; verse <= toVerse; verse++) {
        index.set(`${surahNumber}:${verse}`, pageNumber);
      }
    }
  }
  return index;
}

export function getPageForVerse(surahNumber: number, verseNumber: number): number | null {
  if (!verseToPageIndex) {
    verseToPageIndex = buildVerseToPageIndex();
  }
  return verseToPageIndex.get(`${surahNumber}:${verseNumber}`) ?? null;
}

// First verse [surah, verse] of each juz, checked against api.alquran.cloud. Juz 7 and 11 start mid-page.
const JUZ_START_VERSES: [number, number][] = [
  [1, 1], [2, 142], [2, 253], [3, 93], [4, 24], [4, 148], [5, 82], [6, 111], [7, 88], [8, 41],
  [9, 93], [11, 6], [12, 53], [15, 1], [17, 1], [18, 75], [21, 1], [23, 1], [25, 21], [27, 56],
  [29, 46], [33, 31], [36, 28], [39, 32], [41, 47], [46, 1], [51, 31], [58, 1], [67, 1], [78, 1],
];
export const TOTAL_JUZ = JUZ_START_VERSES.length;

/** Page the juz starts on (1-based juz) */
export function getJuzStartPage(juz: number): number {
  const [surahNumber, verseNumber] = JUZ_START_VERSES[Math.min(Math.max(juz, 1), TOTAL_JUZ) - 1];
  return getPageForVerse(surahNumber, verseNumber) ?? 1;
}

/** Juz of the page's last verse, so a page where a juz starts mid-page counts as that new juz */
export function getJuzForPage(pageNumber: number): number {
  const ranges = getVerseRangesForPage(pageNumber);
  const last = ranges[ranges.length - 1];
  if (!last) return 1;
  const [surahNumber, , verseNumber] = last;
  let juz = 1;
  JUZ_START_VERSES.forEach(([s, v], i) => {
    if (surahNumber > s || (surahNumber === s && verseNumber >= v)) juz = i + 1;
  });
  return juz;
}
