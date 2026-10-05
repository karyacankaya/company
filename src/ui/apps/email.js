/**
 * email.js — E-posta uygulaması (PostaKuş).
 * ------------------------------------------------------------------
 * Üç bölmeli görünüm: klasörler | ileti listesi | okuma bölmesi.
 * İçerik emails.json'dan gelir. Bir ileti açılınca:
 *   - 'email:opened' { emailId } olayı yayınlanır (BT Destek tepki verebilir)
 *   - iletide "event" alanı varsa o olay da yayınlanır (ör. perde sonu)
 * Okundu bilgisi state'e bayrak olarak kaydedilir.
 * ------------------------------------------------------------------
 */
import { gsap } from 'gsap';
import { content } from '../../engine/content.js';
import { bus } from '../../engine/eventBus.js';
import { hasFlag, setFlag } from '../../engine/state.js';
import { formatDate, formatDateLong } from '../../engine/text.js';
import { playSound } from '../../audio/sound.js';
import { clear, el, mobileBack } from '../dom.js';
import { icon } from '../icons.js';
import { openWindow } from '../windowManager.js';

const readFlag = (id) => `emailRead:${id}`;

export function renderEmail(body) {
  const data = content.email;
  let folder = 'inbox';
  let current = null;

  const isUnread = (mail) => mail.unread && !hasFlag(readFlag(mail.id));
  const inFolder = (id) => data.emails
    .filter((m) => m.folder === id)
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

  const folders = el('aside', { class: 'app-sidebar mail__folders' });
  const list = el('div', { class: 'mail__list' });
  const reader = el('article', { class: 'mail__reader' });

  // Telefonda .show-detail sınıfı klasörleri/listeyi gizleyip iletiyi gösterir.
  const root = el('div', { class: 'app mail' }, [folders, list, reader]);
  body.append(root);
  renderFolders();
  renderList();
  renderEmpty();

  function renderFolders() {
    clear(folders);
    folders.append(el('div', { class: 'mail__account' }, [
      el('span', { class: 'mail__brand', html: icon('mail') }),
      el('div', {}, [el('strong', {}, 'PostaKuş'), el('small', {}, data.account)]),
    ]));
    for (const f of data.folders) {
      const unread = inFolder(f.id).filter(isUnread).length;
      folders.append(el('button', {
        class: `app-sidebar__item ${folder === f.id ? 'is-active' : ''}`,
        onclick: () => { playSound('click'); folder = f.id; current = null; renderFolders(); renderList(); renderEmpty(); },
      }, [el('span', {}, f.title), unread ? el('span', { class: 'badge' }, unread) : el('small', {}, inFolder(f.id).length)]));
    }
  }

  function renderList() {
    clear(list);
    const mails = inFolder(folder);
    for (const mail of mails) {
      const who = folder === 'inbox' ? mail.from.name : `Kime: ${mail.to}`;
      list.append(el('button', {
        class: `mail-row ${isUnread(mail) ? 'is-unread' : ''} ${mail === current ? 'is-active' : ''}`,
        onclick: () => openMail(mail),
      }, [
        el('div', { class: 'mail-row__top' }, [
          el('strong', {}, who),
          el('small', {}, formatDate(mail.date)),
        ]),
        el('div', { class: 'mail-row__subject' }, [
          mail.starred || mail.important ? el('span', { class: 'mail-row__star', html: icon('star') }) : null,
          el('span', {}, mail.subject),
          mail.attachments?.length ? el('span', { class: 'mail-row__clip', html: icon('clip') }) : null,
        ]),
        el('small', { class: 'mail-row__snippet' }, mail.body.replace(/\n+/g, ' ').slice(0, 70)),
      ]));
    }
    if (!mails.length) list.append(el('p', { class: 'mail__empty' }, 'Bu klasör boş.'));
  }

  function renderEmpty() {
    root.classList.remove('show-detail');
    clear(reader);
    reader.append(el('div', { class: 'mail__empty' }, 'Bir ileti seç'));
  }

  function openMail(mail) {
    playSound('click');
    current = mail;
    setFlag(readFlag(mail.id));
    renderFolders();
    renderList();

    clear(reader);
    root.classList.add('show-detail');
    const content_ = el('div', { class: 'mail__content' }, [
      mobileBack(() => root.classList.remove('show-detail'), 'İletiler'),
      el('h2', { class: 'mail__subject' }, mail.subject),
      el('div', { class: 'mail__meta' }, [
        el('span', { class: 'avatar mail__avatar' }, mail.from.name[0]),
        el('div', {}, [
          el('strong', {}, mail.from.name),
          el('small', {}, `<${mail.from.address}>`),
          el('small', {}, `Kime: ${mail.to}`),
        ]),
        el('small', { class: 'mail__date' }, `${formatDateLong(mail.date)} · ${mail.time}`),
      ]),
      mail.folder === 'drafts' ? el('div', { class: 'mail__draft-tag' }, 'Taslak — gönderilmedi') : null,
      el('div', { class: 'mail__body' }, mail.body),
      mail.attachments?.length ? el('div', { class: 'mail__attachments' }, mail.attachments.map((att) =>
        el('button', { class: 'attachment', onclick: () => openAttachment(att) }, [
          el('span', { html: icon('clip') }),
          el('span', {}, att.name),
          el('small', {}, att.size),
        ]))) : null,
    ]);
    reader.append(content_);
    gsap.from(content_, { opacity: 0, y: 6, duration: 0.25 });

    bus.emit('email:opened', { emailId: mail.id });
    if (mail.event) bus.emit(mail.event, { emailId: mail.id });
  }
}

function openAttachment(att) {
  playSound('error');
  const win = openWindow({ id: `att:${att.name}`, title: att.name, iconName: 'lock', width: 400, height: 210 });
  win.body.replaceChildren(el('div', { class: 'file-error' }, [
    el('strong', {}, att.name),
    el('p', {}, att.message),
  ]));
}
