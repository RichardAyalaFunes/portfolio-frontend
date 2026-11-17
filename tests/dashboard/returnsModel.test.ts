import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { JobApplication, ReturnEvent } from '../../src/api/dashboardApi.ts';
import {
    changeLines,
    daysBetween,
    historyEntries,
    isEvergreen,
    returnBadge,
    returnBanner,
    shortDate,
    spanLabel,
    splittablePostings,
} from '../../src/components/dashboard/returnsModel.ts';

const TODAY = '2026-11-16';

function event(overrides: Partial<ReturnEvent> = {}): ReturnEvent {
    return {
        kind: 'reposted',
        at: '2026-11-16',
        gap_days: 35,
        previous_last_seen: '2026-10-12',
        posting_id: '5002',
        posting_url: 'https://example.com/5002',
        prior: {
            status: 'Rejected',
            decided_by: 'you',
            decided_on: '2026-10-12',
            drop_reason: null,
            drop_stage: null,
            score: 80,
            application_stage: null,
        },
        status_reset: true,
        status_after: 'To validate',
        alert: null,
        changes: {},
        ...overrides,
    };
}

function role(...events: ReturnEvent[]): JobApplication {
    return { extras: events.length ? { returns: events } : {}, postings: [], first_seen: '2026-09-17' } as unknown as JobApplication;
}

describe('dates and spans', () => {
    it('writes this year without the year and older dates with it', () => {
        assert.equal(shortDate('2026-10-12', TODAY), 'Oct 12');
        assert.equal(shortDate('2025-06-25', TODAY), 'Jun 25, 2025');
        assert.equal(shortDate(null, TODAY), null);
        assert.equal(shortDate('garbage', TODAY), null);
    });

    it('counts whole days between calendar dates, across a month and a year', () => {
        assert.equal(daysBetween('2026-10-12', '2026-11-16'), 35);
        assert.equal(daysBetween('2025-12-31', '2026-01-02'), 2);
        assert.equal(daysBetween(null, '2026-01-02'), null);
    });

    it('picks the unit that reads best', () => {
        assert.equal(spanLabel(1), '1 day');
        assert.equal(spanLabel(9), '9 days');
        assert.equal(spanLabel(35), '5 weeks');
        assert.equal(spanLabel(144), '5 months');
        assert.equal(spanLabel(400), '1.1 years');
    });
});

describe('returnBadge', () => {
    it('is absent for a role that never came back', () => {
        assert.equal(returnBadge(role(), TODAY), null);
    });

    it('says who closed it when a rejected role is reposted', () => {
        const badge = returnBadge(role(event()), TODAY);
        assert.equal(badge?.label, '↻ Reposted · you rejected it');
        assert.equal(badge?.tone, 'info');
        assert.match(badge?.title ?? '', /you rejected it on Oct 12/);
        assert.match(badge?.title ?? '', /Moved back to your queue/);
    });

    it('marks a reopening as a warning and names the agent when it dropped the role', () => {
        const badge = returnBadge(
            role(event({ kind: 'reopened', gap_days: 144, prior: { ...event().prior, status: 'Dropped', decided_by: 'agent' } })),
            TODAY,
        );
        assert.equal(badge?.label, '↻ Reopened · the agent dropped it');
        assert.equal(badge?.tone, 'warn');
    });

    it('keeps the chip bare when the role was only waiting', () => {
        const badge = returnBadge(role(event({ status_reset: false, prior: { ...event().prior, status: 'To validate', decided_by: 'agent' } })), TODAY);
        assert.equal(badge?.label, '↻ Reposted');
    });

    it('an application he sent outranks everything', () => {
        const badge = returnBadge(role(event({ alert: 'applied_before', status_reset: false })), TODAY);
        assert.equal(badge?.label, '↻ You applied before');
        assert.equal(badge?.tone, 'warn');
    });

    it('a role that keeps coming back is called evergreen', () => {
        const three = role(event(), event(), event());
        assert.equal(isEvergreen(three), true);
        assert.equal(isEvergreen(role(event(), event())), false);
        assert.equal(returnBadge(three, TODAY)?.label, '↻ Evergreen');
    });
});

describe('returnBanner', () => {
    it('explains a repost with the decision and how long ago it was', () => {
        const banner = returnBanner(role(event()), TODAY);
        assert.equal(banner?.headline, 'Reposted 5 weeks after it was last seen');
        assert.equal(banner?.detail, 'Earlier, you rejected it on Oct 12 (5 weeks ago). It is back in your queue to review again.');
    });

    it('includes the reason the agent had to drop it', () => {
        const banner = returnBanner(
            role(
                event({
                    kind: 'reopened',
                    gap_days: 144,
                    prior: { ...event().prior, status: 'Dropped', decided_by: 'agent', decided_on: '2026-06-25', drop_reason: 'deal_breaker' },
                }),
            ),
            TODAY,
        );
        assert.equal(banner?.headline, 'Reopened after 5 months');
        assert.match(banner?.detail ?? '', /the agent dropped it on Jun 25 \(5 months ago\), reason: deal breaker/);
    });

    it('does not claim a status change that did not happen', () => {
        const banner = returnBanner(role(event({ status_reset: false, prior: { ...event().prior, status: 'Approved' } })), TODAY);
        assert.match(banner?.detail ?? '', /Its status was left as it is/);
        assert.doesNotMatch(banner?.detail ?? '', /back in your queue/);
    });
});

describe('changes and history', () => {
    it('shows what the new posting changed, naming a missing value', () => {
        const lines = changeLines(event({ changes: { salary_text: [null, 'USD 6-8k'], title: ['Engineer', 'Senior Engineer'] } }));
        assert.deepEqual(lines, ['Salary: not stated → USD 6-8k', 'Title: Engineer → Senior Engineer']);
    });

    it('lists the newest comeback first and ends with the first sighting', () => {
        const app = role(event({ at: '2026-10-01' }), event({ at: '2026-11-16' }));
        const entries = historyEntries(app, TODAY);
        assert.deepEqual(entries.map((e) => e.date), ['2026-11-16', '2026-10-01', '2026-09-17']);
        assert.equal(entries.at(-1)?.title, 'First found');
    });

    it('only offers a split when there is more than one posting', () => {
        const one = { postings: [{ id: '1', url: null, source: null }] };
        const two = { postings: [{ id: '1', url: null, source: null }, { id: '2', url: null, source: null }] };
        assert.equal(splittablePostings(one).length, 0);
        assert.equal(splittablePostings(two).length, 2);
    });
});
