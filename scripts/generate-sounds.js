/**
 * generate-sounds.js
 * ------------------------------------------------------------------
 * Oyunun ince ses efektlerini (tıklama, bildirim, kilit açılma...)
 * hiçbir dış dosyaya ihtiyaç duymadan, matematikle üretir ve
 * public/sounds/ klasörüne .wav olarak yazar.
 *
 * Çalıştırmak için:  npm run sounds
 *
 * Kendi seslerini kullanmak istersen bu betiğe gerek yok: dosyaları
 * public/sounds/ içine koyup src/data/assets.json'daki yolları değiştir.
 * ------------------------------------------------------------------
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const SAMPLE_RATE = 44100;
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'sounds');
const TAU = Math.PI * 2;

/** Float örnekleri (-1..1) 16-bit mono WAV dosyasına çevirir. */
function toWav(samples) {
  const dataSize = samples.length * 2;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);          // fmt bloğu boyutu
  buf.writeUInt16LE(1, 20);           // PCM
  buf.writeUInt16LE(1, 22);           // mono
  buf.writeUInt32LE(SAMPLE_RATE, 24);
  buf.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  samples.forEach((s, i) => {
    const v = Math.max(-1, Math.min(1, s));
    buf.writeInt16LE(Math.round(v * 32767), 44 + i * 2);
  });
  return buf;
}

/** Verilen süre boyunca her an (t saniye) için fn(t) değerini örnekler. */
function render(duration, fn) {
  const n = Math.floor(SAMPLE_RATE * duration);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = fn(i / SAMPLE_RATE, i);
  // Sonda "çıt" sesi olmasın diye son 5 ms'yi yumuşakça kıs.
  const fade = Math.floor(SAMPLE_RATE * 0.005);
  for (let i = 0; i < fade; i++) out[n - 1 - i] *= i / fade;
  return out;
}

const noise = () => Math.random() * 2 - 1;
/** t anından sonra üstel sönümlenen zarf (start'tan önce 0). */
const decay = (t, start, time) => (t < start ? 0 : Math.exp(-(t - start) / time));
const sine = (t, f) => Math.sin(TAU * f * t);

const sounds = {
  // Kısa, kuru bir tık.
  click: render(0.05, (t) => noise() * decay(t, 0, 0.003) * 0.35 + sine(t, 1800) * decay(t, 0, 0.012) * 0.25),

  // Klavye/tuş takımı tuşu: daha yumuşak.
  key: render(0.04, (t) => noise() * decay(t, 0, 0.002) * 0.2 + sine(t, 1200) * decay(t, 0, 0.008) * 0.18),

  // İki notalı, cam gibi bildirim sesi.
  notify: render(0.6, (t) =>
    (sine(t, 987.8) + 0.3 * sine(t, 1975.5)) * decay(t, 0, 0.09) * 0.25 +
    (sine(t, 1318.5) + 0.3 * sine(t, 2637)) * decay(t, 0.11, 0.18) * 0.25),

  // Mesaj "pop" sesi: hızla yükselen kısa bir ton.
  message: render(0.15, (t) => sine(t, 520 + 2600 * t) * decay(t, 0, 0.04) * 0.35),

  // Kilit açılma: iki mekanik tık + yükselen üç notalı çan.
  unlock: render(0.9, (t) =>
    noise() * (decay(t, 0, 0.004) + decay(t, 0.07, 0.004)) * 0.4 +
    sine(t, 659.3) * decay(t, 0.12, 0.25) * 0.2 +
    sine(t, 987.8) * decay(t, 0.22, 0.25) * 0.2 +
    sine(t, 1318.5) * decay(t, 0.32, 0.35) * 0.2),

  // Yanlış şifre: iki kısa, boğuk vızıltı.
  error: render(0.34, (t) => {
    const on = (t < 0.12) || (t > 0.17 && t < 0.29);
    if (!on) return 0;
    const f = 140;
    return (sine(t, f) + 0.45 * sine(t, f * 3) + 0.2 * sine(t, f * 5)) * 0.22;
  }),

  // Glitch: her 25 ms'de rastgele değişen, "bit kırpılmış" gürültü/kare dalga.
  glitch: (() => {
    let seg = -1, freq = 200, mode = 0;
    return render(0.75, (t) => {
      const s = Math.floor(t / 0.025);
      if (s !== seg) { seg = s; freq = 80 + Math.random() * 1600; mode = Math.floor(Math.random() * 3); }
      const env = 0.3 * (1 - t / 0.75);
      if (mode === 0) return Math.round(noise() * 4) / 4 * env;            // kaba gürültü
      if (mode === 1) return (sine(t, freq) > 0 ? 1 : -1) * env * 0.6;      // kare dalga
      return 0;                                                            // sessizlik boşluğu
    });
  })(),

  // Açılış uğultusu + sonda yumuşak bir çan (logo için).
  boot: render(2.0, (t) => {
    const swell = Math.min(1, t / 0.8) * Math.exp(-Math.max(0, t - 0.9) / 0.5);
    return (sine(t, 55) * 0.4 + sine(t, 82.4) * 0.25 + sine(t, 110) * 0.15) * swell * 0.5 +
      (sine(t, 784) + 0.4 * sine(t, 1568)) * decay(t, 0.9, 0.4) * 0.12;
  }),
};

mkdirSync(OUT_DIR, { recursive: true });
for (const [name, samples] of Object.entries(sounds)) {
  writeFileSync(join(OUT_DIR, `${name}.wav`), toWav(samples));
  console.log(`✓ ${name}.wav`);
}
