# Testing Guide

This project has two test layers, run by CI on every push/PR to `main`:

| Layer | Runner | Command | Lives in |
|---|---|---|---|
| Unit | Vitest | `npm run test:run` | `src/**/__tests__/*.test.{js,jsx}`, colocated with the code under test |
| E2E  | Playwright | `npm run test:e2e` | `e2e/*.spec.js`, one file per app tab |

## Categories

There's no separate folder per category — smoke/feature/regression tests live together in the same spec file for the tab they cover. What distinguishes them is intent and naming:

- **Smoke** (`e2e/smoke.spec.js`) — fast, shallow checks that the app shell loads and every tab is reachable. Nothing tab-specific lives here. This is the first thing to run after any change; if it's red, don't bother running the rest.
- **Feature** (`e2e/<tab>.spec.js`, plus unit tests for hooks/utils/contexts) — exercises a tab's actual behavior: the happy path and the realistic edge cases (empty states, validation, confirm dialogs). Write one of these alongside any new feature.
- **Regression** — not a separate file. When a real bug is fixed, add a test for it in the relevant spec file (or create one if the area has no coverage yet) and prefix the test title with `regression:` followed by a one-line description of the failure mode, e.g.:

  ```js
  test('regression: clearing the quantity field and blurring does not collapse stock to 1', async ({ page }) => { ... });
  ```

  This makes every regression test `grep`-able (`grep -ri "test('regression:" e2e`) and keeps the "why does this weird test exist" context attached to the test itself instead of a commit message no one will read again.

## The rule: bug fixes ship with a regression test

Going forward, whenever a real bug is fixed in this codebase (not a typo/lint fix — an actual incorrect-behavior bug), the fix and its regression test land in the same commit. The test should fail against the pre-fix code and pass against the fix. If the bug isn't reasonably testable (e.g. a one-off data file correction), say so instead of skipping silently.

This is a going-forward policy, not a backfill project — past fixed bugs don't automatically get retroactive tests unless specifically requested.

## Writing e2e tests

Follow the existing pattern in `e2e/*.spec.js`:
- Mock `**/pokedex.min.json` and `**/pta-game-data.min.json` via `page.route` before `page.goto`.
- To start from non-empty state, seed `localStorage['pta-enhanced-save-data']` via `page.addInitScript` (must run before `page.goto`). See `e2e/trainer.spec.js`'s `SEEDED_SAVE` for the full shape (`{ version, activeTrainerId, trainers: [{ id, name, ..., party, reserve }] }`).
- Tabs stay mounted via CSS `display:none` after first visit — scope locators to a container specific to the active tab/card (e.g. `.pokemon-card-expanded`, `[role="dialog"]`) rather than matching loosely across the whole page.
- Multiple buttons often share text ("Add", "Use", "Cancel") across nav labels, checklists, and dialogs — scope to a container or use an exact match (`{ name: 'Use', exact: true }` / `/^Use$/`) rather than substring `hasText`.
- Always wait for `[aria-label="Loading application data"]` to detach before interacting.

### Local dev-server gotcha

`playwright.config.js` points at `http://localhost:5173` with `reuseExistingServer: true`. If another project's dev server is already bound to 5173 (easy to end up with when working across sibling repos), Playwright will silently reuse *that* server and your tests will run against the wrong app. If `npm run test:e2e` fails in ways that make no sense (missing elements that definitely exist in the code), check what's actually answering on 5173 before debugging further.

## Writing unit tests

Colocate in `__tests__/` next to the module, follow the existing `describe`/`it` structure in `src/utils/__tests__/*.test.js` and `src/hooks/__tests__/*.test.js`. Hook tests use `renderHook`/`act` from `@testing-library/react`. Modal component tests wrap with `<ModalContext.Provider value={{ confirmModal, setConfirmModal }}>`.

## Known gap

`InventoryTab.jsx` implements its own inventory logic inline (`handleAddItem`, `decrementQty`, etc.) rather than via a shared hook. New inventory coverage should target `InventoryTab.jsx`'s actual behavior via e2e. (`src/hooks/useInventory.js` was a dead, unused alternative implementation with its own unit tests — both deleted.)
