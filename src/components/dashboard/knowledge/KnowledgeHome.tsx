import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import type { KnowledgeSearchResult, KnowledgeSummary } from '../../../api/knowledgeTypes.ts';
import {
    SPACES,
    buildSections,
    filterPages,
    highlight,
    isSpace,
    kindLabel,
    pageHref,
    tokenize,
    type SpaceSection,
} from './knowledgeModel.ts';
import { useKnowledgeIndex, useRecentPages, useTextSearch } from './useKnowledge';

function Highlighted({ text, terms }: { text: string; terms: string[] }) {
    return (
        <>
            {highlight(text, terms).map((part, index) =>
                part.match ? (
                    <mark key={index} className="k-hit">
                        {part.text}
                    </mark>
                ) : (
                    <span key={index}>{part.text}</span>
                ),
            )}
        </>
    );
}

function PageRow({ page, terms, snippet }: { page: Pick<KnowledgeSummary, 'slug' | 'title' | 'kind' | 'read_minutes' | 'summary' | 'space' | 'group'>; terms?: string[]; snippet?: string }) {
    return (
        <li>
            <Link to={pageHref(page.slug)} className="k-row" data-space={page.space}>
                <span className="k-row-main">
                    <span className="k-row-title">
                        <Highlighted text={page.title} terms={terms ?? []} />
                    </span>
                    {snippet ? (
                        <span className="k-row-summary">
                            <Highlighted text={snippet} terms={terms ?? []} />
                        </span>
                    ) : (
                        page.summary && <span className="k-row-summary">{page.summary}</span>
                    )}
                </span>
                <span className="k-row-meta">
                    <span className="k-chip" data-space={page.space}>
                        {kindLabel(page.kind)}
                    </span>
                    <span className="k-row-time">{page.read_minutes} min</span>
                </span>
            </Link>
        </li>
    );
}

