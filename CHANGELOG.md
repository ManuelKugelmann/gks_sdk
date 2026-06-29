# @gks/sdk — Changelog

All notable changes to the GKS Platform SDK are documented here.
Format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [0.1.0] — 2026-06-29

### Added
- `ui/BurgerMenu.js` — Shared in-game pause/exit menu component (Phaser GameObjects.Container).
- `systems/LocalStorageSystem.js` — Versioned, safe wrapper around browser localStorage with schema migration support.
- `tools/DevPositioner.js` — Development-only drag-to-position utility for calibrating game object coordinates against a background image.
- `ui/index.js`, `systems/index.js`, `tools/index.js` — Clean re-export indices for each module.
- `package.json` — `@gks/sdk` package with `exports` map and `phaser` declared as a `peerDependency` (consumers provide their own Phaser; prevents duplicate-instance bugs).

### Consumption model
- **Portal**: vendors this repo as a `git subtree` and resolves `@gks/*` via Vite aliases pointing at the in-tree copy (live co-editing).
- **Games**: consume this repo as a package dependency (`@gks/sdk`); standalone clones `npm install` it, so they build against the real SDK with no portal present.

---

## [Planned — 0.2.0]

- `host/` — `GameHost` contract (the "plug": `user`, `lang`, `storage`, `exit()`) + a `DefaultHost` and minimal harness so a game runs standalone without any wrapper. Replaces per-game `dev-test/mocks`.
- `systems/LocalizationManager.js` — Multi-language string lookup, language cycling, browser detection.
- `ui/PopupManager.js` — Generic modal/popup system (currently portal-only).

## [Planned — 0.3.0]

- `systems/ProgressionManagerBase.js` — Abstract base class; each game subclasses with its own key prefix.
