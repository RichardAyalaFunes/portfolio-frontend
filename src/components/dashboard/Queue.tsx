import { useEffect, useMemo, useRef, useState, type CSSProperties, type MouseEvent as ReactMouseEvent } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { Search, SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { dashboardApi, type JobApplication, type SearchRun } from '../../api/dashboardApi';
import { ApplicationCard } from './ApplicationCard';
import { FreshnessHeader } from './FreshnessHeader';
import { FilterSheet, type Filters } from './FilterSheet';
import { freshnessGroup } from './dashboardTokens';

const FRESHNESS_ORDER = ['Last 2 days', '3 to 7 days', '8 to 30 days', 'Older', 'Undated'];

const PRESETS_STORAGE_KEY = 'dashboard_active_presets';
const DRAWER_WIDTH_STORAGE_KEY = 'dashboard_drawer_width';
const DEFAULT_DRAWER_WIDTH = 400;
const MIN_DRAWER_WIDTH = 280;
const MAX_DRAWER_WIDTH = 640;

interface SummaryChip {
    label: string;
    match: (app: JobApplication) => boolean;
}

const SUMMARY_CHIPS: SummaryChip[] = [
    { label: 'To apply', match: (a) => a.status === 'Approved' && a.application_stage === 'Not applied' },
    { label: 'Applied', match: (a) => a.application_stage === 'Applied' },
    { label: 'Interviewing', match: (a) => a.application_stage === 'Interviewing' },
    { label: 'Review queue', match: (a) => a.status === 'To validate' || a.status === 'Flagged' },
    { label: 'Passing', match: (a) => ['Rejected', 'Cold', 'Dropped'].includes(a.status) },
];

function loadStoredPresets(): string[] {
    try {
        const raw = localStorage.getItem(PRESETS_STORAGE_KEY);
        const parsed = raw ? JSON.parse(raw) : null;
        return Array.isArray(parsed) ? parsed : ['To apply'];
    } catch {
        return ['To apply'];
    }
}

function loadStoredDrawerWidth(): number {
    try {
        const raw = Number(localStorage.getItem(DRAWER_WIDTH_STORAGE_KEY));
        if (!Number.isFinite(raw)) return DEFAULT_DRAWER_WIDTH;
        return Math.min(MAX_DRAWER_WIDTH, Math.max(MIN_DRAWER_WIDTH, raw));
    } catch {
        return DEFAULT_DRAWER_WIDTH;
    }
}

function formatGroupLabel(group: string): string {
    return group
        .split('_')
        .map((word) => (word.toLowerCase() === 'ai' ? 'AI' : word.charAt(0).toUpperCase() + word.slice(1)))
        .join(' ');
}

interface QueueProps {
    refreshToken: number;
}

export function Queue({ refreshToken }: QueueProps) {
    const { applicationId } = useParams();
    const hasDetail = Boolean(applicationId);

    const [applications, setApplications] = useState<JobApplication[] | null>(null);
    const [runs, setRuns] = useState<SearchRun[]>([]);
    const [error, setError] = useState(false);
    const [search, setSearch] = useState('');
    const [filters, setFilters] = useState<Filters>({ sort: 'posted_date.desc' });
    const [activePresets, setActivePresets] = useState<string[]>(() => loadStoredPresets());
    const [presetMenuOpen, setPresetMenuOpen] = useState(false);
    const [activeGroups, setActiveGroups] = useState<string[]>([]);
    const [groupMenuOpen, setGroupMenuOpen] = useState(false);
    const [filterSheetOpen, setFilterSheetOpen] = useState(false);
    const [drawerWidth, setDrawerWidth] = useState<number>(() => loadStoredDrawerWidth());
    const [resizingDrawer, setResizingDrawer] = useState(false);
    const presetMenuRef = useRef<HTMLDivElement>(null);
    const groupMenuRef = useRef<HTMLDivElement>(null);
    const drawerRef = useRef<HTMLDivElement>(null);
    const dragOriginXRef = useRef(0);

    useEffect(() => {
        if (!presetMenuOpen) return;
        function handleOutsideClick(e: MouseEvent) {
            if (presetMenuRef.current && !presetMenuRef.current.contains(e.target as Node)) {
                setPresetMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [presetMenuOpen]);

    useEffect(() => {
        if (!groupMenuOpen) return;
        function handleOutsideClick(e: MouseEvent) {
            if (groupMenuRef.current && !groupMenuRef.current.contains(e.target as Node)) {
                setGroupMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [groupMenuOpen]);

    function togglePreset(label: string) {
        setActivePresets((prev) => (prev.includes(label) ? prev.filter((p) => p !== label) : [...prev, label]));
    }

    useEffect(() => {
        try {
            localStorage.setItem(PRESETS_STORAGE_KEY, JSON.stringify(activePresets));
        } catch {
            // localStorage unavailable (private browsing, quota) -- selection just won't persist.
        }
    }, [activePresets]);

    function toggleGroup(group: string) {
        setActiveGroups((prev) => (prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group]));
    }

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

    useEffect(() => {
        setError(false);
        dashboardApi.listApplications().then(setApplications).catch(() => setError(true));
        dashboardApi.listRuns().then(setRuns).catch(() => {});
    }, [refreshToken]);

    const groups = useMemo(
        () => [...new Set((applications ?? []).map((a) => a.group).filter((g): g is string => Boolean(g)))].sort(),
        [applications],
    );
    const sources = useMemo(
        () => [...new Set((applications ?? []).map((a) => a.source).filter((s): s is string => Boolean(s)))].sort(),
        [applications],
    );

    const filtered = useMemo(() => {
        if (!applications) return [];
        let list = applications;

        if (activePresets.length > 0) {
            const activeMatchers = SUMMARY_CHIPS.filter((c) => activePresets.includes(c.label));
            list = list.filter((a) => activeMatchers.some((c) => c.match(a)));
        }

        if (activeGroups.length > 0) list = list.filter((a) => a.group && activeGroups.includes(a.group));
        if (filters.source) list = list.filter((a) => a.source === filters.source);
        if (filters.run) list = list.filter((a) => a.run_date === filters.run);

        if (search.trim()) {
            const q = search.trim().toLowerCase();
            list = list.filter((a) => a.title.toLowerCase().includes(q) || a.company.toLowerCase().includes(q));
        }

        const sorted = [...list];
        if (filters.sort === 'score.desc') {
            sorted.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
        } else {
            sorted.sort((a, b) => {
                const da = a.posted_date ? new Date(a.posted_date).getTime() : 0;
                const db = b.posted_date ? new Date(b.posted_date).getTime() : 0;
                return filters.sort === 'posted_date.asc' ? da - db : db - da;
            });
        }
        return sorted;
    }, [applications, search, filters, activePresets, activeGroups]);

    const groupedSections = useMemo(() => {
        const buckets = new Map<string, JobApplication[]>();
        for (const app of filtered) {
            const key = freshnessGroup(app.posted_date);
            if (!buckets.has(key)) buckets.set(key, []);
            buckets.get(key)!.push(app);
        }
        return FRESHNESS_ORDER.filter((key) => buckets.has(key)).map((key) => ({ key, items: buckets.get(key)! }));
    }, [filtered]);

    const activeFilterCount = Object.values(filters).filter((v) => v && v !== 'posted_date.desc').length;

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
                <div className="relative px-4 py-3" style={{ borderBottom: '1px solid var(--db-border)' }} ref={presetMenuRef}>
                    <button
                        onClick={() => setPresetMenuOpen((v) => !v)}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs"
                        style={{ background: 'var(--db-surface-2)' }}
                    >
                        <span className="truncate text-left">
                            {activePresets.length === 0 ? 'All stages' : activePresets.join(', ')}
                        </span>
                        <ChevronDown
                            size={14}
                            className="shrink-0"
                            style={{ transform: presetMenuOpen ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }}
                        />
                    </button>

                    {presetMenuOpen && (
                        <div
                            className="absolute left-4 right-4 top-full mt-1 z-20 rounded-xl overflow-hidden flex flex-col"
                            style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)' }}
                        >
                            {SUMMARY_CHIPS.map((chip, i) => {
                                const count = (applications ?? []).filter(chip.match).length;
                                const checked = activePresets.includes(chip.label);
                                return (
                                    <label
                                        key={chip.label}
                                        className="flex items-center gap-2.5 px-3 py-2.5 text-sm cursor-pointer"
                                        style={i < SUMMARY_CHIPS.length - 1 ? { borderBottom: '1px solid var(--db-border)' } : undefined}
                                    >
                                        <input type="checkbox" checked={checked} onChange={() => togglePreset(chip.label)} />
                                        <span className="flex-1">{chip.label}</span>
                                        <span className="text-xs" style={{ color: 'var(--db-muted)' }}>
                                            {count}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2 px-4 py-3">
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
                        {activeFilterCount > 0 && (
                            <span
                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[10px] flex items-center justify-center"
                                style={{ background: 'var(--db-accent)', color: '#0b0e14' }}
                            >
                                {activeFilterCount}
                            </span>
                        )}
                    </button>
                </div>

                {activeFilterCount > 0 && (
                    <div className="flex gap-2 px-4 pb-3 flex-wrap">
                        {Object.entries(filters).map(([key, value]) =>
                            value && value !== 'posted_date.desc' ? (
                                <span
                                    key={key}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs"
                                    style={{ background: 'var(--db-surface-2)' }}
                                >
                                    {value}
                                    <button onClick={() => setFilters((f) => ({ ...f, [key]: undefined }))}>
                                        <X size={12} />
                                    </button>
                                </span>
                            ) : null,
                        )}
                    </div>
                )}

                {groups.length > 0 && (
                    <div className="relative px-4 py-3" style={{ borderBottom: '1px solid var(--db-border)' }} ref={groupMenuRef}>
                        <button
                            onClick={() => setGroupMenuOpen((v) => !v)}
                            className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs"
                            style={{ background: 'var(--db-surface-2)' }}
                        >
                            <span className="truncate text-left">
                                {activeGroups.length === 0 ? 'All roles' : activeGroups.map(formatGroupLabel).join(', ')}
                            </span>
                            <ChevronDown
                                size={14}
                                className="shrink-0"
                                style={{ transform: groupMenuOpen ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }}
                            />
                        </button>

                        {groupMenuOpen && (
                            <div
                                className="absolute left-4 right-4 top-full mt-1 z-20 rounded-xl overflow-hidden flex flex-col"
                                style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)' }}
                            >
                                {groups.map((g, i) => {
                                    const count = (applications ?? []).filter((a) => a.group === g).length;
                                    const checked = activeGroups.includes(g);
                                    return (
                                        <label
                                            key={g}
                                            className="flex items-center gap-2.5 px-3 py-2.5 text-sm cursor-pointer"
                                            style={i < groups.length - 1 ? { borderBottom: '1px solid var(--db-border)' } : undefined}
                                        >
                                            <input type="checkbox" checked={checked} onChange={() => toggleGroup(g)} />
                                            <span className="flex-1">{formatGroupLabel(g)}</span>
                                            <span className="text-xs" style={{ color: 'var(--db-muted)' }}>
                                                {count}
                                            </span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                <div className="flex-1 overflow-y-auto">
                    {error && (
                        <p className="p-4 text-sm" style={{ color: 'var(--db-band-drop)' }}>
                            Could not load applications.
                        </p>
                    )}
                    {!error && applications === null && (
                        <div className="flex flex-col gap-2 p-4">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="dashboard-skeleton h-16" />
                            ))}
                        </div>
                    )}
                    {applications !== null && filtered.length === 0 && (
                        <p className="p-4 text-sm text-center" style={{ color: 'var(--db-muted)' }}>
                            Nothing matches these filters.
                        </p>
                    )}
                    {groupedSections.map(({ key, items }, i) => (
                        <div key={key} className={i > 0 ? 'mt-6' : undefined}>
                            <FreshnessHeader label={key} />
                            {items.map((app) => (
                                <ApplicationCard key={app.id} application={app} />
                            ))}
                        </div>
                    ))}
                </div>
            </div>

            <div className={`${hasDetail ? 'block' : 'hidden lg:flex'} flex-1 lg:items-center lg:justify-center lg:overflow-y-auto`}>
                {hasDetail ? (
                    <Outlet />
                ) : (
                    <p style={{ color: 'var(--db-muted)' }}>Select a role to see details.</p>
                )}
            </div>

            {filterSheetOpen && (
                <FilterSheet
                    filters={filters}
                    sources={sources}
                    runs={runs}
                    onApply={setFilters}
                    onClose={() => setFilterSheetOpen(false)}
                />
            )}
        </div>
    );
}
