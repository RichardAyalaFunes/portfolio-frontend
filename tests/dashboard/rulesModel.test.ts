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

describe('normalizeRulesDocument: a document of the wrong shape', () => {
    // The server only checks that lanes have an id, a label and a list of lines, so everything else can arrive
    // as anything. The Rules screen has to render whatever is left without throwing: an exception there blanks the dashboard.
    it('survives input that is not an object at all', () => {
        for (const junk of [null, undefined, 'text', 42, true, []]) {
            const doc = normalizeRulesDocument(junk);
            assert.deepEqual(doc.lanes, []);
            assert.deepEqual(doc.gates, []);
            assert.equal(doc.thresholds.pass_bar, 75);
            assert.deepEqual(doc.thresholds.second_opinion_band, [65, 74]);
        }
    });

    it('leaves out entries of the wrong shape and keeps the good ones next to them', () => {
        const doc = normalizeRulesDocument({
            lanes: [
                null,
                'text',
                7,
                [],
                { label: 'no id' },
                {
                    id: 'ai_engineer',
                    label: 'AI Engineer',
                    lines: [null, 'x', { line: 'good line', status: 'standing', portal: 'linkedin' }, { portal: 'no line text' }],
                    rubric: [null, { dimension: 'Skills', weight: '25' }, { dimension: 'Tech', weight: 40 }, { weight: 5 }],
                    rules: [null, { title: 'T', kind: 'keep' }, { title: 'U', kind: 'drop', items: 'not a list' }, { title: 'V', items: ['a', 1, 'b'] }],
                    title_synonyms: 'not a list',
                },
            ],
            gates: [null, { id: 'g1', details: 'text', drop_reasons: [1, 'a'], lane_notes: { ai_engineer: 'note', fde: 3 } }],
            review_tags: [null, { when: 'no id' }, { id: 't' }],
            scope: { anchors: [null, { label: 'Peru' }, { id: 'x' }], portals: [{ id: 'linkedin', tier: 'x' }, { tier: 1 }], never: ['a', 2] },
            deal_breakers: 'not a list',
            blocklists: { companies: ['Acme', null, 3] },
        });

        assert.deepEqual(doc.lanes.map((l) => l.id), ['ai_engineer']);
        const lane = doc.lanes[0];
        assert.deepEqual(lane.lines.map((l) => [l.line, l.status, l.portal]), [['good line', 'standing', 'linkedin']]);
        assert.deepEqual(lane.rubric, [{ dimension: 'Skills', weight: 0 }, { dimension: 'Tech', weight: 40 }]);
        assert.deepEqual(lane.rules, [
            { title: 'T', kind: 'keep', items: [] },
            { title: 'U', kind: 'drop', items: [] },
            { title: 'V', kind: 'note', items: ['a', 'b'] },
        ]);
        assert.deepEqual(lane.title_synonyms, []);
        assert.deepEqual(doc.gates.map((g) => [g.id, g.details, g.drop_reasons, g.lane_notes]), [
            ['g1', [], ['a'], { ai_engineer: 'note' }],
        ]);
        assert.deepEqual(doc.review_tags, [{ id: 't', when: '', effect: '' }]);
        assert.deepEqual(doc.scope.anchors, [{ id: 'Peru', label: 'Peru' }, { id: 'x', label: 'x' }]);
        assert.deepEqual(doc.scope.portals, [{ id: 'linkedin', tier: 99, label: 'linkedin' }]);
        assert.deepEqual(doc.scope.never, ['a']);
        assert.deepEqual(doc.deal_breakers, []);
        assert.deepEqual(doc.blocklists.companies, ['Acme']);
    });

    it('gives every lane, gate and line what the screen reads, so rendering cannot throw', () => {
        const doc = normalizeRulesDocument({
            lanes: [{ id: 'a', lines: [{ line: 'x' }], rubric: [{ dimension: 'd' }], rules: [{}] }],
            gates: [{}],
        });
        const lane = doc.lanes[0];
        assert.equal(lane.label, 'a');
        assert.equal(lane.order, 1);
        assert.deepEqual(groupLines(lane.lines).map((g) => g.status), ['unknown']);
        assert.equal(rubricTotal(lane.rubric), 0);
        assert.deepEqual(lane.rules[0], { title: '', kind: 'note', items: [] });
        assert.equal(doc.gates[0].details.length, 0);
        assert.equal(doc.thresholds.second_opinion_band.length, 2);
    });

    it('takes a numeric salary target and ignores a band that is not two numbers', () => {
        const doc = normalizeRulesDocument({ thresholds: { salary_target_usd_month: 6000, second_opinion_band: [70, 'x'] } });
        assert.equal(doc.thresholds.salary_target_usd_month, '6000');
        assert.deepEqual(doc.thresholds.second_opinion_band, [65, 74]);
    });
});

describe('laneTabLabel on inherited keys', () => {
    it('falls back to the label instead of an Object property', () => {
        assert.equal(laneTabLabel('constructor', 'Constructor lane'), 'Constructor lane');
        assert.equal(laneTabLabel('__proto__', 'Proto lane'), 'Proto lane');
    });
});
