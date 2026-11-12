'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=__dirname,app=fs.readFileSync(path.join(root,'app.js'),'utf8'),backend=fs.readFileSync(path.join(root,'apps-script','Code.gs'),'utf8');
assert.match(backend,/Calendar\.Acl\.remove\(a\.calendar\.googleCalendarId,rule\.id\)/);
assert.match(backend,/event:'calendar_acl_remove_failed'/);
assert.match(backend,/INVITATION_REVOKE_FAILED/);
assert.match(app,/removeCollaboratorLocally\(b\.dataset\.removeCalendarInvite\)/);
assert.match(app,/removeCollaboratorLocally\(b\.dataset\.removeCollaborator\)/);
console.log('Calendar ACL revoke rule ID and immediate collaborator UI contracts PASS');
