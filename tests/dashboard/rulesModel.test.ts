import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { RulesLine } from '../../src/api/dashboardApi.ts';
import {
    formatPublished,
    groupLines,
    laneTabLabel,
    normalizeRulesDocument,
    rubricTotal,
} from '../../src/components/dashboard/rulesModel.ts';

function line(text: string, status: string): RulesLine {
    return { line: text, portal: 'linkedin', status, origin: 'adaptive', added: null, reason: null, evidence: null, runs: null };
}

describe('groupLines', () => {
    it('orders groups standing, trial, weekly, retired and drops empty ones', () => {
        const groups = groupLines([line('a', 'weekly'), line('b', 'standing'), line('c', 'trial'), line('d', 'standing')]);
        assert.deepEqual(groups.map((g) => g.status), ['standing', 'trial', 'weekly']);
        assert.deepEqual(groups[0].lines.map((l) => l.line), ['b', 'd']);
    });

    it('keeps lines whose status the UI does not know, after the known groups', () => {
        const groups = groupLines([line('a', 'standing'), line('b', 'experimental')]);
        assert.deepEqual(groups.map((g) => g.status), ['standing', 'experimental']);
        assert.equal(groups[1].label, 'experimental');
    });

    it('returns nothing for a lane without lines', () => {
        assert.deepEqual(groupLines([]), []);
    });
});

describe('rubricTotal', () => {
    it('sums the weights', () => {
        assert.equal(rubricTotal([{ dimension: 'a', weight: 25 }, { dimension: 'b', weight: 75 }]), 100);
        assert.equal(rubricTotal([]), 0);
    });
});

describe('laneTabLabel', () => {
    it('uses a short name for the three lanes and the lane label for any other', () => {
        assert.equal(laneTabLabel('forward_deployed_engineer', 'Forward Deployed Engineer (AI / agentic)'), 'Forward Deployed');
        assert.equal(laneTabLabel('new_lane', 'New Lane'), 'New Lane');
    });
});

describe('formatPublished', () => {
    it('formats ISO dates and timestamps, and degrades gracefully', () => {
        assert.match(formatPublished('2026-10-01T15:20:00Z'), /2026/);
        assert.equal(formatPublished(null), 'not yet');
        assert.equal(formatPublished('garbage'), 'garbage');
    });
});

describe('normalizeRulesDocument', () => {
    it('fills every missing section so a partial document cannot blank the screen', () => {
        const doc = normalizeRulesDocument({ lanes: [{ id: 'ai_engineer', order: 1, label: 'AI Engineer' } as never] });
        assert.equal(doc.thresholds.pass_bar, 75);
        assert.equal(doc.thresholds.didnt_pass_floor, 55);
        assert.deepEqual(doc.gates, []);
        assert.deepEqual(doc.review_tags, []);
        assert.deepEqual(doc.deal_breakers, []);
        assert.deepEqual(doc.scope.anchors, []);
        assert.deepEqual(doc.blocklists.companies, []);
        assert.deepEqual(doc.lanes[0].lines, []);
        assert.deepEqual(doc.lanes[0].rubric, []);
        assert.deepEqual(doc.lanes[0].rules, []);
        assert.equal(doc.lanes[0].thesis, null);
    });

    it('keeps what the document does say', () => {
        const doc = normalizeRulesDocument({
            thresholds: { pass_bar: 80 } as never,
            gates: [{ id: 'g', order: 1, name: 'G', summary: 'S' } as never],
        });
        assert.equal(doc.thresholds.pass_bar, 80);
        assert.equal(doc.thresholds.excellent_bar, 90);
        assert.deepEqual(doc.gates[0].lane_notes, {});
        assert.deepEqual(doc.gates[0].details, []);
    });
});
