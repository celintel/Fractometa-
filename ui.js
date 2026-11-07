// DOM bindings and display updates.
import { CATEGORIES, describeValue } from './categories.js';
import { categoryStrip, ALL_STRIP } from './color.js';

export const DEFAULT_INFO = 'Tap a cell to inspect it.';

const IDS = {
  canvas: 'fm-canvas', size: 'fm-size', sizeOut: 'fm-size-out',
  play: 'fm-play', crystal: 'fm-crystal', exit: 'fm-exit',
  scrubLabel: 'fm-scrub-label', scrub: 'fm-scrub', scrubOut: 'fm-scrub-out',
  speed: 'fm-speed', speedOut: 'fm-speed-out', max: 'fm-max', grow: 'fm-grow',
  count: 'fm-count', share: 'fm-share', frame: 'fm-frame',
  chips: 'fm-chips', dim: 'fm-dim', info: 'fm-info',
};

const setText = (node, text) => {
  if (node.textContent !== text) node.textContent = text;
};

const fmt = (n, approx) => (approx ? '~' : '') + Math.round(n).toLocaleString();

function styleChip(button, on, hue) {
  button.style.background = on ? (hue === null ? 'var(--fm-accent-bg)' : `hsla(${hue},80%,50%,0.14)`) : '';
  button.style.borderColor = on ? (hue === null ? 'var(--fm-accent-border)' : `hsl(${hue},75%,48%)`) : '';
  button.setAttribute('aria-pressed', on ? 'true' : 'false');
}

export function createUI(state, actions) {
  const el = {};
  for (const [key, id] of Object.entries(IDS)) el[key] = document.getElementById(id);

  function addChip(label, strip, onClick, wide) {
    const button = document.createElement('button');
    button.className = 'fm-chip' + (wide ? ' fm-chip--all' : '');
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML =
      `<span class="fm-chip-strip" style="background:${strip}"></span>` +
      `<span class="fm-chip-name">${label}</span>` +
      '<span class="fm-chip-count">0 cells</span>';
    button.addEventListener('click', onClick);
    el.chips.appendChild(button);
    return { button, count: button.querySelector('.fm-chip-count') };
  }

  const allChip = addChip('All primes', ALL_STRIP, () => actions.toggleAll(), true);
  const chips = CATEGORIES.map((c, i) =>
    addChip(c.name, categoryStrip(c.hue), () => actions.toggleCategory(i), false));

  el.size.addEventListener('input', () => actions.setSize(parseInt(el.size.value, 10)));
  el.play.addEventListener('click', () => actions.playMunch());
  el.crystal.addEventListener('click', () => actions.playCrystal());
  el.exit.addEventListener('click', () => actions.exit());
  el.scrub.addEventListener('input', () => actions.scrub(parseInt(el.scrub.value, 10)));
  el.speed.addEventListener('input', () => {
    state.speed = parseInt(el.speed.value, 10);
    setText(el.speedOut, state.speed + '/s');
  });
  el.grow.addEventListener('change', () => {
    state.grow = parseInt(el.grow.value, 10);
  });
  el.max.addEventListener('change', () => {
    let v = parseInt(el.max.value, 10);
    if (Number.isNaN(v)) v = 2000;
    v = Math.min(Math.max(v, 4), 999999);
    el.max.value = v;
    actions.setMax(v);
  });
  el.dim.addEventListener('change', () => actions.setDim(el.dim.checked));
  el.canvas.addEventListener('click', (e) => {
    const rect = el.canvas.getBoundingClientRect();
    actions.inspect((e.clientX - rect.left) / rect.width, (e.clientY - rect.top) / rect.height);
  });

  function update(r) {
    const crystal = state.mode === 'crystal';
    setText(allChip.count, fmt(r.primes, r.approx) + ' cells');
    styleChip(allChip.button, state.allOn, null);
    CATEGORIES.forEach((c, k) => {
      setText(chips[k].count, fmt(r.chip[k], r.approx) + ' cells');
      styleChip(chips[k].button, !!(state.sel & (1 << k)), c.hue);
    });
    setText(el.sizeOut, r.label);
    setText(el.count, fmt(r.count, r.approx));
    setText(el.share, ((100 * r.count) / r.total).toFixed(1) + '%');
    setText(el.frame, r.ms.toFixed(1) + ' ms');
    if (crystal) {
      el.scrub.min = 2;
      el.scrub.max = state.maxS;
      el.scrub.value = state.s;
      setText(el.scrubLabel, 'size');
      setText(el.scrubOut, String(state.s));
    } else {
      el.scrub.min = 0;
      el.scrub.max = state.Pw - 1;
      el.scrub.value = state.t;
      setText(el.scrubLabel, 't');
      setText(el.scrubOut, String(state.t));
    }
    setText(el.play, state.mode === 'munch' ? (state.playing ? 'Pause' : 'Resume') : 'Play munching squares');
    setText(el.crystal, crystal ? (state.playing ? 'Pause' : 'Resume') : 'Play crystal mode');
    if (state.mode === 'munch') {
      info(`t = ${state.t}:  ${state.hist[state.t].toLocaleString()} cells where x XOR y = ${state.t}  (${describeValue(state.table, state.masks, state.t)})`);
    } else if (crystal) {
      info(`Crystal: grid size ${state.s.toLocaleString()}, values (x XOR y) mod ${state.s.toLocaleString()}, growing toward ${state.maxS.toLocaleString()}.` +
        (r.approx ? ' Large grids are sampled to 640 px.' : ''));
    }
  }

  function info(text) {
    setText(el.info, text);
  }

  function showCell(c) {
    const expr = c.crystal ? `(${c.x} XOR ${c.y}) mod ${state.s}` : `${c.x} XOR ${c.y}`;
    info(`x=${c.x}, y=${c.y}:  ${expr} = ${c.v}  (${describeValue(state.table, state.masks, c.v)})`);
  }

  return { update, info, showCell };
}
