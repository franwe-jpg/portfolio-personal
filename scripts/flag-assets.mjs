// Generates the round flags of the header language switch (public/banderas/*.png) with sharp.
// Run: node scripts/flag-assets.mjs
import { mkdir } from 'node:fs/promises';
import sharp from 'sharp';

const SIZE = 96;
const OUT = new URL('../public/banderas/', import.meta.url);

/** Wraps a flag drawing in a circle of SIZE px. */
const round = (inner) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}" viewBox="0 0 96 96">` +
  `<defs><clipPath id="c"><circle cx="48" cy="48" r="48"/></clipPath></defs>` +
  `<g clip-path="url(#c)">${inner}</g></svg>`;

// Argentina: celeste, white, celeste, and the Sol de Mayo in the middle.
const rays = Array.from({ length: 16 }, (_, i) => {
  const a = (i * Math.PI) / 8;
  const r1 = i % 2 ? 11.5 : 13;
  const x = (r) => (48 + Math.cos(a) * r).toFixed(2);
  const y = (r) => (48 + Math.sin(a) * r).toFixed(2);
  return `<line x1="${x(7.5)}" y1="${y(7.5)}" x2="${x(r1)}" y2="${y(r1)}"/>`;
}).join('');
const ar = round(
  `<rect width="96" height="32" fill="#74acdf"/><rect y="32" width="96" height="32" fill="#fff"/><rect y="64" width="96" height="32" fill="#74acdf"/>` +
    `<g stroke="#f6b40e" stroke-width="2.2" stroke-linecap="round">${rays}</g>` +
    `<circle cx="48" cy="48" r="7" fill="#f6b40e" stroke="#85340a" stroke-width=".8"/>`,
);

// United Kingdom: the Union Jack, centre square of the 2:1 flag.
const gb = round(
  `<svg x="0" y="0" width="96" height="96" viewBox="15 0 30 30" preserveAspectRatio="xMidYMid slice">` +
    `<defs><clipPath id="t"><path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z"/></clipPath></defs>` +
    `<rect width="60" height="30" fill="#012169"/>` +
    `<path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" stroke-width="6"/>` +
    `<path d="M0,0 L60,30 M60,0 L0,30" clip-path="url(#t)" stroke="#c8102e" stroke-width="4"/>` +
    `<path d="M30,0 v30 M0,15 h60" stroke="#fff" stroke-width="10"/>` +
    `<path d="M30,0 v30 M0,15 h60" stroke="#c8102e" stroke-width="6"/>` +
    `</svg>`,
);

await mkdir(OUT, { recursive: true });
for (const [name, svg] of Object.entries({ ar, gb })) {
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(new URL(`${name}.png`, OUT).pathname);
}
console.log('flags written to public/banderas/');
