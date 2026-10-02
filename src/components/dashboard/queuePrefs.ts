/**
 * The queue's remembered filters: which buckets, which lanes, source, run and
 * sort Richard last picked. They are read on load and written on every change,
 * so reopening the dashboard shows his own quick filters, not a reset list.
 * The search box is deliberately not remembered (a stale search looks like an
 * empty queue).
 *
 * Storage is injectable and every access is guarded: localStorage can be missing
 * or throw (private browsing, quota), and the dashboard must work without it.
 */

import { DEFAULT_BUCKETS, DEFAULT_SORT, SORT_KEYS, isBucketId, type BucketId } from './queueBuckets.ts';

export interface QueuePrefs {
    /** Empty means "All stages", which is a choice Richard can make and keep. */
    buckets: BucketId[];
    /** Empty means every lane. */
    lanes: string[];
    source?: string;
    run?: string;
    sort: string;
}

export const QUEUE_PREFS_KEY = 'dashboard_queue_prefs_v2';

export type PrefsStorage = Pick<Storage, 'getItem' | 'setItem'>;

function browserStorage(): PrefsStorage | null {
    try {
        return typeof localStorage === 'undefined' ? null : localStorage;
    } catch {
        return null;
    }
}

export function defaultQueuePrefs(): QueuePrefs {
    return { buckets: [...DEFAULT_BUCKETS], lanes: [], sort: DEFAULT_SORT };
}

function optionalString(value: unknown): string | undefined {
    return typeof value === 'string' && value ? value : undefined;
}

export function parseQueuePrefs(raw: string | null): QueuePrefs {
    const fallback = defaultQueuePrefs();
    if (!raw) return fallback;

    let parsed: unknown;
    try {
        parsed = JSON.parse(raw);
    } catch {
        return fallback;
    }
    if (typeof parsed !== 'object' || parsed === null) return fallback;
    const stored = parsed as Record<string, unknown>;

    let buckets = fallback.buckets;
    if (Array.isArray(stored.buckets)) {
        const known = stored.buckets.filter(isBucketId);
        // [] is a real choice ("All stages"); a non-empty list of names we no longer know is not.
        buckets = known.length > 0 || stored.buckets.length === 0 ? known : fallback.buckets;
    }

    return {
        buckets,
        lanes: Array.isArray(stored.lanes) ? stored.lanes.filter((lane): lane is string => typeof lane === 'string') : [],
        source: optionalString(stored.source),
        run: optionalString(stored.run),
        sort: typeof stored.sort === 'string' && SORT_KEYS.includes(stored.sort) ? stored.sort : DEFAULT_SORT,
    };
}

export function loadQueuePrefs(storage: PrefsStorage | null = browserStorage()): QueuePrefs {
    try {
        return parseQueuePrefs(storage?.getItem(QUEUE_PREFS_KEY) ?? null);
    } catch {
        return defaultQueuePrefs();
    }
}

export function saveQueuePrefs(prefs: QueuePrefs, storage: PrefsStorage | null = browserStorage()): void {
    try {
        storage?.setItem(QUEUE_PREFS_KEY, JSON.stringify(prefs));
    } catch {
        // Storage unavailable: the selection just will not persist.
    }
}
