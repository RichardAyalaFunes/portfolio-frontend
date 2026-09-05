export function StatTile({ label, value, color }: { label: string; value: number | string; color?: string }) {
    return (
        <div className="rounded-2xl p-4" style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)' }}>
            <p className="text-2xl font-semibold" style={{ color: color ?? 'var(--db-text)' }}>
                {value}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--db-muted)' }}>
                {label}
            </p>
        </div>
    );
}
