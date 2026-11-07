import { $, byId } from '../dom';
import { t } from '../i18n';

/**
 * No WebGL (or the world failed to load): the isometric illustration replaces the canvas on
 * `mundo`, and a blurred copy of it backs the stage. No `three` is ever downloaded here.
 */
export function showFallback(offline = false): void {
  if (offline) byId('fallbackNote').textContent = t.mundo.fallbackOffline;
  const img = $<HTMLImageElement>('#fallback img');
  if (!img) return;
  if (!img.src) img.src = img.dataset.src ?? '';
  byId('fallback').hidden = false;
  byId('world-canvas').hidden = true;
  byId('dragHint').hidden = true;
  // inicio keeps a blurred, dimmed copy of the same illustration as its backdrop.
  const bg = byId('fallbackBg');
  bg.style.backgroundImage = `url("${img.dataset.src}")`;
  bg.hidden = false;
  const stage = byId('stage3d');
  stage.classList.add('has-fallback');
  stage.classList.remove('is-off');
}
