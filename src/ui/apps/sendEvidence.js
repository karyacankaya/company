/**
 * sendEvidence.js — "kanit_tam.zip — Gönder" penceresi (4. Perde'nin kararı).
 * ------------------------------------------------------------------
 * Alıcılar endings.json'dan gelir. Oyuncu bir ya da birden fazla alıcı
 * seçip gönderir ya da kanıtları siler. Hangi sonun geleceğine
 * engine/endings.js karar verir.
 * ------------------------------------------------------------------
 */
import { gsap } from 'gsap';
import { content } from '../../engine/content.js';
import { chooseEnding } from '../../engine/endings.js';
import { playSound } from '../../audio/sound.js';
import { el, wait } from '../dom.js';
import { openWindow, getWindow, focusWindow } from '../windowManager.js';

export const SEND_WINDOW_ID = 'send-evidence';

export function openSendWindow() {
  if (getWindow(SEND_WINDOW_ID)) {
    focusWindow(SEND_WINDOW_ID);
    return;
  }
  const cfg = content.endings.window;
  const win = openWindow({ id: SEND_WINDOW_ID, title: cfg.title, iconName: 'mail', width: 520, height: 470, className: 'window--send' });

  const selected = new Set();
  const status = el('p', { class: 'send__status' });

  const options = content.endings.recipients.map((r) => {
    const box = el('input', { type: 'checkbox', value: r.id });
    box.addEventListener('change', () => {
      playSound('key');
      box.checked ? selected.add(r.id) : selected.delete(r.id);
      row.classList.toggle('is-checked', box.checked);
      row.classList.toggle('is-danger', r.id === 'company' && box.checked);
      status.textContent = '';
    });
    const row = el('label', { class: 'send__option' }, [
      box,
      el('span', { class: 'send__check' }),
      el('div', {}, [el('strong', {}, r.name), el('small', {}, `${r.detail} · ${r.address}`)]),
    ]);
    return row;
  });

  const sendButton = el('button', { class: 'btn btn--primary', onclick: onSend }, cfg.send);
  const deleteButton = el('button', { class: 'btn btn--danger btn--small', onclick: onDelete }, cfg.delete);
  const body = el('div', { class: 'app send' }, [
    el('div', { class: 'send__file' }, [el('strong', {}, 'kanit_tam.zip'), el('small', {}, '3 parça · 9,7 MB')]),
    el('p', { class: 'send__intro' }, cfg.intro),
    el('div', { class: 'send__options' }, options),
    status,
    el('div', { class: 'send__actions' }, [deleteButton, sendButton]),
  ]);
  win.body.replaceChildren(body);

  async function onSend() {
    if (!selected.size) {
      status.textContent = cfg.nothingSelected;
      playSound('error');
      return;
    }
    if (!confirm(cfg.confirmSend)) return;
    await sendAnimation();
    chooseEnding({ recipients: [...selected], deleted: false });
  }

  async function onDelete() {
    if (!confirm(cfg.confirmDelete)) return;
    playSound('error');
    chooseEnding({ recipients: [], deleted: true });
  }

  /** Gönderim çubuğu: kısa ama gerilimli. */
  async function sendAnimation() {
    sendButton.disabled = true;
    deleteButton.disabled = true;
    const bar = el('div', { class: 'progress__bar progress__bar--ok' });
    body.replaceChildren(el('div', { class: 'send__progress' }, [el('p', {}, cfg.sending), el('div', { class: 'progress' }, bar)]));
    playSound('click');
    await gsap.to(bar, { width: '100%', duration: 1.6, ease: 'power1.inOut' });
    playSound('unlock');
    await wait(400);
  }
}
