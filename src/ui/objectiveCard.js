/**
 * objectiveCard.js — Masaüstündeki "Sıradaki adım" kartı.
 * Oyun durumu her değiştiğinde ('state:changed') kendini günceller.
 * Başlığa tıklayınca küçülür/büyür.
 */
import { gsap } from 'gsap';
import { bus } from '../engine/eventBus.js';
import { getCurrentObjective } from '../engine/objectives.js';
import { el } from './dom.js';

export function createObjectiveCard() {
  const text = el('p', { class: 'objective__text' });
  const card = el('aside', { class: 'objective' }, [
    el('button', { class: 'objective__head', onclick: () => card.classList.toggle('is-collapsed') }, [
      el('span', {}, '📌 Sıradaki adım'),
      el('span', { class: 'objective__toggle' }, '–'),
    ]),
    text,
  ]);

  let lastText = null;
  function refresh() {
    const objective = getCurrentObjective();
    card.hidden = !objective;
    if (!objective || objective.text === lastText) return;
    lastText = objective.text;
    text.textContent = objective.text;
    // Yeni görev gelince kart hafifçe parlasın.
    gsap.fromTo(card, { boxShadow: '0 0 0 3px rgba(240,180,90,.6)' }, { boxShadow: '0 0 0 0px rgba(240,180,90,0)', duration: 1.2 });
  }

  refresh();
  const off = bus.on('state:changed', refresh);
  return { element: card, destroy: off };
}
