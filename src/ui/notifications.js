/**
 * notifications.js — Sağ üstte beliren bildirim kartları.
 */
import { gsap } from 'gsap';
import { playSound } from '../audio/sound.js';
import { el } from './dom.js';
import { icon } from './icons.js';

let container = null;

export function initNotifications(containerElement) {
  container = containerElement;
}

/**
 * @param {object} o  { title, text, iconName, duration (ms, 0 = kalıcı), onClick, sound }
 */
export function notify({ title, text, iconName = 'info', duration = 5000, onClick, sound = 'notify', className = '' }) {
  if (!container) return null;
  if (sound) playSound(sound);

  const card = el('div', { class: `toast ${onClick ? 'toast--clickable' : ''} ${className}` }, [
    el('span', { class: 'toast__icon', html: icon(iconName) }),
    el('div', { class: 'toast__content' }, [
      el('strong', { class: 'toast__title' }, title),
      el('span', { class: 'toast__text' }, text),
    ]),
  ]);

  const dismiss = () => {
    gsap.to(card, { x: 40, opacity: 0, duration: 0.2, onComplete: () => card.remove() });
  };

  card.addEventListener('click', () => {
    onClick?.();
    dismiss();
  });

  container.append(card);
  gsap.fromTo(card, { x: 60, opacity: 0 }, { x: 0, opacity: 1, duration: 0.3, ease: 'power3.out' });
  if (duration > 0) setTimeout(dismiss, duration);
  return { dismiss };
}
