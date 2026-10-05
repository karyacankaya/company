/**
 * cliffhanger.js — Perde kapanış sahneleri + Zeynep'in "koruma" betiği.
 * ------------------------------------------------------------------
 * 1. Perde (~6-7 sn):
 *   girdi engellenir → glitch → sahte imleç Mesajlar'a çift tıklar,
 *   "uzak oturum" penceresi bozulup kapanır → uzak erişim kodu belirir
 *   → BT Destek ilk kez açılır → perde sonu kartı
 *
 * 2. Perde:
 *   BT Destek "son uyarı" → kırmızı UZAKTAN SİLME geri sayımı →
 *   geri sayım bitmeden Zeynep'in betiği kendiliğinden açılır,
 *   bağlantıyı keser → geri sayım donar → perde sonu kartı
 *
 * 3. Perde:
 *   konum çözülür → glitch → ağ "yedek profil" üzerinden yeniden bağlanır →
 *   terminale uyarılar düşer → BT Destek konumu okur → perde sonu kartı
 *
 * 4. Perde:
 *   kanıtlar gönderildi (ya da silindi) → ekran kararır → son ekranı
 *
 * Oyun mantığına ('act:ended') sadece en sonda haber verilir.
 * ------------------------------------------------------------------
 */
import { gsap } from 'gsap';
import { content } from '../engine/content.js';
import { bus } from '../engine/eventBus.js';
import { resetGame, setFlag } from '../engine/state.js';
import { getActDef, startAct } from '../engine/game.js';
import { addSystemLine, deliverBeat } from '../engine/itScript.js';
import { playSound } from '../audio/sound.js';
import { el, wait } from './dom.js';
import { closeWindow, openWindow } from './windowManager.js';
import { notify } from './notifications.js';
import { playGlitch } from './effects/glitch.js';
import { createFakeCursor } from './effects/fakeCursor.js';
import { openItSupport, whenItIdle } from './apps/itSupport.js';
import { goTo } from './sceneRouter.js';

let running = false;

/** Perde numarasına göre doğru kapanışı çalıştırır. */
export function runActEnding(act, ctx) {
  if (running) return;
  const endings = { 1: runActOneEnding, 2: runActTwoEnding, 3: runActThreeEnding, 4: runActFourEnding };
  if (!endings[act]) return;
  running = true;
  endings[act](ctx).finally(() => { running = false; });
}

// ==================================================================
// 1. PERDE
// ==================================================================
async function runActOneEnding({ desktop, iconNodes, setRemoteCode }) {
  const it = content.support;

  // 1. Girdiyi engelle (tıklamaları yutan görünmez katman).
  const blocker = el('div', { class: 'input-blocker' });
  desktop.append(blocker);

  // 2. Glitch
  await playGlitch(desktop, 850);

  // 3. Sahte imleç
  const cursor = createFakeCursor();
  await wait(250);
  const target = iconNodes.get('messages') ?? iconNodes.values().next().value;
  await cursor.moveToElement(target, 0.9);
  target.classList.add('is-selected');
  await cursor.click(2);

  const hijack = openWindow({ id: 'hijack', title: it.hijackWindowTitle, iconName: 'remote', width: 360, height: 150 });
  const bar = el('div', { class: 'progress__bar' });
  hijack.body.replaceChildren(el('div', { class: 'hijack' }, [el('p', {}, it.hijackWindowText), el('div', { class: 'progress' }, bar)]));
  await cursor.moveToElement(hijack.el, 0.6);
  await gsap.to(bar, { width: '68%', duration: 0.9, ease: 'power1.in' });
  await playGlitch(desktop, 380);
  closeWindow('hijack', { silent: true });
  target.classList.remove('is-selected');

  // 4. Uzak erişim kodu görev çubuğunda
  setRemoteCode(it.remoteCode);
  notify({ title: it.remoteCodeNotification.title, text: it.remoteCodeNotification.text, iconName: 'remote', duration: 0 });

  // 5. BT Destek penceresi; imleç ona gidip kaybolur
  const chatDone = openItSupport();
  await wait(250);
  await cursor.moveTo(window.innerWidth / 2 + 40, window.innerHeight / 2 + 60, 0.5);
  cursor.remove();
  blocker.remove();
  await chatDone;

  // 6. Perde sonu kartı
  await wait(900);
  bus.emit('act:ended', { act: 1 });
  showEndCard(desktop, 1);
}

