/**
 * The dashboard queue's buckets.
 *
 * Every role belongs to exactly ONE bucket, derived from three facts: its status
 * (the screening verdict), its application stage (how far Richard took it) and
 * whether its posting is still open. The queue filter picks buckets, so a role
 * can never show up under a filter it does not belong to:
 *
 *   - Once a role has an application stage (Applied, Interviewing, Offer, Closed)
 *     it lives in that stage bucket and leaves every review list, whatever its
 *     status says. That is what keeps an applied role out of "To review".
 *   - A role still waiting on him (To review / Flagged / To apply) whose posting
 *     has closed moves to "No longer open": he cannot act on it any more.
 *   - A role the agent scored under the pass bar is "Didn't pass", not "To review",
 *     even if it was stored with the default To validate status. His own verdicts
 *     (Approved, Rejected) and the agent's explicit Flagged are kept as they are.
 *
 * The backend counts "To review" with the same rule (JobApplication.awaits_review) for
 * the Metrics tile and the Rules page, so keep the two in step.
 *
 * This file is dependency-free on purpose (type imports only) and the relative
 * imports in the dashboard's pure modules carry an explicit `.ts` extension, so
 * `node --test` can run their unit tests without a bundler or a test framework.
 */

import type { JobApplication } from '../../api/dashboardApi';

export type BucketId =
    | 'to_review'
    | 'flagged'
    | 'didnt_pass'
    | 'to_apply'
    | 'applied'
    | 'interviewing'
    | 'offer'
    | 'closed'
    | 'rejected'
    | 'cold'
    | 'dropped'
    | 'no_longer_open';

export type BucketGroupId = 'review' | 'apply' | 'tracking' | 'set_aside';

export interface BucketDef {
    id: BucketId;
    label: string;
    /** One line shown under the label in the filter menu: what lands here and why. */
    hint: string;
    group: BucketGroupId;
    /** CSS variable (from dashboard.css) used for this bucket's chip. */
    color: string;
}

export const BUCKET_GROUPS: ReadonlyArray<{ id: BucketGroupId; label: string }> = [
    { id: 'review', label: 'Needs your review' },
    { id: 'apply', label: 'Ready to apply' },
    { id: 'tracking', label: 'Tracking' },
    { id: 'set_aside', label: 'Set aside' },
];

export const BUCKETS: ReadonlyArray<BucketDef> = [
    { id: 'to_review', label: 'To review', hint: 'Nothing decided yet. Waiting for you.', group: 'review', color: 'var(--db-accent)' },
    { id: 'flagged', label: 'Flagged', hint: 'The agent has a doubt (location, company type) and needs your call.', group: 'review', color: 'var(--db-band-flag)' },
    { id: 'didnt_pass', label: "Didn't pass", hint: 'Scored below the bar, open or since closed. Kept so you can re-check the score and the reason.', group: 'review', color: 'var(--db-band-below)' },
    { id: 'to_apply', label: 'To apply', hint: 'You approved it and have not applied yet.', group: 'apply', color: 'var(--db-band-good)' },
    { id: 'applied', label: 'Applied', hint: 'Application sent.', group: 'tracking', color: 'var(--db-accent)' },
    { id: 'interviewing', label: 'Interviewing', hint: 'In the interview process.', group: 'tracking', color: 'var(--db-band-excellent)' },
    { id: 'offer', label: 'Offer', hint: 'You have an offer.', group: 'tracking', color: 'var(--db-band-good)' },
    { id: 'closed', label: 'Closed', hint: 'The process is over.', group: 'tracking', color: 'var(--db-fresh-stale)' },
    { id: 'rejected', label: 'Rejected', hint: 'You decided it is not for you.', group: 'set_aside', color: 'var(--db-band-drop)' },
    { id: 'cold', label: 'Cold', hint: 'The posting went stale before you decided.', group: 'set_aside', color: 'var(--db-fresh-stale)' },
    { id: 'dropped', label: 'Dropped', hint: 'Cut by a rule after the agent read the JD.', group: 'set_aside', color: 'var(--db-muted)' },
    { id: 'no_longer_open', label: 'No longer open', hint: 'Was waiting on you, but the posting closed.', group: 'set_aside', color: 'var(--db-muted)' },
];

