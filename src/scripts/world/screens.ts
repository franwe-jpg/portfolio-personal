import { REDUCE } from '../env';
import { FPS6, MONO } from './config';
import { canvasTex, rrect, type CanvasTex } from './textures';

/**
 * Animated screens (canvas textures redrawn at ≤ 6–8 fps, only while their diorama is active):
 * Franco's code and terminal monitors and the production dashboard TV (office), the blackboard
 * slides and the projection screen (university), the colour-band "movie" (home). The texts are
 * part of the 3D art and stay in Spanish on purpose.
 */

// ---------- office: code that types itself + a terminal that keeps printing ----------
const CW = 480;
const CH = 300;
const LH = 15;
const ROWS = 17;
const TOP = 36;
const SNIPPETS: string[][] = [
  [
    'export async function POST({ request }) {',
    '  const { q, name } = await request.json();',
    '  if (!q?.trim()) return json({ error: "vacío" }, 400);',
    '  const reply = await ask(q, { name, scene: sceneFor(now()) });',
    '  return json({ reply });',
    '}',
  ],
  [
    '// Escena según la hora en Argentina',
    'const sceneFor = (t) => {',
    '  if (t.weekend) return "home";',
    '  if (t.h >= 7 && t.h < 13) return "office";',
    '  if (t.h >= 14 && t.h < 19) return "uni";',
    '  return "home";',
    '};',
  ],
  [
    'function frame(now) {',
    '  const dt = Math.min(0.05, (now - last) / 1000);',
    '  last = now;',
    '  for (const d of dioramas) d.update(elapsed, dt);',
    '  renderer.render(scene, camera);',
    '  requestAnimationFrame(frame);',
    '}',
  ],
];
const TERM = [
  '$ npm run build',
  '> astro build',
  '  ✓ 14 páginas en 1,8 s',
  '$ npm test',
  '  ✓ 32 tests · 0 fallas',
  '$ git add -A && git commit -m "feat: chat del mundo"',
  '  [develop 3f1c2a9] 6 archivos cambiados',
  '$ git push origin develop',
  '  → develop · listo',
  '$ curl -s localhost:4321/__estado',
  '  {"api":"ok","latencia":42}',
];
const KW = /^(export|async|function|const|let|return|if|for|of|await|new|import|from|else)$/;
const TOK = /\s+|\/\/.*$|"[^"]*"?|'[^']*'?|`[^`]*`?|[A-Za-z_$][\w$]*|\d+|[^\sA-Za-z_$\d]+/g;

export interface CodeScreens {
  code: CanvasTex;
  term: CanvasTex;
  update(t: number, dt: number): void;
}

