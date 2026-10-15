/**
 * Geometry for the diagrams the publisher positions (flow and sequence). The publisher decides where
 * every node and edge point goes; this only turns points into SVG path data and measures labels, so
 * the SVG is built from numbers and never from strings that came from a document.
 */

import type { DiagramEdge, DiagramNode } from '../../../api/knowledgeTypes.ts';

function num(value: number): string {
    return Number.isFinite(value) ? String(Math.round(value * 10) / 10) : '0';
}

/** A smooth path through the edge's points, with tangents along the flow direction. */
export function edgePath(points: [number, number][], direction: string | undefined): string {
    if (points.length === 0) return '';
    let d = `M${num(points[0][0])} ${num(points[0][1])}`;
    for (let i = 1; i < points.length; i += 1) {
        const [x0, y0] = points[i - 1];
        const [x1, y1] = points[i];
        if (direction === 'LR') {
            const mx = (x0 + x1) / 2;
            d += ` C${num(mx)} ${num(y0)} ${num(mx)} ${num(y1)} ${num(x1)} ${num(y1)}`;
        } else {
            const my = (y0 + y1) / 2;
            d += ` C${num(x0)} ${num(my)} ${num(x1)} ${num(my)} ${num(x1)} ${num(y1)}`;
        }
    }
    return d;
}

/** Where an edge label goes: the publisher's point when it sent one, else the middle of the path. */
export function labelPoint(edge: DiagramEdge): [number, number] {
    if (typeof edge.lx === 'number' && typeof edge.ly === 'number') return [edge.lx, edge.ly];
    const pts = edge.pts;
    if (pts.length === 0) return [0, 0];
    const mid = Math.floor((pts.length - 1) / 2);
    const a = pts[mid];
    const b = pts[mid + 1] ?? a;
    return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
}

const LABEL_CHAR_WIDTH = 6.6;
const LINE_HEIGHT = 15;

/** The box behind an edge label, so the line does not run through the text. */
export function labelBox(lines: string[], at: [number, number]): { x: number; y: number; w: number; h: number } {
    const width = Math.max(0, ...lines.map((l) => l.length)) * LABEL_CHAR_WIDTH + 12;
    const height = lines.length * LINE_HEIGHT + 4;
    return { x: at[0] - width / 2, y: at[1] - height / 2, w: width, h: height };
}

/** Vertical offsets of a node's text lines so the block is centred on the node. */
export function textOffsets(node: DiagramNode): number[] {
    const count = node.lines.length;
    return node.lines.map((_, i) => node.y + node.h / 2 + (i - (count - 1) / 2) * LINE_HEIGHT + 5);
}

/** A readable one-line description of a diagram for assistive technology. */
export function describeFlow(nodes: DiagramNode[]): string {
    const labels = nodes.map((n) => n.lines.join(' ')).filter(Boolean);
    return `Diagram: ${labels.join(', ')}`;
}
