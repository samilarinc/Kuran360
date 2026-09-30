#!/usr/bin/env python3
"""
Builds public/wordTimings/<reciterId>.json: when each displayed word starts in a verse's audio file.

Sources:
  - quran-align (https://github.com/cpfair/quran-align, CC BY 4.0): forced-alignment timings per Tanzil word,
    made from the EveryAyah recordings of the matching reciter.
  - alquran.cloud quran-uthmani (Tanzil text): the word split quran-align's indices refer to.

The app splits a verse differently (see getWordSegments in src/utils/arabicText.ts: particles are folded into the
next word), so each app word is mapped to Tanzil words by comparing consonant skeletons.

Output: { "<surah>:<verse>": [startMs of app word 0, startMs of app word 1, ...], ... }. A word ends where the next
one starts; the last one ends with the audio. Verses that can't be matched are left out.

Usage: python3 scripts/build_word_timings.py
"""
import io
import json
import os
import unicodedata
import urllib.request
import zipfile

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
OUT_DIR = os.path.join(ROOT, 'public', 'wordTimings')

QURAN_ALIGN_ZIP = 'https://github.com/cpfair/quran-align/releases/download/release-2016-11-24/quran-align-data-2016-11-24.zip'
TANZIL_URL = 'https://api.alquran.cloud/v1/quran/quran-uthmani'

# app reciter id -> quran-align file (the recording must be the one served from <reciter folder>)
RECITERS = {
    'sudais': 'Abdurrahmaan_As-Sudais_192kbps',
}

BISMILLAH = 'بسمالله الرحمن الرحيم'
ALEF_FORMS = {'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ى': 'ي', 'ة': 'ه', 'ؤ': 'و', 'ئ': 'ي'}
# Vowel letters and hamza are written differently in the two texts, so only the consonant skeleton is compared
SKIPPED_LETTERS = 'اءويى'


def fetch(url):
    request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    with urllib.request.urlopen(request, timeout=120) as response:
        return response.read()


def skeleton(text):
    out = []
    for ch in text:
        # Arabic letters only; tatweel (U+0640) is just a stretching glyph
        if not ('ء' <= ch <= 'ي') or ch == 'ـ':
            continue
        if unicodedata.category(ch).startswith('M'):
            continue
        ch = ALEF_FORMS.get(ch, ch)
        if ch not in SKIPPED_LETTERS:
            out.append(ch)
    return ''.join(out)


def has_letter(text):
    return any('\u0621' <= ch <= '\u064a' and ch != '\u0640' for ch in text)


def load_tanzil_words():
    surahs = json.loads(fetch(TANZIL_URL))['data']['surahs']
    words = {}
    for surah in surahs:
        for ayah in surah['ayahs']:
            parts = ayah['text'].lstrip('﻿').split()
            # The source prefixes the bismillah to verse 1 of every surah but Al-Fatiha (and At-Tawba has none)
            if ayah['numberInSurah'] == 1 and surah['number'] not in (1, 9) and len(parts) > 4 \
                    and skeleton(''.join(parts[:4])) == skeleton(BISMILLAH):
                parts = parts[4:]
            # Stop signs (e.g. ۖ) stand alone between spaces but quran-align doesn't count them as words
            words[(surah['number'], ayah['numberInSurah'])] = [w for w in parts if has_letter(w)]
    return words


def app_words(verse):
    """Python twin of getWordSegments in src/utils/arabicText.ts."""
    text = verse['arabic_text']
    pos = 0
    out = []
    for word in verse.get('word_translations') or []:
        arabic = word.get('arabic')
        if not arabic:
            continue
        index = text.find(arabic, pos)
        if index < 0:
            continue
        skipped = text[pos:index].strip()
        out.append(f'{skipped} {arabic}' if skipped else arabic)
        pos = index + len(arabic)
    rest = text[pos:].strip()
    if rest:
        out.append(rest)
    return out


def map_to_tanzil(app, tanzil):
    """For every app word, the [first, last] Tanzil word indices it overlaps; None if the texts don't match."""
    tanzil_skeletons = [skeleton(w) for w in tanzil]
    app_skeletons = [skeleton(w) for w in app]
    if ''.join(tanzil_skeletons) != ''.join(app_skeletons):
        return None
    ends = []
    total = 0
    for s in tanzil_skeletons:
        total += len(s)
        ends.append(total)
    last_word = len(ends) - 1
    result = []
    total = 0
    for s in app_skeletons:
        begin = total
        total += len(s)
        first = next((k for k, e in enumerate(ends) if e > begin), last_word)
        last = first if not s else next((k for k, e in enumerate(ends) if e >= total), last_word)
        result.append((first, last))
    return result


def word_start_times(segments, word_count):
    """quran-align segments are [first word, word after last, start, end]; expand to a start time per word."""
    starts = [None] * word_count
    for first, after_last, start, end in segments:
        span = max(after_last - first, 1)
        for k in range(first, min(after_last, word_count)):
            starts[k] = start + (end - start) * (k - first) // span
    # Fill gaps (words the aligner skipped) with the previous word's start
    previous = 0
    for k in range(word_count):
        if starts[k] is None:
            starts[k] = previous
        previous = starts[k]
    return starts


def build(reciter_id, align_name, align_zip, tanzil, verses):
    raw = align_zip.read(f'{align_name}.json').decode('utf-8')
    # The files start with a log line from the aligner before the JSON array
    alignment = {(v['surah'], v['ayah']): v for v in json.loads(raw[raw.index('[{'):])}

    timings = {}
    skipped = []
    for verse in verses.values():
        key = (verse['surah_number'], verse['verse_number'])
        app = app_words(verse)
        mapping = map_to_tanzil(app, tanzil[key]) if app else None
        # The aligner's word indices must cover exactly the words we mapped to (a few verses are split differently)
        if key not in alignment or max(seg[1] for seg in alignment[key]['segments']) != len(tanzil[key]):
            mapping = None
        if mapping is None:
            skipped.append(key)
            continue
        tanzil_starts = word_start_times(alignment[key]['segments'], len(tanzil[key]))
        starts = [tanzil_starts[first] for first, _ in mapping]
        # Several app words inside one Tanzil word share its start: spread them over the word's span
        end_of_verse = alignment[key]['segments'][-1][3]
        for i in range(len(starts)):
            if i > 0 and starts[i] == starts[i - 1]:
                run_start = i - 1
                while run_start > 0 and starts[run_start - 1] == starts[run_start]:
                    run_start -= 1
                run_end = i
                while run_end + 1 < len(starts) and starts[run_end + 1] == starts[run_start]:
                    run_end += 1
                next_start = starts[run_end + 1] if run_end + 1 < len(starts) else end_of_verse
                count = run_end - run_start + 1
                for j in range(count):
                    starts[run_start + j] = starts[run_start] + (next_start - starts[run_start]) * j // count
        timings[f'{key[0]}:{key[1]}'] = starts

    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, f'{reciter_id}.json')
    with open(path, 'w') as f:
        json.dump(timings, f, separators=(',', ':'))
    print(f'{reciter_id}: {len(timings)} verses, skipped {len(skipped)} {skipped[:5]}, {os.path.getsize(path) // 1024} KB')


def main():
    with open(os.path.join(ROOT, 'public', 'allVerses.json')) as f:
        verses = json.load(f)
    tanzil = load_tanzil_words()
    align_zip = zipfile.ZipFile(io.BytesIO(fetch(QURAN_ALIGN_ZIP)))
    for reciter_id, align_name in RECITERS.items():
        build(reciter_id, align_name, align_zip, tanzil, verses)


if __name__ == '__main__':
    main()
