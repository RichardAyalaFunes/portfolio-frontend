/** Shared color/label helpers for the dashboard's score bands and posting freshness. */

const DAY_MS = 86_400_000;

export function bandColorVar(band: string | null): string {
    switch (band) {
        case 'excellent': return 'var(--db-band-excellent)';
        case 'good': return 'var(--db-band-good)';
        case 'below': return 'var(--db-band-below)';
        case 'flagged': return 'var(--db-band-flag)';
        case 'dropped': return 'var(--db-band-drop)';
        default: return 'var(--db-muted)';
    }
}

/**
 * The score pill color, read from the number itself (the stored band can be missing or stale):
 * 70 and under muted, 71-79 green, 80-87 yellow, 88 and up red. A YC company is always red:
 * high priority, so it must catch the eye.
 */
export function scoreColorVar(score: number | null, source?: string | null): string {
    if (source === 'ycombinator') return 'var(--db-band-drop)';
    if (score === null) return 'var(--db-muted)';
    if (score > 87) return 'var(--db-band-drop)';
    if (score >= 80) return 'var(--db-band-excellent)';
    if (score > 70) return 'var(--db-band-good)';
    return 'var(--db-band-below)';
}

function daysAgo(dateStr: string | null): number | null {
    if (!dateStr) return null;
    const parsed = new Date(dateStr).getTime();
    if (Number.isNaN(parsed)) return null;
    return Math.max(0, Math.floor((Date.now() - parsed) / DAY_MS));
}

export function freshnessColorVar(postedDate: string | null): string {
    const days = daysAgo(postedDate);
    if (days === null) return 'var(--db-fresh-stale)';
    if (days <= 2) return 'var(--db-fresh-hot)';
    if (days <= 7) return 'var(--db-fresh-warm)';
    return 'var(--db-fresh-stale)';
}

export function freshnessLabel(postedDate: string | null): string {
    const days = daysAgo(postedDate);
    if (days === null) return 'Unknown';
    if (days === 0) return 'Today';
    if (days === 1) return '1 day ago';
    if (days <= 7) return `${days} days ago`;
    if (days <= 30) return `${Math.floor(days / 7)}w ago`;
    return `${Math.floor(days / 30)}mo ago`;
}

/** Compact age for dense rows: "today", "3d", "2w", "3mo", or "?" when undated. */
export function freshnessShort(postedDate: string | null): string {
    const days = daysAgo(postedDate);
    if (days === null) return '?';
    if (days === 0) return 'today';
    if (days <= 13) return `${days}d`;
    if (days <= 60) return `${Math.floor(days / 7)}w`;
    return `${Math.floor(days / 30)}mo`;
}

/** True only when the date is the platform's own timestamp. Everything else (a relative
 * phrase like "2 days ago", or the day we found the role) is an estimate. */
export function isRealPostedDate(source: string | null | undefined): boolean {
    return source === 'linkedin_listedAt';
}

/** Compact age, prefixed with "~" when the date is only an estimate. */
export function freshnessShortFor(postedDate: string | null, source: string | null | undefined): string {
    const short = freshnessShort(postedDate);
    return postedDate && !isRealPostedDate(source) ? `~${short}` : short;
}

export function freshnessHint(postedDate: string | null, source: string | null | undefined): string {
    if (!postedDate) return 'No posting date known';
    return isRealPostedDate(source)
        ? `Posted ${postedDate}`
        : `Estimated ${postedDate}: the real posting date was not available`;
}

export function freshnessGroup(postedDate: string | null): string {
    const days = daysAgo(postedDate);
    if (days === null) return 'Undated';
    if (days <= 2) return 'Last 2 days';
    if (days <= 7) return '3 to 7 days';
    if (days <= 30) return '8 to 30 days';
    return 'Older';
}

export function statusColorVar(status: string): string {
    switch (status) {
        case 'Approved': return 'var(--db-band-good)';
        case 'Rejected': return 'var(--db-band-drop)';
        case 'Flagged': return 'var(--db-band-flag)';
        case 'Dropped': return 'var(--db-muted)';
        case 'Cold': return 'var(--db-fresh-stale)';
        default: return 'var(--db-accent)';
    }
}
