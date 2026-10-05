/**
 * sound.js — Howler.js ile ses efektleri.
 * ------------------------------------------------------------------
 * Ses dosyalarının yolları src/data/assets.json > sounds içindedir.
 * Kullanım:  playSound('click')
 *
 * Not: Tarayıcılar, kullanıcı sayfaya en az bir kez tıklamadan ses
 * çalmaya izin vermez. Bu yüzden oyun bir "Başla" ekranıyla açılır.
 * ------------------------------------------------------------------
 */
import { Howl, Howler } from 'howler';
import { content } from '../engine/content.js';
import { isMuted, setMuted as saveMuted } from '../engine/state.js';

const sounds = {};

export function initSound() {
  for (const [name, def] of Object.entries(content.assets.sounds)) {
    sounds[name] = new Howl({ src: [def.src], volume: def.volume ?? 0.5, preload: true });
  }
  Howler.mute(isMuted());
}

export function playSound(name) {
  sounds[name]?.play();
}

export function toggleMuted() {
  const muted = !isMuted();
  saveMuted(muted);
  Howler.mute(muted);
  return muted;
}
