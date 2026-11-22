import { ADMIN_API_URL, key, isSoldOut, parseCSV } from "./menu.js";

const COLS = ["kategori", "ürün", "açıklama", "fiyat", "aktif"];

// Tablo satırları → panel. Eksik satırlar atılmaz (düzeltilsin diye), fiyat ham kalır.
export function fromRows(rows) {
  if (!rows.length) return [];
  const head = rows[0].map(key);
  const [cK, cU, cA, cF, cAk] = COLS.map(n => head.indexOf(key(n)));
  const get = (r, c) => (c < 0 ? "" : (r[c] ?? "").trim());
  const cats = new Map();
  for (const r of rows.slice(1)) {
    if (r.every(v => !v.trim())) continue;
    const cat = get(r, cK) || "Diğer";
    if (!cats.has(cat)) cats.set(cat, []);
    cats.get(cat).push({ name: get(r, cU), desc: get(r, cA), price: get(r, cF), soldOut: isSoldOut(get(r, cAk)) });
  }
  return [...cats].map(([name, items]) => ({ name, items }));
}

// Panel → tablo satırları (başlıksız). Tamamen boş ürün satırları atılır.
export function toRows(cats) {
  return cats.flatMap(c => c.items
    .map(i => [c.name, i.name, i.desc, i.price].map(v => v.trim()).concat(i.soldOut ? "hayır" : "evet"))
    .filter(([, name, desc, price]) => name || desc || price));
}

// Kaydetmeyi engelleyen eksikler; boşsa kaydedilebilir
export function validate(cats) {
  const errors = [];
  for (const c of cats) {
    const items = c.items.filter(i => i.name.trim() || i.desc.trim() || i.price.trim());
    if (items.length && !c.name.trim()) errors.push("Adı boş bir kategori var");
    for (const i of items) {
      if (!i.price.trim()) errors.push(`${c.name.trim()}: ${i.name.trim()} için fiyat yok`);
      else if (!i.name.trim()) errors.push(`${c.name.trim()}: ${i.price.trim()} fiyatlı ürünün adı yok`);
    }
  }
  return errors;
}

// ---- Arayüz (yalnız admin.html'de) ----

const $ = id => document.getElementById(id);
const demo = !ADMIN_API_URL;
let cats = [], password = "", dirty = false;

function h(tag, props = {}, ...children) {
  const e = Object.assign(document.createElement(tag), props); // value/textContent: içerik HTML olarak çalışmaz
  e.append(...children);
  return e;
}

function session(op, val) {
  try { return op === "get" ? sessionStorage.getItem("rea-admin") : sessionStorage.setItem("rea-admin", val); }
  catch { return null; }
}

async function api(body) {
  let data;
  try {
    const res = await fetch(ADMIN_API_URL, { method: "POST", body: JSON.stringify({ password, ...body }) });
    data = await res.json();
  } catch {
    throw new Error("Bağlantı kurulamadı, internetinizi kontrol edin.");
  }
  if (data.error) throw new Error(data.error);
  return data;
}

function changed() {
  dirty = true;
  $("status").textContent = "Kaydedilmemiş değişiklikler var";
  $("status").className = "warn";
}

function itemRow(cat, item) {
  const field = (cls, prop, placeholder, extra = {}) =>
    h("input", { className: cls, value: item[prop], placeholder, ...extra, oninput: e => { item[prop] = e.target.value; changed(); } });
  const sold = h("input", { type: "checkbox", checked: item.soldOut, onchange: e => { item.soldOut = e.target.checked; row.classList.toggle("sold", item.soldOut); changed(); } });
  const row = h("div", { className: "row" + (item.soldOut ? " sold" : "") },
    field("name", "name", "Ürün adı", { ariaLabel: "Ürün adı" }),
    field("price", "price", "Fiyat", { inputMode: "decimal", ariaLabel: "Fiyat" }),
    field("desc", "desc", "Açıklama (isteğe bağlı)", { ariaLabel: "Açıklama" }),
    h("label", { className: "toggle" }, sold, h("span", { textContent: "Kalmadı" })),
    h("button", { type: "button", className: "del", textContent: "Sil", onclick: () => {
      cat.items.splice(cat.items.indexOf(item), 1); changed(); render();
    } }),
  );
  return row;
}

function render() {
  $("cats").replaceChildren(...cats.map(cat => h("section", { className: "cat" },
    h("div", { className: "cat-head" },
      h("input", { className: "cat-name", value: cat.name, ariaLabel: "Kategori adı", oninput: e => { cat.name = e.target.value; changed(); } }),
      h("button", { type: "button", className: "del", textContent: "Kategoriyi sil", onclick: () => {
        if (!confirm(`"${cat.name}" kategorisi ve içindeki ${cat.items.length} ürün silinsin mi?`)) return;
        cats.splice(cats.indexOf(cat), 1); changed(); render();
      } }),
    ),
    ...cat.items.map(item => itemRow(cat, item)),
    h("button", { type: "button", className: "add", textContent: "+ Ürün ekle", onclick: () => {
      cat.items.push({ name: "", desc: "", price: "", soldOut: false }); changed(); render();
      $("cats").querySelectorAll(".cat")[cats.indexOf(cat)].querySelector(".row:last-of-type .name").focus();
    } }),
  )));
}

async function load() {
  if (demo) {
    const res = await fetch("sample.csv", { cache: "no-store" });
    cats = fromRows(parseCSV(await res.text()));
  } else {
    cats = fromRows((await api({ action: "load" })).rows);
  }
  render();
  $("login").hidden = true;
  $("editor").hidden = false;
}

async function save() {
  const errors = validate(cats);
  $("errors").replaceChildren(...errors.map(e => h("li", { textContent: e })));
  $("errors").hidden = !errors.length;
  if (errors.length) {
    $("status").textContent = "Kaydedilmedi: önce eksikleri tamamlayın";
    $("status").className = "warn";
    return;
  }
  const btn = $("save");
  btn.disabled = true;
  $("status").textContent = "Kaydediliyor…";
  $("status").className = "";
  try {
    if (!demo) await api({ action: "save", rows: toRows(cats) });
    dirty = false;
    $("status").textContent = demo ? "Demo: değişiklikler kaydedilmedi" : "Kaydedildi ✓ Menüye birkaç dakika içinde yansır.";
    $("status").className = "ok";
  } catch (err) {
    $("status").textContent = err.message;
    $("status").className = "warn";
  } finally {
    btn.disabled = false;
  }
}

if (typeof document !== "undefined" && $("admin")) {
  $("demo").hidden = !demo;
  $("login").onsubmit = async e => {
    e.preventDefault();
    password = $("password").value;
    $("login-error").textContent = "";
    try {
      await load();
      session("set", password);
    } catch (err) {
      $("login-error").textContent = err.message;
    }
  };
  $("add-cat").onclick = () => {
    const name = prompt("Yeni kategorinin adı:")?.trim();
    if (!name) return;
    cats.push({ name, items: [{ name: "", desc: "", price: "", soldOut: false }] });
    changed(); render();
    $("cats").lastElementChild.scrollIntoView({ behavior: "smooth" });
  };
  $("save").onclick = save;
  addEventListener("beforeunload", e => { if (dirty) e.preventDefault(); });
  password = session("get") || "";
  if (demo || password) load().catch(err => { console.error("load failed", err); $("login").hidden = false; });
  else $("login").hidden = false;
}
