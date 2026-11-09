# Schedule Teacher Assignment Generator Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Suggest and stage eligible teacher assignments for already scheduled classes, respecting scope, availability and overlaps.

**Architecture:** Add one deterministic pure helper to the existing frontend, display its proposal behind an explicit user confirmation, and stage changes locally through the existing record persistence path. Keep schedule slot generation out of scope because no duration/frequency constraints are present.

**Tech Stack:** Existing vanilla JavaScript, Node.js assertion tests, current IndexedDB staging.

---

### Task 1: Regression contract

- Add tests for exact scope matching, availability blocks, existing and proposed overlaps, deterministic teacher selection, and no eligible teacher.
- Run focused test and confirm it fails before implementation.

### Task 2: Minimal implementation

- Add deterministic scheduling helper to `app.js`.
- Add an admin button to preview and stage only proposed teacher assignments after confirmation.
- Keep the existing schedule board refresh action separate; no automatic Sheets sync.

### Task 3: Verification

- Run the focused test, syntax checks, and full existing Notas test suite.
- Inspect the final diff and verify no published site or live Sheets changed.
