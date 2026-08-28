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
