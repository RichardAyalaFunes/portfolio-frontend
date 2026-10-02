import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    BUCKETS,
    BUCKET_BY_ID,
    DEFAULT_BUCKETS,
    bucketCounts,
    bucketOf,
    dropReasonLabel,
    filterApplications,
    isBelowBar,
    isBucketId,
    isPostingDead,
    laneCounts,
    laneLabel,
    laneShort,
    sortApplications,
    statusLabel,
    type BucketId,
    type QueueFilter,
} from '../../src/components/dashboard/queueBuckets.ts';

interface TestApp {
    id: string;
    status: string;
    application_stage: string;
    live_state: string | null;
    drop_stage: string | null;
    drop_reason: string | null;
    group: string | null;
    source: string | null;
    run_date: string | null;
    title: string;
    company: string;
    score: number | null;
    posted_date: string | null;
}

let counter = 0;
function app(overrides: Partial<TestApp> = {}): TestApp {
    counter += 1;
    return {
        id: `app-${counter}`,
        status: 'To validate',
        application_stage: 'Not applied',
        live_state: 'LISTED',
        drop_stage: null,
        drop_reason: null,
        group: 'ai_engineer',
        source: 'linkedin',
        run_date: '2026-10-01',
        title: 'AI Engineer',
        company: 'Acme',
        score: 80,
        posted_date: '2026-10-01',
        ...overrides,
    };
}

const ALL: QueueFilter = { buckets: [], lanes: [] };

describe('bucketOf: status and stage', () => {
    it('puts a fresh, undecided role in To review', () => {
        assert.equal(bucketOf(app()), 'to_review');
    });

    it('maps every status of a not-applied role to its own bucket', () => {
        const expected: Record<string, BucketId> = {
            'To validate': 'to_review',
            Flagged: 'flagged',
            Approved: 'to_apply',
            Rejected: 'rejected',
            Cold: 'cold',
            Dropped: 'dropped',
        };
        for (const [status, bucket] of Object.entries(expected)) {
            assert.equal(bucketOf(app({ status })), bucket, status);
        }
    });

    it('lets the application stage win over the status once Richard has applied', () => {
        // The reported bug: roles he had applied to kept showing up in the review lists.
        for (const status of ['To validate', 'Flagged', 'Approved', 'Rejected', 'Cold', 'Dropped']) {
            assert.equal(bucketOf(app({ status, application_stage: 'Applied' })), 'applied', status);
        }
        assert.equal(bucketOf(app({ status: 'Approved', application_stage: 'Interviewing' })), 'interviewing');
        assert.equal(bucketOf(app({ status: 'Approved', application_stage: 'Offer' })), 'offer');
        assert.equal(bucketOf(app({ status: 'Rejected', application_stage: 'Closed' })), 'closed');
    });

    it('does not show an applied role under To review, To apply or Flagged', () => {
        const applied = [
            app({ status: 'To validate', application_stage: 'Applied' }),
            app({ status: 'Approved', application_stage: 'Applied' }),
            app({ status: 'Flagged', application_stage: 'Interviewing' }),
        ];
        for (const bucket of ['to_review', 'to_apply', 'flagged'] as BucketId[]) {
            assert.deepEqual(filterApplications(applied, { buckets: [bucket], lanes: [] }), [], bucket);
        }
    });

    it('treats an unknown status as To review instead of hiding it', () => {
        assert.equal(bucketOf(app({ status: 'Something new' })), 'to_review');
    });
});

