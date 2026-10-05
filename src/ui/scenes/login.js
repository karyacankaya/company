/**
 * login.js — Zeynep'in kullanıcı giriş ekranı.
 */
import { gsap } from 'gsap';
import { content } from '../../engine/content.js';
import { playSound } from '../../audio/sound.js';
import { el } from '../dom.js';
import { createPasswordForm } from '../passwordForm.js';
import { goTo } from '../sceneRouter.js';
import { renderMemories, renderNoteCard } from '../storyBits.js';
import { startClock } from '../clock.js';

export function renderLogin(root) {
  const { user, login } = content.story;

  const time = el('div', { class: 'login__time' });
  const date = el('div', { class: 'login__date' });
  const stopClock = startClock(time, date);

  const avatar = el('div', { class: 'login__avatar' }, user.initial);
  const form = createPasswordForm({
    lockId: 'login',
    variant: 'login',
    placeholder: login.placeholder,
    header: el('div', { class: 'login__user' }, [avatar, el('div', { class: 'login__name' }, user.fullName)]),
    onSuccess: () => {
      gsap.to(scene, { opacity: 0, scale: 1.04, duration: 0.45, ease: 'power2.in', onComplete: () => goTo('desktop', { firstTime: true }) });
    },
  });

  const reread = el('button', { class: 'login__reread', onclick: openNoteOverlay }, `✉  ${login.rereadNote}`);

  const scene = el('div', { class: 'scene scene-login wallpaper' }, [
    el('div', { class: 'login__clock' }, [time, date]),
    el('div', { class: 'login__panel' }, [form.element]),
    el('div', { class: 'login__footer' }, [el('span', {}, login.lockedText), reread]),
  ]);
  root.append(scene);

  gsap.from(scene.querySelectorAll('.login__clock, .login__panel, .login__footer'), {
    opacity: 0, y: 16, duration: 0.5, stagger: 0.1, ease: 'power2.out',
  });
  setTimeout(form.focus, 300);

  /** Not ve anılar için yarı saydam bir katman açar. */
  function openNoteOverlay() {
    playSound('click');
    const close = () => gsap.to(overlay, { opacity: 0, duration: 0.2, onComplete: () => overlay.remove() });
    const overlay = el('div', { class: 'overlay', onclick: (e) => e.target === overlay && close() }, [
      el('div', { class: 'overlay__panel' }, [
        el('button', { class: 'overlay__close', onclick: close, 'aria-label': 'Kapat' }, '×'),
        renderNoteCard(),
        renderMemories(),
      ]),
    ]);
    scene.append(overlay);
    gsap.from(overlay, { opacity: 0, duration: 0.2 });
    gsap.from(overlay.querySelector('.overlay__panel'), { y: 20, duration: 0.3, ease: 'power2.out' });
  }

  return stopClock;
}
