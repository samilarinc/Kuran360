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
  - 'elmalili': Elmalılı's Hak Dini Kur'an Dili, see ELMALILI_PAGES.
  - 'bilmen': Ömer Nasuhi Bilmen's Kur'ân-ı Kerîm'in Türkçe Meâl-i Âlîsi ve Tefsiri, the OCR text of the 2020
    Kitap Kalbi edition on archive.org, see BILMEN_ITEM.
  - 'tefhim': Mevdûdî's Tefhîmu'l-Kur'ân in Turkish, the islam-tr.net text on archive.org, see TEFHIM_URL.
  - 'qul': the classical tafsirs (al-Jalalayn, Ibn Kathir, at-Tabari, al-Qurtubi) from Quran.com / QUL, see QUL_API.

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
    'bilmen-tr': {'kind': 'bilmen', 'key': 'bilmen-meal-i-alisi-ve-tefsiri'},  # volumes: BILMEN_ITEM below
    'tefhim-tr': {'kind': 'tefhim', 'key': 'mevdudi-tefhimul-kuran'},  # text: TEFHIM_URL below
    # Arabic originals and English translations of the classical tafsirs: QUL_API below
    'saadi-ar': {'kind': 'tafsir', 'key': 'arabic_saadi'},
    'celaleyn-ar': {'kind': 'qul', 'key': 'ar-tafsir-al-jalalayn'},
    'celaleyn-en': {'kind': 'qul', 'key': 'tafsir-al-jalalayn'},
    'ibnkesir-ar': {'kind': 'qul', 'key': 'ar-tafsir-ibn-kathir'},
    'ibnkesir-en': {'kind': 'qul', 'key': 'en-tafisr-ibn-kathir'},
    'taberi-ar': {'kind': 'qul', 'key': 'ar-tafsir-al-tabari'},
    'kurtubi-ar': {'kind': 'qul', 'key': 'ar-tafseer-al-qurtubi'},
}
# The tafsirs of Quran.com / QUL (qul.tarteel.ai), as mirrored per surah by github.com/spa5k/tafsir_api:
# [{ "surah": 2, "ayah": 1, "text": "..." }, ...]. A verse group's commentary sits on its first verse and the group's
# other verses are left out, or repeat it.
QUL_API = 'https://raw.githubusercontent.com/spa5k/tafsir_api/main/tafsir'  # jsDelivr refuses it: over 50 MB
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


# Ömer Nasuhi Bilmen's tafsir (the 2020 simplified edition by Kitap Kalbi Yayıncılık, in 7 volumes), as the OCR text
# archive.org derived from its scans
BILMEN_ITEM = 'https://archive.org/download/o-mer-nasuhi-bi-lmen-tefsi-ri-ci-ld-2-yeni-basim/'
BILMEN_VOLUME = 'ÖMER NASUHİ BİLMEN TEFSİRİ CİLD {} (YENİ BASIM)_djvu.txt'

