import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, ListTree, X } from 'lucide-react';
import type { KnowledgeBacklink, KnowledgePage, KnowledgeSummary } from '../../../api/knowledgeTypes.ts';
import { BlockList, InlineView } from './KnowledgeBlocks';
import {
    LIBRARY_PATH,
    filterPages,
    formatDate,
    kindLabel,
    neighbours,
    pageHref,
    spaceLabel,
    summaryShownInBody,
} from './knowledgeModel.ts';
import { MarksContext, recordVisit, useKnowledgeIndex, useKnowledgePage, usePageMarks } from './useKnowledge';

/** Scrolls whatever scroll container holds the page (the dashboard shell scrolls an inner div) to the top. */
function scrollParentToTop(element: HTMLElement | null) {
    let node = element?.parentElement ?? null;
    while (node) {
        if (/(auto|scroll)/.test(getComputedStyle(node).overflowY)) {
            node.scrollTo({ top: 0 });
            return;
        }
        node = node.parentElement;
    }
    window.scrollTo({ top: 0 });
}

function jumpTo(id: string) {
    const target = document.getElementById(id);
    if (!target) return;
    const calm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: calm ? 'auto' : 'smooth', block: 'start' });
}

function LibraryDrawer({ pages, current }: { pages: KnowledgeSummary[]; current: KnowledgePage }) {
    const [query, setQuery] = useState('');
    const found = useMemo(() => filterPages(pages, query).slice(0, 12), [pages, query]);
    const siblings = useMemo(() => neighbours(pages, current.slug).siblings, [pages, current.slug]);
    const list = query.trim() ? found : siblings;

    return (
        <div className="k-drawer" id="k-library-drawer">
            <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Find another page"
                aria-label="Find another page"
                autoComplete="off"
                spellCheck={false}
            />
            <p className="k-muted k-drawer-caption">
                {query.trim()
                    ? found.length > 0
                        ? 'Matching pages'
                        : 'No page matches that.'
                    : `More in ${current.group || spaceLabel(current.space)}`}
            </p>
            <ul className="k-drawer-list">
                {list.map((page) => (
                    <li key={page.slug}>
                        <Link to={pageHref(page.slug)} aria-current={page.slug === current.slug ? 'page' : undefined} data-current={page.slug === current.slug || undefined}>
                            <span>{page.title}</span>
                            <span className="k-row-time">{page.read_minutes} min</span>
                        </Link>
                    </li>
                ))}
            </ul>
            <Link to={LIBRARY_PATH} className="k-drawer-all">
                Open the whole library
            </Link>
        </div>
    );
}

