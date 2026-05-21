# 📋 Instrucciones de despliegue — Paul Tower

Esta guía te llevará desde "tengo el ZIP descargado" hasta "mi web está online recibiendo pedidos". Tiempo estimado: **15-20 minutos**.

---

## PARTE 1 — Configurar Google Sheets (recibir pedidos)

### Paso 1.1 — Crear la hoja de pedidos

1. Entra a [sheets.google.com](https://sheets.google.com) con la cuenta `Paul.tower20@gmail.com` (importante: los emails saldrán de esa cuenta).
2. Click en **➕ En blanco** para crear una nueva hoja.
3. Renómbrala (arriba a la izquierda): **Paul Tower — Pedidos**.
4. En la **fila 1**, pega esta cabecera (cópiala y pégala directamente en la celda A1):

```
ID_Pedido	Fecha_Hora	Tipo_Pedido	Cliente_Nombre	Cliente_Email	Cliente_WhatsApp	Modelo_Reloj	Referencia	Nombre_Esfera	Color_Esfera	Tipo_Caja	Correa	Acabado_Caja	Notas	Estado	Logo
```

   *(Los tabuladores entre palabras hacen que Google Sheets ponga cada columna donde toca).*

5. Opcional: pon la fila 1 en negrita y un color de fondo para diferenciarla.

### Paso 1.2 — Pegar el script

1. En la misma Sheet, menú: **Extensiones → Apps Script**.
2. Se abre un editor de código en una pestaña nueva.
3. **Borra todo** el contenido que aparece por defecto (suele ser `function myFunction() {}`).
4. Abre el archivo `Code.gs` de este proyecto, copia TODO su contenido y pégalo en el editor.
5. Arriba a la izquierda, dale al icono de **💾 guardar** (o Ctrl+S).
6. Renombra el proyecto (arriba): **Paul Tower - Receptor de pedidos**.

### Paso 1.3 — Probar que el script funciona

1. En el editor de Apps Script, arriba verás un selector de función. Elige **`probarTodo`**.
2. Click en **▶ Ejecutar**.
3. Google te pedirá permisos. Es normal:
   - "Revisar permisos" → elige tu cuenta `Paul.tower20@gmail.com`.
   - Verás una pantalla "Google no ha verificado esta aplicación" → clic en **"Configuración avanzada"** → **"Ir a Paul Tower - Receptor de pedidos (no seguro)"**. Es seguro: es TU script.
   - Acepta los permisos solicitados (acceso a Sheets, Drive y Gmail).
4. Cuando termine de ejecutarse, verifica:
   - **En tu Sheet:** debe aparecer una fila nueva con datos de prueba.
   - **En tu Gmail:** debes haber recibido un email con asunto que empieza por "🔔 Nuevo pedido PT-...".

✅ Si las dos cosas pasaron, **tu sistema funciona**. Borra esa fila de prueba para empezar limpio.

### Paso 1.4 — Desplegar el script como aplicación web

1. En el editor, esquina superior derecha: **Implementar → Nueva implementación**.
2. Al lado de "Seleccionar tipo" hay un icono de ⚙. Clic ahí → **Aplicación web**.
3. Configura así:
   - **Descripción:** `Receptor de pedidos`
   - **Ejecutar como:** Yo (`Paul.tower20@gmail.com`)
   - **Quién tiene acceso:** ⚠️ **Cualquier persona** ← MUY IMPORTANTE
4. Click en **Implementar**.
5. Google te muestra una URL larga. Copia esa **URL de la aplicación web** (es del tipo `https://script.google.com/macros/s/AKfycbx.../exec`). La necesitas para el siguiente paso.
6. Guárdala en un sitio seguro (no la compartas públicamente).

---

## PARTE 2 — Conectar la web a tu Sheet

### Paso 2.1 — Editar el `index.html` de cada versión

Abre `index.html` con un editor de código (Notepad, VS Code, Sublime, lo que sea).

Busca esta línea (está cerca del final, dentro del `<script>`):

```javascript
const APPS_SCRIPT_URL = 'REEMPLAZA_ESTO_CON_LA_URL_DE_TU_APPS_SCRIPT';
```

Reemplázala por:

```javascript
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx.../exec';
```

(usando tu URL real del paso 1.4).

Guarda los dos archivos.

### Paso 2.2 — Prueba en local (opcional pero recomendado)

1. Abre el `index.html` de la versión que quieras (doble click) en el navegador.
2. Ve al configurador, rellena un pedido de prueba con TU email.
3. Dale a "Enviar".
4. Verifica:
   - Te redirige a `gracias.html`.
   - En tu Sheet aparece una fila nueva.
   - En tu Gmail llega el email.

⚠️ Si en local te da error de CORS, no te preocupes: a veces pasa al abrir el HTML directamente desde el disco. **En GitHub Pages funcionará bien**.

---

## PARTE 3 — Subir a GitHub Pages

### Paso 3.1 — Crear el repositorio

1. Entra a [github.com](https://github.com), inicia sesión.
2. Crea una **organización** llamada `paultower-ui` (o el nombre que quieras).
3. Dentro, crea un repositorio público llamado **igual que la organización**: `paultower-ui.github.io`.

### Paso 3.2 — Subir los archivos

### Paso 3.3 — Subir los archivos

Hay varias formas. La más sencilla **sin Git**:

1. En tu repo recién creado, dale a **"uploading an existing file"** (o arrastra archivos).
2. Arrastra todo el contenido del proyecto (los archivos `index.html`, `gracias.html`, `logo-paul-tower.png`, la carpeta `fotos-relojes/`, etc.).
3. Abajo escribe un mensaje tipo `Primera versión` y dale a **Commit changes**.

Si sabes usar Git:

```bash
cd paultower-web
git init
git remote add origin https://github.com/paultower-ui/paultower-ui.github.io.git
git add .
git commit -m "Primera versión"
git branch -M main
git push -u origin main
```

### Paso 3.4 — Activar GitHub Pages

1. En tu repo, ve a **Settings → Pages**.
2. En "Source" elige **Deploy from a branch** → **main** → **/(root)**.
3. Dale a **Save**.
4. Espera 1-2 minutos.
5. Refresca la página: te aparecerá la URL `https://paultower-ui.github.io/` con un check verde.

### Paso 3.5 — Probar la web en producción

1. Entra a tu URL (`https://paultower-ui.github.io/` o las subrutas según la opción).
2. Haz un pedido de prueba **con tu email**.
3. Verifica que llega a la Sheet y al email.

✅ Si funciona, **tu web está oficialmente en producción**.

---

## 🎯 Cómo gestionar los pedidos día a día

### Ver pedidos nuevos
- Abre tu Google Sheet (incluso desde el móvil).
- Cada fila es un pedido.
- Activa **filtros** (menú Datos → Crear filtro) para ordenar por fecha, modelo o estado.

### Marcar el progreso de un pedido
- La columna **Estado** empieza en "Pendiente". Cámbiala manualmente según avance:
  - `Pendiente` → llegó el pedido
  - `Render enviado` → ya le mandaste el diseño al cliente
  - `Aprobado` → cliente OK con el diseño
  - `Fabricando` → en producción
  - `Enviado` → en camino
  - `Entregado` → cerrado

### Descargar todos los pedidos como Excel
- En la Sheet: **Archivo → Descargar → Microsoft Excel (.xlsx)**.

### Ver logos subidos
- La columna **Logo** contiene un enlace a Google Drive con el archivo subido.
- También puedes ir directamente a Drive → carpeta `Paul Tower - Logos clientes`.

---

## 🆘 Problemas frecuentes

| Problema | Solución |
|---|---|
| No me llegan emails | Revisa spam de Gmail. Tras la primera vez, márcalos como "no es spam" y siempre te llegarán bien. |
| Error 401/403 al enviar pedido | El despliegue no es "Cualquier persona". Vuelve al Paso 1.4 y revísalo. |
| El logo no aparece en Drive | Comprueba que el archivo del cliente no era mayor de 5 MB. El script lo rechaza si pesa más. |
| Quiero cambiar el email destinatario | Edita `Code.gs`, línea `const EMAIL_DESTINO = '...'`. Tras editarlo, **vuelve a desplegar** (Implementar → Gestionar implementaciones → editar → Nueva versión). |
| Cambié algo en `Code.gs` y no se aplica | Tras cualquier cambio en Apps Script, hay que **desplegar una nueva versión** (no vale solo guardar). |
| Quiero usar mi dominio `paultowerwatches.com` en lugar de github.io | En **Settings → Pages → Custom domain**, escribe `paultowerwatches.com` y sigue las instrucciones de GitHub para configurar los DNS en Hostinger. Es gratis. |

---

## 🔒 Privacidad / RGPD

- Los datos personales se guardan en tu Google Sheet privada (solo tú la ves).
- Los logos están en tu Google Drive privado (con enlace de solo lectura para quien tenga la URL exacta).
- Si quieres añadir un aviso de privacidad en la web (recomendable para cumplir RGPD), edita el footer de los index.html y los enlaces de "Privacidad" y "Cookies".

---

## 📞 Datos de contacto del negocio

- Email: `Paul.tower20@gmail.com`
- Teléfono: `(+34) 635 33 03 54`
- WhatsApp: `wa.me/34635330354`

Si quieres cambiar alguno, búscalo y reemplázalo globalmente en los archivos.
