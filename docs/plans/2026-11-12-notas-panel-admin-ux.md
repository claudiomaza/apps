# Notas Panel and Admin UX Implementation Plan

> **For Claude:** Execute this bounded plan in the isolated worktree; preserve user data and keep Apps Script/Sheets writes out of scope.

**Goal:** Clarify sync actions and summary units, improve dashboard navigation/search, and expose a safe sign-out control.

**Architecture:** Reuse the app's shared table controls and session state. Add explicit column-scoped search, an explanation for refresh vs synchronization, and an explicit sign-out UI that keeps the account's locally staged drafts intact. Do not redesign teacher/student administration in this slice; evaluate current workflows and propose a simpler model separately.

**Tech Stack:** Existing vanilla JavaScript, HTML, CSS, Node test scripts.

---

### Task 1: Make table search column-aware
- Modify `notas/app.js` shared table-tools rendering/filter logic.
- Test `notas/tests/records-tables.test.js`: whole-table remains the default; selecting a column searches only that cell; sorting and dynamic refresh still work.

### Task 2: Clarify summary and dashboard navigation
- Rename attendance heading to “Promedio de asistencia por evaluación”.
- Move “Actividad reciente” beside “Panel inicial”.
- Give each subject-statistics metric an explicit unit in its header; distinguish simple grade average in points.
- Add regression assertions in `notas/tests/summary-dashboard.test.js` and `ui-regression.test.js`.

### Task 3: Explain sync controls and add sign-out
- Explain that “Actualizar” reads latest Sheets data while retaining local drafts; “Sincronizar” submits prepared changes and can write to Sheets.
- Add sign-out under account details, clear in-memory session/data, preserve locally staged drafts, and return to login.
- Add DOM/session contract tests.

### Task 4: Verify
- Run all `notas/tests/*.test.js`, JavaScript syntax checks, and `git diff --check`.
- Inspect changes and record outstanding visual QA; do not edit Apps Script or real Sheets.
