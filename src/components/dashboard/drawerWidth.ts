/**
 * The width of the queue drawer on desktop, which Richard sets by dragging its edge and
 * which is remembered between visits. Storage is injectable and every access is guarded
 * (localStorage can be missing or throw), like queuePrefs.
 */

export const DEFAULT_DRAWER_WIDTH = 400;
export const MIN_DRAWER_WIDTH = 280;
export const MAX_DRAWER_WIDTH = 640;

export const DRAWER_WIDTH_KEY = 'dashboard_drawer_width_v2';
/**
 * The first version of the key. It treated a missing value as 0 and clamped that up to the
 * minimum, then saved it on first load, so the browsers that opened the dashboard back then
 * hold 280 here without ever having dragged the handle: 280 in the old key means "never set".
 */
export const LEGACY_DRAWER_WIDTH_KEY = 'dashboard_drawer_width';

export type WidthStorage = Pick<Storage, 'getItem' | 'setItem'>;

function browserStorage(): WidthStorage | null {
    try {
        return typeof localStorage === 'undefined' ? null : localStorage;
    } catch {
        return null;
    }
}

export function clampDrawerWidth(width: number): number {
    return Math.min(MAX_DRAWER_WIDTH, Math.max(MIN_DRAWER_WIDTH, width));
}

function parseWidth(stored: string | null): number | null {
    if (stored === null || stored.trim() === '') return null;
    const width = Number(stored);
    return Number.isFinite(width) ? clampDrawerWidth(width) : null;
}

export function loadDrawerWidth(storage: WidthStorage | null = browserStorage()): number {
    try {
        const current = parseWidth(storage?.getItem(DRAWER_WIDTH_KEY) ?? null);
        if (current !== null) return current;

        const legacy = parseWidth(storage?.getItem(LEGACY_DRAWER_WIDTH_KEY) ?? null);
        if (legacy !== null && legacy !== MIN_DRAWER_WIDTH) return legacy;
    } catch {
        // Storage unavailable: use the default.
    }
    return DEFAULT_DRAWER_WIDTH;
}

export function saveDrawerWidth(width: number, storage: WidthStorage | null = browserStorage()): void {
    try {
        storage?.setItem(DRAWER_WIDTH_KEY, String(width));
    } catch {
        // Storage unavailable: the width just will not persist.
    }
}
