// ============================================================
//  cart.js — Lógica del carrito y WhatsApp
// ============================================================

let cart = [];
let currentProduct = null;
let currentCat     = null;
let currentQty     = 1;
let selectedSize   = null;
let removedIngredients = [];
let selectedSauces = [];
let selectedExtras = [];   // ← NUEVO: agregados con costo

// ── Modal ────────────────────────────────────────────────────
function openModal(cat, id) {
  const menu = _menuCache;
  if (!menu) return;
  const product = menu.categoriesMap[cat]?.find(p => p.id === id);
  if (!product) return;

  currentProduct     = product;
  currentCat         = cat;
  currentQty         = 1;
  selectedSize       = product.sizes?.[0] ? { ...product.sizes[0] } : null;
  removedIngredients = [];
  selectedSauces     = [];
  selectedExtras     = [];   // ← NUEVO: resetear extras

  document.getElementById("modalTitle").textContent = product.name;
  document.getElementById("modalDesc").textContent  = product.desc;
  document.getElementById("modalPrice").textContent =
    `${CONFIG.CURRENCY_SYMBOL}${product.price.toLocaleString("es-AR")}`;
  document.getElementById("qtyNum").textContent = 1;
  document.getElementById("notesInput").value   = "";

  // Imagen o emoji
  const imgWrap = document.getElementById("modalImgWrap");
  if (product.image) {
    imgWrap.innerHTML = `
      <img src="${product.image}" alt="${product.name}" class="modal-real-img"
           onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
      <div class="modal-emoji" style="display:none">${product.emoji}</div>`;
  } else {
    imgWrap.innerHTML = `<div class="modal-emoji">${product.emoji}</div>`;
  }

  // Sizes
  const sizeGroup = document.getElementById("sizeGroup");
  const sizePills = document.getElementById("sizePills");
  if (product.sizes?.length > 1) {
    sizePills.innerHTML = product.sizes.map((s, i) =>
      `<button class="pill ${i===0?"active":""}" onclick="selectSize(this,${i})">
        ${s.label}${s.extra > 0 ? ` +${CONFIG.CURRENCY_SYMBOL}${s.extra.toLocaleString("es-AR")}` : ""}
       </button>`
    ).join("");
    sizeGroup.style.display = "block";
  } else {
    sizeGroup.style.display = "none";
  }

  // Ingredientes
  const ingGroup = document.getElementById("ingGroup");
  const ingPills = document.getElementById("ingPills");
  if (product.ingredients?.length > 1) {
    ingPills.innerHTML = product.ingredients.map(ing =>
      `<button class="pill remove active" onclick="toggleIngredient(this,'${ing}')">${ing}</button>`
    ).join("");
    ingGroup.style.display = "block";
  } else {
    ingGroup.style.display = "none";
  }

  // Aderezos
  const sauceGroup = document.getElementById("sauceGroup");
  const saucePills = document.getElementById("saucePills");
  if (product.sauces?.length) {
    saucePills.innerHTML = product.sauces.map(s =>
      `<button class="pill" onclick="toggleSauce(this,'${s}')">${s}</button>`
    ).join("");
    sauceGroup.style.display = "block";
  } else {
    sauceGroup.style.display = "none";
  }

  // ── NUEVO: Agregados con costo ───────────────────────────
  const extraGroup = document.getElementById("extraGroup");
  const extraPills = document.getElementById("extraPills");
  if (product.extras?.length) {
    extraPills.innerHTML = product.extras.map((e, i) =>
      `<button class="pill" onclick="toggleExtra(this,${i})">
        ${e.label} +${CONFIG.CURRENCY_SYMBOL}${e.price.toLocaleString("es-AR")}
       </button>`
    ).join("");
    extraGroup.style.display = "block";
  } else {
    if (extraGroup) extraGroup.style.display = "none";
  }
  // ────────────────────────────────────────────────────────

  updateModalPrice();
  document.getElementById("modalOverlay").classList.add("open");
  document.body.style.overflow = "hidden";
}

