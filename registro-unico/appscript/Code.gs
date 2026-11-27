var APP_ = {
  name: 'Registro Único',
  initialAdminKey: 'REGISTRO_UNICO_INITIAL_ADMIN_EMAIL',
  usersKey: 'REGISTRO_UNICO_USERS_V1',
  spreadsheetKey: 'REGISTRO_UNICO_SPREADSHEET_ID',
  sheetName: 'Registros',
  headers: ['ID', 'Nombre', 'Apellido', 'DNI', 'Escolaridad', 'CreadoEn', 'ActualizadoEn', 'CreadoPor', 'ActualizadoPor'],
  roles: ['admin', 'user1', 'user2']
};

function doGet(e) {
  var page = e && e.parameter && e.parameter.page === 'admin' ? 'Admin' : 'Index';
  return HtmlService.createTemplateFromFile(page).evaluate()
    .setTitle(APP_.name)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function onOpen() {
  var ui = SpreadsheetApp.getUi();
  var menu = ui.createMenu(APP_.name).addItem('Abrir Registro Único', 'registroUnicoOpenApp');
  var spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  var email = currentEmail_();
  var isOwner = isSpreadsheetOwner_(spreadsheet, email);
  var canAdmin = false;
  if (isOwner) {
    try {
      var user = users_()[email];
      canAdmin = Boolean(user && user.active && user.role === 'admin');
    } catch (error) {}
  }
  if (canAdmin) menu.addItem('Administración', 'registroUnicoOpenAdmin');
  if (isOwner) menu.addSeparator().addItem('Vincular esta planilla', 'registroUnicoBindActiveSpreadsheet');
  menu.addToUi();
}

function registroUnicoOpenApp() {
  openAppLink_(ScriptApp.getService().getUrl(), 'Abrir Registro Único');
}

function registroUnicoOpenAdmin() {
  requireOwnerAdmin_();
  var url = ScriptApp.getService().getUrl();
  openAppLink_(url && url + '?page=admin', 'Abrir Administración');
}

function openAppLink_(url, title) {
  if (!url) {
    SpreadsheetApp.getUi().alert('Publicá primero el proyecto como aplicación web para habilitar Registro Único.');
    return;
  }
  var html = HtmlService.createHtmlOutput(
    '<div style="font:14px system-ui,sans-serif;padding:18px;color:#172027">' +
      '<p>Seleccioná el botón para abrir la aplicación en una pestaña nueva.</p>' +
      '<a href="' + htmlAttribute_(url) + '" target="_blank" style="display:block;padding:12px 14px;border-radius:8px;background:#087e69;color:white;text-decoration:none;text-align:center;font-weight:700">' + title + '</a>' +
    '</div>'
  ).setWidth(320).setHeight(140);
  SpreadsheetApp.getUi().showModalDialog(html, title);
}

function registroUnicoBindActiveSpreadsheet() {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (!active) throw new Error('Abrí Registro Único desde la planilla que querés vincular.');
    var props = PropertiesService.getScriptProperties();
    if (!props.getProperty(APP_.initialAdminKey)) {
      if (props.getProperty(APP_.usersKey)) throw new Error('Falta la configuración del administrador inicial. No se cambió nada.');
      var owner = active.getOwner();
      var ownerEmail = normalizeEmail_(owner && owner.getEmail());
      if (!ownerEmail || ownerEmail !== currentEmail_()) {
        throw new Error('La primera configuración debe hacerla el dueño de esta planilla con su cuenta Google.');
      }
      props.setProperty(APP_.initialAdminKey, ownerEmail);
    }
    requireOwnerAdmin_(active);
    var activeId = active.getId();
    var configuredId = props.getProperty(APP_.spreadsheetKey);
    if (configuredId) {
      if (configuredId !== activeId) throw new Error('Registro Único ya está vinculado a otra planilla. No se cambió la configuración.');
      var existing = configuredSpreadsheet_();
      ensureDataSheet_(existing);
      onOpen();
      SpreadsheetApp.getUi().alert('Esta planilla ya estaba vinculada.');
      return { ok: true, name: existing.getName(), message: 'Esta planilla ya estaba vinculada.' };
    }
    var result = configureSpreadsheet_(activeId);
    onOpen();
    SpreadsheetApp.getUi().alert('Planilla vinculada: ' + result.name + '. La pestaña Registros está lista.');
    return { ok: true, name: result.name };
  } finally {
    lock.releaseLock();
  }
}

