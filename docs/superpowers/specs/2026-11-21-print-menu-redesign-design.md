# Basılı menü yeniden tasarımı (kısa tasarım)

## Amaç
Basılı menü "dull" bulundu. Kafenin Instagram'daki marka diline (rea.garden.coffee) yaklaştırılacak: kırmızı zemin, 5-6 ince paralel çizgiden demetler, dik açıyla ve yuvarlak köşeyle basamaklanan rotalar.

## Kararlar
- Kullanıcının seçimi **B**: beyaz kâğıt, kırmızı çizgiler (tamamen kırmızı sayfa değil). Renk değişmez: `#c8102e`.
- Ön yüz: kırmızı bant + içinde soldan girip basamakla inen beyaz demet, ortada logo; beyaz alanın sağ altında kırmızı demet.
- Arka yüz: ince kırmızı bant; solda kenardan inip dönen kırmızı demet; altta KDV notunun üstünde tam genişlikte yatay demet.
- Kategori başlıkları (baskıda): geometrik sans-serif, büyük harf, harf aralıklı, yanından ince kırmızı çizgi uzanır; ikonlar kalır.
- "GARDEN COFFEE" fontu hem baskıda hem web'de serifli Cinzel'den markadaki geometrik sans-serif'e geçer (düzeltme).
- Çizgiler yalnız bantlarda ve kenar boşluklarında; metnin üstüne binmez.

## Yaklaşımlar
- **Seçilen:** satır içi SVG yolları (`stroke`, yuvarlak köşe) — baskıda keskin, renk CSS'ten.
- CSS kenarlıkları: yuvarlak basamaklı demet çizilemez.
- PNG görsel: baskıda bulanık, renk değişince yeniden üretilmeli.

## Hedef dışı
Web menünün diğer başlıkları, tamamen kırmızı sayfa, baskı işleri.

## Geliştiriciye kalan
Demetlerin tam rotası ve yoğunluğu, font seçimi (Josefin Sans / Montserrat arasından görsel karşılaştırmayla).
