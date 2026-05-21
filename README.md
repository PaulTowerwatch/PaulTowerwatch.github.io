# Paul Tower Fine Timepieces — Web

Web estática para GitHub Pages que recibe pedidos de relojes personalizados.

🌐 **Producción:** `https://paultower-ui.github.io`

## 📁 Estructura del repositorio

```
paultower-clasica/
├── README.md
├── INSTRUCCIONES.md         ← Pasos para conectar Google Sheets + emails
├── Code.gs                  ← Script de Google Apps Script (copiar a tu Google)
├── .gitignore
├── index.html               ← Web principal
├── gracias.html             ← Página de confirmación
├── logo-paul-tower.png
└── fotos-relojes/
    ├── datejust-arabes.png
    ├── datejust-verde.png
    ├── gmt-master.png
    └── nautilus.png
```

## 🔧 Sistema de pedidos

Como GitHub Pages **no ejecuta PHP**, los pedidos se procesan con **Google Apps Script + Google Sheets**:

1. El formulario de la web envía los datos en JSON al Apps Script (URL única tuya).
2. El script añade una fila a tu Google Sheet (es tu Excel en la nube).
3. Te llega un email automático a `Paul.tower20@gmail.com` con los datos.
4. El cliente recibe un email de confirmación.
5. Los logos subidos se guardan en una carpeta de tu Google Drive.

**Coste:** 0 €. Google Apps Script es gratis hasta 20.000 emails al día.

## 🚀 Cómo desplegar

Lee `INSTRUCCIONES.md` para el paso a paso completo. Resumen:

1. Crear la Google Sheet de pedidos con la cabecera indicada.
2. Pegar `Code.gs` en Apps Script y desplegar como aplicación web.
3. Copiar la URL que te da Google.
4. Pegar esa URL en `index.html` (busca `REEMPLAZA_ESTO_CON_LA_URL_DE_TU_APPS_SCRIPT`).
5. Subir todo a tu repo `paultower-ui/paultower-ui.github.io`.
6. Activar GitHub Pages desde Settings.

## 🎨 Cosas que tienes que saber sobre el configurador

El configurador adapta dinámicamente las opciones según el modelo elegido:

- **Datejust (Árabes y Verde):** disponibles Acero, Acero dorado, Dos tonos. Incluye selector de **Bisel** (Estriado / Liso).
- **GMT Master II y Nautilus:** solo disponible Acero. Sin selector de bisel.

Si quieres añadir o quitar opciones, busca en `index.html` los `data-only="da,dv"` y modifícalos.
