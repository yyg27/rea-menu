# REA Garden Coffee – QR Menü

## Kafe için
Her şey yönetim sayfasında: `https://yyg27.github.io/rea-menu/yonetim.html` (telefonun ana ekranına ekleyin).

- **Menüyü düzenle**: şifreyle girilen panel. Fiyat, ürün, açıklama, kategori ekleyip silebilir; biten ürüne **Kalmadı** işareti koyabilirsiniz. Değişiklikler **Kaydet**'e basınca kaydedilir ve birkaç dakika içinde menüye yansır.
- **PDF menü al**: arkalı önlü basılı menü. Yazdırırken "Arka plan grafikleri" açık olmalı, yoksa kırmızı bantlar basılmaz. Menü sayfaya sığmazsa üstte uyarı çıkar.
- **QR kodu indir**: masalar için baskıya hazır QR.

Fiyata sadece rakam yazarsanız sonuna ₺ otomatik eklenir (`120` → `120 ₺`). Kategoriler eklendikleri sırayla gösterilir.

## Kurulum (bir kez, geliştirici)
1. Kafenin Google hesabında yeni bir Google Sheets tablosu açın, `sample.csv` içeriğini (ya da gerçek menüyü) yapıştırın. İlk satır başlıklar: `kategori | ürün | açıklama | fiyat | aktif`.
2. **Menünün okuyacağı link:** Dosya → Paylaş → Web'de yayınla → ilk sayfa + **Virgülle ayrılmış değerler (.csv)** → Yayınla. Linki `menu.js` içindeki `SHEET_CSV_URL` satırına yapıştırın. ⚠️ Bu link herkese açıktır; tabloya menü dışında bilgi yazmayın.
3. **Panelin yazacağı servis:**
   1. Tabloda Uzantılar → Apps Script. `Code.gs` içeriğini silip `apps-script/Code.gs` dosyasını yapıştırın, kaydedin.
   2. Proje ayarları (⚙) → Komut dosyası özellikleri → Ekle: `ADMIN_PASSWORD` = güçlü bir şifre (en az 12 karakter). Kafeye bu şifreyi verin.
   3. Dağıt → Yeni dağıtım → tür: **Web uygulaması**, Yürüten: **Ben**, Erişimi olan: **Herkes** → Dağıt → Google'ın izin ekranını onaylayın.
   4. Çıkan web uygulaması linkini `menu.js` içindeki `ADMIN_API_URL` satırına yapıştırın.
   - `Code.gs` değişirse: Dağıt → Dağıtımları yönet → düzenle → **Yeni sürüm** (link aynı kalır).
4. Siteyi yayınlayın (GitHub Pages: repo Settings → Pages → `main` dalı). Adres: `https://yyg27.github.io/rea-menu/`.
5. `qr.png` bu adres için hazır. Adres değişirse yeniden üretin: `qrencode -t PNG -l M -m 2 -s 40 -o qr.png "<adres>"`.
6. Kafeye yönetim sayfasının linkini ve şifreyi verin.

`ADMIN_API_URL` boşken panel **demo modunda** açılır: örnek menüyü gösterir, kaydetmez (tanıtım için).
Sheets'e ulaşılamazsa, o telefonda daha önce açılmış son menü gösterilir.

## Geliştirme
- Yerelde çalıştırmak: `python3 -m http.server` → http://localhost:8000
- Test: `node test.mjs`
- PDF: `chromium --headless --no-pdf-header-footer --virtual-time-budget=8000 --print-to-pdf=menu.pdf http://localhost:8000/print.html`