function htmlAttribute_(value) {
  return String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/'/g, '&#39;');
}

function apiBootstrap() {
  try {
    var identity = currentEmail_();
    if (!identity) return { ok: false, message: 'Google no informó el correo de esta sesión. Salí y volvé a entrar con tu cuenta Google.' };
    var users = users_();
    var user = users[identity];
    if (!user || !user.active) return { ok: false, message: 'Tu correo no tiene acceso activo a Registro Único. Pedile al administrador que te habilite.' };
    var configuredId = PropertiesService.getScriptProperties().getProperty(APP_.spreadsheetKey);
    var spreadsheet = configuredId ? SpreadsheetApp.openById(configuredId) : SpreadsheetApp.getActiveSpreadsheet();
    var isOwner = isSpreadsheetOwner_(spreadsheet, identity);
    return {
      ok: true,
      email: identity,
      role: user.role,
      isAdmin: user.role === 'admin',
      canAdmin: user.role === 'admin' && isOwner,
      isOwner: isOwner,
      spreadsheetConfigured: Boolean(configuredId)
    };
  } catch (error) {
    return { ok: false, message: safeMessage_(error) };
  }
}

function apiListRecords() {
  requireUser_();
  var sheet = dataSheet_();
  var last = sheet.getLastRow();
  if (last < 2) return [];
  return sheet.getRange(2, 1, last - 1, APP_.headers.length).getValues().map(function (row) {
    return {
      id: String(row[0]), nombre: String(row[1]), apellido: String(row[2]), dni: String(row[3]),
      escolaridad: String(row[4]), creadoEn: dateIso_(row[5]), actualizadoEn: dateIso_(row[6])
    };
  });
}

function apiSaveRecord(input) {
  var actor = requireUser_();
  var record = validateRecord_(input);
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = dataSheet_();
    var values = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, APP_.headers.length).getValues() : [];
    var id = String(input.id || '').trim();
    var targetRow = -1;
    values.forEach(function (row, index) {
      if (String(row[0]) === id && id) targetRow = index + 2;
      if (String(row[3]).trim() === record.dni && String(row[0]) !== id) throw new Error('Ya existe un registro con ese DNI.');
    });
    var now = new Date();
    if (id && targetRow < 0) throw new Error('El registro ya no existe o fue eliminado. Actualizá la lista.');
    if (targetRow < 0) {
      id = Utilities.getUuid();
      var newRow = sheet.getLastRow() + 1;
      sheet.getRange(newRow, 2, 1, 4).setNumberFormat('@');
      sheet.getRange(newRow, 1, 1, APP_.headers.length).setValues([[id, cellText_(record.nombre), cellText_(record.apellido), cellText_(record.dni), cellText_(record.escolaridad), now, now, actor.email, actor.email]]);
    } else {
      var old = values[targetRow - 2];
      sheet.getRange(targetRow, 2, 1, 4).setNumberFormat('@');
      sheet.getRange(targetRow, 1, 1, APP_.headers.length).setValues([[
        id, cellText_(record.nombre), cellText_(record.apellido), cellText_(record.dni), cellText_(record.escolaridad), old[5], now, old[7], actor.email
      ]]);
    }
    return { ok: true, id: id };
  } finally {
    lock.releaseLock();
  }
}

function apiDeleteRecord(id) {
  requireUser_();
  id = String(id || '').trim();
  if (!id) throw new Error('Falta el identificador del registro.');
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = dataSheet_();
    var last = sheet.getLastRow();
    if (last < 2) throw new Error('El registro no existe.');
    var ids = sheet.getRange(2, 1, last - 1, 1).getDisplayValues();
    for (var i = 0; i < ids.length; i++) {
      if (ids[i][0] === id) {
        sheet.deleteRow(i + 2);
        return { ok: true };
      }
    }
    throw new Error('El registro no existe o ya fue eliminado.');
  } finally {
    lock.releaseLock();
  }
}

function apiAdminListUsers() {
  requireOwnerAdmin_();
  var users = users_();
  return Object.keys(users).sort().map(function (email) {
    return { email: email, role: users[email].role, active: Boolean(users[email].active), updatedAt: users[email].updatedAt || '' };
  });
}

