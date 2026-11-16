'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs');
const config=fs.readFileSync('mgd/config.js','utf8');
assert.match(config,/API_URL:\s*'https:\/\/script\.google\.com\/macros\/s\/AKfycbxXUneCmBRRB3EqA3emhHvyyRtwfYSxRbiHcaa0snUiSJzebi38g8_0EuVIXkAxxXH7\/exec'/,'MGD frontend must use the verified current Apps Script deployment');
console.log('PASS: MGD config uses the verified current Apps Script deployment');
