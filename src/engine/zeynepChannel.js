/**
 * zeynepChannel.js — Zeynep'in Terminal'e gelen şifreli mesajları (4. Perde).
 * ------------------------------------------------------------------
 * terminal.json > channel listesindeki her blok bir olaya bağlıdır ve
 * BİR KEZ gelir (BT Destek'teki "vuruş" sistemine benzer, ama daha
 * basit: seçenek yok, oyuncu terminal komutlarıyla "cevap verir").
 *
 * Gelen bloklar bayrak olarak kaydedilir (zblock:<id>); Terminal
 * açıldığında geçmiş bloklar yeniden basılır.
 * ------------------------------------------------------------------
 */
import { bus } from './eventBus.js';
import { content } from './content.js';
import { hasFlag, setFlag } from './state.js';
import { isActRunning } from './game.js';

const deliveredFlag = (id) => `zblock:${id}`;
const blocks = () => content.terminal.channel;

export function initZeynepChannel() {
  for (const block of blocks()) {
    const { event, match = {} } = block.trigger;
    bus.on(event, (payload = {}) => {
      const ok = Object.entries(match).every(([k, v]) => payload[k] === v);
      if (ok) deliver(block);
    });
  }
}

function deliver(block) {
  if (!isActRunning(4) || hasFlag(deliveredFlag(block.id))) return;
  setFlag(deliveredFlag(block.id));
  if (block.setFlag) setFlag(block.setFlag);
  bus.emit('zeynep:block', { block });
}

/** Şimdiye kadar gelmiş bütün blokların satırları (Terminal açılınca basılır). */
export function getDeliveredLines() {
  return blocks().filter((b) => hasFlag(deliveredFlag(b.id))).flatMap((b) => b.lines);
}