function FooterLinks({
    page,
    pages,
    backlinks,
}: {
    page: KnowledgePage;
    pages: KnowledgeSummary[] | null;
    backlinks: KnowledgeBacklink[];
}) {
    const bySlug = useMemo(() => new Map((pages ?? []).map((p) => [p.slug, p])), [pages]);
    const related = (page.body.related ?? []).map((r) => ({ ...r, page: bySlug.get(r.slug) })).filter((r) => r.page);
    const around = pages ? neighbours(pages, page.slug) : null;

    return (
        <footer className="k-foot">
            {around && (around.prev || around.next) && (
                <nav className="k-pager" aria-label="Previous and next in this group">
                    {around.prev ? (
                        <Link to={pageHref(around.prev.slug)} className="k-pager-link" data-dir="prev">
                            <ArrowLeft size={16} aria-hidden="true" />
                            <span>
                                <span className="k-label">Before</span>
                                <span className="k-pager-title">{around.prev.title}</span>
                            </span>
                        </Link>
                    ) : (
                        <span />
                    )}
                    {around.next ? (
                        <Link to={pageHref(around.next.slug)} className="k-pager-link" data-dir="next">
                            <span>
                                <span className="k-label">Next</span>
                                <span className="k-pager-title">{around.next.title}</span>
                            </span>
                            <ArrowRight size={16} aria-hidden="true" />
                        </Link>
                    ) : (
                        <span />
                    )}
                </nav>
            )}

            {related.length > 0 && (
                <section className="k-foot-section" aria-labelledby="k-related">
                    <h2 id="k-related" className="k-group-title">
                        Read next
                    </h2>
                    <p className="k-muted">Pages that share concepts with this one.</p>
                    <ul className="k-rows">
                        {related.map(({ slug, reason, page: target }) => (
                            <li key={slug}>
                                <Link to={pageHref(slug)} className="k-row" data-space={target!.space}>
                                    <span className="k-row-main">
                                        <span className="k-row-title">{target!.title}</span>
                                        <span className="k-row-summary">{reason}</span>
                                    </span>
                                    <span className="k-row-meta">
                                        <span className="k-chip" data-space={target!.space}>
                                            {kindLabel(target!.kind)}
                                        </span>
                                    </span>
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {backlinks.length > 0 && (
                <section className="k-foot-section" aria-labelledby="k-backlinks">
                    <h2 id="k-backlinks" className="k-group-title">
                        Mentioned in <span className="k-count">{backlinks.length}</span>
                    </h2>
                    <p className="k-muted">Pages that link here, so you can see where this idea is used.</p>
                    <ul className="k-pills">
                        {backlinks.map((link) => (
                            <li key={link.slug}>
                                <Link to={pageHref(link.slug)} className="k-pill" data-space={link.space}>
                                    {link.title}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            <p className="k-source">
                {page.source_path ? `From ${page.source_path.replace(/\//g, ' / ')}` : 'From your notes'}
                {page.source_updated ? ` · updated ${formatDate(page.source_updated)}` : ''}
            </p>
        </footer>
    );
}

export function KnowledgePageView({ slug }: { slug: string }) {
    const { data, error, reload } = useKnowledgePage(slug);
    const index = useKnowledgeIndex();
    const marks = usePageMarks(slug);
    const location = useLocation();
    const root = useRef<HTMLDivElement>(null);
    const [libraryOpen, setLibraryOpen] = useState(false);

    useEffect(() => {
        scrollParentToTop(root.current);
    }, []);

    useEffect(() => {
        if (data) recordVisit(slug);
    }, [data, slug]);

    useEffect(() => {
        const anchor = decodeURIComponent(location.hash.replace(/^#/, ''));
        if (data && anchor) window.setTimeout(() => jumpTo(anchor), 0);
    }, [data, location.hash]);

    if (error === 'missing') {
        return (
            <div className="k-shell" ref={root}>
                <Link to={LIBRARY_PATH} className="k-back">
                    <ArrowLeft size={16} aria-hidden="true" /> Library
                </Link>
                <div className="k-notice">
                    <p>That page is not in the library. It may have been renamed or removed from your notes.</p>
                </div>
            </div>
        );
    }
    if (error === 'failed' && !data) {
        return (
            <div className="k-shell" ref={root}>
                <Link to={LIBRARY_PATH} className="k-back">
                    <ArrowLeft size={16} aria-hidden="true" /> Library
                </Link>
                <div className="k-notice">
                    <p>Could not load this page. Check the connection and try again.</p>
                    <button type="button" className="k-button" onClick={reload}>
                        Try again
                    </button>
                </div>
            </div>
        );
    }
    if (!data) {
        return (
            <div className="k-shell" ref={root} aria-busy="true" aria-label="Loading the page">
                <div className="k-skeletons">
                    <div className="dashboard-skeleton" style={{ height: 20, width: '40%' }} />
                    <div className="dashboard-skeleton" style={{ height: 44, width: '75%' }} />
                    <div className="dashboard-skeleton" style={{ height: 120 }} />
                    <div className="dashboard-skeleton" style={{ height: 220 }} />
                </div>
            </div>
        );
    }

    const page = data.page;
    const outline = (page.body.outline ?? []).filter((entry) => entry.level <= 2);
    const spaceHref = `${LIBRARY_PATH}${page.space === 'learn' ? '' : `?space=${page.space}`}`;

    return (
        <MarksContext.Provider value={marks}>
            <div className="k-shell k-page-shell" ref={root} data-space={page.space}>
                <article className="k-article">
                    <header className="k-page-head">
                        <nav className="k-crumbs" aria-label="Where this page is">
                            <Link to={LIBRARY_PATH}>Knowledge</Link>
                            <span aria-hidden="true">›</span>
                            <Link to={spaceHref}>{spaceLabel(page.space)}</Link>
                            {page.group && (
                                <>
                                    <span aria-hidden="true">›</span>
                                    <span>{page.group}</span>
                                </>
                            )}
                        </nav>
                        <div className="k-title-row">
                            <h1 className="k-title">{page.title}</h1>
                        </div>
                        <div className="k-meta">
                            <span className="k-chip" data-space={page.space}>
                                {kindLabel(page.kind)}
                            </span>
                            <span>{page.read_minutes} min read</span>
                            {page.source_updated && <span>Updated {formatDate(page.source_updated)}</span>}
                            <button
                                type="button"
                                className="k-button k-button-quiet"
                                aria-expanded={libraryOpen}
                                aria-controls="k-library-drawer"
                                onClick={() => setLibraryOpen((open) => !open)}
                            >
                                {libraryOpen ? <X size={14} aria-hidden="true" /> : <BookOpen size={14} aria-hidden="true" />}
                                Library
                            </button>
                        </div>
                        {libraryOpen && index.pages && <LibraryDrawer pages={index.pages} current={page} />}
                        {page.summary && !summaryShownInBody(page.summary, page.body.blocks) && (
                            <p className="k-summary">{page.summary}</p>
                        )}
                    </header>

                    {outline.length > 1 && (
                        <details className="k-outline-inline">
                            <summary>
                                <ListTree size={14} aria-hidden="true" /> On this page ({outline.length})
                            </summary>
                            <ol>
                                {outline.map((entry) => (
                                    <li key={entry.id}>
                                        <a
                                            href={`#${entry.id}`}
                                            onClick={(event) => {
                                                event.preventDefault();
                                                jumpTo(entry.id);
                                            }}
                                        >
                                            {entry.text}
                                        </a>
                                    </li>
                                ))}
                            </ol>
                        </details>
                    )}

                    <div className="k-body">
                        <BlockList blocks={page.body.blocks} />
                    </div>

                    <FooterLinks page={page} pages={index.pages} backlinks={data.backlinks} />
                </article>

                {outline.length > 1 && (
                    <aside className="k-outline" aria-label="On this page">
                        <span className="k-label">On this page</span>
                        <ol>
                            {outline.map((entry) => (
                                <li key={entry.id}>
                                    <a
                                        href={`#${entry.id}`}
                                        onClick={(event) => {
                                            event.preventDefault();
                                            jumpTo(entry.id);
                                        }}
                                    >
                                        <InlineView nodes={[entry.text]} />
                                    </a>
                                </li>
                            ))}
                        </ol>
                    </aside>
                )}
            </div>
        </MarksContext.Provider>
    );
}
