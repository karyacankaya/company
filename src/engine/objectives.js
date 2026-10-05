/**
 * objectives.js — "Sıradaki adım" görevleri.
 * ------------------------------------------------------------------
 * objectives.json'daki liste sırayla okunur; içinde bulunulan perdeye
 * ait ve henüz tamamlanmamış İLK görev, oyuncuya gösterilecek görevdir.
 * Oyuncunun "şimdi ne yapacağım?" diye takılıp kalmaması için.
 * ------------------------------------------------------------------
 */
import { content } from './content.js';
import { getAct, hasFlag, isEasy, isUnlocked } from './state.js';

function isDone({ doneWhen }) {
  if (doneWhen.unlocked) return isUnlocked(doneWhen.unlocked);
  if (doneWhen.flag) return hasFlag(doneWhen.flag);
  return false;
}

/** Gösterilecek görev (yoksa null). Kolay zorlukta varsa daha açık metin kullanılır. */
export function getCurrentObjective() {
  const act = getAct();
  const objective = content.objectives.find((o) => o.act === act && !isDone(o));
  if (!objective) return null;
  return { ...objective, text: isEasy() && objective.easyText ? objective.easyText : objective.text };
}
