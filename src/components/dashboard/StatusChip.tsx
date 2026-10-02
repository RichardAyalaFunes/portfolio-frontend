import { statusColorVar } from './dashboardTokens';
import { statusLabel } from './queueBuckets';

export function StatusChip({ status }: { status: string }) {
    const color = statusColorVar(status);
    return (
        <span
            className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
            style={{ color, background: `color-mix(in srgb, ${color} 16%, transparent)` }}
        >
            {statusLabel(status)}
        </span>
    );
}
