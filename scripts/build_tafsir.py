#!/usr/bin/env python3
"""
Builds public/tafsir-data/<edition>/: the tafsir texts the app reads, served from kuran360.com.

Sources (the app shows each one's credit under its tafsir):
  - 'translation' and 'tafsir': the QuranEnc.com API (https://quranenc.com/en/home/api/), whose terms allow
    republishing the texts unchanged, crediting the publisher and QuranEnc.com. 'translation' has one text per
    verse (the Mukhtasar is published as a translation of its Arabic original); 'tafsir' has blocks covering a
    verse range (from_aya..to_aya), e.g. As-Sa'di explains verses in groups.
  - 'epub': the Diyanet's Kur'an Yolu Türkçe Meal ve Tefsir, the five EPUB volumes on dijital.diyanet.gov.tr,
    used with the Diyanet's permission. Downloaded into scripts/.cache/.

Output, per edition:
  <surah>.json  [{ "from": 1, "to": 5, "text": "..." }, ...]  ordered by verse; what the app fetches live
  all.json      { "version": "...", "surahs": { "<surah>": [...same blocks...] } }  the whole-Quran download

Usage: python3 scripts/build_tafsir.py [edition ...]   (default: every edition below)
"""
import collections
import datetime
import html.parser
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request
import zipfile

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT_DIR = os.path.join(ROOT, 'public', 'tafsir-data')
API = 'https://quranenc.com/api/v1'

# Edition ids match TAFSIR_SOURCES in src/services/tafsir.ts
EDITIONS = {
    'muhtasar-tr': {'kind': 'translation', 'key': 'turkish_mokhtasar'},
    'muhtasar-en': {'kind': 'translation', 'key': 'english_mokhtasar'},
    'saadi-tr': {'kind': 'tafsir', 'key': 'turkish_saadi'},
    'kuranyolu-tr': {
        'kind': 'epub',
        'key': 'kuran-yolu',
        # Volume pages: https://dijital.diyanet.gov.tr/Kitaplik/genel/kuran-yolu-turkce-meal-ve-tefsir-<n>?id=<id>
        'volumes': [3788, 3789, 3790, 3791, 3792],
    },
    'elmalili-tr': {'kind': 'elmalili', 'key': 'hak-dini-kuran-dili'},  # pages: ELMALILI_PAGES below
}
CACHE_DIR = os.path.join(ROOT, 'scripts', '.cache', 'tafsir')

# Elmalılı's Hak Dini Kur'an Dili (a simplified edition, used with the publisher's permission), as published on
# kuranikerim.com/telmalili around 2001-2002 and kept by the Wayback Machine: one page per surah, Bakara in three.
ELMALILI_PAGES = [
    'fatiha', 'bakara1', 'bakara2', 'bakara3', 'imran', 'nisa', 'maide', 'enam', 'araf', 'enfal', 'tevbe', 'yunus',
    'hud', 'yusuf', 'rad', 'ibrahim', 'hicr', 'nahl', 'isra', 'kehf', 'meryem', 'taha', 'enbiya', 'hac', 'muminun',
    'nur', 'furkan', 'suara', 'neml', 'kasas', 'ankebut', 'rum', 'lokman', 'secde', 'ahzab', 'sebe', 'fatir', 'yasin',
    'saffat', 'sad', 'zumer', 'mumin', 'fussilet', 'sura', 'zuhruf', 'duhan', 'casiye', 'ahkaf', 'muhammed', 'fetih',
    'hucurat', 'kaf', 'zariyat', 'tur', 'necm', 'kamer', 'rahman', 'vakia', 'hadid', 'mucadele', 'hasr', 'mumtehine',
    'saf', 'cuma', 'munafikun', 'tegabun', 'talak', 'tahrim', 'mulk', 'kalem', 'hakka', 'mearic', 'nuh', 'cin',
    'muzzemmil', 'muddessir', 'kiyamet', 'insan-dehr', 'murselat', 'nebe', 'naziat', 'abese', 'tekvir', 'infitar',
    'mutaffifin', 'insikak', 'buruc', 'tarik', 'ala', 'gasiye', 'fecr', 'beled', 'sems', 'leyl', 'duha', 'insirah',
    'tin', 'alak', 'kadir', 'beyyine', 'zilzal', 'adiyat', 'kaaria', 'tekasur', 'asr', 'humeze', 'fil', 'kureys',
    'maun', 'kevser', 'kafirun', 'nasr', 'tebbet', 'ihlas', 'felak', 'nas',
]
ELMALILI_URL = 'https://web.archive.org/web/2003id_/http://www.kuranikerim.com:80/telmalili/{}.htm'


