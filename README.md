# company

Sahte bir bilgisayar masaüstünde geçen, tarayıcıda çalışan gizem/bulmaca oyunu.
Oyun **tamamlandı**: 4 perde, 5 farklı son.

## Çalıştırma

```bash
npm install      # sadece ilk seferde
npm run dev      # geliştirme sunucusu → terminalde yazan adresi aç (genelde http://localhost:5173)
```

Diğer komutlar:

| Komut | Ne yapar |
|---|---|
| `npm run build` | Oyunu `dist/` klasörüne derler (yayınlamak için) |
| `npm run preview` | Derlenmiş sürümü yerelde açar |
| `npm run sounds` | `public/sounds/` içindeki ses efektlerini yeniden üretir |

İlerlemeyi sıfırlamak için: masaüstünde sol alttaki pusula düğmesi → **İlerlemeyi sıfırla**.

## Telefonda oynama

Oyun telefonda da oynanır; düzen `src/styles/responsive.css` dosyasındadır.
Ekran 700 px'ten darsa (ya da telefon yatay tutulduysa) pencereler tam ekran açılır,
simgeler tek dokunuşla açılır, Mesajlar/E-posta/Notlar "liste → içerik → ‹ geri"
düzenine geçer ve Terminal'de ekranda bir **Tab** düğmesi belirir.

## İnternette yayınlama (GitHub Pages)

Proje GitHub'a yüklendikten sonra oyun otomatik olarak yayınlanır; ayar dosyası
`.github/workflows/deploy.yml`.

**Bir kereye mahsus:** GitHub'da depo → **Settings** → **Pages** → *Build and deployment*
→ **Source: GitHub Actions** seç.

Bundan sonra `main` dalına her `git push` yaptığında GitHub oyunu kendisi derleyip
yayınlar (1-2 dakika). İlerlemeyi deponun **Actions** sekmesinden izleyebilirsin.
Oyunun adresi: `https://KULLANICI_ADIN.github.io/company/`

## Klasör yapısı

```
src/
  data/        ← BÜTÜN hikâye içeriği (JSON). Kod bilmeden düzenlenebilir.
    story.json     giriş metni, anılar, boot yazıları, perdeler, kargo kutusundaki kart
    support.json   BT Destek sohbetinin tüm senaryosu (vuruşlar, cevap seçenekleri)
    browser.json   tarayıcı geçmişi, yer imleri, önbellek sayfaları
    emails.json    e-postalar
    terminal.json  Terminal'in sahte dosya sistemi (3. Perde)
    objectives.json  "Sıradaki adım" kartının görevleri
    endings.json   alıcılar, 5 son ve önceki seçimlere bağlı sonsöz satırları
    apps.json      masaüstündeki uygulamalar
    puzzles.json   tüm şifreler ve ipuçları
    photos.json    fotoğraflar (tarih, konum, açıklama)
    notes.json     notlar
    messages.json  sohbetler
    trash.json     çöp kutusu + arsiv.zip içeriği
    assets.json    TÜM görsel ve ses yolları
  engine/      ← oyun mantığı (arayüzden bağımsız, DOM'a dokunmaz)
    state.js       localStorage kaydı
    puzzles.js     şifre kontrolü + ipucu sistemi
    game.js        perde akışı (başlat → kapanış → bitti)
    itScript.js    BT Destek senaryo motoru (hangi mesaj ne zaman gelir)
    terminal.js    Terminal komutları (ls, cd, cat, decrypt, ps, kill, birlestir, gonder...)
    zeynepChannel.js  Zeynep'in Terminal'e gelen şifreli mesajları (4. Perde)
    endings.js     sonu belirleyen kurallar, bulunan sonlar sayacı
    caesar.js      Sezar şifresi
    text.js        Türkçe karakter duyarsız karşılaştırma
    eventBus.js    olay sistemi (parçalar birbirine olaylarla haber verir)
  ui/          ← ekranda görünen her şey
    scenes/        başlık, giriş hikâyesi, boot, giriş ekranı, masaüstü
    apps/          Fotoğraflar, Mesajlar, Notlar, Çöp Kutusu, arşiv, BT Destek
    effects/       glitch, sahte fare imleci
    windowManager.js, passwordForm.js, appLauncher.js, cliffhanger.js ...
  audio/sound.js   Howler.js ile sesler
  styles/          CSS
public/
  sounds/      ses dosyaları
  images/      gerçek fotoğrafları buraya koy
```

