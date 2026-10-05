/**
 * desktop.js — Sahte işletim sisteminin masaüstü.
 * ------------------------------------------------------------------
 * Parçalar:
 *   - duvar kâğıdı + masaüstü simgeleri (apps.json'dan; 'fromAct' alanına
 *     göre yeni perdede yeni simgeler belirir)
 *   - pencere katmanı (windowManager)
 *   - bildirim alanı (notifications)
 *   - görev çubuğu: başlat menüsü, açık pencereler, sistem tepsisi, saat
 *
 * Ayrıca perde geçişlerini (başlangıç, kapanış, kayıttan devam) yönetir.
 * ------------------------------------------------------------------
 */
import { gsap } from 'gsap';
import { content, getAppsForAct } from '../../engine/content.js';
import { bus } from '../../engine/eventBus.js';
import { getAct, getDifficulty, getItLog, hasFlag, isMuted, isUnlocked, resetGame, setDifficulty, setFlag } from '../../engine/state.js';
import { isActComplete, isActEndingPending, isActRunning, isActStarted, startAct } from '../../engine/game.js';
import { restartTimer, stopItTimer } from '../../engine/itScript.js';
import { playSound, toggleMuted } from '../../audio/sound.js';
import { clear, el, isTouch, onActivate } from '../dom.js';
import { icon } from '../icons.js';
import { closeAllWindows, focusWindow, initWindowLayer } from '../windowManager.js';
import { initNotifications, notify } from '../notifications.js';
import { launchApp } from '../appLauncher.js';
import { startClock } from '../clock.js';
import { goTo } from '../sceneRouter.js';
import { runActEnding, showSafeguard } from '../cliffhanger.js';
import { initItSupportUI, openItSupport, registerItAction } from '../apps/itSupport.js';
import { createObjectiveCard } from '../objectiveCard.js';
import { openSendWindow } from '../apps/sendEvidence.js';
import { appWindowId } from '../appLauncher.js';
import { getWindow } from '../windowManager.js';

