// ============================================================
//  menu.js — Carga y parsea el menú desde Google Sheets
// ============================================================

// Cache en memoria
let _menuCache = null;
let _menuCacheTime = 0;

// Íconos por defecto para cada categoría (por si no se especifica imagen)
const CATEGORY_ICONS = {
  "hamburguesas": "🍔",
  "milanesas":    "🥩",
  "papas":        "🍟",
  "bebidas":      "🥤",
  "postres":      "🍨",
  "extras":       "🥫",
  "default":      "🍽️"
};

// ── Construye la URL pública de la Google Sheet ──────────────
// URL directa desde CONFIG.SHEET_CSV_URL (la URL que da Google al publicar como CSV)

// ── Parsea el CSV de Sheets en un array de objetos ──────────
function parseCSV(csv) {
  const lines = csv.trim().split("\n");
  if (lines.length < 2) return [];

  // La primera fila es el encabezado
  const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim().toLowerCase());

  return lines.slice(2).map(line => {  // slice(2) saltea fila 1 encabezados + fila 2 ayuda
    // Parseo simple tolerante a comas dentro de comillas
    const values = [];
    let cur = "", inQ = false;
    for (let ch of line) {
      if (ch === '"') { inQ = !inQ; continue; }
      if (ch === "," && !inQ) { values.push(cur.trim()); cur = ""; continue; }
      cur += ch;
    }
    values.push(cur.trim());

    const obj = {};
    headers.forEach((h, i) => { obj[h] = values[i] || ""; });
    return obj;
  }).filter(row => row.nombre && row.precio); // descarta filas vacías
}

// ── Transforma las filas en la estructura que usa el menú ───
function buildMenuStructure(rows) {
  const categoriesMap = {};
  const categoriesOrder = [];

  rows.forEach(row => {
    const cat = (row.categoria || "extras").toLowerCase().trim();

    if (!categoriesMap[cat]) {
      categoriesMap[cat] = [];
      categoriesOrder.push(cat);
    }

    // Sizes: columna "combos" con formato  "Simple:0|Doble:1200|Combo:2500"
    let sizes = [{ label: "Porción", extra: 0 }];
    if (row.combos) {
      sizes = row.combos.split("|").map(s => {
        const [label, extra] = s.split(":");
        return { label: label.trim(), extra: parseInt(extra || 0) };
      });
    }

    // Ingredientes: columna "ingredientes" separados por |
    const ingredients = row.ingredientes
      ? row.ingredientes.split("|").map(s => s.trim()).filter(Boolean)
      : [];

    // Aderezos: columna "aderezos" separados por |
    const sauces = row.aderezos
      ? row.aderezos.split("|").map(s => s.trim()).filter(Boolean)
      : [];

    // ── NUEVO: Agregados con costo ───────────────────────────
    // columna "agregados" con formato  "Doble carne:1500|Huevo frito:800|Extra queso:600"
    const extras = row.agregados
      ? row.agregados.split("|").map(s => {
          const [label, price] = s.split(":");
          return { label: label.trim(), price: parseInt(price || 0) };
        }).filter(e => e.label)
      : [];
    // ────────────────────────────────────────────────────────

    categoriesMap[cat].push({
      id:          `${cat}_${categoriesMap[cat].length}`,
      name:        row.nombre,
      price:       parseInt(row.precio) || 0,
      desc:        row.descripcion || "",
      image:       row.imagen || "",        // URL de imagen (Cloudinary, Drive, etc.)
      emoji:       row.emoji || CATEGORY_ICONS[cat] || CATEGORY_ICONS.default,
      badge:       row.badge || "",
      sizes,
      ingredients,
      sauces,
      extras,       // ← NUEVO
      available:   row.disponible !== "no" // si la col dice "no" → oculto
    });
  });

  return { categoriesMap, categoriesOrder };
}

