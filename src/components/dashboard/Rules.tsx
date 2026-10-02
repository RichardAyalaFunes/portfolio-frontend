import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
    dashboardApi,
    type LineStats,
    type RulesDocument,
    type RulesGate,
    type RulesLane,
    type RulesLine,
    type RulesResponse,
    type RulesRubricItem,
    type RulesRuleGroup,
} from '../../api/dashboardApi';
import { formatPublished, groupLines, laneTabLabel, normalizeRulesDocument, rubricTotal } from './rulesModel';

function Section({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
    return (
        <section className="mt-6">
            <h2 className="text-xs uppercase tracking-wide" style={{ color: 'var(--db-muted)' }}>
                {title}
            </h2>
            {hint && (
                <p className="text-[13px] mt-1" style={{ color: 'var(--db-muted)' }}>
                    {hint}
                </p>
            )}
            <div className="mt-3">{children}</div>
        </section>
    );
}

function Card({ children }: { children: ReactNode }) {
    return (
        <div className="p-4 rounded-xl" style={{ background: 'var(--db-surface-2)' }}>
            {children}
        </div>
    );
}

function Chip({ children, color }: { children: ReactNode; color?: string }) {
    return (
        <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] whitespace-nowrap"
            style={{
                color: color ?? 'var(--db-muted)',
                background: color ? `color-mix(in srgb, ${color} 16%, transparent)` : 'var(--db-surface)',
            }}
        >
            {children}
        </span>
    );
}

/** A long paragraph shown in four lines with a toggle, so a lane's thesis does not push its rules off the screen. */
function ClampedText({ text }: { text: string }) {
    const [open, setOpen] = useState(false);
    const long = text.length > 320;
    return (
        <div className="mt-3">
            <p className={`text-sm ${long && !open ? 'line-clamp-4' : ''}`} style={{ color: 'var(--db-text)' }}>
                {text}
            </p>
            {long && (
                <button
                    type="button"
                    onClick={() => setOpen((v) => !v)}
                    className="text-xs mt-1"
                    style={{ color: 'var(--db-accent)', minHeight: 0 }}
                >
                    {open ? 'Show less' : 'Read the whole thesis'}
                </button>
            )}
        </div>
    );
}

// ── Score thresholds ─────────────────────────────────────────────────────────

function Thresholds({ doc }: { doc: RulesDocument }) {
    const t = doc.thresholds;
    const rows = [
        { range: `${t.excellent_bar}+`, label: 'Excellent', note: 'Passes. Shown first.', color: 'var(--db-band-excellent)' },
        { range: `${t.pass_bar}-${t.excellent_bar - 1}`, label: 'Good', note: 'Passes. Lands in To review (or Flagged when the agent has a doubt).', color: 'var(--db-band-good)' },
        {
            range: `${t.didnt_pass_floor}-${t.pass_bar - 1}`,
            label: "Didn't pass",
            note: "Passed every rule but scored under the bar. Uploaded under \"Didn't pass\" so you can re-check it.",
            color: 'var(--db-band-below)',
        },
        { range: `under ${t.didnt_pass_floor}`, label: 'Not uploaded', note: 'Too far from the profile to be worth a look.', color: 'var(--db-fresh-stale)' },
    ];
    return (
        <Card>
            <ul className="flex flex-col gap-2">
                {rows.map((row) => (
                    <li key={row.label} className="flex items-baseline gap-3 text-sm">
                        <span className="w-20 shrink-0 tabular-nums font-semibold" style={{ color: row.color }}>
                            {row.range}
                        </span>
                        <span>
                            <span className="font-medium">{row.label}</span>
                            <span style={{ color: 'var(--db-muted)' }}> {row.note}</span>
                        </span>
                    </li>
                ))}
            </ul>
            <p className="text-[13px] mt-3" style={{ color: 'var(--db-muted)' }}>
                A second opinion (two independent models) is asked for roles scoring {t.second_opinion_band[0]}-{t.second_opinion_band[1]}. The
                requirements-vs-profile table is built for roles scoring {t.skill_match_min_score} and up. Outreach contacts are found for{' '}
                {t.enrichment_min_score}+. Pay below ${t.salary_floor_usd_month.toLocaleString('en-US')} a month is a deal-breaker
                {t.salary_target_usd_month ? ` (target: $${t.salary_target_usd_month})` : ''}; a salary that is not stated is never held against a role.
            </p>
        </Card>
    );
}

