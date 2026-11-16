const TEMPLATE_ = Object.freeze({
  service: 'app-scaffold-template',
  sessionSeconds: 21600,
  schemas: {
    'Registros': ['recordId', 'type', 'entityId', 'dataJson', 'version', 'status', 'updatedAt', 'createdAt'],
    'Config': ['key', 'value', 'description'],
    'Usuarios': ['usuario', 'pass', 'rol', 'alcances', 'mail', 'nombre', 'docenteId'],
    'Disponibilidad docente': ['availabilityId', 'teacherId', 'dayOfWeek', 'startTime', 'endTime', 'updatedAt', 'status']
  },
  configRows: [
    ['maxPageSize', 300, 'Máximo de registros por página.'],
    ['maxBatchSize', 100, 'Máximo de cambios por sincronización.']
  ]
});

function onOpen() {
  SpreadsheetApp.getUi().createMenu('App · Plantilla')
    .addItem('Crear / reparar estructura (conservar datos)', 'setupTemplate')
    .addItem('RESET total… (elimina hojas y filas)', 'showResetDialog')
    .addToUi();
}

function doGet() {
  return json_({ ok: true, service: TEMPLATE_.service });
}

function doPost(e) {
  try {
    const body = JSON.parse(e && e.postData && e.postData.contents || '{}');
    if (body.action === 'auth') return json_(login_(body.username, body.password));
    const session = requireSession_(body.sessionToken);
    if (body.action === 'whoami') return json_({ ok: true, user: session });
    if (body.action === 'logout') {
      CacheService.getScriptCache().remove('app-session:' + String(body.sessionToken));
      return json_({ ok: true });
    }
    throw new Error('INVALID_ACTION');
  } catch (error) {
    return json_({ ok: false, error: publicError_(error) });
  }
}

function setupTemplate() {
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const plans = [];
  let reusableBlank;
  try {
    const blankExtras = book.getSheets().filter((sheet) => !Object.prototype.hasOwnProperty.call(TEMPLATE_.schemas, sheet.getName()));
    blankExtras.forEach((sheet) => {
      if (sheet.getLastRow() || sheet.getLastColumn()) throw new Error('UNEXPECTED_SHEET:' + sheet.getName());
    });
    reusableBlank = blankExtras[0] || null;
    const firstMissing = Object.keys(TEMPLATE_.schemas).find((name) => !book.getSheetByName(name));
    Object.keys(TEMPLATE_.schemas).forEach((name) => {
      const existing = book.getSheetByName(name);
      const sheet = existing || (name === firstMissing ? reusableBlank : null);
      plans.push({ name: name, sheet: sheet, rename: !existing && sheet === reusableBlank, missing: sheet ? validateRepairableSheet_(sheet, TEMPLATE_.schemas[name]) : TEMPLATE_.schemas[name].slice() });
    });
    if (blankExtras.length > (plans.some((plan) => plan.rename) ? 1 : 0)) throw new Error('UNEXPECTED_EMPTY_SHEET');
    const configPlan = plans.find((plan) => plan.name === 'Config');
    if (configPlan.sheet && configPlan.sheet.getLastRow() > 1) {
      const rows = configPlan.sheet.getRange(2, 1, configPlan.sheet.getLastRow() - 1, 3).getValues();
      const keys = rows.map((row) => String(row[0] || '').trim()).filter(Boolean);
      if (keys.some((key, index) => keys.indexOf(key) !== index)) throw new Error('CONFIG_DUPLICATE_KEY');
    }
  } catch (error) {
    SpreadsheetApp.getUi().alert('No se modificó nada: hay pestañas o encabezados incompatibles. Revisá la hoja indicada y resolvé la migración manualmente antes de reparar.');
    throw new Error('SCHEMA_INCOMPATIBLE');
  }

  plans.forEach((plan) => {
    const sheet = plan.sheet || (plan.name === 'Registros' && reusableBlank ? reusableBlank : book.insertSheet(plan.name));
    if (plan.rename) sheet.setName(plan.name);
    if (!plan.sheet) sheet.getRange(1, 1, 1, TEMPLATE_.schemas[plan.name].length).setValues([TEMPLATE_.schemas[plan.name]]);
    else if (plan.missing.length) sheet.getRange(1, sheet.getLastColumn() + 1, 1, plan.missing.length).setValues([plan.missing]);
    sheet.setFrozenRows(1);
    if (plan.name === 'Config') ensureConfigRows_(sheet);
  });
  SpreadsheetApp.getUi().alert('Estructura lista. Se conservaron las filas existentes.');
}

function validateRepairableSheet_(sheet, headers) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (!lastRow && !lastColumn) return headers.slice();
  if (!lastRow || !lastColumn) throw new Error('SCHEMA_INCOMPATIBLE:' + sheet.getName());
  const current = sheet.getRange(1, 1, 1, lastColumn).getValues()[0].map(String);
  const prefix = headers.slice(0, current.length);
  if (current.length > headers.length || current.some((value, index) => value !== prefix[index])) {
    throw new Error('SCHEMA_INCOMPATIBLE:' + sheet.getName());
  }
  for (let row = 2; row <= lastRow; row++) {
    const values = sheet.getRange(row, current.length + 1, 1, Math.max(1, lastColumn - current.length)).getValues()[0];
    if (values.some((value) => value !== '' && value !== null)) throw new Error('SCHEMA_INCOMPATIBLE:' + sheet.getName());
  }
  return headers.slice(current.length);
}