function configureSpreadsheet_(id) {
  var props = PropertiesService.getScriptProperties();
  if (props.getProperty(APP_.spreadsheetKey)) throw new Error('La planilla ya está configurada. Para cambiarla, seguí el procedimiento manual de AGENT.md.');
  id = String(id || '').trim();
  if (!/^[A-Za-z0-9_-]{20,}$/.test(id)) throw new Error('Pegá el ID de una planilla de Google Sheets válido.');
  var ss = SpreadsheetApp.openById(id);
  ensureDataSheet_(ss);
  props.setProperty(APP_.spreadsheetKey, id);
  return { ok: true, name: ss.getName(), url: ss.getUrl() };
}

function ensureDataSheet_(ss) {
  var sheet = ss.getSheetByName(APP_.sheetName);
  if (!sheet) sheet = ss.insertSheet(APP_.sheetName);
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, APP_.headers.length).setValues([APP_.headers]);
    sheet.setFrozenRows(1);
    return sheet;
  }
  var actual = sheet.getRange(1, 1, 1, APP_.headers.length).getDisplayValues()[0];
  if (APP_.headers.some(function (header, i) { return actual[i] !== header; })) {
    throw new Error('La primera fila de la pestaña Registros no coincide con el esquema requerido. No se modificó la planilla.');
  }
  return sheet;
}

function apiAdminSaveUser(input) {
  var actor = requireOwnerAdmin_();
  var email = validateEmail_(input && input.email);
  var role = validateRole_(input && input.role);
  if (!input || typeof input.active !== 'boolean') throw new Error('Estado de usuario inválido.');
  var active = input.active;
  var initialAdmin = normalizeEmail_(PropertiesService.getScriptProperties().getProperty(APP_.initialAdminKey));
  if (email === initialAdmin && (!active || role !== 'admin')) throw new Error('No se puede quitar el rol admin de la cuenta inicial.');
  if (email === actor.email && (!active || role !== 'admin')) throw new Error('No podés quitarte el rol admin ni desactivarte desde tu propia sesión.');
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var users = users_();
    var old = users[email];
    var adminCount = Object.keys(users).filter(function (key) { return users[key].active && users[key].role === 'admin'; }).length;
    if (old && old.role === 'admin' && old.active && (!active || role !== 'admin') && adminCount <= 1) {
      throw new Error('No se puede quitar o cambiar el último administrador activo.');
    }
    var ss = configuredSpreadsheet_();
    if (active) {
      // Save the app ACL first, then grant the Google permission; roll back ACL if Google rejects sharing.
      var previous = old ? JSON.stringify(old) : null;
      users[email] = { role: role, active: true, updatedAt: new Date().toISOString() };
      var props = PropertiesService.getScriptProperties();
      props.setProperty(APP_.usersKey, JSON.stringify(users));
      try {
        ss.addEditor(email);
      } catch (error) {
        if (previous) users[email] = JSON.parse(previous); else delete users[email];
        props.setProperty(APP_.usersKey, JSON.stringify(users));
        throw error;
      }
      return { ok: true, permission: 'editor' };
    }
    if (!old) throw new Error('Ese correo no figura en la lista.');
    users[email] = { role: old.role, active: false, updatedAt: new Date().toISOString() };
    PropertiesService.getScriptProperties().setProperty(APP_.usersKey, JSON.stringify(users));
    try {
      ss.removeEditor(email);
      return { ok: true, permission: 'direct-revoked', warning: 'Se quitó el permiso individual y la app quedó desactivada. Revisá si la cuenta conserva acceso por grupo o dominio.' };
    } catch (error) {
      return { ok: true, permission: 'app-disabled-share-remains', warning: 'El acceso a la app quedó desactivado, pero Google no permitió quitar el permiso directo de la planilla. Revisá permisos heredados, grupos o configuración de uso compartido.' };
    }
  } finally {
    lock.releaseLock();
  }
}

function requireUser_() {
  var email = currentEmail_();
  if (!email) throw new Error('No se pudo verificar tu correo de Google.');
  var user = users_()[email];
  if (!user || !user.active) throw new Error('Acceso denegado: correo no habilitado en Registro Único.');
  return { email: email, role: user.role };
}

