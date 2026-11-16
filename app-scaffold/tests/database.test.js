import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => readFileSync(join(root, file), 'utf8');
const schemas = {
  'Registros': ['recordId', 'type', 'entityId', 'dataJson', 'version', 'status', 'updatedAt', 'createdAt'],
  'Config': ['key', 'value', 'description'],
  'Usuarios': ['usuario', 'pass', 'rol', 'alcances', 'mail', 'nombre', 'docenteId'],
  'Disponibilidad docente': ['availabilityId', 'teacherId', 'dayOfWeek', 'startTime', 'endTime', 'updatedAt', 'status']
};

class Range {
  constructor(sheet, row, column, rows, columns) { Object.assign(this, { sheet, row, column, rows, columns }); }
  getValues() {
    return Array.from({ length: this.rows }, (_, r) => Array.from({ length: this.columns }, (_, c) => this.sheet.cells[this.row - 1 + r]?.[this.column - 1 + c] ?? ''));
  }
  setValues(values) {
    values.forEach((line, r) => line.forEach((value, c) => {
      const y = this.row - 1 + r, x = this.column - 1 + c;
      this.sheet.cells[y] ??= [];
      this.sheet.cells[y][x] = value;
    }));
    return this;
  }
  setFontWeight() { return this; }
}
class Sheet {
  constructor(name, rows = []) { this.name = name; this.cells = rows.map((row) => [...row]); this.deleted = false; }
  clear() { this.cells = []; return this; }
  activate() { return this; }
  getName() { return this.name; }
  setName(name) { this.name = name; return this; }
  getLastRow() { for (let i = this.cells.length - 1; i >= 0; i--) if (this.cells[i]?.some((v) => v !== '' && v !== null)) return i + 1; return 0; }
  getLastColumn() { return Math.max(0, ...this.cells.map((row) => row.reduce((n, v, i) => v !== '' && v !== null ? i + 1 : n, 0))); }
  getRange(row, column, rows, columns) { return new Range(this, row, column, rows, columns); }
  getDataRange() { return this.getRange(1, 1, Math.max(1, this.getLastRow()), Math.max(1, this.getLastColumn())); }
  setFrozenRows() { return this; }
}
class Book {
  constructor(sheets = []) { this.sheets = sheets; }
  getSheets() { return this.sheets.filter((sheet) => !sheet.deleted); }
  setActiveSheet() {}
  moveActiveSheet() {}
  getSheetByName(name) { return this.getSheets().find((sheet) => sheet.name === name) || null; }
  insertSheet(name) {
    const sheet = new Sheet(name);
    this.sheets.push(sheet);
    return sheet;
  }
  deleteSheet(sheet) { sheet.deleted = true; }
}

function environment(initial = []) {
  const book = new Book(initial.map(([name, rows]) => new Sheet(name, rows)));
  const alerts = [];
  const dialogs = [];
  const cache = new Map([['DATA_VERSION', 'old']]);
  const userCache = new Map();
  const templates = [];
  const renderedTokens = [];
  let uuid = 0;
  let locked = false;
  const context = {
    Date, JSON, String, Error, Object, Array, Math, RegExp,
    SpreadsheetApp: {
      getActiveSpreadsheet: () => book,
      getUi: () => ({
        createMenu() { return this; }, addItem() { return this; }, addToUi() { return this; },
        alert(message) { alerts.push(message); },
        showModalDialog(content, title) { dialogs.push({ content, title }); }
      })
    },
    HtmlService: {
      createHtmlOutputFromFile: (filename) => ({ setWidth() { return this; }, setHeight() { return this; }, filename }),
      createTemplateFromFile: (filename) => { templates.push(filename); const template = { evaluate: () => ({ setWidth() { return this; }, setHeight() { return this; }, filename }) }; Object.defineProperty(template, 'resetToken', { set(value) { renderedTokens.push(value); } }); return template; }
    },
    Session: { getTemporaryActiveUserKey: () => 'synthetic-user-key' },
    LockService: { getDocumentLock: () => ({ tryLock: () => { if (locked) return false; locked = true; return true; }, releaseLock: () => { locked = false; } }) },
    CacheService: {
      getScriptCache: () => ({
        get: (key) => cache.get(key) ?? null,
        put: (key, value) => cache.set(key, value),
        remove: (key) => cache.delete(key)
      }),
      getUserCache: () => ({
        get: (key) => userCache.get(key) ?? null,
        put: (key, value) => userCache.set(key, value),
        remove: (key) => userCache.delete(key)
      })
    },
    Utilities: { getUuid: () => `123e4567-e89b-42d3-a456-${String(++uuid).padStart(12, '0')}` },
    ContentService: { createTextOutput: (value) => ({ getContent: () => value, setMimeType() { return this; } }), MimeType: { JSON: 'application/json' } },
    Logger: { log() { throw new Error('password must never be logged'); } }
  };
  vm.createContext(context);
  vm.runInContext(read('apps-script/Code.gs'), context);
  const call = (name, ...args) => vm.runInContext(`${name}(...JSON.parse(${JSON.stringify(JSON.stringify(args))}))`, context);
  const renderDialog = () => { const before = renderedTokens.length; call('showResetDialog'); return renderedTokens[before]; };
  const snapshot = () => book.getSheets().map((sheet) => [sheet.name, structuredClone(sheet.cells)]);
  return { book, context, call, renderDialog, alerts, dialogs, cache, userCache, templates, renderedTokens, snapshot };
}


