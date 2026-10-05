/**
 * apps/index.js — Uygulama çizicilerinin kaydı.
 * ------------------------------------------------------------------
 * apps.json'daki "renderer" alanı buradaki anahtarlardan biridir.
 * Yeni bir uygulama eklemek için:
 *   1. src/ui/apps/ içinde render fonksiyonunu yaz: (body, { app, win }) => {}
 *   2. Buraya ekle
 *   3. apps.json'a uygulama tanımını ekle
 * ------------------------------------------------------------------
 */
import { renderPhotos } from './photos.js';
import { renderNotes } from './notes.js';
import { renderMessages } from './messages.js';
import { renderTrash } from './trash.js';
import { renderArchive } from './archive.js';
import { renderCargoNote } from './cargoNote.js';
import { renderBrowser } from './browser.js';
import { renderEmail } from './email.js';
import { renderTerminal } from './terminal.js';

export const renderers = {
  photos: renderPhotos,
  notes: renderNotes,
  messages: renderMessages,
  trash: renderTrash,
  archive: renderArchive,
  cargoNote: renderCargoNote,
  browser: renderBrowser, // 2. Perde
  email: renderEmail,     // 2. Perde
  terminal: renderTerminal, // 3. Perde
};
