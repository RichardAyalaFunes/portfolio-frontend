import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { appliedCount, toReviewCount } from '../../src/components/dashboard/metricsModel.ts';

describe('toReviewCount', () => {
    it("uses the server's count by the queue's rule when it sends one", () => {
        assert.equal(toReviewCount({ to_review: 4, status_counts: { 'To validate': 9 } }), 4);
    });

    it('treats an explicit zero as a real answer, not as missing', () => {
        assert.equal(toReviewCount({ to_review: 0, status_counts: { 'To validate': 9 } }), 0);
    });

    it('falls back to the raw status count against an older server', () => {
        assert.equal(toReviewCount({ status_counts: { 'To validate': 9 } }), 9);
        assert.equal(toReviewCount({ status_counts: {} }), 0);
    });
});

describe('appliedCount', () => {
    it('counts every stage after "Not applied"', () => {
        assert.equal(
            appliedCount({ 'Not applied': 256, Applied: 19, Interviewing: 2, Offer: 1, Closed: 3 }),
            25,
        );
    });

    it('does not shrink when an applied role moves on to an interview', () => {
        assert.equal(appliedCount({ 'Not applied': 10, Applied: 5 }), 5);
        assert.equal(appliedCount({ 'Not applied': 10, Applied: 4, Interviewing: 1 }), 5);
    });

    it('is zero with nothing applied or no data', () => {
        assert.equal(appliedCount({ 'Not applied': 12 }), 0);
        assert.equal(appliedCount({}), 0);
    });
});
