import { test } from 'node:test';
import assert from 'node:assert/strict';
import { filterSearches, groupRate, pct, sortSearches } from '../../src/components/dashboard/searchesModel.ts';

const row = (line: string, extra: Record<string, unknown>) => ({
    line, portal: 'linkedin', technique: 'search_string', executions: 1, surfaced: 0, new: 0, read: 0, passed: 0, flagged: 0,
    first_run: '2026-11-01', last_run: '2026-11-01', roles: 0, approved: 0, applied: 0, rejected: 0, pass_rate: null, history: [],
    ...extra,
}) as any;

test('sorts numbers and keeps empty pass rates last', () => {
    const rows = [row('a', { pass_rate: 0.2 }), row('b', { pass_rate: null }), row('c', { pass_rate: 0.5 })];
    assert.deepEqual(sortSearches(rows, 'pass_rate', true).map((r) => r.line), ['c', 'a', 'b']);
    assert.deepEqual(sortSearches(rows, 'pass_rate', false).map((r) => r.line), ['a', 'c', 'b']);
});

test('filters by technique and portal', () => {
    const rows = [row('a', {}), row('b', { technique: 'section' }), row('c', { portal: 'wellfound' })];
    assert.deepEqual(filterSearches(rows, 'section', 'all').map((r) => r.line), ['b']);
    assert.deepEqual(filterSearches(rows, 'all', 'wellfound').map((r) => r.line), ['c']);
});

test('formats rates', () => {
    assert.equal(pct(null), '—');
    assert.equal(pct(0.257), '26%');
    assert.equal(groupRate({ new: 0, passed: 0 }), null);
    assert.equal(groupRate({ new: 4, passed: 1 }), 0.25);
});
