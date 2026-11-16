// ============================================================
// SAFE STORAGE UTILITIES (with error handling)
// ============================================================

import toast from './toast.js';

/**
 * Safely get item from localStorage with fallback
 */
export const safeLocalStorageGet = (key, fallback = null) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : fallback;
    } catch (error) {
        console.error(`Error reading from localStorage (${key}):`, error);
        return fallback;
    }
};

// Track save-error warning so we don't spam the user
let _saveErrorWarned = false;

/**
 * Safely set item in localStorage
 */
export const safeLocalStorageSet = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
    } catch (error) {
        console.error(`Error writing to localStorage (${key}):`, error);
        // Quota errors get a specific, actionable message; anything else (e.g. a
        // SecurityError when storage is blocked in some private-browsing modes)
        // still needs to surface to the user instead of failing silently.
        if (!_saveErrorWarned) {
            _saveErrorWarned = true;
            const message = error.name === 'QuotaExceededError'
                ? 'Storage is full! Export your data as a backup, then clear old trainers to free space.'
                : 'Failed to save — your browser may be blocking storage (e.g. private browsing). Export your data as a backup.';
            toast.error(message);
            setTimeout(() => { _saveErrorWarned = false; }, 60000);
        }
        return false;
    }
};
