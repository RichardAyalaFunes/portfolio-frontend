import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { DiagramEdge, DiagramNode } from '../../src/api/knowledgeTypes.ts';
import { describeFlow, edgePath, labelBox, labelPoint, textOffsets } from '../../src/components/dashboard/knowledge/diagramGeometry.ts';

function node(overrides: Partial<DiagramNode> = {}): DiagramNode {
    return { id: 'A', x: 10, y: 20, w: 100, h: 40, lines: ['One'], shape: 'rect', ...overrides };
}

describe('edgePath', () => {
    it('uses vertical tangents for a top-down flow', () => {
        assert.equal(edgePath([[50, 0], [50, 100]], 'TD'), 'M50 0 C50 50 50 50 50 100');
    });

    it('uses horizontal tangents for a left-right flow', () => {
        assert.equal(edgePath([[0, 20], [100, 60]], 'LR'), 'M0 20 C50 20 50 60 100 60');
    });

    it('chains one curve per segment through intermediate points', () => {
        const d = edgePath([[0, 0], [10, 50], [0, 100]], 'TD');
        assert.equal(d.split('C').length - 1, 2);
        assert.ok(d.startsWith('M0 0'));
    });

    it('never writes NaN into path data', () => {
        assert.ok(!edgePath([[Number.NaN, 0], [1, Number.POSITIVE_INFINITY]], 'TD').includes('NaN'));
        assert.equal(edgePath([], 'TD'), '');
    });
});

describe('labels', () => {
    it('prefers the point the publisher sent and falls back to the middle of the path', () => {
        const edge: DiagramEdge = { pts: [[0, 0], [0, 100]], label: ['Yes'], style: 'solid', arrow: true };
        assert.deepEqual(labelPoint({ ...edge, lx: 5, ly: 7 }), [5, 7]);
        assert.deepEqual(labelPoint(edge), [0, 50]);
    });

    it('sizes the box to the longest line and centres it on the point', () => {
        const box = labelBox(['Yes', 'No way'], [100, 50]);
        assert.equal(box.h, 34);
        assert.equal(box.x + box.w / 2, 100);
        assert.equal(box.y + box.h / 2, 50);
    });

    it('centres a node text block vertically', () => {
        const offsets = textOffsets(node({ lines: ['a', 'b', 'c'], y: 0, h: 60 }));
        assert.equal(offsets[1] - offsets[0], 15);
        assert.equal(offsets[1], 35);
    });

    it('describes a flow from its node labels', () => {
        assert.equal(describeFlow([node({ lines: ['Start'] }), node({ id: 'B', lines: ['Seen', 'before?'] })]), 'Diagram: Start, Seen before?');
    });
});
