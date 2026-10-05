/**
 * terminal.js — Terminal uygulamasının mantığı (komutlar, dosya sistemi).
 * ------------------------------------------------------------------
 * Ekrana hiçbir şey çizmez: bir komut satırı alır, ekrana basılacak
 * satırları döner. Çizim ui/apps/terminal.js'te.
 *
 *   const session = createTerminalSession();
 *   session.run('ls')  →  { lines: [{ text: 'beni_oku.txt', tone: 'file' }, ...] }
 *
 * Dosya sistemi src/data/terminal.json'dadır. Şifreli (.enc) dosyalar
 * "decrypt" ile çözülür; anahtar kontrolü ve ipuçları, diğer bütün
 * kilitlerde olduğu gibi engine/puzzles.js üzerinden yapılır.
 * ------------------------------------------------------------------
 */
import { content } from './content.js';
import { bus } from './eventBus.js';
import { normalizeAnswer, formatDateLong } from './text.js';
import { checkAnswer, getActiveHint, hasMoreHints, revealNextHint } from './puzzles.js';
import { getAct, hasFlag, isUnlocked, setFlag } from './state.js';

/** 4. Perde oynanıyor mu? (karar verilmeden önce) */
const isActRunning4 = () => getAct() === 4 && !hasFlag('act4Ending');

// Komut adları ve eş anlamlıları (yazım kolaylığı için).
const ALIASES = {
  yardim: 'yardim', help: 'yardim', '?': 'yardim',
  ls: 'ls', dir: 'ls',
  cd: 'cd',
  cat: 'cat', oku: 'cat', type: 'cat',
  decrypt: 'decrypt', coz: 'decrypt',
  ipucu: 'ipucu', hint: 'ipucu',
  pwd: 'pwd', whoami: 'whoami', clear: 'clear', temizle: 'clear', date: 'date',
  // 4. Perde
  ps: 'ps', kill: 'kill',
  birlestir: 'birlestir', merge: 'birlestir',
  gonder: 'gonder', send: 'gonder',
};

const HELP = [
  'Komutlar:',
  '  ls [klasör]                 klasördeki dosyaları listeler',
  '  cd <klasör>                 klasöre girer  (cd .. → geri, cd → ana klasör)',
  '  cat <dosya>                 metin dosyasını okur',
  '  decrypt <dosya> <anahtar>   şifreli (.enc) dosyayı çözer',
  '  ps                          çalışan programları listeler',
  '  kill <PID>                  bir programı kapatır',
  '  birlestir                   kanıt parçalarını tek dosyada toplar',
  '  gonder                      kanıtları gönderme penceresini açar',
  '  ipucu                       takıldıysan küçük bir ipucu verir',
  '  clear                       ekranı temizler',
  '  pwd · whoami · date',
  '',
  'Kısayollar: Tab = otomatik tamamlama · ↑/↓ = önceki komutlar',
];

