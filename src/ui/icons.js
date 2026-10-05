/**
 * icons.js — Uygulama simgeleri (satır içi SVG).
 * ------------------------------------------------------------------
 * Simgeler bilerek basit ve özgün: macOS/Windows'tan kopya değil.
 * apps.json'daki "icon" alanı buradaki anahtarlardan biridir.
 * ------------------------------------------------------------------
 */
const S = 'fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';

const ICONS = {
  photos: `<svg viewBox="0 0 24 24" ${S}><rect x="3" y="5" width="18" height="14" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="M4 17l5-4.5 3.5 3 3-2.5L20 17"/></svg>`,
  messages: `<svg viewBox="0 0 24 24" ${S}><path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z"/><path d="M8.5 10h.01M12 10h.01M15.5 10h.01"/></svg>`,
  notes: `<svg viewBox="0 0 24 24" ${S}><path d="M6 3.5h9l4 4V20a.5.5 0 0 1-.5.5H6a.5.5 0 0 1-.5-.5V4a.5.5 0 0 1 .5-.5z"/><path d="M15 3.5V8h4M8.5 12h7M8.5 15.5h7M8.5 8.5h3"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" ${S}><path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13M10.5 10.5v6M13.5 10.5v6"/></svg>`,
  letter: `<svg viewBox="0 0 24 24" ${S}><rect x="3" y="6" width="18" height="12" rx="1.5"/><path d="M3.5 7l8.5 6 8.5-6"/></svg>`,
  archive: `<svg viewBox="0 0 24 24" ${S}><rect x="4" y="3.5" width="16" height="17" rx="2"/><path d="M12 3.5v2M12 7.5v2M12 11.5v2"/><rect x="10" y="14.5" width="4" height="3.5" rx="1"/></svg>`,
  support: `<svg viewBox="0 0 24 24" ${S}><path d="M5 13v-1a7 7 0 0 1 14 0v1"/><rect x="3.5" y="12.5" width="4" height="6" rx="1.5"/><rect x="16.5" y="12.5" width="4" height="6" rx="1.5"/><path d="M18.5 18.5c0 1.5-1.5 2.5-4.5 2.5"/></svg>`,
  image: `<svg viewBox="0 0 24 24" ${S}><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M4 16l4.5-4 4 3.5 3-2.5L20 16"/></svg>`,
  file: `<svg viewBox="0 0 24 24" ${S}><path d="M6.5 3.5h7.5l4 4v13h-11.5z"/><path d="M14 3.5V8h4"/></svg>`,
  remote: `<svg viewBox="0 0 24 24" ${S}><rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20h8M12 16v4M9 10l2 2 4-4"/></svg>`,
  sound: `<svg viewBox="0 0 24 24" ${S}><path d="M5 9.5h3l4-3.5v12l-4-3.5H5z"/><path d="M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>`,
  mute: `<svg viewBox="0 0 24 24" ${S}><path d="M5 9.5h3l4-3.5v12l-4-3.5H5z"/><path d="M16 9.5l5 5M21 9.5l-5 5"/></svg>`,
  browser: `<svg viewBox="0 0 24 24" ${S}><circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5S9.5 6.1 12 3.5z"/></svg>`,
  mail: `<svg viewBox="0 0 24 24" ${S}><path d="M4 7.5l8 5.5 8-5.5"/><path d="M4.5 5.5h15a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1v-11a1 1 0 0 1 1-1z"/><path d="M16 4l2-1.5"/></svg>`,
  search: `<svg viewBox="0 0 24 24" ${S}><circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/></svg>`,
  star: `<svg viewBox="0 0 24 24" ${S}><path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z"/></svg>`,
  clip: `<svg viewBox="0 0 24 24" ${S}><path d="M8.5 12.5l6-6a3 3 0 0 1 4.3 4.2l-7.8 7.8a4.5 4.5 0 0 1-6.4-6.3l7-7"/></svg>`,
  wifi: `<svg viewBox="0 0 24 24" ${S}><path d="M3 9a14 14 0 0 1 18 0M6 12.5a9 9 0 0 1 12 0M9.5 16a4 4 0 0 1 5 0M12 19.5h.01"/></svg>`,
  terminal: `<svg viewBox="0 0 24 24" ${S}><rect x="3" y="4.5" width="18" height="15" rx="2"/><path d="M7 9.5l3 2.5-3 2.5M12.5 15h4.5"/></svg>`,
  wifiOff: `<svg viewBox="0 0 24 24" ${S}><path d="M3 9a14 14 0 0 1 5-2.7M21 9a14 14 0 0 0-8-3M6 12.5a9 9 0 0 1 3-1.7M18 12.5a9 9 0 0 0-2.2-1.4M9.5 16a4 4 0 0 1 5 0M12 19.5h.01M4 4l16 16"/></svg>`,
  battery: `<svg viewBox="0 0 24 24" ${S}><rect x="3" y="7.5" width="16" height="9" rx="2"/><path d="M21 11v2"/><rect x="5" y="9.5" width="7" height="5" rx="0.5" fill="currentColor" stroke="none"/></svg>`,
  compass: `<svg viewBox="0 0 24 24" ${S}><circle cx="12" cy="12" r="8.5"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/></svg>`,
  back: `<svg viewBox="0 0 24 24" ${S}><path d="M14.5 6l-6 6 6 6"/></svg>`,
  next: `<svg viewBox="0 0 24 24" ${S}><path d="M9.5 6l6 6-6 6"/></svg>`,
  info: `<svg viewBox="0 0 24 24" ${S}><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 8h.01"/></svg>`,
  key: `<svg viewBox="0 0 24 24" ${S}><circle cx="8" cy="15" r="4"/><path d="M11 12l8.5-8.5M16 7l2.5 2.5M14 9l2 2"/></svg>`,
  close: `<svg viewBox="0 0 24 24" ${S}><path d="M7 7l10 10M17 7L7 17"/></svg>`,
  power: `<svg viewBox="0 0 24 24" ${S}><path d="M12 3.5v8M7 6.5a7 7 0 1 0 10 0"/></svg>`,
  lock: `<svg viewBox="0 0 24 24" ${S}><rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/></svg>`,
};

/** Simgenin SVG metnini döner (bilinmiyorsa "file"). */
export function icon(name) {
  return ICONS[name] ?? ICONS.file;
}

/**
 * Animasyonlu kilit simgesi: gövde + ayrı bir "kanca" (shackle).
 * Kilit açılınca CSS'te .is-open sınıfı kancayı yukarı kaldırıp döndürür.
 */
export function lockIconSvg() {
  return `<svg class="lock-icon" viewBox="0 0 48 48" aria-hidden="true">
    <path class="lock-icon__shackle" d="M15 22v-6a9 9 0 0 1 18 0v6" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round"/>
    <rect class="lock-icon__body" x="10" y="21" width="28" height="21" rx="5" fill="currentColor"/>
    <circle class="lock-icon__hole" cx="24" cy="30.5" r="2.6"/>
    <rect class="lock-icon__hole" x="22.8" y="31" width="2.4" height="5.5" rx="1.2"/>
  </svg>`;
}
