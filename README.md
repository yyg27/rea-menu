# REA Garden Coffee – QR Menü

## Menüyü güncellemek (kafe için)
Google Sheets tablosunda ilk satır şu başlıklar olmalı:

| kategori | ürün | açıklama | fiyat | aktif |
|---|---|---|---|---|
| Sıcak Kahveler | Latte | Espresso, süt | 120 | evet |

- **fiyat**: sadece rakam yazarsanız sonuna otomatik ₺ eklenir (`120` → `120 ₺`).
- **aktif**: boş ya da `evet` ise ürün normal görünür. Stokta yoksa `hayır` yazın: ürün menüde kalır ama fiyatın yerine **Kalmadı** yazar.
- Başlıkları tablodaki gibi Türkçe harflerle yazın (`ürün`, `açıklama`); büyük/küçük harf fark etmez.
- Ürün adı veya fiyatı boş olan satırlar gösterilmez.
- Kategoriler tablodaki sırayla gösterilir.
- Değişiklik birkaç dakika içinde menüye yansır (Google'ın yayın gecikmesi).
- ⚠️ Bu tablo herkese açık yayınlanır, içine menü dışında bilgi yazmayın.

## Menü çıktısı (PDF)
`print.html` sayfasını açıp **Yazdır / PDF kaydet**'e basın. Ön ve arka yüzlü çıkar, içerik aynı Sheets tablosundan gelir. Yazdırırken "Arka plan grafikleri" seçeneği açık olmalı, yoksa kırmızı bant basılmaz. Menü sayfaya sığmazsa sayfanın üstünde uyarı çıkar.

Komut satırından: `chromium --headless --no-pdf-header-footer --virtual-time-budget=8000 --print-to-pdf=menu.pdf http://localhost:8000/print.html`

## Kurulum (bir kez, geliştirici)
1. `sample.csv` içeriğini yeni bir Google Sheets tablosuna yapıştırın.
2. Dosya → Paylaş → Web'de yayınla → ilgili sayfa + **Virgülle ayrılmış değerler (.csv)** → Yayınla. Linki kopyalayın.
3. `menu.js` içindeki `SHEET_CSV_URL = ""` kısmına CSV linkini, `SHEET_EDIT_URL = ""` kısmına tablonun normal (tarayıcıda açılan) linkini yapıştırın.
4. Klasörü https://app.netlify.com/drop adresine sürükleyip bırakın (ya da GitHub Pages). Çıkan adres menünün adresidir.
5. `qr.png` şu adres için hazır: `https://yyg27.github.io/rea-menu/`. Adres değişirse yeniden üretin: `qrencode -t PNG -l M -m 2 -s 40 -o qr.png "<adres>"`.
6. Kafeye yönetim sayfasının linkini verin: `<adres>/yonetim.html`. Menüyü düzenleme, PDF alma ve QR indirme buradan yapılır; telefonun ana ekranına eklenebilir.

Sheets'e ulaşılamazsa, o telefonda daha önce açılmış son menü gösterilir.

## Geliştirme
- Yerelde çalıştırmak: `python3 -m http.server` → http://localhost:8000
- Test: `node test.mjs`
