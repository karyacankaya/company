/**
 * notes.js — Notlar uygulaması + Sezar "Çözücü" aracı.
 * ------------------------------------------------------------------
 * Çözücü: oyuncu bir metin girer (ya da şifreli notu "aktarır"),
 * kaydırma sayısını seçer, sonuç anında görünür. Doğru kaydırmayı
 * oyuncunun kendisi bulmalı; kod hiçbir şeyi otomatik çözmez.
 * ------------------------------------------------------------------
 */
import { gsap } from 'gsap';
import { content } from '../../engine/content.js';
import { caesarDecode } from '../../engine/caesar.js';
import { formatDateLong } from '../../engine/text.js';
import { playSound } from '../../audio/sound.js';
import { clear, el, mobileBack } from '../dom.js';
import { icon } from '../icons.js';

export function renderNotes(body) {
  const notes = [...content.notes].sort((a, b) => b.date.localeCompare(a.date));
  let current = notes[0];

  const list = el('aside', { class: 'app-sidebar notes__list' });
  const view = el('article', { class: 'notes__view' });
  const solver = buildSolver();
  const toggleSolver = el('button', { class: 'btn btn--small notes__solver-toggle', onclick: () => setSolverOpen(!solver.isOpen()) }, [
    el('span', { html: icon('key') }), 'Çözücü',
  ]);

  // Telefonda .show-detail sınıfı not listesini gizleyip seçili notu gösterir.
  const root = el('div', { class: 'app notes' }, [
    list,
    el('div', { class: 'notes__main' }, [
      el('div', { class: 'notes__toolbar' }, [
        mobileBack(() => root.classList.remove('show-detail'), 'Notlar'),
        el('span', { class: 'notes__count' }, `${notes.length} not`),
        toggleSolver,
      ]),
      view,
      solver.element,
    ]),
  ]);
  body.append(root);

  renderList();
  renderNote();

  function renderList() {
    clear(list);
    for (const note of notes) {
      list.append(el('button', {
        class: `notes__item ${note === current ? 'is-active' : ''}`,
        onclick: () => { playSound('click'); current = note; root.classList.add('show-detail'); renderList(); renderNote(); },
      }, [
        el('strong', {}, note.title),
        el('small', {}, `${formatDateLong(note.date)} · ${note.body.split('\n')[0].slice(0, 32)}`),
      ]));
    }
  }

  function renderNote() {
    clear(view);
    view.append(
      el('small', { class: 'notes__date' }, formatDateLong(current.date)),
      el('h2', { class: 'notes__title' }, current.title),
      el('div', { class: `notes__body ${current.cipherText ? 'notes__body--cipher' : ''}` }, current.body),
    );
    if (current.cipherText) {
      view.append(el('button', {
        class: 'btn btn--small btn--accent',
        onclick: () => { solver.setInput(current.cipherText); setSolverOpen(true); },
      }, 'Çözücüye aktar ↓'));
    }
    gsap.from(view.children, { opacity: 0, y: 6, duration: 0.25, stagger: 0.04 });
  }

  function setSolverOpen(open) {
    playSound('click');
    solver.setOpen(open);
    toggleSolver.classList.toggle('is-active', open);
  }
}

/** Sezar çözücü paneli. */
function buildSolver() {
  let shift = 0;
  let open = false;

  const input = el('textarea', { class: 'solver__input', rows: 2, placeholder: 'Şifreli metni buraya yaz ya da bir notu aktar...', spellcheck: 'false' });
  const shiftValue = el('output', { class: 'solver__shift-value' }, '0');
  const output = el('div', { class: 'solver__output' }, '—');
  // "Tüm kaydırmaları göster": 25 olasılığı alt alta listeler; okunabilir olanı oyuncu seçer.
  const allList = el('ol', { class: 'solver__all', hidden: true });
  const allButton = el('button', { class: 'btn btn--small', onclick: () => { playSound('click'); allList.hidden = !allList.hidden; update(); } }, 'Tüm kaydırmaları göster');

  const changeShift = (delta) => {
    shift = (shift + delta + 26) % 26; // 0..25 arasında döner
    playSound('key');
    update();
  };

  function update() {
    shiftValue.textContent = shift;
    output.textContent = input.value ? caesarDecode(input.value, shift) : '—';
    if (!allList.hidden) {
      allList.replaceChildren(...Array.from({ length: 25 }, (_, i) =>
        el('li', { onclick: () => { shift = i + 1; update(); } }, [el('b', {}, i + 1), ` ${caesarDecode(input.value || '—', i + 1)}`])));
    }
  }

  input.addEventListener('input', update);

  const element = el('section', { class: 'solver' }, [
    el('header', { class: 'solver__head' }, [
      el('strong', {}, 'Çözücü'),
      el('small', {}, 'Her harfi alfabede seçtiğin sayı kadar geri kaydırır (İngilizce alfabe).'),
    ]),
    input,
    el('div', { class: 'solver__controls' }, [
      el('span', {}, 'Kaydırma'),
      el('button', { class: 'solver__step', onclick: () => changeShift(-1), 'aria-label': 'Azalt' }, '−'),
      shiftValue,
      el('button', { class: 'solver__step', onclick: () => changeShift(1), 'aria-label': 'Artır' }, '+'),
      allButton,
    ]),
    el('div', { class: 'solver__result' }, [el('span', {}, 'Sonuç'), output]),
    allList,
  ]);

  return {
    element,
    isOpen: () => open,
    setOpen(value) {
      open = value;
      element.classList.toggle('is-open', open);
      if (open) setTimeout(() => input.focus(), 50);
    },
    setInput(text) {
      input.value = text;
      update();
      gsap.fromTo(input, { backgroundColor: 'rgba(143,168,255,.25)' }, { backgroundColor: 'rgba(0,0,0,.25)', duration: 0.6 });
    },
  };
}
