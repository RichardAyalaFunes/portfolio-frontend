import type { SearchRow } from '../../api/dashboardApi';

export type SortKey = 'line' | 'portal' | 'technique' | 'executions' | 'surfaced' | 'new' | 'passed' | 'approved' | 'applied' | 'pass_rate' | 'last_run';

export const TECHNIQUE_LABELS: Record<string, string> = {
    search_string: 'Search string',
    section: 'Section',
    board: 'Board',
    alert: 'Alert',
    other: 'Other',
};

export function sortSearches(rows: SearchRow[], key: SortKey, desc: boolean): SearchRow[] {
    const value = (r: SearchRow): number | string => {
        const v = r[key];
        if (v === null || v === undefined) return desc ? -Infinity : Infinity;
        return v;
    };
    return [...rows].sort((a, b) => {
        const x = value(a), y = value(b);
        const cmp = typeof x === 'string' && typeof y === 'string' ? x.localeCompare(y) : (x as number) - (y as number);
        return desc ? -cmp : cmp;
    });
}

export function filterSearches(rows: SearchRow[], technique: string, portal: string): SearchRow[] {
    return rows.filter((r) => (technique === 'all' || r.technique === technique) && (portal === 'all' || r.portal === portal));
}

export function pct(rate: number | null): string {
    return rate === null ? '—' : `${Math.round(rate * 100)}%`;
}

/** Pass rate for a group of counters (passed over new). */
export function groupRate(c: { new: number; passed: number }): number | null {
    return c.new ? c.passed / c.new : null;
}
