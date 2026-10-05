/**
 * trash.js — Çöp Kutusu (dosya listesi).
 * Bir dosyaya çift tıklayınca (ya da seçip "Aç"a basınca) açılır.
 * arsiv.zip, kendi kilidi olan "archive" uygulamasını açar.
 */
import { content } from '../../engine/content.js';
import { formatDate } from '../../engine/text.js';
import { el, onActivate } from '../dom.js';
import { icon } from '../icons.js';
import { launchApp } from '../appLauncher.js';
import { openFile } from './fileViewers.js';

const FILE_ICONS = { archive: 'archive', text: 'file', unsupported: 'file' };

export function renderTrash(body) {
  const files = content.trash.files;
  let selected = null;

  const openButton = el('button', { class: 'btn btn--small', disabled: true, onclick: () => selected && open(selected) }, 'Aç');
  const emptyButton = el('button', { class: 'btn btn--small btn--danger', onclick: onEmpty }, 'Çöpü boşalt');
  const status = el('small', { class: 'trash__status' }, `${files.length} öğe`);

  const rows = files.map((file) => {
    const row = el('div', {
      class: 'file-row',
      tabindex: 0,
      onclick: () => select(file, row),
      onkeydown: (e) => e.key === 'Enter' && open(file),
    }, [
      el('span', { class: `file-row__icon file-row__icon--${file.kind}`, html: icon(FILE_ICONS[file.kind]) }),
      el('span', { class: 'file-row__name' }, file.name),
      el('span', { class: 'file-row__size' }, file.size),
      el('span', { class: 'file-row__date' }, formatDate(file.deletedAt)),
    ]);
    onActivate(row, () => open(file));
    return row;
  });

  body.append(el('div', { class: 'app trash' }, [
    el('div', { class: 'trash__toolbar' }, [openButton, emptyButton, status]),
    el('div', { class: 'file-row file-row--head' }, [el('span'), el('span', {}, 'Ad'), el('span', {}, 'Boyut'), el('span', {}, 'Silinme')]),
    el('div', { class: 'trash__list' }, rows),
  ]));

  function select(file, row) {
    selected = file;
    rows.forEach((r) => r.classList.toggle('is-selected', r === row));
    openButton.disabled = false;
  }

  function open(file) {
    if (file.kind === 'archive') launchApp(file.appId);
    else openFile(file);
  }

  // Oyuncu kanıtı yanlışlıkla silemesin :)
  function onEmpty() {
    status.textContent = 'Çöp boşaltılamadı: bazı öğeler kullanımda.';
  }
}