def get_json(url, retries=4):
    for attempt in range(retries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': 'Kuran360 build script'}), timeout=60) as response:
                return json.load(response)
        except Exception:
            if attempt == retries - 1:
                raise
            time.sleep(2 * (attempt + 1))


def clean(text):
    return '\n'.join(line.strip() for line in (text or '').strip().splitlines()).strip()


# QuranEnc tafsir block types (Arabic labels), in surah order. Only verse commentary has a verse range; the rest
# have from_aya 0 and belong to the commentary next to them.
VERSE_TAFSIR = 'تفسير آية'
VERSE_TAFSIR_CONTINUED = 'تكملة تفسير الآية'
# Introductions to the verses that follow: put in front of the next verse's commentary
INTRO_TYPES = {'تمهيد للآيات', 'تمهيد للمقطع'}
# Lessons, notes and quotes about the verses just explained: added after the previous verse's commentary
AFTERWORD_TYPES = {'فوائد للآيات', 'فوائد للسورة', 'خاتمة للآيات السابقة', 'فصل', 'اقتباس'}
# Everything else is left out: 'المقطع' is the translation of the verse group (the app shows its own
# translations), plus the surah's name, place of revelation, basmala, '***' separators, volume prefaces and the
# closing formula of each surah.


def tafsir_blocks(rows):
    blocks, intro = [], []
    for row in rows:
        kind, text = row['type'], clean(row['text'])
        if not text:
            continue
        if kind == VERSE_TAFSIR:
            blocks.append({'from': int(row['from_aya']), 'to': int(row['to_aya']), 'text': '\n\n'.join(intro + [text])})
            intro = []
        elif kind == VERSE_TAFSIR_CONTINUED and blocks:
            blocks[-1]['text'] += '\n\n' + text
        elif kind in INTRO_TYPES:
            intro.append(text)
        elif kind in AFTERWORD_TYPES and blocks:
            blocks[-1]['text'] += '\n\n' + text
    return blocks


def download_volume(volume_id):
    path = os.path.join(CACHE_DIR, f'kuran-yolu-{volume_id}.epub')
    if not os.path.exists(path):
        os.makedirs(CACHE_DIR, exist_ok=True)
        name = urllib.parse.quote(f'KURAN YOLU {volume_id}')
        url = f'https://dijital.diyanet.gov.tr/File/EpubDownload?path={volume_id}_2.epub&name={name}&id={volume_id}'
        request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Kuran360 build script)'})
        with urllib.request.urlopen(request, timeout=120) as response, open(path + '.part', 'wb') as f:
            f.write(response.read())
        os.replace(path + '.part', path)
    return path


def download_elmalili_page(name):
    path = os.path.join(CACHE_DIR, 'elmalili', f'{name}.htm')
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        request = urllib.request.Request(ELMALILI_URL.format(name), headers={'User-Agent': 'Kuran360 build script'})
        for attempt in range(4):
            try:
                with urllib.request.urlopen(request, timeout=120) as response:
                    data = response.read()
                break
            except Exception:
                if attempt == 3:
                    raise
                time.sleep(5 * (attempt + 1))
        with open(path + '.part', 'wb') as f:
            f.write(data)
        os.replace(path + '.part', path)
        time.sleep(1)  # go easy on the Wayback Machine
    return path


class ParagraphParser(html.parser.HTMLParser):
    """Collects the book's top-level paragraphs and headings as (class, text) in document order."""

    BLOCKS = {'p', 'h1', 'h2'}

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.items, self.current, self.depth = [], None, 0

    def handle_starttag(self, tag, attrs):
        if tag in self.BLOCKS and self.current is None:
            self.current, self.parts = dict(attrs).get('class', ''), []
            self.tag = tag
        elif tag == 'br' and self.current is not None:
            self.parts.append(' ')

    def handle_endtag(self, tag):
        if self.current is not None and tag == self.tag:
            text = re.sub(r'\s+', ' ', ''.join(self.parts)).strip()
            self.items.append((self.tag, self.current, text))
            self.current = None

    def handle_data(self, data):
        if self.current is not None:
            self.parts.append(data)


