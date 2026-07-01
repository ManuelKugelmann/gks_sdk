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

## [0.2.0] — 2026-06-29

### Added
- `host/bootStandalone.js` — Standalone host harness: boots a game outside the portal, injecting `user` / `currentLanguage` into the Phaser registry and providing an EXIT target. Replaces per-game `dev-test/mocks`.
- `host/sceneKeys.js` — `makeSceneKeys(name)` derives a game's globally-unique `Intro`/`Main`/`End` scene-key set from a single name prefix.
- `host/viteGameConfig.js` — `gameViteConfig()` returns a shared Vite config so a standalone game's `vite.config.js` is one line.
- `ui/PopupManager.js` — JSON-driven, localized, multi-page modal/popup system (previously portal-only).
- `systems/ProgressionManager.js` — Per-game progress store over `LocalStorageSystem`, keyed by a unique prefix.

### Changed
- `exports` map extended with `./host/*`. Games now import everything by package name (`@gks/sdk/ui/*`, `@gks/sdk/host/*`, …); the portal keeps `@gks/ui` only as a legacy alias.

## [Planned — 0.3.0]

- `systems/LocalizationManager.js` — Multi-language string lookup, language cycling, browser detection (still portal-only).
