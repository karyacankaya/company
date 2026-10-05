/**
 * state.js — Oyun durumu ve localStorage kaydı.
 * ------------------------------------------------------------------
 * Oyunun "hafızası" tek bir nesnede tutulur. Her değişiklikten sonra
 * localStorage'a JSON olarak yazılır; sayfa yenilense bile oyuncu
 * kaldığı yerden devam eder.
 *
 * Durumu değiştirmenin TEK yolu bu dosyadaki fonksiyonlardır. Böylece
 * "kaydetmeyi unuttum" gibi hatalar olmaz.
 * ------------------------------------------------------------------
 */
import { bus } from './eventBus.js';

const SAVE_KEY = 'company:kayit';
const SAVE_VERSION = 1; // Kayıt yapısı değişirse artır; eski kayıt sıfırlanır.

/** Yeni bir oyunun başlangıç durumu. */
function createDefaultState() {
  return {
    version: SAVE_VERSION,
    act: 1,                 // hangi perdedeyiz
    started: false,         // oyuncu en az bir kez "Yeni oyun"a bastı mı
    unlocked: {},           // { login: true, notes: true, ... }
    attempts: {},           // { notes: 2, ... } yanlış deneme sayıları
    seenConversations: [],  // animasyonu oynatılmış sohbetler
    flags: {},              // serbest bayraklar: { archiveViewed: true, ... }
    itLog: [],              // BT Destek sohbet geçmişi (bkz. engine/itScript.js)
    settings: { muted: false, difficulty: 'normal' }, // difficulty: 'easy' | 'normal'
  };
}

/** localStorage'dan kaydı okur; yoksa ya da bozuksa yeni durum döner. */
function load() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return createDefaultState();
    const saved = JSON.parse(raw);
    if (saved.version !== SAVE_VERSION) return createDefaultState();
    // Yeni eklenen alanlar eski kayıtta yoksa varsayılanla tamamla.
    return { ...createDefaultState(), ...saved };
  } catch {
    return createDefaultState();
  }
}

let state = load();

function save() {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch {
    // Gizli sekme vb. durumlarda localStorage kapalı olabilir; oyun yine çalışır.
  }
  // Durumu izleyen arayüz parçaları (ör. "Sıradaki adım" kartı) güncellensin.
  bus.emit('state:changed');
}

/** Durumun salt-okunur kopyası (doğrudan değiştirmemek için). */
export function getState() {
  return structuredClone(state);
}

export function hasSave() {
  return state.started;
}

/** Yeni oyun: ses ayarı korunur, zorluk başlık ekranında seçilen olur. */
export function startNewGame({ difficulty = getDifficulty() } = {}) {
  const muted = state.settings.muted;
  state = createDefaultState();
  state.started = true;
  state.settings = { muted, difficulty };
  save();
}

export function resetGame() {
  state = createDefaultState();
  save();
  bus.emit('state:reset');
}

// ---- Kilitler ----------------------------------------------------
export const isUnlocked = (lockId) => Boolean(state.unlocked[lockId]);

export function markUnlocked(lockId) {
  state.unlocked[lockId] = true;
  save();
}

export const getAttempts = (lockId) => state.attempts[lockId] ?? 0;

export function addAttempt(lockId) {
  state.attempts[lockId] = getAttempts(lockId) + 1;
  save();
  return state.attempts[lockId];
}

/** "İpucu al" düğmesi için: deneme sayısını doğrudan ayarlar. */
export function setAttempts(lockId, count) {
  state.attempts[lockId] = count;
  save();
}

// ---- Bayraklar ---------------------------------------------------
export const hasFlag = (name) => Boolean(state.flags[name]);

export function setFlag(name, value = true) {
  state.flags[name] = value;
  save();
}

// ---- Mesajlar ----------------------------------------------------
export const hasSeenConversation = (id) => state.seenConversations.includes(id);

export function markConversationSeen(id) {
  if (!hasSeenConversation(id)) {
    state.seenConversations.push(id);
    save();
  }
}

// ---- BT Destek sohbet kaydı -------------------------------------
export const getItLog = () => structuredClone(state.itLog);

export function appendItLog(entry) {
  state.itLog.push(entry);
  save();
  return state.itLog.length - 1; // eklenen kaydın sırası
}

// ---- Perde / ayarlar ---------------------------------------------
export const getAct = () => state.act;

export function setAct(act) {
  state.act = act;
  save();
}

export const isMuted = () => state.settings.muted;

// ---- Zorluk ------------------------------------------------------
/** Eski kayıtlarda zorluk alanı yoksa 'normal' sayılır. */
export const getDifficulty = () => state.settings.difficulty ?? 'normal';
export const isEasy = () => getDifficulty() === 'easy';

export function setDifficulty(difficulty) {
  state.settings.difficulty = difficulty;
  save();
}

export function setMuted(muted) {
  state.settings.muted = muted;
  save();
}
