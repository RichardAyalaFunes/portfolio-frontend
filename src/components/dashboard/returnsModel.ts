/**
 * Roles that came back. The server records every comeback of a role it already held
 * (`extras.returns`, see the backend's domain/applications/returns.py): a new posting
 * of it found 7+ days after the last sighting is a repost, more than 90 days a
 * reopening. This module turns those records into the words and flags the queue and the
 * detail pane show. Pure, so it is tested without a browser.
 */

import type { JobApplication, ReturnEvent } from '../../api/dashboardApi';

/** A role that keeps coming back (an agency re-listing the same ad) stops being news after this many comebacks. */
export const EVERGREEN_AFTER = 3;

export type ReturnTone = 'info' | 'warn';

export interface ReturnBadge {
    /** The chip text, short enough for a card row. */
    label: string;
    tone: ReturnTone;
    /** Longer text for the chip's tooltip. */
    title: string;
}

/** Today as an ISO calendar date; the badge wording is relative to it. */
export function todayIso(): string {
    return new Date().toISOString().slice(0, 10);
}

/** The accent a tone is drawn in: a repost is information, a reopening or an applied role a warning. */
export function toneColor(tone: ReturnTone): string {
    return tone === 'warn' ? 'var(--db-band-flag)' : 'var(--db-accent)';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function returnsOf(application: Pick<JobApplication, 'extras'>): ReturnEvent[] {
    const list = application.extras?.returns;
    return Array.isArray(list) ? list.filter((e) => e && typeof e === 'object') : [];
}

export function latestReturn(application: Pick<JobApplication, 'extras'>): ReturnEvent | null {
    const list = returnsOf(application);
    return list.length ? list[list.length - 1] : null;
}

export function isEvergreen(application: Pick<JobApplication, 'extras'>): boolean {
    return returnsOf(application).length >= EVERGREEN_AFTER;
}

/** "Oct 12" for this year's dates, "Jun 25, 2025" for older ones. ISO dates are read as plain calendar dates. */
export function shortDate(iso: string | null | undefined, today: string): string | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
    if (!match) return null;
    const [, year, month, day] = match;
    const base = `${MONTHS[Number(month) - 1]} ${Number(day)}`;
    return year === today.slice(0, 4) ? base : `${base}, ${year}`;
}

/** Whole days from one ISO date to another, or null if either is not a date. */
export function daysBetween(fromIso: string | null | undefined, toIso: string | null | undefined): number | null {
    const from = /^(\d{4})-(\d{2})-(\d{2})/.exec(fromIso ?? '');
    const to = /^(\d{4})-(\d{2})-(\d{2})/.exec(toIso ?? '');
    if (!from || !to) return null;
    const a = Date.UTC(Number(from[1]), Number(from[2]) - 1, Number(from[3]));
    const b = Date.UTC(Number(to[1]), Number(to[2]) - 1, Number(to[3]));
    return Math.round((b - a) / 86_400_000);
}

/** "5 days", "3 weeks", "4 months", "1 year": the size of a gap, in the unit that reads best. */
export function spanLabel(days: number): string {
    if (days < 14) return `${days} ${days === 1 ? 'day' : 'days'}`;
    if (days < 60) return `${Math.round(days / 7)} weeks`;
    if (days < 365) return `${Math.round(days / 30)} months`;
    const years = Math.round((days / 365) * 10) / 10;
    return `${years} ${years === 1 ? 'year' : 'years'}`;
}

/** Who closed the role, as a short phrase: "you rejected it", "the agent dropped it". */
function priorPhrase(event: ReturnEvent): string {
    const { status, decided_by: by } = event.prior;
    if (status === 'Rejected') return by === 'you' ? 'you rejected it' : 'it was rejected';
    if (status === 'Dropped') return by === 'you' ? 'you dropped it' : 'the agent dropped it';
    if (status === 'Cold') return 'you set it aside';
    if (status === 'Approved') return 'you had approved it';
    if (status === 'Flagged') return 'it was flagged';
    return 'it was already in your queue';
}

/** The chip for a card or the detail header. Null when the role never came back. */
export function returnBadge(application: Pick<JobApplication, 'extras'>, today: string): ReturnBadge | null {
    const event = latestReturn(application);
    if (!event) return null;

    const decided = shortDate(event.prior.decided_on, today);
    const phrase = priorPhrase(event);
    const when = decided ? ` on ${decided}` : '';

    if (event.alert === 'applied_before') {
        return {
            label: '↻ You applied before',
            tone: 'warn',
            title: `Posted again ${spanLabel(event.gap_days)} after it was last seen. You had already applied, so its status was left as it is.`,
        };
    }
    if (isEvergreen(application)) {
        return {
            label: '↻ Evergreen',
            tone: 'info',
            title: `Posted again ${returnsOf(application).length} times. Likely a standing ad: it no longer moves back to your queue.`,
        };
    }
    const kind = event.kind === 'reopened' ? 'Reopened' : 'Reposted';
    const short = event.prior.status === 'To validate' || event.prior.status === 'Flagged' ? '' : ` · ${phrase.replace(/^it was /, '')}`;
    return {
        label: `↻ ${kind}${short}`,
        tone: event.kind === 'reopened' ? 'warn' : 'info',
        title: `Found again ${spanLabel(event.gap_days)} after it was last seen; ${phrase}${when}.${event.status_reset ? ' Moved back to your queue.' : ''}`,
    };
}

