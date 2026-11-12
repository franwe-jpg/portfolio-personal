import { gsap } from 'gsap';
import { $$, el } from './dom';
import { REDUCE } from './env';
import { pageEl } from './router';
import { scramble } from './scramble';
import { on, type Page } from './state';

/** Split a heading into words (spans) for the rise reveal. */
function splitWords(heading: HTMLElement): void {
  const text = (heading.textContent ?? '').trim();
  heading.setAttribute('aria-label', text);
  heading.replaceChildren(
    ...text.split(/\s+/).flatMap((word, index, words) => {
      const outer = el('span', 'w');
      outer.setAttribute('aria-hidden', 'true');
      outer.appendChild(el('span', 'wi', word));
      return index < words.length - 1 ? [outer, document.createTextNode(' ')] : [outer];
    }),
  );
}

const armed = new Set<Page>();

/** Reveals inside the scrolling pages (IntersectionObserver, armed on the first visit). */
function armReveals(page: Page): void {
  if (armed.has(page)) return;
  armed.add(page);
  const root = pageEl(page);
  const scroller = root.querySelector('.page-scroll');
  if (!scroller) return;
  for (const heading of $$('.split', root)) splitWords(heading);
  for (const mono of $$('[data-scramble]', root)) mono.textContent = (mono.textContent ?? '').toUpperCase();
  if (REDUCE) return;
  const run = (node: HTMLElement) => {
    if (node.classList.contains('split')) {
      gsap.from(node.querySelectorAll('.wi'), { yPercent: 110, opacity: 0, duration: 1.2, ease: 'expo.out', stagger: 0.045 });
    } else if (node.hasAttribute('data-scramble')) {
      scramble(node, node.textContent ?? '', 0.6);
    } else if (node.classList.contains('reveal-card')) {
      gsap.fromTo(
        node,
        { clipPath: 'inset(100% 0% 0% 0% round 16px)' },
        {
          clipPath: 'inset(0% 0% 0% 0% round 16px)',
          duration: 1.3,
          ease: 'expo.out',
          onComplete: () => {
            node.style.clipPath = '';
          },
        },
      );
    } else if (node.classList.contains('chips')) {
      gsap.from(node.children, { y: 14, opacity: 0, duration: 0.8, ease: 'expo.out', stagger: 0.05 });
    } else if (node.classList.contains('contact-big')) {
      // The button rises through its ticket host: GSAP and the button's CSS transform transition fight,
      // which left it stuck 18px low and out of line with its ticket.
      gsap.from(node.querySelectorAll('.mail, .socials li, .tk-host'), {
        y: 18,
        opacity: 0,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.06,
      });
    } else {
      gsap.from(node, { y: 24, opacity: 0, duration: 1.1, ease: 'expo.out' });
    }
  };
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          io.unobserve(entry.target);
          run(entry.target as HTMLElement);
        }
      }
    },
    { root: scroller, rootMargin: '0px 0px -8% 0px' },
  );
  for (const target of $$('.split, [data-scramble], .reveal, .reveal-card, .chips, .contact-big', root)) io.observe(target);
}

export function initReveals(): void {
  on('app:pageswap', (event) => armReveals(event.detail));
}