// ── Lane: search lines ───────────────────────────────────────────────────────

function LineItem({ line, stats }: { line: RulesLine; stats?: LineStats }) {
    const hasWhy = Boolean(line.reason || line.evidence);
    return (
        <li className="py-2.5" style={{ borderTop: '1px solid var(--db-border)' }}>
            <div className="flex items-start justify-between gap-3">
                <code className="text-[13px] break-words font-mono" style={{ color: 'var(--db-text)' }}>
                    {line.line}
                </code>
                <Chip>{line.portal}</Chip>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--db-muted)' }}>
                {stats && stats.surfaced > 0
                    ? `${stats.surfaced} found · ${stats.approved} approved · ${stats.rejected} rejected`
                    : 'No roles found yet'}
                {line.added ? ` · added ${line.added}` : ''}
            </p>
            {hasWhy && (
                <details className="mt-1">
                    <summary className="text-xs cursor-pointer" style={{ color: 'var(--db-accent)' }}>
                        Why this line exists
                    </summary>
                    {line.reason && (
                        <p className="text-[13px] mt-1.5" style={{ color: 'var(--db-text)' }}>
                            {line.reason}
                        </p>
                    )}
                    {line.evidence && (
                        <p className="text-[13px] mt-1.5" style={{ color: 'var(--db-muted)' }}>
                            Evidence: {line.evidence}
                        </p>
                    )}
                </details>
            )}
        </li>
    );
}

function SearchLines({ lane, lineStats }: { lane: RulesLane; lineStats: Record<string, LineStats> }) {
    const groups = groupLines(lane.lines);
    if (groups.length === 0) {
        return (
            <p className="text-sm" style={{ color: 'var(--db-muted)' }}>
                No search lines published for this lane.
            </p>
        );
    }
    return (
        <div className="flex flex-col gap-4">
            {groups.map((group) => (
                <Card key={group.status}>
                    <div className="flex items-baseline justify-between gap-3">
                        <h3 className="text-sm font-medium">
                            {group.label} <span style={{ color: 'var(--db-muted)' }}>({group.lines.length})</span>
                        </h3>
                    </div>
                    {group.help && (
                        <p className="text-xs mt-0.5" style={{ color: 'var(--db-muted)' }}>
                            {group.help}
                        </p>
                    )}
                    <ul className="mt-2">
                        {group.lines.map((line) => (
                            <LineItem key={line.line} line={line} stats={lineStats[line.line]} />
                        ))}
                    </ul>
                </Card>
            ))}
        </div>
    );
}

// ── Lane: scoring and rules ──────────────────────────────────────────────────

function Rubric({ rubric }: { rubric: RulesRubricItem[] }) {
    if (rubric.length === 0) return null;
    const total = rubricTotal(rubric);
    return (
        <Card>
            <ul className="flex flex-col gap-3">
                {rubric.map((item) => (
                    <li key={item.dimension}>
                        <div className="flex items-baseline justify-between gap-3 text-sm">
                            <span>{item.dimension}</span>
                            <span className="tabular-nums font-semibold shrink-0">{item.weight}</span>
                        </div>
                        <div className="h-1.5 rounded-full mt-1.5" style={{ background: 'var(--db-surface)' }}>
                            <div
                                className="h-full rounded-full"
                                style={{ width: `${Math.min(100, (item.weight / Math.max(total, 1)) * 100)}%`, background: 'var(--db-accent)' }}
                            />
                        </div>
                    </li>
                ))}
            </ul>
            <p className="text-xs mt-3" style={{ color: 'var(--db-muted)' }}>
                Each dimension is scored against evidence in the posting; the weights sum to {total}. The two weakest dimensions are what
                "Why not" explains.
            </p>
        </Card>
    );
}

