/**
 * puzzles.js — Şifre kontrolü ve ipucu sistemi.
 * ------------------------------------------------------------------
 * Kilitlerin tanımları src/data/puzzles.json'dadır. Bu dosya sadece
 * "bu cevap doğru mu?" ve "şu an hangi ipucu görünmeli?" sorularını
 * cevaplar. Ekranda nasıl gösterileceği ui/passwordForm.js'in işidir.
 *
 * Zincirli kilit (type: "chain"): birden fazla adımdan oluşur, ör.
 * E-posta = önce parola, sonra güvenlik kartı. Zincirin kendisi, bütün
 * adımları açılınca otomatik olarak "açık" sayılır.
 * ------------------------------------------------------------------
 */
import { content } from './content.js';
import { normalizeAnswer } from './text.js';
import { bus } from './eventBus.js';
import { addAttempt, getAttempts, isEasy, isUnlocked, markUnlocked, setAttempts } from './state.js';

/**
 * Kilidin tanımı. Kolay zorlukta, kilidin "easy" bölümündeki alanlar
 * (kilit ekranı metni, ipuçları...) normal alanların yerine geçer.
 */
export function getLock(lockId) {
  const lock = content.locks[lockId];
  if (!lock) throw new Error(`Bilinmeyen kilit: ${lockId}`);
  return isEasy() && lock.easy ? { ...lock, ...lock.easy } : lock;
}

/** Bir kilidin adımları: zincirse adım listesi, değilse sadece kendisi. */
export function getLockSteps(lockId) {
  const lock = getLock(lockId);
  return lock.type === 'chain' ? lock.steps : [lockId];
}

/** Henüz açılmamış adımlar (sırasıyla). */
export function getRemainingSteps(lockId) {
  return getLockSteps(lockId).filter((stepId) => !isUnlocked(stepId));
}

/** Bir adım açılınca, bütün adımları tamamlanan zincirleri de aç. */
function completeChains(stepId) {
  for (const [chainId, lock] of Object.entries(content.locks)) {
    if (lock.type !== 'chain' || !lock.steps.includes(stepId) || isUnlocked(chainId)) continue;
    if (lock.steps.every((id) => isUnlocked(id))) {
      markUnlocked(chainId);
      bus.emit('lock:unlocked', { lockId: chainId });
    }
  }
}

/**
 * Yanlış deneme sayısına göre gösterilecek ipucunu bulur.
 * Birden fazla ipucu açılmışsa en sonuncusu (en yardımcı olanı) döner.
 */
export function getActiveHint(lockId) {
  const attempts = getAttempts(lockId);
  const unlockedHints = getLock(lockId).hints.filter((hint) => attempts >= hint.after);
  return unlockedHints.at(-1)?.text ?? null;
}

/** Henüz açılmamış bir sonraki ipucu var mı? */
export function hasMoreHints(lockId) {
  return getLock(lockId).hints.some((hint) => hint.after > getAttempts(lockId));
}

/**
 * "İpucu al": yanlış deneme yapmadan bir sonraki ipucunu açar.
 * Bunu, deneme sayısını o ipucunun eşiğine çıkararak yapar; böylece
 * ipucu sistemi tek bir kurala (deneme sayısı) bağlı kalır.
 */
export function revealNextHint(lockId) {
  const next = getLock(lockId).hints.find((hint) => hint.after > getAttempts(lockId));
  if (next) setAttempts(lockId, next.after);
  return getActiveHint(lockId);
}

/**
 * Oyuncunun cevabını kontrol eder.
 * Döner: { correct, attempts, hint, isNewHint }
 *   isNewHint → bu denemeyle YENİ bir ipucu açıldıysa true (animasyon için)
 */
export function checkAnswer(lockId, input) {
  const lock = getLock(lockId);
  const guess = normalizeAnswer(input);
  const correct = lock.answers.some((answer) => normalizeAnswer(answer) === guess);

  if (correct) {
    markUnlocked(lockId);
    bus.emit('lock:unlocked', { lockId });
    completeChains(lockId);
    return { correct: true, attempts: getAttempts(lockId), hint: null, isNewHint: false };
  }

  const hintBefore = getActiveHint(lockId);
  const attempts = addAttempt(lockId);
  const hint = getActiveHint(lockId);
  bus.emit('lock:failed', { lockId, attempts });

  return { correct: false, attempts, hint, isNewHint: hint !== hintBefore };
}

export { isUnlocked };
