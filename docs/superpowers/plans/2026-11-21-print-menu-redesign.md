# Basılı Menü Yeniden Tasarımı Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Basılı menüyü markanın çizgi diline (beyaz kâğıt, kırmızı/beyaz basamaklı çizgi demetleri) taşımak ve logo yazı fontunu düzeltmek.

**Architecture:** `print.html` içine satır içi SVG süsler (her biri `stroke="currentColor"`, mutlak konumlu, kenar boşluğu/bantta). Logo fontu `style.css` ve `print.css`/`tanitim` içindeki `.logo` kurallarında değişir. Mantık değişmez; görsel doğrulama Chromium PDF + ekran görüntüsüyle.

**Tech Stack:** HTML/CSS/SVG, Chromium headless, ImageMagick.

**Spec:** `docs/superpowers/specs/2026-11-21-print-menu-redesign-design.md`

## Global Constraints
- Renk `#c8102e` (`--red`), değişmez. Bağımlılık eklenmez.
- Çizgiler metnin üstüne binmez: yalnız bantlar ve 16 mm kenar boşlukları.
- Commit mesajları İngilizce, `type: lowercase sentence`.

## Review Focus
- Uzun menü sayfayı doldurduğunda çizgiler metinle çakışmamalı (sayfa ~30 ürünle denenecek).
- `menu.pdf` 2 sayfa kalmalı; mevcut taşma uyarısı çalışmaya devam etmeli.
- Web başlığında yeni font telefon genişliğinde (360-390 px) taşmamalı.

---

### Task 1: Logo fontu
**Files:** Modify `index.html`, `print.html`, `tanitim/index.html` (font linki), `style.css`, `tanitim/index.html` (`.logo` kuralı)
- [ ] Josefin Sans 600 ve Montserrat 600'ü Instagram görseliyle yan yana render et, yakın olanı seç.
- [ ] Cinzel yerine seçilen fontu bağla; `.garden`/`.coffee` siyah (`#1a1a1a`) ve sans-serif.
- [ ] Web'i 390 px'de ekran görüntüsüyle kontrol et; `node test.mjs` → ok.
- [ ] Commit: `fix: set garden coffee in a sans font like the real logo`

### Task 2: Çizgi demetleri ve başlıklar
**Files:** Modify `print.html`, `print.css`
- [ ] Ön bant: soldan girip yuvarlak köşeyle basamaklanan 5 beyaz çizgi; beyaz alanın sağ altında kırmızı demet.
- [ ] Arka: solda kenardan inip dönen kırmızı demet; footer üstünde tam genişlik yatay demet.
- [ ] `.cols h2`: sans-serif, büyük harf, harf aralıklı, sağa uzanan ince kırmızı çizgi; ikon korunur.
- [ ] `sample.csv`'yi geçici olarak 30 ürüne çıkarıp çakışma yok mu bak, sonra geri al.
- [ ] PDF üret, iki sayfayı görsel kontrol et; `node test.mjs` → ok.
- [ ] Commit: `feat: give the printed menu the brand's line bundles and headings`
