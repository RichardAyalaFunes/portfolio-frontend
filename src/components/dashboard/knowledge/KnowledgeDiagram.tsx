import { useId } from 'react';
import type { DiagramNode, KnowledgeBlock } from '../../../api/knowledgeTypes.ts';
import { describeFlow, edgePath, labelBox, labelPoint, textOffsets } from './diagramGeometry.ts';

type DiagramBlock = Extract<KnowledgeBlock, { t: 'diagram' }>;

function finite(value: unknown): value is number {
    return typeof value === 'number' && Number.isFinite(value);
}

function NodeShape({ node }: { node: DiagramNode }) {
    const cx = node.x + node.w / 2;
    const cy = node.y + node.h / 2;
    const lines = Array.isArray(node.lines) ? node.lines : [];
    const offsets = textOffsets({ ...node, lines });

    let shape;
    if (node.shape === 'start') {
        shape = <circle cx={cx} cy={cy} r={node.w / 2} className="k-node-start" />;
    } else if (node.shape === 'end') {
        shape = (
            <>
                <circle cx={cx} cy={cy} r={node.w / 2} className="k-node-end" />
                <circle cx={cx} cy={cy} r={node.w / 4} className="k-node-start" />
            </>
        );
    } else if (node.shape === 'diamond') {
        const points = `${cx},${node.y} ${node.x + node.w},${cy} ${cx},${node.y + node.h} ${node.x},${cy}`;
        shape = <polygon points={points} className="k-node k-node-decision" />;
    } else if (node.shape === 'circle') {
        shape = <ellipse cx={cx} cy={cy} rx={node.w / 2} ry={node.h / 2} className="k-node" />;
    } else {
        const radius = node.shape === 'stadium' ? node.h / 2 : node.shape === 'round' ? 14 : 8;
        shape = <rect x={node.x} y={node.y} width={node.w} height={node.h} rx={radius} className="k-node" />;
    }

    return (
        <g>
            {shape}
            {lines.map((line, i) => (
                <text key={i} x={cx} y={offsets[i]} textAnchor="middle" className="k-node-text">
                    {line}
                </text>
            ))}
        </g>
    );
}

function FlowDiagram({ block }: { block: Extract<DiagramBlock, { kind: 'flow' }> }) {
    const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
    const nodes = block.nodes.filter((n) => [n.x, n.y, n.w, n.h].every(finite));
    const edges = block.edges.filter((e) => Array.isArray(e.pts) && e.pts.length >= 2 && e.pts.every((p) => finite(p[0]) && finite(p[1])));

    return (
        <svg viewBox={`0 0 ${block.w} ${block.h}`} width={block.w} height={block.h} className="k-diagram-svg" aria-hidden="true">
            <defs>
                <marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                    <path d="M0 0 L10 5 L0 10 z" className="k-arrowhead" />
                </marker>
            </defs>
            {edges.map((edge, i) => {
                const label = Array.isArray(edge.label) ? edge.label : null;
                const box = label ? labelBox(label, labelPoint(edge)) : null;
                return (
                    <g key={`e${i}`}>
                        <path
                            d={edgePath(edge.pts, block.dir)}
                            className={`k-edge k-edge-${edge.style === 'dotted' || edge.style === 'thick' ? edge.style : 'solid'}${edge.back ? ' k-edge-back' : ''}`}
                            fill="none"
                            markerEnd={edge.arrow ? `url(#${id}-arrow)` : undefined}
                        />
                        {label && box && (
                            <g>
                                <rect x={box.x} y={box.y} width={box.w} height={box.h} rx={4} className="k-edge-label-bg" />
                                {label.map((line, j) => (
                                    <text
                                        key={j}
                                        x={box.x + box.w / 2}
                                        y={box.y + 14 + j * 15}
                                        textAnchor="middle"
                                        className="k-edge-label"
                                    >
                                        {line}
                                    </text>
                                ))}
                            </g>
                        )}
                    </g>
                );
            })}
            {nodes.map((node) => (
                <NodeShape key={node.id} node={node} />
            ))}
        </svg>
    );
}

