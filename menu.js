// Google Sheets → Dosya → Paylaş → Web'de yayınla → CSV linki buraya. Boşsa sample.csv kullanılır.
const SHEET_CSV_URL = "";
const CACHE_KEY = "rea-menu-csv";
const SOLD_OUT = ["hayır", "hayir", "0", "yok", "no", "false"];

export function parseCSV(text) {
  const rows = [];
  let row = [], cell = "", quoted = false;
  text = text.replace(/^﻿/, "");
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') quoted = false;
      else cell += ch;
    } else if (ch === '"') quoted = true;
    else if (ch === ",") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cell); rows.push(row); row = []; cell = "";
    } else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}

export function toMenu(rows) {
  if (!rows.length) return [];
  const head = rows[0].map(h => h.trim().toLocaleLowerCase("tr"));
  const col = name => head.indexOf(name);
  const [cK, cU, cA, cF, cAk] = ["kategori", "ürün", "açıklama", "fiyat", "aktif"].map(col);
  const get = (r, c) => (c < 0 ? "" : (r[c] ?? "").trim());
  const cats = new Map();
  for (const r of rows.slice(1)) {
    const name = get(r, cU), price = get(r, cF);
    if (!name || !price) continue;
    const cat = get(r, cK) || "Diğer";
    if (!cats.has(cat)) cats.set(cat, []);
    cats.get(cat).push({
      name,
      desc: get(r, cA),
      price: /^[\d.,]+$/.test(price) ? price + " ₺" : price,
      soldOut: SOLD_OUT.includes(get(r, cAk).toLocaleLowerCase("tr")),
    });
  }
  return [...cats].map(([name, items]) => ({ name, items }));
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text; // textContent: Sheets içeriği HTML olarak çalışmasın
  return e;
}

function render(menu) {
  const nav = document.getElementById("tabs"), main = document.getElementById("menu");
  nav.replaceChildren(); main.replaceChildren();
  menu.forEach((cat, i) => {
    const a = el("a", "", cat.name);
    a.href = "#k" + i;
    nav.append(a);
    const sec = el("section");
    sec.id = "k" + i;
    sec.append(el("h2", "", cat.name));
    for (const it of cat.items) {
      const li = el("div", it.soldOut ? "item sold-out" : "item");
      const row = el("div", "row");
      row.append(el("span", "name", it.name), el("span", "dots"), el("span", "price", it.soldOut ? "Kalmadı" : it.price));
      li.append(row);
      if (it.desc) li.append(el("p", "desc", it.desc));
      sec.append(li);
    }
    main.append(sec);
  });
}

function cache(op, val) {
  try { return op === "get" ? localStorage.getItem(CACHE_KEY) : localStorage.setItem(CACHE_KEY, val); }
  catch { return null; }
}

async function load() {
  try {
    const res = await fetch(SHEET_CSV_URL || "sample.csv", { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    const text = await res.text();
    const menu = toMenu(parseCSV(text));
    if (!menu.length) throw new Error("boş menü"); // yayından kalkmış/bozuk tablo
    cache("set", text);
    return render(menu);
  } catch {
    const old = cache("get");
    if (old) return render(toMenu(parseCSV(old)));
    document.getElementById("menu").replaceChildren(el("p", "error", "Menü şu an yüklenemedi, lütfen biraz sonra tekrar deneyin."));
  }
}

if (typeof document !== "undefined") load();
