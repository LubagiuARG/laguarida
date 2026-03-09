// ============================================================
//  config.js — EDITÁ ESTE ARCHIVO CON TUS DATOS
// ============================================================

const CONFIG = {

  // ── WhatsApp ──────────────────────────────────────────────
  // Tu número en formato internacional SIN el +
  // Ejemplo Argentina: 5491155556666
  WHATSAPP_NUMBER: "5491131562525",

  // ── Google Sheets ─────────────────────────────────────────
  // Pegá acá la URL completa que te dio Google al publicar como CSV
  // (Archivo → Compartir → Publicar en la web → Menu → CSV)
  SHEET_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSgnsJOGvxjvZHic6qdXJ7pzmBK-33CzwusadZsjG5a4Vo8TMlT833PVdZfa2g5Gj8lI8RQtGq6W7SS/pub?gid=432388965&single=true&output=csv",

  // ── Nombre del local ──────────────────────────────────────
  RESTAURANT_NAME: "La Guarida Burgers",

  // ── Moneda ────────────────────────────────────────────────
  CURRENCY_SYMBOL: "$",

  // ── Caché (segundos) ──────────────────────────────────────
  // Cuánto tiempo guardar el menú en memoria antes de volver a pedir a Sheets
  // 300 = 5 minutos. Subilo si tus precios no cambian muy seguido.
  CACHE_TTL: 100,

};
