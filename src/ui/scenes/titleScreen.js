/**
 * titleScreen.js — Başlık ekranı.
 * Tarayıcılar ilk tıklamadan önce ses çalmaya izin vermediği için
 * oyun her zaman bu ekranla başlar.
 */
import { gsap } from 'gsap';
import { content } from '../../engine/content.js';
import { getDifficulty, hasSave, hasFlag, isUnlocked, startNewGame } from '../../engine/state.js';
import { playSound } from '../../audio/sound.js';
import { el } from '../dom.js';
import { lockIconSvg } from '../icons.js';
import { goTo } from '../sceneRouter.js';

export function renderTitleScreen(root) {
  const t = content.story.title;
  const canContinue = hasSave();
  let difficulty = getDifficulty(); // son seçilen zorluk hatırlanır

  const newGame = () => {
    if (canContinue && !confirm('Kayıtlı ilerlemen silinecek. Emin misin?')) return;
    playSound('click');
    startNewGame({ difficulty });
    goTo('intro');
  };

  // ---- Zorluk seçimi (Yeni oyun için) ----------------------------
  const d = content.story.difficulty;
  const detail = el('p', { class: 'difficulty__detail' });
  const optionButtons = d.options.map((option) => el('button', {
    class: 'difficulty__option',
    'data-id': option.id,
    onclick: () => { playSound('key'); difficulty = option.id; renderDifficulty(); },
  }, option.name));
  const difficultyPicker = el('div', { class: 'difficulty' }, [
    el('span', { class: 'difficulty__label' }, d.label),
    el('div', { class: 'difficulty__options', role: 'radiogroup' }, optionButtons),
    detail,
  ]);
  function renderDifficulty() {
    optionButtons.forEach((b) => b.classList.toggle('is-active', b.dataset.id === difficulty));
    detail.textContent = d.options.find((o) => o.id === difficulty).detail;
  }
  renderDifficulty();

  const continueGame = () => {
    playSound('click');
    // Oyun bittiyse son ekranına.
    if (hasFlag('act4Complete')) return goTo('ending');
    // Giriş şifresi daha önce çözüldüyse doğrudan masaüstüne.
    goTo('boot', { quick: true, next: isUnlocked('login') ? 'desktop' : 'login' });
  };

  const scene = el('div', { class: 'scene scene-title' }, [
    el('div', { class: 'rain' }),
    el('div', { class: 'scene-title__inner' }, [
      el('div', { class: 'scene-title__lock', html: lockIconSvg() }),
      el('h1', { class: 'scene-title__name' }, t.name),
      el('p', { class: 'scene-title__tagline' }, t.tagline),
      difficultyPicker,
      el('div', { class: 'scene-title__buttons' }, [
        canContinue ? el('button', { class: 'btn btn--primary', onclick: continueGame }, t.continue) : null,
        el('button', { class: `btn ${canContinue ? '' : 'btn--primary'}`, onclick: newGame }, t.newGame),
      ]),
      el('p', { class: 'scene-title__note' }, t.soundNote),
    ]),
  ]);
  root.append(scene);

  gsap.from(scene.querySelectorAll('.scene-title__inner > *'), {
    opacity: 0, y: 14, duration: 0.6, stagger: 0.12, ease: 'power2.out',
  });
}
