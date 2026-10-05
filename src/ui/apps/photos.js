/**
 * photos.js — Fotoğraflar uygulaması.
 * Izgara görünümü + tıklanınca büyük görünüm ve "Bilgi" paneli
 * (tarih, saat, konum, cihaz). Bulmacaların ipuçları bu bilgilerde.
 */
import { gsap } from 'gsap';
import { content } from '../../engine/content.js';
import { formatDate } from '../../engine/text.js';
import { playSound } from '../../audio/sound.js';
import { clear, el } from '../dom.js';
import { icon } from '../icons.js';
import { renderImage } from '../media.js';

export function renderPhotos(body) {
  // En yeni fotoğraf en üstte.
  const photos = [...content.photos].sort((a, b) => b.date.localeCompare(a.date));
  const albums = ['Tümü', ...new Set(photos.map((p) => p.album))];
  let currentAlbum = 'Tümü';

  const sidebar = el('aside', { class: 'app-sidebar' });
  const main = el('div', { class: 'photos__main' });
  body.append(el('div', { class: 'app photos' }, [sidebar, main]));

  renderSidebar();
  renderGrid();

  function visiblePhotos() {
    return currentAlbum === 'Tümü' ? photos : photos.filter((p) => p.album === currentAlbum);
  }

  function renderSidebar() {
    clear(sidebar);
    sidebar.append(el('h4', { class: 'app-sidebar__title' }, 'Albümler'));
    for (const album of albums) {
      const count = album === 'Tümü' ? photos.length : photos.filter((p) => p.album === album).length;
      sidebar.append(el('button', {
        class: `app-sidebar__item ${album === currentAlbum ? 'is-active' : ''}`,
        onclick: () => { currentAlbum = album; renderSidebar(); renderGrid(); },
      }, [el('span', {}, album), el('small', {}, count)]));
    }
  }

  function renderGrid() {
    clear(main);
    const list = visiblePhotos();
    const grid = el('div', { class: 'photos__grid' }, list.map((photo, index) =>
      el('button', { class: 'photos__thumb', title: photo.caption, onclick: () => renderDetail(list, index) }, [
        renderImage(photo.asset),
        el('span', { class: 'photos__thumb-date' }, formatDate(photo.date)),
      ]),
    ));
    main.append(el('div', { class: 'photos__header' }, [
      el('h3', {}, currentAlbum),
      el('span', {}, `${list.length} fotoğraf`),
    ]), grid);
    gsap.from(grid.children, { opacity: 0, scale: 0.96, duration: 0.25, stagger: 0.025 });
  }

  function renderDetail(list, index) {
    playSound('click');
    const photo = list[index];
    clear(main);

    const go = (delta) => renderDetail(list, (index + delta + list.length) % list.length);
    const infoRow = (label, value) => el('div', { class: 'info-row' }, [el('span', {}, label), el('strong', {}, value)]);

    const viewer = el('div', { class: 'photos__viewer' }, [
      el('button', { class: 'photos__nav photos__nav--prev', onclick: () => go(-1), html: icon('back'), 'aria-label': 'Önceki' }),
      renderImage(photo.asset, { className: 'photos__big', showLabel: true }),
      el('button', { class: 'photos__nav photos__nav--next', onclick: () => go(1), html: icon('next'), 'aria-label': 'Sonraki' }),
    ]);

    const info = el('aside', { class: 'photos__info' }, [
      el('p', { class: 'photos__caption' }, photo.caption),
      el('h4', {}, [el('span', { html: icon('info') }), 'Fotoğraf bilgisi']),
      infoRow('Tarih', formatDate(photo.date)),
      infoRow('Saat', photo.time),
      infoRow('Konum', photo.location),
      infoRow('Cihaz', photo.device),
      infoRow('Albüm', photo.album),
    ]);

    main.append(
      el('div', { class: 'photos__header' }, [
        el('button', { class: 'btn btn--small', onclick: () => { playSound('click'); renderGrid(); } }, '‹ Geri'),
        el('span', {}, `${index + 1} / ${list.length}`),
      ]),
      el('div', { class: 'photos__detail' }, [viewer, info]),
    );
    gsap.from(viewer, { opacity: 0, scale: 0.97, duration: 0.25 });
  }
}