// ==================================================================
// 2. PERDE
// ==================================================================
async function runActTwoEnding({ desktop, setNetwork }) {
  const cfg = content.support.act2Ending;

  // 1. BT Destek son uyarısı (pencere kapalıysa kendiliğinden açılır)
  deliverBeat('a2-final', { force: true });
  await whenItIdle();

  const blocker = el('div', { class: 'input-blocker' });
  desktop.append(blocker);

  // 2. Geri sayım
  const timeEl = el('strong', { class: 'countdown__time' });
  const banner = el('div', { class: 'countdown' }, [el('span', { class: 'countdown__label' }, cfg.countdownLabel), timeEl]);
  desktop.append(banner);
  gsap.from(banner, { y: -80, duration: 0.35, ease: 'power3.out' });

  for (let s = cfg.countdownFrom; s >= cfg.interruptAt; s--) {
    timeEl.textContent = `00:${String(s).padStart(2, '0')}`;
    playSound('key');
    gsap.fromTo(timeEl, { scale: 1.15 }, { scale: 1, duration: 0.3 });
    await wait(1000);
  }

  // 3. Zeynep'in betiği araya girer
  await playGlitch(desktop, 450);
  const term = openWindow({ id: 'zeynep-koruma', title: cfg.terminalTitle, iconName: 'file', width: 520, height: 300, className: 'window--terminal' });
  const pre = el('pre', { class: 'terminal-text' });
  term.body.replaceChildren(pre);
  for (const line of cfg.terminalLines) {
    pre.textContent += `${line}\n`;
    playSound('key');
    await wait(line ? 260 : 120);
  }

  // 4. Bağlantı kesildi
  setFlag('networkOnline', false);
  setNetwork(false);
  banner.classList.add('is-stopped');
  timeEl.textContent = cfg.disconnectedLabel;
  playSound('unlock');
  addSystemLine(cfg.systemLine);
  await whenItIdle();
  await wait(1800);
  gsap.to(banner, { opacity: 0, duration: 0.4, onComplete: () => banner.remove() });
  blocker.remove();

  // 5. Perde sonu kartı
  await wait(600);
  bus.emit('act:ended', { act: 2 });
  showEndCard(desktop, 2);
}

// ==================================================================
// 3. PERDE
// ==================================================================
async function runActThreeEnding({ desktop, setNetwork }) {
  const cfg = content.support.act3Ending;
  const blocker = el('div', { class: 'input-blocker' });
  desktop.append(blocker);

  // 1. Glitch + ağ geri geliyor (yedek profil)
  await playGlitch(desktop, 700);
  setFlag('networkOnline', true);
  setNetwork(true);
  notify({ title: cfg.networkNotification.title, text: cfg.networkNotification.text, iconName: cfg.networkNotification.icon });

  // 2. Açık terminal varsa uyarılar oraya da düşsün
  const termOutput = document.querySelector('[data-window-id="app:terminal"] .term__output');
  if (termOutput) {
    for (const line of cfg.terminalLines) {
      termOutput.append(el('div', { class: 'term__row term__row--error' }, line || '\u00a0'));
      termOutput.parentElement.scrollTop = termOutput.parentElement.scrollHeight;
      playSound('error');
      await wait(450);
    }
  }
  blocker.remove();

  // 3. BT Destek konumu okur
  await wait(500);
  deliverBeat('a3-final', { force: true });
  await whenItIdle();

  // 4. Perde sonu kartı
  await wait(1500);
  bus.emit('act:ended', { act: 3 });
  showEndCard(desktop, 3);
}

// ==================================================================
// 4. PERDE — karar verildi, ekran kararır, son sahnesi gelir
// ==================================================================
async function runActFourEnding({ desktop }) {
  const blackout = el('div', { class: 'blackout' });
  desktop.append(blackout);
  await gsap.fromTo(blackout, { opacity: 0 }, { opacity: 1, duration: 1.4, ease: 'power2.in' });
  await wait(400);
  bus.emit('act:ended', { act: 4 });
  goTo('ending');
}

// ==================================================================
// Zeynep'in koruma betiği: oyuncu BT Destek'e kodu vermeye kalkarsa
// (support.json > choices > action: "blockRemoteCode")
// ==================================================================
export async function showSafeguard(desktop) {
  const cfg = content.support.safeguard;
  await playGlitch(desktop, 350);
  const win = openWindow({ id: 'safeguard', title: cfg.windowTitle, iconName: 'lock', width: 420, height: 230, className: 'window--terminal' });
  const pre = el('pre', { class: 'terminal-text' });
  win.body.replaceChildren(pre);
  for (const line of cfg.lines) {
    pre.textContent += `${line}\n`;
    playSound('key');
    await wait(line ? 280 : 120);
  }
  playSound('error');
  await wait(800);
}

// ==================================================================
// Perde sonu kartı
// ==================================================================
function showEndCard(desktop, actId) {
  const card = getActDef(actId).endCard;
  const close = () => gsap.to(overlay, { opacity: 0, duration: 0.3, onComplete: () => overlay.remove() });

  const primary = card.nextAct
    ? el('button', { class: 'btn btn--primary', onclick: () => { close(); startAct(card.nextAct); } }, card.continue)
    : el('button', { class: 'btn btn--primary', onclick: close }, card.backToDesktop);

  const overlay = el('div', { class: 'endcard' }, [
    el('div', { class: 'endcard__inner' }, [
      el('h2', {}, card.heading),
      el('p', { class: 'endcard__text' }, card.text),
      el('p', { class: 'endcard__soon' }, card.comingSoon),
      el('div', { class: 'endcard__buttons' }, [
        primary,
        el('button', { class: 'btn', onclick: () => { if (confirm('Tüm ilerleme silinecek. Emin misin?')) { resetGame(); goTo('title'); } } }, card.restart),
      ]),
    ]),
  ]);
  desktop.append(overlay);
  gsap.timeline()
    .from(overlay, { opacity: 0, duration: 0.5 })
    .from(overlay.querySelectorAll('.endcard__inner > *'), { opacity: 0, y: 12, stagger: 0.18, duration: 0.4 });
}
