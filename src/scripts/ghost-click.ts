import { gsap } from 'gsap';
import { REDUCE } from './env';
import { pointer } from './pointer';

/**
 * A visible stand-in mouse that glides to `target`, hovers it and presses it, so the visitor sees
 * the site click for them (the hunt uses it to enter from the gate). It dispatches no real click:
 * the caller acts once the promise resolves. The ghost fades out on its own afterwards.
 */
export async function ghostClick(target: HTMLElement): Promise<void> {
  const r = target.getBoundingClientRect();
  const x = r.left + r.width * 0.42;
  const y = r.top + r.height * 0.6;
  // Start where the real pointer was; too close (or never moved) and it comes in from the lower right.
  const far = Math.hypot(pointer.x - x, pointer.y - y) > 140;
  const from = far ? { x: pointer.x, y: pointer.y } : { x: x + 170, y: y + 130 };

  const ghost = document.createElement('div');
  ghost.className = 'ghost-cursor';
  ghost.setAttribute('aria-hidden', 'true');
  ghost.innerHTML = '<i class="ghost-ripple"></i><img src="/cursores/normal.png" alt="" width="32" height="32" />';
  document.body.append(ghost);
  document.body.classList.add('ghost-driving');
  const img = ghost.querySelector('img');

  if (REDUCE) {
    gsap.set(ghost, { x, y });
    target.classList.add('is-ghost-hover');
    await gsap.to({}, { duration: 0.4 });
  } else {
    gsap.set(ghost, { x: from.x, y: from.y, opacity: 0 });
    await gsap.to(ghost, { opacity: 1, duration: 0.25, ease: 'none' });
    await gsap.to(ghost, {
      x,
      y,
      duration: 1.0,
      ease: 'power2.inOut',
      onUpdate() {
        if (this.progress() > 0.8) target.classList.add('is-ghost-hover');
      },
    });
    target.classList.add('is-ghost-hover');
    await gsap.to({}, { duration: 0.35 });
    // Press: the arrow dips, the button sinks and a ring spreads from the tip.
    ghost.classList.add('is-press');
    target.classList.add('is-ghost-press');
    await gsap.to(img, { scale: 0.82, duration: 0.09, ease: 'power2.in' });
    await gsap.to(img, { scale: 1, duration: 0.16, ease: 'power2.out' });
    target.classList.remove('is-ghost-press');
  }
  gsap.to(ghost, {
    opacity: 0,
    delay: 0.5,
    duration: 0.3,
    onComplete: () => {
      ghost.remove();
      target.classList.remove('is-ghost-hover');
      document.body.classList.remove('ghost-driving');
    },
  });
}
