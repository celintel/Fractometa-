// Prime sieve and digit helpers.

export function buildSieve(max) {
  const limit = Math.max(2 * max + 10, 10 ** String(max).length);
  const comp = new Uint8Array(limit + 1);
  comp[0] = comp[1] = 1;
  for (let i = 2; i * i <= limit; i++) {
    if (comp[i] === 0) for (let j = i * i; j <= limit; j += i) comp[j] = 1;
  }
  return { comp, limit, max };
}

export function isPrime(table, n) {
  return n >= 2 && n <= table.limit && table.comp[n] === 0;
}

export function reverseDigits(n) {
  let r = 0;
  while (n > 0) {
    const q = Math.floor(n / 10);
    r = r * 10 + (n - q * 10);
    n = q;
  }
  return r;
}

export function isSemiprime(table, n) {
  for (let f = 2; f * f <= n; f++) {
    if (n % f === 0) return isPrime(table, n / f);
  }
  return false;
}
