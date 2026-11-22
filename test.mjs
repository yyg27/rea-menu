import assert from "node:assert/strict";
import { parseCSV, toMenu, splitPages, iconFor } from "./menu.js";

// parseCSV
assert.deepEqual(parseCSV('a,b\n1,2'), [["a", "b"], ["1", "2"]]);
assert.deepEqual(parseCSV('a,"x, y",c'), [["a", "x, y", "c"]]);
assert.deepEqual(parseCSV('"satır\nikinci",2'), [["satır\nikinci", "2"]]);
assert.deepEqual(parseCSV('"çift ""tırnak""",1'), [['çift "tırnak"', "1"]]);
assert.deepEqual(parseCSV('a,b\r\n1,2\r\n'), [["a", "b"], ["1", "2"]]);
assert.deepEqual(parseCSV('﻿kategori,ürün'), [["kategori", "ürün"]]);

// toMenu
const csv = `﻿Kategori,Ürün,Açıklama,Fiyat,Aktif\r
Kahve,Latte,"Süt, espresso",120,evet\r
Kahve,Mocha,,130,Hayır\r
Tatlı,Cheesecake,,"150,50",x\r
Kahve,Americano,,100,\r
Kahve,,eksik ad,90,evet\r
Kahve,Fiyatsız,,,evet\r
\r
Tatlı,Brownie,,95 TL,1\r
Kahve,Filtre,,90,HAYIR\r
Kahve,Türk,,80,hayir\r
Kahve,Cortado,,110,0\r
Kahve,Flat,,115,yok\r
Kahve,Espresso,,85,EVET\r`;
const menu = toMenu(parseCSV(csv));
assert.deepEqual(menu.map(c => c.name), ["Kahve", "Tatlı"]);
const it = (name, price, soldOut = false, desc = "") => ({ name, desc, price, soldOut });
assert.deepEqual(menu[0].items, [
  it("Latte", "120 ₺", false, "Süt, espresso"),
  it("Mocha", "130 ₺", true),
  it("Americano", "100 ₺"), // aktif boş → normal görünür
  it("Filtre", "90 ₺", true),
  it("Türk", "80 ₺", true),
  it("Cortado", "110 ₺", true),
  it("Flat", "115 ₺", true),
  it("Espresso", "85 ₺"),
]);
assert.deepEqual(menu[1].items, [it("Cheesecake", "150,50 ₺"), it("Brownie", "95 TL")]);
assert.deepEqual(toMenu([]), []);

// Başlıklar: Türkçe olmayan klavyeyle büyük harf (I), İ, Mac'ten gelen ayrık (NFD) harfler
for (const head of ["KATEGORI,ÜRÜN,AÇIKLAMA,FIYAT,AKTIF", "KATEGORİ,ÜRÜN,AÇIKLAMA,FİYAT,AKTİF", "kategori,ürün,açıklama,fiyat,aktif".normalize("NFD")]) {
  const m = toMenu(parseCSV(`${head}\nKahve,Latte,Sütlü,120,\nKahve,Mocha,,130,HAYIR`));
  assert.deepEqual(m, [{ name: "Kahve", items: [it("Latte", "120 ₺", false, "Sütlü"), it("Mocha", "130 ₺", true)] }], head);
}

// splitPages: ön yüzde logo olduğu için ön yüze daha az kategori; sıra korunur, her yüzde en az bir kategori
const cat = (name, n) => ({ name, items: Array(n).fill(it("x", "1 ₺")) });
const names = pages => pages.map(p => p.map(c => c.name));
assert.deepEqual(names(splitPages([cat("A", 5), cat("B", 3), cat("C", 4), cat("D", 3)])), [["A", "B"], ["C", "D"]]);
assert.deepEqual(names(splitPages([cat("A", 20), cat("B", 2)])), [["A"], ["B"]]);
assert.deepEqual(names(splitPages([cat("A", 2), cat("B", 2), cat("C", 20)])), [["A", "B"], ["C"]]);
assert.deepEqual(names(splitPages([cat("A", 3)])), [["A"], []]);
assert.deepEqual(names(splitPages([])), [[], []]);
// Sütunlar için yarı yarıya: Tatlılar(4) | Atıştırmalıklar(3) Çaylar(4) Kahvaltı(4) uzun sütuna kaymasın
assert.deepEqual(names(splitPages([cat("T", 8), cat("A", 7), cat("Ç", 4), cat("K", 4)], 0.5)), [["T", "A"], ["Ç", "K"]]);

// iconFor: kategori adından ikon; soğuk önce kontrol edilir ("Soğuk Kahveler" bardak olmalı)
for (const [name, icon] of [
  ["Sıcak Kahveler", "cup"], ["Soğuk İçecekler", "glass"], ["SOĞUK KAHVELER", "glass"], ["Frozen", "glass"],
  ["Tatlılar", "cake"], ["Atıştırmalıklar", "food"], ["ATIŞTIRMALIKLAR", "food"], ["Tost & Sandviç", "food"],
  ["Çaylar", "tea"], ["Espresso Bazlı", "cup"], ["Diğer", "leaf"],
]) assert.equal(iconFor(name), icon, name);

await import("./test-admin.mjs");
console.log("ok");
