'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync(__dirname+'/index.html','utf8'),app=fs.readFileSync(__dirname+'/app.js','utf8'),css=fs.readFileSync(__dirname+'/styles.css','utf8');
assert.match(app,/button\.addEventListener\('click',\(\)=>selectAdminTab\(button\.dataset\.adminTab\)\)/);assert.match(app,/section\.hidden=section\.id!==`admin-section-\$\{name\}`/);assert.match(app,/ArrowLeft.*ArrowRight.*Home.*End/);assert.match(app,/if\(tabs\[next\]\)selectAdminTab\(tabs\[next\]\.dataset\.adminTab\)\?\.focus\(\)/);for(const name of ['summary','calendars','collaborators','groups','statistics']){assert.match(html,new RegExp(`id="admin-tab-${name}"[^>]*role="tab"`));assert.match(html,new RegExp(`id="admin-section-${name}"[^>]*role="tabpanel"`));assert.match(html,new RegExp(`aria-controls="admin-section-${name}"`));assert.match(html,new RegExp(`aria-labelledby="admin-tab-${name}"`));}
assert.ok(css.includes('.admin-section[hidden]{display:none!important}'),'hidden admin panes must stay hidden despite grid layout');
const summary=html.match(/<section id="admin-section-summary"[\s\S]*?<\/section>/)?.[0]||'';
const statistics=html.match(/<section id="admin-section-statistics"[\s\S]*?<\/section>/)?.[0]||'';
assert.doesNotMatch(summary,/class="admin-stats"|id="admin-event-count"|id="admin-group-count"/,'summary must not duplicate statistics cards');
assert.match(statistics,/id="admin-stat-events"/);assert.match(statistics,/id="admin-stat-grouped"/);
assert.match(app,/\$\('#admin-stat-events'\)\.textContent/);assert.match(app,/\$\('#admin-stat-grouped'\)\.textContent/);
console.log('Admin tab visibility and non-duplicated statistics contract PASS');
