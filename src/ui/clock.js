/**
 * clock.js — Oyun içi saat.
 * Saat ve dakika gerçek zamandan gelir; tarih ise hikâyenin tarihidir
 * (story.json > gameDate), böylece hikâye her zaman aynı günde geçer.
 */
import { content } from '../engine/content.js';

export function startClock(timeEl, dateEl, { short = false } = {}) {
  const gameDate = new Date(`${content.story.gameDate}T12:00:00`);
  const dateText = gameDate.toLocaleDateString('tr-TR', short
    ? { day: 'numeric', month: 'short', year: 'numeric' }
    : { weekday: 'long', day: 'numeric', month: 'long' });

  const tick = () => {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
    if (dateEl) dateEl.textContent = dateText;
  };
  tick();
  const timer = setInterval(tick, 1000);
  return () => clearInterval(timer); // durdurma fonksiyonu
}