def epub_paragraphs(path):
    """Every paragraph of the EPUB, following the reading order in its content.opf spine."""
    with zipfile.ZipFile(path) as book:
        opf = book.read('OEBPS/content.opf').decode('utf-8')
        hrefs = dict(re.findall(r'<item[^>]*id="([^"]+)"[^>]*href="([^"]+)"', opf))
        hrefs.update({i: h for h, i in re.findall(r'<item[^>]*href="([^"]+)"[^>]*id="([^"]+)"', opf)})
        for idref in re.findall(r'<itemref[^>]*idref="([^"]+)"', opf):
            parser = ParagraphParser()
            parser.feed(book.read('OEBPS/' + hrefs[idref]).decode('utf-8'))
            yield from parser.items


SURAH_HEADING = re.compile(r'^(\d+) \(\d+\)')
VERSE_RANGE = re.compile(r'^(\d+)(?:\s*[–-]\s*(\d+))?$')
SECTION_TITLES = {'Meâli', 'Tefsiri'}


def kuran_yolu_surahs(edition):
    """
    The volumes run: a surah heading (h1 "2 (87) Bakara Sûresi"), the surah's introduction, then per verse group a
    range line ("1 – 5"), the Arabic text, "Meâli" with its translation and "Tefsiri" with the commentary. Only the
    commentary is kept: the app shows the Arabic and the Kur'an Yolu translation itself.
    """
    surahs, surah, block, section = {}, None, None, None
    for volume_id in edition['volumes']:
        for tag, cls, text in epub_paragraphs(download_volume(volume_id)):
            if tag == 'h1':
                # Other h1s are the front matter (Takdim, Ön Söz, Giriş) and the back matter (Bibliyografya, Dizin)
                heading = SURAH_HEADING.match(text)
                surah, block, section = (int(heading.group(1)) if heading else None), None, None
                if surah:
                    surahs.setdefault(str(surah), [])
                continue
            if surah is None or not text:
                continue
            verse_range = VERSE_RANGE.match(text) if cls.startswith('normalnesil5mmbefore') else None
            if verse_range:
                start = int(verse_range.group(1))
                block = {'from': start, 'to': int(verse_range.group(2) or start), 'text': ''}
                surahs[str(surah)].append(block)
                section = None
            elif cls.startswith('solbaslik') or text in SECTION_TITLES:
                # A few "Meâli"/"Tefsiri" headings are styled like the range lines instead
                section, meal_verses = text, set()
            elif block is not None and section == 'Meâli' and cls.startswith('normalnesil'):
                # Translation paragraphs start with their verse number. One group (2:212) has no "Tefsiri" heading:
                # its commentary starts right after the translation, with the same verse number again.
                number = re.match(r'(\d+)\.', text)
                if number and number.group(1) in meal_verses:
                    section = 'Tefsiri'
                    block['text'] += ('\n\n' if block['text'] else '') + text
                elif number:
                    meal_verses.add(number.group(1))
            elif block is not None and section == 'Tefsiri' and cls.startswith('normalnesil'):
                block['text'] += ('\n\n' if block['text'] else '') + text
    return surahs


def elmalili_paragraphs(path):
    raw = open(path, 'rb').read()
    charset = re.search(rb'charset=([\w-]+)', raw)
    page = raw.decode(charset.group(1).decode() if charset else 'iso-8859-9', 'replace')
    page = re.sub(r'<script.*?</script>|<style.*?</style>', '', page, flags=re.S | re.I)
    # Source line breaks fall inside paragraphs; most pages put paragraphs in <p>, a few in <div>s or split them with <br>
    page = re.sub(r'\s+', ' ', page)
    page = re.sub(r'<(?:/p|/div|br\s*/?|p|div)(?:\s[^>]*)?>', '\n', page, flags=re.I)
    # The text starts after the site's banner "(ELMALILI MUHAMMED HAMDİ YAZIR)"
    page = page[page.find('\n', page.find('HAMDİ YAZIR')) + 1:]
    for line in html.unescape(re.sub(r'<[^>]+>', '', page)).split('\n'):
        text = re.sub(r'\s+', ' ', line).strip()
        if text:
            yield text


