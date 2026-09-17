/**
 * Review warnings the job-search agent attaches to a role (see the `tags` field in
 * profile/job-search/job-search-config.md). They tell Richard what to check first:
 * a `location_unsure` role should get its location verified before anything else is
 * read, so warnings sort first and render in the flag color.
 */

interface TagMeta {
    label: string;
    warning: boolean;
}

const KNOWN_TAGS: Record<string, TagMeta> = {
    location_unsure: { label: '📍 Location unsure', warning: true },
    company_type_unclear: { label: 'Company type unclear', warning: true },
    language_mixed: { label: 'Language mixed', warning: true },
    salary_unknown: { label: 'Salary unknown', warning: false },
    big_corporate: { label: '🏢 Big corporate', warning: false },
};

function metaFor(tag: string): TagMeta {
    return KNOWN_TAGS[tag] ?? { label: tag.replace(/_/g, ' '), warning: false };
}

export function RoleTags({ tags }: { tags: string[] | null | undefined }) {
    if (!tags?.length) return null;
    const sorted = [...tags].sort((a, b) => Number(metaFor(b).warning) - Number(metaFor(a).warning));

    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            {sorted.map((tag) => {
                const { label, warning } = metaFor(tag);
                const color = warning ? 'var(--db-band-flag)' : 'var(--db-muted)';
                return (
                    <span
                        key={tag}
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap"
                        style={{
                            color,
                            background: `color-mix(in srgb, ${color} 16%, transparent)`,
                            border: warning ? `1px solid color-mix(in srgb, ${color} 45%, transparent)` : undefined,
                        }}
                    >
                        {label}
                    </span>
                );
            })}
        </div>
    );
}
