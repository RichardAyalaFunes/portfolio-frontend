import { useState } from 'react';
import type { SkillMatchData, SkillMatchRow } from '../../api/dashboardApi';
import { CopyButton } from './CopyButton';
import {
    DOC_LEVEL_COLOR,
    DOC_LEVEL_LABEL,
    MATCH_LEVEL_COLOR,
    MATCH_LEVEL_LABEL,
    documentCoverage,
    matchBreakdown,
    needsSurfacing,
} from './skillMatchModel';

function Pill({ label, color }: { label: string; color: string }) {
    return (
        <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap shrink-0"
            style={{ color, background: `color-mix(in srgb, ${color} 16%, transparent)` }}
        >
            {label}
        </span>
    );
}

function MatchCell({ row }: { row: SkillMatchRow }) {
    return (
        <div className="flex flex-col gap-1">
            <Pill label={MATCH_LEVEL_LABEL[row.match.level]} color={MATCH_LEVEL_COLOR[row.match.level]} />
            {row.match.evidence && (
                <p className="text-[13px] leading-snug" style={{ color: 'var(--db-text)' }}>
                    {row.match.evidence}
                </p>
            )}
        </div>
    );
}

function DocBlock({ name, doc }: { name: string; doc: SkillMatchRow['cv'] }) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--db-muted)' }}>
                    {name}
                </span>
                <Pill label={DOC_LEVEL_LABEL[doc.level]} color={DOC_LEVEL_COLOR[doc.level]} />
            </div>
            {doc.evidence && (
                <p className="text-[13px] leading-snug" style={{ color: 'var(--db-muted)' }}>
                    {doc.evidence}
                </p>
            )}
            {doc.fix && (
                <div className="flex items-start justify-between gap-2 p-2 rounded-lg" style={{ background: 'var(--db-surface)' }}>
                    <p className="text-[13px] leading-snug">
                        <span className="font-semibold" style={{ color: 'var(--db-accent)' }}>
                            Add:{' '}
                        </span>
                        {doc.fix}
                    </p>
                    <CopyButton text={doc.fix} />
                </div>
            )}
        </div>
    );
}

function Requirement({ row }: { row: SkillMatchRow }) {
    return (
        <div className="flex flex-col gap-1">
            <p className="text-sm font-medium leading-snug">{row.requirement}</p>
            {row.kind === 'nice' && (
                <span className="text-[11px]" style={{ color: 'var(--db-muted)' }}>
                    Nice to have
                </span>
            )}
        </div>
    );
}

function SummaryChip({ children, color }: { children: string; color?: string }) {
    return (
        <span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs whitespace-nowrap"
            style={{
                color: color ?? 'var(--db-text)',
                background: color ? `color-mix(in srgb, ${color} 14%, transparent)` : 'var(--db-surface-2)',
            }}
        >
            {children}
        </span>
    );
}

/**
 * The role's requirements as rows: does Richard's real experience cover each one,
 * and do his CV and LinkedIn show it (a recruiter only ever sees those two).
 *
 * Two layouts are rendered and the stylesheet shows one (`.dashboard-skill-*` in dashboard.css): the
 * three-column table when this section is wide enough, stacked cards when it is not. The width that
 * matters is the section's own (it depends on how wide he drags the queue drawer), which a container
 * query answers before the first paint, with no measuring in JavaScript.
 */
export function SkillMatch({ data }: { data: SkillMatchData & { rows: SkillMatchRow[] } }) {
    const [onlyFixes, setOnlyFixes] = useState(false);
    const { summary } = data;
    const rows = onlyFixes ? data.rows.filter(needsSurfacing) : data.rows;
    const cv = documentCoverage(summary, 'cv');
    const linkedin = documentCoverage(summary, 'linkedin');

    return (
        <section className="dashboard-skill-match mt-5" aria-label="Requirements versus my profile">
            <div className="flex items-baseline justify-between gap-3">
                <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--db-muted)' }}>
                    Requirements vs my profile
                </p>
                <span className="text-[11px]" style={{ color: 'var(--db-muted)' }}>
                    Analyzed {data.analyzed_on}
                </span>
            </div>

            {data.verdict && (
                <p className="text-sm mt-2" style={{ color: 'var(--db-text)' }}>
                    {data.verdict}
                </p>
            )}

            <div className="flex gap-2 flex-wrap mt-3">
                <SummaryChip>{`Skills: ${matchBreakdown(summary)}`}</SummaryChip>
                {cv.of > 0 && <SummaryChip>{`CV shows ${cv.shown} of ${cv.of}`}</SummaryChip>}
                {linkedin.of > 0 && <SummaryChip>{`LinkedIn shows ${linkedin.shown} of ${linkedin.of}`}</SummaryChip>}
                {summary.to_surface > 0 && (
                    <SummaryChip color="var(--db-band-excellent)">{`${summary.to_surface} to fix`}</SummaryChip>
                )}
            </div>

            {(data.cv_used || data.linkedin_used) && (
                <p className="text-[11px] mt-2" style={{ color: 'var(--db-muted)' }}>
                    Compared against {[data.cv_used && `CV: ${data.cv_used}`, data.linkedin_used && `LinkedIn: ${data.linkedin_used}`]
                        .filter(Boolean)
                        .join(' · ')}
                </p>
            )}

            {summary.to_surface > 0 && (
                <label className="flex items-center gap-2 mt-3 text-sm cursor-pointer">
                    <input type="checkbox" checked={onlyFixes} onChange={(e) => setOnlyFixes(e.target.checked)} />
                    Only what to fix ({summary.to_surface}): skills you have that the CV or LinkedIn do not fully show
                </label>
            )}

            <table className="dashboard-skill-table w-full table-fixed border-collapse mt-3 text-left">
                <thead>
                    <tr style={{ color: 'var(--db-muted)' }}>
                        <th className="w-[28%] py-2 pr-3 text-[11px] font-semibold uppercase tracking-wide">Requirement</th>
                        <th className="w-[32%] py-2 pr-3 text-[11px] font-semibold uppercase tracking-wide">My skills</th>
                        <th className="py-2 text-[11px] font-semibold uppercase tracking-wide">CV and LinkedIn</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr key={`${row.requirement}-${i}`} className="align-top" style={{ borderTop: '1px solid var(--db-border)' }}>
                            <td className="py-3 pr-3">
                                <Requirement row={row} />
                            </td>
                            <td className="py-3 pr-3">
                                <MatchCell row={row} />
                            </td>
                            <td className="py-3">
                                <div className="flex flex-col gap-3">
                                    <DocBlock name="CV" doc={row.cv} />
                                    <DocBlock name="LinkedIn" doc={row.linkedin} />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="dashboard-skill-cards mt-3">
                {rows.map((row, i) => (
                    <div
                        key={`${row.requirement}-${i}`}
                        className="p-3 rounded-xl flex flex-col gap-3"
                        style={{ background: 'var(--db-surface-2)' }}
                    >
                        <Requirement row={row} />
                        <MatchCell row={row} />
                        <DocBlock name="CV" doc={row.cv} />
                        <DocBlock name="LinkedIn" doc={row.linkedin} />
                    </div>
                ))}
            </div>

            {rows.length === 0 && (
                <p className="text-sm mt-3" style={{ color: 'var(--db-muted)' }}>
                    Nothing to fix: everything you match is already visible in your CV and LinkedIn.
                </p>
            )}
        </section>
    );
}
