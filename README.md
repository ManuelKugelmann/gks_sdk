# @gks/sdk

The shared interface ("plug") between the GKS Portal and the individual games — the public surface a game pulls in to run inside the portal, a standalone harness, or a native app wrapper.

## Modules

| Import | What |
|---|---|
| `@gks/ui/BurgerMenu.js` | In-game pause/exit menu (Phaser `Container`) |
| `@gks/systems/LocalStorageSystem.js` | Versioned, safe localStorage wrapper with schema migration |
| `@gks/tools/DevPositioner.js` | Dev-only drag-to-position calibration tool |

`phaser` is a **peerDependency** — the consumer (portal/game) provides it, so there is never a second Phaser instance.

## Consumption model

This repo plays two roles:

- **Portal** vendors it as a **`git subtree`** and resolves `@gks/*` via Vite aliases pointing at the in-tree copy → live co-editing of SDK + portal in one tree.
- **Games** consume it as a **package** (`@gks/sdk`). A standalone game clone runs `npm install` and builds against the real SDK with no portal present. Inside the portal, the portal's Vite alias overrides the package and points every game at the single subtree copy.

So: maintainers author the SDK in the portal subtree; games are read-only package consumers. See `CHANGELOG.md` — bump the version and document every change, because one breaking change affects every game.

## Imports never change

Games and the portal always import from the stable `@gks/*` aliases. Only where the alias *resolves* differs by context (subtree copy vs. installed package), so switching distribution later (e.g. to a published registry version) is a config change, not a code change.