function Results({ query, pages }: { query: string; pages: KnowledgeSummary[] }) {
    const terms = useMemo(() => tokenize(query), [query]);
    const local = useMemo(() => filterPages(pages, query), [pages, query]);
    const text = useTextSearch(query);
    const known = new Set(local.map((p) => p.slug));
    const inText: KnowledgeSearchResult[] = (text.response?.results ?? []).filter((r) => !known.has(r.slug));
    const tooShort = query.trim().length > 0 && query.trim().length < 3;

    return (
        <div className="k-results">
            <section aria-label="Pages whose title or topic matches">
                <h2 className="k-group-title">
                    Pages <span className="k-count">{local.length}</span>
                </h2>
                {local.length > 0 ? (
                    <ul className="k-rows">
                        {local.slice(0, 30).map((page) => (
                            <PageRow key={page.slug} page={page} terms={terms} />
                        ))}
                    </ul>
                ) : (
                    <p className="k-muted">No page has that in its title, aliases or tags.</p>
                )}
            </section>

            <section aria-label="Pages that mention it in the text">
                <h2 className="k-group-title">
                    In the text {text.response && <span className="k-count">{text.response.total}</span>}
                </h2>
                {tooShort && <p className="k-muted">Type three letters or more to search inside the pages.</p>}
                {text.pending && <p className="k-muted">Searching the text of every page…</p>}
                {text.error && <p className="k-muted">The text search is not available right now. The page titles above still work.</p>}
                {!text.pending && !text.error && text.response && inText.length === 0 && (
                    <p className="k-muted">No other page mentions it.</p>
                )}
                {inText.length > 0 && (
                    <ul className="k-rows">
                        {inText.map((result) => (
                            <PageRow key={result.slug} page={result} terms={terms} snippet={result.snippet || undefined} />
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}

function GroupList({ section }: { section: SpaceSection }) {
    if (section.groups.length === 0) {
        return <p className="k-muted">Nothing is published in this part of the library yet.</p>;
    }
    const openByDefault = (label: string) => section.groups.length === 1 || /^start here$/i.test(label);
    return (
        <div className="k-groups">
            {section.groups.map((group) => (
                <details key={group.label} className="k-group" open={openByDefault(group.label)}>
                    <summary>
                        <span className="k-group-name">{group.label}</span>
                        <span className="k-count">{group.pages.length}</span>
                    </summary>
                    <ul className="k-rows">
                        {group.pages.map((page) => (
                            <PageRow key={page.slug} page={page} />
                        ))}
                    </ul>
                </details>
            ))}
        </div>
    );
}

export function KnowledgeHome() {
    const { pages, error, reload } = useKnowledgeIndex();
    const [params, setParams] = useSearchParams();
    const [query, setQuery] = useState('');
    const recentSlugs = useRecentPages();

    const sections = useMemo(() => buildSections(pages ?? []), [pages]);
    const requested = params.get('space') ?? '';
    const active = isSpace(requested) ? requested : 'learn';
    const section = sections.find((s) => s.space.id === active) ?? sections[0];
    const recent = useMemo(() => {
        const bySlug = new Map((pages ?? []).map((p) => [p.slug, p]));
        return recentSlugs.map((slug) => bySlug.get(slug)).filter((p): p is KnowledgeSummary => Boolean(p)).slice(0, 5);
    }, [pages, recentSlugs]);
    const searching = query.trim() !== '';

    return (
        <div className="k-shell">
            <header className="k-home-head">
                <div>
                    <h1 className="k-home-title">Knowledge</h1>
                    <p className="k-muted">
                        {pages
                            ? `${pages.length} pages from your notes: lessons to study, ideas to look up, and interview cases to practise.`
                            : 'Your notes, indexed and linked.'}
                    </p>
                </div>
            </header>

            <div className="k-search">
                <Search size={18} aria-hidden="true" />
                <input
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search titles, topics and the text of every page"
                    aria-label="Search the library"
                    autoComplete="off"
                    spellCheck={false}
                />
                {searching && (
                    <button type="button" className="k-search-clear" onClick={() => setQuery('')} aria-label="Clear the search">
                        <X size={16} />
                    </button>
                )}
            </div>

            {error && !pages && (
                <div className="k-notice">
                    <p>Could not load the library. Check the connection and try again.</p>
                    <button type="button" className="k-button" onClick={reload}>
                        Try again
                    </button>
                </div>
            )}

            {!pages && !error && (
                <div className="k-skeletons" aria-busy="true" aria-label="Loading the library">
                    <div className="dashboard-skeleton" style={{ height: 44 }} />
                    <div className="dashboard-skeleton" style={{ height: 88 }} />
                    <div className="dashboard-skeleton" style={{ height: 88 }} />
                </div>
            )}

            {pages && pages.length === 0 && (
                <div className="k-notice">
                    <p>Nothing is published yet. Run the vault publisher and the notes appear here.</p>
                </div>
            )}

            {pages && pages.length > 0 && searching && <Results query={query} pages={pages} />}

            {pages && pages.length > 0 && !searching && (
                <>
                    {recent.length > 0 && (
                        <section className="k-recent" aria-label="Recently read">
                            <h2 className="k-group-title">Continue reading</h2>
                            <ul className="k-recent-list">
                                {recent.map((page) => (
                                    <li key={page.slug}>
                                        <Link to={pageHref(page.slug)} className="k-recent-link" data-space={page.space}>
                                            {page.title}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    )}

                    <div className="k-tabs" role="group" aria-label="Part of the library">
                        {sections.map((s) => (
                            <button
                                key={s.space.id}
                                type="button"
                                aria-pressed={s.space.id === active}
                                className="k-tab"
                                data-space={s.space.id}
                                onClick={() => setParams(s.space.id === 'learn' ? {} : { space: s.space.id }, { replace: true })}
                            >
                                <span className="k-tab-label">{s.space.label}</span>
                                <span className="k-count">{s.count}</span>
                            </button>
                        ))}
                    </div>
                    <p className="k-muted k-tab-blurb">{SPACES.find((s) => s.id === active)?.blurb}</p>
                    {section && <GroupList section={section} />}
                </>
            )}
        </div>
    );
}
