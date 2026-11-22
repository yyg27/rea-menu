// REA menü yönetim API'si. Menü tablosuna bağlı Apps Script olarak yayınlanır (kurulum: README).
// Şifre: Proje ayarları → Komut dosyası özellikleri → ADMIN_PASSWORD
const HEADER = ["kategori", "ürün", "açıklama", "fiyat", "aktif"];
const MAX_ROWS = 1000;
const MAX_LEN = 300;

function doPost(e) {
  let req;
  try { req = JSON.parse(e.postData.contents); } catch (err) { return json({ error: "Geçersiz istek" }); }
  const pass = PropertiesService.getScriptProperties().getProperty("ADMIN_PASSWORD");
  if (!pass) return json({ error: "Yönetim şifresi ayarlanmamış" });
  if (req.password !== pass) {
    Utilities.sleep(1500); // tahmin denemelerini yavaşlatır
    return json({ error: "Şifre yanlış" });
  }
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

  if (req.action === "load") return json({ rows: sheet.getDataRange().getDisplayValues() });

  if (req.action === "save") {
    let rows;
    try { rows = cleanRows(req.rows); } catch (err) { return json({ error: err.message }); }
    const all = [HEADER].concat(rows);
    const lock = LockService.getScriptLock();
    lock.waitLock(10000);
    try {
      // Önce yaz, sonra fazlalığı sil: yarıda kalan bir kayıt tabloyu boş bırakmaz.
      // "@" düz metin: "150,50" sayıya, "=..." formüle dönüşmesin
      sheet.getRange(1, 1, all.length, HEADER.length).setNumberFormat("@").setValues(all);
      const extra = sheet.getLastRow() - all.length;
      if (extra > 0) sheet.getRange(all.length + 1, 1, extra, sheet.getLastColumn()).clearContent();
    } finally {
      lock.releaseLock();
    }
    return json({ ok: true, count: rows.length });
  }

  return json({ error: "Bilinmeyen işlem" });
}

function cleanRows(rows) {
  if (!Array.isArray(rows) || rows.length > MAX_ROWS) throw new Error("Ürün listesi geçersiz");
  return rows.map(r => {
    if (!Array.isArray(r) || r.length !== HEADER.length) throw new Error("Satır biçimi geçersiz");
    return r.map(v => {
      if (typeof v !== "string" || v.length > MAX_LEN) throw new Error("Bir alan çok uzun ya da geçersiz");
      return v.trim();
    });
  });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
