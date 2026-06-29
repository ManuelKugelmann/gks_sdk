/**
 * Derive a game's Phaser scene-key set from a single NAME.
 *
 * Scene keys must be globally UNIQUE across all portal games (they all register
 * into one Phaser game), so `name` is the per-game prefix that keeps them apart.
 *
 * - MAIN / END are INTERNAL to the game — only its own scene transitions use
 *   them — so they're derived as `${name}_Main` / `${name}_End`.
 * - INTRO is the game's PUBLIC sceneKey and IS coupled to the portal flow:
 *   gamecard_config.json maps the game to it, the portal launches the game via
 *   scene.start(sceneKey), and it must equal gameMeta.sceneKey. It defaults to
 *   the bare `name`, but pass `intro` when the public key differs (e.g. legacy
 *   keys like 'NumberLearningScene' or 'VerliebteZahlen').
 *
 * @param {string} name          Game prefix, unique across all portal games.
 * @param {object} [opts]
 * @param {string} [opts.intro]  Public intro/sceneKey override (defaults to name).
 * @returns {{INTRO: string, MAIN: string, END: string}}
 */
export function makeSceneKeys(name, { intro = name } = {}) {
    return {
        INTRO: intro,
        MAIN: `${name}_Main`,
        END: `${name}_End`,
    };
}
