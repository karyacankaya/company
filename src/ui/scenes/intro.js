/**
 * intro.js — Açılış hikâyesi: kargo → not → ortak anılar.
 * ------------------------------------------------------------------
 * Her adım bir fonksiyon. "Devam" düğmesi sıradaki adımı çizer.
 * Sahne içi sıralı animasyonlar GSAP "timeline" ile yapılır:
 * timeline, animasyonları art arda (ya da üst üste) dizmeye yarar.
 * ------------------------------------------------------------------
 */
import { gsap } from 'gsap';
import { content } from '../../engine/content.js';
import { playSound } from '../../audio/sound.js';
import { clear, el } from '../dom.js';
import { goTo } from '../sceneRouter.js';
import { renderMemories, renderNoteCard } from '../storyBits.js';

export function renderIntro(root) {
  const intro = content.story.intro;
  const stage = el('div', { class: 'intro__stage' });
  const skip = el('button', { class: 'intro__skip', onclick: () => showMemories() }, 'Geç ›');
  root.append(el('div', { class: 'scene scene-intro' }, [el('div', { class: 'rain rain--soft' }), stage, skip]));

  let timeline = null;

  /** Sahneyi temizleyip yeni adımı çizer. */
  function step(build) {
    timeline?.kill();
    clear(stage);
    timeline = gsap.timeline();
    build();
  }

  function nextButton(label, onClick) {
    return el('button', { class: 'btn btn--primary intro__next', onclick: () => { playSound('click'); onClick(); } }, label);
  }

  // Adım 1: Kargo ve olayın özeti
  function showParcel() {
    step(() => {
      const p = intro.parcel;
      const parcel = el('div', { class: 'parcel' }, [
        el('div', { class: 'parcel__tape' }),
        el('div', { class: 'parcel__label' }, [
          el('strong', {}, p.label),
          el('span', {}, p.from),
          el('span', {}, p.to),
          el('code', {}, p.code),
        ]),
      ]);
      const lines = intro.lines.map((line) => el('p', { class: 'intro__line' }, line));
      const next = nextButton('Notu aç', showNote);
      stage.append(parcel, el('div', { class: 'intro__lines' }, lines), next);

      timeline
        .from(parcel, { y: -80, opacity: 0, rotate: -6, duration: 0.6, ease: 'bounce.out' })
        .from(lines, { opacity: 0, y: 8, duration: 0.45, stagger: 0.55 }, '-=0.1')
        .from(next, { opacity: 0, duration: 0.3 });
    });
  }

  // Adım 2: Zeynep'in notu
  function showNote() {
    step(() => {
      const note = renderNoteCard();
      const next = nextButton('Düşün', showMemories);
      stage.append(note, next);
      timeline
        .from(note, { rotateX: -80, opacity: 0, transformOrigin: 'top center', duration: 0.7, ease: 'power3.out' })
        .from(next, { opacity: 0, duration: 0.3 }, '+=0.4');
    });
  }

  // Adım 3: Ortak anılar (giriş şifresinin cevabı burada)
  function showMemories() {
    step(() => {
      skip.remove();
      const head = el('div', { class: 'intro__memories-head' }, [
        el('h2', {}, intro.memoriesTitle),
        el('p', {}, intro.memoriesIntro),
      ]);
      const memories = renderMemories();
      const next = nextButton(intro.openLaptop, () => goTo('boot', { next: 'login' }));
      stage.append(head, memories, next);
      stage.classList.add('intro__stage--wide');
      timeline
        .from(head, { opacity: 0, y: 10, duration: 0.4 })
        .from(memories.children, { opacity: 0, y: 18, duration: 0.5, stagger: 0.25 })
        .from(next, { opacity: 0, duration: 0.3 });
    });
  }

  showParcel();
  return () => timeline?.kill();
}