PAGE_HEADING = re.compile(r'^(\d+)\s*-\s*[^:]{2,30}:$')  # "109-KAFİRUN:"
MEAL_HEADING = re.compile(r'^Meâl-i Şerif')
# A paragraph opening with a verse number: "6- Şu muhakkak ki", "2. O insanların", "1-3- ...", "12 - ..."
MARKER = re.compile(r'^(\d{1,3})\s*([-.–])\s*(?:\d{1,3}\s*[-.–]\s*)?(?=\D)')
MARKER_WINDOW = 10  # a numbered paragraph further ahead than this is a list item or a date, not the next verse
MIN_SURAH_CHARS = 3000  # less than this is the translation alone (the archived Abese page)


def elmalili_page_surah(index):
    """ELMALILI_PAGES runs Fâtiha, Bakara's three pages, then one page per surah."""
    return 1 if index == 0 else 2 if index <= 3 else index - 1


def elmalili_surahs(edition):
    """
    A page opens with the surah's heading and facts ("Mekke Döneminde İndi", "Âyet Sayısı: 6") and an introduction.
    Two layouts follow. Most long surahs go in groups: "Meâl-i Şerifi", the group's translation one numbered line per
    verse ("6- ...", "7- ..."), then the commentary; the translation lines give the group's verses and are left out
    (the app shows the translation itself). Elsewhere the commentary simply runs on, a paragraph opening with a verse
    number ("2. ...", "5- ...") where the next verse starts; those are kept, as they carry the verse's explanation.
    A block starts at each group or verse number and lasts until the next, so a surah's blocks cover all its verses.
    A group's translation often covers a whole short surah, with the commentary then numbering its verses one by one:
    those numbers split the group further. Numbered list items ("1- ...", "2- ...") are told apart from verses as a run
    restarting at 1; where a list item's number could also be the next verse, the page's usual verse numbering style
    ("2." or "2-") decides.
    """
    verse_counts = {int(k): max(b['to'] for b in v) for k, v in
                    json.load(open(os.path.join(OUT_DIR, 'muhtasar-tr', 'all.json')))['surahs'].items()}
    surahs = {}
    for index, page in enumerate(ELMALILI_PAGES):
        surah = elmalili_page_surah(index)
        count = verse_counts[surah]
        paragraphs = list(elmalili_paragraphs(download_elmalili_page(page)))
        if paragraphs and PAGE_HEADING.match(paragraphs[0]):
            paragraphs = paragraphs[1:]
        facts = next((i for i, p in enumerate(paragraphs[:8]) if p.startswith('Âyet Sayısı')), None)
        if facts is not None:
            paragraphs = paragraphs[facts + 1:]
        if sum(len(p) for p in paragraphs) < MIN_SURAH_CHARS:
            print(f'  {page}: no commentary, skipped')
            continue

        blocks = surahs.get(surah)
        if blocks is None:  # Bakara's later pages pick up where the page before stopped
            blocks = surahs[surah] = [{'from': 1, 'parts': []}]
            reached = 1
        else:
            reached = blocks[-1]['reached']

        def start(verse):
            if verse > blocks[-1]['from']:
                blocks.append({'from': verse, 'parts': []})

        separators = collections.Counter(m.group(2).replace('–', '-') for m in map(MARKER.match, paragraphs) if m)
        verse_separator = separators.most_common(1)[0][0] if separators else '.'
        # Text before the page's first group can't be the commentary of that group's verses: numbers there that would
        # fall inside it belong to a list (Fâtiha's besmele: "1- ... ile", "2- ... ile", ...)
        first_meal = next((i for i, p in enumerate(paragraphs) if MEAL_HEADING.match(p)), None)
        first_marker = next((MARKER.match(p) for p in paragraphs[first_meal + 1:first_meal + 2]), None) if first_meal is not None else None
        first_group = int(first_marker.group(1)) if first_marker else None
        in_meal = False
        list_next = list_separator = None
        for position, text in enumerate(paragraphs):
            if MEAL_HEADING.match(text):
                in_meal, meal = True, []
                continue
            marker = MARKER.match(text)
            number = int(marker.group(1)) if marker else None
            if in_meal:
                if number and (number > meal[-1] if meal else number <= count):
                    if not meal:  # the commentary may number the group's verses again, so it counts from its first
                        start(number)
                        reached = number
                    meal.append(number)
                    continue
                in_meal = False
            if number is not None:
                separator = marker.group(2).replace('–', '-')
                if number == list_next and (number <= reached or separator != verse_separator
                                            or list_separator != verse_separator):
                    list_next += 1
                elif number == 1 and reached >= 1:
                    list_next, list_separator = 2, separator
                elif (first_group is not None and position < first_meal and number >= first_group):
                    pass
                elif reached < number <= min(count, reached + MARKER_WINDOW):
                    start(number)
                    reached, list_next = number, None
            blocks[-1]['parts'].append(text)
        blocks[-1]['reached'] = reached

    result = {}
    for surah, blocks in surahs.items():
        # A group with no commentary (missing from the archived page) stays a gap rather than widen the one before
        result[str(surah)] = [
            {'from': b['from'], 'to': (blocks[i + 1]['from'] - 1 if i + 1 < len(blocks) else verse_counts[surah]),
             'text': '\n\n'.join(b['parts'])}
            for i, b in enumerate(blocks) if b['parts']
        ]
    return result


