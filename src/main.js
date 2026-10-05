/**
 * main.js — Oyunun giriş noktası.
 * ------------------------------------------------------------------
 * Klasör yapısı:
 *   src/data/     → BÜTÜN hikâye içeriği (JSON). Bulmaca eklemek için burası.
 *   src/engine/   → Oyun mantığı (kayıt, şifre kontrolü, perde akışı).
 *                   Arayüzden bağımsızdır; DOM'a dokunmaz.
 *   src/ui/       → Ekranda görünen her şey (sahneler, pencereler, uygulamalar).
 *   src/audio/    → Ses efektleri (Howler.js).
 *   src/styles/   → CSS.
 * ------------------------------------------------------------------
 */
import './styles/base.css';
import './styles/scenes.css';
import './styles/desktop.css';
import './styles/windows.css';
import './styles/apps.css';
import './styles/effects.css';
import './styles/responsive.css'; // telefon düzeni — en sonda olmalı

import { initGameLogic } from './engine/game.js';
import { initItScript } from './engine/itScript.js';
import { initZeynepChannel } from './engine/zeynepChannel.js';
import { initSound } from './audio/sound.js';
import { initRouter, registerScene, goTo } from './ui/sceneRouter.js';
import { renderTitleScreen } from './ui/scenes/titleScreen.js';
import { renderIntro } from './ui/scenes/intro.js';
import { renderBoot } from './ui/scenes/boot.js';
import { renderLogin } from './ui/scenes/login.js';
import { renderDesktop } from './ui/scenes/desktop.js';
import { renderEnding } from './ui/scenes/ending.js';

initSound();
initGameLogic();
initItScript(); // BT Destek senaryosu (2. Perde'den itibaren)
initZeynepChannel(); // Zeynep'in Terminal mesajları (4. Perde)

initRouter(document.getElementById('app'));
registerScene('title', renderTitleScreen);
registerScene('intro', renderIntro);
registerScene('boot', renderBoot);
registerScene('login', renderLogin);
registerScene('desktop', renderDesktop);
registerScene('ending', renderEnding);

goTo('title');
