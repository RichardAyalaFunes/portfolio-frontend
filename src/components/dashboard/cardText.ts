/**
 * The text of a role card's second line: who, how and where, and the pay when it is
 * actually stated. Pure so it can be tested; the agent stores "(not stated)" in
 * salary_text when a posting has no pay, which is noise on a card.
 */

import type { JobApplication } from '../../api/dashboardApi';

const NOT_STATED = /^\(?\s*(not stated|not specified|not disclosed|unknown|n\/a|no indicado|no especificado|none|-+)\s*\)?\.?$/i;

/** The salary text, or null when the posting did not state one. */
export function statedSalary(text: string | null | undefined): string | null {
    const trimmed = text?.trim();
    return trimmed && !NOT_STATED.test(trimmed) ? trimmed : null;
}

type CardMetaInput = Pick<JobApplication, 'company' | 'work_mode' | 'location_text' | 'salary_text'>;

/** "Company · Remote · Latin America · USD 5,500": the work mode is skipped when the location already says it. */
export function cardMeta(application: CardMetaInput): string {
    const location = application.location_text;
    const workMode = application.work_mode;
    const showWorkMode = workMode && !(location && location.toLowerCase().includes(workMode.toLowerCase()));
    return [application.company, showWorkMode ? workMode : null, location, statedSalary(application.salary_text)]
        .filter(Boolean)
        .join(' · ');
}
