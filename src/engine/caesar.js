/**
 * caesar.js — Sezar şifresi.
 * ------------------------------------------------------------------
 * Sezar şifresinde her harf alfabede sabit bir sayı kadar kaydırılır.
 * 3 kaydırma ile şifrelerken: a→d, b→e, ..., x→a, y→b, z→c
 * Çözerken aynı sayı kadar GERİ kaydırılır.
 *
 * Oyunda İngilizce alfabe (26 harf) kullanılıyor; Türkçe karakterler,
 * rakamlar ve noktalama işaretleri olduğu gibi bırakılır.
 * ------------------------------------------------------------------
 */

const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

/** Metindeki her harfi 'shift' kadar ileri kaydırır (negatif = geri). */
export function caesarShift(text, shift) {
  // % işlemi negatif sayılarda negatif sonuç verebilir; bu formül
  // kaydırmayı her zaman 0..25 aralığına getirir.
  const n = ((shift % 26) + 26) % 26;

  return [...text]
    .map((ch) => {
      const lower = ch.toLowerCase();
      const index = ALPHABET.indexOf(lower);
      if (index === -1) return ch; // harf değilse dokunma

      const shifted = ALPHABET[(index + n) % 26];
      // Orijinal harf büyükse sonucu da büyük yap.
      return ch === lower ? shifted : shifted.toUpperCase();
    })
    .join('');
}

/** Şifreli metni çözer: 'shift' kadar geri kaydırır. */
export function caesarDecode(text, shift) {
  return caesarShift(text, -shift);
}
