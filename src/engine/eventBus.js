/**
 * eventBus.js — Basit bir "olay yayıncısı" (publish/subscribe).
 * ------------------------------------------------------------------
 * Oyunun farklı parçaları birbirini doğrudan çağırmak yerine olay
 * yayınlar ve dinler. Böylece örneğin oyun mantığı (engine) arayüzün
 * nasıl çizildiğini bilmek zorunda kalmaz.
 *
 *   const off = bus.on('lock:unlocked', ({ lockId }) => { ... });
 *   bus.emit('lock:unlocked', { lockId: 'notes' });
 *   off(); // dinlemeyi bırak
 *
 * Oyunda kullanılan olaylar:
 *   lock:unlocked            { lockId }       bir kilit açıldı
 *   lock:failed              { lockId, attempts }
 *   archive:screenshotViewed {}               arşivdeki tablo görüldü
 *   act:ending               { act }          perde kapanış sahnesi başlasın
 *   act:ended                { act }          perde kapanış sahnesi bitti
 *   window:opened / window:closed / window:focused   { id }
 *   state:reset              {}               kayıt silindi
 * ------------------------------------------------------------------
 */

const listeners = new Map(); // olay adı -> Set(fonksiyon)

export const bus = {
  /** Bir olayı dinle. Geri dönen fonksiyon çağrılınca dinleme biter. */
  on(eventName, handler) {
    if (!listeners.has(eventName)) listeners.set(eventName, new Set());
    listeners.get(eventName).add(handler);
    return () => listeners.get(eventName)?.delete(handler);
  },

  /** Bir olayı yayınla: o olayı dinleyen herkes çağrılır. */
  emit(eventName, payload = {}) {
    listeners.get(eventName)?.forEach((handler) => {
      try {
        handler(payload);
      } catch (err) {
        // Bir dinleyicideki hata diğerlerini durdurmasın.
        console.error(`[bus] "${eventName}" dinleyicisinde hata:`, err);
      }
    });
  },
};
