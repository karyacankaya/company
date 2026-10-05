/**
 * text.js — Metin yardımcıları (şifre karşılaştırma, tarih biçimleme).
 */

// Türkçe karakterlerin İngilizce karşılıkları.
const TURKISH_MAP = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u', â: 'a', î: 'i', û: 'u' };

/**
 * Oyuncunun yazdığı cevabı "standart" hale getirir, böylece
 * "Gülhane", "GULHANE", "gülhane parkı" gibi yazımlar eşleşebilir.
 *
 *  1. Türkçe kurallarla küçük harfe çevir ("İ" → "i", "I" → "ı")
 *  2. Türkçe karakterleri sadeleştir (ü → u, ı → i ...)
 *  3. Kalan aksanları sil (é → e)
 *  4. Harf ve rakam dışındaki her şeyi (boşluk, nokta, tire) at
 *
 *   normalizeAnswer("  Gülhane Parkı! ") === "gulhaneparki"
 */
export function normalizeAnswer(input) {
  return String(input)
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşüâîû]/g, (ch) => TURKISH_MAP[ch])
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/** "2023-03-14" → "14.03.2023" */
export function formatDate(isoDate) {
  const [y, m, d] = isoDate.split('-');
  return `${d}.${m}.${y}`;
}

/** "2023-03-14" → "14 Mart 2023" */
export function formatDateLong(isoDate) {
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}