function SequenceDiagram({ block }: { block: Extract<DiagramBlock, { kind: 'sequence' }> }) {
    const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
    const shift = finite(block.shift) ? block.shift : 0;
    const head = finite(block.head) ? block.head : 40;
    const participants = block.participants.filter((p) => finite(p.x));
    const steps = block.steps.filter((s) => finite(s.y) && finite(s.x1) && finite(s.x2));
    const boxWidth = 128;

    return (
        <svg viewBox={`0 0 ${block.w + shift} ${block.h}`} width={block.w + shift} height={block.h} className="k-diagram-svg" aria-hidden="true">
            <defs>
                <marker id={`${id}-arrow`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="8" markerHeight="8" orient="auto">
                    <path d="M0 0 L10 5 L0 10 z" className="k-arrowhead" />
                </marker>
            </defs>
            <g transform={`translate(${shift} 0)`}>
                {participants.map((p) => (
                    <g key={p.id}>
                        <line x1={p.x} x2={p.x} y1={head} y2={block.h - 6} className="k-lifeline" />
                        <rect x={p.x - boxWidth / 2} y={0} width={boxWidth} height={head} rx={8} className="k-node" />
                        {(p.lines ?? []).map((line, i, all) => (
                            <text key={i} x={p.x} y={head / 2 + (i - (all.length - 1) / 2) * 15 + 5} textAnchor="middle" className="k-node-text">
                                {line}
                            </text>
                        ))}
                    </g>
                ))}
                {steps.map((step, i) => {
                    const text = Array.isArray(step.text) ? step.text : [];
                    if (step.type === 'note') {
                        const h = finite(step.h) ? step.h : text.length * 15 + 12;
                        return (
                            <g key={i}>
                                <rect x={step.x1} y={step.y} width={step.x2 - step.x1} height={h} rx={6} className="k-seq-note" />
                                {text.map((line, j) => (
                                    <text key={j} x={(step.x1 + step.x2) / 2} y={step.y + 17 + j * 15} textAnchor="middle" className="k-edge-label">
                                        {line}
                                    </text>
                                ))}
                            </g>
                        );
                    }
                    if (step.self) {
                        const d = `M${step.x1} ${step.y} h34 v18 h-34`;
                        return (
                            <g key={i}>
                                <path d={d} className={`k-edge${step.dashed ? ' k-edge-dotted' : ''}`} fill="none" markerEnd={`url(#${id}-arrow)`} />
                                {text.map((line, j) => (
                                    <text key={j} x={step.x1 + 42} y={step.y + 4 + j * 15} className="k-edge-label">
                                        {line}
                                    </text>
                                ))}
                            </g>
                        );
                    }
                    const mid = (step.x1 + step.x2) / 2;
                    return (
                        <g key={i}>
                            <line
                                x1={step.x1}
                                x2={step.x2}
                                y1={step.y}
                                y2={step.y}
                                className={`k-edge${step.dashed ? ' k-edge-dotted' : ''}`}
                                markerEnd={`url(#${id}-arrow)`}
                            />
                            {text.map((line, j) => (
                                <text key={j} x={mid} y={step.y - 8 - (text.length - 1 - j) * 15} textAnchor="middle" className="k-edge-label">
                                    {line}
                                </text>
                            ))}
                        </g>
                    );
                })}
            </g>
        </svg>
    );
}

/** A diagram the publisher positioned, drawn as inline SVG. Described for screen readers by its labels. */
export function Diagram({ block }: { block: DiagramBlock }) {
    if (!finite(block.w) || !finite(block.h) || block.w <= 0 || block.h <= 0 || block.w > 20000 || block.h > 20000) return null;
    if (block.kind === 'flow' && Array.isArray(block.nodes) && Array.isArray(block.edges)) {
        return (
            <figure className="k-diagram" role="img" aria-label={describeFlow(block.nodes)}>
                <div className="k-diagram-scroll">
                    <FlowDiagram block={block} />
                </div>
            </figure>
        );
    }
    if (block.kind === 'sequence' && Array.isArray(block.participants) && Array.isArray(block.steps)) {
        const names = block.participants.map((p) => (p.lines ?? []).join(' ')).filter(Boolean).join(', ');
        return (
            <figure className="k-diagram" role="img" aria-label={`Sequence diagram between ${names}`}>
                <div className="k-diagram-scroll">
                    <SequenceDiagram block={block} />
                </div>
            </figure>
        );
    }
    return null;
}