_I = '[İIiı]'  # the OCR mixes up the cases of the headings: "MEÂLİ âLisi"
BILMEN_MEAL = re.compile(rf'^.{{0,6}}[Mm][Ee][ÂAâa][Ll]{_I}\s+[ÂAâa][Ll]{_I}[Ss]{_I}[\s|.\-]*$')
BILMEN_IZAH = re.compile(rf'^.{{0,6}}\b{_I}[Zz][Aa][Hh][\s|.\-]*$')
# Running heads: "Cüz: 10 Süre: 9 Meâli Âlisi ve Tefsiri 71" on odd pages, "70 Kur'an-ı Kerim'in Türkçe Enfâl Süresi"
# on even ones
BILMEN_PAGE_SURAH = re.compile(r'C[üu]z\s*:+\s*\d+\s+\S{3,5}\s*:\s*(\d+)')
BILMEN_HEAD = re.compile(r'^\s*(C[üu]z\s*:|\d+\s+Kur.?[âa]n-?ı Kerim.?in T[üu]rk[çc]e)|Meâli Âlisi ve Tefsiri\s*\d*\s*$')
BILMEN_SURAH_TITLE = re.compile(r"^[-\s]*[A-ZÂÎÛÇĞİÖŞÜ' -]{2,40}S[ÜUÛ]RE(S[İI]|-[İI] CEL[İI]LES[İI])\s*$")
# A paragraph about a verse opens with its number: "(5).", "(2:4).", "(2, 3, 4)."; the OCR reads some 1s as 0
BILMEN_MARK = re.compile(r'^\((\d{1,3})((?:\s*[,:\-–]\s*\d{1,3})*)\)\s*[.,:]?\s*')
# A line of the topic index at the end of each volume: "Hırsızlık: 5/38", "Domuz: 2/173"
BILMEN_INDEX_LINE = re.compile(r'^[^\W\d][^:]{1,60}:\s*\d{1,3}\s*/\s*\d')
# Two-letter words of Turkish; any other one- or two-letter word is a sign of Arabic read as Latin letters
SHORT_WORDS = {'o', 've', 'de', 'da', 'bu', 'şu', 'ki', 'mi', 'mı', 'mu', 'mü', 'ne', 'ya', 'ey', 'ah', 'iş', 'üç',
               'el', 'en', 'ay', 'af', 'ad', 'su', 'ok', 'at', 'an', 'ön', 'öz', 'ar', 'aş', 'iz', 'ol', 'on', 'oy',
               'ta', 'ha', 'hz', 'as', 'sa', 'ra', 'ab', 'ak', 'al', 'is', 'eş', 'ev', 'iç', 'ip', 'ur', 'us', 'üs'}
VOWELS = set('aeıioöuüâîûAEIİOÖUÜÂÎÛ')
SENTENCE_END = tuple('.!?:;…”"»)')


def download_bilmen_volume(number):
    path = os.path.join(CACHE_DIR, 'bilmen', f'cild-{number}.txt')
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        url = BILMEN_ITEM + urllib.parse.quote(BILMEN_VOLUME.format(number))
        request = urllib.request.Request(url, headers={'User-Agent': 'Kuran360 build script'})
        with urllib.request.urlopen(request, timeout=300) as response, open(path + '.part', 'wb') as f:
            f.write(response.read())
        os.replace(path + '.part', path)
    return path


def is_ocr_noise(text):
    """Arabic script read as Latin letters: mostly consonant clusters, odd casing and stray short words."""
    words = re.findall(r"[^\W\d_]+(?:['’\-][^\W\d_]+)*", text)
    if not words:
        return True

    def odd(word):
        bare = re.sub(r"['’\-]", '', word)
        if len(bare) <= 2:
            return bare.lower() not in SHORT_WORDS
        if not any(c in VOWELS for c in bare):
            return True
        return not (word.islower() or word.istitle() or (word.isupper() and len(bare) >= 4)
                    or (word[0].isupper() and word[1:].islower()))
    return sum(map(odd, words)) / len(words) >= 0.34


def bilmen_clean_line(line):
    """The line without OCR noise; None when it's all noise or a running head."""
    line = line.strip(' \t|')  # "|": table rules read as letters
    if not line or BILMEN_HEAD.search(line):
        return None
    # A hadith or verse quoted in Arabic is followed by its meaning after a slash: keep the meaning
    if ' / ' in line:
        before, after = line.split(' / ', 1)
        if is_ocr_noise(before):
            line = after.strip()
    return None if is_ocr_noise(line) else line


def bilmen_text(lines):
    """
    Joins the lines into paragraphs: a word broken at a line end is put back together, and a blank line only ends a
    paragraph after a sentence end (blank lines also fall at page breaks, mid-sentence).
    """
    paragraphs, current, blank = [], '', False
    for raw in lines:
        if not raw.strip():
            blank = True
            continue
        line = bilmen_clean_line(raw)
        if line is None:
            continue
        if not current:
            current = line
        elif BILMEN_MARK.match(line):
            # A verse's commentary starts a paragraph; a short unfinished line before it is a scrap of the Arabic
            if current.endswith(SENTENCE_END) or len(current) >= 40:
                paragraphs.append(current)
            current = line
        elif current.endswith('-') and current[-2:-1].isalpha() and line[:1].islower():
            current = current[:-1] + line
        elif blank and current.endswith(SENTENCE_END):
            paragraphs.append(current)
            current = line
        else:
            current += ' ' + line
        blank = False
    if current:
        paragraphs.append(current)
    # A block ends where the next group's Arabic begins: drop what's left of it
    while paragraphs and not paragraphs[-1].endswith(SENTENCE_END) and len(paragraphs[-1]) < 200:
        paragraphs.pop()
    return '\n\n'.join(paragraphs)


