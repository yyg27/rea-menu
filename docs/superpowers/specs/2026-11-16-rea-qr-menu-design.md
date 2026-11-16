# REA Garden Coffee – QR Menü (kısa tasarım)

## Amaç
REA Garden Coffee için masadaki QR kodu okutunca telefonda açılan menü. Kafe sahibi ürün ve fiyatları Google Sheets'ten kendisi güncelleyebilmeli, geliştiriciye ihtiyaç duymamalı.

## Hedefler / Hedef dışı
- Hedef: mobilde hızlı açılan, kırmızı-beyaz, okunaklı menü; Sheets'ten canlı veri.
- Hedef dışı: sipariş/ödeme, admin paneli, veritabanı, çoklu dil, ürün fotoğrafları (istenirse sonra).
- Başarısızlık sayılır: Sheets'te tek bozuk satır yüzünden menünün tamamen boş görünmesi.

## Yaklaşımlar
1. Statik sayfa, veriler kodda (geliştirici günceller): basit ama sahip bağımlı kalır.
2. **Seçilen:** Statik sayfa + yayınlanmış Google Sheets CSV'si: sahip kendisi günceller, sunucu yok, ücretsiz.
3. Admin panel + DB: tek kafe için fazla ağır, maliyetli.

## Tasarım
- Tek `index.html` + `menu.js` + `style.css`, framework yok.
- Sheets sütunları: `kategori | ürün | açıklama | fiyat | aktif`. `aktif` boş/"hayır" ise ürün gizlenir (stokta yok).
- Sheets "Web'de yayınla → CSV" linki `fetch` ile okunur; tırnaklı virgülleri doğru ayrıştıran küçük bir CSV parser (assert'li self-test ile).
- Ürün adı veya fiyatı eksik satırlar atlanır; geri kalan menü yine görünür.
- Veri çekilemezse son başarılı veri `localStorage`'dan gösterilir, o da yoksa kısa bir hata mesajı.
- Üstte kategori sekmeleri (yatay kaydırmalı), altında kategorilere göre ürün listesi.
- Renk: kırmızı-beyaz; kesin tonlar logodan alınacak (yoksa geliştirici seçer).
- Yayın: Netlify veya GitHub Pages (ücretsiz, statik). Son URL'den QR kodu PNG olarak üretilir.

## Geliştiriciye kalanlar
Font, kesin kırmızı tonu (logo yoksa), sekme/kart görünümü detayları.
