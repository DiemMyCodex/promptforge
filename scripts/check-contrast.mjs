#!/usr/bin/env node
/**
 * WCAG 2.x contrast gate for PromptForge tokens.
 *
 * Reads the real token values out of src/app.css (dark lives in @theme,
 * light in :root[data-theme="light"]), composites alpha tokens over the
 * surfaces they are actually painted on, and fails when a text pair drops
 * below 4.5:1 (AA, normal text).
 *
 * Run: node scripts/check-contrast.mjs
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'src/app.css'), 'utf8');

/** Pull `--color-*: value;` declarations out of one block. */
function readBlock(startPattern) {
  const start = css.indexOf(startPattern);
  if (start === -1) throw new Error(`block not found: ${startPattern}`);
  const open = css.indexOf('{', start);
  const close = css.indexOf('\n}', open);
  const body = css.slice(open + 1, close);
  const tokens = {};
  for (const match of body.matchAll(/(--color-[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    tokens[match[1]] = match[2].trim();
  }
  return tokens;
}

const dark = readBlock('@theme {');
const light = { ...dark, ...readBlock(':root[data-theme="light"]') };

function parseColor(value) {
  const hex = value.match(/^#([0-9a-f]{3,8})$/i);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
      a: h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1
    };
  }
  const rgb = value.match(/rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?\s*\)/i);
  if (rgb) {
    return {
      r: Number(rgb[1]),
      g: Number(rgb[2]),
      b: Number(rgb[3]),
      a: rgb[4] === undefined ? 1 : Number(rgb[4])
    };
  }
  throw new Error(`unsupported color: ${value}`);
}

const over = (fg, bg) => {
  const c = parseColor(fg);
  const base = parseColor(bg);
  const a = c.a;
  return {
    r: c.r * a + base.r * (1 - a),
    g: c.g * a + base.g * (1 - a),
    b: c.b * a + base.b * (1 - a),
    a: 1
  };
};

const channel = (v) => {
  const s = v / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};

const luminance = (c) => 0.2126 * channel(c.r) + 0.7152 * channel(c.g) + 0.0722 * channel(c.b);

const ratio = (fg, bg) => {
  const a = luminance(fg);
  const b = luminance(bg);
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
};

const SURFACES = ['--color-canvas', '--color-raised'];

const PAIRS = [
  ['--color-label', 'body / headings'],
  ['--color-label-2', 'secondary text'],
  ['--color-label-3', 'micro + meta text'],
  ['--color-good', 'success status text'],
  ['--color-warn', 'warning status text'],
  ['--color-bad', 'error status text'],
  ['--color-accent', 'accent text + links']
];

const MIN = 4.5;
let failures = 0;
let checked = 0;

for (const [themeName, theme] of [['dark', dark], ['light', light]]) {
  console.log(`\n${themeName.toUpperCase()} THEME`);
  for (const [token, label] of PAIRS) {
    const fgRaw = theme[token];
    if (!fgRaw) throw new Error(`missing token ${token}`);
    for (const surface of SURFACES) {
      const bg = parseColor(theme[surface]);
      const fg = over(fgRaw, theme[surface]);
      const value = ratio(fg, bg);
      checked += 1;
      const ok = value >= MIN;
      if (!ok) failures += 1;
      console.log(
        `${ok ? 'PASS' : 'FAIL'}  ${token.padEnd(16)} on ${surface.replace('--color-', '').padEnd(7)} ` +
          `${value.toFixed(2)}:1  (${label})`
      );
    }
  }
}

console.log(`\n${checked} pairs checked, ${failures} below ${MIN}:1`);
if (failures > 0) {
  console.error('Contrast gate failed.');
  process.exit(1);
}
console.log('Contrast gate passed.');
