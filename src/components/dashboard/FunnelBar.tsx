import { statusColorVar } from './dashboardTokens';

export function FunnelBar({ group, counts }: { group: string; counts: Record<string, number> }) {
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    return (
        <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-sm">
                <span>{group}</span>
                <span style={{ color: 'var(--db-muted)' }}>{total}</span>
            </div>
            <div className="flex h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--db-surface-2)' }}>
                {Object.entries(counts).map(([status, count]) => (
                    <div
                        key={status}
                        title={`${status}: ${count}`}
                        style={{ width: `${(count / total) * 100}%`, background: statusColorVar(status) }}
                    />
                ))}
            </div>
        </div>
    );
}