// ── Carga el menú (con caché) ────────────────────────────────
async function loadMenu() {
  // Devolver caché si está fresco
  const now = Date.now() / 1000;
  if (_menuCache && (now - _menuCacheTime) < CONFIG.CACHE_TTL) {
    return _menuCache;
  }

  showLoading(true);

  try {
    const res = await fetch(CONFIG.SHEET_CSV_URL);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const csv = await res.text();
    const rows = parseCSV(csv);
    const menu = buildMenuStructure(rows);

    _menuCache = menu;
    _menuCacheTime = now;
    showLoading(false);
    return menu;

  } catch (err) {
    console.error("Error cargando el menú:", err);
    showLoading(false);
    showError(true);
    return null;
  }
}

// ── Estados de UI ────────────────────────────────────────────
function showLoading(visible) {
  document.getElementById("loadingState").style.display = visible ? "flex" : "none";
  document.getElementById("sectionsWrapper").style.display = visible ? "none" : "block";
}

function showError(visible) {
  document.getElementById("errorState").style.display = visible ? "flex" : "none";
  document.getElementById("loadingState").style.display = "none";
}

// ── Renderiza el menú en el DOM ──────────────────────────────
function renderMenu(menu) {
  if (!menu) return;
  const { categoriesMap, categoriesOrder } = menu;

  // Labels bonitos para las categorías
  const CAT_LABELS = {
    hamburguesas: "🍔 Nuestras Burgers",
    milanesas:    "🥩 Sandwich",
    papas:        "🍟 Combos y papas",
    bebidas:      "🥤 Bebidas",
    postres:      "🍨 Postres & Extras",
    extras:       "🥫 Agregados a las Burgers",
  };

  const CAT_SUBTITLES = {
    hamburguesas: "Carne 100% vacuna, pan brioche artesanal",
    milanesas:    "Milanesas de ternera y pollo, rebozadas al momento",
    papas:        "El complemento perfecto para tu pedido",
    bebidas:      "Refrescate con nuestras opciones",
    postres:      "El final dulce que te merecés",
    extras:       "Salsas y complementos",
  };

  // Nav
  const nav = document.getElementById("catNav");
  nav.innerHTML = categoriesOrder.map((cat, i) => `
    <button class="cat-btn ${i === 0 ? "active" : ""}"
            onclick="showSection('${cat}', this)">
      ${CAT_LABELS[cat] || cat}
    </button>
  `).join("");

  // Sections
  const wrapper = document.getElementById("sectionsWrapper");
  wrapper.innerHTML = categoriesOrder.map((cat, i) => {
    const products = categoriesMap[cat].filter(p => p.available);
    return `
      <section class="section ${i === 0 ? "visible" : ""}" id="sec_${cat}">
        <h2 class="section-title">${CAT_LABELS[cat] || cat}</h2>
        <p class="section-subtitle">${CAT_SUBTITLES[cat] || ""}</p>
        <div class="grid">
          ${products.map(p => renderCard(p, cat)).join("")}
        </div>
      </section>
    `;
  }).join("");
}

// ── Renderiza una tarjeta de producto ────────────────────────
function renderCard(p, cat) {
  const imgContent = p.image
    ? `<img src="${p.image}" alt="${p.name}" class="card-real-img" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    + `<div class="card-img card-img-fallback" style="display:none">${p.emoji}</div>`
    : `<div class="card-img">${p.emoji}</div>`;

  return `
    <div class="card" onclick="openModal('${cat}','${p.id}')">
      ${p.badge ? `<span class="badge">${p.badge}</span>` : ""}
      <div class="card-img-wrap">${imgContent}</div>
      <div class="card-body">
        <div class="card-name">${p.name}</div>
        <div class="card-desc">${p.desc}</div>
        <div class="card-footer">
          <span class="card-price">${CONFIG.CURRENCY_SYMBOL}${p.price.toLocaleString("es-AR")}</span>
          <button class="add-btn" onclick="event.stopPropagation();openModal('${cat}','${p.id}')">+</button>
        </div>
      </div>
    </div>
  `;
}

// ── Navegar entre secciones ──────────────────────────────────
function showSection(id, btn) {
  document.querySelectorAll(".section").forEach(s => s.classList.remove("visible"));
  document.querySelectorAll(".cat-btn").forEach(b => b.classList.remove("active"));
  const sec = document.getElementById(`sec_${id}`);
  if (sec) sec.classList.add("visible");
  if (btn) btn.classList.add("active");
}