export const BUCKET_BY_ID = Object.fromEntries(BUCKETS.map((b) => [b.id, b])) as Record<BucketId, BucketDef>;

/** What the queue shows when Richard has never picked a filter: only what still needs his review. */
export const DEFAULT_BUCKETS: ReadonlyArray<BucketId> = ['to_review'];

export function isBucketId(value: unknown): value is BucketId {
    // Own keys only: `in` would accept 'toString' or '__proto__' from a corrupted saved preference.
    return typeof value === 'string' && Object.hasOwn(BUCKET_BY_ID, value);
}

// ── Classification ───────────────────────────────────────────────────────────

type BucketInput = Pick<JobApplication, 'status' | 'application_stage' | 'live_state' | 'drop_stage' | 'drop_reason'>;

const DEAD_POSTING_STATES = ['CLOSED', 'SUSPENDED', 'GONE'];

/** The liveness sweep found the posting closed, suspended or gone. Unknown/unchecked counts as open. */
export function isPostingDead(app: Pick<JobApplication, 'live_state'>): boolean {
    return app.live_state !== null && DEAD_POSTING_STATES.includes(app.live_state);
}

/** The agent scored the role and it landed under the pass bar (as opposed to a gate cutting it before scoring). */
export function isBelowBar(app: Pick<JobApplication, 'drop_stage' | 'drop_reason'>): boolean {
    return app.drop_stage === 'scored' || app.drop_reason === 'below_bar';
}

export function bucketOf(app: BucketInput): BucketId {
    switch (app.application_stage) {
        case 'Applied':
            return 'applied';
        case 'Interviewing':
            return 'interviewing';
        case 'Offer':
            return 'offer';
        case 'Closed':
            return 'closed';
    }

    switch (app.status) {
        case 'Rejected':
            return 'rejected';
        case 'Cold':
            // The liveness sweep marks a dead posting Cold, including one the agent had already
            // dropped for scoring under the bar: those stay with the other roles that missed it.
            return isBelowBar(app) ? 'didnt_pass' : 'cold';
        case 'Dropped':
            return isBelowBar(app) ? 'didnt_pass' : 'dropped';
        case 'Approved':
            return isPostingDead(app) ? 'no_longer_open' : 'to_apply';
        case 'Flagged':
            return isPostingDead(app) ? 'no_longer_open' : 'flagged';
        default:
            // 'To validate', and anything unknown: show it rather than hide it. One the agent scored
            // under the bar never was a candidate, whatever status it was stored with.
            if (isBelowBar(app)) return 'didnt_pass';
            return isPostingDead(app) ? 'no_longer_open' : 'to_review';
    }
}

// ── Labels ───────────────────────────────────────────────────────────────────

/** The stored status value stays 'To validate' (the agent writes it); the UI calls it 'To review'. */
export function statusLabel(status: string): string {
    return status === 'To validate' ? 'To review' : status;
}

/** One line per status for the detail screen, in Richard's own meaning of each. */
export const STATUS_HELP: Record<string, string> = {
    'To validate': 'Waiting for your review. Nothing decided yet.',
    Approved: 'You accepted this role. Set the stage to Applied once you send the application.',
    Rejected: 'You decided it is not for you.',
    Cold: 'The posting went stale or closed before you decided.',
    Flagged: 'The agent has a doubt (location, company type) and needs your call.',
    Dropped: 'The search agent cut it after reading the JD, or its score fell short. Kept so you can audit the rules.',
};

const DROP_REASON_LABELS: Record<string, string> = {
    below_bar: 'Below the bar',
    eligibility_geo: 'Geography',
    country_locked: 'Country-locked',
    eligibility_unclear: 'Eligibility unclear',
    stack_paradigm: 'Stack mismatch',
    off_lane: 'Off lane',
    deal_breaker: 'Deal-breaker',
    staffing_pool: 'Staffing pool',
    headhunter_bodyshop: 'Agency / body shop',
    local_company: 'Local company',
    language_paradigm: 'Language',
    seniority_ceiling: 'Too senior',
    seniority_floor: 'Too junior',
    extraction_incomplete: 'JD unreadable',
    stale: 'Stale',
};

