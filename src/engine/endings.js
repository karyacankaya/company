/**
 * endings.js — Oyunun sonları (4. Perde).
 * ------------------------------------------------------------------
 * Oyuncu kanıtları bir ya da birden fazla alıcıya gönderir (ya da
 * siler). endings.json'daki kurallar sırayla denenir, tutan ilk kural
 * oyunun sonunu belirler. Önceki seçimler (BT Destek'e verilen
 * cevaplar, bayraklar) sonun altına "sonsöz" satırları ekler.
 *
 * Bulunan sonlar AYRI bir localStorage anahtarında tutulur; böylece
 * "Baştan başla" deseniz bile "Bulduğun sonlar: 2/5" kaybolmaz.
 * ------------------------------------------------------------------
 */
import { bus } from './eventBus.js';
import { content } from './content.js';
import { hasFlag, setAct, setFlag, getState } from './state.js';
import { getChoice } from './itScript.js';

const FOUND_KEY = 'company:bulunan-sonlar';

/** Bir kuralın koşulu, verilen seçimle tutuyor mu? */
function matches(when, { recipients, deleted }) {
  if (when.deleted) return deleted;
  if (deleted) return false;
  if (when.includes) return when.includes.every((id) => recipients.includes(id));
  if (when.only) return when.only.length === recipients.length && when.only.every((id) => recipients.includes(id));
  return false;
}

/** Seçime göre sonu bulur. */
export function resolveEnding(selection) {
  return content.endings.endings.find((ending) => matches(ending.when, selection)) ?? null;
}

export function getEnding(id) {
  return content.endings.endings.find((ending) => ending.id === id) ?? null;
}

/** Oyuncu kararını verdi: sonu kaydet ve perde sonunu tetikle. */
export function chooseEnding(selection) {
  const ending = resolveEnding(selection);
  if (!ending) return null;
  setFlag('endingId', ending.id);
  addFoundEnding(ending.id);
  bus.emit('evidence:sent', { endingId: ending.id, ...selection });
  return ending;
}

/** Sonun altına eklenecek, önceki seçimlere bağlı satırlar. */
export function getEpilogueLines() {
  return content.endings.epilogue
    .filter((line) => (line.flag ? hasFlag(line.flag) : getChoice(line.choice.beat) === line.choice.id))
    .map((line) => line.text);
}

export const getChosenEndingId = () => getState().flags.endingId ?? null;

// ---- Bulunan sonlar (kalıcı) -------------------------------------
export function getFoundEndings() {
  try {
    return JSON.parse(localStorage.getItem(FOUND_KEY)) ?? [];
  } catch {
    return [];
  }
}

function addFoundEnding(id) {
  const found = new Set(getFoundEndings()).add(id);
  try {
    localStorage.setItem(FOUND_KEY, JSON.stringify([...found]));
  } catch {
    // localStorage kapalıysa sayaç sadece bu oturumda geçerli olmaz; sorun değil.
  }
}

/**
 * "Seçime geri dön": son kararı geri alır, oyuncu 4. Perde'de
 * birleştirilmiş kanıtlarla yeniden karar verebilir.
 */
export function undoFinalChoice() {
  setFlag('act4Ending', false);
  setFlag('act4Complete', false);
  setFlag('endingId', null);
  setAct(4);
}
