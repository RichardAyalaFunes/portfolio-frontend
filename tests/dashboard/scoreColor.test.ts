import assert from 'node:assert/strict';
import { it } from 'node:test';
import { scoreColorVar } from '../../src/components/dashboard/dashboardTokens.ts';

it('colors by score: muted to 70, green 71-79, yellow 80-87, red 88+, YC always red', () => {
    assert.equal(scoreColorVar(70), 'var(--db-band-below)');
    assert.equal(scoreColorVar(71), 'var(--db-band-good)');
    assert.equal(scoreColorVar(79), 'var(--db-band-good)');
    assert.equal(scoreColorVar(80), 'var(--db-band-excellent)');
    assert.equal(scoreColorVar(87), 'var(--db-band-excellent)');
    assert.equal(scoreColorVar(88), 'var(--db-band-drop)');
    assert.equal(scoreColorVar(60, 'ycombinator'), 'var(--db-band-drop)');
    assert.equal(scoreColorVar(null), 'var(--db-muted)');
});