/** Code typed ≈12 chars/s with a blinking caret, cycling three short snippets; a terminal printing lines every 0.7 s. */
export function createCodeScreens(): CodeScreens {
  const code = canvasTex(CW, CH, () => {});
  const term = canvasTex(CW, CH, () => {});
  const ty = { snip: 0, li: 0, ci: 0, done: [] as string[], cur: '', hold: 0, acc: 0, blink: true, dirty: true };
  const tm = { lines: ['$ npm run dev', '  astro v5 · http://localhost:4321'], i: 0, acc: 0, dirty: true };
  const screenBg = (c: CanvasRenderingContext2D, title: string) => {
    c.fillStyle = '#0b0d10';
    c.fillRect(0, 0, CW, CH);
    c.fillStyle = '#151a1f';
    c.fillRect(0, 0, CW, 22);
    c.fillStyle = '#1fbf75';
    c.beginPath();
    c.arc(14, 11, 4, 0, Math.PI * 2);
    c.fill();
    c.font = `500 11px ${MONO}`;
    c.textBaseline = 'middle';
    c.textAlign = 'left';
    c.fillStyle = '#8a94a3';
    c.fillText(title, 28, 11);
  };
  function paintLine(c: CanvasRenderingContext2D, text: string, x: number, y: number): number {
    for (const tk of text.match(TOK) ?? []) {
      if (/\S/.test(tk)) {
        c.fillStyle = tk.startsWith('//')
          ? '#5b6370'
          : /^["'`]/.test(tk)
            ? '#d4b06a'
            : KW.test(tk)
              ? '#1fbf75'
              : /^\d/.test(tk)
                ? '#9ad1ff'
                : /^[A-Za-z_$]/.test(tk)
                  ? '#c9cfd8'
                  : '#8a94a3';
        c.fillText(tk, x, y);
      }
      x += c.measureText(tk).width;
    }
    return x;
  }
  function drawCode(): void {
    const c = code.ctx;
    screenBg(c, 'src/pages/api/chat.ts');
    const rows = ty.done.slice(-(ROWS - 1)).concat([ty.cur]);
    const first = ty.done.length - (rows.length - 1);
    rows.forEach((text, i) => {
      const y = TOP + i * LH;
      c.fillStyle = '#3a4250';
      c.textAlign = 'right';
      c.fillText(String(first + i + 1), 30, y);
      c.textAlign = 'left';
      const x = paintLine(c, text, 42, y);
      if (i === rows.length - 1 && ty.blink) {
        c.fillStyle = '#1fbf75';
        c.fillRect(x + 1, y - 7, 7, 14);
      }
    });
    code.tex.needsUpdate = true;
  }
  function drawTerm(): void {
    const c = term.ctx;
    screenBg(c, 'terminal · zsh');
    const rows = tm.lines.slice(-(ROWS - 1));
    rows.forEach((text, i) => {
      c.fillStyle = text.startsWith('$') ? '#c9cfd8' : text.includes('✓') ? '#1fbf75' : '#8a94a3';
      c.fillText(text, 14, TOP + i * LH);
    });
    const y = TOP + rows.length * LH;
    c.fillStyle = '#c9cfd8';
    c.fillText('$', 14, y);
    if (ty.blink) {
      c.fillStyle = '#1fbf75';
      c.fillRect(28, y - 7, 7, 14);
    }
    term.tex.needsUpdate = true;
  }
  function typeChars(n: number): void {
    for (let k = 0; k < n && ty.hold <= 0; k++) {
      const lines = SNIPPETS[ty.snip];
      const line = lines[ty.li];
      if (ty.ci < line.length) {
        ty.cur += line[ty.ci++];
        continue;
      }
      ty.done.push(ty.cur);
      ty.cur = '';
      ty.ci = 0;
      ty.li++;
      if (ty.li >= lines.length) {
        ty.done.push('');
        ty.li = 0;
        ty.snip = (ty.snip + 1) % SNIPPETS.length;
        ty.hold = 1.4;
      }
      if (ty.done.length > 60) ty.done.splice(0, ty.done.length - 60);
    }
  }
  if (REDUCE) {
    ty.done = [...SNIPPETS[0], ''];
    ty.snip = 1;
    ty.blink = false;
    tm.lines.push(...TERM.slice(0, 5));
  }
  drawCode();
  drawTerm();
  let drawLast = -1;
  function update(t: number, dt: number): void {
    if (REDUCE) return;
    // Typing at ≈12 chars/s and a terminal line every 0.7 s; both screens redraw at ≤ 8 fps.
    if (ty.hold > 0) ty.hold -= dt;
    else {
      ty.acc += dt * 12;
      const n = ty.acc | 0;
      if (n) {
        ty.acc -= n;
        typeChars(n);
        ty.dirty = true;
      }
    }
    const bl = Math.floor(t * 2.4) % 2 === 0;
    if (bl !== ty.blink) {
      ty.blink = bl;
      ty.dirty = tm.dirty = true;
    }
    tm.acc += dt;
    if (tm.acc > 0.7) {
      tm.acc = 0;
      tm.lines.push(TERM[tm.i]);
      tm.i = (tm.i + 1) % TERM.length;
      if (tm.lines.length > 40) tm.lines.splice(0, 20);
      tm.dirty = true;
    }
    if (t - drawLast >= 1 / 8 && (ty.dirty || tm.dirty)) {
      drawLast = t;
      if (ty.dirty) drawCode();
      if (tm.dirty) drawTerm();
      ty.dirty = tm.dirty = false;
    }
  }
  return { code, term, update };
}

export interface Dashboard {
  tex: CanvasTex;
  update(t: number): void;
}

/** Meeting TV dashboard: bars that shift, a running line and the "EN LÍNEA" chip. */
export function createDashboard(): Dashboard {
  const dash = canvasTex(384, 216, () => {});
  const bars = Array.from({ length: 7 }, () => ({ v: 0.3 + Math.random() * 0.6, g: 0.3 + Math.random() * 0.6 }));
  const series = Array.from({ length: 36 }, () => 0.5);
  let dashLast = -1;
  let dashN = 0;
  let lat = 42;
  let deploys = 12;
  function drawDash(): void {
    const c = dash.ctx;
    const w = 384;
    const h = 216;
    c.fillStyle = '#0b0d10';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#151a1f';
    c.fillRect(0, 0, w, 26);
    c.textBaseline = 'middle';
    c.textAlign = 'left';
    c.font = '600 11px "JetBrains Mono", monospace';
    c.fillStyle = '#c9cfd8';
    c.fillText('PANEL · PRODUCCIÓN', 12, 13);
    c.fillStyle = 'rgba(31,191,117,.18)';
    rrect(c, w - 96, 6, 84, 14, 7);
    c.fill();
    c.fillStyle = '#1fbf75';
    c.beginPath();
    c.arc(w - 86, 13, 3, 0, Math.PI * 2);
    c.fill();
    c.font = '600 10px "JetBrains Mono", monospace';
    c.fillText('EN LÍNEA', w - 78, 13);
    c.fillStyle = '#8a94a3';
    c.font = '400 9px "JetBrains Mono", monospace';
    c.fillText('PEDIDOS / HORA', 16, 42);
    c.fillText('TRÁFICO', 236, 42);
    const bx = 16;
    const bw = 22;
    const by = 150;
    bars.forEach((o, i) => {
      const hh = o.v * 96;
      c.fillStyle = i === 4 ? '#1fbf75' : '#3a4250';
      c.fillRect(bx + i * 30, by - hh, bw, hh);
    });
    c.fillStyle = '#2f3540';
    c.fillRect(bx, by + 2, 7 * 30 - 8, 1);
    c.fillRect(236, by + 2, 130, 1);
    c.strokeStyle = 'rgba(31,191,117,.35)';
    c.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
      c.beginPath();
      c.moveTo(236, 60 + i * 30);
      c.lineTo(366, 60 + i * 30);
      c.stroke();
    }
    c.strokeStyle = '#1fbf75';
    c.lineWidth = 2;
    c.beginPath();
    series.forEach((v, i) => {
      const x = 236 + i * 3.7;
      const y = 150 - v * 88;
      if (i) c.lineTo(x, y);
      else c.moveTo(x, y);
    });
    c.stroke();
    c.fillStyle = '#8a94a3';
    c.font = '400 9px "JetBrains Mono", monospace';
    c.fillText('LATENCIA', 16, 176);
    c.fillText('UPTIME', 136, 176);
    c.fillText('DESPLIEGUES HOY', 236, 176);
    c.fillStyle = '#c9cfd8';
    c.font = '600 16px "JetBrains Mono", monospace';
    c.fillText(lat + ' ms', 16, 196);
    c.fillText('99,98 %', 136, 196);
    c.fillText(String(deploys), 236, 196);
    dash.tex.needsUpdate = true;
  }
  function stepDash(): void {
    dashN++;
    if (dashN % 12 === 0) {
      for (const o of bars) o.g = 0.2 + Math.random() * 0.75;
      lat = 30 + ((Math.random() * 40) | 0);
    }
    if (dashN % 90 === 0) deploys++;
    for (const o of bars) o.v += (o.g - o.v) * 0.18;
    series.shift();
    series.push(Math.min(0.95, Math.max(0.08, series[series.length - 1] + (Math.random() - 0.5) * 0.18)));
  }
  drawDash();
  function update(t: number): void {
    if (REDUCE) return;
    if (t - dashLast >= FPS6) {
      dashLast = t;
      stepDash();
      drawDash();
    }
  }
  return { tex: dash, update };
}

