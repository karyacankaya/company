/**
 * passwordForm.js — Şifre / PIN kutusu (giriş ekranında ve kilitli
 * uygulamalarda ortak kullanılır).
 * ------------------------------------------------------------------
 * Şifrenin doğru olup olmadığına engine/puzzles.js karar verir; bu
 * dosya sadece görüntüyü ve animasyonları yönetir:
 *   - yanlışta: kutu titrer + kırmızı yanıp söner + hata sesi
 *   - 3 yanlıştan sonra (puzzles.json'a göre) ipucu belirir
 *   - doğruda: kilit simgesi açılır + kilit sesi, sonra onSuccess()
 * ------------------------------------------------------------------
 */
import { gsap } from 'gsap';
import { checkAnswer, getActiveHint, getLock, hasMoreHints, revealNextHint } from '../engine/puzzles.js';
import { getAttempts } from '../engine/state.js';
import { playSound } from '../audio/sound.js';
import { el, replayClass, wait } from './dom.js';
import { lockIconSvg } from './icons.js';

/**
 * @param {object} o
 * @param {string}   o.lockId       puzzles.json içindeki kilit
 * @param {Function} o.onSuccess    şifre doğruysa (animasyondan sonra) çağrılır
 * @param {string}   [o.variant]    'window' (uygulama kilidi) | 'login' (giriş ekranı)
 * @param {Node}     [o.header]     kilit simgesi yerine gösterilecek öğe (ör. avatar)
 * @param {string}   [o.placeholder]
 * @returns {{ element: HTMLElement, focus: Function }}
 */
export function createPasswordForm({ lockId, onSuccess, variant = 'window', header = null, placeholder = 'Parola' }) {
  const lock = getLock(lockId);
  const isPin = lock.type === 'pin';
  let busy = false; // animasyon sürerken yeni deneme yapılmasın

  // ---- Parçalar --------------------------------------------------
  const lockIcon = el('div', { class: 'lockform__icon', html: lockIconSvg() });
  const stepLabel = lock.stepLabel ? el('span', { class: 'lockform__step' }, lock.stepLabel) : null;
  const title = el('h2', { class: 'lockform__title' }, lock.title);
  const subtitle = lock.subtitle ? el('p', { class: 'lockform__subtitle' }, lock.subtitle) : null;
  const status = el('p', { class: 'lockform__status' }, '');
  const hintBox = el('div', { class: 'lockform__hint', hidden: true });
  // "İpucu al": yanlış deneme yapmadan bir sonraki ipucunu açar.
  const hintButton = el('button', { type: 'button', class: 'lockform__hint-btn', onclick: onHintClick }, '💡 İpucu al');

  const box = el('div', { class: `lockform__box ${isPin ? 'lockform__box--pin' : ''}` });
  let input;           // metin şifresi için <input>
  let pinValue = '';   // PIN için girilen rakamlar
  let pinDots = [];

  if (isPin) {
    pinDots = Array.from({ length: lock.length }, () => el('span', { class: 'pin-dot' }));
    box.append(el('div', { class: 'pin-dots' }, pinDots));
  } else {
    input = el('input', {
      class: 'lockform__input',
      type: 'password',
      placeholder,
      autocomplete: 'off',
      spellcheck: 'false',
      'aria-label': placeholder,
    });
    const submit = el('button', { class: 'lockform__submit', type: 'submit', 'aria-label': 'Gönder', html: '&rarr;' });
    box.append(input, submit);
  }

  const form = el('form', { class: 'lockform__form', autocomplete: 'off' }, [box]);

  const keypad = isPin ? buildKeypad() : null;

  const element = el('div', { class: `lockform lockform--${variant}` }, [
    header ?? lockIcon,
    stepLabel,
    variant === 'window' ? title : null,
    subtitle,
    form,
    keypad,
    status,
    hintBox,
    hintButton,
  ]);

  // Daha önce yanlış denendiyse ipucu zaten açık olabilir.
  showHint(getActiveHint(lockId), false);
  updateHintButton();
  if (getAttempts(lockId) > 0) status.textContent = attemptText(getAttempts(lockId));

  // ---- Olaylar ---------------------------------------------------
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submit(isPin ? pinValue : input.value);
  });

  if (isPin) {
    // Fiziksel klavyeyle de PIN girilebilsin.
    element.tabIndex = 0;
    element.addEventListener('keydown', (e) => {
      if (/^[0-9]$/.test(e.key)) pressDigit(e.key);
      else if (e.key === 'Backspace') pressDelete();
    });
  } else {
    input.addEventListener('keydown', () => playSound('key'));
  }

  // ---- Fonksiyonlar ----------------------------------------------
  function buildKeypad() {
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'];
    return el('div', { class: 'keypad' }, keys.map((key) => {
      if (!key) return el('span');
      return el('button', {
        type: 'button',
        class: `keypad__key ${key === '⌫' ? 'keypad__key--del' : ''}`,
        onclick: () => (key === '⌫' ? pressDelete() : pressDigit(key)),
      }, key);
    }));
  }

  function pressDigit(digit) {
    if (busy || pinValue.length >= lock.length) return;
    playSound('key');
    pinValue += digit;
    renderPin();
    // Son rakam girilince otomatik gönder.
    if (pinValue.length === lock.length) setTimeout(() => submit(pinValue), 140);
  }

  function pressDelete() {
    if (busy) return;
    pinValue = pinValue.slice(0, -1);
    renderPin();
  }

  function renderPin() {
    pinDots.forEach((dot, i) => dot.classList.toggle('is-filled', i < pinValue.length));
  }

  async function submit(value) {
    if (busy || !value) return;
    busy = true;
    const result = checkAnswer(lockId, value);

    if (result.correct) {
      playSound('unlock');
      element.classList.add('is-correct');
      lockIcon.classList.add('is-open');
      status.textContent = 'Kilit açıldı';
      await wait(650);
      onSuccess?.();
      return;
    }

    // Yanlış: titret + kırmızı yanıp sön.
    playSound('error');
    replayClass(box, 'is-wrong');
    status.textContent = attemptText(result.attempts);
    if (isPin) {
      pinValue = '';
      setTimeout(renderPin, 250);
    } else {
      input.select();
    }
    showHint(result.hint, result.isNewHint);
    updateHintButton();
    await wait(380);
    busy = false;
  }

  function showHint(text, animate) {
    if (!text) return;
    hintBox.hidden = false;
    hintBox.innerHTML = '';
    hintBox.append(el('span', { class: 'lockform__hint-label' }, 'İpucu'), el('span', {}, text));
    if (animate) {
      gsap.fromTo(hintBox, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' });
    }
  }

  function onHintClick() {
    playSound('click');
    showHint(revealNextHint(lockId), true);
    updateHintButton();
  }

  function updateHintButton() {
    hintButton.hidden = !hasMoreHints(lockId);
    hintButton.textContent = getActiveHint(lockId) ? '💡 Daha açık ipucu' : '💡 İpucu al';
  }

  function attemptText(count) {
    return `Yanlış ${isPin ? 'PIN' : 'parola'} · ${count} deneme`;
  }

  return {
    element,
    focus: () => (isPin ? element.focus() : input.focus()),
  };
}
