export default class LocalStorageSystem {
    /**
     * Safe Save to LocalStorage
     * Wraps data in a structure: { version, data, timestamp }
     * @param {string} key
     * @param {any} data
     * @param {number} version
     */
    static save(key, data, version = 1) {
        try {
            const payload = {
                version: version,
                data: data,
                timestamp: Date.now()
            };
            const serialized = JSON.stringify(payload);
            localStorage.setItem(key, serialized);
            // console.log(`[LocalStorageSystem] Saved ${key} (v${version})`);
        } catch (e) {
            console.error(`[LocalStorageSystem] Failed to save ${key}:`, e);
        }
    }

    /**
     * Safe Load from LocalStorage
     * Checks version. If mismatch or error, returns defaultValue.
     * @param {string} key
     * @param {any} defaultValue
     * @param {number} expectedVersion
     * @returns {any}
     */
    static load(key, defaultValue, expectedVersion = 1) {
        try {
            const raw = localStorage.getItem(key);
            if (!raw) return defaultValue;

            const payload = JSON.parse(raw);

            // 1. Check Structure
            if (!payload || typeof payload !== 'object' || !payload.version) {
                console.warn(`[LocalStorageSystem] Invalid structure for ${key}. Resetting.`);
                return defaultValue;
            }

            // 2. Check Version
            if (payload.version !== expectedVersion) {
                console.warn(`[LocalStorageSystem] Version Mismatch for ${key}. Expected ${expectedVersion}, got ${payload.version}. Resetting.`);
                // Optional: We could implement migration logic here in the future
                return defaultValue;
            }

            return payload.data;
        } catch (e) {
            console.error(`[LocalStorageSystem] Failed to load ${key}:`, e);
            return defaultValue;
        }
    }

    /**
     * Remove a specific key
     * @param {string} key
     */
    static delete(key) {
        try {
            localStorage.removeItem(key);
            console.log(`[LocalStorageSystem] Deleted ${key}`);
        } catch (e) {
            console.error(`[LocalStorageSystem] Failed to delete ${key}`, e);
        }
    }

    /**
     * Wipe all keys starting with a prefix
     * @param {string} prefix
     */
    static wipe(prefix) {
        try {
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(prefix)) {
                    keysToRemove.push(key);
                }
            }

            keysToRemove.forEach(k => localStorage.removeItem(k));
            console.log(`[LocalStorageSystem] Wiped ${keysToRemove.length} keys with prefix '${prefix}'`);
        } catch (e) {
            console.error(`[LocalStorageSystem] Failed to wipe prefix ${prefix}`, e);
        }
    }
}
