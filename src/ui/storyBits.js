/**
 * storyBits.js — Birden fazla yerde gösterilen hikâye parçaları:
 * Zeynep'in notu ve ortak anılar. (Giriş sahnesi, giriş ekranındaki
 * "Notu tekrar oku" penceresi ve masaüstündeki "Kargo Notu".)
 */
import { content } from '../engine/content.js';
import { isEasy } from '../engine/state.js';
import { el } from './dom.js';

/** Elle yazılmış görünümlü kâğıt not. */
export function renderNoteCard() {
  const { note } = content.story.intro;
  return el('div', { class: 'paper-note' }, [
    el('p', { class: 'paper-note__text' }, note.text),
    el('p', { class: 'paper-note__sign' }, note.signature),
  ]);
}

/** Üç anı kartı. */
export function renderMemories() {
  const { memories } = content.story.intro;
  return el('div', { class: 'memories' }, memories.map((memory) =>
    el('article', { class: 'memory' }, [
      el('header', { class: 'memory__head' }, [
        el('span', { class: 'memory__year' }, memory.year),
        // Kolay zorlukta ilk tanışma anısının başlığı bunu açıkça söyler.
        el('h3', { class: 'memory__title' }, isEasy() && memory.easyTitle ? memory.easyTitle : memory.title),
      ]),
      el('p', { class: 'memory__text' }, memory.text),
    ]),
  ));
}
