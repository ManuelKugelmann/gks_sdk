# @gks/sdk

The shared interface ("plug") between the GKS Portal and the individual games — the public surface a game pulls in to run inside the portal, a standalone harness, or a native app wrapper.

## Modules

Everything is imported by package name via the `exports` map (`./ui/*`, `./systems/*`, `./tools/*`, `./host/*`):

| Import | What |
|---|---|
| `@gks/sdk/ui/BurgerMenu.js` | In-game pause/exit menu (Phaser `Container`) |
| `@gks/sdk/ui/PopupManager.js` | JSON-driven, localized, multi-page modal/popup system |
| `@gks/sdk/systems/LocalStorageSystem.js` | Versioned, safe localStorage wrapper with schema migration |
| `@gks/sdk/systems/ProgressionManager.js` | Per-game progress store (unique key prefix) over `LocalStorageSystem` |
| `@gks/sdk/tools/DevPositioner.js` | Dev-only drag-to-position calibration tool |
| `@gks/sdk/host/bootStandalone.js` | Standalone host harness — boots a game outside the portal (injects `user`/`currentLanguage`, provides an EXIT target) |
| `@gks/sdk/host/sceneKeys.js` | Derives a game's unique `Intro`/`Main`/`End` scene-key set from one name prefix |
| `@gks/sdk/host/viteGameConfig.js` | Shared Vite config for a standalone game: `export default gameViteConfig();` |

`phaser` is a **peerDependency** — the consumer (portal/game) provides it, so there is never a second Phaser instance.

## Consumption model

This repo plays two roles:

- **Portal** vendors it as a **`git subtree`** under `gks-portal/gks-sdk/` and aliases the package name `@gks/sdk` → that in-tree copy (`vite.config.js`), so SDK + portal co-edit in one tree. (A **legacy** `@gks/ui` → `src/platform/ui` alias is kept for older code still importing `@gks/ui/...`; new code should use `@gks/sdk/ui/...`.)
- **Games** consume it as a **package** (`@gks/sdk`, a `git+https` dependency on this repo). A standalone game clone runs `npm install` and builds against the real SDK with no portal present. Inside the portal, the portal's `@gks/sdk` alias overrides the installed package and points every game at the single subtree copy.

So: maintainers author the SDK here (and in the portal subtree); games are read-only package consumers. See `CHANGELOG.md` — bump the version and document every change, because one breaking change affects every game.

## Imports never change

Games and the portal import from the stable `@gks/sdk/*` specifier. Only where it *resolves* differs by context (portal subtree copy vs. installed package), so switching distribution later (e.g. to a published registry version) is a config change, not a code change. The `host/` module in particular must be imported by package name (`@gks/sdk/host/...`) because a game's `vite.config.js` consumes it **before** any Vite alias is resolved.

## Versioning

`package.json` `version` is the source of truth; each release is tagged (`vX.Y.Z`) and documented in `CHANGELOG.md`. Games depend on this repo via `git+https://…/gks_sdk.git#<ref>` — pin `#vX.Y.Z` for reproducible builds rather than tracking `#main`.