export function renderDesktop(root, { firstTime = false } = {}) {
  const { story } = content;
  const unsubscribers = [];
  const timers = [];

  // ---- Masaüstü simgeleri ----------------------------------------
  const iconNodes = new Map(); // appId -> simge öğesi
  const iconGrid = el('div', { class: 'desk-icons' });

  /** Bu perdede görünmesi gereken simgeleri ekler; yenileri canlandırır. */
  function renderIcons({ animateNew = false } = {}) {
    for (const app of getAppsForAct(getAct()).filter((a) => a.desktop)) {
      if (iconNodes.has(app.id)) continue;
      const node = el('button', {
        class: 'desk-icon',
        'data-app': app.id,
        onkeydown: (e) => e.key === 'Enter' && launchApp(app.id),
        onclick: () => selectIcon(node),
      }, [
        el('span', {
          class: 'desk-icon__tile',
          style: { background: `linear-gradient(145deg, ${app.color[0]}, ${app.color[1]})` },
          html: icon(app.icon),
        }),
        el('span', { class: 'desk-icon__label' }, app.title),
        app.lockId ? el('span', { class: 'desk-icon__lock', html: icon('lock') }) : null,
      ]);
      onActivate(node, () => launchApp(app.id)); // çift tık / telefonda tek dokunuş
      iconNodes.set(app.id, node);
      iconGrid.append(node);
      if (animateNew) {
        node.classList.add('is-new');
        gsap.from(node, { scale: 0.4, opacity: 0, duration: 0.5, ease: 'back.out(2)' });
      }
    }
    refreshLockBadges();
  }

  function selectIcon(node) {
    iconNodes.forEach((n) => n.classList.toggle('is-selected', n === node));
  }

  function refreshLockBadges() {
    for (const app of content.apps) {
      iconNodes.get(app.id)?.classList.toggle('is-locked', Boolean(app.lockId) && !isUnlocked(app.lockId));
    }
  }

  // ---- Katmanlar -------------------------------------------------
  const windowLayer = el('div', { class: 'window-layer' });
  const toasts = el('div', { class: 'toasts' });

  // ---- Görev çubuğu ----------------------------------------------
  const taskButtons = el('div', { class: 'taskbar__apps' });
  const clockTime = el('span', { class: 'taskbar__time' });
  const clockDate = el('span', { class: 'taskbar__date' });
  const soundButton = el('button', { class: 'tray__btn', title: 'Ses', onclick: onToggleSound, html: icon(isMuted() ? 'mute' : 'sound') });
  const remoteSlot = el('span', { class: 'tray__remote', hidden: true });
  // 3. Perde sonundan, şirketin programı kapatılana kadar: "ekran paylaşılıyor"
  const shareIndicator = el('span', { class: 'tray__share', title: 'Ekranın uzaktan izleniyor', hidden: true }, '● Ekran paylaşılıyor');
  const refreshShare = () => { shareIndicator.hidden = !(hasFlag('act3Ending') && !hasFlag('mdmKilled')); };
  const networkIcon = el('span', { class: 'tray__icon' });
  const startButton = el('button', { class: 'taskbar__start', title: story.osName, html: icon('compass'), onclick: toggleStartMenu });
  const startMenu = el('div', { class: 'start-menu' });
  const objectiveCard = createObjectiveCard(); // "Sıradaki adım"
  unsubscribers.push(objectiveCard.destroy);

  const taskbar = el('footer', { class: 'taskbar' }, [
    startButton,
    taskButtons,
    el('div', { class: 'tray' }, [
      shareIndicator,
      remoteSlot,
      networkIcon,
      el('span', { class: 'tray__icon', title: 'Pil: %64', html: icon('battery') }),
      soundButton,
      el('div', { class: 'taskbar__clock' }, [clockTime, clockDate]),
    ]),
  ]);

  const desktop = el('div', { class: 'scene scene-desktop wallpaper' }, [
    el('div', { class: 'wallpaper__mark', html: icon('compass') }),
    iconGrid,
    objectiveCard.element,
    windowLayer,
    toasts,
    startMenu,
    taskbar,
  ]);
  root.append(desktop);
  renderIcons();

  // Masaüstüne boş tıklayınca seçimi ve başlat menüsünü kapat.
  desktop.addEventListener('pointerdown', (e) => {
    if (!e.target.closest('.desk-icon')) selectIcon(null);
    if (!e.target.closest('.start-menu, .taskbar__start')) startMenu.classList.remove('is-open');
  });

  initWindowLayer(windowLayer);
  initNotifications(toasts);
  const stopClock = startClock(clockTime, clockDate, { short: true });

  // ---- Sistem tepsisi: ağ ve uzak erişim kodu ---------------------
  function setNetwork(online) {
    networkIcon.innerHTML = icon(online ? 'wifi' : 'wifiOff');
    networkIcon.title = online ? `Bağlı: ${story.act2.networkName}` : 'Ağ bağlantısı yok';
    networkIcon.classList.toggle('is-online', online);
  }
  function setRemoteCode(code) {
    remoteSlot.hidden = !code;
    remoteSlot.textContent = code ?? '';
    if (code) gsap.from(remoteSlot, { opacity: 0, y: 6, duration: 0.3 });
  }
  setNetwork(hasFlag('networkOnline'));
  refreshShare();
  if (isActComplete(1)) setRemoteCode(content.support.remoteCode);

  // ---- BT Destek -------------------------------------------------
  unsubscribers.push(initItSupportUI());
  registerItAction('blockRemoteCode', () => {
    setFlag('triedToGiveRemoteCode'); // 4. Perde'deki sonlar için
    return showSafeguard(desktop);
  });

  // ---- Görev çubuğundaki pencere düğmeleri ------------------------
  unsubscribers.push(
    bus.on('window:opened', ({ id, title, iconName }) => {
      const btn = el('button', { class: 'taskbar__app', 'data-id': id, title, onclick: () => focusWindow(id) }, [
        el('span', { class: 'taskbar__app-icon', html: icon(iconName) }),
        el('span', { class: 'taskbar__app-title' }, title),
      ]);
      taskButtons.append(btn);
      gsap.from(btn, { opacity: 0, y: 8, duration: 0.2 });
    }),
    bus.on('window:closed', ({ id }) => taskButtons.querySelector(`[data-id="${CSS.escape(id)}"]`)?.remove()),
    bus.on('window:focused', ({ id }) => {
      taskButtons.querySelectorAll('.taskbar__app').forEach((b) => b.classList.toggle('is-active', b.dataset.id === id));
    }),
    bus.on('window:retitled', ({ id, title }) => {
      const label = taskButtons.querySelector(`[data-id="${CSS.escape(id)}"] .taskbar__app-title`);
      if (label) label.textContent = title;
    }),
    bus.on('lock:unlocked', refreshLockBadges),
    bus.on('state:changed', refreshShare),

    // 4. Perde: Zeynep'ten mesaj geldi ama Terminal kapalıysa haber ver.
    bus.on('zeynep:block', () => {
      if (getWindow(appWindowId('terminal'))) return;
      notify({ title: 'z@bozcaada', text: "Terminal'de yeni mesaj", iconName: 'terminal', onClick: () => launchApp('terminal') });
    }),
    // Kanıtlar birleşince (Zeynep'in mesajı okunsun diye biraz sonra) gönderme penceresi
    bus.on('evidence:merged', () => timers.push(setTimeout(openSendWindow, 3200))),
    bus.on('evidence:openSend', openSendWindow),

    // Perde sonu: glitch, sahte imleç, geri sayım...
    bus.on('act:ending', ({ act }) => runActEnding(act, { desktop, iconNodes, setRemoteCode, setNetwork })),

    // Yeni perde başladı (ör. 1. Perde sonu kartında "Devam"a basıldı)
    bus.on('act:started', ({ act }) => onActStarted(act)),
  );

  function onActStarted(act) {
    if (act === 2) {
      // BT Destek cihazın ağını uzaktan açtı.
      setFlag('networkOnline', true);
      setNetwork(true);
    }
    // Perdenin başlangıç bildirimleri: story.json > act2 / act3 ...
    const notes = story[`act${act}`]?.startNotifications ?? [];
    notes.forEach((n, i) => timers.push(setTimeout(
      () => notify({ title: n.title, text: n.text, iconName: n.icon, sound: i === 0 ? 'notify' : null }), 400 + i * 700)));
    renderIcons({ animateNew: true });
  }

  // ---- Açılış: animasyonlar ve kayıttan devam ---------------------
  gsap.from(iconGrid.children, { opacity: 0, x: -12, duration: 0.35, stagger: 0.05, delay: 0.1 });
  gsap.from(taskbar, { y: 60, duration: 0.4, ease: 'power3.out' });

  const act = getAct();
  if (isActComplete(1)) {
    // 1. Perde bittiyse BT Destek penceresi açık kalsın (animasyonsuz, tüm geçmişiyle).
    timers.push(setTimeout(() => openItSupport({ instant: true }), 300));
  }

  if (isActEndingPending(act)) {
    // Kapanış sırasında sayfa yenilendiyse kapanışı tekrar oynat.
    timers.push(setTimeout(() => bus.emit('act:ending', { act }), 900));
  } else if (act >= 2 && !isActStarted(act) && isActComplete(act - 1) && act <= content.story.acts.length) {
    // Önceki perde bitti ama yenisi hiç başlatılmadı (kart kapatılmadan yenilendi).
    timers.push(setTimeout(() => startAct(act), 1200));
  } else if (isActRunning(act) && act >= 2) {
    // Perde sürüyor: zamanlı BT Destek mesajlarının sayacını başlat.
    restartTimer();
    // 4. Perde'de kanıtlar birleştirilmişse karar penceresi açık gelsin.
    if (act === 4 && hasFlag('evidenceMerged')) timers.push(setTimeout(openSendWindow, 900));
  } else if (act === 1) {
    if (!hasFlag('welcomed')) {
      setFlag('welcomed');
      timers.push(setTimeout(() => notify({ title: story.osName, text: isTouch() ? story.desktop.welcomeHintTouch : story.desktop.welcomeHint, iconName: 'info', duration: 6000, sound: null }), 600));
    }
    if (!isUnlocked('messages')) {
      const unread = content.conversations.reduce((sum, c) => sum + (c.unread ?? 0), 0);
      const n = story.desktop.unreadNotification;
      timers.push(setTimeout(() => notify({
        title: n.title,
        text: n.text.replace('{count}', unread),
        iconName: 'messages',
        duration: 7000,
        onClick: () => launchApp('messages'),
      }), firstTime ? 1800 : 1200));
    }
  }

  // ---- Başlat menüsü ---------------------------------------------
  function renderStartMenu() {
    const item = (iconName, label, onClick) =>
      el('button', { class: 'start-menu__item', onclick: () => { startMenu.classList.remove('is-open'); onClick(); } }, [
        el('span', { html: icon(iconName) }), el('span', {}, label),
      ]);

    clear(startMenu);
    startMenu.append(
      el('div', { class: 'start-menu__user' }, [
        el('span', { class: 'start-menu__avatar' }, story.user.initial),
        el('div', {}, [el('strong', {}, story.user.fullName), el('small', {}, `${story.osName} ${story.osVersion}`)]),
      ]),
      ...getAppsForAct(getAct()).filter((a) => a.desktop).map((app) => item(app.icon, app.title, () => launchApp(app.id))),
      // BT Destek penceresi kapatıldıysa buradan tekrar açılabilir.
      getItLog().length || isActComplete(1) ? item('support', 'BT Destek', () => openItSupport({ instant: true })) : null,
      el('hr'),
      difficultyItem(item),
      item('lock', 'Ekranı kilitle', () => goTo('login')),
      item('power', 'Başlık ekranına dön', () => goTo('title')),
      item('close', 'İlerlemeyi sıfırla', () => {
        if (confirm('Tüm ilerleme silinecek. Emin misin?')) {
          resetGame();
          goTo('title');
        }
      }),
    );
  }

  /** Başlat menüsü: "Zorluk: Normal" → tıklayınca diğerine geçer. */
  function difficultyItem(item) {
    const options = story.difficulty.options;
    const current = options.find((o) => o.id === getDifficulty());
    const next = options.find((o) => o.id !== current.id);
    return item('key', `${story.difficulty.label}: ${current.name} (→ ${next.name})`, () => {
      setDifficulty(next.id);
      notify({ title: story.osName, text: story.difficulty.changedNotification.replace('{name}', next.name), iconName: 'info', sound: null });
    });
  }

  function toggleStartMenu() {
    playSound('click');
    if (!startMenu.classList.contains('is-open')) renderStartMenu();
    startMenu.classList.toggle('is-open');
  }

  function onToggleSound() {
    const muted = toggleMuted();
    soundButton.innerHTML = icon(muted ? 'mute' : 'sound');
  }

  // Sahne kapanırken her şeyi temizle.
  return () => {
    unsubscribers.forEach((off) => off());
    timers.forEach(clearTimeout);
    stopItTimer();
    stopClock();
    closeAllWindows();
  };
}