export interface ReturnBanner {
    headline: string;
    detail: string;
    tone: ReturnTone;
}

/** The explanation at the top of the detail pane, written for the latest comeback. */
export function returnBanner(application: Pick<JobApplication, 'extras'>, today: string): ReturnBanner | null {
    const event = latestReturn(application);
    if (!event) return null;

    const decided = shortDate(event.prior.decided_on, today);
    const since = daysBetween(event.prior.decided_on, today);
    const ago = since !== null ? ` (${spanLabel(since)} ago)` : '';
    const verdict = `${priorPhrase(event)}${decided ? ` on ${decided}${ago}` : ''}`;
    const reason = event.prior.drop_reason ? `, reason: ${event.prior.drop_reason.replace(/_/g, ' ')}` : '';

    if (event.alert === 'applied_before') {
        return {
            headline: 'You applied to this role before',
            detail: `It was posted again ${spanLabel(event.gap_days)} after it was last seen. Its status and stage are untouched. Check your application: the process may have stalled, or they are hiring another profile.`,
            tone: 'warn',
        };
    }
    if (isEvergreen(application)) {
        return {
            headline: `Evergreen: posted again ${returnsOf(application).length} times`,
            detail: `Earlier, ${verdict}${reason}. Staffing agencies and always-open roles re-list the same ad, so it is no longer moved back to your queue.`,
            tone: 'info',
        };
    }
    const lead =
        event.kind === 'reopened'
            ? `Reopened after ${spanLabel(event.gap_days)}`
            : `Reposted ${spanLabel(event.gap_days)} after it was last seen`;
    const moved = event.status_reset ? ' It is back in your queue to review again.' : ' Its status was left as it is.';
    return {
        headline: lead,
        detail: `Earlier, ${verdict}${reason}.${moved}`,
        tone: event.kind === 'reopened' ? 'warn' : 'info',
    };
}

const CHANGE_LABELS: Record<string, string> = {
    title: 'Title',
    salary_text: 'Salary',
    location_text: 'Location',
    work_mode: 'Work mode',
    employment_type: 'Type',
    score: 'Score',
    band: 'Band',
};

function show(value: unknown): string {
    return value === null || value === undefined || value === '' ? 'not stated' : String(value);
}

/** "Salary: not stated → USD 6-8k" for each field the new posting changed. */
export function changeLines(event: ReturnEvent): string[] {
    return Object.entries(event.changes ?? {}).map(([field, pair]) => {
        const [before, after] = Array.isArray(pair) ? pair : [null, null];
        return `${CHANGE_LABELS[field] ?? field}: ${show(before)} → ${show(after)}`;
    });
}

export interface HistoryEntry {
    key: string;
    date: string | null;
    title: string;
    lines: string[];
    url: string | null;
}

/** Newest first: each comeback, then the first sighting. Uses only what the role carries. */
export function historyEntries(application: JobApplication, today: string): HistoryEntry[] {
    const entries: HistoryEntry[] = returnsOf(application)
        .map((event, index) => ({
            key: `return-${index}`,
            date: event.at,
            title: event.kind === 'reopened' ? 'Reopened' : 'Reposted',
            lines: [
                `Last seen ${shortDate(event.previous_last_seen, today) ?? 'earlier'}, ${spanLabel(event.gap_days)} before.`,
                `Before this, ${priorPhrase(event)}${event.prior.decided_on ? ` (${shortDate(event.prior.decided_on, today)})` : ''}.`,
                event.status_reset ? `Moved back to ${event.status_after}.` : 'Status left as it was.',
                ...changeLines(event),
            ],
            url: event.posting_url,
        }))
        .reverse();

    if (application.first_seen) {
        entries.push({
            key: 'first-seen',
            date: application.first_seen,
            title: 'First found',
            lines: [],
            url: null,
        });
    }
    return entries;
}

/** Postings that can be split off: needs at least two, and only ones after the first are suspects. */
export function splittablePostings(application: Pick<JobApplication, 'postings'>): JobApplication['postings'] {
    return application.postings.length >= 2 ? application.postings : [];
}
