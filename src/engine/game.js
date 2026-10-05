/**
 * game.js — Hikâye akışı (perdeler).
 * ------------------------------------------------------------------
 * Her perdenin sonu story.json > acts içinde tanımlıdır:
 *   { "id": 1, "endTrigger": "archive:screenshotViewed", "endDelayMs": 2400 }
 * Yani "şu olay olunca, şu kadar bekle, sonra perdeyi kapat".
 *
 * Bir perdenin yaşam döngüsü:
 *   startAct(n)  → 'act:started'   (1. perde oyunun başında başlamış sayılır)
 *   endTrigger   → 'act:ending'    (arayüz kapanış sahnesini oynatır)
 *   arayüz biter → 'act:ended'     (perde tamamlandı, sayaç n+1 olur)
 *
 * Bu dosya sadece KARAR verir ve olay yayınlar. Glitch, sahte fare
 * imleci gibi görsel kısım ui/cliffhanger.js'tedir.
 * Yeni perde eklemek = story.json'a yeni bir acts öğesi eklemek.
 * ------------------------------------------------------------------
 */
import { bus } from './eventBus.js';
import { content } from './content.js';
import { getAct, hasFlag, setAct, setFlag } from './state.js';

const startedFlag = (actId) => `act${actId}Started`;
const endingFlag = (actId) => `act${actId}Ending`;
const completeFlag = (actId) => `act${actId}Complete`;

export const isActStarted = (actId) => actId === 1 || hasFlag(startedFlag(actId));
export const isActComplete = (actId) => hasFlag(completeFlag(actId));

/** Perde kapanışı başlamış ama (ör. sayfa yenilendiği için) bitmemiş mi? */
export const isActEndingPending = (actId) =>
  hasFlag(endingFlag(actId)) && !hasFlag(completeFlag(actId));

/** Şu an oynanabilir durumda olan perde mi? (başlamış, kapanışı başlamamış) */
export const isActRunning = (actId) =>
  getAct() === actId && isActStarted(actId) && !hasFlag(endingFlag(actId));

let pendingTimer = null;

/** Oyun mantığını başlatır: her perdenin bitiş tetikleyicisini dinler. */
export function initGameLogic() {
  for (const act of content.story.acts) {
    bus.on(act.endTrigger, () => {
      // Sadece içinde bulunduğumuz, başlamış perde; ve sadece bir kez.
      if (!isActRunning(act.id)) return;
      setFlag(endingFlag(act.id));
      clearTimeout(pendingTimer);
      // Oyuncu bulduğu şeye birkaç saniye baksın, sonra perde kapansın.
      pendingTimer = setTimeout(() => bus.emit('act:ending', { act: act.id }), act.endDelayMs);
    });
  }

  // Kapanış sahnesi (arayüz) bitince perdeyi tamamlandı say.
  bus.on('act:ended', ({ act }) => {
    setFlag(completeFlag(act));
    setAct(act + 1);
  });

  bus.on('state:reset', () => clearTimeout(pendingTimer));
}

/** Yeni bir perdeyi başlatır (bir kez). */
export function startAct(actId) {
  if (getAct() !== actId || hasFlag(startedFlag(actId))) return;
  setFlag(startedFlag(actId));
  bus.emit('act:started', { act: actId });
}

export function getActDef(actId) {
  return content.story.acts.find((act) => act.id === actId);
}
