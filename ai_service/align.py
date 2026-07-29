"""Word-level Needleman-Wunsch alignment between reference and hypothesis text.

Global alignment (not naive index matching) so a single skipped or inserted
word doesn't cascade into false "wrong" results for every word after it.
"""
from normalize import normalize_word

MATCH = 2
MISMATCH = -1
GAP = -1


def _score_matrix(ref: list[str], hyp: list[str]):
    n, m = len(ref), len(hyp)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(1, n + 1):
        dp[i][0] = dp[i - 1][0] + GAP
    for j in range(1, m + 1):
        dp[0][j] = dp[0][j - 1] + GAP
    for i in range(1, n + 1):
        for j in range(1, m + 1):
            sub_score = MATCH if ref[i - 1] == hyp[j - 1] else MISMATCH
            dp[i][j] = max(
                dp[i - 1][j - 1] + sub_score,
                dp[i - 1][j] + GAP,
                dp[i][j - 1] + GAP,
            )
    return dp


def _backtrace(dp, ref: list[str], hyp: list[str]):
    i, j = len(ref), len(hyp)
    pairs = []  # (ref_index | None, hyp_index | None)
    while i > 0 or j > 0:
        if i > 0 and j > 0:
            sub_score = MATCH if ref[i - 1] == hyp[j - 1] else MISMATCH
            if dp[i][j] == dp[i - 1][j - 1] + sub_score:
                pairs.append((i - 1, j - 1))
                i, j = i - 1, j - 1
                continue
        if i > 0 and dp[i][j] == dp[i - 1][j] + GAP:
            pairs.append((i - 1, None))
            i -= 1
            continue
        pairs.append((None, j - 1))
        j -= 1
    pairs.reverse()
    return pairs


def align_words(reference_words: list[str], hypothesis_words: list[str]) -> list[dict]:
    """Align two original-text word lists, comparing normalized forms.

    Returns one entry per reference word (status correct/wrong/missing) plus
    one entry per unmatched hypothesis word (status extra), in reading order.
    """
    ref_norm = [normalize_word(w) for w in reference_words]
    hyp_norm = [normalize_word(w) for w in hypothesis_words]

    dp = _score_matrix(ref_norm, hyp_norm)
    pairs = _backtrace(dp, ref_norm, hyp_norm)

    results = []
    for ref_idx, hyp_idx in pairs:
        if ref_idx is not None and hyp_idx is not None:
            status = 'correct' if ref_norm[ref_idx] == hyp_norm[hyp_idx] else 'wrong'
            results.append({
                'position': ref_idx,
                'reference_word': reference_words[ref_idx],
                'recognized_word': hypothesis_words[hyp_idx],
                'status': status,
            })
        elif ref_idx is not None:
            results.append({
                'position': ref_idx,
                'reference_word': reference_words[ref_idx],
                'recognized_word': None,
                'status': 'missing',
            })
        else:
            results.append({
                'position': None,
                'reference_word': None,
                'recognized_word': hypothesis_words[hyp_idx],
                'status': 'extra',
            })
    return results


def score_alignment(aligned_words: list[dict], total_reference_words: int) -> int:
    if total_reference_words == 0:
        return 0
    correct = sum(1 for w in aligned_words if w['status'] == 'correct')
    return round((correct / total_reference_words) * 100)