// ---------- university: three blackboard "slides" drawn in 1024×444 logical coordinates ----------
const LW = 1024;
const LH_BOARD = 444;
const INK = 'rgba(214,220,228,.9)';
const INK2 = 'rgba(138,148,163,.9)';
type SlideDraw = (c: CanvasRenderingContext2D) => void;
const SLIDE_TITLES = ['SQL en sitios distribuidos', 'Álgebra relacional', 'Esquemas de fragmentación'];

const boardBg = (c: CanvasRenderingContext2D) => {
  c.fillStyle = '#1b2126';
  c.fillRect(0, 0, LW, LH_BOARD);
  c.strokeStyle = 'rgba(201,207,216,.08)';
  c.lineWidth = 1;
  for (let x = 0; x < LW; x += 32) {
    c.beginPath();
    c.moveTo(x, 0);
    c.lineTo(x, LH_BOARD);
    c.stroke();
  }
};

const slides: SlideDraw[] = [
  // SQL over distributed sites: local fragment + global query, and the three networked sites.
  (c) => {
    c.font = `500 22px ${MONO}`;
    c.fillStyle = INK;
    c.fillText(SLIDE_TITLES[0], 34, 50);
    c.fillStyle = '#1fbf75';
    c.fillRect(34, 64, 300, 2);
    c.font = `500 19px ${MONO}`;
    const sql = [
      '-- fragmento en el sitio Trelew',
      'CREATE TABLE Cliente_TW AS',
      '  SELECT * FROM Cliente',
      "   WHERE ciudad = 'Trelew';",
      '',
      '-- consulta global (vista unión)',
      'SELECT c.nombre, SUM(v.monto)',
      '  FROM Cliente@S1 c JOIN Venta@S2 v',
      '    ON v.cli = c.id',
      ' GROUP BY c.nombre;',
    ];
    sql.forEach((l, i) => {
      c.fillStyle = l.startsWith('--') ? INK2 : INK;
      c.fillText(l, 34, 98 + i * 29);
    });
    const sites: [number, number, string][] = [
      [720, 120, 'S1 · Trelew'],
      [900, 150, 'S2 · Rawson'],
      [790, 290, 'S3 · Madryn'],
    ];
    c.strokeStyle = 'rgba(214,220,228,.55)';
    c.lineWidth = 2;
    for (const [i, j] of [
      [0, 1],
      [1, 2],
      [0, 2],
    ]) {
      c.beginPath();
      c.moveTo(sites[i][0], sites[i][1]);
      c.lineTo(sites[j][0], sites[j][1]);
      c.stroke();
    }
    for (const [x, y, n] of sites) {
      c.fillStyle = '#1b2126';
      c.strokeStyle = n[1] === '1' ? '#1fbf75' : 'rgba(214,220,228,.9)';
      c.beginPath();
      c.rect(x - 44, y - 22, 88, 44);
      c.fill();
      c.stroke();
      c.fillStyle = 'rgba(214,220,228,.95)';
      c.font = `500 15px ${MONO}`;
      c.textAlign = 'center';
      c.fillText(n, x, y + 5);
      c.textAlign = 'left';
      c.fillStyle = 'rgba(214,220,228,.6)';
      c.fillRect(x - 30, y - 12, 60, 3);
      c.fillRect(x - 30, y - 5, 60, 3);
    }
    c.font = `400 15px ${MONO}`;
    c.fillStyle = INK2;
    c.fillText('transparencia de ubicación', 700, 360);
  },
  // Relational algebra: expressions, equivalences and a query tree.
  (c) => {
    c.font = `500 22px ${MONO}`;
    c.fillStyle = INK;
    c.fillText(SLIDE_TITLES[1], 34, 50);
    c.fillStyle = '#1fbf75';
    c.fillRect(34, 64, 230, 2);
    c.font = `500 20px ${MONO}`;
    const F = [
      'π nombre, monto (σ monto > 1000 (Cliente ⋈ Venta))',
      'Cliente ⋈ id = cli Venta',
      'σ p (R ⋈ S) ≡ σ p (R) ⋈ S   si p usa sólo atrib. de R',
      'π A (π A,B (R)) ≡ π A (R)',
      'R ∪ S,  R − S,  R × S,  R ÷ S',
    ];
    F.forEach((l, i) => {
      c.fillStyle = i === 2 ? '#1fbf75' : INK;
      c.fillText(l, 34, 110 + i * 46);
    });
    c.font = `400 15px ${MONO}`;
    c.fillStyle = INK2;
    c.fillText('reglas de reescritura: empujar σ y π hacia las hojas', 34, 350);
    const tree: [number, number, string][] = [
      [870, 110, 'π nombre, monto'],
      [870, 180, 'σ monto > 1000'],
      [870, 250, '⋈'],
      [790, 330, 'Cliente'],
      [950, 330, 'Venta'],
    ];
    c.strokeStyle = 'rgba(214,220,228,.55)';
    c.lineWidth = 2;
    for (const [i, j] of [
      [0, 1],
      [1, 2],
      [2, 3],
      [2, 4],
    ]) {
      c.beginPath();
      c.moveTo(tree[i][0], tree[i][1]);
      c.lineTo(tree[j][0], tree[j][1]);
      c.stroke();
    }
    c.textAlign = 'center';
    for (const [x, y, n] of tree) {
      c.font = `500 16px ${MONO}`;
      const w = c.measureText(n).width + 20;
      c.fillStyle = '#1b2126';
      c.fillRect(x - w / 2, y - 14, w, 28);
      c.fillStyle = n === '⋈' ? '#1fbf75' : 'rgba(214,220,228,.95)';
      c.fillText(n, x, y + 6);
    }
    c.textAlign = 'left';
  },
  // Fragmentation schemes: horizontal, vertical, mixed and the correctness conditions.
  (c) => {
    c.font = `500 22px ${MONO}`;
    c.fillStyle = INK;
    c.fillText(SLIDE_TITLES[2], 34, 50);
    c.fillStyle = '#1fbf75';
    c.fillRect(34, 64, 320, 2);
    c.font = `500 19px ${MONO}`;
    const L: [string, string][] = [
      ['Horizontal', 'Fi = σ ci (R)      R = F1 ∪ F2 ∪ F3'],
      ['Vertical', 'Fi = π Ai (R)      R = F1 ⋈ F2  (clave en ambos)'],
      ['Mixta', 'π Ai (σ ci (R))'],
      ['Correctitud', 'completitud · reconstrucción · disyunción'],
    ];
    L.forEach(([k, v], i) => {
      c.fillStyle = '#1fbf75';
      c.fillText(k, 34, 110 + i * 62);
      c.fillStyle = INK;
      c.fillText(v, 34, 138 + i * 62);
    });
    const box = (x: number, y: number, w: number, n: string, hot: boolean) => {
      c.fillStyle = '#1b2126';
      c.strokeStyle = hot ? '#1fbf75' : 'rgba(214,220,228,.9)';
      c.lineWidth = 2;
      c.beginPath();
      c.rect(x - w / 2, y - 18, w, 36);
      c.fill();
      c.stroke();
      c.fillStyle = 'rgba(214,220,228,.95)';
      c.font = `500 15px ${MONO}`;
      c.textAlign = 'center';
      c.fillText(n, x, y + 5);
      c.textAlign = 'left';
    };
    c.strokeStyle = 'rgba(214,220,228,.55)';
    c.lineWidth = 2;
    for (const x of [680, 820, 960]) {
      c.beginPath();
      c.moveTo(820, 118);
      c.lineTo(x, 190);
      c.stroke();
    }
    box(820, 100, 330, 'Cliente(id, nombre, ciudad, saldo)', false);
    box(680, 208, 124, 'F1 · Trelew', true);
    box(820, 208, 124, 'F2 · Rawson', false);
    box(960, 208, 124, 'F3 · Madryn', false);
    c.beginPath();
    c.moveTo(820, 226);
    c.lineTo(820, 290);
    c.stroke();
    box(740, 308, 150, 'π id, nombre', false);
    box(900, 308, 150, 'π id, saldo', false);
    c.font = `400 15px ${MONO}`;
    c.fillStyle = INK2;
    c.fillText('horizontal por ciudad, luego vertical', 655, 365);
  },
];

