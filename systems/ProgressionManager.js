import LocalStorageSystem from './LocalStorageSystem.js';

/**
 * Shared progression "shell" — versioned, namespaced key/value persistence over
 * LocalStorageSystem. Provides the common plumbing (load / get / set / reset)
 * every game needs; each game passes its own UNIQUE key prefix so saves never
 * collide.
 *
 * Open for extension: subclass to set the prefix, seed defaults via `defaults()`,
 * and add game-specific helpers (see e.g. a game's hasSeen()/markSeen()).
 */
export default class ProgressionManager {
    /**
     * @param {string} prefix                 Unique per-game key prefix, e.g. 'gks_0003_'.
     * @param {object} [opts]
     * @param {number} [opts.schemaVersion=1] Bump to force-wipe stored data on mismatch.
     */
    constructor(prefix, { schemaVersion = 1 } = {}) {
        if (!prefix) throw new Error('[ProgressionManager] a unique key prefix is required');
        this.prefix = prefix;
        this.schemaVersion = schemaVersion;
        this.dataKey = `${prefix}data`;
        this.cache = {};
        this.isInitialized = false;
    }

    /** Override to seed default progression for a fresh / wiped profile. */
    defaults() {
        return {};
    }

    /** Load persisted data into the cache. Safe to await repeatedly. */
    async init() {
        // On SCHEMA_VERSION mismatch LocalStorageSystem returns the defaults (auto-wipe).
        this.cache = LocalStorageSystem.load(this.dataKey, this.defaults(), this.schemaVersion);
        this.isInitialized = true;
        console.log(`[ProgressionManager] Initialized (${this.prefix} v${this.schemaVersion})`, this.cache);
        return this.cache;
    }

    /** Synchronous cache read with a fallback (fast enough for the game loop). */
    get(key, defaultVal) {
        return this.cache[key] !== undefined ? this.cache[key] : defaultVal;
    }

    async set(key, value) {
        if (!this.isInitialized) await this.init();
        this.cache[key] = value;
        this._save();
    }

    /** Wipe all progress for this game and reload for a clean state. */
    resetProgress() {
        console.warn(`[ProgressionManager] RESETTING PROGRESS (${this.prefix})`);
        LocalStorageSystem.wipe(this.prefix);
        this.cache = {};
        window.location.reload();
    }

    _save() {
        LocalStorageSystem.save(this.dataKey, this.cache, this.schemaVersion);
    }
}
