import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { dashboardApi, type JobApplication, type SearchRun } from '../../api/dashboardApi';
import { ApplicationCard } from './ApplicationCard';
import { FilterMenu, type FilterMenuGroup } from './FilterMenu';
import { FilterSheet, type Filters } from './FilterSheet';
import { FreshnessHeader } from './FreshnessHeader';
import { freshnessGroup } from './dashboardTokens';
import type { QueueOutletContext } from './queueContext';
import {
    BUCKETS,
    BUCKET_BY_ID,
    BUCKET_GROUPS,
    DEFAULT_SORT,
    SORT_OPTIONS,
    bucketCounts,
    filterApplications,
    isBucketId,
    laneCounts,
    laneLabel,
    sortApplications,
    type QueueFilter,
} from './queueBuckets';
import { loadQueuePrefs, saveQueuePrefs, type QueuePrefs } from './queuePrefs';
import { useApplications } from './useApplications';

const FRESHNESS_ORDER = ['Last 2 days', '3 to 7 days', '8 to 30 days', 'Older', 'Undated'];

const DRAWER_WIDTH_STORAGE_KEY = 'dashboard_drawer_width';
const DEFAULT_DRAWER_WIDTH = 400;
const MIN_DRAWER_WIDTH = 280;
const MAX_DRAWER_WIDTH = 640;

const NO_APPLICATIONS: JobApplication[] = [];

function loadStoredDrawerWidth(): number {
    try {
        const stored = localStorage.getItem(DRAWER_WIDTH_STORAGE_KEY);
        // Number(null) is 0, which would clamp to the minimum: a missing value means "use the default".
        if (stored === null) return DEFAULT_DRAWER_WIDTH;
        const raw = Number(stored);
        if (!Number.isFinite(raw)) return DEFAULT_DRAWER_WIDTH;
        return Math.min(MAX_DRAWER_WIDTH, Math.max(MIN_DRAWER_WIDTH, raw));
    } catch {
        return DEFAULT_DRAWER_WIDTH;
    }
}

function toggle<T>(list: ReadonlyArray<T>, item: T): T[] {
    return list.includes(item) ? list.filter((x) => x !== item) : [...list, item];
}

interface QueueProps {
    refreshToken: number;
}