describe('bucketOf: postings that are no longer open', () => {
    it('moves roles still waiting on Richard to No longer open when the posting is dead', () => {
        for (const live_state of ['CLOSED', 'SUSPENDED', 'GONE']) {
            for (const status of ['To validate', 'Flagged', 'Approved']) {
                assert.equal(bucketOf(app({ status, live_state })), 'no_longer_open', `${status}/${live_state}`);
            }
        }
    });

    it('treats unchecked and unverifiable postings as open', () => {
        assert.equal(bucketOf(app({ live_state: null })), 'to_review');
        assert.equal(bucketOf(app({ live_state: 'UNVERIFIABLE' })), 'to_review');
        assert.equal(isPostingDead({ live_state: null }), false);
        assert.equal(isPostingDead({ live_state: 'LISTED' }), false);
        assert.equal(isPostingDead({ live_state: 'GONE' }), true);
    });

    it('keeps applied roles in their stage even when the posting closed', () => {
        assert.equal(bucketOf(app({ status: 'Approved', application_stage: 'Applied', live_state: 'CLOSED' })), 'applied');
    });

    it('leaves verdicts alone: a rejected role with a dead posting stays Rejected', () => {
        assert.equal(bucketOf(app({ status: 'Rejected', live_state: 'CLOSED' })), 'rejected');
        assert.equal(bucketOf(app({ status: 'Cold', live_state: 'GONE' })), 'cold');
    });
});

describe('bucketOf: dropped roles', () => {
    it("separates roles that scored below the bar (Didn't pass) from roles a gate cut", () => {
        assert.equal(bucketOf(app({ status: 'Dropped', drop_stage: 'scored', drop_reason: 'below_bar' })), 'didnt_pass');
        assert.equal(bucketOf(app({ status: 'Dropped', drop_stage: 'read', drop_reason: 'eligibility_geo' })), 'dropped');
        assert.equal(bucketOf(app({ status: 'Dropped' })), 'dropped');
    });

    it("keeps a below-bar role the sweep marked Cold with the roles that didn't pass", () => {
        // Production: 9 of the 15 below-bar roles were marked Cold when their posting died.
        assert.equal(bucketOf(app({ status: 'Cold', live_state: 'CLOSED', drop_stage: 'scored', drop_reason: 'below_bar' })), 'didnt_pass');
        assert.equal(bucketOf(app({ status: 'Cold', live_state: 'CLOSED' })), 'cold');
    });

    it('leaves his own verdict on a below-bar role alone', () => {
        assert.equal(bucketOf(app({ status: 'Rejected', drop_stage: 'scored', drop_reason: 'below_bar' })), 'rejected');
    });

    it('recognises below-bar by either field', () => {
        assert.equal(isBelowBar({ drop_stage: 'scored', drop_reason: null }), true);
        assert.equal(isBelowBar({ drop_stage: null, drop_reason: 'below_bar' }), true);
        assert.equal(isBelowBar({ drop_stage: 'read', drop_reason: 'off_lane' }), false);
    });

    it('lets Richard overrule the agent: an approved below-bar role is To apply', () => {
        assert.equal(bucketOf(app({ status: 'Approved', drop_stage: 'scored', drop_reason: 'below_bar' })), 'to_apply');
    });

    it("does not offer a below-bar role for review just because it was stored with the default status", () => {
        // Production: one role scored under the bar was ingested as To validate and sat in the default view.
        const stored = { status: 'To validate', drop_stage: 'scored', drop_reason: 'below_bar' };
        assert.equal(bucketOf(app(stored)), 'didnt_pass');
        assert.equal(bucketOf(app({ ...stored, live_state: 'CLOSED' })), 'didnt_pass');
        assert.equal(bucketOf(app({ ...stored, live_state: null })), 'didnt_pass');
        assert.equal(bucketOf(app({ status: 'To validate', drop_stage: 'scored' })), 'didnt_pass');
        assert.equal(bucketOf(app({ status: 'To validate', drop_reason: 'below_bar' })), 'didnt_pass');
    });

    it('keeps an applied below-bar role in its stage, and the agent\'s explicit Flagged as Flagged', () => {
        assert.equal(bucketOf(app({ status: 'To validate', application_stage: 'Applied', drop_stage: 'scored' })), 'applied');
        assert.equal(bucketOf(app({ status: 'Flagged', drop_stage: 'scored', drop_reason: 'below_bar' })), 'flagged');
    });

    it('does not move a role cut by a gate before scoring: it was never scored', () => {
        assert.equal(bucketOf(app({ status: 'To validate', drop_stage: 'read', drop_reason: 'off_lane' })), 'to_review');
    });
});

