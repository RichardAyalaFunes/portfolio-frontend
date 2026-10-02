import { useEffect, useState } from 'react';
import { dashboardApi, type MetricsResponse } from '../../api/dashboardApi';
import { StatTile } from './StatTile';
import { FunnelBar } from './FunnelBar';
import { appliedCount, toReviewCount } from './metricsModel';

const SCOPES = [
    { value: 'all', label: 'All time' },
    { value: 'latest', label: 'Latest run' },
    { value: 'week', label: 'Last 7 days' },
];

export function Metrics() {
    const [scope, setScope] = useState('all');
    const [metrics, setMetrics] = useState<MetricsResponse | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        setMetrics(null);
        setError(false);
        dashboardApi.getMetrics(scope).then(setMetrics).catch(() => setError(true));
    }, [scope]);

    return (
        <div className="p-4 lg:p-8 pb-28 lg:pb-8 max-w-3xl mx-auto">
            <div className="flex gap-2 mb-5">
                {SCOPES.map((s) => (
                    <button
                        key={s.value}
                        onClick={() => setScope(s.value)}
                        className="px-3 py-1.5 rounded-full text-sm"
                        style={{
                            background: scope === s.value ? 'var(--db-accent)' : 'var(--db-surface-2)',
                            color: scope === s.value ? '#0b0e14' : 'var(--db-text)',
                        }}
                    >
                        {s.label}
                    </button>
                ))}
            </div>

            {error && <p style={{ color: 'var(--db-band-drop)' }}>Could not load metrics.</p>}

            {!error && !metrics && (
                <div className="grid grid-cols-2 gap-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="dashboard-skeleton h-20" />
                    ))}
                </div>
            )}

            {metrics && (
                <div className="flex flex-col gap-6">
                    <div className="grid grid-cols-2 gap-3">
                        <StatTile label="Total tracked" value={metrics.total} />
                        <StatTile label="Approved" value={metrics.status_counts['Approved'] ?? 0} color="var(--db-band-good)" />
                        <StatTile label="To review" value={toReviewCount(metrics)} />
                        <StatTile label="Applied" value={appliedCount(metrics.stage_counts)} color="var(--db-accent)" />
                    </div>

                    <div>
                        <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--db-muted)' }}>
                            Funnel by group
                        </h2>
                        <div className="flex flex-col gap-4">
                            {Object.entries(metrics.funnel_by_group).map(([group, counts]) => (
                                <FunnelBar key={group} group={group} counts={counts} />
                            ))}
                        </div>
                    </div>

                    {Object.keys(metrics.drop_reasons).length > 0 && (
                        <div>
                            <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--db-muted)' }}>
                                Drop reasons
                            </h2>
                            <div className="flex flex-col gap-2">
                                {Object.entries(metrics.drop_reasons)
                                    .sort(([, a], [, b]) => b - a)
                                    .map(([reason, count]) => (
                                        <div key={reason} className="flex justify-between text-sm">
                                            <span style={{ color: 'var(--db-muted)' }}>{reason}</span>
                                            <span>{count}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    <div>
                        <h2 className="text-sm font-medium mb-3" style={{ color: 'var(--db-muted)' }}>
                            Per-portal yield
                        </h2>
                        <div className="flex gap-2 flex-wrap">
                            {Object.entries(metrics.portal_yield).map(([portal, { total, approved }]) => (
                                <span key={portal} className="px-3 py-1.5 rounded-full text-xs" style={{ background: 'var(--db-surface-2)' }}>
                                    {portal}: {approved}/{total}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
