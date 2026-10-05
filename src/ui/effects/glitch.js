/**
 * glitch.js — Kısa bir "sinyal bozulması" efekti.
 * ------------------------------------------------------------------
 *  - titreme ve renk kayması: hedef öğeye .is-glitching CSS sınıfı
 *  - kayan çizgiler: ekranı tarayan yarı saydam yatay çizgiler
 *  - "dilimler": rastgele yükseklikte, yana kayan renkli şeritler (GSAP)
 * ------------------------------------------------------------------
 */
import { gsap } from 'gsap';
import { playSound } from '../../audio/sound.js';
import { el } from '../dom.js';

/**
 * @param {HTMLElement} target  bozulacak alan (masaüstü)
 * @param {number} duration     milisaniye
 * @returns Promise — efekt bitince tamamlanır
 */
export function playGlitch(target, duration = 800) {
  playSound('glitch');

  const slices = Array.from({ length: 7 }, () => el('div', { class: 'glitch__slice' }));
  const overlay = el('div', { class: 'glitch' }, [el('div', { class: 'glitch__scanlines' }), ...slices]);
  target.append(overlay);
  target.classList.add('is-glitching');

  // Her dilim rastgele bir yerde belirip yana kayar, birkaç kez tekrar eder.
  slices.forEach((slice) => {
    gsap.timeline({ repeat: 3, repeatRefresh: true })
      .set(slice, {
        top: () => `${Math.random() * 95}%`,
        height: () => `${2 + Math.random() * 9}%`,
        opacity: () => 0.25 + Math.random() * 0.5,
      })
      .fromTo(slice, { x: () => (Math.random() - 0.5) * 140 }, { x: () => (Math.random() - 0.5) * 140, duration: () => 0.06 + Math.random() * 0.12, ease: 'steps(3)' });
  });

  return new Promise((resolve) => {
    setTimeout(() => {
      target.classList.remove('is-glitching');
      gsap.to(overlay, { opacity: 0, duration: 0.12, onComplete: () => { overlay.remove(); resolve(); } });
    }, duration);
  });
}