export function Queue({ refreshToken }: QueueProps) {
    const { applicationId } = useParams();
    const hasDetail = Boolean(applicationId);

    const { applications, error, reload, replace, remove } = useApplications(refreshToken);
    const [runs, setRuns] = useState<SearchRun[]>([]);
    const [search, setSearch] = useState('');
    const [prefs, setPrefs] = useState<QueuePrefs>(() => loadQueuePrefs());
    const [filterSheetOpen, setFilterSheetOpen] = useState(false);
    const [drawerWidth, setDrawerWidth] = useState<number>(() => loadStoredDrawerWidth());
    const [resizingDrawer, setResizingDrawer] = useState(false);
    const drawerRef = useRef<HTMLDivElement>(null);
    const dragOriginXRef = useRef(0);

    // His quick filters are remembered: reopening the dashboard shows what he last picked.
    useEffect(() => {
        saveQueuePrefs(prefs);
    }, [prefs]);

    useEffect(() => {
        dashboardApi.listRuns().then(setRuns).catch(() => {});
    }, [refreshToken]);

    function startDrawerResize(e: ReactMouseEvent) {
        e.preventDefault();
        dragOriginXRef.current = drawerRef.current?.getBoundingClientRect().left ?? 0;
        setResizingDrawer(true);
    }

    useEffect(() => {
        if (!resizingDrawer) return;
        document.body.style.userSelect = 'none';
        document.body.style.cursor = 'col-resize';
        function handleMouseMove(e: MouseEvent) {
            const next = e.clientX - dragOriginXRef.current;
            setDrawerWidth(Math.min(MAX_DRAWER_WIDTH, Math.max(MIN_DRAWER_WIDTH, next)));
        }
        function handleMouseUp() {
            setResizingDrawer(false);
        }
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => {
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingDrawer]);

    useEffect(() => {
        try {
            localStorage.setItem(DRAWER_WIDTH_STORAGE_KEY, String(drawerWidth));
        } catch {
            // localStorage unavailable -- width just won't persist.
        }
    }, [drawerWidth]);

    const all = applications ?? NO_APPLICATIONS;

    const lanes = useMemo(
        () => [...new Set([...all.map((a) => a.group).filter((g): g is string => Boolean(g)), ...prefs.lanes])].sort(),
        [all, prefs.lanes],
    );
    const sources = useMemo(
        () => [...new Set(all.map((a) => a.source).filter((s): s is string => Boolean(s)))].sort(),
        [all],
    );

    const filter: QueueFilter = useMemo(
        () => ({ buckets: prefs.buckets, lanes: prefs.lanes, source: prefs.source, run: prefs.run, search }),
        [prefs, search],
    );

    const filtered = useMemo(() => sortApplications(filterApplications(all, filter), prefs.sort), [all, filter, prefs.sort]);
    const counts = useMemo(() => bucketCounts(all, filter), [all, filter]);
    const laneTotals = useMemo(() => laneCounts(all, filter), [all, filter]);

    const bucketGroups: FilterMenuGroup[] = useMemo(
        () =>
            BUCKET_GROUPS.map((group) => ({
                id: group.id,
                heading: group.label,
                options: BUCKETS.filter((b) => b.group === group.id).map((b) => ({
                    id: b.id,
                    label: b.label,
                    hint: b.hint,
                    color: b.color,
                    count: counts[b.id],
                })),
            })),
        [counts],
    );

    const laneGroups: FilterMenuGroup[] = useMemo(
        () => [{ id: 'lanes', options: lanes.map((lane) => ({ id: lane, label: laneLabel(lane), count: laneTotals[lane] ?? 0 })) }],
        [lanes, laneTotals],
    );

    const groupedSections = useMemo(() => {
        const buckets = new Map<string, JobApplication[]>();
        for (const app of filtered) {
            const key = freshnessGroup(app.posted_date);
            if (!buckets.has(key)) buckets.set(key, []);
            buckets.get(key)!.push(app);
        }
        return FRESHNESS_ORDER.filter((key) => buckets.has(key)).map((key) => ({ key, items: buckets.get(key)! }));
    }, [filtered]);

    const sheetFilters: Filters = { source: prefs.source, run: prefs.run, sort: prefs.sort };
    const activeChips: Array<{ key: keyof Filters; label: string }> = [
        ...(prefs.source ? [{ key: 'source' as const, label: prefs.source }] : []),
        ...(prefs.run ? [{ key: 'run' as const, label: `Run ${prefs.run}` }] : []),
        ...(prefs.sort !== DEFAULT_SORT
            ? [{ key: 'sort' as const, label: SORT_OPTIONS.find((o) => o.value === prefs.sort)?.label ?? prefs.sort }]
            : []),
    ];

    function applySheet(next: Filters) {
        setPrefs((p) => ({ ...p, source: next.source, run: next.run, sort: next.sort ?? DEFAULT_SORT }));
    }

    function clearChip(key: keyof Filters) {
        setPrefs((p) => ({ ...p, [key]: key === 'sort' ? DEFAULT_SORT : undefined }));
    }

    const onlyBucket = prefs.buckets.length === 1 ? BUCKET_BY_ID[prefs.buckets[0]] : null;
    const reviewCaughtUp = onlyBucket?.id === 'to_review' && !search.trim() && prefs.lanes.length === 0;

    const outletContext: QueueOutletContext = useMemo(
        () => ({ onApplicationChanged: replace, onApplicationRemoved: remove }),
        [replace, remove],
    );

    return (
        <div className="lg:flex lg:h-full">
            <div
                ref={drawerRef}
                className={`${hasDetail ? 'hidden lg:flex' : 'flex'} lg:flex-col flex-col lg:w-[var(--db-drawer-w)] lg:shrink-0 relative`}
                style={{ borderRight: '1px solid var(--db-border)', '--db-drawer-w': `${drawerWidth}px` } as CSSProperties}
            >
                <div
                    onMouseDown={startDrawerResize}
                    className="hidden lg:block absolute top-0 right-0 h-full w-1.5 cursor-col-resize z-30"
                    style={{ background: resizingDrawer ? 'var(--db-accent)' : 'transparent' }}
                />

                <div className="flex flex-col gap-2 px-4 py-3" style={{ borderBottom: '1px solid var(--db-border)' }}>
                    <FilterMenu
                        ariaLabel="Stage filter"
                        emptyLabel="All stages"
                        groups={bucketGroups}
                        selected={prefs.buckets}
                        onToggle={(id) => isBucketId(id) && setPrefs((p) => ({ ...p, buckets: toggle(p.buckets, id) }))}
                        onClear={() => setPrefs((p) => ({ ...p, buckets: [] }))}
                        trailing={applications ? `${filtered.length}` : undefined}
                    />

                    {lanes.length > 0 && (
                        <FilterMenu
                            ariaLabel="Lane filter"
                            emptyLabel="All lanes"
                            groups={laneGroups}
                            selected={prefs.lanes}
                            onToggle={(id) => setPrefs((p) => ({ ...p, lanes: toggle(p.lanes, id) }))}
                            onClear={() => setPrefs((p) => ({ ...p, lanes: [] }))}
                        />
                    )}

                    <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                            <Search
                                size={16}
                                className="absolute left-3 top-1/2 -translate-y-1/2"
                                style={{ color: 'var(--db-muted)' }}
                            />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search title or company"
                                aria-label="Search title or company"
                                className="w-full pl-9 pr-3 py-2 rounded-xl text-sm"
                            />
                        </div>
                        <button
                            onClick={() => setFilterSheetOpen(true)}
                            className="relative shrink-0 p-2.5 rounded-xl"
                            style={{ background: 'var(--db-surface-2)' }}
                            aria-label="Filters"
                        >
                            <SlidersHorizontal size={16} />
                            {activeChips.length > 0 && (
                                <span
                                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center"
                                    style={{ background: 'var(--db-accent)', color: '#0b0e14' }}
                                >
                                    {activeChips.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {activeChips.length > 0 && (
                        <div className="flex gap-2 flex-wrap">
                            {activeChips.map(({ key, label }) => (
                                <span
                                    key={key}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                                    style={{ background: 'var(--db-surface-2)' }}
                                >
                                    {label}
                                    <button onClick={() => clearChip(key)} aria-label={`Remove ${label}`} style={{ minHeight: 0 }}>
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto">
                    {error && applications === null && (
                        <div className="p-4 text-sm flex items-center gap-3" style={{ color: 'var(--db-band-drop)' }}>
                            <span>Could not load applications.</span>
                            <button onClick={() => void reload()} className="underline" style={{ minHeight: 0 }}>
                                Retry
                            </button>
                        </div>
                    )}
                    {!error && applications === null && (
                        <div className="flex flex-col gap-2 p-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="dashboard-skeleton h-16" />
                            ))}
                        </div>
                    )}
                    {applications !== null && filtered.length === 0 && (
                        <div className="p-6 text-sm text-center flex flex-col gap-1" style={{ color: 'var(--db-muted)' }}>
                            {reviewCaughtUp ? (
                                <>
                                    <p style={{ color: 'var(--db-text)' }}>Nothing left to review.</p>
                                    <p>Pick another stage above to browse the rest.</p>
                                </>
                            ) : (
                                <p>Nothing matches these filters.</p>
                            )}
                        </div>
                    )}
                    {groupedSections.map(({ key, items }, i) => (
                        <div key={key} className={i > 0 ? 'mt-6' : undefined}>
                            <FreshnessHeader label={key} />
                            {items.map((app) => (
                                <ApplicationCard
                                    key={app.id}
                                    application={app}
                                    selected={app.id === applicationId}
                                    showBucket={prefs.buckets.length !== 1}
                                />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div className={`${hasDetail ? 'block' : 'hidden lg:flex'} flex-1 lg:items-center lg:justify-center lg:overflow-y-auto`}>
                {hasDetail ? (
                    <Outlet context={outletContext} />
                ) : (
                    <p style={{ color: 'var(--db-muted)' }}>Select a role to see details.</p>
                )}
            </div>

            {filterSheetOpen && (
                <FilterSheet
                    filters={sheetFilters}
                    sources={sources}
                    runs={runs}
                    onApply={applySheet}
                    onClose={() => setFilterSheetOpen(false)}
                />
            )}
        </div>
    );
}