def bilmen_volume_lines(number):
    lines = open(download_bilmen_volume(number), encoding='utf-8').read().splitlines()
    # The topic index at the end: the first place with several index lines close together
    hits = [i for i, line in enumerate(lines) if BILMEN_INDEX_LINE.match(line.strip())]
    for k in range(len(hits) - 3):
        if hits[k + 3] - hits[k] < 15:
            return lines[:hits[k]]
    return lines


def bilmen_surahs(edition):
    """
    Each surah opens with its title ("BAKARA SÜRESİ") and an introduction, then runs in verse groups: "MEÂLİ ÂLİSİ"
    with the group's translation, one numbered paragraph per verse ("(6). ..."), then "İZAH" with the commentary,
    again opening each verse with its number ("(6). ..." or "(2:4)." for several). Only the commentary is kept: the
    app shows the translation itself. The surah's introduction goes in front of its first verse's commentary.
    Surahs are counted where a group starts again at verse 1 (or 2, when the first verse is explained with the
    second); the page heads naming the surah ("Cüz: 10 Süre: 9") confirm it, and catch a start the OCR garbled.
    """
    counts = {int(k): max(b['to'] for b in v) for k, v in
              json.load(open(os.path.join(OUT_DIR, 'muhtasar-tr', 'all.json')))['surahs'].items()}
    surahs = collections.defaultdict(list)
    surah = reached = announced = 0
    mode, intro, group_start = None, [], None
    for number in range(1, 8):
        for line in bilmen_volume_lines(number):
            text = line.strip()
            page_surah = BILMEN_PAGE_SURAH.search(text)
            if page_surah and surah < int(page_surah.group(1)) <= surah + 3:
                # A second page naming the next surah means its start was missed: switch here
                if announced == int(page_surah.group(1)):
                    surah, reached = announced, 0
                announced = int(page_surah.group(1))
            if BILMEN_SURAH_TITLE.match(text):
                mode, intro = 'intro', []
                continue
            if BILMEN_MEAL.match(text):
                mode, group_start = 'meal', None
                continue
            if BILMEN_IZAH.match(text):
                mode = 'izah'
                continue
            mark = BILMEN_MARK.match(text)
            if mode == 'intro':
                intro.append(line)
            elif mode == 'meal' and mark:
                if group_start is None:
                    group_start = int(mark.group(1))
                    if group_start <= 2 and surah < 114:
                        if announced > surah:
                            surah, reached = announced, 0
                        elif surah == 0 or (group_start < reached and reached >= counts[surah] / 2):
                            surah, reached = surah + 1, 0
                elif int(mark.group(1)) == group_start:
                    # Numbering back at the group's start: the commentary has begun, its heading lost in the OCR
                    mode = 'izah'
            if mode == 'izah':
                verse = int(mark.group(1)) if mark else None
                if verse == 0 and reached == 0:
                    verse = 1
                # A number further ahead than this is a list item or a date, not the next verse
                if verse is not None and reached < verse <= min(counts[surah], reached + 30):
                    surahs[surah].append({'from': verse, 'lines': (intro if not surahs[surah] else []) + [line]})
                    reached, intro = verse, []
                elif surahs[surah]:
                    surahs[surah][-1]['lines'].append(line)
                else:  # before the surah's first numbered paragraph (its number garbled): kept with it
                    intro.append(line)

    result = {}
    for surah, blocks in surahs.items():
        result[str(surah)] = []
        for i, block in enumerate(blocks):
            text = bilmen_text(block['lines'])
            # The verse number the commentary opens with; the app shows it above the text
            text = re.sub(r'^(.*?\n\n)?\(\d{1,3}(?:\s*[,:\-–]\s*\d{1,3})*\)\s*[.,:]?\s*', r'\1', text, count=1, flags=re.S)
            to = blocks[i + 1]['from'] - 1 if i + 1 < len(blocks) else counts[surah]
            # Starting at verse 2, the first block also holds verse 1's commentary, its number garbled
            start = 1 if i == 0 and block['from'] == 2 else block['from']
            result[str(surah)].append({'from': start, 'to': to, 'text': text})
    return result


