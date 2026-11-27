# Registro Único Apps Script AIO Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: TDD; follow the existing Agenda HtmlService AIO pattern.

**Goal:** Make Registro Único launch and run reliably inside Apps Script HtmlService like Agenda, with CRUD and Administration as separate Sheets menu entries.

**Architecture:** One `Registro.html` renders both views for `doGet` and the Sheets menu modal. The browser calls one allowlisted `google.script.run` dispatcher; existing backend functions retain their authentication, validation, and ownership checks. GitHub Pages remains a separate static landing page.

**Tech Stack:** Apps Script V8, HtmlService, `google.script.run`, Python contract tests, JavaScript syntax parsing.

---

### Task 1: Replace split/link UI with integrated HtmlService app

**Files:** `registro-unico/appscript/Code.gs`, `appsscript.json`, `Registro.html`; remove stale `Index.html` and `Admin.html`. Set webapp execution identity to `USER_ACCESSING`.

- RED: update contract tests to require single-file HtmlService, direct modal launch, separate menu items with server-side owner/admin enforcement, and allowlisted RPC; run to confirm failure.
- GREEN: use a shared `renderRegistroUnico_()` for `doGet` and menu launch; combine CRUD/Admin views; route client calls through `runRegistroUnicoApi` while retaining authenticated handlers as underscore-suffixed private functions.
- Verify: Python contract tests, Apps Script and embedded JavaScript syntax, manifest, Pages landing unchanged. No Google runtime is claimed without a manual authenticated test.

### Task 2: Document rollout and integration

**Files:** `README.md`, `AGENT.md`, `SPEC.md`, `SPEC-PERFORMANCE.md`.

- Record the Agenda-style HtmlService architecture and exact manual deployment steps. Never change the active Google deployment or real Sheet.
- Verify local tree and upstream `agenda/apps-script` pattern; distinguish offline acceptance from real authenticated UI QA.
