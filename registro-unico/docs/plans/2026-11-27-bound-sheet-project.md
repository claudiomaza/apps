# Registro Único bound to its Google Sheet — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Registro Único installable as one Apps Script project opened from its target spreadsheet, with menu/sidebar actions that link that spreadsheet and open the app/Admin.

**Architecture:** The primary Apps Script project is container-bound to the Sheet and retains the web-app `doGet`/server ACL. Its `onOpen` adds separate menu items for app and admin; owner-only binding acts on the current sheet without asking for an ID. Menu items show a trusted user-click link dialog for opening the Apps Script deployment. The app keeps its own Pages `index.html`.

**Tech Stack:** Google Apps Script V8, Sheets custom menu/sidebar, HtmlService, Python contract tests, GitHub Pages.

---

### Task 1: Specify bound-project contract with failing tests

**Files:** `registro-unico/tests/test_contract.py`, `registro-unico/tests/test_catalog.py`

- Require `onOpen`, separate CRUD/Admin menu items, a bound-sheet setup function, no sidebar or standalone companion `sheet-menu/`, and the `script.container.ui` scope in the primary manifest.
- Require the app's own `registro-unico/index.html` and preserve its current deployment URL until supplied anew.
- Run tests first; confirm expected RED.

### Task 2: Merge Sheets entry points into the primary Apps Script project

**Files:** `registro-unico/appscript/Code.gs`, `registro-unico/appscript/appsscript.json`

- Add separate menu handlers for CRUD and owner/admin-only Administration; open via user-click link dialog.
- Add a bound menu function that derives the active spreadsheet ID, bootstraps its owner as admin only on pristine Script Properties, initializes only `Registros`, refuses to retarget another configured Sheet, and never creates `Acceso`.
- Make the spreadsheet linker server-side only and derive its ID from the bound spreadsheet; refuse retargeting.
- Add only `script.container.ui` to existing scopes.

### Task 3: Documentation and package

**Files:** `registro-unico/README.md`, `AGENT.md`, `SPEC.md`, `SETUP.md`, `SPEC-PERFORMANCE.md`, tests.

- Explain opening **Extensiones → Apps Script** from the intended Sheet, copying the four primary files into that bound project, saving, deploying web app as accessing user / Google-account users, reopening Sheet, and bootstrapping its owner through the explicit bind button.
- Keep the own landing `index.html`; note current Pages link remains unchanged until Claudio provides the `/exec` for this bound deployment.
- Remove the companion-project procedure and keep the current Sheets safer than any accidental relink.

### Task 4: Verify and publish source/catalog

- Run all catalog/contract tests and Apps Script JS/HTML/manifest syntax checks.
- Inspect diff and verify no spreadsheet IDs, personal emails, or credentials were added.
- Integrate into `main` using a fast-forward commit; Pages is unaffected except source/docs unless the index changes.
- Verify GitHub SHA and Pages; do not deploy Apps Script or alter a real Sheet.

**Risks/gates:** Google Apps Script runtime and bound UI need Claudio to copy and publish manually. The current `/exec` remains unchanged until a new bound deployment URL is provided. Binding and scope consent happen in the Sheet project; deployment setting remains a separate manual gate.

**Execution status:** Implemented in `main`; the repository copy retains its own Pages `index.html` and existing `/exec` until Claudio supplies the URL for the new bound deployment. Offline contract suite: 15/15 PASS; JavaScript/HTML syntax and manifest checks PASS. Runtime, OAuth and Sheet UI still require manual validation after Claudio copies and deploys the project from Sheets.
