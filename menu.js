// Google Sheets → Dosya → Paylaş → Web'de yayınla → CSV linki buraya. Boşsa sample.csv kullanılır.
const SHEET_CSV_URL = "";
const CACHE_KEY = "rea-menu-csv";
const SOLD_OUT = ["hayir", "0", "yok", "no", "false"];
// Karşılaştırma anahtarı: I/ı/İ/i farkını ve Mac'ten gelen ayrık (NFD) harfleri yok sayar
const key = s => s.normalize("NFC").trim().toLowerCase().replace(/\u0307/g, "").replace(/ı/g, "i");

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
  const head = rows[0].map(key);
  const col = name => head.indexOf(name);
  const [cK, cU, cA, cF, cAk] = ["kategori", "ürün", "açıklama", "fiyat", "aktif"].map(n => col(key(n)));
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
      soldOut: SOLD_OUT.includes(key(get(r, cAk))),
    });
  }
  return [...cats].map(([name, items]) => ({ name, items }));
}

// Kategori adına göre ikon; sıra önemli: "Soğuk Kahveler" kahveden önce soğuk olarak yakalanmalı
const ICON_WORDS = [
  ["glass", ["soğuk", "ice", "frozen", "limonata", "smoothie", "milkshake", "frappe", "cold", "meşrubat"]],
  ["cake", ["tatli", "pasta", "kek", "dessert", "cheesecake", "kurabiye"]],
  ["food", ["atiştirmalik", "tost", "sandvi", "kahvalti", "yemek", "snack", "burger", "salata", "makarna", "börek"]],
  ["tea", ["çay", "tea", "bitki"]],
  ["cup", ["kahve", "coffee", "espresso", "sicak", "latte"]],
];
// Sabit, güvenilir SVG'ler (Sheets içeriği değil), innerHTML ile basılabilir
const ICONS = {
  cup: '<path d="M4 9h12v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M16 10h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M8 3c-.8 1 .8 2 0 3M12 3c-.8 1 .8 2 0 3"/><path d="M3 21h14"/>',
  glass: '<path d="M6 7h12l-1.5 13a1 1 0 0 1-1 1h-7a1 1 0 0 1-1-1z"/><path d="M14 7l2-5h2.5"/><path d="M6.8 13h10.4"/>',
  cake: '<path d="M3 20h18v-7L3 9z"/><path d="M3 13l18 4"/><path d="M8 7.5c0-1.5 1-2.5 2-3 .3 1 .2 2-.4 3.2"/>',
  food: '<path d="M7 3v8M5 3v5a2 2 0 0 0 4 0V3M7 11v10"/><path d="M17 21V3c-2 1-3 4-3 8h3"/>',
  tea: '<path d="M5 8h11v4a5.5 5.5 0 0 1-11 0z"/><path d="M16 9h1.5a2 2 0 0 1 0 4H15.5"/><path d="M3 20h15"/><path d="M10.5 3c1.5 1 1.5 3 0 4-1.5-1-1.5-3 0-4z"/>',
  leaf: '<path d="M5 19c0-9 5-14 15-15-1 10-6 15-15 15z"/><path d="M5 19l8-8"/>',
};
function icon(name) {
  const s = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  s.setAttribute("viewBox", "0 0 24 24");
  s.setAttribute("class", "icon");
  s.setAttribute("aria-hidden", "true");
  s.innerHTML = ICONS[iconFor(name)];
  return s;
}

export function iconFor(name) {
  const k = key(name);
  return ICON_WORDS.find(([, words]) => words.some(w => k.includes(w)))?.[0] ?? "leaf";
}

// Kategorileri sırayı bozmadan ikiye böler; ön/arka yüz için 0.45 (ön yüzde logo var), sütunlar için 0.5
export function splitPages(menu, share = 0.45) {
  if (menu.length < 2) return [menu, []];
  const w = menu.map(c => c.items.length + 2); // +2: kategori başlığı
  const target = w.reduce((a, b) => a + b) * share;
  let best = 1, bestDiff = Infinity, sum = 0;
  for (let i = 1; i < menu.length; i++) {
    sum += w[i - 1];
    if (Math.abs(sum - target) < bestDiff) { best = i; bestDiff = Math.abs(sum - target); }
  }
  return [menu.slice(0, best), menu.slice(best)];
}

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text) e.textContent = text; // textContent: Sheets içeriği HTML olarak çalışmasın
  return e;
}

export function section(cat) {
  const sec = el("section");
  const h2 = el("h2");
  h2.append(icon(cat.name), el("span", "", cat.name));
  sec.append(h2);
  for (const it of cat.items) {
    const li = el("div", it.soldOut ? "item sold-out" : "item");
    const row = el("div", "row");
    row.append(el("span", "name", it.name), el("span", "dots"), el("span", "price", it.soldOut ? "Kalmadı" : it.price));
    li.append(row);
    if (it.desc) li.append(el("p", "desc", it.desc));
    sec.append(li);
  }
  return sec;
}

function render(menu) {
  const nav = document.getElementById("tabs"), main = document.getElementById("menu");
  nav.replaceChildren(); main.replaceChildren();
  menu.forEach((cat, i) => {
    const a = el("a", "", cat.name);
    a.href = "#k" + i;
    nav.append(a);
    const sec = section(cat);
    sec.id = "k" + i;
    main.append(sec);
  });
  // Kaydırırken o an okunan kategorinin butonu dolu kırmızı olur
  const links = [...nav.children], secs = [...main.children];
  let current = -1;
  const update = () => {
    const line = nav.getBoundingClientRect().bottom + 24;
    let i = secs.findLastIndex(s => s.getBoundingClientRect().top <= line);
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 2) i = secs.length - 1; // en alttaki kısa kategori de seçilebilsin
    i = Math.max(i, 0);
    if (i === current) return;
    links[current]?.classList.remove("active");
    links[i].classList.add("active");
    nav.scrollTo({ left: links[i].offsetLeft - 16, behavior: "smooth" });
    current = i;
  };
  addEventListener("scroll", update, { passive: true });
  update();
}

function cache(op, val) {
  try { return op === "get" ? localStorage.getItem(CACHE_KEY) : localStorage.setItem(CACHE_KEY, val); }
  catch { return null; }
}

// Sheets → olmazsa son kaydedilen menü → o da yoksa null
export async function getMenu() {
  try {
    const res = await fetch(SHEET_CSV_URL || "sample.csv", { cache: "no-store", signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(res.status);
    const text = await res.text();
    const menu = toMenu(parseCSV(text));
    if (!menu.length) throw new Error("boş menü"); // yayından kalkmış/bozuk tablo
    cache("set", text);
    return menu;
  } catch {
    const old = cache("get");
    return old ? toMenu(parseCSV(old)) : null;
  }
}

async function load() {
  const menu = await getMenu();
  if (menu) return render(menu);
  document.getElementById("menu").replaceChildren(el("p", "error", "Menü şu an yüklenemedi, lütfen biraz sonra tekrar deneyin."));
}

if (typeof document !== "undefined" && document.getElementById("tabs")) load();