describe('estructura y reset de base de datos (mock sintético)', () => {
  test('reparación crea el esquema exacto y completa config sin duplicar claves', () => {
    const env = environment();
    env.call('setupTemplate');
    expect(Object.fromEntries(env.book.getSheets().map((sheet) => [sheet.name, sheet.getDataRange().getValues()[0]]))).toEqual(schemas);
    const config = env.book.getSheetByName('Config').getDataRange().getValues();
    expect(config).toEqual([schemas.Config,
      ['maxPageSize', 300, 'Máximo de registros por página.'],
      ['maxBatchSize', 100, 'Máximo de cambios por sincronización.']]);
    env.call('setupTemplate');
    expect(env.book.getSheets()).toHaveLength(4);
    expect(env.book.getSheetByName('Config').getLastRow()).toBe(3);
  });

  test('reparación idempotente preserva filas existentes y valores de configuración', () => {
    const data = new Sheet('Registros', [schemas.Registros, ['r1', 'persona', 'e1', '{"a":1}', 1, 'active', 'hoy', 'ayer']]);
    const config = new Sheet('Config', [schemas.Config, ['maxPageSize', '25', 'custom']]);
    const env = environment([['Registros', data.cells], ['Config', config.cells]]);
    env.call('setupTemplate');
    expect(env.book.getSheetByName('Registros').getDataRange().getValues()[1]).toEqual(['r1', 'persona', 'e1', '{"a":1}', 1, 'active', 'hoy', 'ayer']);
    expect(env.book.getSheetByName('Config').getDataRange().getValues()[1]).toEqual(['maxPageSize', '25', 'custom']);
    expect(env.book.getSheetByName('Config').getLastRow()).toBe(3);
    env.call('setupTemplate');
    expect(env.book.getSheetByName('Registros').getLastRow()).toBe(2);
    expect(env.book.getSheetByName('Config').getLastRow()).toBe(3);
  });

  test('reparación agrega encabezados faltantes al final preservando las filas', () => {
    const env = environment([['Registros', [['recordId', 'type'], ['r1', 'persona']]]]);
    env.call('setupTemplate');
    expect(env.book.getSheetByName('Registros').getDataRange().getValues()[0]).toEqual(schemas.Registros);
    expect(env.book.getSheetByName('Registros').getDataRange().getValues()[1].slice(0, 2)).toEqual(['r1', 'persona']);
  });

  test('reparación incompatible se detiene sin cambiar hojas ni datos', () => {
    const env = environment([['Registros', [['recordId', 'campo-incompatible'], ['keep', 'dato']]]]);
    const before = env.snapshot();
    expect(() => env.call('setupTemplate')).toThrow();
    expect(env.snapshot()).toEqual(before);
  });

  test('reparación se detiene ante una pestaña inesperada con datos sin alterar nada', () => {
    const env = environment([['Unexpected', [['keep']]]]);
    const before = env.snapshot();
    expect(() => env.call('setupTemplate')).toThrow();
    expect(env.snapshot()).toEqual(before);
  });

  test('reparación puede renombrar una hoja vacía como Registros sin perder filas', () => {
    const env = environment([['Hoja 1', []]]);
    env.call('setupTemplate');
    expect(env.book.getSheets().map((sheet) => sheet.name)).toEqual(Object.keys(schemas));
  });

  test('reset con confirmación o correo inválido no toca ninguna hoja', () => {
    const env = environment([['Otra hoja', [['dato'], ['conservar']]]]);
    const before = env.snapshot();
    expect(() => env.call('resetDatabase', 'no-es-correo', 'RESETEAR')).toThrow();
    expect(env.snapshot()).toEqual(before);
    expect(() => env.call('resetDatabase', 'admin@example.org', 'resetear')).toThrow();
    expect(env.snapshot()).toEqual(before);
    expect(() => env.call('resetDatabase', 'admin@example.org', 'RESETEAR ')).toThrow();
    expect(() => env.call('resetDatabase', 'a..b@example.org', 'RESETEAR', 'no-token')).toThrow();
    expect(() => env.call('resetDatabase', 'admin@example.org', 'RESETEAR', 'no-token')).toThrow();
    expect(env.snapshot()).toEqual(before);
  });

  test('reset libera el lock ante fallos posteriores a la confirmación', () => {
    const env = environment([['Registros', [['old']]], ['Old', [['keep']]]]);
    const remove = env.book.deleteSheet;
    env.book.deleteSheet = () => { throw new Error('synthetic failure'); };
    expect(() => env.call('resetDatabase', 'admin@example.org', 'RESETEAR')).toThrow();
    env.book.deleteSheet = remove;
    const token = env.renderDialog();
    expect(() => env.call('resetDatabase', 'admin@example.org', 'RESETEAR', token)).not.toThrow();
  });

  test('reset exitoso deja cuatro pestañas exactas y admin temporal; lock se libera', () => {
    const env = environment([['Registros', [['viejo']]], ['Config', [['legacy']]], ['Usuarios', [['legacy']]], ['Vieja', [['dato'], ['borrar']]]]);
    const resetToken = env.renderDialog();
    const result = env.call('resetDatabase', 'admin@example.org', 'RESETEAR', resetToken);
    expect(env.book.getSheets().map((sheet) => sheet.name)).toEqual(Object.keys(schemas));
    expect(env.book.getSheetByName('Registros').getDataRange().getValues()).toEqual([schemas.Registros]);
    expect(env.book.getSheetByName('Disponibilidad docente').getDataRange().getValues()).toEqual([schemas['Disponibilidad docente']]);
    expect(env.cache.has('DATA_VERSION')).toBe(false);
    expect(env.book.getSheetByName('Config').getDataRange().getValues()).toEqual([schemas.Config,
      ['maxPageSize', 300, 'Máximo de registros por página.'],
      ['maxBatchSize', 100, 'Máximo de cambios por sincronización.']]);
    const users = env.book.getSheetByName('Usuarios').getDataRange().getValues();
    expect(users[0]).toEqual(schemas.Usuarios);
    expect(users[1][0]).toBe('admin@example.org');
    expect(users[1][1]).toBe(result.temporaryPassword);
    expect(users[1].slice(2)).toEqual(['admin', '[]', 'admin@example.org', 'Administrador', '']);
    expect(result.temporaryPassword).toBeTruthy();
    expect(result.temporaryPassword.length).toBeGreaterThanOrEqual(24);
    expect(env.alerts.at(-1)).not.toBe(result.temporaryPassword);
    expect(() => env.call('resetDatabase', 'admin@example.org', 'RESETEAR', env.renderDialog())).not.toThrow();
  });

  test('diálogo pide solo correo y confirmación; endpoint público no expone reset', () => {
    const env = environment();
    const renderedToken = env.renderDialog();
    const html = read('apps-script/ResetDialog.html');
    expect(html).toContain('type="email"');
    expect(html).toContain('name="confirmation"');
    expect(html).toContain('resetToken');
    expect(html).toContain('.resetDatabase(email, confirmation, resetToken)');
    expect([...html.matchAll(/<input[^>]*name="([^"]+)"/g)].map((match) => match[1])).toEqual(['email', 'confirmation']);
    expect(html).not.toMatch(/name="(?:usuario|username|pass|password|nombre)"/i);
    expect(env.dialogs).toHaveLength(1);
    expect(env.templates).toEqual(['ResetDialog']);
    expect(renderedToken).toContain('123e4567-');
    expect(env.userCache.size).toBe(1);
    expect(read('apps-script/Code.gs')).not.toContain("body.action === 'reset'");
    const before = env.snapshot();
    const doPost = vm.runInContext('doPost', env.context);
    const output = doPost({ postData: { contents: JSON.stringify({ action: 'reset', email: 'admin@example.org', confirmation: 'RESETEAR' }) } });
    expect(JSON.parse(output.getContent()).ok).toBe(false);
    expect(env.snapshot()).toEqual(before);
  });
});
