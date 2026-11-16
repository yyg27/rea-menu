import assert from "node:assert/strict";
import { parseCSV, toMenu } from "./menu.js";

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
assert.deepEqual(menu[0].items, [
  { name: "Latte", desc: "Süt, espresso", price: "120 ₺" },
  { name: "Espresso", desc: "", price: "85 ₺" },
]);
assert.deepEqual(menu[1].items, [
  { name: "Cheesecake", desc: "", price: "150,50 ₺" },
  { name: "Brownie", desc: "", price: "95 TL" },
]);
assert.deepEqual(toMenu([]), []);

console.log("ok");
