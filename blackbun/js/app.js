// ============================================================
//  app.js — Punto de entrada
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  const menu = await loadMenu();
  if (menu) renderMenu(menu);
  document.getElementById("fab").style.display = "none";
});
