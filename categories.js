// Prime categories and the per-value category bitmask.
import { isPrime, reverseDigits, isSemiprime } from './primes.js';

const MERSENNE = new Set([3, 7, 31, 127, 8191, 131071, 524287]);
const FERMAT = new Set([3, 5, 17, 257, 65537]);

export const CATEGORIES = [
  { name: 'Twin', hue: 0, test: (t, p) => isPrime(t, p + 2) || isPrime(t, p - 2) },
  { name: 'Cousin', hue: 36, test: (t, p) => isPrime(t, p + 4) || isPrime(t, p - 4) },
  { name: 'Sexy', hue: 324, test: (t, p) => isPrime(t, p + 6) || isPrime(t, p - 6) },
  { name: 'Mersenne', hue: 108, test: (t, p) => MERSENNE.has(p) },
  { name: 'Fermat', hue: 72, test: (t, p) => FERMAT.has(p) },
  { name: 'Sophie Germain', hue: 144, test: (t, p) => isPrime(t, 2 * p + 1) },
  { name: 'Safe', hue: 216, test: (t, p) => p % 2 === 1 && isPrime(t, (p - 1) / 2) },
  { name: 'Chen', hue: 180, test: (t, p) => isPrime(t, p + 2) || isSemiprime(t, p + 2) },
  { name: 'Palindromic', hue: 288, test: (t, p) => reverseDigits(p) === p },
  { name: 'Emirp', hue: 252, test: (t, p) => {
    const r = reverseDigits(p);
    return r !== p && isPrime(t, r);
  } },
];

export function buildMasks(table) {
  const masks = new Uint16Array(table.max + 1);
  for (let v = 2; v <= table.max; v++) {
    if (table.comp[v] !== 0) continue;
    let bits = 0;
    for (let i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].test(table, v)) bits |= 1 << i;
    }
    masks[v] = bits;
  }
  return masks;
}

export function describeValue(table, masks, v) {
  if (!isPrime(table, v)) return 'not prime';
  const names = CATEGORIES.filter((c, i) => masks[v] & (1 << i)).map((c) => c.name);
  return 'prime' + (names.length ? ': ' + names.join(', ') : '');
}