function closeModal() {
  document.getElementById("modalOverlay").classList.remove("open");
  document.body.style.overflow = "";
}

function handleOverlayClick(e) {
  if (e.target === document.getElementById("modalOverlay")) closeModal();
}

function selectSize(btn, idx) {
  document.querySelectorAll("#sizePills .pill").forEach(p => p.classList.remove("active"));
  btn.classList.add("active");
  selectedSize = currentProduct.sizes[idx];
  updateModalPrice();
}

function toggleIngredient(btn, ing) {
  btn.classList.toggle("active");
  if (!btn.classList.contains("active")) removedIngredients.push(ing);
  else removedIngredients = removedIngredients.filter(i => i !== ing);
}

function toggleSauce(btn, sauce) {
  btn.classList.toggle("active");
  if (btn.classList.contains("active")) selectedSauces.push(sauce);
  else selectedSauces = selectedSauces.filter(s => s !== sauce);
}

// ── NUEVO: Toggle de extras con costo ───────────────────────
function toggleExtra(btn, idx) {
  const extra = currentProduct.extras[idx];
  btn.classList.toggle("active");
  if (btn.classList.contains("active")) {
    selectedExtras.push({ ...extra });
  } else {
    selectedExtras = selectedExtras.filter(e => e.label !== extra.label);
  }
  updateModalPrice();
}
// ────────────────────────────────────────────────────────────

function changeQty(delta) {
  currentQty = Math.max(1, currentQty + delta);
  document.getElementById("qtyNum").textContent = currentQty;
  updateModalPrice();
}

function updateModalPrice() {
  const base       = currentProduct.price;
  const extra      = selectedSize?.extra || 0;
  // ← NUEVO: sumar el costo de todos los extras seleccionados
  const extrasSum  = selectedExtras.reduce((sum, e) => sum + e.price, 0);
  const total      = (base + extra + extrasSum) * currentQty;
  document.getElementById("modalTotalPrice").textContent =
    `${CONFIG.CURRENCY_SYMBOL}${total.toLocaleString("es-AR")}`;
}

function addToCart() {
  const base      = currentProduct.price;
  const extra     = selectedSize?.extra || 0;
  // ← NUEVO: incluir costo de extras en el precio unitario
  const extrasSum = selectedExtras.reduce((sum, e) => sum + e.price, 0);
  const unitPrice = base + extra + extrasSum;

  cart.push({
    id:        Date.now(),
    product:   currentProduct,
    size:      selectedSize?.label || null,
    removed:   [...removedIngredients],
    sauces:    [...selectedSauces],
    extras:    [...selectedExtras],   // ← NUEVO
    qty:       currentQty,
    unitPrice,
    notes:     document.getElementById("notesInput").value.trim()
  });

  updateCartUI();
  closeModal();

  // Feedback visual en el botón
  const btn = document.querySelector(".cart-btn");
  if (btn) { btn.style.transform = "scale(1.1)"; setTimeout(() => btn.style.transform = "", 200); }
}

