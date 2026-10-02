import { useCallback, useEffect, useRef, useState } from 'react';
import { dashboardApi, type JobApplication } from '../../api/dashboardApi';

/** A tab left open for hours goes stale (the agent keeps ingesting): refetch when he comes back after this long. */
const STALE_AFTER_MS = 2 * 60 * 1000;

/**
 * Fetches the list, asking again if a local edit landed while the request was in
 * flight (its answer predates the edit). Null when edits kept getting in the way.
 */
async function fetchUnlessEdited(editVersion: () => number, attempts = 3): Promise<JobApplication[] | null> {
    for (let attempt = 0; attempt < attempts; attempt += 1) {
        const before = editVersion();
        const list = await dashboardApi.listApplications();
        if (editVersion() === before) return list;
    }
    return null;
}

/**
 * The queue's list of roles. Loaded once, refetched when `refreshToken` changes
 * (a role was added) or when the tab becomes visible again after a while, and
 * patched in place by `replace`/`remove` when the detail screen saves a change,
 * so the list never keeps showing a role under a status it no longer has.
 */
export function useApplications(refreshToken: number) {
    const [applications, setApplications] = useState<JobApplication[] | null>(null);
    const [error, setError] = useState(false);
    // Bumped by every local edit: a slower fetch that started before the edit must not overwrite it.
    const editVersion = useRef(0);
    const loadedAt = useRef(0);

    const load = useCallback(
        () =>
            fetchUnlessEdited(() => editVersion.current).then(
                (list) => {
                    if (!list) return;
                    loadedAt.current = Date.now();
                    setApplications(list);
                    setError(false);
                },
                () => setError(true),
            ),
        [],
    );

    useEffect(() => {
        void load();
    }, [load, refreshToken]);

    useEffect(() => {
        function reloadWhenStale() {
            if (document.visibilityState === 'visible' && Date.now() - loadedAt.current > STALE_AFTER_MS) void load();
        }
        document.addEventListener('visibilitychange', reloadWhenStale);
        return () => document.removeEventListener('visibilitychange', reloadWhenStale);
    }, [load]);

    const replace = useCallback((updated: JobApplication) => {
        editVersion.current += 1;
        setApplications((prev) => prev && prev.map((a) => (a.id === updated.id ? updated : a)));
    }, []);

    const remove = useCallback((id: string) => {
        editVersion.current += 1;
        setApplications((prev) => prev && prev.filter((a) => a.id !== id));
    }, []);

    return { applications, error, reload: load, replace, remove };
}
