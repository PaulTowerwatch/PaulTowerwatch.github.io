/**
 * ═══════════════════════════════════════════════════════════════
 *  PAUL TOWER — Receptor de pedidos
 *  Guarda cada pedido en la Google Sheet + envía emails automáticos
 *  + guarda los logos subidos en Google Drive
 * ═══════════════════════════════════════════════════════════════
 */

// ⚙ CONFIGURACIÓN ─ EDITA AQUÍ TUS DATOS
const EMAIL_DESTINO   = 'Paul.tower20@gmail.com';
const NOMBRE_TIENDA   = 'Paul Tower Fine Timepieces';
const TELEFONO        = '(+34) 635 33 03 54';
const PAGINA_GRACIAS  = 'gracias.html';
// Carpeta de Google Drive donde se guardarán los logos.
// Déjala así y el script creará una carpeta nueva al primer logo.
const CARPETA_LOGOS_NOMBRE = 'Paul Tower - Logos clientes';

/**
 * Esta función se ejecuta automáticamente cuando el formulario
 * de tu web hace un POST a esta URL.
 */
function doPost(e) {
  try {
    // Los datos llegan como JSON
    const data = JSON.parse(e.postData.contents);

    // ─── 1. HONEYPOT (anti-spam) ───
    // Si el campo invisible "website" viene relleno, es un bot
    if (data.website && data.website.trim() !== '') {
      return ContentService
        .createTextOutput(JSON.stringify({ok: true, ignored: true}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ─── 2. VALIDACIÓN ───
    if (!data.cliente_nombre || !data.cliente_email || !data.modelo_reloj) {
      return ContentService
        .createTextOutput(JSON.stringify({ok: false, error: 'Faltan campos obligatorios'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.cliente_email)) {
      return ContentService
        .createTextOutput(JSON.stringify({ok: false, error: 'Email no válido'}))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // ─── 3. GENERAR ID DE PEDIDO ───
    const ahora = new Date();
    const idPedido = 'PT-' +
      Utilities.formatDate(ahora, 'Europe/Madrid', 'yyyyMMdd-HHmmss') + '-' +
      Math.random().toString(36).substring(2, 6).toUpperCase();

    // ─── 4. SUBIR LOGO SI VIENE ───
    let logoInfo = 'Sin logo';
    let logoUrl = '';

    if (data.logo_base64 && data.logo_nombre) {
      try {
        const carpeta = obtenerCarpetaLogos();
        const ext = data.logo_nombre.split('.').pop();
        const nombreLimpio = data.cliente_nombre.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const nombreArchivo = Utilities.formatDate(ahora, 'Europe/Madrid', 'yyyyMMdd_HHmmss') + '_' + nombreLimpio + '.' + ext;

        // Convertir base64 a blob
        const datosBase64 = data.logo_base64.split(',')[1] || data.logo_base64;
        const blob = Utilities.newBlob(Utilities.base64Decode(datosBase64), data.logo_tipo || 'image/png', nombreArchivo);

        const archivo = carpeta.createFile(blob);
        archivo.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        logoUrl = archivo.getUrl();
        logoInfo = nombreArchivo;
      } catch(err) {
        logoInfo = 'Error al subir logo';
      }
    }

    // ─── 5. LIMPIAR DATOS ───
    const limpiar = (v, max) => {
      if (!v) return '';
      v = String(v).trim().replace(/[\r\n\t]/g, ' ');
      v = v.replace(/<[^>]*>/g, ''); // sin HTML
      return v.substring(0, max || 500);
    };

    const pedido = {
      id:        idPedido,
      fecha:     Utilities.formatDate(ahora, 'Europe/Madrid', 'dd/MM/yyyy HH:mm'),
      tipo:      limpiar(data.tipo_pedido, 80),
      nombre:    limpiar(data.cliente_nombre, 100),
      email:     limpiar(data.cliente_email, 100),
      whatsapp:  limpiar(data.cliente_whatsapp, 30) || '—',
      modelo:    limpiar(data.modelo_reloj, 100),
      ref:       limpiar(data.referencia, 30),
      nesfera:   limpiar(data.nombre_esfera, 50) || '—',
      color:     limpiar(data.color_esfera, 50) || '—',
      caja:      limpiar(data.tipo_caja, 50) || '—',
      correa:    limpiar(data.correa, 50) || '—',
      acabado:   limpiar(data.acabado_caja, 50) || '—',
      notas:     limpiar(data.notas, 1000) || '—',
      logoInfo:  logoInfo,
      logoUrl:   logoUrl
    };

    // ─── 6. GUARDAR EN LA SHEET ───
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    sheet.appendRow([
      pedido.id,
      pedido.fecha,
      pedido.tipo,
      pedido.nombre,
      pedido.email,
      pedido.whatsapp,
      pedido.modelo,
      pedido.ref,
      pedido.nesfera,
      pedido.color,
      pedido.caja,
      pedido.correa,
      pedido.acabado,
      pedido.notas,
      'Pendiente',                                                   // Estado
      logoUrl ? logoUrl : pedido.logoInfo                            // Logo (URL o texto)
    ]);

    // ─── 7. EMAIL AL PROPIETARIO ───
    enviarEmailPropietario(pedido);

    // ─── 8. EMAIL DE CONFIRMACIÓN AL CLIENTE ───
    enviarEmailCliente(pedido);

    // ─── 9. RESPUESTA OK ───
    return ContentService
      .createTextOutput(JSON.stringify({ok: true, id: pedido.id, redirect: PAGINA_GRACIAS + '?id=' + encodeURIComponent(pedido.id)}))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ok: false, error: err.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Devuelve la carpeta de logos de Drive, creándola si no existe
 */
function obtenerCarpetaLogos() {
  const carpetas = DriveApp.getFoldersByName(CARPETA_LOGOS_NOMBRE);
  if (carpetas.hasNext()) {
    return carpetas.next();
  }
  return DriveApp.createFolder(CARPETA_LOGOS_NOMBRE);
}

/**
 * Email HTML que llega al propietario con todos los datos del pedido
 */
function enviarEmailPropietario(p) {
  const asunto = '🔔 Nuevo pedido ' + p.id + ' — ' + p.modelo + ' — ' + p.nombre;
  const logoLinkHtml = p.logoUrl
    ? '<a href="' + p.logoUrl + '" style="color:#E2C97E;text-decoration:none;">📎 Ver logo subido</a>'
    : p.logoInfo;

  const cuerpo = `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#0C0C14;color:#F7F2E8;padding:20px;margin:0;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;margin:0 auto;background:#10101A;border:1px solid #C9A84C;">
  <tr>
    <td style="padding:30px;text-align:center;background:#04040A;border-bottom:2px solid #C9A84C;">
      <h1 style="color:#C9A84C;font-family:Georgia,serif;margin:0;font-size:24px;letter-spacing:2px;">PAUL TOWER</h1>
      <p style="color:#C8C0B0;font-size:11px;letter-spacing:4px;margin:6px 0 0 0;">NUEVO PEDIDO RECIBIDO</p>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 30px;background:#14141F;">
      <p style="color:#C9A84C;font-size:11px;letter-spacing:2px;margin:0 0 4px 0;">ID DE PEDIDO</p>
      <p style="color:#F7F2E8;font-size:18px;font-family:Courier,monospace;margin:0;">${p.id}</p>
      <p style="color:#6E6860;font-size:12px;margin:8px 0 0 0;">${p.fecha} · Tipo: <strong style="color:#E2C97E;">${p.tipo}</strong></p>
    </td>
  </tr>
  <tr>
    <td style="padding:24px 30px;">
      <h2 style="color:#C9A84C;font-size:13px;letter-spacing:3px;border-bottom:1px solid #2a2a3a;padding-bottom:8px;margin:0 0 16px 0;">◆ CLIENTE</h2>
      <table width="100%" style="color:#F7F2E8;font-size:14px;">
        <tr><td style="padding:6px 0;color:#6E6860;width:140px;">Nombre</td><td style="padding:6px 0;"><strong>${p.nombre}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#6E6860;">Email</td><td style="padding:6px 0;"><a href="mailto:${p.email}" style="color:#E2C97E;text-decoration:none;">${p.email}</a></td></tr>
        <tr><td style="padding:6px 0;color:#6E6860;">WhatsApp</td><td style="padding:6px 0;">${p.whatsapp}</td></tr>
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:0 30px 24px 30px;">
      <h2 style="color:#C9A84C;font-size:13px;letter-spacing:3px;border-bottom:1px solid #2a2a3a;padding-bottom:8px;margin:0 0 16px 0;">◆ CONFIGURACIÓN</h2>
      <table width="100%" style="color:#F7F2E8;font-size:14px;">
        <tr><td style="padding:6px 0;color:#6E6860;width:140px;">Modelo</td><td style="padding:6px 0;"><strong style="color:#E2C97E;">${p.modelo}</strong></td></tr>
        <tr><td style="padding:6px 0;color:#6E6860;">Referencia</td><td style="padding:6px 0;">${p.ref}</td></tr>
        <tr><td style="padding:6px 0;color:#6E6860;">Nombre en esfera</td><td style="padding:6px 0;">${p.nesfera}</td></tr>
        <tr><td style="padding:6px 0;color:#6E6860;">Logo</td><td style="padding:6px 0;">${logoLinkHtml}</td></tr>
        <tr><td style="padding:6px 0;color:#6E6860;">Color esfera</td><td style="padding:6px 0;">${p.color}</td></tr>
        <tr><td style="padding:6px 0;color:#6E6860;">Caja</td><td style="padding:6px 0;">${p.caja}</td></tr>
        <tr><td style="padding:6px 0;color:#6E6860;">Correa</td><td style="padding:6px 0;">${p.correa}</td></tr>
        <tr><td style="padding:6px 0;color:#6E6860;">Acabado</td><td style="padding:6px 0;">${p.acabado}</td></tr>
        ${p.notas !== '—' ? `<tr><td style="padding:6px 0;color:#6E6860;vertical-align:top;">Notas</td><td style="padding:6px 0;">${p.notas.replace(/\n/g,'<br>')}</td></tr>` : ''}
      </table>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 30px;background:#04040A;text-align:center;border-top:1px solid #2a2a3a;">
      <p style="color:#6E6860;font-size:11px;margin:0;">Responde a este email para contactar directamente con <strong style="color:#C9A84C;">${p.nombre}</strong></p>
      <p style="color:#6E6860;font-size:10px;margin:8px 0 0 0;">El pedido también está en tu Google Sheet</p>
    </td>
  </tr>
</table>
</body></html>`;

  MailApp.sendEmail({
    to: EMAIL_DESTINO,
    replyTo: p.email,
    subject: asunto,
    htmlBody: cuerpo,
    name: NOMBRE_TIENDA
  });
}

/**
 * Email de confirmación al cliente
 */
function enviarEmailCliente(p) {
  const asunto = 'Hemos recibido tu pedido — Paul Tower';

  const cuerpo = `
<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="font-family:Arial,sans-serif;background:#04040A;color:#F7F2E8;padding:20px;margin:0;">
<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#10101A;border:1px solid #C9A84C;">
  <tr>
    <td style="padding:36px 30px;text-align:center;background:#04040A;border-bottom:2px solid #C9A84C;">
      <h1 style="color:#C9A84C;font-family:Georgia,serif;margin:0;font-size:28px;letter-spacing:3px;">PAUL TOWER</h1>
      <p style="color:#C8C0B0;font-size:10px;letter-spacing:5px;margin:8px 0 0 0;">FINE TIMEPIECES</p>
    </td>
  </tr>
  <tr>
    <td style="padding:36px 30px;text-align:center;">
      <p style="color:#C9A84C;font-size:11px;letter-spacing:4px;margin:0 0 12px 0;">HEMOS RECIBIDO TU PEDIDO</p>
      <h2 style="color:#F7F2E8;font-family:Georgia,serif;font-size:22px;margin:0 0 20px 0;font-weight:normal;">Gracias, ${p.nombre}</h2>
      <p style="color:#C8C0B0;font-size:14px;line-height:1.7;margin:0;">
        En <strong style="color:#E2C97E;">menos de 48 horas</strong> recibirás:
      </p>
      <p style="color:#C8C0B0;font-size:14px;line-height:1.9;margin:14px 0;">
        ① Render del diseño final<br>
        ② Presupuesto exacto<br>
        ③ Plazo de fabricación y entrega
      </p>
    </td>
  </tr>
  <tr>
    <td style="padding:0 30px 24px 30px;">
      <div style="background:#14141F;padding:20px;border-left:3px solid #C9A84C;">
        <p style="color:#C9A84C;font-size:10px;letter-spacing:3px;margin:0 0 6px 0;">ID DE PEDIDO</p>
        <p style="color:#F7F2E8;font-size:16px;font-family:Courier,monospace;margin:0;">${p.id}</p>
        <p style="color:#6E6860;font-size:12px;margin:8px 0 0 0;">${p.modelo}</p>
      </div>
    </td>
  </tr>
  <tr>
    <td style="padding:20px 30px 36px;text-align:center;background:#04040A;border-top:1px solid #2a2a3a;">
      <p style="color:#6E6860;font-size:12px;margin:0 0 10px 0;">¿Alguna duda? Contáctanos:</p>
      <p style="color:#C8C0B0;font-size:13px;margin:0;">
        📞 <a href="tel:+34635330354" style="color:#E2C97E;text-decoration:none;">${TELEFONO}</a><br>
        ✉ <a href="mailto:${EMAIL_DESTINO}" style="color:#E2C97E;text-decoration:none;">${EMAIL_DESTINO}</a>
      </p>
    </td>
  </tr>
</table>
</body></html>`;

  MailApp.sendEmail({
    to: p.email,
    replyTo: EMAIL_DESTINO,
    subject: asunto,
    htmlBody: cuerpo,
    name: NOMBRE_TIENDA
  });
}

/**
 * Función de test — ejecútala desde el editor para probar
 * que todo funciona ANTES de conectar la web.
 */
function probarTodo() {
  const datosPrueba = {
    postData: {
      contents: JSON.stringify({
        tipo_pedido: 'TEST',
        cliente_nombre: 'Cliente de Prueba',
        cliente_email: EMAIL_DESTINO,  // se envía a ti mismo
        cliente_whatsapp: '600000000',
        modelo_reloj: 'Seiko mod Datejust',
        referencia: 'PT-REF-001',
        nombre_esfera: 'PRUEBA',
        color_esfera: 'Verde',
        tipo_caja: 'Acero',
        correa: 'Jubilee',
        acabado_caja: 'Mixto',
        notas: 'Este es un pedido de prueba'
      })
    }
  };
  const resultado = doPost(datosPrueba);
  Logger.log(resultado.getContent());
}