def surah_blocks(edition, surah):
    if edition['kind'] == 'translation':
        rows = get_json(f"{API}/translation/sura/{edition['key']}/{surah}")['result']
        blocks = [{'from': int(r['aya']), 'to': int(r['aya']), 'text': clean(r['translation'])} for r in rows]
    else:
        blocks = tafsir_blocks(get_json(f"{API}/tafsir/sura/{edition['key']}/{surah}")['result'])
    blocks = [b for b in blocks if b['text']]
    blocks.sort(key=lambda b: (b['from'], b['to']))
    return blocks


# A block's text often opens with its verse numbers ("6. Daha sonra", "1-2-3- Yâsin", "3-4 Onlar"), which the app
# already shows above the text
LEADING_VERSES = re.compile(r'^(\d{1,3})((?:\s*[-–]\s*\d{1,3})*)(\s*[-–.)]\s*|\s+)(?=\D)')


def strip_leading_verses(block):
    """
    Drops the verse numbers a block's text opens with when they start at the block's first verse. They may run past
    the block ("21-22." over verse 21 alone, "42-3-" for 42-43) or repeat ("65-72- 65- ..."), hence the loop.
    """
    text = block['text']
    while match := LEADING_VERSES.match(text):
        first = int(match.group(1))
        has_separator = bool(match.group(2)) or not match.group(3).isspace()
        if first != block['from'] or not has_separator:
            break
        text = text[match.end():]
    return block if text == block['text'] else {**block, 'text': text}


def build(edition_id):
    edition = EDITIONS[edition_id]
    out = os.path.join(OUT_DIR, edition_id)
    os.makedirs(out, exist_ok=True)
    whole = {'epub': kuran_yolu_surahs, 'elmalili': elmalili_surahs}.get(edition['kind'], lambda _: None)(edition)
    surahs = {}
    for surah in range(1, 115):
        if whole is None:
            blocks = surah_blocks(edition, surah)
        else:
            blocks = sorted((b for b in whole.get(str(surah), []) if b['text']), key=lambda b: (b['from'], b['to']))
        blocks = [strip_leading_verses(b) for b in blocks]
        surahs[str(surah)] = blocks
        with open(os.path.join(out, f'{surah}.json'), 'w', encoding='utf-8') as f:
            json.dump(blocks, f, ensure_ascii=False, separators=(',', ':'))
        print(f'\r{edition_id}: {surah}/114', end='', flush=True)
    # QuranEnc doesn't list a version for every text, and the EPUBs have none, so the fetch date identifies the copy
    version = f"{edition['key']}@{datetime.date.today().isoformat()}"
    with open(os.path.join(out, 'all.json'), 'w', encoding='utf-8') as f:
        json.dump({'version': version, 'surahs': surahs}, f, ensure_ascii=False, separators=(',', ':'))
    size = os.path.getsize(os.path.join(out, 'all.json'))
    print(f'\r{edition_id}: {sum(len(b) for b in surahs.values())} blocks, all.json {size / 1e6:.1f} MB')


if __name__ == '__main__':
    for edition_id in sys.argv[1:] or EDITIONS:
        build(edition_id)
