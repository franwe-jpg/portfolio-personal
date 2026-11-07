// Generates the static brand assets in public/ from the key-cap "FS" mark:
//   public/og.png              1200×630 Open Graph / Twitter card
//   public/favicon.ico         16 + 32 px (PNG-compressed ICO)
//   public/apple-touch-icon.png 180×180
// Run with `node scripts/brand-assets.mjs`. The text is set in Instrument Sans and
// JetBrains Mono, which librsvg resolves through fontconfig: install them, or point
// FONTCONFIG_FILE at a fonts.conf whose <dir> holds the TTFs from Google Fonts.
import { writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const out = (name) => fileURLToPath(new URL(`../public/${name}`, import.meta.url));

const PAPER = '#e6e9ee';
const CAP = '#10120d';
const INK = '#15181d';
const MUTED = '#5b6370';
const SIGNAL = '#1fbf75';
const SANS = "'Instrument Sans', sans-serif";
const MONO = "'JetBrains Mono', monospace";

/** The mark: a dark key cap with the initials and the green dot, `size` px wide. */
function cap(x, y, size, { rounded = true } = {}) {
  const r = rounded ? size * 0.22 : 0;
  return `
    <rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${r}" fill="${CAP}"/>
    <text x="${x + size * 0.485}" y="${y + size * 0.655}" font-family="${SANS}" font-weight="700" font-size="${size * 0.47}"
      fill="#fff" text-anchor="middle">FS</text>
    <circle cx="${x + size * 0.8125}" cy="${y + size * 0.1875}" r="${size * 0.094}" fill="${SIGNAL}"/>`;
}

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${PAPER}"/>
  <ellipse cx="300" cy="462" rx="150" ry="18" fill="${INK}" fill-opacity=".08"/>
  ${cap(110, 185, 260)}
  <rect x="450" y="232" width="10" height="10" fill="${SIGNAL}"/>
  <text x="476" y="242" font-family="${MONO}" font-weight="500" font-size="20" letter-spacing="3" fill="${MUTED}">ANALISTA PROGRAMADOR · TRELEW, CHUBUT</text>
  <text x="446" y="332" font-family="${SANS}" font-weight="600" font-size="66" letter-spacing="-2" fill="${INK}">Franco Martin Soler</text>
  <text x="448" y="398" font-family="${SANS}" font-weight="400" font-size="30" fill="${MUTED}">Desarrollo web full stack · Sistemas a medida</text>
  <rect x="450" y="438" width="36" height="3" fill="${SIGNAL}"/>
  <text x="450" y="482" font-family="${MONO}" font-weight="400" font-size="22" letter-spacing="1" fill="${INK}">francosolersistemas.com</text>
</svg>`;

const icon = (size, rounded) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${cap(0, 0, size, { rounded })}</svg>`;

/** ICO container holding PNG images, which every current browser reads. */
function ico(pngs) {
  const header = Buffer.alloc(6 + 16 * pngs.length);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(pngs.length, 4);
  let offset = header.length;
  pngs.forEach(({ size, data }, i) => {
    const entry = 6 + i * 16;
    header.writeUInt8(size === 256 ? 0 : size, entry);
    header.writeUInt8(size === 256 ? 0 : size, entry + 1);
    header.writeUInt8(0, entry + 2);
    header.writeUInt8(0, entry + 3);
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(data.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += data.length;
  });
  return Buffer.concat([header, ...pngs.map((p) => p.data)]);
}

const png = (svg, density = 72) => sharp(Buffer.from(svg), { density }).png().toBuffer();

await writeFile(out('og.png'), await png(og));
// Small sizes are rendered from a 256 px master so the glyphs stay crisp.
const master = await png(icon(256, true));
const sized = async (size) => ({ size, data: await sharp(master).resize(size, size).png().toBuffer() });
await writeFile(out('favicon.ico'), ico([await sized(16), await sized(32)]));
await writeFile(out('apple-touch-icon.png'), await png(icon(180, false)));
console.log('wrote public/og.png, public/favicon.ico, public/apple-touch-icon.png');