const RULE_KIND_COLOR: Record<string, string> = {
    keep: 'var(--db-band-good)',
    drop: 'var(--db-band-drop)',
    note: 'var(--db-muted)',
};

const RULE_KIND_LABEL: Record<string, string> = {
    keep: 'Keeps',
    drop: 'Drops',
    note: 'Note',
};

function RuleGroups({ groups }: { groups: RulesRuleGroup[] }) {
    if (groups.length === 0) return null;
    return (
        <div className="flex flex-col gap-3">
            {groups.map((group) => {
                const color = RULE_KIND_COLOR[group.kind] ?? 'var(--db-muted)';
                return (
                    <Card key={group.title}>
                        <div className="flex items-center gap-2">
                            <Chip color={color}>{RULE_KIND_LABEL[group.kind] ?? group.kind}</Chip>
                            <h3 className="text-sm font-medium">{group.title}</h3>
                        </div>
                        <ul className="list-disc pl-5 mt-2 flex flex-col gap-1 text-[13px]" style={{ color: 'var(--db-text)' }}>
                            {group.items.map((item) => (
                                <li key={item}>{item}</li>
                            ))}
                        </ul>
                    </Card>
                );
            })}
        </div>
    );
}

// ── Rules for every lane ─────────────────────────────────────────────────────

function GateCard({ gate, lane }: { gate: RulesGate; lane: RulesLane }) {
    const laneNote = gate.lane_notes?.[lane.id];
    return (
        <div className="p-3 rounded-xl" style={{ background: 'var(--db-surface-2)' }}>
            <details>
                <summary className="cursor-pointer">
                    <span className="text-sm font-medium">
                        {gate.order}. {gate.name}
                    </span>
                    <span className="block text-[13px] mt-0.5" style={{ color: 'var(--db-muted)' }}>
                        {gate.summary}
                    </span>
                </summary>
                {gate.details.length > 0 && (
                    <ul className="list-disc pl-5 mt-2 flex flex-col gap-1 text-[13px]">
                        {gate.details.map((detail) => (
                            <li key={detail}>{detail}</li>
                        ))}
                    </ul>
                )}
                {gate.drop_reasons.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap mt-2">
                        {gate.drop_reasons.map((reason) => (
                            <Chip key={reason}>{reason}</Chip>
                        ))}
                    </div>
                )}
            </details>
            {laneNote && (
                <p
                    className="text-[13px] mt-2 p-2 rounded-lg"
                    style={{ background: 'color-mix(in srgb, var(--db-accent) 12%, transparent)' }}
                >
                    <span className="font-semibold" style={{ color: 'var(--db-accent)' }}>
                        For {laneTabLabel(lane.id, lane.label)}:{' '}
                    </span>
                    {laneNote}
                </p>
            )}
        </div>
    );
}

function BulletCard({ items }: { items: string[] }) {
    if (items.length === 0) return null;
    return (
        <Card>
            <ul className="list-disc pl-5 flex flex-col gap-1 text-[13px]">
                {items.map((item) => (
                    <li key={item}>{item}</li>
                ))}
            </ul>
        </Card>
    );
}

