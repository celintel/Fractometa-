// Gradients and packed RGBA helpers. Colors are little-endian ABGR integers.

export const LEVELS = 512;
export const ALL_STRIP = 'linear-gradient(90deg,hsl(175,50%,62%),hsl(280,50%,46%))';

export function hslToRgb(h, s, l) {
  s /= 100;
  l /= 100;
  h = ((h % 360) + 360) % 360;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [Math.round(255 * f(0)), Math.round(255 * f(8)), Math.round(255 * f(4))];
}

const pack = (c) => ((c[2] << 16) | (c[1] << 8) | c[0]) >>> 0;

export function buildGradients(categories) {
  const base = new Uint32Array(LEVELS);
  const cat = categories.map(() => new Uint32Array(LEVELS));
  for (let i = 0; i < LEVELS; i++) {
    const q = i / (LEVELS - 1);
    base[i] = pack(hslToRgb(175 + 105 * q, 50, 62 - 16 * q));
    categories.forEach((c, k) => {
      cat[k][i] = pack(hslToRgb(c.hue + 16 * q, 82, 72 - 28 * q));
    });
  }
  return { base, cat };
}

export function levelIndex(v, den) {
  return (v * (LEVELS - 1) / den) | 0;
}

export function withAlpha(color, alpha) {
  return (color | (alpha << 24)) >>> 0;
}

export function categoryStrip(hue) {
  return `linear-gradient(90deg,hsl(${hue},82%,72%),hsl(${hue + 16},82%,44%))`;
}
