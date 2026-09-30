#!/usr/bin/env python3
"""Add a `root` field to every word in public/allVerses.json.

Roots come from the Quranic Arabic Corpus morphology (Kais Dukes, GPL), via the
mustafa0x/quran-morphology text export. The corpus and our word-by-word list
split the verse differently (we fold particles into the next word) and spell
long vowels slightly differently, so each of our words is mapped onto the
corpus words by aligning the consonant skeleton of both texts.

Usage: python3 scripts/add_roots.py [--check]   (--check only prints the report)
"""
import collections
import difflib
import json
import re
import sys
import unicodedata
import urllib.request
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
VERSES_PATH = ROOT_DIR / 'public' / 'allVerses.json'
CACHE_PATH = ROOT_DIR / 'scripts' / '.cache' / 'quran-morphology.txt'
MORPHOLOGY_URL = 'https://raw.githubusercontent.com/mustafa0x/quran-morphology/master/quran-morphology.txt'


def load_corpus():
    if not CACHE_PATH.exists():
        CACHE_PATH.parent.mkdir(parents=True, exist_ok=True)
        urllib.request.urlretrieve(MORPHOLOGY_URL, CACHE_PATH)
    verses = collections.defaultdict(list)  # (surah, ayah) -> [(word, form, features)]
    for line in CACHE_PATH.read_text(encoding='utf-8').splitlines():
        location, form, _pos, features = line.split('\t')
        surah, ayah, word, _segment = map(int, location.split(':'))
        verses[(surah, ayah)].append((word, form, features))
    return verses


def skeleton(text):
    """Letters only: no vowel marks, hamza carriers or alef variants folded."""
    out = []
    for ch in unicodedata.normalize('NFD', text):
        if ch == 'ٰ':  # dagger alef: the corpus marks long ā with it, our text spells the alef out
            out.append('ا')
        elif unicodedata.category(ch) in ('Mn', 'Cf', 'Me'):
            continue
        elif ch in 'ٱأإآٲٳ':
            out.append('ا')
        elif ch in 'ىی':
            out.append('ي')
        elif ch == 'ۀ':
            out.append('ه')
        elif ch in 'ءؤئـ' or not 'ء' <= ch <= 'ي':
            continue
        else:
            out.append(ch)
    return ''.join(out)


def char_map(ours, corpus):
    """Index in `ours` -> index in `corpus` (None where the spellings differ)."""
    mapping = [None] * len(ours)
    for tag, i1, i2, j1, j2 in difflib.SequenceMatcher(None, ours, corpus, autojunk=False).get_opcodes():
        if tag == 'equal' or (tag == 'replace' and i2 - i1 == j2 - j1):
            for d in range(i2 - i1):
                mapping[i1 + d] = j1 + d
    return mapping


def roots_for_verse(verse, corpus_words):
    """One root (or None) per entry of verse['word_translations']."""
    corpus_text, owner = '', []
    roots_by_word = collections.defaultdict(list)
    for word, form, features in corpus_words:
        letters = skeleton(form)
        corpus_text += letters
        owner += [word] * len(letters)
        match = re.search(r'ROOT:([^|]+)', features)
        if match:
            roots_by_word[word].append(match.group(1))

    text = verse['arabic_text']
    mapping = char_map(skeleton(text), corpus_text)
    result, pos = [], 0
    for entry in verse.get('word_translations', []):
        index = text.find(entry['arabic'], pos)
        if index < 0:
            result.append((None, 'unlocated'))
            continue
        start = len(skeleton(text[:index]))
        end = start + len(skeleton(entry['arabic']))
        pos = index + len(entry['arabic'])
        owners = collections.Counter(owner[mapping[p]] for p in range(start, end)
                                     if p < len(mapping) and mapping[p] is not None and mapping[p] < len(owner))
        # A word starting with آ borrows its first letter from the previous corpus word; ignore such one-letter overlaps
        words = sorted(w for w, n in owners.items() if n > 1 or n == max(owners.values()))
        if not words:
            result.append((None, 'unaligned'))
            continue
        roots = []
        for w in words:
            for r in roots_by_word.get(w, []):
                if r not in roots:
                    roots.append(r)
        if not roots:
            result.append((None, 'no-root'))
        elif len(roots) > 1:
            result.append((roots[-1], 'multi'))  # particle + content word folded: the content word comes last
        else:
            result.append((roots[0], 'ok'))
    return result


def main():
    check_only = '--check' in sys.argv
    corpus = load_corpus()
    verses = json.loads(VERSES_PATH.read_text(encoding='utf-8'))

    stats = collections.Counter()
    distinct = set()
    for verse in verses.values():
        key = (verse['surah_number'], verse['verse_number'])
        for entry, (root, status) in zip(verse.get('word_translations', []),
                                         roots_for_verse(verse, corpus[key])):
            stats[status] += 1
            entry.pop('root', None)
            if root:
                entry['root'] = root
                distinct.add(root)

    total = sum(stats.values())
    print(f'words: {total}')
    for status, count in stats.most_common():
        print(f'  {status:10} {count:6}  {count / total:.1%}')
    print(f'distinct roots: {len(distinct)}')

    if not check_only:
        VERSES_PATH.write_text(json.dumps(verses, indent=2, ensure_ascii=False), encoding='utf-8')
        print(f'wrote {VERSES_PATH}')


if __name__ == '__main__':
    main()
