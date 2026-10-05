/**
 * windowManager.js — Pencere sistemi.
 * ------------------------------------------------------------------
 * Pencere açma/kapatma, öne getirme (z-index), sürükleme ve yeniden
 * boyutlandırma (kilit açılınca büyüme) burada.
 *
 * Her pencere bir "id" ile tanınır. Aynı id ile ikinci kez açılmaya
 * çalışılırsa yeni pencere açılmaz, var olan öne gelir.
 * ------------------------------------------------------------------
 */
import { gsap } from 'gsap';
import { bus } from '../engine/eventBus.js';
import { playSound } from '../audio/sound.js';
import { icon } from './icons.js';
import { el, isPhoneLayout } from './dom.js';

let layer = null;           // pencerelerin içine eklendiği alan
const windows = new Map();  // id -> pencere nesnesi
let zCounter = 10;          // her öne getirmede artan z-index
let cascadeIndex = 0;       // yeni pencereler üst üste binmesin diye kaydırma

/** Masaüstü sahnesi açılırken pencere alanını tanıtır. */
export function initWindowLayer(layerElement) {
  layer = layerElement;
  windows.clear();
  cascadeIndex = 0;
}

export const getWindow = (id) => windows.get(id);
export const getOpenWindows = () => [...windows.values()];

/**
 * Yeni pencere açar.
 * @returns pencere nesnesi: { id, el, body, setTitle(), close() }
 */
export function openWindow({ id, title, iconName = 'file', width = 640, height = 420, className = '', onClose, animate = true }) {
  if (windows.has(id)) {
    focusWindow(id);
    const existing = windows.get(id);
    gsap.fromTo(existing.el, { scale: 0.98 }, { scale: 1, duration: 0.2, ease: 'back.out(3)', clearProps: 'transform' });
    return existing;
  }

  const titleNode = el('span', { class: 'window__title' }, title);
  const closeButton = el('button', { class: 'window__close', 'aria-label': 'Kapat', html: icon('close') });
  const titlebar = el('header', { class: 'window__titlebar' }, [
    el('span', { class: 'window__icon', html: icon(iconName) }),
    titleNode,
    closeButton,
  ]);
  const body = el('div', { class: 'window__body' });
  const node = el('section', { class: `window ${className}`, 'data-window-id': id }, [titlebar, body]);

  // Başlangıç konumu: alanın ortası, her yeni pencerede biraz kaydırılmış.
  const area = layer.getBoundingClientRect();
  const w = Math.min(width, area.width - 32);
  const h = Math.min(height, area.height - 32);
  const offset = (cascadeIndex % 5) * 26 - 52;
  cascadeIndex++;
  const left = clamp((area.width - w) / 2 + offset, 8, area.width - w - 8);
  const top = clamp((area.height - h) / 2 + offset * 0.7, 8, area.height - h - 8);
  Object.assign(node.style, { width: `${w}px`, height: `${h}px`, left: `${left}px`, top: `${top}px` });

  layer.append(node);

  const win = {
    id,
    el: node,
    body,
    onClose,
    setTitle: (text) => { titleNode.textContent = text; bus.emit('window:retitled', { id, title: text }); },
    getTitle: () => titleNode.textContent,
    iconName,
    close: () => closeWindow(id),
  };
  windows.set(id, win);

  makeDraggable(node, titlebar);
  node.addEventListener('pointerdown', () => focusWindow(id));
  closeButton.addEventListener('pointerdown', (e) => e.stopPropagation()); // sürüklemeyi başlatma
  closeButton.addEventListener('click', () => closeWindow(id));

  focusWindow(id);
  if (animate) {
    gsap.fromTo(node, { opacity: 0, scale: 0.94, y: 14 }, { opacity: 1, scale: 1, y: 0, duration: 0.22, ease: 'power2.out', clearProps: 'transform,opacity' });
  }
  bus.emit('window:opened', { id, title, iconName });
  return win;
}

export function closeWindow(id, { silent = false } = {}) {
  const win = windows.get(id);
  if (!win) return;
  windows.delete(id);
  win.onClose?.();
  if (!silent) playSound('click');
  gsap.to(win.el, { opacity: 0, scale: 0.95, duration: 0.14, ease: 'power1.in', onComplete: () => win.el.remove() });
  bus.emit('window:closed', { id });
}

export function closeAllWindows() {
  for (const id of [...windows.keys()]) closeWindow(id, { silent: true });
}

/** Pencereyi en öne getirir. */
export function focusWindow(id) {
  const win = windows.get(id);
  if (!win) return;
  zCounter++;
  win.el.style.zIndex = zCounter;
  windows.forEach((other) => other.el.classList.toggle('is-focused', other === win));
  bus.emit('window:focused', { id });
}

/**
 * Pencereyi merkezini koruyarak yeni boyuta getirir (GSAP ile büyüyerek).
 * Kilit ekranı küçük bir pencerede açılır; şifre doğruysa uygulama
 * boyutuna "büyüyerek" geçer.
 */
export function resizeWindow(id, width, height, { duration = 0.35 } = {}) {
  const win = windows.get(id);
  if (!win) return Promise.resolve();
  const area = layer.getBoundingClientRect();
  const w = Math.min(width, area.width - 16);
  const h = Math.min(height, area.height - 16);
  const box = win.el.getBoundingClientRect();
  const centerX = box.left - area.left + box.width / 2;
  const centerY = box.top - area.top + box.height / 2;
  const left = clamp(centerX - w / 2, 8, area.width - w - 8);
  const top = clamp(centerY - h / 2, 8, area.height - h - 8);

  return new Promise((resolve) => {
    gsap.to(win.el, { width: w, height: h, left, top, duration, ease: 'power3.inOut', onComplete: resolve });
  });
}

// ---- Sürükleme ---------------------------------------------------
function makeDraggable(node, handle) {
  let startX, startY, startLeft, startTop;

  handle.addEventListener('pointerdown', (e) => {
    // Telefonda pencereler tam ekran açılır; sürüklemeye gerek yok.
    if (e.button !== 0 || isPhoneLayout()) return;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = node.offsetLeft;
    startTop = node.offsetTop;
    // Fare pencereden çok hızlı çıksa bile hareketleri yakalamaya devam et.
    handle.setPointerCapture(e.pointerId);
    node.classList.add('is-dragging');
  });

  handle.addEventListener('pointermove', (e) => {
    if (!handle.hasPointerCapture(e.pointerId)) return;
    const area = layer.getBoundingClientRect();
    // Pencere tamamen dışarı kaçmasın: en az 80 px'i ve başlık çubuğu görünür kalsın.
    const left = clamp(startLeft + e.clientX - startX, 80 - node.offsetWidth, area.width - 80);
    const top = clamp(startTop + e.clientY - startY, 0, area.height - 36);
    node.style.left = `${left}px`;
    node.style.top = `${top}px`;
  });

  const stop = (e) => {
    if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId);
    node.classList.remove('is-dragging');
  };
  handle.addEventListener('pointerup', stop);
  handle.addEventListener('pointercancel', stop);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}
