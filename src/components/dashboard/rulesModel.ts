/**
 * Pure helpers for the Rules screen: grouping a lane's search lines by how much
 * the agent trusts them, summing a rubric, and naming lanes for the tab bar.
 */

import type { RulesDocument, RulesGate, RulesLane, RulesLine, RulesRubricItem, RulesRuleGroup } from '../../api/dashboardApi';

type Obj = Record<string, unknown>;

function isRecord(value: unknown): value is Obj {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** The entries of a list that are objects; anything else (null, a string, a missing list) yields nothing. */
function records(value: unknown): Obj[] {
    return Array.isArray(value) ? value.filter(isRecord) : [];
}

function strings(value: unknown): string[] {
    return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === 'string') : [];
}

function text(value: unknown): string | null {
    return typeof value === 'string' ? value : null;
}

function finite(value: unknown, fallback: number): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeLine(raw: Obj): RulesLine | null {
    const line = text(raw.line);
    if (!line) return null; // nothing to show or to look statistics up by
    return {
        line,
        portal: text(raw.portal) ?? '',
        status: text(raw.status) ?? 'unknown',
        origin: text(raw.origin) ?? 'standing',
        added: text(raw.added),
        reason: text(raw.reason),
        evidence: text(raw.evidence),
        runs: typeof raw.runs === 'number' || typeof raw.runs === 'string' ? raw.runs : null,
    };
}

function normalizeRubricItem(raw: Obj): RulesRubricItem | null {
    const dimension = text(raw.dimension);
    return dimension ? { dimension, weight: finite(raw.weight, 0) } : null;
}

function normalizeRuleGroup(raw: Obj): RulesRuleGroup {
    return { title: text(raw.title) ?? '', kind: text(raw.kind) ?? 'note', items: strings(raw.items) };
}

function normalizeLane(raw: Obj, index: number): RulesLane | null {
    const id = text(raw.id);
    if (!id) return null; // a lane without an id cannot be selected
    return {
        id,
        order: finite(raw.order, index + 1),
        label: text(raw.label) ?? id,
        thesis: text(raw.thesis),
        looks_for: text(raw.looks_for),
        excludes: text(raw.excludes),
        title_synonyms: strings(raw.title_synonyms),
        lines: records(raw.lines).map(normalizeLine).filter((line): line is RulesLine => line !== null),
        rubric: records(raw.rubric).map(normalizeRubricItem).filter((item): item is RulesRubricItem => item !== null),
        rules: records(raw.rules).map(normalizeRuleGroup),
    };
}

function normalizeGate(raw: Obj, index: number): RulesGate {
    const laneNotes = isRecord(raw.lane_notes) ? raw.lane_notes : {};
    return {
        id: text(raw.id) ?? `gate-${index + 1}`,
        order: finite(raw.order, index + 1),
        name: text(raw.name) ?? '',
        summary: text(raw.summary) ?? '',
        drop_reasons: strings(raw.drop_reasons),
        details: strings(raw.details),
        lane_notes: Object.fromEntries(Object.entries(laneNotes).filter(([, note]) => typeof note === 'string')) as Record<string, string>,
    };
}

function normalizeBand(value: unknown): [number, number] {
    return Array.isArray(value) && value.length === 2 && value.every((n) => typeof n === 'number' && Number.isFinite(n))
        ? [value[0], value[1]]
        : [65, 74];
}

/**
 * The document comes from a script that may be a version behind (or ahead of) this screen, and the
 * server accepts any shape that has lanes with an id, a label and a list of lines. So every section is
 * rebuilt from what is really there: a missing section, a list of the wrong type or an entry of the
 * wrong shape must never throw while rendering (that would blank the whole dashboard) and is left out
 * or filled with the bar the agent has used so far.
 */
