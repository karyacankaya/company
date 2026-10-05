/**
 * appLauncher.js — Uygulama açma.
 * ------------------------------------------------------------------
 * 1. apps.json'dan uygulama tanımını bulur
 * 2. Pencere açar ve 'app:launched' olayını yayınlar
 * 3. Uygulama kilitliyse önce küçük bir pencerede şifre formu gösterir.
 *    Zincirli kilitlerde (ör. E-posta: parola + güvenlik kartı) adımlar
 *    sırayla gelir. Son adım da açılınca pencere büyüyerek uygulama
 *    boyutuna geçer.
 * 4. Uygulamanın içeriğini ilgili "renderer" ile çizer
 * ------------------------------------------------------------------
 */
import { gsap } from 'gsap';
import { getApp } from '../engine/content.js';
import { bus } from '../engine/eventBus.js';
import { getLock, getRemainingSteps } from '../engine/puzzles.js';
import { playSound } from '../audio/sound.js';
import { focusWindow, getWindow, openWindow, resizeWindow } from './windowManager.js';
import { createPasswordForm } from './passwordForm.js';
import { renderers } from './apps/index.js';
import { clear, wait } from './dom.js';

// Kilit ekranı penceresinin boyutu (PIN için tuş takımı olduğundan daha uzun).
const LOCK_WINDOW = { text: { width: 420, height: 450 }, pin: { width: 380, height: 640 } };

export const appWindowId = (appId) => `app:${appId}`;

export function launchApp(appId) {
  const app = getApp(appId);
  if (!app) return null;

  const winId = appWindowId(appId);
  if (getWindow(winId)) {
    focusWindow(winId);
    return getWindow(winId);
  }

  playSound('click');
  const steps = app.lockId ? getRemainingSteps(app.lockId) : [];
  const size = steps.length ? LOCK_WINDOW[getLock(steps[0]).type] : app.window;

  const win = openWindow({
    id: winId,
    title: app.title,
    iconName: app.icon,
    width: size.width,
    height: size.height,
    className: `window--app-${app.id} ${steps.length ? 'window--locked' : ''}`,
  });
  bus.emit('app:launched', { appId });

  if (steps.length) showLockStep(app, win, steps, 0);
  else renderApp(app, win);
  return win;
}

/** Kilidin index'inci adımını gösterir; doğruysa sıradakine geçer. */
function showLockStep(app, win, steps, index) {
  const form = createPasswordForm({
    lockId: steps[index],
    onSuccess: async () => {
      gsap.to(form.element, { opacity: 0, scale: 0.92, duration: 0.18 });
      const next = steps[index + 1];
      if (next) {
        // Sıradaki adım: pencere o adımın boyutuna geçsin.
        const size = LOCK_WINDOW[getLock(next).type];
        await Promise.all([resizeWindow(win.id, size.width, size.height, { duration: 0.25 }), wait(200)]);
        if (!win.el.isConnected) return;
        clear(win.body);
        showLockStep(app, win, steps, index + 1);
        return;
      }
      // Son adım: pencere büyüyerek uygulamaya dönüşsün.
      await resizeWindow(win.id, app.window.width, app.window.height);
      win.el.classList.remove('window--locked');
      renderApp(app, win);
    },
  });
  win.body.append(form.element);
  if (index > 0) gsap.from(form.element, { opacity: 0, x: 24, duration: 0.25 });
  setTimeout(form.focus, 60);
}

function renderApp(app, win) {
  clear(win.body);
  const render = renderers[app.renderer];
  if (!render) {
    win.body.textContent = `"${app.renderer}" için çizici bulunamadı.`;
    return;
  }
  render(win.body, { app, win });
  gsap.fromTo(win.body, { opacity: 0 }, { opacity: 1, duration: 0.25 });
}
