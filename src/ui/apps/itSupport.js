/**
 * itSupport.js — "BT Destek" canlı sohbet penceresi (arayüz).
 * ------------------------------------------------------------------
 * Ne zaman ne söyleneceğine engine/itScript.js karar verir; bu dosya:
 *   - geçmiş sohbeti çizer,
 *   - yeni mesajları "yazıyor..." animasyonuyla oynatır,
 *   - cevap seçeneklerini düğme olarak gösterir,
 *   - pencere kapalıyken yeni mesaj gelirse pencereyi KENDİLİĞİNDEN
 *     yeniden açar ve titretir (baskı hissi).
 *
 * Animasyonlar üst üste binmesin diye her şey tek bir sıraya (queue)
 * eklenir ve sırayla oynar.
 * ------------------------------------------------------------------
 */
import { gsap } from 'gsap';
import { content } from '../../engine/content.js';
import { bus } from '../../engine/eventBus.js';
import { buildTranscript, choose, entryToItems, getPendingChoices } from '../../engine/itScript.js';
import { getAct, getItLog, hasFlag } from '../../engine/state.js';
import { isActStarted } from '../../engine/game.js';
import { playSound } from '../../audio/sound.js';
import { clear, el, replayClass, wait } from '../dom.js';
import { getWindow, openWindow, focusWindow } from '../windowManager.js';
import { notify } from '../notifications.js';

export const IT_WINDOW_ID = 'it-support';

// ---- Sıra (queue) ------------------------------------------------
let queue = Promise.resolve();
function enqueue(task) {
  queue = queue.then(task).catch((err) => console.error('[itSupport]', err));
  return queue;
}
/** Sıradaki bütün animasyonlar bitince tamamlanan söz (promise). */
export const whenItIdle = () => queue;

// ---- Özel eylemler (ör. "kodu gönder" seçilince) ------------------
const actions = {};
/** Masaüstü, seçeneklerin tetikleyeceği eylemleri buraya kaydeder. */
export function registerItAction(name, fn) {
  actions[name] = fn;
}

// ---- Pencere -----------------------------------------------------
let view = null; // { win, scroller, compose, status }

/**
 * Pencereyi açar (zaten açıksa öne getirir).
 * @param {object} o
 *   instant:   true → geçmiş anında çizilir; false → giriş mesajları oynar (1. Perde sonu)
 *   uptoIndex: geçmişin sadece bu sıraya kadarki kısmını çiz (yeni gelen kısmı animasyonla oynatmak için)
 */
export async function openItSupport({ instant = false, uptoIndex = Infinity } = {}) {
  if (view && getWindow(IT_WINDOW_ID)) {
    focusWindow(IT_WINDOW_ID);
    return;
  }
  const it = content.support;
  const win = openWindow({
    id: IT_WINDOW_ID, title: it.windowTitle, iconName: 'support', width: 440, height: 560, className: 'window--it',
    onClose: () => { view = null; },
  });

  const scroller = el('div', { class: 'it__scroll' });
  const compose = el('footer', { class: 'it__compose' });
  const status = el('small', {});
  clear(win.body);
  win.body.append(el('div', { class: 'app it' }, [
    el('header', { class: 'it__head' }, [
      el('span', { class: 'it__avatar' }, 'BT'),
      el('div', {}, [el('strong', {}, it.agentName), status]),
    ]),
    scroller,
    compose,
  ]));
  view = { win, scroller, compose, status };

  if (instant) {
    buildTranscript(uptoIndex).forEach((item) => scroller.append(renderBubble(item)));
    scroller.scrollTop = scroller.scrollHeight;
    renderCompose();
    return;
  }

  // 1. Perde sonu: giriş mesajları teker teker
  renderCompose();
  await playItems(it.intro.map((m) => ({ from: 'it', text: m.text, delay: m.delay })));
  renderCompose();
}

/** Masaüstü sahnesi açılınca çağrılır; olayları dinlemeye başlar. */
export function initItSupportUI() {
  const offs = [
    bus.on('it:beat', ({ logIndex }) => enqueue(() => playLogEntry(logIndex, { reopen: true }))),
    bus.on('it:choice', ({ choice, logIndex }) => enqueue(async () => {
      await ensureWindow(logIndex);
      clear(view.compose);
      // Seçimin dökümü: önce oyuncunun balonu (sessiz seçimde yok), sonra cevaplar.
      const reply = entryToItems(entryAt(logIndex));
      const mine = reply[0]?.from === 'me' ? reply.shift() : null;
      if (mine) {
        const bubble = renderBubble(mine);
        view.scroller.append(bubble);
        gsap.from(bubble, { opacity: 0, y: 8, duration: 0.2 });
        scrollDown();
        playSound('key');
      }
      if (choice.action && actions[choice.action]) {
        await wait(400);
        await actions[choice.action]();
      }
      await playItems(reply);
      renderCompose();
    })),
    bus.on('it:system', ({ logIndex }) => enqueue(() => playLogEntry(logIndex, { reopen: false }))),
  ];
  return () => {
    offs.forEach((off) => off());
    view = null;
    queue = Promise.resolve();
  };
}

