import { useEffect, useMemo, useState } from 'react';
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { dashboardApi, type SearchCounts, type SearchStatsResponse } from '../../api/dashboardApi';
import { StatTile } from './StatTile';
import { TECHNIQUE_LABELS, filterSearches, groupRate, pct, sortSearches, type SortKey } from './searchesModel';

const RANGES = [
    { value: '', label: 'All time' },
    { value: '30', label: 'Last 30 days' },
    { value: '7', label: 'Last 7 days' },
];

const COLUMNS: Array<{ key: SortKey; label: string; numeric?: boolean }> = [
    { key: 'line', label: 'Search' },
    { key: 'portal', label: 'Portal' },
    { key: 'technique', label: 'Technique' },
    { key: 'executions', label: 'Runs', numeric: true },
    { key: 'surfaced', label: 'Surfaced', numeric: true },
    { key: 'new', label: 'New', numeric: true },
    { key: 'passed', label: 'Passed', numeric: true },
    { key: 'approved', label: 'Approved', numeric: true },
    { key: 'applied', label: 'Applied', numeric: true },
    { key: 'pass_rate', label: 'Pass rate', numeric: true },
    { key: 'last_run', label: 'Last run' },
];

const card = { background: 'var(--db-surface)', border: '1px solid var(--db-border)' };

function sinceDate(days: string): string | undefined {
    if (!days) return undefined;
    const d = new Date();
    d.setDate(d.getDate() - Number(days));
    return d.toISOString().slice(0, 10);
}