TEFHIM_URL = 'https://archive.org/download/mevdudi-tefhimul-kuran_202405/Mevdudi-Tefhimul-Kuran_djvu.txt'
TEFHIM_TITLE = re.compile(r"^[A-ZÂÎÛÇĞİÖŞÜ' -]{2,30} S[UÛ]RES[İI]\s*$")
# "113 - 114" over "FELAK-NAS (MUAVEZETEYN) SURELERİ": the two last surahs share an introduction and have no own title
TEFHIM_PAIR_TITLE = re.compile(r'^FELAK-NAS\b')
TEFHIM_END = re.compile(r"S[UÛ]RES[İI]('?N[İI]N)?\s+SON|S[UÛ]RES[İI]'N[İI]N SON")
TEFHIM_COMMENTARY = re.compile(r'^AÇIKLAMA(\s*Ayet\s*no.*)?\s*$')
# A translated verse or verse range opens a line: "255 Allah...", "1-3 Hamd,2 ..."
TEFHIM_VERSE = re.compile(r'^(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?(?:\s+|(?=\())(?=[^\d\s.])')
TEFHIM_FOOTNOTE = re.compile(r'^(\d{1,3})\.\s+')
# A footnote mark sits right after a word or its punctuation: "Hamd,2 Alemlerin Rabbi,3"
TEFHIM_MARK = re.compile(r'(?<=[^\s\d])(\d{1,3})(?=[\s,.;:!?)"”’\']|$)')
TEFHIM_BASMALA = re.compile(r"^Rahman,? (ve )?Rahim olan Allah", re.I)
# Page furniture and OCR scraps of ornaments ("e.", ".. uye.", ".. W..")
TEFHIM_NOISE = re.compile(r'^(file:///|HARİTA\b|[.\s]*[euyg]{1,4}[.\s]*\.[.\s]*$|[.\sW]+$|[.\s]*(?:ya|ge|ye|e|Nese|sey eses|seg efes|sy efes|e\.p ej\w+)[.\s]*$)')
TEFHIM_HEADING = re.compile(r'^(GİRİŞ\s*-?|113 - 114|FELAK-NAS|\(MUAVEZETEYN\)|SURELERİ)\s*$')


def download_tefhim():
    path = os.path.join(CACHE_DIR, 'tefhim', 'tefhim.txt')
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        request = urllib.request.Request(TEFHIM_URL, headers={'User-Agent': 'Kuran360 build script'})
        with urllib.request.urlopen(request, timeout=300) as response, open(path + '.part', 'wb') as f:
            f.write(response.read())
        os.replace(path + '.part', path)
    return path


def tefhim_text(lines):
    """Joins lines into paragraphs: a blank line only ends one after a sentence end (blanks also fall at page breaks)."""
    paragraphs, current, blank = [], '', False
    for raw in lines:
        line = re.sub(r'\s+', ' ', raw).strip()
        if not line:
            blank = True
            continue
        if not current:
            current = line
        elif current.endswith('-') and current[-2:-1].isalpha() and line[:1].islower():
            current = current[:-1] + line
        elif blank and current.endswith(SENTENCE_END):
            paragraphs.append(current)
            current = line
        else:
            current += ' ' + line
        blank = False
    if current:
        paragraphs.append(current)
    return '\n\n'.join(paragraphs)


