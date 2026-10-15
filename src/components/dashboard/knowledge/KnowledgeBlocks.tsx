import { Link } from 'react-router-dom';
import type { Inline, KnowledgeBlock, ListItem } from '../../../api/knowledgeTypes.ts';
import { Diagram } from './KnowledgeDiagram';
import { inlineText, pageHref, rowMarkKey, safeHref, type Mark } from './knowledgeModel.ts';
import { useMarks } from './useKnowledge';

/*
 * Renders a page body. Every node comes from a document and is treated as untrusted: nothing is
 * injected as HTML, links are followed only for http(s) and mailto, and an unknown node renders
 * nothing instead of failing the page.
 */

// ── inline ───────────────────────────────────────────────────────────────────

export function InlineView({ nodes }: { nodes: Inline[] | undefined }) {
    if (!Array.isArray(nodes)) return null;
    return (
        <>
            {nodes.map((node, index) => (
                <InlineNodeView key={index} node={node} />
            ))}
        </>
    );
}

function InlineNodeView({ node }: { node: Inline }) {
    if (typeof node === 'string') return <>{node}</>;
    if (!node || typeof node !== 'object') return null;
    switch (node.t) {
        case 'b':
            return (
                <strong>
                    <InlineView nodes={node.c} />
                </strong>
            );
        case 'i':
            return (
                <em>
                    <InlineView nodes={node.c} />
                </em>
            );
        case 's':
            return (
                <s>
                    <InlineView nodes={node.c} />
                </s>
            );
        case 'code':
            return <code className="k-code">{String(node.v)}</code>;
        case 'br':
            return <br />;
        case 'a':
            return typeof node.href === 'string' && safeHref(node.href) ? (
                <a href={node.href} target="_blank" rel="noopener noreferrer" className="k-link">
                    <InlineView nodes={node.c} />
                </a>
            ) : (
                <InlineView nodes={node.c} />
            );
        case 'ref':
            return typeof node.slug === 'string' ? (
                <Link
                    to={pageHref(node.slug, typeof node.anchor === 'string' ? node.anchor : undefined)}
                    className={node.auto ? 'k-ref k-ref-auto' : 'k-ref'}
                    title={node.auto ? 'Suggested link: this page mentions the topic' : undefined}
                >
                    <InlineView nodes={node.c} />
                </Link>
            ) : (
                <InlineView nodes={node.c} />
            );
        case 'missing':
            return (
                <span className="k-missing" title="Not in the library: one of your own notes, or not written yet">
                    <InlineView nodes={node.c} />
                </span>
            );
        default:
            return null;
    }
}

// ── pieces ───────────────────────────────────────────────────────────────────

const MARK_GLYPH: Record<Mark, string> = { '': '·', U: 'U', P: 'P', X: '✕' };
const MARK_LABEL: Record<Mark, string> = {
    '': 'not scored',
    U: 'said it unprompted',
    P: 'explained it once named',
    X: 'blank when named',
};

function MarkButton({ markKey, subject }: { markKey: string; subject: string }) {
    const marks = useMarks();
    const mark = marks.get(markKey);
    return (
        <button
            type="button"
            className="k-mark"
            data-mark={mark}
            onClick={() => marks.cycle(markKey)}
            aria-label={`${subject}: ${MARK_LABEL[mark]}. Tap to change.`}
        >
            {MARK_GLYPH[mark]}
        </button>
    );
}

const CHECK_GLYPH: Record<string, string> = { done: '✓', partial: '◐', todo: '○' };
const CHECK_LABEL: Record<string, string> = { done: 'Written', partial: 'Partly covered', todo: 'Not written' };

function ListView({ block }: { block: Extract<KnowledgeBlock, { t: 'ul' | 'ol' }> }) {
    const Tag = block.t === 'ol' ? 'ol' : 'ul';
    return (
        <Tag className={`k-list${block.t === 'ol' ? ' k-list-ordered' : ''}`}>
            {(Array.isArray(block.items) ? block.items : []).map((item: ListItem, index) => {
                const state = item.checked && CHECK_GLYPH[item.checked] ? item.checked : null;
                return (
                    <li key={index} data-check={state ?? undefined}>
                        {state && (
                            <span className="k-check" role="img" aria-label={CHECK_LABEL[state]}>
                                {CHECK_GLYPH[state]}
                            </span>
                        )}
                        <InlineView nodes={item.c} />
                        {item.children && item.children.length > 0 && <BlockList blocks={item.children} />}
                    </li>
                );
            })}
        </Tag>
    );
}

