# Registro Único bound to its Google Sheet — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make Registro Único installable as one Apps Script project opened from its target spreadsheet, with menu/sidebar actions that link that spreadsheet and open the app/Admin.

**Architecture:** The primary Apps Script project becomes container-bound to the Sheet and retains the web-app `doGet`/server ACL. Its `onOpen` adds a menu; the menu and sidebar open CRUD/Admin and safely initialize only the currently bound spreadsheet without asking for a spreadsheet ID. The app keeps its own Pages `index.html`; do not change the Apps Script deployment URL until Claudio supplies the new `/exec`.

**Tech Stack:** Google Apps Script V8, Sheets custom menu/sidebar, HtmlService, Python contract tests, GitHub Pages.

---

### Task 1: Specify bound-project contract with failing tests

**Files:** `registro-unico/tests/test_contract.py`, `registro-unico/tests/test_catalog.py`

- Require `onOpen`, CRUD/Admin menu links, a bound-sheet setup function, no standalone companion `sheet-menu/`, and the `script.container.ui` scope in the primary manifest.
- Require the app's own `registro-unico/index.html` and preserve its current deployment URL until supplied anew.
- Run tests first; confirm expected RED.

### Task 2: Merge Sheets entry points into the primary Apps Script project

**Files:** `registro-unico/appscript/Code.gs`, `registro-unico/appscript/appsscript.json`

- Add menu and sidebar helper in the main `Code.gs`.
- Add a server function available from the bound menu/sidebar that derives the active spreadsheet ID, requires the configured bootstrap admin, initializes only the `Registros` tab/header, saves the ID, refuses to silently relink a different configured Sheet, and never creates an `Acceso` tab.
- Make the spreadsheet linker server-side only and derive its ID from the bound spreadsheet; refuse retargeting.
- Add only `script.container.ui` to existing scopes.

### Task 3: Documentation and package

**Files:** `registro-unico/README.md`, `AGENT.md`, `SPEC.md`, `SETUP.md`, `SPEC-PERFORMANCE.md`, tests.

- Explain opening **Extensiones → Apps Script** from the intended Sheet, copying the four primary files into that bound project, configuring the bootstrap email, saving, deploying web app as accessing user / Google-account users, and reopening Sheet for menu.
- Keep the own landing `index.html`; note current Pages link remains unchanged until Claudio provides the `/exec` for this bound deployment.
- Remove the companion-project procedure and keep the current Sheets safer than any accidental relink.

### Task 4: Verify and publish source/catalog

- Run all catalog/contract tests and Apps Script JS/HTML/manifest syntax checks.
- Inspect diff and verify no spreadsheet IDs, personal emails, or credentials were added.
- Integrate into `main` using a fast-forward commit; Pages is unaffected except source/docs unless the index changes.
- Verify GitHub SHA and Pages; do not deploy Apps Script or alter a real Sheet.

**Risks/gates:** Google Apps Script runtime and bound UI need Claudio to copy and publish manually. The current `/exec` remains unchanged until a new bound deployment URL is provided. Binding and scope consent happen in the Sheet project; deployment setting remains a separate manual gate.

**Execution status:** Implemented in `main`; the repository copy retains its own Pages `index.html` and existing `/exec` until Claudio supplies the URL for the new bound deployment. Offline contract suite: 15/15 PASS; JavaScript/HTML syntax and manifest checks PASS. Runtime, OAuth and Sheet UI still require manual validation after Claudio copies and deploys the project from Sheets.