export function normalizeRulesDocument(input: unknown): RulesDocument {
    const raw = isRecord(input) ? input : {};
    const thresholds = isRecord(raw.thresholds) ? raw.thresholds : {};
    const scope = isRecord(raw.scope) ? raw.scope : {};
    const blocklists = isRecord(raw.blocklists) ? raw.blocklists : {};
    const target = thresholds.salary_target_usd_month;

    return {
        schema_version: finite(raw.schema_version, 1),
        config_updated_at: text(raw.config_updated_at),
        thresholds: {
            excellent_bar: finite(thresholds.excellent_bar, 90),
            pass_bar: finite(thresholds.pass_bar, 75),
            second_opinion_band: normalizeBand(thresholds.second_opinion_band),
            didnt_pass_floor: finite(thresholds.didnt_pass_floor, 55),
            skill_match_min_score: finite(thresholds.skill_match_min_score, 60),
            enrichment_min_score: finite(thresholds.enrichment_min_score, 80),
            salary_floor_usd_month: finite(thresholds.salary_floor_usd_month, 4000),
            salary_target_usd_month: typeof target === 'string' || typeof target === 'number' ? String(target) : null,
        },
        scope: {
            freshness_default_days: finite(scope.freshness_default_days, 3),
            freshness_max_days: finite(scope.freshness_max_days, 7),
            anchors: records(scope.anchors).flatMap((anchor) => {
                const label = text(anchor.label) ?? text(anchor.id);
                return label ? [{ id: text(anchor.id) ?? label, label }] : [];
            }),
            portals: records(scope.portals).flatMap((portal) => {
                const label = text(portal.label) ?? text(portal.id);
                return label ? [{ id: text(portal.id) ?? label, tier: finite(portal.tier, 99), label }] : [];
            }),
            never: strings(scope.never),
        },
        lanes: records(raw.lanes)
            .map(normalizeLane)
            .filter((lane): lane is RulesLane => lane !== null),
        gates: records(raw.gates).map(normalizeGate),
        deal_breakers: strings(raw.deal_breakers),
        review_tags: records(raw.review_tags).flatMap((tag) => {
            const id = text(tag.id);
            return id ? [{ id, when: text(tag.when) ?? '', effect: text(tag.effect) ?? '' }] : [];
        }),
        blocklists: {
            companies: strings(blocklists.companies),
            allowed_companies: strings(blocklists.allowed_companies),
            title_screen_terms: strings(blocklists.title_screen_terms),
        },
    };
}

export interface LineGroup {
    status: string;
    label: string;
    help: string;
    lines: RulesLine[];
}

/** Order the lifecycle reads in: proven first, retired last. */
const LINE_STATUSES: ReadonlyArray<{ status: string; label: string; help: string }> = [
    { status: 'standing', label: 'Standing', help: 'Runs every time. Part of the fixed search plan, or proven by your approvals.' },
    { status: 'trial', label: 'Trial', help: 'Added by the agent from your feedback. Runs every time until it earns or loses its slot.' },
    { status: 'weekly', label: 'Weekly', help: 'Demoted: it did not earn its slot, so it only runs on the weekly cadence.' },
    { status: 'retired', label: 'Retired', help: 'Stopped. Kept on record so the agent does not re-add it without new evidence.' },
];

/** Buckets a lane's lines by status; statuses the agent invents later land after the known ones. */
export function groupLines(lines: ReadonlyArray<RulesLine>): LineGroup[] {
    const groups: LineGroup[] = LINE_STATUSES.map((s) => ({ ...s, lines: lines.filter((l) => l.status === s.status) }));
    const known = new Set(LINE_STATUSES.map((s) => s.status));
    const unknown = [...new Set(lines.map((l) => l.status).filter((status) => !known.has(status)))];
    for (const status of unknown) {
        groups.push({ status, label: status, help: '', lines: lines.filter((l) => l.status === status) });
    }
    return groups.filter((group) => group.lines.length > 0);
}

export function rubricTotal(rubric: ReadonlyArray<RulesRubricItem>): number {
    return rubric.reduce((sum, item) => sum + item.weight, 0);
}

const LANE_TAB_LABELS: Record<string, string> = {
    ai_engineer: 'AI Engineer',
    forward_deployed_engineer: 'Forward Deployed',
    founding_engineer: 'Founding Engineer',
};

export function laneTabLabel(id: string, fallback: string): string {
    return Object.hasOwn(LANE_TAB_LABELS, id) ? LANE_TAB_LABELS[id] : fallback;
}

/** "Oct 1, 2026" from an ISO timestamp or date; the raw text when it is not a date. */
export function formatPublished(iso: string | null): string {
    if (!iso) return 'not yet';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
