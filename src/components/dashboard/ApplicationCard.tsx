import type { KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import type { JobApplication } from '../../api/dashboardApi';
import { BucketChip } from './BucketChip';
import { RoleTags } from './RoleTags';
import { YcBadge } from './YcBadge';
import { cardMeta } from './cardText';
import { bandColorVar, freshnessColorVar, freshnessShort } from './dashboardTokens';
import { bucketOf, dropReasonLabel, laneShort, statusLabel } from './queueBuckets';
import { hasSkillMatch } from './skillMatchModel';

interface ApplicationCardProps {
    application: JobApplication;
    /** This role is open in the detail pane. */
    selected?: boolean;
    /** Show the bucket chip. Off when the queue is filtered to a single bucket: every card would repeat it. */
    showBucket?: boolean;
}

const TRACKING_BUCKETS = ['applied', 'interviewing', 'offer', 'closed'];
const SET_ASIDE_STATUSES = ['Rejected', 'Cold', 'Dropped'];

/**
 * One role in the queue, in three rows: what and how well it scores, who and where,
 * then the state chips (bucket, lane, review tags, what is left to fix in the CV).
 */
export function ApplicationCard({ application, selected = false, showBucket = true }: ApplicationCardProps) {
    const navigate = useNavigate();
    const bucket = bucketOf(application);
    const open = () => navigate(`/dashboard/${application.id}`);
    const onKeyDown = (e: KeyboardEvent) => {
        // Keys pressed on the posting link inside the card are the link's own (Enter opens it).
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            open();
        }
    };

    const cut = bucket === 'dropped' || bucket === 'didnt_pass' ? dropReasonLabel(application.drop_reason) : null;
    // A role he applied to but also rejected: the stage bucket wins, so say the verdict next to it.
    const verdict =
        TRACKING_BUCKETS.includes(bucket) && SET_ASIDE_STATUSES.includes(application.status)
            ? statusLabel(application.status)
            : null;
    const skill = hasSkillMatch(application.skill_match) ? application.skill_match.summary : null;

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={open}
            onKeyDown={onKeyDown}
            aria-current={selected ? 'true' : undefined}
            className="w-full text-left px-4 py-2.5 flex flex-col gap-1 cursor-pointer active:opacity-70 transition-opacity"
            style={{
                borderBottom: '1px solid var(--db-border)',
                background: selected ? 'color-mix(in srgb, var(--db-accent) 10%, transparent)' : undefined,
                boxShadow: selected ? 'inset 3px 0 0 var(--db-accent)' : undefined,
            }}
        >
            <div className="flex items-start justify-between gap-2">
                <span className="font-medium leading-snug line-clamp-2">{application.title}</span>
                {application.score !== null && (
                    <span
                        className="text-xs font-semibold shrink-0 mt-0.5 px-1.5 py-0.5 rounded-md tabular-nums"
                        style={{
                            color: bandColorVar(application.band),
                            background: `color-mix(in srgb, ${bandColorVar(application.band)} 14%, transparent)`,
                        }}
                        title={`Score ${application.score}`}
                    >
                        {application.score}
                    </span>
                )}
            </div>

            <div className="flex items-center justify-between gap-2">
                <span className="text-[13px] truncate" style={{ color: 'var(--db-muted)' }}>
                    {cardMeta(application)}
                </span>
                <span className="flex items-center gap-2 shrink-0">
                    <span className="text-xs" style={{ color: freshnessColorVar(application.posted_date) }}>
                        {freshnessShort(application.posted_date)}
                    </span>
                    {application.jd_url && (
                        <a
                            href={application.jd_url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            style={{ color: 'var(--db-muted)', minHeight: 0 }}
                            aria-label="Open posting"
                        >
                            <ExternalLink size={14} />
                        </a>
                    )}
                </span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
                {showBucket && <BucketChip bucket={bucket} />}
                {verdict && (
                    <span className="text-[11px]" style={{ color: 'var(--db-muted)' }}>
                        {verdict}
                    </span>
                )}
                {cut && (
                    <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] whitespace-nowrap"
                        style={{ color: 'var(--db-muted)', border: '1px solid var(--db-border)' }}
                    >
                        {cut}
                    </span>
                )}
                {application.group && (
                    <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] whitespace-nowrap"
                        style={{ color: 'var(--db-text)', background: 'var(--db-surface-2)' }}
                    >
                        {laneShort(application.group)}
                    </span>
                )}
                <RoleTags tags={application.tags} inline />
                {application.source === 'ycombinator' && <YcBadge />}
                {skill && (
                    <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] whitespace-nowrap"
                        style={{ color: 'var(--db-muted)', background: 'var(--db-surface-2)' }}
                        title="How many of the JD's requirements your skills cover strongly, out of all it asks for. 'To fix' counts skills you have that your CV or LinkedIn do not fully show."
                    >
                        {skill.match_strong}/{skill.requirements} strong
                        {skill.to_surface > 0 && (
                            <span className="font-semibold" style={{ color: 'var(--db-band-excellent)' }}>
                                · {skill.to_surface} to fix
                            </span>
                        )}
                    </span>
                )}
            </div>
        </div>
    );
}
