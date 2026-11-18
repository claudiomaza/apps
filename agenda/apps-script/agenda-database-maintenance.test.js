'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const dir = __dirname;
const code = fs.readFileSync(path.join(dir, 'Code.gs'), 'utf8');
const spec = fs.readFileSync(path.resolve(dir, '../../SPEC-PERFORMANCE.md'), 'utf8');
const guide = fs.readFileSync(path.join(dir, 'aio/PUBLICAR-SOLO-APPS-SCRIPT.md'), 'utf8');
const aioDoc = fs.readFileSync(path.join(dir, 'aio/Code.gs.md'), 'utf8');
const aioManifest = fs.readFileSync(path.join(dir, 'aio/appsscript.json.md'), 'utf8');
const aioHtmlDoc = fs.readFileSync(path.join(dir, 'aio/Agenda.html.md'), 'utf8');
for (const label of ['Iniciar app', 'Crear / reparar estructura (conservar datos)', 'Actualizar tablas legibles', 'RESET total… (elimina hojas y filas)']) assert.ok(code.includes(label), label);
assert.match(code, /function onOpen\(\)[\s\S]*?\.createMenu\('Agenda'\)[\s\S]*?\.addToUi\(\)/);
assert.match(code, /function setupAgendaDatabase\(\)[\s\S]*?ensureAgendaDatabaseSchema_\(\)[\s\S]*?refreshAgendaReadableViews_\(\)/);
assert.match(code, /function refreshAgendaReadableViewsFromMenu\(\)[\s\S]*?refreshAgendaReadableViews_\(\)/);
assert.match(code, /function resetAgendaDatabase\(request\)[\s\S]*?assertAgendaMaintenanceOwner_\(\)[\s\S]*?resetAgendaDatabaseCore_\(request\)/);
assert.match(code, /function resetAgendaDatabaseCore_\(request\)[\s\S]*?request\.confirmation !== 'RESETEAR'[\s\S]*?request\.backupConfirmed !== true[\s\S]*?deleteSheet\(sheet\)/);
assert.match(code, /function assertAgendaMaintenanceOwner_\(\)[\s\S]*?Session\.getActiveUser\(\)\.getEmail\(\)/);
assert.match(code, /function preflightAgendaDatabase_\(allowMissing = true\)[\s\S]*?DATABASE_SCHEMA_MISMATCH[\s\S]*?DATABASE_SCHEMA_NAME_COLLISION/);
assert.match(code, /\['Eventos', CONFIG\.HEADERS\]/);
assert.match(code, /\['SyncOperations', \['idempotencyKey',[\s\S]*?'calendarId'\]\]/);
for (const view of ['Eventos legibles', 'Grupos legibles', 'Agendas legibles', 'Colaboradores legibles', 'Usuarios legibles', 'Operaciones legibles']) assert.ok(code.includes(view), view);
assert.match(code, /'Usuarios legibles': data\.users\.map\(r => \[r\[0\]\]\)/);
assert.match(code, /function doPost\(e\)[\s\S]*?doPostApi_\(e\)[\s\S]*?refreshAgendaReadableViews_\(\)/);
assert.match(code, /\['repairSchema','refreshReadableViews','resetDatabase'\]/);
assert.match(code, /AGENDA_DATABASE_EPOCH[\s\S]*databaseEpoch/);
assert.match(code, /function doGet\(\)[\s\S]*?apps-calendar/);
assert.match(code, /function doPostApi_\(e\)/);
assert.match(aioDoc, /function doGet\(\)/);
assert.match(aioDoc, /function runAgendaMaintenance[\s\S]*sessionToken[\s\S]*UrlFetchApp\.fetch/);
assert.match(aioDoc, /script\.external_request/);
assert.match(aioManifest, /script\.external_request/);
assert.doesNotMatch(aioManifest, /calendar|spreadsheets/);
assert.match(aioHtmlDoc, /Mantenimiento del Sheet/);
assert.match(aioHtmlDoc, /if\(!\['cmaza','cmaza@mendoza\.edu\.ar'\]\.includes/);
assert.match(aioHtmlDoc, /backupConfirmed:true/);
assert.match(aioHtmlDoc, /sessionEpoch\(sessionToken\)/);
assert.match(aioHtmlDoc, /Recargar app \(después de guardar la contraseña\)/);
assert.match(guide, /Apps Script vinculado al Sheet tiene el menú/);
assert.match(guide, /No borra ni modifica calendarios\/eventos\/permisos de Google Calendar/);
assert.match(spec, /Agenda — estructura operativa y vistas legibles en Sheets/);
assert.match(spec, /Apps Script \*\*vinculado\*\* al Sheet/);
assert.match(spec, /backup previo, confirmación literal/);
const context = {Date, JSON, Math, Number, String, Array, Object, Set, Map, RegExp, Error, console};
vm.createContext(context);
vm.runInNewContext(code + ';globalThis.projection=buildAgendaReadableRows_;globalThis.safeCell=readableAgendaCell_;globalThis.databaseAction=agendaDatabaseAction_;', context, {timeout: 1000});
const source = {
  events: [['e1','Cita','2026-01-01','','false','','','owner@example.com','ACTIVE','3','created','updated','','gcal-event','cal1','{}','15','','grp1']],
  groups: [['grp1','Familia','BLUE','g-updated','cal1']],
  calendars: [['cal1','Mi agenda','google-cal-id','owner@example.com','ACTIVE','created','cal-updated']],
  members: [['cal1','editor@example.com','editor','ACTIVE','m-updated']],
  users: [['cmaza','must-never-leak-password']],
  operations: [['idem1','hash','DONE','e1','update','3','op-updated','cal1']]
};
const rows = context.projection(source);
assert.equal(rows['Eventos legibles'][0].length, 21);
assert.equal(rows['Eventos legibles'][0][19], 'Familia');
assert.equal(rows['Eventos legibles'][0][20], 'Mi agenda');
assert.deepEqual(Array.from(rows['Usuarios legibles'][0]), ['cmaza']);
assert.equal(rows['Colaboradores legibles'][0][1], 'Mi agenda');
assert.equal(rows['Operaciones legibles'][0][0], 'idem1');
assert.deepEqual(Array.from(rows['Grupos legibles'][0]), ['grp1','Familia','BLUE','cal1','Mi agenda','g-updated']);
assert.equal(context.safeCell('=1+1'), "'=1+1");
assert.throws(() => context.databaseAction('repairSchema', {}, 'reader'), e => e.message === 'DATABASE_OWNER_REQUIRED');
assert.throws(() => context.databaseAction('resetDatabase', {confirmation:'RESETEAR',backupConfirmed:false}, 'cmaza'), e => e.message === 'RESET_BACKUP_REQUIRED');
assert.throws(() => context.databaseAction('resetDatabase', {confirmation:'no',backupConfirmed:true}, 'cmaza'), e => e.message === 'RESET_CONFIRMATION_REQUIRED');
console.log('Agenda schema contract, readable projections, password redaction, spreadsheet-safe cells and reset guards PASS');
