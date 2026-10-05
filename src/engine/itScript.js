/**
 * itScript.js — "BT Destek" sohbetinin senaryo motoru.
 * ------------------------------------------------------------------
 * Senaryo src/data/support.json'dadır. Her "vuruş" (beat) bir olaya
 * bağlıdır ve o olay olunca BİR KEZ gelir:
 *
 *   { "id": "a2-browser", "act": 2,
 *     "trigger": { "event": "app:launched", "match": { "appId": "browser" } },
 *     "messages": [...], "choices": [...] }
 *
 * Gelen vuruşlar ve oyuncunun seçimleri state.itLog'a kaydedilir;
 * böylece sayfa yenilense de sohbet geçmişi aynen geri gelir ve
 * seçimler ileride (4. Perde'deki sonlar) okunabilir.
 *
 * Bu dosya ekrana bir şey çizmez; 'it:beat', 'it:choice', 'it:system'
 * olaylarını yayınlar. Çizim ui/apps/itSupport.js'te.
 * ------------------------------------------------------------------
 */
import { bus } from './eventBus.js';
import { content } from './content.js';
import { appendItLog, getAct, getItLog, isUnlocked } from './state.js';
import { isActRunning } from './game.js';

const beats = () => content.support.beats;
export const getBeat = (id) => beats().find((beat) => beat.id === id);

let timer = null;
let secondsInAct = 0;

export function initItScript() {
  for (const beat of beats()) {
    const { event, match } = beat.trigger;
    if (!event) continue;
    bus.on(event, (payload) => {
      if (matches(match, payload)) deliverBeat(beat.id);
    });
  }
  bus.on('act:started', restartTimer);
  bus.on('state:reset', stopItTimer);
}

/** { lockId: 'email' } gibi bir eşleşme koşulu olayın içeriğine uyuyor mu? */
function matches(match = {}, payload = {}) {
  return Object.entries(match).every(([key, value]) => payload[key] === value);
}

// ---- Zamanlı vuruşlar ("perde başladıktan 150 sn sonra") ----------
/** Masaüstü açıldığında (ya da perde başladığında) sayacı başlatır. */
export function restartTimer() {
  stopItTimer();
  secondsInAct = 0;
  timer = setInterval(() => {
    secondsInAct++;
    for (const beat of beats()) {
      const after = beat.trigger.afterSeconds;
      if (after && secondsInAct >= after) deliverBeat(beat.id);
    }
  }, 1000);
}

export function stopItTimer() {
  clearInterval(timer);
  timer = null;
}

// ---- Vuruş ve seçimler -------------------------------------------
export const isDelivered = (beatId) =>
  getItLog().some((entry) => entry.type === 'beat' && entry.id === beatId);

/**
 * Vuruşu koşullar uygunsa sohbete ekler.
 * force: true → koşullara bakmadan (perde sonu sahnesi için).
 */
export function deliverBeat(beatId, { force = false } = {}) {
  const beat = getBeat(beatId);
  if (!beat || isDelivered(beatId)) return false;
  if (!force) {
    if (!isActRunning(beat.act)) return false;
    if (beat.skipIfUnlocked && isUnlocked(beat.skipIfUnlocked)) return false;
  }
  const logIndex = appendItLog({ type: 'beat', id: beatId });
  bus.emit('it:beat', { beat, logIndex });
  return true;
}

/** Oyuncu bir cevap seçti. */
export function choose(beatId, choiceId) {
  const beat = getBeat(beatId);
  const choice = beat?.choices?.find((c) => c.id === choiceId);
  if (!choice) return;
  const logIndex = appendItLog({ type: 'choice', beatId, choiceId });
  bus.emit('it:choice', { beat, choice, logIndex });
}

/** Sohbete bir sistem satırı ekler (ör. "Bağlantı sonlandırıldı"). */
export function addSystemLine(text) {
  const logIndex = appendItLog({ type: 'system', text });
  bus.emit('it:system', { text, logIndex });
}

/** Oyuncu bir vuruşta hangi seçimi yaptı? (yoksa null) */
export function getChoice(beatId) {
  return getItLog().find((e) => e.type === 'choice' && e.beatId === beatId)?.choiceId ?? null;
}

/**
 * Şu an cevap bekleyen seçenekler. Sadece EN SON gelen vuruşun
 * seçenekleri geçerlidir; yeni bir vuruş gelince eskisi cevapsız kalır.
 */
export function getPendingChoices() {
  if (!isActRunning(getAct())) return null;
  const log = getItLog();
  const lastBeatEntry = [...log].reverse().find((e) => e.type === 'beat');
  if (!lastBeatEntry) return null;
  const beat = getBeat(lastBeatEntry.id);
  if (!beat?.choices || getChoice(beat.id)) return null;
  return { beat, choices: beat.choices };
}

/**
 * Sohbet dökümü: ekranda gösterilecek balonların listesi.
 * uptoIndex verilirse log'un sadece o sıraya KADARKİ kısmı (o hariç).
 *   [{ from: 'it' | 'me' | 'system', text, blocked? }]
 */
export function buildTranscript(uptoIndex = Infinity) {
  const items = content.support.intro.map((m) => ({ from: 'it', text: m.text }));
  getItLog().slice(0, uptoIndex).forEach((entry) => items.push(...entryToItems(entry)));
  return items;
}

/** Tek bir log kaydını balonlara çevirir. */
export function entryToItems(entry) {
  if (entry.type === 'beat') {
    return getBeat(entry.id).messages.map((m) => ({ from: 'it', text: m.text, delay: m.delay }));
  }
  if (entry.type === 'choice') {
    const choice = getBeat(entry.beatId).choices.find((c) => c.id === entry.choiceId);
    const mine = choice.silent ? [] : [{ from: 'me', text: choice.text, blocked: choice.blocked }];
    return [...mine, ...choice.reply.map((m) => ({ from: 'it', text: m.text, delay: m.delay }))];
  }
  return [{ from: 'system', text: entry.text }];
}