describe('lookups only match their own keys', () => {
    const inherited = ['toString', 'constructor', 'hasOwnProperty', '__proto__', 'valueOf'];

    it('accepts a bucket id only when it is one', () => {
        for (const bucket of BUCKETS) assert.equal(isBucketId(bucket.id), true, bucket.id);
        for (const key of [...inherited, 'nope', '', 'To review']) assert.equal(isBucketId(key), false, key);
        for (const value of [null, undefined, 3, {}, ['to_review']]) assert.equal(isBucketId(value), false);
    });

    it('never answers a label with something inherited from Object', () => {
        for (const key of inherited) {
            assert.equal(typeof laneLabel(key), 'string', `laneLabel ${key}`);
            assert.equal(typeof laneShort(key), 'string', `laneShort ${key}`);
            assert.equal(typeof dropReasonLabel(key), 'string', `dropReasonLabel ${key}`);
        }
        assert.equal(laneLabel('constructor'), 'Constructor');
        assert.equal(dropReasonLabel('constructor'), 'Constructor');
    });
});

describe('invariants over every combination', () => {
    const statuses = ['To validate', 'Approved', 'Rejected', 'Cold', 'Flagged', 'Dropped'];
    const stages = ['Not applied', 'Applied', 'Interviewing', 'Offer', 'Closed'];
    const liveStates = ['LISTED', 'CLOSED', 'SUSPENDED', 'GONE', 'UNVERIFIABLE', null];
    const drops: Array<[string | null, string | null]> = [[null, null], ['read', 'eligibility_geo'], ['scored', 'below_bar']];
    const reviewBuckets: BucketId[] = ['to_review', 'flagged', 'to_apply', 'no_longer_open'];

    const everything = statuses.flatMap((status) =>
        stages.flatMap((application_stage) =>
            liveStates.flatMap((live_state) =>
                drops.map(([drop_stage, drop_reason]) => app({ status, application_stage, live_state, drop_stage, drop_reason })),
            ),
        ),
    );

    it('puts every role in exactly one known bucket', () => {
        assert.equal(everything.length, 6 * 5 * 6 * 3);
        for (const role of everything) {
            const bucket = bucketOf(role);
            assert.ok(isBucketId(bucket), `${role.status}/${role.application_stage}/${role.live_state} -> ${bucket}`);
        }
    });

    it('never lists a role with an application stage in a bucket that waits on a decision', () => {
        for (const role of everything.filter((r) => r.application_stage !== 'Not applied')) {
            assert.ok(!reviewBuckets.includes(bucketOf(role)), `${role.status}/${role.application_stage}`);
        }
    });

    it('lists a role under To review only when it is undecided, not applied, its posting is open and it passed the bar', () => {
        for (const role of everything) {
            const inReview = bucketOf(role) === 'to_review';
            const expected =
                role.status === 'To validate' &&
                role.application_stage === 'Not applied' &&
                !isPostingDead(role) &&
                !isBelowBar(role);
            assert.equal(inReview, expected, `${role.status}/${role.application_stage}/${role.live_state}/${role.drop_reason}`);
        }
    });

    it("lists a role under Didn't pass only when the agent scored it under the bar and no application or verdict of his overrides that", () => {
        for (const role of everything) {
            const inDidntPass = bucketOf(role) === 'didnt_pass';
            const expected =
                isBelowBar(role) &&
                role.application_stage === 'Not applied' &&
                ['To validate', 'Cold', 'Dropped'].includes(role.status);
            assert.equal(inDidntPass, expected, `${role.status}/${role.application_stage}/${role.live_state}/${role.drop_reason}`);
        }
    });

    it('never offers an action on a dead posting: To apply and Flagged exclude closed, suspended and gone', () => {
        for (const role of everything.filter((r) => isPostingDead(r))) {
            assert.ok(!['to_review', 'flagged', 'to_apply'].includes(bucketOf(role)), `${role.status}/${role.live_state}`);
        }
    });
});