function TableView({ block }: { block: Extract<KnowledgeBlock, { t: 'table' }> }) {
    const head = Array.isArray(block.head) ? block.head : [];
    const rows = Array.isArray(block.rows) ? block.rows : [];
    const labels = head.map((cell) => inlineText(cell));
    const scoreColumn = typeof block.marks === 'number' ? block.marks : -1;
    return (
        <div className="k-table-wrap">
            {scoreColumn >= 0 && (
                <p className="k-table-legend">
                    Tap the last column to score each one: <b>U</b> I can explain it, <b>P</b> I know the idea but not the word,{' '}
                    <b>✕</b> blank. Saved on this device.
                </p>
            )}
            <div className="k-table">
                <table>
                    <thead>
                        <tr>
                            {head.map((cell, c) => (
                                <th key={c} scope="col">
                                    <InlineView nodes={cell} />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, r) => (
                            <tr key={r}>
                                {(Array.isArray(row) ? row : []).map((cell, c) => (
                                    <td key={c} data-label={labels[c] || undefined} data-score={c === scoreColumn ? '' : undefined}>
                                        {c === scoreColumn ? (
                                            <MarkButton markKey={rowMarkKey(row, scoreColumn)} subject={inlineText(row[0]) || `Row ${r + 1}`} />
                                        ) : (
                                            <InlineView nodes={cell} />
                                        )}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function LadderView({ block }: { block: Extract<KnowledgeBlock, { t: 'ladder' }> }) {
    const answerLabel = block.labels?.a?.trim() || 'What they want to hear';
    return (
        <ol className="k-ladder">
            {(Array.isArray(block.items) ? block.items : []).map((item, index) => (
                <li key={`${item.id}-${index}`}>
                    <details className="k-probe">
                        <summary>
                            <span className="k-probe-id">{item.id}</span>
                            <span className="k-probe-q">
                                <InlineView nodes={item.q} />
                            </span>
                        </summary>
                        <div className="k-probe-a">
                            <span className="k-label">{answerLabel}</span>
                            <p>
                                <InlineView nodes={item.a} />
                            </p>
                        </div>
                    </details>
                </li>
            ))}
        </ol>
    );
}

function TermsView({ block }: { block: Extract<KnowledgeBlock, { t: 'terms' }> }) {
    const marks = useMarks();
    return (
        <ul className="k-terms">
            {(Array.isArray(block.items) ? block.items : []).map((term, index) => {
                const text = inlineText(term).trim();
                const key = `term:${text}`;
                const mark = marks.get(key);
                return (
                    <li key={index}>
                        <button
                            type="button"
                            className="k-term"
                            data-mark={mark}
                            onClick={() => marks.cycle(key)}
                            aria-label={`${text}: ${MARK_LABEL[mark]}. Tap to change.`}
                        >
                            <span className="k-term-mark">{MARK_GLYPH[mark]}</span>
                            <span>{text}</span>
                        </button>
                    </li>
                );
            })}
        </ul>
    );
}

const TONES = new Set(['note', 'tip', 'warning', 'caution', 'danger', 'important', 'example', 'quote', 'success', 'lead', 'info']);

const SECTION_INTRO: Record<string, string> = {
    ladder: 'Answer each probe out loud first, then open it to see the term the interviewer is listening for.',
    terms: 'Tap a term after a mock to score yourself. U: said it unprompted. P: explained it once named. ✕: blank when named. Saved on this device.',
    check: 'Answer out loud, without looking.',
};

const SECTION_TITLES: Record<string, string> = {
    sits: 'Where this sits',
    scoring: 'How you are scored',
    story: 'Your story to cite',
    terms: 'Terms to say out loud',
};

function SectionView({ block }: { block: Extract<KnowledgeBlock, { t: 'section' }> }) {
    const variant = typeof block.variant === 'string' ? block.variant : 'plain';
    const title = block.title || SECTION_TITLES[variant];

    if (variant === 'reveal') {
        return (
            <details id={block.id} className="k-reveal" data-variant="reveal">
                <summary>
                    <span>{title}</span>
                    <span className="k-reveal-hint">Open it after you have answered out loud</span>
                </summary>
                <div className="k-reveal-body">
                    <BlockList blocks={block.c} />
                </div>
            </details>
        );
    }
    return (
        <section id={block.id} className="k-section" data-variant={variant}>
            {title && <h2 className="k-section-title">{title}</h2>}
            {SECTION_INTRO[variant] && <p className="k-section-intro">{SECTION_INTRO[variant]}</p>}
            <BlockList blocks={block.c} />
        </section>
    );
}

// ── blocks ───────────────────────────────────────────────────────────────────

export function BlockList({ blocks }: { blocks: KnowledgeBlock[] | undefined }) {
    if (!Array.isArray(blocks)) return null;
    return (
        <>
            {blocks.map((block, index) => (
                <BlockView key={index} block={block} />
            ))}
        </>
    );
}

function BlockView({ block }: { block: KnowledgeBlock }) {
    if (!block || typeof block !== 'object') return null;
    switch (block.t) {
        case 'p':
            return (
                <p className="k-p">
                    <InlineView nodes={block.c} />
                </p>
            );
        case 'h': {
            const level = block.level <= 2 ? 2 : block.level === 3 ? 3 : 4;
            const Tag = `h${level}` as 'h2' | 'h3' | 'h4';
            return (
                <Tag id={block.id} className={`k-h k-h${level}`}>
                    <InlineView nodes={block.c} />
                </Tag>
            );
        }
        case 'ul':
        case 'ol':
            return <ListView block={block} />;
        case 'table':
            return <TableView block={block} />;
        case 'code':
            return (
                <pre className="k-pre" tabIndex={0}>
                    <code>{String(block.text ?? '')}</code>
                </pre>
            );
        case 'quote':
            return (
                <blockquote className="k-quote">
                    <BlockList blocks={block.c} />
                </blockquote>
            );
        case 'callout': {
            const tone = typeof block.tone === 'string' && TONES.has(block.tone) ? block.tone : 'note';
            return (
                <aside className="k-callout" data-tone={tone}>
                    {block.title && <div className="k-callout-title">{block.title}</div>}
                    <BlockList blocks={block.c} />
                </aside>
            );
        }
        case 'section':
            return <SectionView block={block} />;
        case 'hr':
            return <hr className="k-hr" />;
        case 'sits':
            return (
                <dl className="k-sits">
                    {(Array.isArray(block.rows) ? block.rows : []).map((row, index) => (
                        <div key={index} className="k-sits-row">
                            <dt>{row.label}</dt>
                            <dd>
                                <InlineView nodes={row.c} />
                            </dd>
                        </div>
                    ))}
                </dl>
            );
        case 'ladder':
            return <LadderView block={block} />;
        case 'reveal':
            return (
                <details className="k-reveal" data-variant="inline">
                    <summary>
                        <span>{block.title || 'Show the answer'}</span>
                        <span className="k-reveal-hint">{block.hint || 'Open it after you have answered'}</span>
                    </summary>
                    <div className="k-reveal-body">
                        <BlockList blocks={block.c} />
                    </div>
                </details>
            );
        case 'prompt':
            return <pre className="k-prompt">{String(block.text ?? '')}</pre>;
        case 'score':
            return (
                <div className="k-score">
                    {block.strong.length > 0 && (
                        <div className="k-score-col" data-kind="strong">
                            <span className="k-label">Strong</span>
                            <ul>
                                {block.strong.map((entry, index) => (
                                    <li key={index}>
                                        <InlineView nodes={entry} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {block.fail.length > 0 && (
                        <div className="k-score-col" data-kind="fail">
                            <span className="k-label">Fail</span>
                            <ul>
                                {block.fail.map((entry, index) => (
                                    <li key={index}>
                                        <InlineView nodes={entry} />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {block.other && <BlockView block={block.other} />}
                </div>
            );
        case 'terms':
            return <TermsView block={block} />;
        case 'facts':
            return (
                <dl className="k-facts">
                    {(Array.isArray(block.items) ? block.items : []).map((item, index) => (
                        <div key={index}>
                            <dt>{item.k}</dt>
                            <dd>
                                <InlineView nodes={item.c} />
                            </dd>
                        </div>
                    ))}
                </dl>
            );
        case 'diagram':
            return <Diagram block={block} />;
        default:
            return null;
    }
}
