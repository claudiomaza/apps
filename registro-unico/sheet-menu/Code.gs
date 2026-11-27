var REGISTRO_UNICO_ADMIN_URL = 'https://script.google.com/macros/s/AKfycbxZPFNTRGQWvhE69szf600kxXWQYKtfp1K3C9-jT7PhW70yp9_oEXUNlsGVcd6f7RR3jQ/exec?page=admin';

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Registro Único')
    .addItem('Abrir administración', 'registroUnicoOpenAdmin')
    .addToUi();
}

function registroUnicoOpenAdmin() {
  var html = HtmlService.createHtmlOutput(
    '<div style="font:14px system-ui,sans-serif;padding:16px;color:#172027">' +
      '<p>Administrá los usuarios y permisos de Registro Único.</p>' +
      '<a href="' + REGISTRO_UNICO_ADMIN_URL + '" target="_blank" rel="noopener" ' +
        'style="display:inline-block;padding:11px 14px;border-radius:8px;background:#087e69;color:white;text-decoration:none;font-weight:700">' +
        'Abrir administración</a></div>'
  ).setTitle('Registro Único').setWidth(320);
  SpreadsheetApp.getUi().showSidebar(html);
}
