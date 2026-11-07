import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSieve, isPrime } from '../src/primes.js';
import { CATEGORIES, buildMasks } from '../src/categories.js';
import { analyzeGrid } from '../src/render.js';
import { wrapValue, xorValue } from '../src/modes.js';

const table = buildSieve(512);
const masks = buildMasks(table);

const piBelow = (n) => {
  let c = 0;
  for (let i = 2; i < n; i++) if (isPrime(table, i)) c++;
  return c;
};

test('prime cell count is N * pi(N) at powers of two', () => {
  for (const N of [16, 32, 64, 128, 256]) {
    const state = { N, t: 0, table, masks };
    analyzeGrid(state);
    assert.equal(state.primesN, N * piBelow(N));
  }
});

test('every level set has N cells at powers of two', () => {
  const state = { N: 64, t: 0, table, masks };
  analyzeGrid(state);
  for (let v = 0; v < state.Pw; v++) assert.equal(state.hist[v], 64);
});

test('wrapValue matches modulo for all sizes', () => {
  for (let s = 2; s <= 70; s++) {
    for (let x = 0; x < s; x++) {
      for (let y = 0; y < s; y++) assert.equal(wrapValue(x, y, s), (x ^ y) % s);
    }
  }
});

test('crystal equals normal at powers of two', () => {
  for (const s of [2, 4, 8, 16, 32, 64]) {
    for (let x = 0; x < s; x++) {
      for (let y = 0; y < s; y++) assert.equal(wrapValue(x, y, s), xorValue(x, y));
    }
  }
});

test('Mersenne and Fermat share only 3 below 512', () => {
  const m = CATEGORIES.findIndex((c) => c.name === 'Mersenne');
  const f = CATEGORIES.findIndex((c) => c.name === 'Fermat');
  const both = [];
  for (let v = 0; v < 512; v++) {
    if (masks[v] & (1 << m) && masks[v] & (1 << f)) both.push(v);
  }
  assert.deepEqual(both, [3]);
});

test('known category members', () => {
  const has = (name, v) => masks[v] & (1 << CATEGORIES.findIndex((c) => c.name === name));
  assert.ok(has('Twin', 11));
  assert.ok(has('Cousin', 7));
  assert.ok(has('Sexy', 5));
  assert.ok(has('Sophie Germain', 11));
  assert.ok(has('Safe', 23));
  assert.ok(has('Palindromic', 131));
  assert.ok(has('Emirp', 13));
  assert.ok(has('Chen', 2));
  assert.ok(!has('Twin', 23));
});