// Graffiti in the lower-left corner, apart from what is taught; it stays on the three slides.
const graffiti = (c: CanvasRenderingContext2D) => {
  c.save();
  c.translate(150, 418);
  c.rotate(-0.05);
  c.font = `700 24px ${MONO}`;
  c.fillStyle = 'rgba(214,220,228,.8)';
  c.textAlign = 'center';
  c.fillText('PARISE CRACK', 0, 0);
  c.strokeStyle = 'rgba(214,220,228,.45)';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(-92, 9);
  c.lineTo(94, 6);
  c.stroke();
  c.restore();
};

export interface Board {
  board: CanvasTex;
  slide: CanvasTex;
  /** Board and screen change slide every 6 s with a short wipe. */
  tick(t: number): void;
}

export function createBoard(): Board {
  const board = canvasTex(896, 388, () => {});
  const BS = { shown: -1, last: -1 };
  function drawBoard(idx: number, prev: number | null, p: number): void {
    const c = board.ctx;
    const w = board.canvas.width;
    const h = board.canvas.height;
    c.save();
    c.scale(w / LW, h / LH_BOARD);
    boardBg(c);
    slides[prev == null ? idx : prev](c);
    if (prev != null) {
      c.save();
      c.beginPath();
      c.rect(0, 0, p * LW, LH_BOARD);
      c.clip();
      boardBg(c);
      slides[idx](c);
      c.restore();
      c.fillStyle = '#1fbf75';
      c.fillRect(p * LW - 2, 0, 3, LH_BOARD);
    }
    graffiti(c);
    c.restore();
    board.tex.needsUpdate = true;
  }
  drawBoard(0, null, 1);
  const slide = canvasTex(384, 216, () => {});
  function drawSlide(idx: number): void {
    const c = slide.ctx;
    const w = 384;
    const h = 216;
    c.fillStyle = '#303a48';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#1fbf75';
    c.fillRect(0, 0, 6, h);
    c.textBaseline = 'middle';
    c.textAlign = 'left';
    c.font = `600 15px ${MONO}`;
    c.fillStyle = '#e6ebf0';
    c.fillText(SLIDE_TITLES[idx], 22, 30);
    c.fillStyle = 'rgba(230,235,240,.25)';
    c.fillRect(22, 46, 220, 1);
    const bw = [
      [150, 110, 180],
      [120, 170, 90],
      [160, 130, 200],
    ][idx];
    bw.forEach((len, i) => {
      c.fillStyle = '#1fbf75';
      c.beginPath();
      c.arc(28, 72 + i * 32, 3.5, 0, Math.PI * 2);
      c.fill();
      c.fillStyle = 'rgba(230,235,240,.55)';
      c.fillRect(40, 68 + i * 32, len, 8);
      c.fillStyle = 'rgba(230,235,240,.25)';
      c.fillRect(40, 80 + i * 32, len * 0.6, 4);
    });
    const cx = 268;
    const cy = 70;
    const cw = 94;
    const ch = 90;
    c.fillStyle = 'rgba(0,0,0,.18)';
    c.fillRect(cx - 8, cy - 8, cw + 16, ch + 16);
    if (idx === 0) {
      [0.45, 0.7, 0.35, 0.9, 0.6].forEach((v, i) => {
        c.fillStyle = i === 3 ? '#1fbf75' : 'rgba(230,235,240,.5)';
        c.fillRect(cx + i * 19, cy + ch - v * ch, 14, v * ch);
      });
    } else if (idx === 1) {
      c.strokeStyle = 'rgba(230,235,240,.5)';
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(cx, cy + ch);
      c.lineTo(cx + cw, cy + ch - cw * 0.5);
      c.stroke();
      c.strokeStyle = '#1fbf75';
      c.beginPath();
      for (let k = 0; k <= 20; k++) {
        const u = k / 20;
        const x = cx + u * cw;
        const y = cy + ch - u * u * ch;
        if (k) c.lineTo(x, y);
        else c.moveTo(x, y);
      }
      c.stroke();
    } else {
      c.strokeStyle = '#1fbf75';
      c.lineWidth = 10;
      c.beginPath();
      c.arc(cx + cw / 2, cy + ch / 2, 34, -Math.PI / 2, Math.PI * 0.9);
      c.stroke();
      c.strokeStyle = 'rgba(230,235,240,.3)';
      c.beginPath();
      c.arc(cx + cw / 2, cy + ch / 2, 34, Math.PI * 0.9, Math.PI * 1.5);
      c.stroke();
    }
    c.font = `400 10px ${MONO}`;
    c.fillStyle = 'rgba(230,235,240,.5)';
    c.fillText('Bases de Datos II · clase 7', 22, h - 16);
    c.textAlign = 'right';
    c.fillText(`${idx + 1} / 3`, w - 16, h - 16);
    c.textAlign = 'left';
    slide.tex.needsUpdate = true;
  }
  drawSlide(0);
  function tick(t: number): void {
    const cyc = t / 6;
    const idx = Math.floor(cyc) % 3;
    const p = ((cyc % 1) * 6) / 0.6;
    if (p >= 1) {
      if (BS.shown !== idx) {
        BS.shown = idx;
        drawBoard(idx, null, 1);
        drawSlide(idx);
      }
      return;
    }
    if (t - BS.last < FPS6) return;
    BS.last = t;
    drawBoard(idx, (idx + 2) % 3, p);
  }
  return { board, slide, tick };
}

