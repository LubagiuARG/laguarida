# 🍔 The Black Bun — Guía de configuración

## Estructura de archivos

```
blackbun/
├── index.html          ← El menú (no tocar)
├── css/
│   └── style.css       ← Estilos (no tocar)
└── js/
    ├── config.js       ← ✏️  TUS DATOS (sí editar)
    ├── menu.js         ← Carga Sheets (no tocar)
    ├── cart.js         ← Carrito y WhatsApp (no tocar)
    └── app.js          ← Inicio (no tocar)
```

---

## Paso 1 — Crear el Google Sheet

1. Entrá a [sheets.google.com](https://sheets.google.com) y creá una planilla nueva.
2. Renombrá la primera hoja (pestaña) como **`Menu`**
3. En la primera fila poné exactamente estos encabezados (en minúsculas):

| categoria | nombre | precio | descripcion | imagen | emoji | badge | combos | ingredientes | aderezos | disponible |
|-----------|--------|--------|-------------|--------|-------|-------|--------|--------------|----------|------------|

### Descripción de cada columna

| Columna | Descripción | Ejemplo |
|---------|-------------|---------|
| `categoria` | Sección del menú | `hamburguesas` |
| `nombre` | Nombre del producto | `Classic Smash` |
| `precio` | Precio base (solo número) | `4500` |
| `descripcion` | Descripción corta | `Doble carne, cheddar, pickles` |
| `imagen` | URL de la foto (ver Paso 2) | `https://res.cloudinary.com/...` |
| `emoji` | Emoji de respaldo | `🍔` |
| `badge` | Etiqueta especial (opcional) | `⭐ Más pedida` |
| `combos` | Tamaños separados por `\|` con formato `Nombre:PrecioExtra` | `Simple:0\|Doble:1200\|Combo papas:2500` |
| `ingredientes` | Ingredientes personalizables, separados por `\|` | `Lechuga\|Tomate\|Cebolla\|Cheddar` |
| `aderezos` | Aderezos disponibles, separados por `\|` | `Ketchup\|Mayonesa\|BBQ` |
| `disponible` | Dejar vacío o escribir `no` para ocultar | *(vacío)* o `no` |

### Ejemplo de fila completa

```
hamburguesas | Classic Smash | 4500 | Doble carne smash, cheddar americano | https://... | 🍔 | ⭐ Más pedida | Simple:0|Doble:1200|Combo:2500 | Lechuga|Tomate|Cebolla | Ketchup|Mayonesa|BBQ | 
```

---

## Paso 2 — Subir imágenes a Cloudinary (gratis)

1. Creá una cuenta gratuita en [cloudinary.com](https://cloudinary.com)
2. En el panel, hacé clic en **Media Library → Upload**
3. Subí la foto de cada producto
4. Hacé clic derecho sobre la imagen → **Copy URL**
5. Pegá esa URL en la columna `imagen` del Sheet

> **Tip:** Recomendamos imágenes de 800×600px máximo para carga rápida.

---

## Paso 3 — Publicar el Sheet

Para que el menú pueda leer la planilla **sin necesidad de login**:

1. En Google Sheets: **Archivo → Compartir → Publicar en la web**
2. En el primer desplegable elegí la hoja **Menu**
3. En el segundo elegí **Valores separados por comas (.csv)**
4. Hacé clic en **Publicar** y confirmá
5. Copiá el ID de la URL de tu planilla:
   ```
   https://docs.google.com/spreadsheets/d/  ← ESTE TRAMO →  /edit
   ```

---

## Paso 4 — Configurar el proyecto

Abrí el archivo `js/config.js` con cualquier editor de texto y completá:

```javascript
const CONFIG = {
  WHATSAPP_NUMBER: "5491155556666",   // ← tu número sin +
  SHEET_ID:        "1BxiMV...abc",    // ← el ID del Sheet
  SHEET_NAME:      "Menu",            // ← nombre de la hoja
  RESTAURANT_NAME: "El nombre de tu local",
  CURRENCY_SYMBOL: "$",
  CACHE_TTL:       300,               // segundos entre recargas
};
```

---

## Paso 5 — Subir a GitHub Pages (gratis)

1. Creá una cuenta en [github.com](https://github.com) si no tenés
2. Creá un repositorio nuevo (ej: `menu-blackbun`)
3. Subí todos los archivos del proyecto
4. En el repositorio: **Settings → Pages**
5. En "Source" elegí **Deploy from a branch → main → / (root)**
6. Guardá. En unos minutos tu menú estará en:
   ```
   https://TU_USUARIO.github.io/menu-blackbun/
   ```

¡Compartí ese link por Instagram, WhatsApp o donde quieras! 🎉

---

## Actualizar precios / productos

Solo editá la planilla de Google Sheets. Los cambios se reflejan en el menú automáticamente en el tiempo configurado en `CACHE_TTL` (por defecto 5 minutos).

**No hace falta tocar código nunca más.**

---

## Preguntas frecuentes

**¿Puedo ocultar un producto temporalmente?**
Sí, escribí `no` en la columna `disponible`. Para volver a mostrarlo, borrá ese valor.

**¿Puedo tener categorías propias?**
Sí, escribí cualquier nombre en la columna `categoria`. Si no tiene emoji/icono definido en el código, se mostrará el icono genérico 🍽️.

**¿Funciona sin internet?**
No, requiere conexión para cargar el menú desde Sheets. Pero una vez cargado, el pedido se puede armar sin conexión.