export function createTerminalSession() {
  const data = content.terminal;
  let cwd = []; // ana klasöre göre yol, ör. ['kanit_parca2']

  // ---- Dosya sistemi yardımcıları --------------------------------
  /** Bir öğe görünür mü? ('requires' kilidi açılmadıysa gizli) */
  const visible = (node) =>
    (!node.requires || isUnlocked(node.requires)) && (!node.requiresFlag || hasFlag(node.requiresFlag));

  /** "a/b/../c" gibi bir yolu, mevcut klasöre göre parça listesine çevirir. */
  function resolvePath(pathText = '') {
    const parts = pathText.startsWith('~') || pathText.startsWith('/') ? [] : [...cwd];
    for (const part of pathText.replace(/^~\/?/, '').split('/')) {
      if (!part || part === '.') continue;
      if (part === '..') parts.pop();
      else parts.push(part);
    }
    return parts;
  }

  /** Parça listesindeki öğeyi bulur (büyük/küçük harf ve Türkçe karakter duyarsız). */
  function getNode(parts) {
    let node = data.fs;
    for (const part of parts) {
      if (node.type !== 'dir') return null;
      const name = findChildName(node, part);
      if (!name) return null;
      node = node.children[name];
    }
    return node;
  }

  function findChildName(dir, name) {
    const wanted = normalizeAnswer(name);
    return Object.keys(dir.children).find((key) => visible(dir.children[key]) && normalizeAnswer(key) === wanted) ?? null;
  }

  const pathLabel = (parts) => (parts.length ? `~/${parts.join('/')}` : '~');

  // ---- Komutlar ---------------------------------------------------
  const out = (text, tone = 'normal') => ({ text, tone });

  const commands = {
    yardim: () => HELP.map((t) => out(t)),
    pwd: () => [out(`/home/${data.user}/${cwd.join('/')}`.replace(/\/$/, ''))],
    whoami: () => [out(data.user)],
    date: () => [out(formatDateLong(content.story.gameDate))],
    clear: () => ({ clear: true, lines: [] }),

    ls(args) {
      const parts = resolvePath(args[0]);
      const node = getNode(parts);
      if (!node) return [out(`ls: böyle bir klasör yok: ${args[0]}`, 'error')];
      if (node.type !== 'dir') return [out(args[0])];
      const names = Object.keys(node.children).filter((n) => visible(node.children[n]));
      if (!names.length) return [out('(boş)', 'muted')];
      return names.map((name) => {
        const child = node.children[name];
        if (child.type === 'dir') return out(`${name}/`, 'dir');
        if (child.type === 'enc') return out(`${name}   ${isUnlocked(child.lockId) ? '[çözüldü]' : '[şifreli]'}`, 'enc');
        return out(name, 'file');
      });
    },

    cd(args) {
      const parts = resolvePath(args[0] ?? '~');
      const node = getNode(parts);
      if (!node) return [out(`cd: böyle bir klasör yok: ${args[0]}`, 'error')];
      if (node.type !== 'dir') return [out(`cd: bu bir klasör değil: ${args[0]}`, 'error')];
      cwd = parts.map((p, i) => findChildName(getNode(parts.slice(0, i)), p));
      return [];
    },

    cat(args) {
      if (!args[0]) return [out('kullanım: cat <dosya>', 'error')];
      const node = getNode(resolvePath(args[0]));
      if (!node) return [out(`cat: böyle bir dosya yok: ${args[0]}  (ls ile bak)`, 'error')];
      if (node.type === 'dir') return [out(`cat: ${args[0]} bir klasör. İçine girmek için: cd ${args[0]}`, 'error')];
      if (node.type === 'enc') return [out(`cat: ${args[0]} şifreli. Çözmek için: decrypt ${args[0]} <anahtar>`, 'error')];
      return node.content.split('\n').map((line) => out(line));
    },

    decrypt(args) {
      const [fileArg, ...keyParts] = args;
      if (!fileArg) return [out('kullanım: decrypt <dosya> <anahtar>', 'error')];
      const node = getNode(resolvePath(fileArg));
      if (!node) return [out(`decrypt: böyle bir dosya yok: ${fileArg}`, 'error')];
      if (node.type !== 'enc') return [out(`decrypt: ${fileArg} şifreli bir dosya değil.`, 'error')];
      if (isUnlocked(node.lockId)) return [out('Bu dosya zaten çözülmüş:', 'muted'), ...node.reveal.map((t) => out(t, 'ok'))];
      if (!keyParts.length) return [out(`decrypt: anahtar eksik. Kullanım: decrypt ${fileArg} <anahtar>`, 'error')];

      const result = checkAnswer(node.lockId, keyParts.join(' '));
      if (result.correct) {
        bus.emit('terminal:decrypted', { lockId: node.lockId });
        if (node.event) bus.emit(node.event, { lockId: node.lockId });
        return { lines: node.reveal.map((t) => out(t, 'ok')), success: true };
      }
      const lines = [out(`[HATA] anahtar yanlış (${result.attempts}. deneme)`, 'error')];
      if (result.hint) lines.push(out(`İpucu: ${result.hint}`, 'hint'));
      else lines.push(out("Takıldıysan 'ipucu' yaz.", 'muted'));
      return { lines, failed: true };
    },

    // ---- 4. Perde ----------------------------------------------
    ps() {
      const rows = data.processes.filter((p) => !(p.kind === 'target' && hasFlag('mdmKilled')));
      return [
        out('  PID   PROGRAM               NOT', 'muted'),
        ...rows.map((p) => out(`${String(p.pid).padStart(5)}   ${p.name.padEnd(20)}  ${p.note ?? ''}`, p.kind === 'target' ? 'error' : 'normal')),
      ];
    },

    kill(args) {
      if (!args[0]) return [out('kullanım: kill <PID>   (PID numarasını ps ile öğren)', 'error')];
      const wanted = normalizeAnswer(args[0]);
      const proc = data.processes.find((p) => String(p.pid) === args[0] || normalizeAnswer(p.name) === wanted);
      if (!proc || (proc.kind === 'target' && hasFlag('mdmKilled'))) return [out(`kill: böyle bir süreç yok: ${args[0]}`, 'error')];
      if (proc.kind === 'system') return [out(`kill: izin reddedildi — ${proc.name} bir sistem süreci`, 'error')];
      if (proc.kind === 'self') return [out('Terminal kendini kapatamaz. (İyi deneme.)', 'muted')];
      if (proc.kind === 'zeynep') return [out('Z: Hey! O benim betiğim. Onu kapatırsan seni koruyamam.', 'zeynep'), out('kill iptal edildi.', 'muted')];
      setFlag('mdmKilled');
      bus.emit('terminal:mdmKilled');
      return { lines: [out(`[OK] ${proc.pid} (${proc.name}) sonlandırıldı`, 'ok'), out('[OK] ekran paylaşımı: KAPALI', 'ok')], success: true };
    },

    birlestir() {
      if (hasFlag('evidenceMerged')) return [out('kanit_tam.zip zaten hazır. Göndermek için: gonder', 'muted')];
      const parts = [['archive', '1. parça (arsiv.zip)'], ['evidence2', '2. parça (kanit_parca2)'], ['evidence3', '3. parça (kanit_parca3)']];
      const missing = parts.filter(([id]) => !isUnlocked(id));
      if (missing.length) return [out('birlestir: eksik parçalar var:', 'error'), ...missing.map(([, label]) => out(`  - ${label}`, 'error'))];
      setFlag('evidenceMerged');
      bus.emit('evidence:merged');
      return {
        lines: [
          ...parts.map(([, label]) => out(`[OK] ${label} eklendi`, 'ok')),
          out('[OK] kanit_tam.zip oluşturuldu (9,7 MB)', 'ok'),
        ],
        success: true,
      };
    },

    gonder() {
      if (!hasFlag('evidenceMerged')) return [out("gonder: önce kanıtları birleştir ('birlestir').", 'error')];
      bus.emit('evidence:openSend');
      return [out('Gönderme penceresi açıldı.', 'muted')];
    },

    ipucu() {
      if (isActRunning4()) return act4Hint();
      // Sıradaki çözülmemiş şifreli dosyanın kilidi
      const lockId = ['evidence2', 'location'].find((id) => !isUnlocked(id));
      if (!lockId) return [out('Şu an çözülecek şifreli dosya kalmadı.', 'muted')];
      const hint = hasMoreHints(lockId) ? revealNextHint(lockId) : getActiveHint(lockId);
      return [out(`İpucu: ${hint}`, 'hint')];
    },
  };

  /** 4. Perde'de 'ipucu' komutu: hangi adımdaysan ona göre. */
  function act4Hint() {
    if (!hasFlag('mdmKilled')) return [out("İpucu: 'ps' yaz. Notu \"ekran paylaşımı\" olan programın PID numarasını 'kill' ile kapat.", 'hint')];
    if (!isUnlocked('evidence3')) {
      const hint = hasMoreHints('evidence3') ? revealNextHint('evidence3') : getActiveHint('evidence3');
      return [out(`İpucu: ${hint ?? "Zeynep'in son mesajını oku: anahtar, onların sana verdiği kod."}`, 'hint')];
    }
    if (!hasFlag('evidenceMerged')) return [out("İpucu: 'birlestir' yaz.", 'hint')];
    return [out("İpucu: 'gonder' yaz ve kararını ver.", 'hint')];
  }

  // ---- Dışarıya açılan arayüz ------------------------------------
  return {
    prompt: () => `${data.user}@${data.host}:${pathLabel(cwd)}$`,

    /** Bir komut satırını çalıştırır. */
    run(line) {
      const [rawName, ...args] = line.trim().split(/\s+/);
      if (!rawName) return { lines: [] };
      const name = ALIASES[normalizeAnswer(rawName) || rawName];
      if (!name) return { lines: [out(`komut bulunamadı: ${rawName}  ('yardim' yaz)`, 'error')], failed: true };
      const result = commands[name](args);
      return Array.isArray(result) ? { lines: result } : result;
    },

    /**
     * Tab tamamlama: son kelimeyi komut ya da dosya adıyla tamamlar.
     * Döner: { line, options }  (birden fazla seçenek varsa options dolu)
     */
    complete(line) {
      const words = line.split(' ');
      const last = words.pop();
      if (!words.length) {
        const matches = Object.keys(commands).filter((c) => c.startsWith(last));
        return matches.length === 1 ? { line: `${matches[0]} `, options: [] } : { line, options: matches };
      }
      const slash = last.lastIndexOf('/');
      const dirText = slash >= 0 ? last.slice(0, slash + 1) : '';
      const prefix = normalizeAnswer(last.slice(slash + 1));
      const dir = getNode(resolvePath(dirText));
      if (!dir || dir.type !== 'dir') return { line, options: [] };
      const matches = Object.keys(dir.children)
        .filter((n) => visible(dir.children[n]) && normalizeAnswer(n).startsWith(prefix));
      if (matches.length !== 1) return { line, options: matches };
      const child = dir.children[matches[0]];
      const completed = `${dirText}${matches[0]}${child.type === 'dir' ? '/' : ' '}`;
      return { line: [...words, completed].join(' '), options: [] };
    },
  };
}