// ---- Yardımcılar -------------------------------------------------
const entryAt = (index) => getItLog()[index];

/** Pencere kapalıysa, geçmişi index'e KADAR çizerek yeniden açar. */
async function ensureWindow(logIndex) {
  if (view && getWindow(IT_WINDOW_ID)) {
    focusWindow(IT_WINDOW_ID);
    return false;
  }
  await openItSupport({ instant: true, uptoIndex: logIndex });
  return true;
}

async function playLogEntry(logIndex, { reopen }) {
  const reopened = await ensureWindow(logIndex);
  if (reopened && reopen) {
    const n = content.support.reopenNotification;
    notify({ title: n.title, text: n.text, iconName: 'support', sound: null });
  }
  // Baskı: pencere her yeni mesajda hafifçe titrer.
  replayClass(view.win.el, 'is-nudged');
  playSound('notify');
  clear(view.compose);
  await playItems(entryToItems(entryAt(logIndex)));
  renderCompose();
}

/** Balonları "yazıyor..." animasyonuyla teker teker ekler. */
async function playItems(items) {
  for (const item of items) {
    if (!view) return; // pencere kapatıldıysa dur (kayıt zaten tutuldu)
    if (item.from === 'it') {
      const typing = el('div', { class: 'typing typing--it' }, [el('span', { class: 'typing__dots' }, [el('i'), el('i'), el('i')])]);
      view.scroller.append(typing);
      scrollDown();
      await wait(item.delay ?? 900);
      typing.remove();
      if (!view) return;
    }
    const bubble = renderBubble(item);
    view.scroller.append(bubble);
    if (item.from === 'it') playSound('message');
    gsap.from(bubble, { opacity: 0, y: 8, duration: 0.2 });
    scrollDown();
  }
}

function renderBubble(item) {
  if (item.from === 'system') return el('div', { class: 'msgs__day it__system' }, item.text);
  const mine = item.from === 'me';
  return el('div', { class: `bubble-row ${mine ? 'bubble-row--me' : ''}` },
    el('div', { class: `bubble ${mine ? 'bubble--me' : 'bubble--it'} ${item.blocked ? 'bubble--blocked' : ''}` }, [
      el('span', { class: 'bubble__text' }, item.text),
      item.blocked ? el('span', { class: 'bubble__time' }, `⚠ ${content.support.blockedLabel}`) : null,
    ]));
}

/** Alt kısım: bekleyen seçenekler varsa düğmeler, yoksa kapalı giriş alanı. */
function renderCompose() {
  if (!view) return;
  const it = content.support;
  const act = getAct();
  // 1. Perde sırasında ve 2. Perde başlamadan önce karşı taraf kodu bekliyor.
  const waitingForCode = act === 1 || (act === 2 && !isActStarted(2));
  const online = waitingForCode || hasFlag('networkOnline');
  view.status.replaceChildren(el('i', { class: `it__online ${online ? '' : 'is-off'}` }), online ? it.agentStatus : it.agentStatusOffline);

  clear(view.compose);
  const pending = getPendingChoices();
  if (pending) {
    view.compose.classList.add('it__compose--choices');
    view.compose.append(...pending.choices.map((c) =>
      el('button', { class: 'it__choice', onclick: () => choose(pending.beat.id, c.id) }, c.text)));
    gsap.from(view.compose.children, { opacity: 0, y: 6, duration: 0.2, stagger: 0.06 });
    return;
  }
  view.compose.classList.remove('it__compose--choices');
  const placeholder = waitingForCode ? it.inputPlaceholder : online ? it.waitingPlaceholder : it.offlinePlaceholder;
  view.compose.append(
    el('input', { disabled: true, placeholder }),
    el('button', { class: 'btn btn--small', disabled: true }, 'Gönder'),
  );
}

function scrollDown() {
  if (view) view.scroller.scrollTop = view.scroller.scrollHeight;
}
