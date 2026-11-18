import assert from 'node:assert/strict';
import { test } from 'node:test';
import { freshnessHint, freshnessShortFor, isRealPostedDate } from '../../src/components/dashboard/dashboardTokens.ts';

const daysAgoIso = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);

test('only the platform timestamp counts as a real posting date', () => {
    assert.equal(isRealPostedDate('linkedin_listedAt'), true);
    for (const s of ['derived_from_relative', 'guessed_midpoint', 'run_date_fallback', null, undefined]) {
        assert.equal(isRealPostedDate(s), false);
    }
});

test('an estimated age carries a tilde, a real one does not', () => {
    const d = daysAgoIso(3);
    assert.equal(freshnessShortFor(d, 'derived_from_relative'), '~3d');
    assert.equal(freshnessShortFor(d, 'linkedin_listedAt'), '3d');
    assert.equal(freshnessShortFor(null, 'derived_from_relative'), '?');
});

test('the hint says whether the date is an estimate', () => {
    assert.match(freshnessHint('2026-11-15', 'derived_from_relative'), /Estimated/);
    assert.match(freshnessHint('2026-11-15', 'linkedin_listedAt'), /^Posted/);
    assert.equal(freshnessHint(null, null), 'No posting date known');
});