describe('bucket catalogue', () => {
    it('has exactly one definition per bucket and a default that exists', () => {
        const ids = BUCKETS.map((b) => b.id);
        assert.equal(new Set(ids).size, ids.length);
        for (const id of DEFAULT_BUCKETS) assert.ok(BUCKET_BY_ID[id]);
        assert.deepEqual([...DEFAULT_BUCKETS], ['to_review']);
    });
});

describe('filterApplications', () => {
    const roles = [
        app({ title: 'Senior AI Engineer', company: 'Acme Robotics', group: 'ai_engineer', source: 'linkedin', run_date: '2026-10-01' }),
        app({ title: 'Forward Deployed Engineer', company: 'Globex', group: 'forward_deployed_engineer', source: 'wellfound', run_date: '2026-09-30' }),
        app({ title: 'Founding Engineer', company: 'Initech', group: 'founding_engineer', status: 'Approved' }),
        app({ title: 'Backend Engineer', company: 'Hooli', group: null, status: 'Rejected' }),
    ];

    it('shows everything when no bucket is selected (All stages)', () => {
        assert.equal(filterApplications(roles, ALL).length, 4);
    });

    it('restricts to the selected buckets (union)', () => {
        assert.deepEqual(
            filterApplications(roles, { buckets: ['to_review', 'to_apply'], lanes: [] }).map((a) => a.company),
            ['Acme Robotics', 'Globex', 'Initech'],
        );
    });

    it('combines lanes, source, run and search with the bucket filter', () => {
        assert.equal(filterApplications(roles, { buckets: [], lanes: ['ai_engineer', 'founding_engineer'] }).length, 2);
        assert.equal(filterApplications(roles, { ...ALL, source: 'wellfound' }).length, 1);
        assert.equal(filterApplications(roles, { ...ALL, run: '2026-09-30' }).length, 1);
        assert.equal(filterApplications(roles, { ...ALL, search: '  robotics ' }).length, 1);
        assert.equal(filterApplications(roles, { ...ALL, search: 'founding' }).length, 1);
        assert.equal(filterApplications(roles, { buckets: ['to_review'], lanes: [], search: 'founding' }).length, 0);
    });

    it('excludes roles without a lane when a lane filter is active', () => {
        assert.deepEqual(
            filterApplications(roles, { buckets: [], lanes: ['ai_engineer'] }).map((a) => a.company),
            ['Acme Robotics'],
        );
    });
});

describe('faceted counts', () => {
    const roles = [
        app({ group: 'ai_engineer', title: 'AI one' }),
        app({ group: 'ai_engineer', title: 'AI two', status: 'Flagged' }),
        app({ group: 'forward_deployed_engineer', title: 'FDE one' }),
        app({ group: 'forward_deployed_engineer', title: 'FDE applied', application_stage: 'Applied', status: 'Approved' }),
    ];

    it('counts each bucket under the other filters but ignores the bucket selection itself', () => {
        const counts = bucketCounts(roles, { buckets: ['to_review'], lanes: [] });
        assert.equal(counts.to_review, 2);
        assert.equal(counts.flagged, 1);
        assert.equal(counts.applied, 1);
        assert.equal(counts.rejected, 0);
    });

    it('applies the lane filter to bucket counts', () => {
        const counts = bucketCounts(roles, { buckets: [], lanes: ['forward_deployed_engineer'] });
        assert.equal(counts.to_review, 1);
        assert.equal(counts.applied, 1);
        assert.equal(counts.flagged, 0);
    });

    it('counts lanes under the bucket selection but ignores the lane selection itself', () => {
        const counts = laneCounts(roles, { buckets: ['to_review'], lanes: ['ai_engineer'] });
        assert.deepEqual(counts, { ai_engineer: 1, forward_deployed_engineer: 1 });
    });
});