export function dropReasonLabel(code: string | null): string | null {
    if (!code) return null;
    if (Object.hasOwn(DROP_REASON_LABELS, code)) return DROP_REASON_LABELS[code];
    const spaced = code.replace(/_/g, ' ');
    return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

const LANE_LABELS: Record<string, string> = {
    ai_engineer: 'AI Engineer',
    forward_deployed_engineer: 'Forward Deployed Engineer',
    founding_engineer: 'Founding Engineer',
};

const LANE_SHORT: Record<string, string> = {
    ai_engineer: 'AI',
    forward_deployed_engineer: 'FDE',
    founding_engineer: 'Founding',
};

export function laneLabel(lane: string): string {
    if (Object.hasOwn(LANE_LABELS, lane)) return LANE_LABELS[lane];
    return lane
        .split('_')
        .map((word) => (word.toLowerCase() === 'ai' ? 'AI' : word.charAt(0).toUpperCase() + word.slice(1)))
        .join(' ');
}

export function laneShort(lane: string): string {
    return Object.hasOwn(LANE_SHORT, lane) ? LANE_SHORT[lane] : laneLabel(lane);
}

// ── Filtering, counting, sorting ────────────────────────────────────────────

export interface QueueFilter {
    /** Empty = no bucket restriction ("All stages"). */
    buckets: ReadonlyArray<BucketId>;
    /** Empty = every lane. */
    lanes: ReadonlyArray<string>;
    source?: string;
    run?: string;
    search?: string;
}

type Filterable = BucketInput & Pick<JobApplication, 'group' | 'source' | 'run_date' | 'title' | 'company'>;

function matches(app: Filterable, filter: QueueFilter, ignore?: 'buckets' | 'lanes'): boolean {
    if (ignore !== 'buckets' && filter.buckets.length > 0 && !filter.buckets.includes(bucketOf(app))) return false;
    if (ignore !== 'lanes' && filter.lanes.length > 0 && !(app.group && filter.lanes.includes(app.group))) return false;
    if (filter.source && app.source !== filter.source) return false;
    if (filter.run && app.run_date !== filter.run) return false;
    const query = filter.search?.trim().toLowerCase();
    if (query && !app.title.toLowerCase().includes(query) && !app.company.toLowerCase().includes(query)) return false;
    return true;
}

export function filterApplications<T extends Filterable>(apps: ReadonlyArray<T>, filter: QueueFilter): T[] {
    return apps.filter((app) => matches(app, filter));
}

/** Per-bucket counts under every OTHER filter, so a number is what picking that bucket would show. */
export function bucketCounts(apps: ReadonlyArray<Filterable>, filter: QueueFilter): Record<BucketId, number> {
    const counts = Object.fromEntries(BUCKETS.map((b) => [b.id, 0])) as Record<BucketId, number>;
    for (const app of apps) {
        if (matches(app, filter, 'buckets')) counts[bucketOf(app)] += 1;
    }
    return counts;
}

/** Per-lane counts under every OTHER filter (buckets included), for the lane menu. */
export function laneCounts(apps: ReadonlyArray<Filterable>, filter: QueueFilter): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const app of apps) {
        if (app.group && matches(app, filter, 'lanes')) counts[app.group] = (counts[app.group] ?? 0) + 1;
    }
    return counts;
}

export const SORT_OPTIONS = [
    { value: 'posted_date.desc', label: 'Newest first' },
    { value: 'posted_date.asc', label: 'Oldest first' },
    { value: 'score.desc', label: 'Highest score' },
] as const;

export const DEFAULT_SORT = 'posted_date.desc';
export const SORT_KEYS: ReadonlyArray<string> = SORT_OPTIONS.map((option) => option.value);

export function sortApplications<T extends Pick<JobApplication, 'score' | 'posted_date'>>(
    apps: ReadonlyArray<T>,
    sort: string | undefined,
): T[] {
    const sorted = [...apps];
    if (sort === 'score.desc') {
        sorted.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
        return sorted;
    }
    const time = (a: T) => (a.posted_date ? new Date(a.posted_date).getTime() : 0);
    sorted.sort((a, b) => (sort === 'posted_date.asc' ? time(a) - time(b) : time(b) - time(a)));
    return sorted;
}
