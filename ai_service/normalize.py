"""Arabic text normalization for memorization comparison only.

Scope: strip diacritics, unify alif forms, remove tatweel, unify ta-marbuta/ha.
Deliberately NOT doing phoneme-level or Tajweed-aware normalization — this
module only needs to compare *words*, not pronunciation.
"""
import re

_DIACRITICS = re.compile(r'[ؐ-ًؚ-ٰٟۖ-ࣰۭ-ࣿ]')
_TATWEEL = re.compile(r'ـ')
_ALIF_FORMS = re.compile(r'[آأإٱ]')  # آ أ إ ٱ -> ا
_PUNCTUATION = re.compile(r'[،؛؟!.,:;?٠-٩0-9"\'\-_()\[\]{}]')
_WHITESPACE = re.compile(r'\s+')


def normalize_word(word: str) -> str:
    word = _DIACRITICS.sub('', word)
    word = _TATWEEL.sub('', word)
    word = _ALIF_FORMS.sub('ا', word)
    word = word.replace('ة', 'ه')  # ة -> ه
    word = _PUNCTUATION.sub('', word)
    return word.strip()


def normalize_text(text: str) -> str:
    text = _WHITESPACE.sub(' ', text).strip()
    return text


def tokenize(text: str) -> list[str]:
    """Split into words, dropping empties left over after normalization."""
    return [w for w in normalize_text(text).split(' ') if w]