function ensureConfigRows_(sheet) {
  const rows = sheet.getLastRow() > 1 ? sheet.getRange(2, 1, sheet.getLastRow() - 1, 3).getValues() : [];
  const keys = rows.map((row) => String(row[0] || '').trim()).filter(Boolean);
  const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
  if (duplicates.length) throw new Error('CONFIG_DUPLICATE_KEY');
  const existing = new Set(keys);
  const missing = TEMPLATE_.configRows.filter((row) => !existing.has(row[0]));
  if (missing.length) sheet.getRange(sheet.getLastRow() + 1, 1, missing.length, 3).setValues(missing);
}

function showResetDialog() {
  const token = Utilities.getUuid() + '.' + Utilities.getUuid();
  const key = 'reset-dialog:' + String(Session.getTemporaryActiveUserKey() || '');
  CacheService.getUserCache().put(key, token, 600);
  const template = HtmlService.createTemplateFromFile('ResetDialog');
  template.resetToken = token;
  SpreadsheetApp.getUi().showModalDialog(template.evaluate().setWidth(460).setHeight(430), 'RESET total de la base');
}

function resetDatabase(email, confirmation, token) {
  const address = String(email || '').trim();
  const emailPattern = /^[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i;
  const localPart = address.split('@')[0];
  const domain = address.split('@')[1] || '';
  if (address.length > 254 || localPart.length > 64 || localPart.startsWith('.') || localPart.endsWith('.') || localPart.includes('..') || domain.length > 253 || !emailPattern.test(address)) throw new Error('INVALID_EMAIL');
  if (confirmation !== 'RESETEAR') throw new Error('INVALID_CONFIRMATION');
  const tokenValue = String(token || '');
  const tokenKey = 'reset-dialog:' + String(Session.getTemporaryActiveUserKey() || '');
  const userCache = CacheService.getUserCache();
  if (!tokenValue || userCache.get(tokenKey) !== tokenValue) throw new Error('RESET_NOT_AUTHORIZED');
  userCache.remove(tokenKey);

  const lock = LockService.getDocumentLock();
  if (!lock.tryLock(30000)) throw new Error('RESET_BUSY');
  try {
    const book = SpreadsheetApp.getActiveSpreadsheet();
    const sheets = book.getSheets();
    if (!sheets.length) throw new Error('NO_SHEET_TO_RESET');
    const temporaryPassword = [Utilities.getUuid(), Utilities.getUuid()].join('').replace(/-/g, '');
    CacheService.getScriptCache().remove('DATA_VERSION');
    const keep = sheets[0];
    for (let i = sheets.length - 1; i >= 1; i--) book.deleteSheet(sheets[i]);
    keep.clear();
    keep.setName('Registros');
    keep.activate();
    book.setActiveSheet(keep);
    book.moveActiveSheet(1);

    const registros = keep;
    Object.keys(TEMPLATE_.schemas).forEach((name) => {
      const sheet = name === 'Registros' ? registros : book.insertSheet(name);
      sheet.getRange(1, 1, 1, TEMPLATE_.schemas[name].length).setValues([TEMPLATE_.schemas[name]]);
      sheet.setFrozenRows(1);
    });
    book.getSheetByName('Config').getRange(2, 1, TEMPLATE_.configRows.length, 3).setValues(TEMPLATE_.configRows);

    book.getSheetByName('Usuarios').getRange(2, 1, 1, 7).setValues([[
      address, temporaryPassword, 'admin', '[]', address, 'Administrador', ''
    ]]);
    return { ok: true, temporaryPassword: temporaryPassword };
  } finally {
    lock.releaseLock();
  }
}

function login_(username, password) {
  const user = String(username || '').trim();
  const pass = String(password || '');
  if (!user || user.length > 254 || !pass || pass.length > 200) throw new Error('INVALID_CREDENTIALS');
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Usuarios');
  if (!sheet || sheet.getLastRow() < 2) throw new Error('USERS_NOT_CONFIGURED');
  const rows = sheet.getDataRange().getValues();
  const indexes = headerIndexes_(rows[0]);
  ['usuario', 'pass', 'rol'].forEach((key) => {
    if (indexes[key] === undefined) throw new Error('USERS_SCHEMA_INVALID');
  });
  const account = rows.slice(1).map((row) => ({
    username: String(row[indexes.usuario] || '').trim(),
    password: String(row[indexes.pass] || ''),
    role: String(row[indexes.rol] || '').trim()
  })).find((item) => item.username.toLowerCase() === user.toLowerCase() && item.password === pass);
  if (!account) throw new Error('INVALID_CREDENTIALS');
  const token = Utilities.getUuid() + '.' + Utilities.getUuid();
  const session = { username: account.username, role: account.role, expiresAt: Date.now() + TEMPLATE_.sessionSeconds * 1000 };
  CacheService.getScriptCache().put('app-session:' + token, JSON.stringify(session), TEMPLATE_.sessionSeconds);
  return { ok: true, sessionToken: token, username: account.username, role: account.role, expiresAt: new Date(session.expiresAt).toISOString() };
}

function headerIndexes_(headers) {
  return headers.reduce((out, value, index) => { out[String(value).trim()] = index; return out; }, {});
}

function requireSession_(token) {
  const value = String(token || '');
  if (!value || value.length > 100) throw new Error('SESSION_EXPIRED');
  const raw = CacheService.getScriptCache().get('app-session:' + value);
  if (!raw) throw new Error('SESSION_EXPIRED');
  const session = JSON.parse(raw);
  if (session.expiresAt <= Date.now()) throw new Error('SESSION_EXPIRED');
  return { username: session.username, role: session.role };
}

function publicError_(error) {
  const code = String(error && error.message || 'INTERNAL_ERROR');
  return ['INVALID_CREDENTIALS', 'USERS_NOT_CONFIGURED', 'USERS_SCHEMA_INVALID', 'SESSION_EXPIRED', 'INVALID_ACTION'].includes(code) ? code : 'INTERNAL_ERROR';
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}