// ---------- home: the TV "movie" as colour bands (fallback under the YouTube player) ----------
export interface TvBands {
  tex: CanvasTex;
  draw(t: number): void;
}

export function createTvBands(): TvBands {
  const tvc = canvasTex(256, 144, () => {});
  function draw(t: number): void {
    const c = tvc.ctx;
    const w = 256;
    const h = 144;
    const sc = Math.floor(t / 5);
    const hue = (sc * 77 + t * 4) % 360;
    const cut = t % 5;
    const g = c.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, `hsl(${hue} 45% 30%)`);
    g.addColorStop(0.65, `hsl(${(hue + 40) % 360} 40% 18%)`);
    g.addColorStop(1, '#0b0d10');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    c.fillStyle = `hsl(${(hue + 60) % 360} 70% 72%)`;
    c.beginPath();
    c.arc(70 + Math.sin(t * 0.2 + sc) * 40, 48, 15, 0, Math.PI * 2);
    c.fill();
    c.fillStyle = 'rgba(10,12,16,.85)';
    for (let i = 0; i < 7; i++) {
      const x = ((((i * 46 - t * 22) % (w + 60)) + w + 60) % (w + 60)) - 30;
      const hh = 26 + ((i * 37 + sc * 13) % 44);
      c.fillRect(x, h - 22 - hh, 22 + (i % 3) * 6, hh);
    }
    c.fillRect(0, h - 22, w, 22);
    if (cut < 0.35) {
      c.fillStyle = `rgba(0,0,0,${(1 - cut / 0.35).toFixed(2)})`;
      c.fillRect(0, 0, w, h);
    }
    c.fillStyle = '#000';
    c.fillRect(0, 0, w, 12);
    c.fillRect(0, h - 12, w, 12);
    tvc.tex.needsUpdate = true;
  }
  draw(0);
  return { tex: tvc, draw };
}
