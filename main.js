// Fractometa entry point: state, wiring and the public namespace.
import * as primes from './primes.js';
import * as categories from './categories.js';
import * as color from './color.js';
import * as modes from './modes.js';
import * as render from './render.js';
import * as ui from './ui.js';
import * as animation from './animation.js';

const state = {
  mode: 'normal', playing: false,
  N: 64, Pw: 64, t: 0, s: 2, maxS: 2000,
  sel: 0, allOn: true, dim: true, dimAlpha: 34,
  speed: 12, grow: 1,
  hist: new Int32Array(0), primesN: 0, chipN: [],
  table: null, masks: null, grad: null,
};

function ensureTables(max) {
  if (state.table && max <= state.table.max) return;
  state.table = primes.buildSieve(max);
  state.masks = categories.buildMasks(state.table);
}

ensureTables(Math.max(512, state.maxS));
state.grad = color.buildGradients(categories.CATEGORIES);

const canvas = document.getElementById('fm-canvas');
const renderer = render.createRenderer(canvas, state);
let view = null;

const refresh = () => view.update(renderer.frame());

const animator = animation.createAnimator({
  isActive: () => state.playing && state.mode !== 'normal',
  rate: () => state.speed,
  advance(steps) {
    if (state.mode === 'munch') {
      state.t = (state.t + steps) % state.Pw;
    } else {
      state.s += steps * state.grow;
      if (state.s >= state.maxS) {
        state.s = state.maxS;
        state.playing = false;
      }
    }
  },
  draw(showUI) {
    const r = renderer.frame();
    if (showUI) view.update(r);
  },
});

const actions = {
  toggleAll() {
    state.allOn = !state.allOn;
    renderer.invalidate();
    refresh();
  },
  toggleCategory(i) {
    state.sel ^= 1 << i;
    renderer.invalidate();
    refresh();
  },
  setDim(on) {
    state.dim = on;
    renderer.invalidate();
    refresh();
  },
  setSize(n) {
    state.N = n;
    render.analyzeGrid(state);
    renderer.invalidate();
    refresh();
  },
  setMax(v) {
    state.maxS = v;
    ensureTables(Math.max(512, v));
    renderer.allocate(v);
    render.analyzeGrid(state);
    if (state.s > v) state.s = v;
    refresh();
  },
  playMunch() {
    if (state.mode !== 'munch') {
      state.mode = 'munch';
      state.playing = true;
      state.t = 0;
      animator.reset();
      renderer.invalidate();
    } else {
      state.playing = !state.playing;
    }
    refresh();
    if (state.playing) animator.start();
  },
  playCrystal() {
    if (state.mode !== 'crystal') {
      state.mode = 'crystal';
      state.playing = true;
      state.s = 2;
      animator.reset();
    } else {
      if (!state.playing && state.s >= state.maxS) state.s = 2;
      state.playing = !state.playing;
    }
    refresh();
    if (state.playing) animator.start();
  },
  exit() {
    state.mode = 'normal';
    state.playing = false;
    renderer.invalidate();
    view.info(ui.DEFAULT_INFO);
    refresh();
  },
  scrub(v) {
    if (state.mode === 'crystal') {
      state.s = Math.min(Math.max(v, 2), state.maxS);
    } else {
      state.t = v;
      if (state.mode !== 'munch') {
        state.mode = 'munch';
        renderer.invalidate();
      }
    }
    state.playing = false;
    refresh();
  },
  inspect(fx, fy) {
    const cell = renderer.cellAt(fx, fy);
    if (cell) view.showCell(cell);
  },
};

view = ui.createUI(state, actions);
render.analyzeGrid(state);
refresh();

export const Fractometa = {
  version: '1.0.0',
  primes, categories, color, modes, render, ui, animation,
  state, actions,
};

globalThis.Fractometa = Fractometa;
