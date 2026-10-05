/**
 * messages.js — Mesajlar uygulaması.
 * ------------------------------------------------------------------
 * Bir sohbet İLK kez açıldığında:
 *   - eski (okunmuş) mesajlar hızlıca art arda akar,
 *   - okunmamış mesajlar ise "yazıyor..." animasyonuyla teker teker gelir.
 * "Hepsini göster" ya da sohbet alanına tıklamak animasyonu atlar.
 * Sonraki açılışlarda sohbet anında, tamamı görünür (state.js'te
 * "görüldü" olarak kaydedilir).
 * ------------------------------------------------------------------
 */
import { gsap } from 'gsap';
import { content } from '../../engine/content.js';
import { hasSeenConversation, markConversationSeen } from '../../engine/state.js';
import { playSound } from '../../audio/sound.js';
import { clear, el, mobileBack, wait } from '../dom.js';

const ME = 'me';

export function renderMessages(body, { win }) {
  const conversations = content.conversations;
  let current = null;
  let playToken = 0; // her yeni oynatmada artar; eski animasyon kendini durdurur

  const list = el('aside', { class: 'app-sidebar msgs__list' });
  const chat = el('section', { class: 'msgs__chat' });
  // Telefonda .show-detail sınıfı listeyi gizleyip sohbeti gösterir (responsive.css).
  const root = el('div', { class: 'app msgs' }, [list, chat]);
  body.append(root);

  renderList();
  chat.append(el('div', { class: 'msgs__empty' }, 'Bir sohbet seç'));

  // Pencere kapanırsa süren animasyon dursun.
  const previousOnClose = win.onClose;
  win.onClose = () => { playToken++; previousOnClose?.(); };

  // ---- Sohbet listesi --------------------------------------------
  function renderList() {
    clear(list);
    list.append(el('h4', { class: 'app-sidebar__title' }, 'Sohbetler'));
    for (const convo of conversations) {
      const last = [...convo.messages].reverse().find((m) => m.text);
      const unread = hasSeenConversation(convo.id) ? 0 : convo.unread ?? 0;
      list.append(el('button', {
        class: `msgs__item ${convo === current ? 'is-active' : ''}`,
        onclick: () => openConversation(convo),
      }, [
        avatar(convo.avatar),
        el('div', { class: 'msgs__item-text' }, [
          el('strong', {}, convo.name),
          el('small', {}, last ? last.text : ''),
        ]),
        el('div', { class: 'msgs__item-meta' }, [
          el('small', {}, lastDay(convo)),
          unread ? el('span', { class: 'badge' }, unread) : null,
        ]),
      ]));
    }
  }

  // ---- Sohbet görünümü -------------------------------------------
  function openConversation(convo) {
    playSound('click');
    current = convo;
    root.classList.add('show-detail');
    const token = ++playToken;
    renderList();
    clear(chat);

    const subtitle = convo.isGroup
      ? Object.values(convo.participants).map((p) => p.name).concat('Sen').join(', ')
      : convo.subtitle ?? '';
    const scroller = el('div', { class: 'msgs__scroll' });
    const skipButton = el('button', { class: 'btn btn--small msgs__skip' }, 'Hepsini göster ⏭');

    chat.append(
      el('header', { class: 'msgs__head' }, [
        mobileBack(() => root.classList.remove('show-detail'), 'Sohbetler'),
        avatar(convo.avatar),
        el('div', {}, [el('strong', {}, convo.name), el('small', {}, subtitle)]),
        skipButton,
      ]),
      scroller,
      el('footer', { class: 'msgs__compose' }, [
        el('input', { disabled: true, placeholder: 'Bu cihazdan mesaj gönderilemiyor — ağ bağlantısı yok' }),
      ]),
    );

    if (hasSeenConversation(convo.id)) {
      skipButton.remove();
      convo.messages.forEach((m, i) => scroller.append(renderItem(convo, m, convo.messages[i - 1])));
      scroller.scrollTop = scroller.scrollHeight;
      return;
    }

    playConversation(convo, scroller, skipButton, token);
  }

  /** Mesajları teker teker oynatır. */
  async function playConversation(convo, scroller, skipButton, token) {
    let skipped = false;
    const skip = () => { skipped = true; };
    skipButton.addEventListener('click', skip);
    scroller.addEventListener('click', skip);

    const firstUnread = convo.messages.length - countUnreadItems(convo);
    const isAlive = () => token === playToken;

    for (let i = 0; i < convo.messages.length; i++) {
      if (!isAlive()) return;
      const message = convo.messages[i];
      const isUnread = i >= firstUnread;

      if (!skipped && message.text) {
        if (isUnread && message.from !== ME) {
          // "yazıyor..." göstergesi, uzunluğa göre kısa bir süre
          const typing = typingIndicator(convo, message.from);
          scroller.append(typing);
          scrollToBottom(scroller);
          await wait(Math.min(1100, 350 + message.text.length * 12));
          typing.remove();
          if (!isAlive()) return;
        } else {
          await wait(isUnread ? 300 : 55); // eski mesajlar hızlı aksın
        }
      }
      if (!isAlive()) return;

      const node = renderItem(convo, message, convo.messages[i - 1]);
      scroller.append(node);
      if (!skipped && message.text) {
        gsap.from(node, { opacity: 0, y: 10, scale: 0.97, duration: 0.22, ease: 'power2.out' });
        if (isUnread) playSound('message');
      }
      scrollToBottom(scroller, !skipped);
    }

    skipButton.remove();
    markConversationSeen(convo.id);
    renderList();
  }

  // ---- Yardımcılar -----------------------------------------------
  function renderItem(convo, message, previous) {
    if (message.day) return el('div', { class: 'msgs__day' }, message.day);

    const mine = message.from === ME;
    const sender = convo.participants[message.from];
    // Grup sohbetinde, gönderen değiştiğinde ismini göster.
    const showName = convo.isGroup && !mine && previous?.from !== message.from;

    return el('div', { class: `bubble-row ${mine ? 'bubble-row--me' : ''}` }, [
      el('div', { class: `bubble ${mine ? 'bubble--me' : ''}` }, [
        showName ? el('span', { class: 'bubble__name', style: { color: sender?.color } }, sender?.name) : null,
        el('span', { class: 'bubble__text' }, message.text),
        el('span', { class: 'bubble__time' }, message.time),
      ]),
    ]);
  }

  function typingIndicator(convo, from) {
    const name = convo.participants[from]?.name ?? '';
    return el('div', { class: 'typing' }, [
      el('span', { class: 'typing__dots' }, [el('i'), el('i'), el('i')]),
      el('small', {}, `${name} yazıyor...`),
    ]);
  }
}

function avatar({ initials, color }) {
  return el('span', { class: 'avatar', style: { background: color } }, initials);
}

function lastDay(convo) {
  return [...convo.messages].reverse().find((m) => m.day)?.day ?? '';
}

/** Okunmamış mesajları (gün ayırıcıları dahil) kapsayan öğe sayısı. */
function countUnreadItems(convo) {
  let remaining = convo.unread ?? 0;
  let count = 0;
  for (let i = convo.messages.length - 1; i >= 0 && remaining > 0; i--) {
    count++;
    if (convo.messages[i].text) remaining--;
  }
  // Okunmamışların hemen önündeki gün ayırıcısı da "yeni" sayılsın.
  const before = convo.messages[convo.messages.length - count - 1];
  return before?.day ? count + 1 : count;
}

function scrollToBottom(scroller, smooth = true) {
  scroller.scrollTo({ top: scroller.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
}
