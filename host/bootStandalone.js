import Phaser from 'phaser';

/**
 * Shared STANDALONE HOST HARNESS for GKS games.
 *
 * Inside the GKS Portal, the portal owns the runtime: it injects `user` /
 * `currentLanguage` into the Phaser registry and provides the real
 * `MainMenuScene` that a game's EXIT button returns to.
 *
 * Standalone (local Vite dev or a static GitHub Pages build) there is no portal,
 * so this builds an equivalent Phaser game — the "plug". It lives in the SDK so
 * every game's entry stays identical and DRY; a game's main.js just calls it.
 *
 * @param {object}   opts
 * @param {Function} opts.IntroScene      The game's entry Phaser.Scene (it bootstraps its own Main/End).
 * @param {string}   opts.introKey        The Intro scene's key (e.g. SCENE_KEYS.INTRO). The stand-in
 *                                         MainMenuScene relaunches it so the EXIT button works standalone.
 * @param {object}   [opts.user]          Registry `user` to simulate (tier / membership).
 * @param {string}   [opts.language]      Registry `currentLanguage` ('de' | 'en').
 * @param {object}   [opts.config]        Extra Phaser.Game config, shallow-merged over the defaults.
 * @returns {Phaser.Game}
 */
export function bootStandalone({
    IntroScene,
    introKey,
    user = { name: 'DevUser', tier: 'Werkstatt-Supporter', isMember: true },
    language = 'de',
    config = {}
} = {}) {
    // Stand-in for the portal's main menu so `scene.start('MainMenuScene')` resolves.
    class DevMenuScene extends Phaser.Scene {
        constructor() {
            super({ key: 'MainMenuScene' });
        }
        create() {
            this.scene.start(introKey);
        }
    }

    // Mirrors the portal's Phaser config (Matter physics, 1920x1080 FIT) so the
    // game behaves identically on its own.
    const game = new Phaser.Game({
        type: Phaser.AUTO,
        parent: 'app',
        backgroundColor: '#000000',
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            width: 1920,
            height: 1080
        },
        physics: {
            default: 'matter',
            matter: { gravity: { y: 1 }, debug: false }
        },
        scene: [DevMenuScene, IntroScene],
        ...config
    });

    // What the portal normally injects into the registry.
    game.registry.set('currentLanguage', language);
    game.registry.set('user', user);
    return game;
}
