/**
 * fileViewers.js — Çöp Kutusu ve arşivdeki dosyaları açan küçük pencereler.
 */
import { gsap } from 'gsap';
import { content } from '../../engine/content.js';
import { bus } from '../../engine/eventBus.js';
import { playSound } from '../../audio/sound.js';
import { el } from '../dom.js';
import { openWindow } from '../windowManager.js';
import { hasRealImage, renderImage } from '../media.js';

/** Bir dosya tanımını (trash.json) türüne göre açar. */
export function openFile(file) {
  playSound('click');
  if (file.kind === 'text') return openTextFile(file);
  if (file.kind === 'screenshot') return openScreenshot(file);
  return openUnsupported(file);
}

function openTextFile(file) {
  const win = openWindow({ id: `file:${file.id}`, title: file.name, iconName: 'file', width: 520, height: 340 });
  win.body.replaceChildren(el('pre', { class: 'text-viewer' }, file.content));
}

function openUnsupported(file) {
  const win = openWindow({ id: `file:${file.id}`, title: file.name, iconName: 'file', width: 400, height: 220 });
  win.body.replaceChildren(el('div', { class: 'file-error' }, [
    el('strong', {}, file.name),
    el('p', {}, file.message ?? 'Bu dosya açılamıyor.'),
  ]));
}

/**
 * Arşivdeki "ekran görüntüsü". Gerçek bir görsel eklenmişse onu,
 * yoksa trash.json'daki verilerden HTML ile çizilmiş sahte bir
 * rapor tablosunu gösterir. Açıldığında perde sonunu tetikleyen
 * olayı yayınlar.
 */
function openScreenshot(file) {
  const shot = content.trash.archive.screenshot;
  const win = openWindow({ id: `file:${file.id}`, title: file.name, iconName: 'image', width: 900, height: 560, className: 'window--image' });

  const inner = hasRealImage(shot.assetId) ? renderImage(shot.assetId, { className: 'screenshot__img' }) : renderFakeReport(shot);
  win.body.replaceChildren(el('div', { class: 'image-viewer' }, [inner]));
  gsap.from(inner, { opacity: 0, scale: 0.96, duration: 0.35, ease: 'power2.out' });

  bus.emit('archive:screenshotViewed');
}

function renderFakeReport(shot) {
  const table = (columns, rows, className = '') => el('table', { class: `report__table ${className}` }, [
    el('thead', {}, el('tr', {}, columns.map((c) => el('th', {}, c)))),
    el('tbody', {}, rows.map((row) => el('tr', {}, row.map((cell, i) =>
      el('td', { class: cell === 'Bekliyor' ? 'is-pending' : i === columns.length - 1 ? 'is-done' : '' }, cell))))),
  ]);

  return el('div', { class: 'report' }, [
    el('div', { class: 'report__chrome' }, [el('i'), el('i'), el('i'), el('span', {}, shot.appName)]),
    el('div', { class: 'report__page' }, [
      el('div', { class: 'report__stamp' }, shot.stamp),
      el('h2', { class: 'report__title' }, shot.title),
      el('p', { class: 'report__subtitle' }, shot.subtitle),
      table(shot.columns, shot.rows),
      el('h4', { class: 'report__sample-title' }, shot.sampleTitle),
      table(shot.sampleColumns, shot.sampleRows, 'report__table--sample'),
      el('footer', { class: 'report__footer' }, shot.footer.map((line) => el('span', {}, line))),
    ]),
  ]);
}