## Gerçek fotoğrafları eklemek

1. Görseli `public/images/` içine koy (ör. `pamuk_cake.jpg`).
2. `src/data/assets.json` içinde ilgili satırın `src` alanını doldur:
   ```json
   "pamuk_cake": { "src": "images/pamuk_cake.jpg", "placeholder": { ... } }
   ```
   `src` boş (`null`) kaldıkça renkli yer tutucu kutu görünür. Her yer tutucunun
   `label` alanı o fotoğrafta ne olması gerektiğini anlatır.
3. Arşivdeki tablo ekran görüntüsünü de gerçek bir görselle değiştirmek istersen
   `archive_screenshot` satırını doldur; boşsa tablo HTML ile çizilir.

## Yeni bulmaca eklemek (örnek)

1. `puzzles.json` → `locks` içine yeni bir kilit ekle:
   ```json
   "gunluk": { "type": "text", "answers": ["cevap"], "title": "Günlük kilitli",
               "subtitle": null, "hints": [{ "after": 3, "text": "Küçük ipucu" }] }
   ```
   `type` `"pin"` ise `"length"` de ver; tuş takımı çıkar.
   Birden fazla adımlı kilit için `{ "type": "chain", "steps": ["adim1", "adim2"] }`
   kullan (E-posta böyle: önce parola, sonra güvenlik kartı).
2. `apps.json`'da bir uygulamanın `lockId` alanını `"gunluk"` yap.
3. İpucunu oyunun başka bir yerine (not, mesaj, fotoğraf bilgisi) yerleştir.

Cevaplar büyük/küçük harf, Türkçe karakter, boşluk ve noktalama farkı gözetmeden
karşılaştırılır: `"Gülhane Parkı"`, `"GULHANE"`, `"gulhane"` aynı kabul edilir.

## 1. Perde çözüm yolu (spoiler!)

<details><summary>Göster</summary>

1. **Giriş:** `gulhane` (ya da `gulhane parki`) — anılardan ilk tanışma Gülhane Parkı'ndaki yağmur.
2. **Notlar:** `pamuk1403` — Fotoğraflar'da "Doğum günün kutlu olsun Pamuk!" fotoğrafının tarihi 14.03.2023.
3. **Mesajlar:** `0707` — Notlar'da "son tatilin plakası, iki kere"; son tatil fotoğrafı Kaş, Antalya (07).
4. **arsiv.zip:** `sessizlik` — Emre "Çöpe bakarsın" diyor; Notlar'daki şifreli not Çözücü'de 3 kaydırmayla çözülüyor ("Pamuk 3 yaşında!").
5. Arşivdeki tabloyu açınca perde sonu başlar.

</details>

## 2. Perde çözüm yolu (spoiler!)

<details><summary>Göster</summary>

1. **E-posta, 1. adım:** `yagmur`. Parola ipucu "son gece aradıklarımın baş harfleri".
   Tarayıcı geçmişinde 24 Eylül 23:00 sonrası *aramaların* (büyüteçli satırlar)
   turuncu vurgulu baş harfleri, en eskiden en yeniye (aşağıdan yukarı): **Y**urt dışına… **A**vukat… **G**izli…
   **M**uhbirler… **U**zak… **R**üzgârlı…
2. **E-posta, 2. adım:** `8976`. Kargo sayfası ve kargo e-postası kutuda bir "kart"
   olduğunu söylüyor → Kargo Notu → "Kutuyu incele". Kartta B2=8, D4=9, A1=7, E5=6.
3. **Perde sonu:** Taslaklar → "Sana" iletisini açınca başlar.

