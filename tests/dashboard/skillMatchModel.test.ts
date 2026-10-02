import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { SkillMatchData, SkillMatchRow } from '../../src/api/dashboardApi.ts';
import { hasSkillMatch, hasSkillRows, matchBreakdown, needsSurfacing } from '../../src/components/dashboard/skillMatchModel.ts';

function row(match: SkillMatchRow['match']['level'], cv: SkillMatchRow['cv']['level'], linkedin: SkillMatchRow['linkedin']['level']): SkillMatchRow {
    return {
        requirement: 'Python, typed and tested',
        kind: 'must',
        match: { level: match, evidence: null },
        cv: { level: cv, evidence: null, fix: null },
        linkedin: { level: linkedin, evidence: null, fix: null },
    };
}

const summary: SkillMatchData['summary'] = {
    requirements: 5,
    must: 4,
    nice: 1,
    match_strong: 2,
    match_partial: 1,
    match_gap: 2,
    cv_shown: 2,
    cv_partial: 1,
    cv_missing: 2,
    linkedin_shown: 1,
    linkedin_partial: 1,
    linkedin_missing: 3,
    to_surface: 2,
};

const analysed: SkillMatchData = {
    version: 1,
    analyzed_on: '2026-10-01',
    verdict: null,
    cv_used: null,
    linkedin_used: null,
    jd_source: 'full_text',
    summary,
};

describe('skill match guards', () => {
    it('treats the empty object the API returns for an un-analysed role as no skill match', () => {
        assert.equal(hasSkillMatch({}), false);
        assert.equal(hasSkillMatch(null), false);
        assert.equal(hasSkillMatch(undefined), false);
    });

    it('recognises an analysed role by its summary, with or without rows (the list omits them)', () => {
        assert.equal(hasSkillMatch(analysed), true);
        assert.equal(hasSkillRows(analysed), false);
        assert.equal(hasSkillRows({ ...analysed, rows: [] }), false);
        assert.equal(hasSkillRows({ ...analysed, rows: [row('strong', 'shown', 'shown')] }), true);
    });
});

describe('needsSurfacing', () => {
    it('flags a skill Richard has that the CV or LinkedIn does not fully show', () => {
        assert.equal(needsSurfacing(row('strong', 'shown', 'missing')), true);
        assert.equal(needsSurfacing(row('strong', 'partial', 'shown')), true);
        assert.equal(needsSurfacing(row('partial', 'missing', 'missing')), true);
    });

    it('does not flag rows that are fully shown', () => {
        assert.equal(needsSurfacing(row('strong', 'shown', 'shown')), false);
        assert.equal(needsSurfacing(row('strong', 'shown', 'na')), false);
    });

    it('does not flag a real gap: the skill is missing, not hidden', () => {
        assert.equal(needsSurfacing(row('gap', 'missing', 'missing')), false);
    });
});

describe('matchBreakdown', () => {
    it('spells out strong, partial and gap instead of calling a partial match a full one', () => {
        assert.equal(matchBreakdown(summary), '2 strong · 1 partial · 2 gaps');
    });

    it('leaves out what is zero and singularises one gap', () => {
        assert.equal(matchBreakdown({ ...summary, match_partial: 0, match_gap: 1 }), '2 strong · 1 gap');
        assert.equal(matchBreakdown({ ...summary, match_strong: 0, match_partial: 3, match_gap: 0 }), '3 partial');
    });
});
