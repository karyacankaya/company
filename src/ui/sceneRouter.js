/**
 * sceneRouter.js — Sahneler arası geçiş.
 * ------------------------------------------------------------------
 * Oyun birkaç büyük "sahne"den oluşur: başlık → giriş hikâyesi →
 * açılış (boot) → giriş ekranı → masaüstü. Aynı anda tek sahne
 * görünür. Her sahne bir fonksiyondur:
 *
 *   function renderScene(root, params) { ...; return cleanup; }
 *
 * Sahne değişirken öncekinin "cleanup" fonksiyonu çağrılır (ör.
 * saat zamanlayıcısını durdurmak, olay dinleyicilerini kaldırmak).
 * ------------------------------------------------------------------
 */
import { clear } from './dom.js';

const scenes = {};
let root = null;
let cleanup = null;

export function initRouter(rootElement) {
  root = rootElement;
}

export function registerScene(name, renderFn) {
  scenes[name] = renderFn;
}

export function goTo(name, params = {}) {
  if (!scenes[name]) throw new Error(`Bilinmeyen sahne: ${name}`);
  cleanup?.();
  cleanup = null;
  clear(root);
  root.dataset.scene = name;
  cleanup = scenes[name](root, params) ?? null;
}
