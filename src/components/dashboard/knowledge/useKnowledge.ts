import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { DashboardApiError, dashboardApi } from '../../../api/dashboardApi';
import type { KnowledgePageResponse, KnowledgeSearchResponse, KnowledgeSummary } from '../../../api/knowledgeTypes.ts';
import {
    loadMarks,
    loadRecent,
    nextMark,
    pushRecent,
    saveMark,
    saveRecent,
    type Mark,
    type StorageLike,
} from './knowledgeModel.ts';

/** The browser's localStorage, or null when it is missing or blocked (private windows, site data off). */
export function browserStorage(): StorageLike | null {
    try {
        return typeof window !== 'undefined' ? window.localStorage : null;
    } catch {
        return null;
    }
}

// ── the index ────────────────────────────────────────────────────────────────

const INDEX_FRESH_MS = 5 * 60 * 1000;

let indexCache: { pages: KnowledgeSummary[]; at: number } | null = null;
let indexRequest: Promise<KnowledgeSummary[]> | null = null;

function fetchIndex(): Promise<KnowledgeSummary[]> {
    if (!indexRequest) {
        indexRequest = dashboardApi
            .getKnowledgeIndex()
            .then((pages) => {
                indexCache = { pages, at: Date.now() };
                return pages;
            })
            .finally(() => {
                indexRequest = null;
            });
    }
    return indexRequest;
}

export interface IndexState {
    pages: KnowledgeSummary[] | null;
    error: boolean;
    reload: () => void;
}

/**
 * The whole library as summary rows. One request is shared by every screen and kept for a few
 * minutes: browsing between pages does not ask again, and a newly published page shows up on the
 * next visit after that.
 */
export function useKnowledgeIndex(): IndexState {
    const [pages, setPages] = useState<KnowledgeSummary[] | null>(indexCache?.pages ?? null);
    const [error, setError] = useState(false);

    const load = useCallback(() => {
        fetchIndex().then(
            (list) => {
                setPages(list);
                setError(false);
            },
            () => setError(true),
        );
    }, []);

    useEffect(() => {
        if (!indexCache || Date.now() - indexCache.at > INDEX_FRESH_MS) load();
    }, [load]);

    return { pages, error, reload: load };
}

// ── one page ─────────────────────────────────────────────────────────────────

export interface PageState {
    data: KnowledgePageResponse | null;
    /** 404 means the slug is not in the library; anything else is a failed request. */
    error: 'missing' | 'failed' | null;
    reload: () => void;
}

/** One page by slug. The caller keys its component by slug, so state never has to be reset here. */
export function useKnowledgePage(slug: string): PageState {
    const [data, setData] = useState<KnowledgePageResponse | null>(null);
    const [error, setError] = useState<'missing' | 'failed' | null>(null);
    const attempt = useRef(0);

    const load = useCallback(() => {
        const mine = (attempt.current += 1);
        dashboardApi.getKnowledgePage(slug).then(
            (response) => {
                if (attempt.current !== mine) return;
                setData(response);
                setError(null);
            },
            (err: unknown) => {
                if (attempt.current !== mine) return;
                setError(err instanceof DashboardApiError && err.status === 404 ? 'missing' : 'failed');
            },
        );
    }, [slug]);

    useEffect(() => {
        load();
    }, [load]);

    return { data, error, reload: load };
}

// ── search inside the text of every page ─────────────────────────────────────

export interface TextSearchState {
    response: KnowledgeSearchResponse | null;
    pending: boolean;
    error: boolean;
}

const SEARCH_DEBOUNCE_MS = 350;

/** Server-side search over page text, started once typing pauses and only for a real query. */
export function useTextSearch(query: string): TextSearchState {
    const [state, setState] = useState<{ query: string; response: KnowledgeSearchResponse | null; error: boolean }>({
        query: '',
        response: null,
        error: false,
    });
    const trimmed = query.trim();
    const wanted = trimmed.length >= 3 ? trimmed : '';

    useEffect(() => {
        if (!wanted) return;
        let cancelled = false;
        const timer = window.setTimeout(() => {
            dashboardApi.searchKnowledge(wanted).then(
                (response) => {
                    if (!cancelled) setState({ query: wanted, response, error: false });
                },
                () => {
                    if (!cancelled) setState({ query: wanted, response: null, error: true });
                },
            );
        }, SEARCH_DEBOUNCE_MS);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [wanted]);

    if (!wanted) return { response: null, pending: false, error: false };
    const settled = state.query === wanted;
    return { response: settled ? state.response : null, pending: !settled, error: settled && state.error };
}

// ── self-scores and recently read pages (this device only) ───────────────────

interface MarksApi {
    get: (key: string) => Mark;
    cycle: (key: string) => void;
}

export const MarksContext = createContext<MarksApi>({ get: () => '', cycle: () => undefined });

export function useMarks(): MarksApi {
    return useContext(MarksContext);
}

/** The marks of one page, kept in localStorage; provide the result through MarksContext. */
export function usePageMarks(slug: string): MarksApi {
    const storage = useMemo(() => browserStorage(), []);
    const [marks, setMarks] = useState<Record<string, Mark>>(() => loadMarks(storage, slug));
    const get = useCallback((key: string): Mark => marks[key] ?? '', [marks]);
    const cycle = useCallback(
        (key: string) => setMarks(saveMark(storage, slug, key, nextMark(marks[key] ?? ''))),
        [marks, slug, storage],
    );
    return useMemo(() => ({ get, cycle }), [get, cycle]);
}

/** Pages opened lately, newest first, read once when the library home opens. */
export function useRecentPages(): string[] {
    const storage = useMemo(() => browserStorage(), []);
    const [recent] = useState<string[]>(() => loadRecent(storage));
    return recent;
}

/** Records that a page was opened (kept on this device only). */
export function recordVisit(slug: string): void {
    const storage = browserStorage();
    saveRecent(storage, pushRecent(loadRecent(storage), slug));
}
