/** Marks a role Richard rejected because it repeats another one. */
export function DuplicateChip() {
    return (
        <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] whitespace-nowrap"
            style={{ color: 'var(--db-muted)', border: '1px solid var(--db-border)' }}
            title="Rejected because it repeats another role"
        >
            Duplicate
        </span>
    );
}
