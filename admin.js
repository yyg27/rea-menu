import { ADMIN_API_URL, parseCSV, fromRows, h } from "./menu.js";

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
let cats = [], password = "", version = "", dirty = false, edits = 0;

function session(op, val) {
  try { return op === "get" ? sessionStorage.getItem("rea-admin") : sessionStorage.setItem("rea-admin", val); }
  catch { return null; }
}

async function api(body) {
  let res, data;
  try {
    res = await fetch(ADMIN_API_URL, { method: "POST", body: JSON.stringify({ password, ...body }) });
  } catch {
    throw new Error("Bağlantı kurulamadı, internetinizi kontrol edin.");
  }
  try {
    data = await res.json();
  } catch {
    throw new Error("Sunucudan beklenmeyen cevap geldi. Apps Script kurulumunu kontrol edin."); // ör. erişim "Herkes" değil
  }
  if (data.error) throw new Error(data.error);
  return data;
}

function changed() {
  dirty = true;
  edits++;
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
    const data = await api({ action: "load" });
    cats = fromRows(data.rows);
    version = data.version;
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
  const at = edits;
  try {
    if (!demo) version = (await api({ action: "save", rows: toRows(cats), version })).version;
    if (edits !== at) {
      // kayıt sürerken yazılanlar bu kayda girmedi
      $("status").textContent = "Kaydedildi, ama sonradan yapılan değişiklikler var";
      $("status").className = "warn";
      return;
    }
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
