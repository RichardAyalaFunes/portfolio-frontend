import { useEffect, useMemo, useRef, useState } from 'react';
import { Outlet, useParams } from 'react-router-dom';
import { Search, SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { dashboardApi, type JobApplication, type SearchRun } from '../../api/dashboardApi';
import { ApplicationCard } from './ApplicationCard';
import { FreshnessHeader } from './FreshnessHeader';
import { FilterSheet, type Filters } from './FilterSheet';
import { freshnessGroup } from './dashboardTokens';

const FRESHNESS_ORDER = ['Last 2 days', '3 to 7 days', '8 to 30 days', 'Older', 'Undated'];

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
    const [activePresets, setActivePresets] = useState<string[]>(['To apply']);
    const [presetMenuOpen, setPresetMenuOpen] = useState(false);
    const [filterSheetOpen, setFilterSheetOpen] = useState(false);
    const presetMenuRef = useRef<HTMLDivElement>(null);

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

    function togglePreset(label: string) {
        setActivePresets((prev) => (prev.includes(label) ? prev.filter((p) => p !== label) : [...prev, label]));
    }

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

        if (filters.group) list = list.filter((a) => a.group === filters.group);
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
    }, [applications, search, filters, activePresets]);

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
            <div className={`${hasDetail ? 'hidden lg:flex' : 'flex'} lg:flex-col flex-col lg:w-[400px] lg:shrink-0`} style={{ borderRight: '1px solid var(--db-border)' }}>
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
                    groups={groups}
                    sources={sources}
                    runs={runs}
                    onApply={setFilters}
                    onClose={() => setFilterSheetOpen(false)}
                />
            )}
        </div>
    );
}
