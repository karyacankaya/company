/**
 * terminal.js — Terminal uygulaması (arayüz).
 * ------------------------------------------------------------------
 * Komutların ne yaptığına engine/terminal.js karar verir; bu dosya:
 *   - çıktıyı satır satır basar,
 *   - komut geçmişini (↑/↓) ve Tab tamamlamayı yönetir.
 * ------------------------------------------------------------------
 */
import { content } from '../../engine/content.js';
import { createTerminalSession } from '../../engine/terminal.js';
import { getDeliveredLines } from '../../engine/zeynepChannel.js';
import { bus } from '../../engine/eventBus.js';
import { playSound } from '../../audio/sound.js';
import { el, wait } from '../dom.js';

export function renderTerminal(body, { win }) {
  const session = createTerminalSession();
  const history = [];   // daha önce yazılan komutlar
  let historyIndex = 0;
  let busy = false;

  const output = el('div', { class: 'term__output' });
  const promptLabel = el('span', { class: 'term__prompt' }, session.prompt());
  const input = el('input', { class: 'term__input', spellcheck: 'false', autocomplete: 'off', 'aria-label': 'Komut' });
  // Telefon klavyelerinde Tab tuşu yok: ekranda bir Tab düğmesi (sadece dokunmatikte görünür).
  const tabButton = el('button', { class: 'term__tab-btn', type: 'button', onclick: (e) => { e.preventDefault(); completeInput(); input.focus(); } }, 'Tab ⇥');
  const screen = el('div', { class: 'app term' }, [output, el('label', { class: 'term__line' }, [promptLabel, input, tabButton])]);
  body.append(screen);

  // Pencerenin herhangi bir yerine tıklayınca yazma alanına odaklan.
  screen.addEventListener('click', () => {
    if (!window.getSelection()?.toString()) input.focus();
  });

  printLines(content.terminal.welcome.map((text) => ({ text, tone: 'muted' })), { instant: true });
  // 4. Perde: Zeynep'in şimdiye kadarki mesajları
  printLines(getDeliveredLines().map(channelLine), { instant: true });
  setTimeout(() => input.focus(), 80);

  // Pencere açıkken Zeynep'ten yeni mesaj gelirse satır satır bas.
  let channelQueue = Promise.resolve();
  const offChannel = bus.on('zeynep:block', ({ block }) => {
    channelQueue = channelQueue.then(async () => {
      await wait(busy ? 600 : 300);
      playSound('message');
      await printLines(block.lines.map(channelLine), { instant: false, delay: 420 });
    });
  });
  const previousOnClose = win.onClose;
  win.onClose = () => { offChannel(); previousOnClose?.(); };

  input.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (busy) return;
      const line = input.value;
      input.value = '';
      if (line.trim()) history.push(line);
      historyIndex = history.length;
      await execute(line);
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      historyIndex = Math.max(0, Math.min(history.length, historyIndex + (e.key === 'ArrowUp' ? -1 : 1)));
      input.value = history[historyIndex] ?? '';
    } else if (e.key === 'Tab') {
      e.preventDefault();
      completeInput();
    } else {
      playSound('key');
    }
  });

  /** Tab tamamlama (klavyeden ya da ekrandaki düğmeden). */
  function completeInput() {
    const { line, options } = session.complete(input.value);
    input.value = line;
    if (options.length > 1) printLines([{ text: options.join('    '), tone: 'muted' }], { instant: true });
  }

  async function execute(line) {
    // Yazılan komutu ekrana "eko" olarak bas.
    output.append(el('div', { class: 'term__row' }, [el('span', { class: 'term__prompt' }, session.prompt()), ` ${line}`]));
    const result = session.run(line);
    if (result.clear) output.replaceChildren();
    if (result.failed) playSound('error');
    if (result.success) playSound('unlock');
    busy = true;
    // Başarılı çözümde satırlar tek tek aksın (daha dramatik).
    await printLines(result.lines, { instant: !result.success });
    busy = false;
    promptLabel.textContent = session.prompt();
    if (win.el.isConnected) input.focus();
  }

  async function printLines(lines, { instant, delay = 140 }) {
    for (const { text, tone } of lines) {
      output.append(el('div', { class: `term__row term__row--${tone}` }, text || ' '));
      screen.scrollTop = screen.scrollHeight;
      if (!instant) await wait(text ? delay : 60);
    }
    screen.scrollTop = screen.scrollHeight;
  }
}

/** Kanal satırının rengi: Zeynep'in sözleri ve kanal bildirimleri farklı. */
function channelLine(text) {
  return { text, tone: text.startsWith('[kanal]') ? 'channel' : text.startsWith('(') ? 'muted' : 'zeynep' };
}
