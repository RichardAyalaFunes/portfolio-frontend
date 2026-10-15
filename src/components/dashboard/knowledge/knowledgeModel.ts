/**
 * Pure helpers for the knowledge library: grouping the index into spaces and groups, filtering it
 * as you type, finding the neighbours of a page, building links, and the small amount of state that
 * lives in the browser (self-scores and recently read pages).
 *
 * No React and no runtime imports besides types, so `npm test` runs these with Node's built-in
 * runner. Storage is injectable and every access is guarded: localStorage can be missing or throw,
 * and the library must read fine without it.
 */

import type { Inline, KnowledgeBlock, KnowledgeSpace, KnowledgeSummary } from '../../../api/knowledgeTypes.ts';

// ── spaces and kinds ─────────────────────────────────────────────────────────

export interface SpaceInfo {
    id: KnowledgeSpace;
    label: string;
    blurb: string;
}

export const SPACES: SpaceInfo[] = [
    { id: 'learn', label: 'Learn', blurb: 'Lessons in order, the roadmap and the diagnostic quiz' },
    { id: 'reference', label: 'Look up', blurb: 'One idea per page, and when to pick X over Y' },
    { id: 'practice', label: 'Practise', blurb: 'Interview cases by role, with probe ladders' },
];

export function isSpace(value: string): value is KnowledgeSpace {
    return value === 'learn' || value === 'reference' || value === 'practice';
}

export function spaceLabel(space: string): string {
    return SPACES.find((s) => s.id === space)?.label ?? space;
}

const KIND_LABELS: Record<string, string> = {
    topic: 'Lesson',
    concept: 'Concept',
    decision: 'Decision',
    catalogue: 'Catalogue',
    moc: 'Map',
    roadmap: 'Roadmap',
    hub: 'Start here',
    coverage: 'Coverage map',
    index: 'Index',
    'cheat-sheet': 'Cheat sheet',
    quiz: 'Quiz',
    debrief: 'Debrief',
    case: 'Case',
    session: 'Session',
    guide: 'Guide',
    note: 'Note',
};

export function kindLabel(kind: string): string {
    return KIND_LABELS[kind] ?? kind;
}

// ── grouping ─────────────────────────────────────────────────────────────────

export interface PageGroup {
    label: string;
    order: number;
    pages: KnowledgeSummary[];
}

export interface SpaceSection {
    space: SpaceInfo;
    count: number;
    groups: PageGroup[];
}

function byOrder(a: KnowledgeSummary, b: KnowledgeSummary): number {
    return a.order - b.order || a.title.localeCompare(b.title);
}

/** The index as the three spaces, each with its groups (folders or packs) and their pages in order. */
export function buildSections(pages: KnowledgeSummary[]): SpaceSection[] {
    return SPACES.map((space) => {
        const inSpace = pages.filter((p) => p.space === space.id);
        const groups = new Map<string, PageGroup>();
        for (const page of inSpace) {
            const group = groups.get(page.group) ?? { label: page.group, order: page.group_order, pages: [] };
            group.pages.push(page);
            groups.set(page.group, group);
        }
        const ordered = [...groups.values()]
            .map((g) => ({ ...g, pages: [...g.pages].sort(byOrder) }))
            .sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
        return { space, count: inSpace.length, groups: ordered };
    });
}

export interface Neighbours {
    prev: KnowledgeSummary | null;
    next: KnowledgeSummary | null;
    /** Every page in the same space and group, in reading order (the page itself included). */
    siblings: KnowledgeSummary[];
}

export function neighbours(pages: KnowledgeSummary[], slug: string): Neighbours {
    const current = pages.find((p) => p.slug === slug);
    if (!current) return { prev: null, next: null, siblings: [] };
    const siblings = pages.filter((p) => p.space === current.space && p.group === current.group).sort(byOrder);
    const index = siblings.findIndex((p) => p.slug === slug);
    return {
        prev: index > 0 ? siblings[index - 1] : null,
        next: index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null,
        siblings,
    };
}

// ── search ───────────────────────────────────────────────────────────────────

const WORD_CHAR = /[\p{L}\p{N}]/u;

