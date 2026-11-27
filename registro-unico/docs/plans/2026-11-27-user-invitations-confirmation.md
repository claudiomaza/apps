# Invitaciones de usuarios y confirmación de acceso

> **For Claude:** REQUIRED SUB-SKILL: TDD; keep all authorization and role assignment on the Apps Script server.

**Goal:** Let the spreadsheet owner/admin create a profile for a Google account with role `user` or `admin`; require the invited account to confirm access on first app open before CRUD is enabled. `user` is the default; admin operations still require being spreadsheet owner.

**Architecture:** Profiles stay in Script Properties. Admin invitation stores a pending profile and grants that email Google Sheets Editor permission; it does not activate CRUD in the app. The app identifies the Google account from `Session.getActiveUser()`, shows confirmation only to the account matching a pending profile, and activates its preassigned role through an identity-bound RPC. A browser email is never used to choose the profile; an expected-role snapshot only detects stale screens and cannot assign a role. Existing `user1` and `user2` profiles remain usable as canonical `user`.

**Tech Stack:** Apps Script V8, HtmlService, `google.script.run`, Python contract tests.

---

### Task 1: Specify the invitation and authorization state machine

**Files:** `registro-unico/tests/test_contract.py`.

- RED: assert new role `user`, pending profile invitation, `bootstrap` pending response, `confirmAccess` allowlisting and identity derivation, preserved assigned role, denial for unknown/revoked users, and no browser-supplied email/role during acceptance.
- Run the focused test and record expected failure.

### Task 2: Implement server state transitions

**Files:** `registro-unico/appscript/Code.gs`.

- Invite or re-invite: owner/admin only, role allowlisted; save pending + inactive; grant Sheet Editor; rollback profile if sharing fails.
- Confirmation: under ScriptLock, derive email from Google session, require that email to match an unaccepted pending profile, compare the displayed role snapshot to the currently assigned role, and activate it without changing role. If the admin changed it while the screen was open, require reload before confirmation.
- Role edits preserve state; deactivation revokes app access and direct Sheets permission. Keep admin/last-admin safeguards and support stored legacy `user1`/`user2` as `user`.

### Task 3: Add the confirmation screen and profile statuses

**Files:** `registro-unico/appscript/Registro.html`.

- Show the identified Google email and the role already assigned by admin; require a click to confirm before exposing CRUD. A rejected or unlisted user cannot register themselves or self-assign a role.
- Admin can create a profile and role, see pending/active/disabled states, resend an invitation, change a role without activating, and revoke access.

### Task 4: Update spec and verify

**Files:** `registro-unico/README.md`, `AGENT.md`, `SPEC.md`, `SPEC-PERFORMANCE.md`.

- Document quota identity (`USER_ACCESSING`), profile lifecycle and need for Editor permission; do not touch active Apps Script deployment or real Sheet.
- Run all Registro Único tests, JavaScript syntax checks and review diff. Google OAuth, notification delivery and real account/UI remain unverified absent manual deployment/test.
