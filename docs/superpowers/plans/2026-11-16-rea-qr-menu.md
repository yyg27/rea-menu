# REA Garden Coffee QR Menü Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Google Sheets CSV'sinden beslenen, kırmızı-beyaz, mobil QR menü sayfası.

**Architecture:** Statik `index.html` + `style.css` + `menu.js` (ES module). `menu.js` saf fonksiyonları (CSV ayrıştırma, menüye çevirme) export eder; tarayıcıda ayrıca veriyi çekip çizer. Sheets linki yokken `sample.csv` kullanılır.

**Tech Stack:** Vanilla HTML/CSS/JS, test için Node (`node:assert`), bağımlılık yok.

**Spec:** `docs/superpowers/specs/2026-11-16-rea-qr-menu-design.md`

## Global Constraints
- Başlık: "REA Garden Coffee". Dil: Türkçe.
- Renk: kırmızı-beyaz (logo gelene kadar `--red: #c8102e`).
- Sütunlar: `kategori | ürün | açıklama | fiyat | aktif`.
- Bağımlılık eklenmez. Proje git repo değil; commit adımları yok.

## Review Focus
- Tırnak içinde virgül/yeni satır olan açıklama → tek hücre kalmalı.
- CRLF satır sonu ve UTF-8 BOM → başlık ve değerler temiz okunmalı.
- `aktif` değeri "Hayır", "HAYIR", "hayir", "0", "yok", boş → ürün gizlenmeli; "evet"/"1"/"x" → görünmeli.
- Boş satırlar, adı veya fiyatı eksik satırlar → atlanmalı, menünün geri kalanı görünmeli.
- Sheets'e ulaşılamaz → localStorage'daki son veri, o da yoksa hata mesajı.

---

### Task 1: CSV ayrıştırma + menüye çevirme

**Files:** Create `menu.js`, `test.mjs`, `sample.csv`

**Interfaces:**
- Produces: `parseCSV(text: string) -> string[][]`, `toMenu(rows: string[][]) -> {name: string, items: {name, desc, price}[]}[]` (kategori sırası Sheets'teki ilk görünme sırası; başlık satırı ilk satır, sütun adına göre eşlenir, küçük/büyük harf ve BOM önemsiz).

- [ ] Step 1: `test.mjs`'te assert'ler: tırnaklı virgül/yeni satır/çift tırnak (`""`), CRLF, BOM; `toMenu` için aktif varyantları, eksik ad/fiyat satırı atlama, boş satır, kategori sırası.
- [ ] Step 2: `node test.mjs` → FAIL.
- [ ] Step 3: `menu.js`'te iki fonksiyonu yaz. Fiyat yalnız rakam/virgül/nokta ise sonuna " ₺" eklenir, değilse olduğu gibi gösterilir.
- [ ] Step 4: `node test.mjs` → "ok".
- [ ] Step 5: `sample.csv`'ye 4 kategori (Sıcak Kahveler, Soğuk İçecekler, Tatlılar, Atıştırmalıklar), ~16 örnek ürün; birinde `aktif=hayır`.

### Task 2: Sayfa, yükleme ve görünüm

**Files:** Create `index.html`, `style.css`; Modify `menu.js`

**Interfaces:**
- Consumes: `parseCSV`, `toMenu`.
- Produces: `menu.js` içinde `const SHEET_CSV_URL = ""` (boşsa `sample.csv`), `load()` (fetch → localStorage `rea-menu-csv` önbellek → hata mesajı), `render(menu)`.

- [ ] Step 1: `index.html`: başlık, yapışkan yatay kategori sekmeleri, `<main>` liste; `<script type="module" src="menu.js">`. Render yalnız `typeof document !== "undefined"` iken çalışır (test Node'da import edebilsin).
- [ ] Step 2: `style.css`: kırmızı başlık bandı, beyaz zemin, ürün adı–fiyat aynı satır, açıklama altında küçük gri; sekme tıklayınca ilgili kategoriye kayar (anchor link). 360px genişlikte yatay taşma yok.
- [ ] Step 3: `python -m http.server` ile aç, telefon genişliğinde kontrol et; `sample.csv` adını bozup önbellek davranışını dene.
- [ ] Step 4: `node test.mjs` hâlâ "ok".

### Task 3: Yayın talimatı

**Files:** Create `README.md`

- [ ] Step 1: Kafe sahibine kısa Türkçe talimat: Sheets'te sütunlar, Dosya → Paylaş → Web'de yayınla → CSV, linki `SHEET_CSV_URL`'ye yapıştırma, Netlify Drop ile yayın, QR üretimi. Tabloya menü dışı bilgi yazılmaması uyarısı.
