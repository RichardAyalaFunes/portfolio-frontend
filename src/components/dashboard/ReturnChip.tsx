import type { JobApplication } from '../../api/dashboardApi';
import { returnBadge, todayIso, toneColor } from './returnsModel';

/**
 * "↻ Reposted · you rejected it": the flag that this role is one we already had, and what
 * was decided about it. Nothing when it never came back.
 */
export function ReturnChip({ application }: { application: Pick<JobApplication, 'extras'> }) {
    const badge = returnBadge(application, todayIso());
    if (!badge) return null;
    const color = toneColor(badge.tone);
    return (
        <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
            style={{
                color,
                background: `color-mix(in srgb, ${color} 16%, transparent)`,
                border: `1px solid color-mix(in srgb, ${color} 45%, transparent)`,
            }}
            title={badge.title}
        >
            {badge.label}
        </span>
    );
}
