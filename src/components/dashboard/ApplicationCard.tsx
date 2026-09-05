import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import type { JobApplication } from '../../api/dashboardApi';
import { StatusChip } from './StatusChip';
import { bandColorVar, freshnessColorVar, freshnessLabel } from './dashboardTokens';

export function ApplicationCard({ application }: { application: JobApplication }) {
    const navigate = useNavigate();

    return (
        <button
            onClick={() => navigate(`/dashboard/${application.id}`)}
            className="w-full text-left px-4 py-3 flex flex-col gap-1.5 active:opacity-70 transition-opacity"
            style={{ borderBottom: '1px solid var(--db-border)' }}
        >
            <div className="flex items-start justify-between gap-2">
                <span className="font-medium leading-snug">{application.title}</span>
                {application.score !== null && (
                    <span
                        className="text-xs font-semibold shrink-0 mt-0.5"
                        style={{ color: bandColorVar(application.band) }}
                    >
                        {application.score}
                    </span>
                )}
            </div>
            <span className="text-sm" style={{ color: 'var(--db-muted)' }}>
                {application.company}
            </span>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <StatusChip status={application.status} />
                <span className="text-xs" style={{ color: freshnessColorVar(application.posted_date) }}>
                    {freshnessLabel(application.posted_date)}
                </span>
                {application.jd_url && (
                    <a
                        href={application.jd_url}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="ml-auto"
                        style={{ color: 'var(--db-muted)' }}
                        aria-label="Open posting"
                    >
                        <ExternalLink size={14} />
                    </a>
                )}
            </div>
            {(application.location_text || application.work_mode) && (
                <span className="text-xs" style={{ color: 'var(--db-muted)' }}>
                    {[application.location_text, application.work_mode].filter(Boolean).join(' · ')}
                </span>
            )}
        </button>
    );
}
