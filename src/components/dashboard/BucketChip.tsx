import { BUCKET_BY_ID, type BucketId } from './queueBuckets';

/** The role's queue bucket as a colored pill ("To review", "Applied", "No longer open", ...). */
export function BucketChip({ bucket }: { bucket: BucketId }) {
    const { label, color } = BUCKET_BY_ID[bucket];
    return (
        <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
            style={{ color, background: `color-mix(in srgb, ${color} 16%, transparent)` }}
        >
            {label}
        </span>
    );
}