function Breakdown({ title, groups, label }: { title: string; groups: Record<string, SearchCounts>; label: (k: string) => string }) {
    const rows = Object.entries(groups).sort((a, b) => b[1].passed - a[1].passed || b[1].new - a[1].new);
    return (
        <div className="rounded-2xl p-4 overflow-x-auto" style={card}>
            <p className="text-sm font-semibold mb-2">{title}</p>
            <table className="w-full text-xs">
                <thead style={{ color: 'var(--db-muted)' }}>
                    <tr>
                        <th className="text-left font-normal py-1"></th>
                        <th className="text-right font-normal">Runs</th>
                        <th className="text-right font-normal">Surfaced</th>
                        <th className="text-right font-normal">New</th>
                        <th className="text-right font-normal">Passed</th>
                        <th className="text-right font-normal">Rate</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(([k, c]) => (
                        <tr key={k} style={{ borderTop: '1px solid var(--db-border)' }}>
                            <td className="py-1.5">{label(k)}</td>
                            <td className="text-right">{c.executions}</td>
                            <td className="text-right">{c.surfaced}</td>
                            <td className="text-right">{c.new}</td>
                            <td className="text-right">{c.passed}</td>
                            <td className="text-right">{pct(groupRate(c))}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export function Searches() {
    const [range, setRange] = useState('');
    const [stats, setStats] = useState<SearchStatsResponse | null>(null);
    const [error, setError] = useState(false);
    const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: 'passed', desc: true });
    const [technique, setTechnique] = useState('all');
    const [portal, setPortal] = useState('all');

    useEffect(() => {
        setStats(null);
        setError(false);
        dashboardApi.getSearchStats(sinceDate(range)).then(setStats).catch(() => setError(true));
    }, [range]);

    const rows = useMemo(
        () => (stats ? sortSearches(filterSearches(stats.searches, technique, portal), sort.key, sort.desc) : []),
        [stats, technique, portal, sort],
    );

    const approved = stats ? stats.searches.reduce((n, r) => n + r.approved, 0) : 0;

    return (
        <div className="p-4 lg:p-8 pb-28 lg:pb-8 max-w-6xl mx-auto">
            <div className="flex gap-2 mb-5 flex-wrap">
                {RANGES.map((r) => (
                    <button
                        key={r.value}
                        onClick={() => setRange(r.value)}
                        className="px-3 py-1.5 rounded-full text-sm"
                        style={{
                            background: range === r.value ? 'var(--db-accent)' : 'var(--db-surface-2)',
                            color: range === r.value ? '#0b0e14' : 'var(--db-text)',
                        }}
                    >
                        {r.label}
                    </button>
                ))}
            </div>

            {error && <p style={{ color: 'var(--db-muted)' }}>Could not load search stats.</p>}
            {!stats && !error && <p style={{ color: 'var(--db-muted)' }}>Loading…</p>}

            {stats && (
                <>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
                        <StatTile label="Runs" value={stats.totals.runs} />
                        <StatTile label="Searches executed" value={stats.totals.executions} />
                        <StatTile label="Surfaced" value={stats.totals.surfaced} />
                        <StatTile label="New after dedupe" value={stats.totals.new} />
                        <StatTile label="Passed" value={stats.totals.passed} color="var(--db-accent)" />
                        <StatTile label="Approved by you" value={approved} />
                    </div>

                    {stats.timeline.length > 1 && (
                        <div className="rounded-2xl p-4 mb-5" style={card}>
                            <p className="text-sm font-semibold mb-2">Per run</p>
                            <div style={{ width: '100%', height: 240 }}>
                                <ResponsiveContainer>
                                    <LineChart data={stats.timeline}>
                                        <CartesianGrid stroke="var(--db-border)" strokeDasharray="3 3" />
                                        <XAxis dataKey="run_date" tick={{ fontSize: 11, fill: 'var(--db-muted)' }} />
                                        <YAxis tick={{ fontSize: 11, fill: 'var(--db-muted)' }} allowDecimals={false} />
                                        <Tooltip contentStyle={{ background: 'var(--db-surface-2)', border: '1px solid var(--db-border)' }} />
                                        <Legend wrapperStyle={{ fontSize: 12 }} />
                                        <Line type="monotone" dataKey="surfaced" name="Surfaced" stroke="#7aa2f7" dot={false} />
                                        <Line type="monotone" dataKey="new" name="New" stroke="#9ece6a" dot={false} />
                                        <Line type="monotone" dataKey="passed" name="Passed" stroke="#e0af68" dot={false} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-3 mb-5">
                        <Breakdown title="By technique" groups={stats.by_technique} label={(k) => TECHNIQUE_LABELS[k] ?? k} />
                        <Breakdown title="By portal" groups={stats.by_portal} label={(k) => k} />
                    </div>

                    <div className="rounded-2xl p-4" style={card}>
                        <div className="flex gap-2 mb-3 flex-wrap items-center">
                            <p className="text-sm font-semibold mr-auto">Every search ({rows.length})</p>
                            <select value={technique} onChange={(e) => setTechnique(e.target.value)} className="text-xs rounded px-2 py-1" style={{ background: 'var(--db-surface-2)', color: 'var(--db-text)' }}>
                                <option value="all">All techniques</option>
                                {Object.keys(stats.by_technique).map((k) => <option key={k} value={k}>{TECHNIQUE_LABELS[k] ?? k}</option>)}
                            </select>
                            <select value={portal} onChange={(e) => setPortal(e.target.value)} className="text-xs rounded px-2 py-1" style={{ background: 'var(--db-surface-2)', color: 'var(--db-text)' }}>
                                <option value="all">All portals</option>
                                {Object.keys(stats.by_portal).map((k) => <option key={k} value={k}>{k}</option>)}
                            </select>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead style={{ color: 'var(--db-muted)' }}>
                                    <tr>
                                        {COLUMNS.map((c) => (
                                            <th
                                                key={c.key}
                                                onClick={() => setSort((s) => ({ key: c.key, desc: s.key === c.key ? !s.desc : !!c.numeric }))}
                                                className={`font-normal py-1 px-1 cursor-pointer whitespace-nowrap ${c.numeric ? 'text-right' : 'text-left'}`}
                                            >
                                                {c.label}{sort.key === c.key ? (sort.desc ? ' ↓' : ' ↑') : ''}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((r) => (
                                        <tr key={`${r.portal}|${r.line}`} style={{ borderTop: '1px solid var(--db-border)' }}>
                                            <td className="py-1.5 px-1 max-w-[22rem] break-words">{r.line}</td>
                                            <td className="px-1">{r.portal}</td>
                                            <td className="px-1 whitespace-nowrap">{TECHNIQUE_LABELS[r.technique] ?? r.technique}</td>
                                            <td className="px-1 text-right">{r.executions}</td>
                                            <td className="px-1 text-right">{r.surfaced}</td>
                                            <td className="px-1 text-right">{r.new}</td>
                                            <td className="px-1 text-right">{r.passed}</td>
                                            <td className="px-1 text-right">{r.approved}</td>
                                            <td className="px-1 text-right">{r.applied}</td>
                                            <td className="px-1 text-right">{pct(r.pass_rate)}</td>
                                            <td className="px-1 whitespace-nowrap">{r.last_run}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