function SharedRules({ doc, lane }: { doc: RulesDocument; lane: RulesLane }) {
    const gates = [...doc.gates].sort((a, b) => a.order - b.order);
    return (
        <>
            <Section
                title="Rules every role must pass, in order"
                hint="A role cut by an earlier rule is never scored. Open a rule for the details; a highlighted line is an exception for this lane."
            >
                <div className="flex flex-col gap-2">
                    {gates.map((gate) => (
                        <GateCard key={gate.id} gate={gate} lane={lane} />
                    ))}
                </div>
            </Section>

            <Section title="Deal-breakers" hint="Any of these drops the role, whatever its score.">
                <BulletCard items={doc.deal_breakers} />
            </Section>

            <Section title="Review tags" hint="Warnings shown on the card so you check the right thing first.">
                <Card>
                    <ul className="flex flex-col gap-2.5">
                        {doc.review_tags.map((tag) => (
                            <li key={tag.id} className="text-[13px]">
                                <code className="font-mono font-semibold">{tag.id}</code>
                                <span style={{ color: 'var(--db-muted)' }}> when: {tag.when}</span>
                                <span className="block" style={{ color: 'var(--db-text)' }}>
                                    {tag.effect}
                                </span>
                            </li>
                        ))}
                    </ul>
                </Card>
            </Section>

            <Section title="Where it searches">
                <Card>
                    <div className="flex flex-col gap-2 text-[13px]">
                        <p>
                            <span style={{ color: 'var(--db-muted)' }}>Anchors: </span>
                            {doc.scope.anchors.map((a) => a.label).join(', ')}
                        </p>
                        <p>
                            <span style={{ color: 'var(--db-muted)' }}>Portals: </span>
                            {[...doc.scope.portals]
                                .sort((a, b) => a.tier - b.tier)
                                .map((p) => `${p.label} (tier ${p.tier})`)
                                .join(', ')}
                        </p>
                        <p>
                            <span style={{ color: 'var(--db-muted)' }}>Freshness: </span>
                            {doc.scope.freshness_default_days} days by default, never more than {doc.scope.freshness_max_days}.
                        </p>
                        {doc.scope.never.length > 0 && (
                            <ul className="list-disc pl-5" style={{ color: 'var(--db-muted)' }}>
                                {doc.scope.never.map((rule) => (
                                    <li key={rule}>Never: {rule}</li>
                                ))}
                            </ul>
                        )}
                    </div>
                </Card>
            </Section>

            <Section title="Blocked and allowed companies">
                <Card>
                    <p className="text-[13px]" style={{ color: 'var(--db-muted)' }}>
                        Skipped on sight (staffing or talent-pool models)
                    </p>
                    <div className="flex gap-1.5 flex-wrap mt-2">
                        {doc.blocklists.companies.map((company) => (
                            <Chip key={company}>{company}</Chip>
                        ))}
                    </div>
                    {doc.blocklists.allowed_companies.length > 0 && (
                        <>
                            <p className="text-[13px] mt-3" style={{ color: 'var(--db-muted)' }}>
                                Allowed by name
                            </p>
                            <div className="flex gap-1.5 flex-wrap mt-2">
                                {doc.blocklists.allowed_companies.map((company) => (
                                    <Chip key={company} color="var(--db-band-good)">
                                        {company}
                                    </Chip>
                                ))}
                            </div>
                        </>
                    )}
                </Card>
            </Section>
        </>
    );
}

// ── Page ─────────────────────────────────────────────────────────────────────

function LanePanel({ doc, lane, response }: { doc: RulesDocument; lane: RulesLane; response: RulesResponse }) {
    const stats = response.lane_stats[lane.id];
    return (
        <div role="tabpanel" aria-label={lane.label}>
            <Card>
                <h2 className="text-base font-medium">{lane.label}</h2>
                {stats && (
                    <p className="text-xs mt-0.5" style={{ color: 'var(--db-muted)' }}>
                        {stats.total} roles found so far · {stats.to_review} to review · {stats.flagged} flagged · {stats.approved} approved ·{' '}
                        {stats.applied} applied
                    </p>
                )}
                {lane.thesis && <ClampedText text={lane.thesis} />}
                {lane.looks_for && (
                    <p className="text-[13px] mt-3">
                        <span style={{ color: 'var(--db-muted)' }}>Looks for: </span>
                        {lane.looks_for}
                    </p>
                )}
                {lane.excludes && (
                    <p className="text-[13px] mt-1.5">
                        <span style={{ color: 'var(--db-muted)' }}>Never: </span>
                        {lane.excludes}
                    </p>
                )}
                {lane.title_synonyms.length > 0 && (
                    <details className="mt-3">
                        <summary className="text-xs cursor-pointer" style={{ color: 'var(--db-accent)' }}>
                            Titles it also searches ({lane.title_synonyms.length})
                        </summary>
                        <div className="flex gap-1.5 flex-wrap mt-2">
                            {lane.title_synonyms.map((title) => (
                                <Chip key={title}>{title}</Chip>
                            ))}
                        </div>
                    </details>
                )}
            </Card>

            <Section title="Search lines" hint="The exact strings it searches with, and how each has done so far.">
                <SearchLines lane={lane} lineStats={response.line_stats} />
            </Section>

            <Section title="How a role is scored in this lane">
                <Rubric rubric={lane.rubric} />
            </Section>

            {lane.rules.length > 0 && (
                <Section title="What counts in this lane">
                    <RuleGroups groups={lane.rules} />
                </Section>
            )}

            <SharedRules doc={doc} lane={lane} />
        </div>
    );
}

