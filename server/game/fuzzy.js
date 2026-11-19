// Comparação tolerante de chutes: ignora maiúsculas, acentos, pontuação e espaços,
// e aceita pequenos erros de digitação (distância de Levenshtein).
// Sempre compara o NOME COMPLETO: uma palavra isolada ("Einstein") não vale.

export function normalize(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Chave canônica de um nome (sem espaços): usada para comparar e para achar duplicados. */
export const nameKey = (text) => normalize(text).replace(/ /g, '');

export function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const curr = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    prev = curr;
  }
  return prev[b.length];
}

/** Quantos erros são aceitos conforme o tamanho do nome (sem espaços). */
export function allowedErrors(length) {
  if (length <= 4) return 0; // "Thor", "Hulk": tem que ser exato
  if (length <= 8) return 1; // "Batman", "Shrek"
  return 2; // "Albert Einstein", "Cleopatra"
}

export function isGuessCorrect(guess, answer) {
  const g = nameKey(guess);
  const a = nameKey(answer);
  if (g.length < 2 || !a) return false;
  return levenshtein(g, a) <= allowedErrors(a.length);
}