export function tokenize(query: string): string[] {
    const seen: string[] = [];
    for (const token of query.toLowerCase().match(/[\p{L}\p{N}+#]+/gu) ?? []) {
        if (token.length >= 1 && !seen.includes(token)) seen.push(token);
    }
    return seen.slice(0, 6);
}

function startsWord(haystack: string, token: string): boolean {
    let from = 0;
    for (;;) {
        const at = haystack.indexOf(token, from);
        if (at === -1) return false;
        if (at === 0 || !WORD_CHAR.test(haystack[at - 1])) return true;
        from = at + 1;
    }
}

/**
 * As-you-type filter over the index. Every term must start a word somewhere in the title, an
 * alias, a tag or the summary. Ranked: title, then alias, then tag, then summary.
 */
export function filterPages(pages: KnowledgeSummary[], query: string): KnowledgeSummary[] {
    const tokens = tokenize(query);
    if (tokens.length === 0) return [];
    const scored: { page: KnowledgeSummary; score: number }[] = [];
    for (const page of pages) {
        const title = page.title.toLowerCase();
        const aliases = page.aliases.join('\n').toLowerCase();
        const tags = page.tags.join('\n').toLowerCase();
        const summary = page.summary.toLowerCase();
        let score = 0;
        let all = true;
        for (const token of tokens) {
            if (startsWord(title, token)) score += 100;
            else if (startsWord(aliases, token)) score += 40;
            else if (startsWord(tags, token)) score += 15;
            else if (startsWord(summary, token)) score += 5;
            else {
                all = false;
                break;
            }
        }
        if (all) scored.push({ page, score });
    }
    return scored.sort((a, b) => b.score - a.score || a.page.title.localeCompare(b.page.title)).map((s) => s.page);
}

export interface HighlightPart {
    text: string;
    match: boolean;
}

/** Split `text` into parts so the beginnings of words that match a search term can be marked. */
export function highlight(text: string, terms: string[]): HighlightPart[] {
    const usable = terms.filter(Boolean);
    if (usable.length === 0 || text === '') return [{ text, match: false }];
    const escaped = usable.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(?:${escaped.join('|')})`, 'giu');
    const parts: HighlightPart[] = [];
    let cursor = 0;
    for (const match of text.matchAll(pattern)) {
        const start = match.index ?? 0;
        if (start > cursor) parts.push({ text: text.slice(cursor, start), match: false });
        parts.push({ text: match[0], match: true });
        cursor = start + match[0].length;
    }
    if (cursor < text.length) parts.push({ text: text.slice(cursor), match: false });
    return parts.length ? parts : [{ text, match: false }];
}

// ── links ────────────────────────────────────────────────────────────────────

export const LIBRARY_PATH = '/dashboard/knowledge';

export function pageHref(slug: string, anchor?: string): string {
    return `${LIBRARY_PATH}/${slug}${anchor ? `#${anchor}` : ''}`;
}

/** The slug in the router's splat (`learn/1-backend/...`), without stray slashes. */
export function slugFromPath(splat: string | undefined): string {
    return (splat ?? '').replace(/^\/+|\/+$/g, '');
}

/** Only web and mail links from a document are followed; anything else is shown as text. */
export function safeHref(href: string): boolean {
    return /^(https?:\/\/|mailto:)/i.test(href);
}

export function formatDate(iso: string | null): string {
    if (!iso) return '';
    const date = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

// ── inline text ──────────────────────────────────────────────────────────────

/** The plain text of an inline array: labels for table cells, keys for self-scores, search. */
export function inlineText(nodes: Inline[] | undefined): string {
    if (!Array.isArray(nodes)) return '';
    let out = '';
    for (const node of nodes) {
        if (typeof node === 'string') out += node;
        else if (node && typeof node === 'object') {
            if (node.t === 'br') out += ' ';
            else if (node.t === 'code') out += node.v;
            else if ('c' in node) out += inlineText(node.c);
        }
    }
    return out;
}

function fnv1a(text: string): string {
    let hash = 0x811c9dc5;
    for (let i = 0; i < text.length; i += 1) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 0x01000193) >>> 0;
    }
    return hash.toString(36);
}

/**
 * A key for one row of a self-score table, stable if rows are reordered or the page is republished:
 * the row's id (first cell) plus a hash of the rest of its text, without the score column itself.
 */
export function rowMarkKey(row: Inline[][], scoreColumn: number): string {
    const cells = row.map((cell) => inlineText(cell).trim());
    const id = cells[0] ?? '';
    const rest = cells.filter((_, index) => index !== scoreColumn).join('|');
    return `${id}:${fnv1a(rest)}`;
}

function squash(text: string): string {
    return text.toLowerCase().replace(/\s+/g, ' ').replace(/^["'“‘\s]+/, '').trim();
}

/**
 * True when the page body already opens with the summary (a lesson's "Remind me in 60 seconds", a
 * concept's "In one line"), so the header does not say the same thing twice right above it.
 */
export function summaryShownInBody(summary: string, blocks: KnowledgeBlock[]): boolean {
    const wanted = squash(summary).slice(0, 60);
    if (wanted.length < 20) return false;
    const paragraphs: string[] = [];
    const collect = (list: KnowledgeBlock[], depth: number) => {
        for (const block of list) {
            if (block.t === 'p') paragraphs.push(squash(inlineText(block.c)));
            else if ((block.t === 'callout' || block.t === 'section' || block.t === 'quote' || block.t === 'reveal') && depth < 2) {
                collect(block.c, depth + 1);
            }
        }
    };
    collect(blocks.slice(0, 4), 0);
    return paragraphs.some((text) => text.startsWith(wanted));
}

// ── browser state ────────────────────────────────────────────────────────────

export interface StorageLike {
    getItem(key: string): string | null;
    setItem(key: string, value: string): void;
}

/** U can explain it, P knows the idea but not the word, X blank. '' is not scored yet. */
export type Mark = '' | 'U' | 'P' | 'X';

const MARK_ORDER: Mark[] = ['', 'U', 'P', 'X'];

export function nextMark(mark: Mark): Mark {
    return MARK_ORDER[(MARK_ORDER.indexOf(mark) + 1) % MARK_ORDER.length];
}

function isMark(value: unknown): value is Exclude<Mark, ''> {
    return value === 'U' || value === 'P' || value === 'X';
}

const MARKS_PREFIX = 'knowledge_marks_v1:';
const RECENT_KEY = 'knowledge_recent_v1';

export function loadMarks(storage: StorageLike | null, slug: string): Record<string, Mark> {
    if (!storage) return {};
    try {
        const parsed: unknown = JSON.parse(storage.getItem(`${MARKS_PREFIX}${slug}`) ?? '{}');
        if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {};
        const out: Record<string, Mark> = {};
        for (const [key, value] of Object.entries(parsed)) if (isMark(value)) out[key] = value;
        return out;
    } catch {
        return {};
    }
}

/** Store one mark (an empty mark clears it) and return the page's marks as they are now. */
export function saveMark(storage: StorageLike | null, slug: string, key: string, mark: Mark): Record<string, Mark> {
    const marks = loadMarks(storage, slug);
    if (mark === '') delete marks[key];
    else marks[key] = mark;
    try {
        storage?.setItem(`${MARKS_PREFIX}${slug}`, JSON.stringify(marks));
    } catch {
        // storage full or blocked: the mark still shows for this visit
    }
    return marks;
}

export function loadRecent(storage: StorageLike | null): string[] {
    if (!storage) return [];
    try {
        const parsed: unknown = JSON.parse(storage.getItem(RECENT_KEY) ?? '[]');
        return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === 'string').slice(0, 12) : [];
    } catch {
        return [];
    }
}

/** `slug` moved to the front, duplicates removed, at most `max` kept. */
export function pushRecent(list: string[], slug: string, max = 8): string[] {
    return [slug, ...list.filter((s) => s !== slug)].slice(0, max);
}

export function saveRecent(storage: StorageLike | null, list: string[]): void {
    try {
        storage?.setItem(RECENT_KEY, JSON.stringify(list));
    } catch {
        // not worth failing a page view over
    }
}
