/**
 * fakeCursor.js — Kendi kendine hareket eden sahte fare imleci.
 * ------------------------------------------------------------------
 * Gerçek imleci gizleyip (CSS: body.cursor-hijacked) onun son
 * konumunda sahte bir imleç çizeriz; sonra GSAP ile onu hareket
 * ettiririz. Oyuncuya "biri bilgisayarımı uzaktan kontrol ediyor"
 * hissini vermek için.
 * ------------------------------------------------------------------
 */
import { gsap } from 'gsap';
import { playSound } from '../../audio/sound.js';
import { el, wait } from '../dom.js';

// Gerçek farenin son konumu (sahte imleç oradan başlasın).
const lastMouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
window.addEventListener('pointermove', (e) => {
  lastMouse.x = e.clientX;
  lastMouse.y = e.clientY;
}, { passive: true });

const ARROW_SVG = `<svg viewBox="0 0 20 24" width="20" height="24"><path d="M2 2l0 17 4.6-4.3 3 6.8 3-1.3-3-6.6 6.4-.3z" fill="#fff" stroke="#111" stroke-width="1.4" stroke-linejoin="round"/></svg>`;

export function createFakeCursor() {
  const node = el('div', { class: 'fake-cursor', html: ARROW_SVG });
  document.body.append(node);
  document.body.classList.add('cursor-hijacked');
  gsap.set(node, { x: lastMouse.x, y: lastMouse.y });

  return {
    /** Ekrandaki (x, y) noktasına "insan gibi" hafif kavisli hareket. */
    moveTo(x, y, duration = 0.8) {
      return new Promise((resolve) => {
        const tl = gsap.timeline({ onComplete: resolve });
        tl.to(node, { x, duration, ease: 'power2.inOut' }, 0)
          .to(node, { y, duration, ease: 'power1.inOut' }, 0);
      });
    },
    /** Bir öğenin ortasına git. */
    moveToElement(target, duration) {
      const r = target.getBoundingClientRect();
      return this.moveTo(r.left + r.width / 2, r.top + r.height / 2, duration);
    },
    /** Tıklama: küçük bir basılma animasyonu + ses. */
    async click(times = 1) {
      for (let i = 0; i < times; i++) {
        playSound('click');
        await gsap.to(node, { scale: 0.82, duration: 0.06, yoyo: true, repeat: 1 });
        await wait(70);
      }
    },
    remove() {
      document.body.classList.remove('cursor-hijacked');
      gsap.to(node, { opacity: 0, duration: 0.2, onComplete: () => node.remove() });
    },
  };
}
