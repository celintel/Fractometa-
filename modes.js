// Cell values and colors for the normal, munching squares and crystal modes.
import { isPrime } from './primes.js';
import { levelIndex, withAlpha } from './color.js';

export const MUNCH_DIM_ALPHA = 26;
export const OPAQUE = 255;

export const xorValue = (x, y) => x ^ y;

export function wrapValue(x, y, size) {
  const v = x ^ y;
  return v >= size ? v - size : v;
}

export const lowestBit = (m) => 31 - Math.clz32(m & -m);

export function cellColor(state, v, den) {
  const i = levelIndex(v, den);
  if (isPrime(state.table, v)) {
    const m = state.masks[v] & state.sel;
    if (m) return withAlpha(state.grad.cat[lowestBit(m)][i], OPAQUE);
    if (state.allOn) return withAlpha(state.grad.base[i], OPAQUE);
  }
  return withAlpha(state.grad.base[i], state.dimAlpha);
}

export function levelColor(state, den) {
  const i = levelIndex(state.t, den);
  let c = state.grad.base[i];
  if (isPrime(state.table, state.t)) {
    const m = state.masks[state.t] & state.sel;
    if (m) c = state.grad.cat[lowestBit(m)][i];
  }
  return withAlpha(c, OPAQUE);
}

export function munchDim(state, v, den) {
  return withAlpha(state.grad.base[levelIndex(v, den)], MUNCH_DIM_ALPHA);
}