describe('the default queue on production-shaped data', () => {
    // Mirrors the live tracker's mix: lots of dropped/cold rows, a few to review, many applied.
    const tracker = [
        ...Array.from({ length: 9 }, () => app({ status: 'To validate' })),
        // The tenth was stored as To validate although it scored under the bar.
        app({ status: 'To validate', drop_stage: 'scored', drop_reason: 'below_bar' }),
        ...Array.from({ length: 16 }, () => app({ status: 'Flagged' })),
        ...Array.from({ length: 3 }, () => app({ status: 'Approved' })),
        ...Array.from({ length: 18 }, () => app({ status: 'Approved', application_stage: 'Applied' })),
        ...Array.from({ length: 19 }, () => app({ status: 'Rejected' })),
        ...Array.from({ length: 39 }, () => app({ status: 'Cold', live_state: 'CLOSED' })),
        ...Array.from({ length: 154 }, () => app({ status: 'Dropped', drop_stage: 'read', drop_reason: 'eligibility_geo' })),
        ...Array.from({ length: 15 }, () => app({ status: 'Dropped', drop_stage: 'scored', drop_reason: 'below_bar' })),
    ];

    it('shows only the roles still waiting for review by default', () => {
        const visible = filterApplications(tracker, { buckets: [...DEFAULT_BUCKETS], lanes: [] });
        assert.equal(visible.length, 9);
        assert.ok(visible.every((a) => a.status === 'To validate' && a.application_stage === 'Not applied' && !isBelowBar(a)));
    });

    it("has a Didn't pass view with exactly the scored-below-bar roles nobody decided on", () => {
        assert.equal(filterApplications(tracker, { buckets: ['didnt_pass'], lanes: [] }).length, 16);
        assert.equal(filterApplications(tracker, { buckets: ['dropped'], lanes: [] }).length, 154);
    });

    it('partitions the tracker: every role is in exactly one bucket', () => {
        const counts = bucketCounts(tracker, ALL);
        const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
        assert.equal(total, tracker.length);
    });

    it('moves a role out of the default view the moment its status changes', () => {
        const role = app({ status: 'To validate' });
        assert.equal(filterApplications([role], { buckets: ['to_review'], lanes: [] }).length, 1);
        const approvedAndApplied = { ...role, status: 'Approved', application_stage: 'Applied' };
        assert.equal(filterApplications([approvedAndApplied], { buckets: ['to_review'], lanes: [] }).length, 0);
        assert.equal(filterApplications([approvedAndApplied], { buckets: ['applied'], lanes: [] }).length, 1);
    });
});

describe('sortApplications', () => {
    const a = app({ title: 'a', score: 70, posted_date: '2026-09-01' });
    const b = app({ title: 'b', score: 90, posted_date: '2026-10-01' });
    const c = app({ title: 'c', score: null, posted_date: null });

    it('sorts newest first by default and oldest first on request, undated last/first accordingly', () => {
        assert.deepEqual(sortApplications([a, b, c], undefined).map((x) => x.title), ['b', 'a', 'c']);
        assert.deepEqual(sortApplications([a, b, c], 'posted_date.asc').map((x) => x.title), ['c', 'a', 'b']);
    });

    it('sorts by score, unscored last, without mutating the input', () => {
        const input = [a, b, c];
        assert.deepEqual(sortApplications(input, 'score.desc').map((x) => x.title), ['b', 'a', 'c']);
        assert.deepEqual(input.map((x) => x.title), ['a', 'b', 'c']);
    });
});

describe('labels', () => {
    it("shows the stored 'To validate' status as 'To review'", () => {
        assert.equal(statusLabel('To validate'), 'To review');
        assert.equal(statusLabel('Approved'), 'Approved');
    });

    it('names drop reasons, with a readable fallback', () => {
        assert.equal(dropReasonLabel('below_bar'), 'Below the bar');
        assert.equal(dropReasonLabel('some_new_reason'), 'Some new reason');
        assert.equal(dropReasonLabel(null), null);
    });

    it('names lanes in full and short', () => {
        assert.equal(laneLabel('forward_deployed_engineer'), 'Forward Deployed Engineer');
        assert.equal(laneLabel('ai_platform'), 'AI Platform');
        assert.equal(laneShort('ai_engineer'), 'AI');
        assert.equal(laneShort('founding_engineer'), 'Founding');
    });
});
