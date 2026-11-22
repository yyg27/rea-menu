import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { createHash } from "node:crypto";
import { toRows, validate } from "./admin.js";
import { fromRows } from "./menu.js";

// fromRows: tablo satırları → panel; eksik satırlar düzeltilsin diye atılmaz, fiyat ham kalır
const rows = [
  ["Kategori", "ÜRÜN", "açıklama", "fiyat", "aktif"],
  ["Kahve", "Latte", "Sütlü", "120", ""],
  ["Kahve", "Mocha", "", "130", "Hayır"],
  ["", "", "", "", ""],
  ["Tatlı", "Brownie", "", "", "evet"],
  ["Kahve", "Filtre", "", "90", "yok"],
  ["", "Su", "", "20", ""],
];
const cats = fromRows(rows);
assert.deepEqual(cats, [
  { name: "Kahve", items: [
    { name: "Latte", desc: "Sütlü", price: "120", soldOut: false },
    { name: "Mocha", desc: "", price: "130", soldOut: true },
    { name: "Filtre", desc: "", price: "90", soldOut: true },
  ] },
  { name: "Tatlı", items: [{ name: "Brownie", desc: "", price: "", soldOut: false }] },
  { name: "Diğer", items: [{ name: "Su", desc: "", price: "20", soldOut: false }] },
]);
assert.deepEqual(fromRows([]), []);

// toRows: panel → tablo satırları (başlıksız); boş ürün satırları atılır, değerler kırpılır
assert.deepEqual(toRows([
  { name: " Kahve ", items: [{ name: "Latte ", desc: "", price: " 120", soldOut: false }, { name: "", desc: "", price: "", soldOut: false }] },
  { name: "Tatlı", items: [{ name: "Sufle", desc: "15 dk", price: "185", soldOut: true }] },
]), [["Kahve", "Latte", "", "120", "evet"], ["Tatlı", "Sufle", "15 dk", "185", "hayır"]]);

// gidiş-dönüş: tablodan okunup değiştirilmeden kaydedilen menü aynı kalır
assert.deepEqual(fromRows([["kategori", "ürün", "açıklama", "fiyat", "aktif"], ...toRows(cats)]), cats);

// validate: kaydetmeyi engelleyen eksikler
assert.deepEqual(validate(cats), ["Tatlı: Brownie için fiyat yok"]);
assert.deepEqual(validate([{ name: "Kahve", items: [{ name: "", desc: "x", price: "50", soldOut: false }] }]), ["Kahve: 50 fiyatlı ürünün adı yok"]);
assert.deepEqual(validate([{ name: " ", items: [{ name: "Çay", desc: "", price: "40", soldOut: false }] }]), ["Adı boş bir kategori var"]);
assert.deepEqual(validate([{ name: "Kahve", items: [{ name: "", desc: "", price: "", soldOut: false }] }]), []);

// Apps Script tarafı: cleanRows sunucuya gelen veriyi doğrular (güven sınırı)
const ctx = {};
vm.runInNewContext(readFileSync(new URL("./apps-script/Code.gs", import.meta.url), "utf8"), ctx);
assert.deepEqual(ctx.cleanRows([[" Kahve", "Latte", "", "120", "evet"]]), [["Kahve", "Latte", "", "120", "evet"]]);
for (const bad of [null, "x", [["a", "b"]], [["a", "b", "c", "d", 5]], [["a", "b", "c", "d", "x".repeat(301)]], Array(1001).fill(["a", "b", "c", "d", "e"])])
  assert.throws(() => ctx.cleanRows(bad), undefined, JSON.stringify(bad)?.slice(0, 40));

// doPost: sahte Google ortamında gerçek yazma yolu
function fakeSheet(data) {
  const last = () => { let n = data.length; while (n && data[n - 1].every(v => v === "")) n--; return n; };
  return {
    data,
    getDataRange: () => ({ getDisplayValues: () => data.slice(0, last()).map(r => [...r]) }),
    getLastRow: last,
    getLastColumn: () => 5,
    getRange: (r, c, nr, nc) => ({
      setNumberFormat() { return this; },
      setValues(v) { for (let i = 0; i < nr; i++) data[r - 1 + i] = v[i].slice(0, nc); return this; },
      clearContent() { for (let i = 0; i < nr; i++) data[r - 1 + i] = Array(nc).fill(""); return this; },
    }),
  };
}
const HEAD = ["kategori", "ürün", "açıklama", "fiyat", "aktif"];
const sheet = fakeSheet([HEAD, ...Array.from({ length: 10 }, (_, i) => ["Kahve", "Ürün " + i, "", "10", "evet"])]);
const gs = {
  SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheets: () => [sheet] }) },
  PropertiesService: { getScriptProperties: () => ({ getProperty: () => "gizli" }) },
  Utilities: { sleep() {}, DigestAlgorithm: { MD5: "md5" }, Charset: { UTF_8: "utf8" },
    computeDigest: (alg, s) => [...createHash("md5").update(s).digest()], base64Encode: b => Buffer.from(b).toString("base64") },
  LockService: { getScriptLock: () => ({ waitLock() {}, releaseLock() {} }) },
  ContentService: { MimeType: { JSON: "json" }, createTextOutput: s => ({ setMimeType() { return JSON.parse(s); } }) },
};
vm.runInNewContext(readFileSync(new URL("./apps-script/Code.gs", import.meta.url), "utf8"), gs);
const post = body => gs.doPost({ postData: { contents: JSON.stringify(body) } });
const before = JSON.stringify(sheet.data);

assert.deepEqual(post({ password: "yanlis", action: "load" }), { error: "Şifre yanlış" });
const loaded = post({ password: "gizli", action: "load" });
assert.equal(loaded.rows.length, 11);
assert.ok(loaded.version);

// eski sürümle kayıt reddedilir, tablo değişmez (başka cihaz arada kaydetmiş)
assert.match(post({ password: "gizli", action: "save", version: "eski", rows: [] }).error, /başka bir yerden değişti/);
assert.match(post({ password: "gizli", action: "save", rows: [] }).error, /başka bir yerden değişti/);
assert.equal(JSON.stringify(sheet.data), before);

// 10 ürünlük tabloya 3 ürün: önce yazılır, fazla satırlar boşalır, yeni sürüm döner
const saved = post({ password: "gizli", action: "save", version: loaded.version, rows: [["Çay", "Demleme", "", "45", "evet"], ["Çay", "Fincan", "", "70", "hayır"], ["Tatlı", "Sufle", "", "185", "evet"]] });
assert.equal(saved.ok, true);
assert.deepEqual(JSON.parse(JSON.stringify(sheet.data.slice(0, 4))), [ // vm ortamındaki diziler: JSON ile ortak ortama alınır
  HEAD, ["Çay", "Demleme", "", "45", "evet"], ["Çay", "Fincan", "", "70", "hayır"], ["Tatlı", "Sufle", "", "185", "evet"]]);
assert.ok(sheet.data.slice(4).every(r => r.every(v => v === "")));
assert.notEqual(saved.version, loaded.version);
assert.equal(post({ password: "gizli", action: "load" }).version, saved.version);
// aynı sürümle ikinci kayıt da olur (kendi kaydının ardından)
assert.equal(post({ password: "gizli", action: "save", version: saved.version, rows: [["Çay", "Demleme", "", "50", "evet"]] }).ok, true);

console.log("ok");
