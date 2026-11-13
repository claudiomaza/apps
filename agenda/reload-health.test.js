'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const app=fs.readFileSync(__dirname+'/app.js','utf8');
const name=app.slice(app.indexOf('function setCalendarName('),app.indexOf('\nfunction activeCalendar('));
const select={options:[{value:'one',textContent:''}],disabled:false};
const ctx={state:{calendarId:'one',calendarName:'',calendars:[{calendarId:'one'}]},$:(q)=>q==='#calendar-select'?select:null};vm.createContext(ctx);vm.runInContext(name,ctx);assert.doesNotThrow(()=>ctx.setCalendarName('Prueba'));assert.equal(select.options[0].textContent,'Prueba');
const resume=app.slice(app.lastIndexOf('(async()=>{if(sessionToken)'));
assert.match(resume,/\$\('#connection'\)\.textContent='Conectado'/);assert.match(resume,/\$\('#connection'\)\.textContent='Sin conexión'/);
console.log('Reload connection status and absent calendar-name element PASS');
