'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const css=fs.readFileSync(__dirname+'/styles.css','utf8');
const rule=css.match(/\.group-color-options input\s*\{([^}]*)\}/)?.[1]||'';
assert.match(rule,/width\s*:\s*auto/,'radio buttons must not inherit width:100% from the global input rule');
assert.match(rule,/flex\s*:\s*0\s+0\s+auto/,'radios must retain their natural size within flex labels');
console.log('Group-color radio layout contract PASS');