// ── Carrito ──────────────────────────────────────────────────
function updateCartUI() {
  const total    = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);

  document.getElementById("cartCount").textContent = totalQty;
  document.getElementById("fabCount").textContent  = totalQty;
  document.getElementById("cartTotal").textContent =
    `${CONFIG.CURRENCY_SYMBOL}${total.toLocaleString("es-AR")}`;

  const fab = document.getElementById("fab");
  if (fab) fab.style.display = totalQty > 0 ? "flex" : "none";

  const container = document.getElementById("cartItems");
  if (cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <div class="cart-empty-icon">🛒</div>
        <p>Tu pedido está vacío.<br>¡Elegí algo del menú!</p>
      </div>`;
    return;
  }

  container.innerHTML = cart.map(item => {
    const details = [];
    if (item.size)           details.push(`Tamaño: ${item.size}`);
    if (item.removed.length) details.push(`Sin: ${item.removed.join(", ")}`);
    if (item.sauces.length)  details.push(`Aderezos: ${item.sauces.join(", ")}`);
    // ← NUEVO: mostrar extras en el carrito
    if (item.extras?.length) details.push(`Extras: ${item.extras.map(e => e.label).join(", ")}`);
    if (item.notes)          details.push(`Nota: ${item.notes}`);
    return `
      <div class="cart-item">
        <span class="ci-emoji">${item.product.image
          ? `<img src="${item.product.image}" class="ci-img" onerror="this.outerHTML='${item.product.emoji}'">`
          : item.product.emoji}</span>
        <div class="ci-info">
          <div class="ci-name">${item.product.name} ×${item.qty}</div>
          ${details.length ? `<div class="ci-details">${details.join(" · ")}</div>` : ""}
          <div class="ci-footer">
            <span class="ci-price">${CONFIG.CURRENCY_SYMBOL}${(item.unitPrice * item.qty).toLocaleString("es-AR")}</span>
            <button class="ci-remove" onclick="removeFromCart(${item.id})">🗑</button>
          </div>
        </div>
      </div>`;
  }).join("");
}

function removeFromCart(id) {
  cart = cart.filter(i => i.id !== id);
  updateCartUI();
}

function toggleCart() {
  const panel   = document.getElementById("cartPanel");
  const overlay = document.getElementById("bgOverlay");
  const isOpen  = panel.classList.contains("open");
  panel.classList.toggle("open");
  overlay.classList.toggle("visible");
  document.body.style.overflow = isOpen ? "" : "hidden";
}

// ── WhatsApp ─────────────────────────────────────────────────
function sendWhatsApp() {
  const name    = document.getElementById("customerName").value.trim();
  const address = document.getElementById("customerAddress").value.trim();
  if (cart.length === 0) { alert("Tu pedido está vacío 😅"); return; }
  if (!address) { 
    document.getElementById("customerAddress").focus();
    document.getElementById("customerAddress").style.borderColor = "#e74c3c";
    setTimeout(() => document.getElementById("customerAddress").style.borderColor = "", 2000);
    alert("📍 Por favor ingresá tu dirección de entrega"); 
    return; 
  }

  let msg = `🍔 *NUEVO PEDIDO — ${CONFIG.RESTAURANT_NAME}*\n`;
  if (name)    msg += `👤 Cliente: *${name}*\n`;
  msg += `📍 Dirección: *${address}*\n`;
  msg += `━━━━━━━━━━━━━━━\n`;

  cart.forEach((item, i) => {
    msg += `\n${i+1}. *${item.product.name}* ×${item.qty}`;
    if (item.size)           msg += `\n   📐 ${item.size}`;
    if (item.removed.length) msg += `\n   ❌ Sin: ${item.removed.join(", ")}`;
    if (item.sauces.length)  msg += `\n   🥫 Aderezos: ${item.sauces.join(", ")}`;
    // ← NUEVO: mostrar extras en el mensaje de WhatsApp
    if (item.extras?.length) msg += `\n   ➕ Agregados: ${item.extras.map(e => `${e.label} (+${CONFIG.CURRENCY_SYMBOL}${e.price.toLocaleString("es-AR")})`).join(", ")}`;
    if (item.notes)          msg += `\n   📝 ${item.notes}`;
    msg += `\n   💰 ${CONFIG.CURRENCY_SYMBOL}${(item.unitPrice * item.qty).toLocaleString("es-AR")}`;
  });

  const total = cart.reduce((s, i) => s + i.unitPrice * i.qty, 0);
  msg += `\n\n━━━━━━━━━━━━━━━`;
  msg += `\n💵 *TOTAL: ${CONFIG.CURRENCY_SYMBOL}${total.toLocaleString("es-AR")}*`;
  msg += `\n\n_Pedido realizado desde el menú online_`;

  window.open(`https://wa.me/${CONFIG.WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`, "_blank");
}