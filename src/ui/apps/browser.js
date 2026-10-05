/**
 * browser.js — Tarayıcı ("Gezgin"): geçmiş, yer imleri, önbellek sayfaları.
 * ------------------------------------------------------------------
 * Bilgisayar çevrimdışı olduğundan sadece önbellekteki sayfalar
 * açılabilir. Sayfalar browser.json'daki "blocks" listesinden çizilir.
 *
 * Bulmaca notu: Geçmiş, tarayıcılarda olduğu gibi EN YENİ en üstte
 * gösterilir. E-posta parolası için aramaları en eskiden okumak gerekir.
 * ------------------------------------------------------------------
 */
import { gsap } from 'gsap';
import { content } from '../../engine/content.js';
import { bus } from '../../engine/eventBus.js';
import { formatDateLong } from '../../engine/text.js';
import { playSound } from '../../audio/sound.js';
import { clear, el } from '../dom.js';
import { icon } from '../icons.js';

export function renderBrowser(body) {
  const data = content.browser;
  let tab = 'history';      // 'history' | 'bookmarks'
  let backTarget = null;    // sayfadan geri dönünce hangi liste

  const address = el('input', { class: 'browser__address', readonly: true, value: `${data.appName.toLowerCase()}://gecmis` });
  const backButton = el('button', { class: 'browser__nav', disabled: true, html: icon('back'), 'aria-label': 'Geri', onclick: () => showList() });
  const sidebar = el('aside', { class: 'app-sidebar browser__side' });
  const main = el('div', { class: 'browser__main' });

  body.append(el('div', { class: 'app browser' }, [
    el('div', { class: 'browser__bar' }, [
      backButton,
      el('button', { class: 'browser__nav', disabled: true, html: icon('next'), 'aria-label': 'İleri' }),
      el('div', { class: 'browser__address-wrap' }, [el('span', { html: icon('lock') }), address]),
      el('span', { class: 'browser__offline', title: 'Çevrimdışı — sadece önbellek' }, 'önbellek'),
    ]),
    el('div', { class: 'browser__content' }, [sidebar, main]),
  ]));

  renderSidebar();
  showList();

  function renderSidebar() {
    clear(sidebar);
    sidebar.append(el('h4', { class: 'app-sidebar__title' }, data.appName));
    const item = (id, label) => el('button', {
      class: `app-sidebar__item ${tab === id ? 'is-active' : ''}`,
      onclick: () => { playSound('click'); tab = id; renderSidebar(); showList(); },
    }, [el('span', {}, label)]);
    sidebar.append(item('history', 'Geçmiş'), item('bookmarks', 'Yer imleri'));
  }

  function showList() {
    clear(main);
    backButton.disabled = true;
    address.value = `${data.appName.toLowerCase()}://${tab === 'history' ? 'gecmis' : 'yer-imleri'}`;
    const list = tab === 'history' ? renderHistory() : renderBookmarks();
    main.append(list);
    gsap.from(list, { opacity: 0, duration: 0.2 });
  }

  function renderHistory() {
    // Günlere göre grupla; günler ve kayıtlar en yeniden eskiye.
    const sorted = [...data.history].sort((a, b) => `${b.day} ${b.time}`.localeCompare(`${a.day} ${a.time}`));
    const days = [...new Set(sorted.map((h) => h.day))];
    return el('div', { class: 'browser__list' }, days.map((day) => el('section', {}, [
      el('h4', { class: 'browser__day' }, formatDateLong(day)),
      ...sorted.filter((h) => h.day === day).map((h) => el('button', {
        class: `history-row history-row--${h.kind}`,
        onclick: () => openPage(h.pageId, h.url),
      }, [
        el('span', { class: 'history-row__time' }, h.time),
        el('span', { class: 'history-row__icon', html: icon(h.kind === 'search' ? 'search' : 'browser') }),
        // Parola aramalarının baş harfi vurgulu (E-posta parolası bulmacası için yardım).
        h.acrostic
          ? el('span', { class: 'history-row__title' }, ['Arama: ', el('b', { class: 'history-row__initial' }, h.title[0]), h.title.slice(1)])
          : el('span', { class: 'history-row__title' }, h.title),
        el('span', { class: 'history-row__url' }, h.url),
      ])),
    ])));
  }

  function renderBookmarks() {
    return el('div', { class: 'browser__list' }, [
      el('h4', { class: 'browser__day' }, 'Yer imleri'),
      ...data.bookmarks.map((b) => el('button', { class: 'history-row', onclick: () => openPage(b.pageId, b.url) }, [
        el('span', { class: 'history-row__icon history-row__icon--star', html: icon('star') }),
        el('span', { class: 'history-row__title' }, b.title),
        el('span', { class: 'history-row__url' }, b.url),
      ])),
    ]);
  }

  function openPage(pageId, url) {
    playSound('click');
    const page = data.pages[pageId];
    clear(main);
    backButton.disabled = false;
    address.value = url;
    const view = el('article', { class: 'webpage' }, [
      el('div', { class: 'webpage__site' }, page?.site ?? url),
      el('h1', { class: 'webpage__title' }, page?.title ?? 'Sayfa bulunamadı'),
      ...(page ? page.blocks.map(renderBlock) : [renderBlock({ type: 'notice', tone: 'error', text: 'Bu sayfa önbellekte yok.' })]),
    ]);
    main.append(el('div', { class: 'webpage-wrap' }, view));
    gsap.from(view, { opacity: 0, y: 8, duration: 0.25 });
    bus.emit('browser:pageOpened', { pageId });
  }
}

/** browser.json'daki tek bir içerik bloğunu çizer. */
function renderBlock(block) {
  switch (block.type) {
    case 'heading':
      return el('h2', { class: 'webpage__heading' }, block.text);
    case 'fields':
      return el('dl', { class: 'webpage__fields' }, block.items.flatMap(([label, value]) => [el('dt', {}, label), el('dd', {}, value)]));
    case 'results':
      return el('ol', { class: 'webpage__results' }, block.items.map((r) => el('li', {}, [
        el('span', { class: 'webpage__result-url' }, r.url),
        el('strong', { class: 'webpage__result-title' }, r.title),
        el('p', {}, r.snippet),
      ])));
    case 'notice':
      return el('div', { class: `webpage__notice webpage__notice--${block.tone ?? 'info'}` }, block.text);
    default:
      return el('p', { class: 'webpage__p' }, block.text);
  }
}
