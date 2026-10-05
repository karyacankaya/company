/**
 * content.js — Bütün hikâye içeriğinin tek giriş kapısı.
 * ------------------------------------------------------------------
 * JSON dosyaları burada içe aktarılır (Vite JSON'u doğrudan modül
 * olarak yükleyebilir). Kodun geri kalanı JSON dosyalarını tek tek
 * değil, buradan alır. Yeni bir içerik dosyası (ör. AŞAMA 2'de
 * emails.json) eklendiğinde sadece buraya bir satır eklemek yeter.
 * ------------------------------------------------------------------
 */
import story from '../data/story.json';
import appsData from '../data/apps.json';
import puzzlesData from '../data/puzzles.json';
import photosData from '../data/photos.json';
import notesData from '../data/notes.json';
import messagesData from '../data/messages.json';
import trashData from '../data/trash.json';
import assets from '../data/assets.json';
import support from '../data/support.json';
import browserData from '../data/browser.json';
import emailData from '../data/emails.json';
import terminalData from '../data/terminal.json';
import objectivesData from '../data/objectives.json';
import endingsData from '../data/endings.json';

export const content = {
  story,
  apps: appsData.apps,
  locks: puzzlesData.locks,
  photos: photosData.photos,
  notes: notesData.notes,
  conversations: messagesData.conversations,
  trash: trashData,
  assets,
  support,          // BT Destek senaryosu
  browser: browserData,
  email: emailData,
  terminal: terminalData, // 3. Perde
  objectives: objectivesData.objectives,
  endings: endingsData,   // 4. Perde
};

/** id ile uygulama tanımını bulur. */
export function getApp(appId) {
  return content.apps.find((app) => app.id === appId);
}

/** Verilen perdede görünür olan uygulamalar ('fromAct' alanına göre). */
export function getAppsForAct(act) {
  return content.apps.filter((app) => (app.fromAct ?? 1) <= act);
}
