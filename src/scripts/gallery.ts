import { $$, el } from './dom';

/**
 * Project card galleries (plan, Fase 7): one track with every slide, moved with the arrows
 * and mirrored by the dots. Every move pauses the clip (native `<video>`) and the YouTube
 * embed (postMessage to the player API); the dots hide over both, where they would sit on the
 * controls bar. The embed gets its `src` the first time the gallery reaches it. A broken image is swapped for the initials placeholder, as in the prototype.
 */
const YT_ORIGIN = 'https://www.youtube-nocookie.com';

function placeholder(img: HTMLImageElement): void {
  const ph = el('div', 'ph', img.dataset.initials ?? '');
  ph.setAttribute('role', 'img');
  ph.setAttribute('aria-label', img.alt);
  img.replaceWith(ph);
}

function pauseEmbed(frame: HTMLIFrameElement): void {
  if (!frame.src) return;
  frame.contentWindow?.postMessage(JSON.stringify({ event: 'command', func: 'pauseVideo', args: [] }), YT_ORIGIN);
}

function bindCard(card: HTMLElement): void {
  const track = card.querySelector<HTMLElement>('.card-track');
  if (!track) return;
  const slides = [...track.children] as HTMLElement[];
  for (const img of $$<HTMLImageElement>('img', track)) {
    if (img.complete && img.naturalWidth === 0) placeholder(img);
    else img.addEventListener('error', () => placeholder(img), { once: true });
  }
  const dots = card.querySelector<HTMLElement>('.card-dots');
  const marks = dots ? ([...dots.children] as HTMLElement[]) : [];
  if (slides.length < 2 || !dots) return;
  let idx = 0;
  slides.forEach((slide, i) => (slide.inert = i !== 0));
  const go = (n: number) => {
    for (const slide of slides) {
      if (slide instanceof HTMLVideoElement) slide.pause();
      else if (slide instanceof HTMLIFrameElement) pauseEmbed(slide);
    }
    idx = (n + slides.length) % slides.length;
    track.style.transform = `translateX(${-idx * 100}%)`;
    // Only the visible slide exists for the keyboard and assistive tech.
    slides.forEach((slide, i) => (slide.inert = i !== idx));
    marks.forEach((d, i) => {
      if (i === idx) d.setAttribute('aria-current', 'true');
      else d.removeAttribute('aria-current');
    });
    const slide = slides[idx];
    // The embed loads the first time the gallery reaches it, never behind the gate.
    if (slide instanceof HTMLIFrameElement && !slide.src && slide.dataset.src) slide.src = slide.dataset.src;
    // Over a video the dots would sit on the controls bar.
    dots.hidden = slide instanceof HTMLVideoElement || slide instanceof HTMLIFrameElement;
  };
  marks.forEach((d, i) =>
    d.addEventListener('click', (e) => {
      e.stopPropagation();
      go(i);
    }),
  );
  for (const [cls, d] of [
    ['prev', -1],
    ['next', 1],
  ] as const) {
    card.querySelector<HTMLButtonElement>(`.card-arrow.${cls}`)?.addEventListener('click', (e) => {
      e.stopPropagation();
      go(idx + d);
    });
  }
}

export function initGalleries(): void {
  for (const card of $$('.card')) bindCard(card);
}