def tefhim_segments(lines):
    """The lines of each surah (1-114), from its title to the next one; surah 113's pair introduction opens its own."""
    starts = []
    for i, line in enumerate(lines):
        text = line.strip()
        if i < 2700:
            continue  # the preface and the biography
        if TEFHIM_TITLE.match(text) and 'SON' not in text:
            starts.append(i)
        elif TEFHIM_PAIR_TITLE.match(text):
            starts.append(i - 1)  # the "113 - 114" line above it
    if len(starts) != 114:
        raise RuntimeError(f'Tefhim: found {len(starts)} surah titles, expected 114')
    return [lines[a:b] for a, b in zip(starts, starts[1:] + [len(lines)])]


def tefhim_surah(segment, count):
    """
    One surah's blocks. The surah opens with its title and an introduction ("GİRİŞ"), then runs in groups: the
    group's translation, one verse (or verse range) per line with the footnote numbers glued to the words ("Hamd,2"),
    then "AÇIKLAMA" with the numbered footnotes ("2. Bu surenin giriş..."). Footnote numbers run on through the surah.
    Each footnote goes to the verse where its number stands (to the whole range for a "1-3" line). The introduction
    goes in front of the first block; a footnote with no number in the translation follows the one before it.
    """
    # The text ends where the surah's closing line is; the first group starts at the last "1 ..." before the first
    # "AÇIKLAMA" (earlier ones are in the introduction's list of topics)
    end = next((i for i, l in enumerate(segment) if TEFHIM_END.search(l.strip())), len(segment))
    lines = [l for l in segment[:end] if not TEFHIM_NOISE.match(l.strip())]
    first_comment = next((i for i, l in enumerate(lines) if TEFHIM_COMMENTARY.match(l.strip())), None)
    if first_comment is None:
        return []
    # (or, when the OCR lost that line, after the basmala that opens the translation)
    begin = max([i for i in range(first_comment) if (m := TEFHIM_VERSE.match(lines[i].strip())) and int(m.group(1)) == 1]
                + [i + 1 for i in range(first_comment) if TEFHIM_BASMALA.match(lines[i].strip())], default=None)
    if begin is None:
        return []
    intro = lines[:begin]
    while intro and (not intro[-1].strip() or TEFHIM_BASMALA.match(intro[-1].strip())):
        intro.pop()
    intro = [l for l in intro if not TEFHIM_TITLE.match(l.strip()) and not TEFHIM_HEADING.match(l.strip())]

    notes = []  # {'verses': (from, to), 'lines': [...]}
    pos, reached, last_note = begin, 0, 0
    while pos < len(lines):
        # The group's translation, up to its "AÇIKLAMA"
        verses, marks = [], {}  # verses: [(from, to, text)]
        while pos < len(lines) and not TEFHIM_COMMENTARY.match(lines[pos].strip()):
            text = lines[pos].strip()
            m = TEFHIM_VERSE.match(text)
            if m:
                a, b = int(m.group(1)), int(m.group(2) or m.group(1))
                # A typo repeats the previous verse's number ("4" then "4-7"): the range then starts one on
                a = max(a, reached + 1) if a <= reached else a
                b = max(a, b)
                verses.append([a, b, text[m.end():]])
                reached = b
            elif verses:
                verses[-1][2] += ' ' + text
            pos += 1
        pos += 1
        for a, b, text in verses:
            for number in map(int, TEFHIM_MARK.findall(text)):
                if last_note < number <= last_note + 40 and number not in marks:
                    marks[number] = (a, b)
        # Its footnotes, up to the next group's first verse
        group_start = verses[0][0] if verses else reached + 1
        current = None
        while pos < len(lines):
            text = lines[pos].strip()
            m = TEFHIM_FOOTNOTE.match(text)
            if m and (int(m.group(1)) == last_note + 1 or (int(m.group(1)) in marks and int(m.group(1)) > last_note)):
                last_note = int(m.group(1))
                span = marks.get(last_note) or (notes[-1]['verses'] if notes and notes[-1]['verses'][0] >= group_start
                                                else (group_start, group_start))
                current = {'verses': span, 'lines': [text[m.end():]]}
                notes.append(current)
            elif (m := TEFHIM_VERSE.match(text)) and reached < int(m.group(1)) <= min(reached + 6, count):
                break  # the next group (a verse lost from the text doesn't stop it)
            elif current:
                current['lines'].append(lines[pos])
            pos += 1
    # Group the footnotes by verse (range)
    blocks = []
    for note in notes:
        if blocks and blocks[-1]['verses'] == note['verses']:
            blocks[-1]['lines'] += [''] + note['lines']
        else:
            blocks.append({'verses': note['verses'], 'lines': list(note['lines'])})
    result = []
    for i, block in enumerate(blocks):
        a, b = block['verses']
        text = tefhim_text((intro + [''] if i == 0 and intro else []) + block['lines'])
        result.append({'from': 1 if i == 0 else a, 'to': min(b, count), 'text': text})
    return result


