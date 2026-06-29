/**
 * Shared Vite config for a STANDALONE GKS game (dev + static build).
 *
 * Returns a plain config object (no `vite` import needed) so a game's
 * vite.config.js is one line: `export default gameViteConfig();`.
 * Inside the portal this is never loaded — the portal's own vite.config governs.
 *
 * GitHub Codespaces forwards the dev port over HTTPS on *.app.github.dev, so the
 * HMR websocket must target 443 and Vite's host check must allow that host.
 * Locally these are skipped so dev behaves exactly as before.
 *
 * @param {object} [overrides]  Shallow-merged over the defaults for per-game tweaks.
 */
export function gameViteConfig(overrides = {}) {
    const inCodespaces = process.env.CODESPACES === 'true';
    return {
        // Relative base so the static build works at any sub-path
        // (e.g. GitHub Pages project site: https://user.github.io/<repo>/).
        base: './',
        server: {
            open: !inCodespaces,
            host: true,
            port: 8080,
            allowedHosts: ['.app.github.dev'],
            ...(inCodespaces ? { hmr: { clientPort: 443 } } : {})
        },
        resolve: {
            // Single Phaser instance across the game and the @gks/sdk package.
            dedupe: ['phaser']
        },
        ...overrides
    };
}
