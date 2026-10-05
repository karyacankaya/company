/**
 * ending.js — Oyunun sonu ekranı.
 * Sonun başlığı, paragrafları (teker teker), önceki seçimlere bağlı
 * sonsöz satırları ve "Bulduğun sonlar: X/5" listesi.
 */
import { gsap } from 'gsap';
import { content } from '../../engine/content.js';
import { getChosenEndingId, getEnding, getEpilogueLines, getFoundEndings, undoFinalChoice } from '../../engine/endings.js';
import { resetGame } from '../../engine/state.js';
import { playSound } from '../../audio/sound.js';
import { el } from '../dom.js';
import { goTo } from '../sceneRouter.js';

export function renderEnding(root) {
  const ending = getEnding(getChosenEndingId());
  const screen = content.endings.screen;
  if (!ending) {
    goTo('title');
    return;
  }

  const found = getFoundEndings();
  const all = content.endings.endings;
  const paragraphs = ending.paragraphs.map((text) => el('p', { class: 'ending__p' }, text));
  const epilogue = getEpilogueLines().map((text) => el('p', { class: 'ending__epilogue' }, text));

  const scene = el('div', { class: `scene scene-ending scene-ending--${ending.tone}` }, [
    el('div', { class: 'rain rain--soft' }),
    el('article', { class: 'ending' }, [
      el('span', { class: 'ending__label' }, screen.endingLabel),
      el('h1', { class: 'ending__title' }, ending.title),
      ...paragraphs,
      epilogue.length ? el('div', { class: 'ending__epilogues' }, epilogue) : null,
      el('p', { class: 'ending__thanks' }, screen.thanks),
      el('div', { class: 'ending__found' }, [
        el('strong', {}, `${screen.foundLabel}: ${found.length} / ${all.length}`),
        el('ul', {}, all.map((e) => el('li', { class: `${found.includes(e.id) ? 'is-found' : ''} ${e.id === ending.id ? 'is-current' : ''}` },
          found.includes(e.id) ? e.title : screen.unknown))),
      ]),
      el('div', { class: 'ending__buttons' }, [
        el('button', { class: 'btn btn--primary', onclick: () => { playSound('click'); undoFinalChoice(); goTo('desktop'); } }, screen.retry),
        el('button', { class: 'btn', onclick: () => { if (confirm('Tüm ilerleme silinecek (bulduğun sonlar kalır). Emin misin?')) { resetGame(); goTo('title'); } } }, screen.restart),
        el('button', { class: 'btn', onclick: () => goTo('title') }, screen.title),
      ]),
    ]),
  ]);
  root.append(scene);

  // Paragraflar teker teker gelsin; tıklayınca hepsi hemen görünsün.
  const tl = gsap.timeline()
    .from(scene, { opacity: 0, duration: 1 })
    .from(scene.querySelectorAll('.ending__label, .ending__title'), { opacity: 0, y: 12, stagger: 0.3, duration: 0.6 })
    .from(paragraphs, { opacity: 0, y: 10, stagger: 1.4, duration: 0.8 })
    .from(scene.querySelectorAll('.ending__epilogues, .ending__thanks, .ending__found, .ending__buttons'), { opacity: 0, y: 8, stagger: 0.3, duration: 0.5 }, '+=0.4');
  scene.addEventListener('click', (e) => { if (!e.target.closest('button')) tl.progress(1); });
  return () => tl.kill();
}