function requireAdmin_() {
  var user = requireUser_();
  if (user.role !== 'admin') throw new Error('Acceso denegado: solo un administrador puede realizar esta acción.');
  return user;
}

function requireOwnerAdmin_(spreadsheet) {
  var user = requireAdmin_();
  spreadsheet = spreadsheet || configuredSpreadsheet_();
  if (!isSpreadsheetOwner_(spreadsheet, user.email)) throw new Error('Solo el dueño de la planilla puede administrar Registro Único.');
  return user;
}

function isSpreadsheetOwner_(spreadsheet, email) {
  if (!spreadsheet || !email) return false;
  try {
    var owner = spreadsheet.getOwner();
    return Boolean(owner && normalizeEmail_(owner.getEmail()) === normalizeEmail_(email));
  } catch (error) {
    return false;
  }
}

function currentEmail_() {
  return normalizeEmail_(Session.getActiveUser().getEmail());
}

function users_() {
  var props = PropertiesService.getScriptProperties();
  var raw = props.getProperty(APP_.usersKey);
  if (!raw) {
    var initialAdminValue = normalizeEmail_(props.getProperty(APP_.initialAdminKey));
    if (!initialAdminValue) {
      throw new Error('Para iniciar, abrí la planilla y usá Vincular esta planilla con la cuenta dueña.');
    }
    var initialAdmin;
    try {
      initialAdmin = validateEmail_(initialAdminValue);
    } catch (error) {
      throw new Error('El valor de REGISTRO_UNICO_INITIAL_ADMIN_EMAIL no es un correo válido. Revisá las propiedades del script.');
    }
    var seeded = {};
    seeded[initialAdmin] = { role: 'admin', active: true, updatedAt: new Date().toISOString() };
    props.setProperty(APP_.usersKey, JSON.stringify(seeded));
    return seeded;
  }
  var users = JSON.parse(raw);
  if (!users || typeof users !== 'object' || Array.isArray(users)) throw new Error('La lista de acceso está dañada. No se habilitó ninguna operación.');
  return users;
}

function configuredSpreadsheet_() {
  var id = PropertiesService.getScriptProperties().getProperty(APP_.spreadsheetKey);
  if (!id) throw new Error('El administrador debe vincular la planilla desde el panel de administración.');
  return SpreadsheetApp.openById(id);
}

function dataSheet_() {
  var sheet = configuredSpreadsheet_().getSheetByName(APP_.sheetName);
  if (!sheet) throw new Error('Falta la pestaña Registros. Volvé a vincular la planilla desde el panel.');
  return sheet;
}

function cellText_(value) {
  return /^[=+\-@]/.test(value) ? "'" + value : value;
}

function dateIso_(value) {
  return value instanceof Date ? value.toISOString() : String(value || '');
}

function safeMessage_(error) {
  return error && error.message ? String(error.message) : 'Ocurrió un error inesperado.';
}

/** Pure validation helpers shared by the app and offline contract tests. */
function normalizeEmail_(value) {
  return String(value || '').trim().toLowerCase();
}

function validateEmail_(value) {
  var email = normalizeEmail_(value);
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error('Ingresá un correo válido.');
  }
  return email;
}

function validateRole_(value) {
  var role = String(value || '').trim();
  if (['admin', 'user1', 'user2'].indexOf(role) < 0) {
    throw new Error('El rol no es válido.');
  }
  return role;
}

function validateRecord_(input) {
  if (!input || typeof input !== 'object') throw new Error('Datos de registro inválidos.');
  var record = {
    nombre: String(input.nombre || '').trim(),
    apellido: String(input.apellido || '').trim(),
    dni: String(input.dni || '').trim(),
    escolaridad: String(input.escolaridad || '').trim()
  };
  var labels = { nombre: 'Nombre', apellido: 'Apellido', dni: 'DNI', escolaridad: 'Escolaridad' };
  Object.keys(record).forEach(function (key) {
    if (!record[key]) throw new Error('Completá el campo ' + labels[key] + '.');
    if (record[key].length > (key === 'escolaridad' ? 160 : 80)) {
      throw new Error('El campo ' + labels[key] + ' supera el largo permitido.');
    }
  });
  return record;
}
