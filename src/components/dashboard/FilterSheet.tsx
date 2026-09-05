import type { SearchRun } from '../../api/dashboardApi';

export interface Filters {
    group?: string;
    source?: string;
    live?: string;
    run?: string;
    sort?: string;
}

interface FilterSheetProps {
    filters: Filters;
    groups: string[];
    sources: string[];
    runs: SearchRun[];
    onApply: (filters: Filters) => void;
    onClose: () => void;
}

const SORT_OPTIONS = [
    { value: 'posted_date.desc', label: 'Newest first' },
    { value: 'posted_date.asc', label: 'Oldest first' },
    { value: 'score.desc', label: 'Highest score' },
];

export function FilterSheet({ filters, groups, sources, runs, onApply, onClose }: FilterSheetProps) {
    function update(patch: Partial<Filters>) {
        onApply({ ...filters, ...patch });
    }

    return (
        <div className="fixed inset-0 z-30 flex items-end lg:items-center lg:justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose} />
            <div
                className="dashboard-sheet-enter relative w-full lg:max-w-md lg:rounded-2xl rounded-t-2xl p-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto"
                style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)' }}
            >
                <div className="flex items-center justify-between">
                    <h2 className="font-medium">Filters</h2>
                    <button onClick={onClose} style={{ color: 'var(--db-muted)' }}>
                        Done
                    </button>
                </div>

                <FilterSelect
                    label="Group"
                    value={filters.group}
                    options={groups}
                    onChange={(v) => update({ group: v })}
                />
                <FilterSelect
                    label="Source"
                    value={filters.source}
                    options={sources}
                    onChange={(v) => update({ source: v })}
                />
                <FilterSelect
                    label="Run"
                    value={filters.run}
                    options={runs.map((r) => r.run_date)}
                    onChange={(v) => update({ run: v })}
                />

                <div className="flex flex-col gap-2">
                    <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--db-muted)' }}>
                        Sort
                    </span>
                    <div className="flex flex-col gap-2">
                        {SORT_OPTIONS.map((opt) => (
                            <button
                                key={opt.value}
                                onClick={() => update({ sort: opt.value })}
                                className="text-left px-3 py-2.5 rounded-xl"
                                style={{
                                    background: filters.sort === opt.value ? 'var(--db-accent)' : 'var(--db-surface-2)',
                                    color: filters.sort === opt.value ? '#0b0e14' : 'var(--db-text)',
                                }}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <button
                    onClick={() => onApply({})}
                    className="text-sm text-center py-2"
                    style={{ color: 'var(--db-muted)' }}
                >
                    Clear all filters
                </button>
            </div>
        </div>
    );
}

function FilterSelect({
    label,
    value,
    options,
    onChange,
}: {
    label: string;
    value: string | undefined;
    options: string[];
    onChange: (value: string | undefined) => void;
}) {
    return (
        <label className="flex flex-col gap-2">
            <span className="text-xs uppercase tracking-wide" style={{ color: 'var(--db-muted)' }}>
                {label}
            </span>
            <select
                value={value ?? ''}
                onChange={(e) => onChange(e.target.value || undefined)}
                className="px-3 py-2.5 rounded-xl"
            >
                <option value="">Any</option>
                {options.map((opt) => (
                    <option key={opt} value={opt}>
                        {opt}
                    </option>
                ))}
            </select>
        </label>
    );
}
