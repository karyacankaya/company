/**
 * boot.js — Açılış: satır satır akan boot yazıları, ardından logo.
 * Tıklayarak geçilebilir. params.quick = true ise daha hızlı oynar
 * (kayıttan devam ederken).
 */
import { gsap } from 'gsap';
import { content } from '../../engine/content.js';
import { playSound } from '../../audio/sound.js';
import { el } from '../dom.js';
import { icon } from '../icons.js';
import { goTo } from '../sceneRouter.js';

const TAGS = { ok: '[  OK  ]', warn: '[ UYARI ]', plain: '' };

export function renderBoot(root, { next = 'login', quick = false } = {}) {
  const { bootLines, osName, osVersion } = content.story;

  const lines = bootLines.map((line) =>
    el('div', { class: `boot__line boot__line--${line.kind}` }, [
      TAGS[line.kind] ? el('span', { class: 'boot__tag' }, TAGS[line.kind]) : null,
      el('span', {}, line.text),
    ]),
  );
  const console_ = el('div', { class: 'boot__console' }, lines);
  const logo = el('div', { class: 'boot__logo' }, [
    el('span', { class: 'boot__logo-icon', html: icon('compass') }),
    el('span', { class: 'boot__logo-name' }, osName),
    el('span', { class: 'boot__logo-version' }, osVersion),
  ]);
  const scene = el('div', { class: 'scene scene-boot' }, [console_, logo]);
  root.append(scene);

  const speed = quick ? 0.45 : 1;
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    tl.kill();
    gsap.to(scene, { opacity: 0, duration: 0.3, onComplete: () => goTo(next) });
  };

  const tl = gsap.timeline({ onComplete: finish });
  tl.set(lines, { opacity: 0 })
    // Satırlar düzensiz aralıklarla gelsin: gerçek açılış hissi.
    .to(lines, { opacity: 1, duration: 0.01, stagger: { each: 0.13 * speed, ease: 'none' } })
    .to(console_, { opacity: 0, duration: 0.25 }, '+=0.25')
    .call(() => playSound('boot'))
    .fromTo(logo, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1, duration: 0.7 * speed, ease: 'power2.out' })
    .to(logo, { opacity: 0, duration: 0.35 }, `+=${0.6 * speed}`);

  scene.addEventListener('click', finish);
  return () => tl.kill();
}
