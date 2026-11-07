import { gsap } from 'gsap';
import { $, $$, byId } from './dom';
import { COARSE, REDUCE } from './env';
import { t } from './i18n';
import { scramble } from './scramble';
import { glitch } from './transitions';

/** Word-level hover on inicio: each word is its own span so only the one under the cursor reacts. */
function splitHeroWords(node: HTMLElement | null): void {
  if (!node || node.querySelector('.w')) return;
  const words = (node.textContent ?? '').split(/(\s+)/);
  node.textContent = '';
  for (const part of words) {
    if (!part) continue;
    if (/^\s+$/.test(part)) {
      node.appendChild(document.createTextNode(part));
      continue;
    }
    const w = document.createElement('span');
    w.className = 'w';
    w.dataset.text = part;
    w.textContent = part;
    node.appendChild(w);
  }
}

function sparks(word: HTMLElement): void {
  const page = byId('inicio');
  const pr = page.getBoundingClientRect();
  const r = word.getBoundingClientRect();
  const n = COARSE ? 5 : 9;
  for (let i = 0; i < n; i++) {
    const spark = document.createElement('i');
    spark.className = 'spark';
    const x = r.left - pr.left + Math.random() * r.width;
    const y = r.top - pr.top + Math.random() * r.height;
    spark.style.left = `${x}px`;
    spark.style.top = `${y}px`;
    page.appendChild(spark);
    const dx = (Math.random() - 0.5) * 90;
    const dy = -20 - Math.random() * 70;
    spark.animate(
      [
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${dx}px,${dy}px) scale(.2)`, opacity: 0 },
      ],
      { duration: 550 + Math.random() * 350, easing: 'cubic-bezier(.16,1,.3,1)' },
    ).onfinish = () => spark.remove();
  }
}

/** inicio entrance: glitch the name once, then the hero lines rise in. */
export function heroIntro(): void {
  const title = byId('heroTitle');
  if (REDUCE) {
    glitch(title);
    return;
  }
  gsap.from($$('#inicio .hero > *'), {
    y: 26,
    opacity: 0,
    duration: 1.2,
    ease: 'expo.out',
    stagger: 0.09,
    delay: 0.25,
    clearProps: 'transform,opacity',
  });
  // Glitch once the heading is visible enough to show it.
  gsap.delayedCall(0.55, () => glitch(title));
}

export function initHero(): void {
  const brand = byId('brandName');
  brand.closest('.brand')?.addEventListener('pointerenter', () => scramble(brand, t.header.brand, 0.6));
  // Back arrow: the gate only exists at load time, so go back by reloading without a hash. Hunt progress stays in storage.
  byId('backGate').addEventListener('click', () => {
    history.replaceState(null, '', location.pathname + location.search);
    location.reload();
  });
  for (const selector of ['#inicio .hero-eyebrow', '#inicio .hero-title .l1', '#inicio .hero-title .l2', '#inicio .hero-desc']) {
    splitHeroWords($(selector));
  }
  const hot = new WeakSet<HTMLElement>();
  $('#inicio .hero')?.addEventListener('pointerover', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    const w = target?.closest<HTMLElement>('.w');
    if (!w || REDUCE || hot.has(w)) return;
    hot.add(w);
    // Random glyphs have other widths: freeze the box so neighbours do not shift.
    w.style.width = `${w.offsetWidth}px`;
    w.classList.add('is-hot');
    scramble(w, w.dataset.text ?? '', 0.45);
    sparks(w);
    setTimeout(() => {
      w.classList.remove('is-hot');
      w.style.width = '';
      hot.delete(w);
    }, 520);
  });
}
