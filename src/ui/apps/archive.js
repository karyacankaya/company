/**
 * archive.js — arsiv.zip açıldıktan sonra görünen içerik.
 * (Şifre ekranını appLauncher + passwordForm halleder.)
 */
import { content } from '../../engine/content.js';
import { el, isTouch, onActivate } from '../dom.js';
import { icon } from '../icons.js';
import { openFile } from './fileViewers.js';

export function renderArchive(body) {
  const { contents } = content.trash.archive;
  body.append(el('div', { class: 'app archive' }, [
    el('p', { class: 'archive__info' }, `${contents.length} dosya · açmak için ${isTouch() ? 'dokun' : 'çift tıkla'}`),
    el('div', { class: 'archive__grid' }, contents.map((file) => {
      const button = el('button', { class: 'archive__file', title: file.name }, [
        el('span', { class: 'archive__file-icon', html: icon(file.kind === 'screenshot' ? 'image' : 'file') }),
        el('span', { class: 'archive__file-name' }, file.name),
        el('small', {}, file.size),
      ]);
      onActivate(button, () => openFile(file));
      return button;
    })),
  ]));
}
