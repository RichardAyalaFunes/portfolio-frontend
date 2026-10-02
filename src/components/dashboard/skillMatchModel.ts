/**
 * Helpers for the "requirements vs my profile" table (see SkillMatch.tsx): type
 * guards for the optional payload, level labels/colors, and the one rule that
 * decides which rows are worth fixing. Pure, no React, no runtime imports.
 */

import type { DocLevel, JobApplication, MatchLevel, SkillMatchData, SkillMatchRow } from '../../api/dashboardApi';

type MaybeSkillMatch = JobApplication['skill_match'] | null | undefined;

/** True when the role has been analysed (the list endpoint returns the summary without the rows). */
export function hasSkillMatch(value: MaybeSkillMatch): value is SkillMatchData {
    return typeof value === 'object' && value !== null && 'summary' in value && Boolean((value as SkillMatchData).summary);
}

export function hasSkillRows(value: MaybeSkillMatch): value is SkillMatchData & { rows: SkillMatchRow[] } {
    return hasSkillMatch(value) && Array.isArray(value.rows) && value.rows.length > 0;
}

export const MATCH_LEVEL_LABEL: Record<MatchLevel, string> = {
    strong: 'Strong',
    partial: 'Partial',
    gap: 'Gap',
};

export const DOC_LEVEL_LABEL: Record<DocLevel, string> = {
    shown: 'Shown',
    partial: 'Partly shown',
    missing: 'Not shown',
    na: 'n/a',
};

export const MATCH_LEVEL_COLOR: Record<MatchLevel, string> = {
    strong: 'var(--db-band-good)',
    partial: 'var(--db-band-excellent)',
    gap: 'var(--db-band-drop)',
};

export const DOC_LEVEL_COLOR: Record<DocLevel, string> = {
    shown: 'var(--db-band-good)',
    partial: 'var(--db-band-excellent)',
    missing: 'var(--db-band-drop)',
    na: 'var(--db-muted)',
};

/**
 * A requirement Richard meets that his CV or LinkedIn does not fully show: the
 * recruiter cannot see the match, so this is the work to do. Mirrors the
 * server's `to_surface` count.
 */
export function needsSurfacing(row: SkillMatchRow): boolean {
    return row.match.level !== 'gap' && [row.cv.level, row.linkedin.level].some((level) => level === 'partial' || level === 'missing');
}

/**
 * How many of the requirements a document is judged on it shows: "CV shows 8 of 14". The server keeps
 * `n/a` rows (a requirement he does not meet, which no document can show) out of its cv_* and
 * linkedin_* counters, so the "of" is their sum and not the number of requirements.
 */
export function documentCoverage(summary: SkillMatchData['summary'], document: 'cv' | 'linkedin'): { shown: number; of: number } {
    return document === 'cv'
        ? { shown: summary.cv_shown, of: summary.cv_shown + summary.cv_partial + summary.cv_missing }
        : { shown: summary.linkedin_shown, of: summary.linkedin_shown + summary.linkedin_partial + summary.linkedin_missing };
}

/** "6 strong · 9 partial · 1 gap": how well his skills cover the JD, without calling a partial match a full one. */
export function matchBreakdown(summary: SkillMatchData['summary']): string {
    return [
        summary.match_strong > 0 ? `${summary.match_strong} strong` : null,
        summary.match_partial > 0 ? `${summary.match_partial} partial` : null,
        summary.match_gap > 0 ? `${summary.match_gap} gap${summary.match_gap > 1 ? 's' : ''}` : null,
    ]
        .filter(Boolean)
        .join(' · ');
}
