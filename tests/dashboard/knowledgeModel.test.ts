import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { KnowledgeBlock, KnowledgeSummary } from '../../src/api/knowledgeTypes.ts';
import {
    buildSections,
    filterPages,
    formatDate,
    highlight,
    inlineText,
    kindLabel,
    loadMarks,
    loadRecent,
    neighbours,
    nextMark,
    pageHref,
    pushRecent,
    rowMarkKey,
    safeHref,
    saveMark,
    slugFromPath,
    summaryShownInBody,
    tokenize,
    type StorageLike,
} from '../../src/components/dashboard/knowledge/knowledgeModel.ts';

function page(slug: string, overrides: Partial<KnowledgeSummary> = {}): KnowledgeSummary {
    const [space] = slug.split('/');
    return {
        slug,
        space,
        kind: 'concept',
        title: slug.split('/').pop() ?? slug,
        group: 'Backend',
        group_order: 1,
        order: 1,
        domain: null,
        summary: '',
        read_minutes: 3,
        tags: [],
        aliases: [],
        source_updated: null,
        ...overrides,
    };
}

function memoryStorage(initial: Record<string, string> = {}): StorageLike & { data: Record<string, string> } {
    const data = { ...initial };
    return {
        data,
        getItem: (key) => (key in data ? data[key] : null),
        setItem: (key, value) => {
            data[key] = value;
        },
    };
}

describe('buildSections', () => {
    it('groups each space by folder and orders groups, then pages by their order and title', () => {
        const sections = buildSections([
            page('learn/2-agentic/b', { group: 'Agentic', group_order: 2, order: 2000, title: 'B' }),
            page('learn/1-backend/z', { group: 'Backend', group_order: 1, order: 1002, title: 'Z' }),
            page('learn/1-backend/a', { group: 'Backend', group_order: 1, order: 1001, title: 'A' }),
            page('reference/frontend/hydration', { group: 'Frontend', title: 'Hydration' }),
        ]);

        const learn = sections.find((s) => s.space.id === 'learn')!;
        assert.equal(learn.count, 3);
        assert.deepEqual(learn.groups.map((g) => g.label), ['Backend', 'Agentic']);
        assert.deepEqual(learn.groups[0].pages.map((p) => p.title), ['A', 'Z']);
        assert.equal(sections.find((s) => s.space.id === 'practice')!.count, 0);
        assert.deepEqual(sections.map((s) => s.space.label), ['Learn', 'Look up', 'Practise']);
    });
});

describe('neighbours', () => {
    const pages = [
        page('learn/1-backend/a', { order: 1, title: 'A' }),
        page('learn/1-backend/b', { order: 2, title: 'B' }),
        page('learn/1-backend/c', { order: 3, title: 'C' }),
        page('learn/2-agentic/x', { group: 'Agentic', order: 1, title: 'X' }),
    ];

    it('finds the previous and next page inside the same group only', () => {
        const middle = neighbours(pages, 'learn/1-backend/b');
        assert.equal(middle.prev?.title, 'A');
        assert.equal(middle.next?.title, 'C');
        assert.equal(middle.siblings.length, 3);

        const last = neighbours(pages, 'learn/1-backend/c');
        assert.equal(last.next, null);
        assert.equal(neighbours(pages, 'learn/2-agentic/x').prev, null);
    });

    it('returns nothing for a slug that is not in the index', () => {
        assert.deepEqual(neighbours(pages, 'learn/9/none'), { prev: null, next: null, siblings: [] });
    });
});

describe('filterPages', () => {
    const pages = [
        page('reference/backend/idempotency', { title: 'Idempotency', aliases: ['idempotency key', 'idempotent'], summary: 'Doing it twice is safe.' }),
        page('reference/backend/dlq', { title: 'Dead letter queue (DLQ)', aliases: ['DLQ'], tags: ['reliability'], summary: 'Where poison messages go.' }),
        page('learn/1-backend/queues', { title: '1.4 Queues and retries', summary: 'Make handlers idempotent.' }),
        page('reference/ops/trace', { title: 'Trace ids', summary: 'Follow a request.' }),
    ];

    it('matches the start of a word, ranks a title hit above a summary hit', () => {
        const result = filterPages(pages, 'idemp');
        assert.deepEqual(result.map((p) => p.slug), ['reference/backend/idempotency', 'learn/1-backend/queues']);
    });

    it('does not match the middle of a word', () => {
        assert.deepEqual(filterPages(pages, 'race'), []);
    });

    it('requires every term and looks through aliases and tags', () => {
        assert.deepEqual(filterPages(pages, 'dlq reliability').map((p) => p.slug), ['reference/backend/dlq']);
        assert.deepEqual(filterPages(pages, 'dlq nonsense'), []);
    });

    it('returns nothing for an empty query', () => {
        assert.deepEqual(filterPages(pages, '   '), []);
    });
});

describe('tokenize and highlight', () => {
    it('lowercases, keeps c++ style tokens and drops repeats', () => {
        assert.deepEqual(tokenize('Race, race! C++ lock'), ['race', 'c++', 'lock']);
    });

    it('marks the start of each matching word and keeps the rest', () => {
        const parts = highlight('Make handlers idempotent, then retry', ['idemp', 'retry']);
        assert.deepEqual(parts.filter((p) => p.match).map((p) => p.text), ['idemp', 'retry']);
        assert.equal(parts.map((p) => p.text).join(''), 'Make handlers idempotent, then retry');
    });

    it('does not mark a match in the middle of a word', () => {
        assert.deepEqual(highlight('trace', ['race']), [{ text: 'trace', match: false }]);
    });
});

