/**
 * Pure helpers for the Rules screen: grouping a lane's search lines by how much
 * the agent trusts them, summing a rubric, and naming lanes for the tab bar.
 */

import type { RulesDocument, RulesGate, RulesLane, RulesLine, RulesRubricItem } from '../../api/dashboardApi';

/**
 * The document comes from a script that may be a version behind (or ahead of) this screen, so a
 * missing section must never blank the page: fill every list with [] and every threshold with
 * the bar the agent has used so far.
 */
export function normalizeRulesDocument(raw: Partial<RulesDocument>): RulesDocument {
    const thresholds = raw.thresholds;
    const scope = raw.scope;
    const lanes: RulesLane[] = (raw.lanes ?? []).map((lane) => ({
        ...lane,
        thesis: lane.thesis ?? null,
        looks_for: lane.looks_for ?? null,
        excludes: lane.excludes ?? null,
        title_synonyms: lane.title_synonyms ?? [],
        lines: lane.lines ?? [],
        rubric: lane.rubric ?? [],
        rules: lane.rules ?? [],
    }));
    const gates: RulesGate[] = (raw.gates ?? []).map((gate) => ({
        ...gate,
        drop_reasons: gate.drop_reasons ?? [],
        details: gate.details ?? [],
        lane_notes: gate.lane_notes ?? {},
    }));

    return {
        schema_version: raw.schema_version ?? 1,
        config_updated_at: raw.config_updated_at ?? null,
        thresholds: {
            excellent_bar: thresholds?.excellent_bar ?? 90,
            pass_bar: thresholds?.pass_bar ?? 75,
            second_opinion_band: thresholds?.second_opinion_band ?? [65, 74],
            didnt_pass_floor: thresholds?.didnt_pass_floor ?? 55,
            skill_match_min_score: thresholds?.skill_match_min_score ?? 60,
            enrichment_min_score: thresholds?.enrichment_min_score ?? 80,
            salary_floor_usd_month: thresholds?.salary_floor_usd_month ?? 4000,
            salary_target_usd_month: thresholds?.salary_target_usd_month ?? null,
        },
        scope: {
            freshness_default_days: scope?.freshness_default_days ?? 3,
            freshness_max_days: scope?.freshness_max_days ?? 7,
            anchors: scope?.anchors ?? [],
            portals: scope?.portals ?? [],
            never: scope?.never ?? [],
        },
        lanes,
        gates,
        deal_breakers: raw.deal_breakers ?? [],
        review_tags: raw.review_tags ?? [],
        blocklists: {
            companies: raw.blocklists?.companies ?? [],
            allowed_companies: raw.blocklists?.allowed_companies ?? [],
            title_screen_terms: raw.blocklists?.title_screen_terms ?? [],
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
    return LANE_TAB_LABELS[id] ?? fallback;
}

/** "Oct 1, 2026" from an ISO timestamp or date; the raw text when it is not a date. */
export function formatPublished(iso: string | null): string {
    if (!iso) return 'not yet';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return iso;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
