/**
 * media.js — Görselleri (ya da yer tutucularını) çizer.
 * ------------------------------------------------------------------
 * assets.json > images içinde bir görselin "src" alanı doluysa gerçek
 * <img> gösterilir; boşsa renkli bir yer tutucu kutu çizilir.
 * Gerçek fotoğrafları eklediğinde kodda hiçbir şeyi değiştirmen gerekmez.
 * ------------------------------------------------------------------
 */
import { content } from '../engine/content.js';
import { el } from './dom.js';

export function hasRealImage(assetId) {
  return Boolean(content.assets.images[assetId]?.src);
}

/**
 * @param {string} assetId  assets.json içindeki anahtar
 * @param {object} options  { className, showLabel }
 */
export function renderImage(assetId, { className = '', showLabel = false } = {}) {
  const asset = content.assets.images[assetId];

  if (asset?.src) {
    return el('img', { class: `media ${className}`, src: asset.src, alt: asset.placeholder?.label ?? '', draggable: 'false' });
  }

  const ph = asset?.placeholder ?? { colors: ['#333', '#111'], emoji: '?', label: assetId };
  return el(
    'div',
    {
      class: `media media--placeholder ${className}`,
      style: { background: `linear-gradient(135deg, ${ph.colors[0]}, ${ph.colors[1]})` },
      title: `Yer tutucu: ${ph.label}`,
    },
    [
      el('span', { class: 'media__emoji' }, ph.emoji),
      showLabel ? el('span', { class: 'media__label' }, ph.label) : null,
    ],
  );
}
