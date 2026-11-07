// Grid analysis and canvas rendering.
import { isPrime } from './primes.js';
import { CATEGORIES } from './categories.js';
import { cellColor, levelColor, munchDim, xorValue, wrapValue, lowestBit } from './modes.js';

export const MAX_SAMPLE = 640;
export const MAX_TABLE = 4096;

export function analyzeGrid(state) {
  const n = state.N;
  let pw = 1;
  while (pw < n) pw <<= 1;
  state.Pw = pw;
  const hist = new Int32Array(pw);
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) hist[xorValue(x, y)]++;
  let primes = 0;
  const chips = CATEGORIES.map(() => 0);
  for (let v = 2; v < pw; v++) {
    if (!isPrime(state.table, v)) continue;
    primes += hist[v];
    for (let k = 0; k < CATEGORIES.length; k++) {
      if (state.masks[v] & (1 << k)) chips[k] += hist[v];
    }
  }
  state.hist = hist;
  state.primesN = primes;
  state.chipN = chips;
  if (state.t > pw - 1) state.t = 0;
}

export function createRenderer(canvas, state) {
  const ctx = canvas.getContext('2d');
  const tabN = new Uint32Array(512);
  const tabC = new Uint32Array(MAX_TABLE);
  let counts = new Int32Array(MAX_TABLE + 1);
  let img = null;
  let u32 = null;
  let full = true;
  let lastMode = '';
  let lastT = -1;
  let lastN = 0;
  let sampleSize = 0;
  let xs = new Int32Array(0);
  let xsKey = '';
  let smoothed = 0;

  function ensureImage(d) {
    if (canvas.width !== d) {
      canvas.width = d;
      canvas.height = d;
    }
    if (!img || img.width !== d) {
      img = ctx.createImageData(d, d);
      u32 = new Uint32Array(img.data.buffer);
      full = true;
    }
  }

  function drawNormal() {
    const { N, Pw, t, mode } = state;
    const munch = mode === 'munch';
    const den = Math.max(Pw - 1, 1);
    ensureImage(N);
    if (munch && !full && lastMode === 'munch' && lastN === N && lastT !== t) {
      const oldColor = munchDim(state, lastT, den);
      const newColor = levelColor(state, den);
      for (let x = 0; x < N; x++) {
        let y = xorValue(x, lastT);
        if (y < N) u32[y * N + x] = oldColor;
        y = xorValue(x, t);
        if (y < N) u32[y * N + x] = newColor;
      }
    } else if (full || lastMode !== mode || lastN !== N || (munch && lastT !== t)) {
      if (munch) {
        const bright = levelColor(state, den);
        for (let v = 0; v < Pw; v++) tabN[v] = v === t ? bright : munchDim(state, v, den);
      } else {
        for (let v = 0; v < Pw; v++) tabN[v] = cellColor(state, v, den);
      }
      for (let y = 0, o = 0; y < N; y++) {
        for (let x = 0; x < N; x++) u32[o++] = tabN[xorValue(x, y)];
      }
    }
    ctx.putImageData(img, 0, 0);
    lastMode = mode;
    lastT = t;
    lastN = N;
    full = false;
    let count = 0;
    if (munch) {
      count = state.hist[t];
    } else {
      for (let v = 2; v < Pw; v++) {
        if (state.hist[v] && isPrime(state.table, v) && (state.allOn || (state.masks[v] & state.sel))) {
          count += state.hist[v];
        }
      }
    }
    return { count, total: N * N, approx: false, primes: state.primesN, chip: state.chipN, label: N + ' x ' + N };
  }

  function drawCrystal() {
    const s = state.s;
    sampleSize = Math.min(s, MAX_SAMPLE);
    ensureImage(sampleSize);
    const key = sampleSize + ':' + s;
    if (key !== xsKey) {
      xsKey = key;
      if (xs.length !== sampleSize) xs = new Int32Array(sampleSize);
      for (let i = 0; i < sampleSize; i++) xs[i] = Math.floor((i * s) / sampleSize);
    }
    const den = Math.max(s - 1, 1);
    const useTable = s <= MAX_TABLE;
    if (useTable) for (let v = 0; v < s; v++) tabC[v] = cellColor(state, v, den);
    counts.fill(0, 0, s);
    for (let py = 0, o = 0; py < sampleSize; py++) {
      const yy = xs[py];
      for (let px = 0; px < sampleSize; px++) {
        const v = wrapValue(xs[px], yy, s);
        counts[v]++;
        u32[o++] = useTable ? tabC[v] : cellColor(state, v, den);
      }
    }
    ctx.putImageData(img, 0, 0);
    lastMode = 'crystal';
    full = true;
    let count = 0;
    let primes = 0;
    const chip = CATEGORIES.map(() => 0);
    const scale = (s * s) / (sampleSize * sampleSize);
    for (let v = 2; v < s; v++) {
      const h = counts[v];
      if (h === 0 || !isPrime(state.table, v)) continue;
      primes += h;
      const m = state.masks[v];
      if (state.allOn || (m & state.sel)) count += h;
      for (let w = m; w; w ^= w & -w) chip[lowestBit(w)] += h;
    }
    return {
      count: count * scale,
      total: s * s,
      approx: s > sampleSize,
      primes: primes * scale,
      chip: chip.map((c) => c * scale),
      label: s + ' x ' + s,
    };
  }

  return {
    frame() {
      const t0 = performance.now();
      state.dimAlpha = state.dim ? 34 : 255;
      const r = state.mode === 'crystal' ? drawCrystal() : drawNormal();
      smoothed = smoothed * 0.9 + (performance.now() - t0) * 0.1;
      r.ms = smoothed;
      return r;
    },
    invalidate() {
      full = true;
    },
    allocate(maxSize) {
      counts = new Int32Array(Math.max(maxSize, MAX_TABLE) + 1);
    },
    cellAt(fx, fy) {
      const crystal = state.mode === 'crystal';
      const w = crystal ? sampleSize : state.N;
      const px = Math.floor(fx * w);
      const py = Math.floor(fy * w);
      if (px < 0 || py < 0 || px >= w || py >= w) return null;
      const x = crystal ? xs[px] : px;
      const y = crystal ? xs[py] : py;
      return { x, y, v: crystal ? wrapValue(x, y, state.s) : xorValue(x, y), crystal };
    },
  };
}