BT Destek'e kodu vermeye çalışmak Zeynep'in betiği tarafından engellenir; bu ve diğer
cevaplar `state.itLog` içinde saklanır (4. Perde'deki sonlar için).

</details>

## 3. Perde çözüm yolu (spoiler!)

<details><summary>Göster</summary>

1. Terminal'i aç → `ls` → `cat beni_oku.txt`.
2. Anahtar "Pamuk'un en sevdiği mama" → Notlar → Market: "somonlu".
   `decrypt Indirilenler/kanit_parca2.enc somon`
3. `cd kanit_parca2` → `cat rota.txt`: feribotla gidilen, rüzgârlı ada → anılardaki Bozcaada.
   `decrypt konum.enc bozcaada` → perde sonu.

Takılınca terminalde `ipucu` yazmak yeterli.

</details>

## 4. Perde çözüm yolu (spoiler!)

<details><summary>Göster</summary>

1. Terminal'de Zeynep şifreli kanaldan yazar. `ps` → notu "ekran paylaşımı: AÇIK" olan
   program: `kill 902`. (Zeynep'in kendi betiğini kapatmaya çalışırsan itiraz eder.)
2. Zeynep 3. parçayı yollar. Anahtar "onların sana verdiği kod" = görev çubuğundaki kod:
   `decrypt Indirilenler/kanit_parca3.enc 481290`
3. `birlestir` → gönderme penceresi açılır (tekrar açmak için `gonder`).
4. Karar:

| Seçim | Son |
|---|---|
| Defne Aksoy + Kurul | **Gün Işığı** (en iyi son) |
| Sadece Defne Aksoy | **Manşet** |
| Sadece Kurul | **Dosya No: 2026/417** |
| Murat Karataş (başkalarıyla birlikte de olsa) | **Teklif** (kötü son) |
| Kanıtları sil | **Sessizlik** (kötü son) |

Son ekranında "Seçime geri dön" ile diğer sonlar denenebilir. Bulunan sonlar
"Baştan başla" desen bile saklanır. Önceki perdelerde BT Destek'e verilen bazı
cevaplar, sonun altına kişisel bir sonsöz satırı ekler (`endings.json` → `epilogue`).

</details>

## Zorluk ayarı

Başlık ekranında **Kolay / Normal** seçilir; oyun sırasında da Başlat menüsünden
(sol alttaki pusula) değiştirilebilir. Seçim kayıtla birlikte saklanır.

| | Normal | Kolay |
|---|---|---|
| Kilit ekranı | Zeynep'in kısa parola ipucu | Nereye bakılacağı ve cevabın biçimi |
| İpuçları | 2 ve 4 yanlıştan sonra | 1 ve 2 yanlıştan sonra, daha açık |
| 📌 Sıradaki adım | Belli belirsiz yön gösterir | Ne yapılacağını açıkça söyler |
| İlk tanışma anısı | "Şemsiyesiz iki kişi" | "İlk tanışmamız: şemsiyesiz iki kişi" |

Her iki ayarda da **💡 İpucu al** düğmesi ve Terminal'deki `ipucu` komutu var.

Nerede ayarlanır:
- `puzzles.json` → her kilidin normal alanları (`subtitle`, `hints`) **Normal** zorluktur;
  `easy` bölümündeki alanlar **Kolay** zorlukta bunların yerine geçer.
- `objectives.json` → `text` (Normal) ve `easyText` (Kolay).
- `story.json` → anılardaki `easyTitle`; `difficulty` bölümü başlık ekranındaki metinler.

## Yeni son eklemek

`endings.json` → `endings` listesine bir öğe ekle. `when` koşulu:
`{ "includes": [...] }` (bu alıcılar seçiliyse), `{ "only": [...] }` (tam olarak bunlar),
`{ "deleted": true }` (kanıtlar silindiyse). Liste yukarıdan aşağıya okunur, tutan ilk son
seçilir; yani daha özel koşulları yukarı yaz. Yeni bir alıcı için `recipients` listesine
ekleme yapman yeterli.
