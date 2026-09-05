export function FreshnessHeader({ label }: { label: string }) {
    return (
        <div
            className="sticky top-0 z-10 px-4 py-2 text-xs font-semibold uppercase tracking-wide backdrop-blur"
            style={{ background: 'color-mix(in srgb, var(--db-bg) 85%, transparent)', color: 'var(--db-muted)' }}
        >
            {label}
        </div>
    );
}
