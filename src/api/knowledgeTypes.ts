/**
 * Shapes of the knowledge library API (mirrors backend/domain/knowledge/page.py and
 * backend/infrastructure/adapters/driver/rest/knowledge_controller.py; the document contract is
 * documented in the backend repo at docs/knowledge-library.md).
 *
 * Page bodies are block-and-inline JSON rendered with React components, never as HTML. The renderer
 * treats every node as untrusted: an unknown type renders nothing instead of throwing.
 */

export type KnowledgeSpace = 'learn' | 'reference' | 'practice';

export interface KnowledgeSummary {
    slug: string;
    space: string;
    kind: string;
    title: string;
    group: string;
    group_order: number;
    order: number;
    domain: string | null;
    summary: string;
    read_minutes: number;
    tags: string[];
    aliases: string[];
    source_updated: string | null;
}

export type Inline = string | InlineNode;

export type InlineNode =
    | { t: 'b' | 'i' | 's'; c: Inline[] }
    | { t: 'code'; v: string }
    | { t: 'a'; href: string; c: Inline[] }
    | { t: 'br' }
    | { t: 'ref'; slug: string; anchor?: string; auto?: boolean; c: Inline[] }
    | { t: 'missing'; name: string; c: Inline[] };

export interface ListItem {
    c: Inline[];
    checked?: 'todo' | 'done' | 'partial' | null;
    children?: KnowledgeBlock[];
}

export interface DiagramNode {
    id: string;
    x: number;
    y: number;
    w: number;
    h: number;
    lines: string[];
    shape: string;
}

export interface DiagramEdge {
    pts: [number, number][];
    label: string[] | null;
    lx?: number;
    ly?: number;
    style: 'solid' | 'dotted' | 'thick';
    arrow: boolean;
    back?: boolean;
}

export interface SequenceStep {
    type: 'message' | 'note';
    y: number;
    x1: number;
    x2: number;
    self?: boolean;
    dashed?: boolean;
    h?: number;
    text: string[];
}

export type KnowledgeBlock =
    | { t: 'p'; c: Inline[] }
    | { t: 'h'; level: number; id?: string; c: Inline[] }
    | { t: 'ul' | 'ol'; items: ListItem[] }
    | { t: 'table'; head: Inline[][]; rows: Inline[][][]; align?: string[]; marks?: number }
    | { t: 'code'; lang?: string; text: string }
    | { t: 'quote'; c: KnowledgeBlock[] }
    | { t: 'callout'; tone?: string; title?: string | null; c: KnowledgeBlock[] }
    | { t: 'section'; variant: string; id?: string; title?: string; c: KnowledgeBlock[] }
    | { t: 'hr' }
    | { t: 'sits'; rows: { label: string; c: Inline[] }[] }
    | { t: 'ladder'; items: { id: string; q: Inline[]; a: Inline[] }[]; labels?: { q: string; a: string } }
    | { t: 'reveal'; title?: string; hint?: string; c: KnowledgeBlock[] }
    | { t: 'prompt'; text: string }
    | { t: 'score'; strong: Inline[][]; fail: Inline[][]; other?: KnowledgeBlock | null }
    | { t: 'terms'; items: Inline[][] }
    | { t: 'facts'; items: { k: string; c: Inline[] }[] }
    | {
          t: 'diagram';
          kind: 'flow';
          dir?: string;
          w: number;
          h: number;
          nodes: DiagramNode[];
          edges: DiagramEdge[];
          src?: string;
      }
    | {
          t: 'diagram';
          kind: 'sequence';
          w: number;
          h: number;
          head: number;
          shift?: number;
          participants: { id: string; x: number; lines: string[] }[];
          steps: SequenceStep[];
          src?: string;
      };

export interface KnowledgeOutlineEntry {
    id: string;
    text: string;
    level: number;
}

export interface KnowledgeRelated {
    slug: string;
    reason: string;
}

export interface KnowledgePage extends KnowledgeSummary {
    links: string[];
    body: {
        blocks: KnowledgeBlock[];
        outline: KnowledgeOutlineEntry[];
        related: KnowledgeRelated[];
    };
    source_path: string | null;
    content_hash: string | null;
    published_at: string | null;
}

export interface KnowledgeBacklink {
    slug: string;
    space: string;
    kind: string;
    title: string;
    group: string;
}

export interface KnowledgePageResponse {
    page: KnowledgePage;
    backlinks: KnowledgeBacklink[];
}

export interface KnowledgeSearchResult {
    slug: string;
    space: string;
    kind: string;
    title: string;
    group: string;
    summary: string;
    read_minutes: number;
    score: number;
    matched_in: 'title' | 'alias' | 'tag' | 'text';
    snippet: string;
}

export interface KnowledgeSearchResponse {
    query: string;
    terms: string[];
    total: number;
    results: KnowledgeSearchResult[];
}