describe('links', () => {
    it('builds page links with an optional anchor', () => {
        assert.equal(pageHref('reference/backend/idempotency'), '/dashboard/knowledge/reference/backend/idempotency');
        assert.equal(pageHref('learn/1-backend/a', 'the-trap'), '/dashboard/knowledge/learn/1-backend/a#the-trap');
    });

    it('trims slashes from the router splat', () => {
        assert.equal(slugFromPath('/learn/1-backend/a/'), 'learn/1-backend/a');
        assert.equal(slugFromPath(undefined), '');
    });

    it('follows only web and mail links', () => {
        assert.equal(safeHref('https://nextjs.org/docs'), true);
        assert.equal(safeHref('mailto:a@b.co'), true);
        assert.equal(safeHref('javascript:alert(1)'), false);
        assert.equal(safeHref('data:text/html;base64,AA'), false);
        assert.equal(safeHref('/relative'), false);
    });

    it('formats an ISO date without drifting a day across time zones', () => {
        assert.match(formatDate('2026-09-30'), /^30 Sep(t)? 2026$/);
        assert.equal(formatDate(null), '');
        assert.equal(formatDate('not a date'), '');
    });

    it('names every kind the publisher produces', () => {
        for (const kind of ['topic', 'concept', 'decision', 'catalogue', 'moc', 'case', 'session']) {
            assert.notEqual(kindLabel(kind), kind);
        }
        assert.equal(kindLabel('something-new'), 'something-new');
    });
});

describe('marks', () => {
    it('cycles unscored, U, P, X and back', () => {
        assert.equal(nextMark(''), 'U');
        assert.equal(nextMark('U'), 'P');
        assert.equal(nextMark('P'), 'X');
        assert.equal(nextMark('X'), '');
    });

    it('stores a mark per row key and page, and clears it with an empty mark', () => {
        const storage = memoryStorage();
        assert.deepEqual(saveMark(storage, 'learn/q', 'A1', 'U'), { A1: 'U' });
        assert.deepEqual(saveMark(storage, 'learn/q', 'A2', 'X'), { A1: 'U', A2: 'X' });
        assert.deepEqual(loadMarks(storage, 'learn/q'), { A1: 'U', A2: 'X' });
        assert.deepEqual(loadMarks(storage, 'learn/other'), {});
        assert.deepEqual(saveMark(storage, 'learn/q', 'A1', ''), { A2: 'X' });
    });

    it('ignores damaged storage and works without any', () => {
        assert.deepEqual(loadMarks(memoryStorage({ 'knowledge_marks_v1:p': '{not json' }), 'p'), {});
        assert.deepEqual(loadMarks(memoryStorage({ 'knowledge_marks_v1:p': '{"a":"Z","b":"P"}' }), 'p'), { b: 'P' });
        assert.deepEqual(loadMarks(null, 'p'), {});
        assert.deepEqual(saveMark(null, 'p', 'a', 'U'), { a: 'U' });
    });

    it('survives a storage that throws on write', () => {
        const storage: StorageLike = {
            getItem: () => null,
            setItem: () => {
                throw new Error('quota');
            },
        };
        assert.deepEqual(saveMark(storage, 'p', 'a', 'P'), { a: 'P' });
    });
});

describe('recent pages', () => {
    it('moves a page to the front, removes duplicates and caps the list', () => {
        assert.deepEqual(pushRecent(['b', 'a'], 'a'), ['a', 'b']);
        assert.deepEqual(pushRecent(['c', 'b', 'a'], 'd', 3), ['d', 'c', 'b']);
    });

    it('reads a damaged list as empty', () => {
        assert.deepEqual(loadRecent(memoryStorage({ knowledge_recent_v1: '{"x":1}' })), []);
        assert.deepEqual(loadRecent(memoryStorage({ knowledge_recent_v1: '["a",2,"b"]' })), ['a', 'b']);
        assert.deepEqual(loadRecent(null), []);
    });
});

describe('inlineText and rowMarkKey', () => {
    it('flattens formatting, links and code to plain text', () => {
        assert.equal(
            inlineText(['Use ', { t: 'b', c: ['a ', { t: 'code', v: 'row lock' }] }, { t: 'br' }, { t: 'ref', slug: 'x/y', c: ['Idempotency'] }]),
            'Use a row lock Idempotency',
        );
        assert.equal(inlineText(undefined), '');
    });

    it('keys a table row by its id and the text of its other cells, not its position or its score', () => {
        const row = [['A1'], ['What is idempotency?'], ['U']];
        const same = [['A1'], ['What is idempotency?'], ['P']];
        const other = [['A1'], ['A different question'], ['']];
        assert.equal(rowMarkKey(row, 2), rowMarkKey(same, 2));
        assert.notEqual(rowMarkKey(row, 2), rowMarkKey(other, 2));
        assert.ok(rowMarkKey(row, 2).startsWith('A1:'));
    });
});

describe('summaryShownInBody', () => {
    const summary = 'SSG prepares HTML before requests; SSR produces it during a request; CSR builds UI in the browser.';

    it('is true when a summary panel at the top of the body says the same thing', () => {
        const blocks: KnowledgeBlock[] = [
            { t: 'facts', items: [{ k: 'Session', c: ['15 min'] }] },
            { t: 'section', variant: 'summary', title: 'Remind me', c: [{ t: 'p', c: [{ t: 'b', c: ['SSG'] }, ' prepares HTML before requests; SSR produces it during a request; CSR builds UI in the browser. More.'] }] },
        ];
        assert.equal(summaryShownInBody(summary, blocks), true);
    });

    it('is false when the body does not open with it, or the summary is too short to compare', () => {
        assert.equal(summaryShownInBody(summary, [{ t: 'p', c: ['Something else entirely, written for this page.'] }]), false);
        assert.equal(summaryShownInBody('Too short', [{ t: 'p', c: ['Too short'] }]), false);
    });
});
