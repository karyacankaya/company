/**
 * dom.js — Küçük DOM yardımcıları.
 */

/**
 * HTML öğesi oluşturur.
 *   el('button', { class: 'btn', onclick: fn }, 'Tıkla')
 * attrs içindeki "on..." ile başlayan anahtarlar olay dinleyicisi olur.
 * children: metin, öğe ya da bunlardan oluşan dizi olabilir.
 */
export function el(tag, attrs = {}, children = []) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'class') {
      node.className = value;
    } else if (key === 'html') {
      node.innerHTML = value; // sadece kendi yazdığımız güvenli HTML için
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(node.style, value);
    } else {
      node.setAttribute(key, value === true ? '' : value);
    }
  }
  for (const child of [].concat(children)) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}

/** Bir öğenin içini boşaltır. */
export function clear(node) {
  while (node.firstChild) node.firstChild.remove();
}

/** Bekleme: await wait(300) */
export const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Bir CSS animasyon sınıfını yeniden tetikler (ör. titreme).
 * Sınıfı kaldırıp, tarayıcıyı yeniden çizmeye zorlayıp, geri ekler.
 */
export function replayClass(node, className) {
  node.classList.remove(className);
  void node.offsetWidth; // "reflow" — animasyonu sıfırlar
  node.classList.add(className);
}

// ---- Telefon / dokunmatik ekran ----------------------------------

/** Dokunmatik ekran mı? (parmakla kullanılan cihazlar) */
export const isTouch = () => window.matchMedia('(pointer: coarse)').matches;

/**
 * Telefon düzeni mi? Bu sorgu styles/responsive.css'teki ile AYNI olmalı:
 * dar ekran ya da yatay tutulmuş telefon.
 */
export const PHONE_QUERY = '(max-width: 700px), (max-height: 500px)';
export const isPhoneLayout = () => window.matchMedia(PHONE_QUERY).matches;

/**
 * "Açma" eylemi: masaüstünde çift tıklama, dokunmatik ekranda tek dokunuş.
 * (Telefonda çift dokunmak hem zor hem de ekranı yakınlaştırır.)
 */
export function onActivate(node, handler) {
  node.addEventListener('dblclick', handler);
  node.addEventListener('click', (e) => {
    if (isTouch()) handler(e);
  });
}

/**
 * Telefonda liste → içerik düzeninde içerikten listeye dönen "‹" düğmesi.
 * Masaüstünde CSS ile gizlidir.
 */
export function mobileBack(onClick, label = 'Geri') {
  return el('button', { class: 'mobile-back', onclick: onClick, 'aria-label': label }, `‹ ${label}`);
}
