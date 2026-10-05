/**
 * cargoNote.js — Kargodan çıkan not ve anılar (masaüstünde tekrar okumak için).
 * 2. Perde'den itibaren kutunun altındaki güvenlik kartı da bulunabilir
 * (story.json > parcelCard). Kart, E-posta'nın 2. adımının anahtarı.
 */
import { gsap } from 'gsap';
import { content } from '../../engine/content.js';
import { getAct, hasFlag, setFlag } from '../../engine/state.js';
import { playSound } from '../../audio/sound.js';
import { el } from '../dom.js';
import { renderMemories, renderNoteCard } from '../storyBits.js';

export function renderCargoNote(body) {
  const app = el('div', { class: 'app cargo-note' }, [renderNoteCard(), renderMemories()]);
  body.append(app);

  const pc = content.story.parcelCard;
  if (getAct() < pc.fromAct) return;

  const section = el('section', { class: 'parcel-secret' });
  app.prepend(section);

  if (hasFlag('cardFound')) {
    section.append(el('p', {}, pc.found), renderSecurityCard(pc.card));
    return;
  }

  section.append(
    el('p', { class: 'parcel-secret__prompt' }, pc.prompt),
    el('button', {
      class: 'btn btn--accent btn--small',
      onclick: () => {
        playSound('unlock');
        setFlag('cardFound');
        section.replaceChildren(el('p', {}, pc.found), renderSecurityCard(pc.card));
        gsap.from(section.children, { opacity: 0, y: 10, rotate: -2, duration: 0.4, stagger: 0.1 });
      },
    }, pc.button),
  );
}

/** Çevrilebilen güvenlik kartı: ön yüz rakam tablosu, arka yüz Zeynep'in notu. */
function renderSecurityCard(card) {
  const header = el('div', { class: 'sec-card__head' }, [el('strong', {}, card.brand), el('span', {}, card.title)]);
  const grid = el('table', { class: 'sec-card__grid' }, [
    el('thead', {}, el('tr', {}, [el('th'), ...card.columns.map((c) => el('th', {}, c))])),
    el('tbody', {}, card.rows.map((row, r) => el('tr', {}, [
      el('th', {}, r + 1),
      // null = yırtık hücre
      ...row.map((value) => el('td', { class: value === null ? 'is-torn' : '' }, value === null ? '' : value)),
    ]))),
  ]);

  const front = el('div', { class: 'sec-card__face sec-card__front' }, [header, grid, el('small', {}, card.number)]);
  const back = el('div', { class: 'sec-card__face sec-card__back' }, el('p', {}, card.backNote));
  const inner = el('div', { class: 'sec-card__inner' }, [front, back]);
  const cardEl = el('button', {
    class: 'sec-card',
    title: 'Çevirmek için tıkla',
    onclick: () => { playSound('click'); cardEl.classList.toggle('is-flipped'); },
  }, inner);
  return cardEl;
}
