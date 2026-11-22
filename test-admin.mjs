import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { fromRows, toRows, validate } from "./admin.js";

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

console.log("ok");