def tefhim_surahs(edition):
    """
    Mevdûdî's commentary is one numbered footnote after another, keyed to words of the translation, see tefhim_surah.
    The book's preface and biography before the first surah, and the maps and appendices, are left out.
    """
    lines = open(download_tefhim(), encoding='utf-8').read().splitlines()
    return {str(n): tefhim_surah(segment, verse_count(n)) for n, segment in enumerate(tefhim_segments(lines), 1)}


_verse_counts = None


def verse_count(surah):
    global _verse_counts
    if _verse_counts is None:
        _verse_counts = {int(k): max(b['to'] for b in v) for k, v in
                         json.load(open(os.path.join(OUT_DIR, 'muhtasar-tr', 'all.json')))['surahs'].items()}
    return _verse_counts[surah]


def qul_text(text):
    """Drops HTML markup and the print edition's editor footnotes ("[[...]]", as in at-Tabari)."""
    text = re.sub(r'\[\[.*?\]\]', '', text or '', flags=re.S)
    text = re.sub(r'<br\s*/?>|</p>|</h\d>|</div>|</li>', '\n', text, flags=re.I)
    text = html.unescape(re.sub(r'<[^>]+>', '', text))
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r' +([.,:;!?،؛])', r'\1', text)
    # The English al-Jalalayn capitalizes long vowels inside its transliterations ("dhĀlika", "fĪhi")
    text = re.sub(r'(?<=[a-zāīūḥṣḍṭẓ])[ĀĪŪ]', lambda m: m.group(0).lower(), text)
    return re.sub(r'\n{3,}', '\n\n', clean(text))


def qul_blocks(edition, surah):
    """
    A verse's block lasts until the next verse that has commentary of its own. Some editions repeat a group's
    commentary on each of its verses instead: those repeats are merged into one block.
    """
    path = os.path.join(CACHE_DIR, 'qul', edition['key'], f'{surah}.json')
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path + '.part', 'w', encoding='utf-8') as f:
            json.dump(get_json(f"{QUL_API}/{edition['key']}/{surah}.json"), f, ensure_ascii=False)
        os.replace(path + '.part', path)
    rows = sorted(((int(r['ayah']), text) for r in json.load(open(path, encoding='utf-8'))
                   if (text := qul_text(r['text']))))
    blocks = []
    for i, (verse, text) in enumerate(rows):
        to = rows[i + 1][0] - 1 if i + 1 < len(rows) else verse_count(surah)
        if blocks and blocks[-1]['text'] == text:
            blocks[-1]['to'] = to
        else:
            blocks.append({'from': verse, 'to': to, 'text': text})
    return blocks


def surah_blocks(edition, surah):
    if edition['kind'] == 'qul':
        blocks = qul_blocks(edition, surah)
    elif edition['kind'] == 'translation':
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
    # The Arabic As-Sa'di marks verses as "{6}": dropped where the block opens with its first verse, "(6)" elsewhere
    text = re.sub(rf"^\{{{block['from']}\}}\s*", '', block['text'])
    text = re.sub(r'\{(\d+(?:-\d+)?)\}', r'(\1)', text)
    # and quotes the Quran in braces, which the other Arabic tafsirs write as ﴿...﴾
    text = re.sub(r'\{([^{}]+)\}', r'﴿\1﴾', text)
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
    whole = {'epub': kuran_yolu_surahs, 'elmalili': elmalili_surahs, 'bilmen': bilmen_surahs,
             'tefhim': tefhim_surahs}.get(edition['kind'], lambda _: None)(edition)
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