export function Rules() {
    const [response, setResponse] = useState<RulesResponse | null>(null);
    const [error, setError] = useState(false);
    const [laneId, setLaneId] = useState<string | null>(null);

    useEffect(() => {
        dashboardApi.getRules().then(setResponse).catch(() => setError(true));
    }, []);

    const doc = useMemo(() => (response?.content ? normalizeRulesDocument(response.content) : null), [response]);
    const lanes = doc ? [...doc.lanes].sort((a, b) => a.order - b.order) : [];
    const lane = lanes.find((l) => l.id === laneId) ?? lanes[0];

    return (
        <div className="p-4 lg:p-8 pb-28 lg:pb-8 max-w-3xl mx-auto">
            <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <h1 className="text-lg font-medium">Search rules</h1>
                {response && (
                    <span className="text-xs" style={{ color: 'var(--db-muted)' }}>
                        Published {formatPublished(response.published_at)}
                        {doc?.config_updated_at ? ` · config updated ${doc.config_updated_at}` : ''}
                    </span>
                )}
            </div>
            <p className="text-sm mt-1" style={{ color: 'var(--db-muted)' }}>
                What the search agent uses to find and judge roles for you, per lane. Read-only: it is rebuilt from the agent's own
                config at the end of every run.
            </p>

            {error && (
                <p className="mt-6" style={{ color: 'var(--db-band-drop)' }}>
                    Could not load the rules.
                </p>
            )}

            {!error && !response && (
                <div className="flex flex-col gap-3 mt-6">
                    <div className="dashboard-skeleton h-24" />
                    <div className="dashboard-skeleton h-40" />
                </div>
            )}

            {response && !doc && (
                <Card>
                    <p className="text-sm">The search agent has not published its rules yet.</p>
                    <p className="text-[13px] mt-1" style={{ color: 'var(--db-muted)' }}>
                        They appear here after its next run, or right away with <code className="font-mono">node publish-rules.js</code> from the
                        dashboard scripts folder.
                    </p>
                </Card>
            )}

            {doc && lane && response && (
                <>
                    <Section title="How a score decides what you see">
                        <Thresholds doc={doc} />
                    </Section>

                    <div role="tablist" aria-label="Lanes" className="flex gap-2 mt-8 flex-wrap">
                        {lanes.map((l) => {
                            const active = l.id === lane.id;
                            return (
                                <button
                                    key={l.id}
                                    role="tab"
                                    aria-selected={active}
                                    onClick={() => setLaneId(l.id)}
                                    className="px-3.5 py-1.5 rounded-full text-sm"
                                    style={{
                                        background: active ? 'var(--db-accent)' : 'var(--db-surface-2)',
                                        color: active ? '#0b0e14' : 'var(--db-text)',
                                        minHeight: 0,
                                    }}
                                >
                                    {laneTabLabel(l.id, l.label)}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-4">
                        <LanePanel doc={doc} lane={lane} response={response} />
                    </div>
                </>
            )}
        </div>
    );
}
