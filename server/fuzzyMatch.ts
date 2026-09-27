/**
 * Fuzzy matching helper for Top List trivia answers.
 * Handles minor typos, missing letters, extra letters, article prefixes,
 * punctuation, and common variations.
 */

export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD') // remove diacritics
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/^(the|a|an)\s+/i, '') // strip leading English articles
    .replace(/&(amp;)?/g, ' and ')
    .replace(/['"’“”`]/g, '') // strip quotes / apostrophes
    .replace(/[^\w\s]/g, ' ') // replace punctuation with spaces
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Calculates Levenshtein distance between two strings
 */
export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  if (m === 0) return n;
  if (n === 0) return m;

  const d: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return d[m][n];
}

/**
 * Checks if a user's guess matches an item's canonical title or any alias
 */
export function isFuzzyMatch(guess: string, targetTitle: string, aliases: string[] = []): boolean {
  const cleanGuess = normalizeText(guess);
  if (!cleanGuess) return false;

  const targets = [targetTitle, ...aliases].map(normalizeText).filter(Boolean);

  for (const target of targets) {
    // 1. Exact match after normalization
    if (cleanGuess === target) {
      return true;
    }

    // 2. Compact match (e.g., "spider-man" -> "spiderman")
    const compactGuess = cleanGuess.replace(/\s+/g, '');
    const compactTarget = target.replace(/\s+/g, '');
    if (compactGuess === compactTarget && compactTarget.length > 2) {
      return true;
    }

    // 3. Levenshtein edit distance check
    const dist = levenshteinDistance(cleanGuess, target);
    const maxLen = Math.max(cleanGuess.length, target.length);

    // Dynamic threshold based on length
    // e.g. "poter" vs "potter" (dist 1, len 6) -> allowed
    // e.g. "avangers" vs "avengers" (dist 1, len 8) -> allowed
    if (maxLen <= 4 && dist <= 1) return true;
    if (maxLen <= 7 && dist <= 1) return true;
    if (maxLen <= 12 && dist <= 2) return true;
    if (maxLen > 12 && dist <= 3) return true;

    // 4. Token set matching (for multi-word titles where word order or slight omission occurs)
    const guessTokens = cleanGuess.split(' ').filter(t => t.length > 2);
    const targetTokens = target.split(' ').filter(t => t.length > 2);

    if (guessTokens.length >= 2 && targetTokens.length >= 2) {
      const allGuessTokensInTarget = guessTokens.every(gt =>
        targetTokens.some(tt => levenshteinDistance(gt, tt) <= (gt.length > 5 ? 1 : 0))
      );
      if (allGuessTokensInTarget && guessTokens.length >= Math.ceil(targetTokens.length * 0.7)) {
        return true;
      }
    }
  }

  return false;
}
