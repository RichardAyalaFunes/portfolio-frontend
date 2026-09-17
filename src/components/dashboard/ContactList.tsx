import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { dashboardApi, type RoleContact } from '../../api/dashboardApi';

const STAGES = ['not_contacted', 'sent', 'replied'] as const;

const STAGE_LABEL: Record<string, string> = {
    not_contacted: 'Not contacted',
    sent: 'Sent',
    replied: 'Replied',
};

function CopyButton({ text }: { text: string }) {
    const [copied, setCopied] = useState(false);
    return (
        <button
            onClick={async () => {
                await navigator.clipboard.writeText(text);
                setCopied(true);
                setTimeout(() => setCopied(false), 1500);
            }}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs shrink-0"
            style={{ background: 'var(--db-surface-2)' }}
        >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
        </button>
    );
}

function ContactRow({
    contact,
    ranked,
    onStageChange,
}: {
    contact: RoleContact;
    ranked: boolean;
    onStageChange: (stage: string) => void;
}) {
    const overLimit = contact.message_draft ? contact.message_draft.length > 200 : false;
    return (
        <div
            className="p-3 rounded-xl"
            style={{ background: 'var(--db-surface-2)', border: ranked ? '1px solid var(--db-accent)' : undefined }}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                        {ranked && contact.priority_rank && (
                            <span
                                className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold shrink-0"
                                style={{ background: 'var(--db-accent)', color: '#0b0e14' }}
                            >
                                {contact.priority_rank}
                            </span>
                        )}
                        <p className="text-sm font-medium truncate">{contact.name}</p>
                    </div>
                    {contact.title && (
                        <p className="text-xs truncate" style={{ color: 'var(--db-muted)' }}>
                            {contact.title}
                        </p>
                    )}
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                        {contact.category && (
                            <span className="text-[10px] uppercase tracking-wide" style={{ color: 'var(--db-accent)' }}>
                                {contact.category.replace(/_/g, ' ')}
                            </span>
                        )}
                        {contact.connection_degree && (
                            <span className="text-[10px]" style={{ color: 'var(--db-muted)' }}>
                                {contact.connection_degree}
                                {contact.mutual_connections ? ` · ${contact.mutual_connections} mutual` : ''}
                            </span>
                        )}
                    </div>
                </div>
                {contact.linkedin_url && (
                    <a
                        href={contact.linkedin_url}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 p-1.5 rounded-lg"
                        style={{ background: 'var(--db-surface)' }}
                        aria-label="Open LinkedIn profile"
                    >
                        <ExternalLink size={14} />
                    </a>
                )}
            </div>

            {contact.reason && (
                <p className="text-xs mt-2" style={{ color: 'var(--db-muted)' }}>
                    {contact.reason}
                </p>
            )}

            {contact.message_draft && (
                <div className="mt-2 p-2 rounded-lg text-sm" style={{ background: 'var(--db-surface)' }}>
                    <p className="whitespace-pre-wrap">{contact.message_draft}</p>
                    <div className="flex items-center justify-between mt-1.5">
                        <span
                            className="text-[10px]"
                            style={{ color: overLimit ? 'var(--db-band-drop)' : 'var(--db-muted)' }}
                        >
                            {contact.message_draft.length} / 200 chars
                        </span>
                        <CopyButton text={contact.message_draft} />
                    </div>
                </div>
            )}

            <div className="mt-2">
                <select
                    value={contact.outreach_stage}
                    onChange={(e) => onStageChange(e.target.value)}
                    className="w-full px-2 py-1.5 rounded-lg text-xs"
                    style={{ background: 'var(--db-surface)' }}
                >
                    {STAGES.map((s) => (
                        <option key={s} value={s}>
                            {STAGE_LABEL[s]}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}

export function ContactList({
    applicationId,
    contacts,
    onUpdated,
}: {
    applicationId: string;
    contacts: RoleContact[];
    onUpdated: (contacts: RoleContact[]) => void;
}) {
    const [showAll, setShowAll] = useState(false);
    if (!contacts.length) return null;

    const sorted = [...contacts].sort((a, b) => (a.priority_rank ?? 99) - (b.priority_rank ?? 99));
    const top = sorted.filter((c) => c.priority_rank !== null && c.priority_rank <= 3);
    const rest = sorted.filter((c) => !top.includes(c));

    async function handleStageChange(contactId: string, stage: string) {
        const updated = await dashboardApi.updateContactStage(applicationId, contactId, stage);
        onUpdated(updated.contacts);
    }

    return (
        <div className="mt-5">
            <p className="text-xs uppercase tracking-wide mb-2" style={{ color: 'var(--db-muted)' }}>
                People to contact
            </p>
            <div className="flex flex-col gap-2">
                {top.map((c) => (
                    <ContactRow key={c.id} contact={c} ranked onStageChange={(s) => handleStageChange(c.id, s)} />
                ))}
            </div>
            {rest.length > 0 && (
                <>
                    <button
                        onClick={() => setShowAll((v) => !v)}
                        className="text-xs mt-2"
                        style={{ color: 'var(--db-accent)' }}
                    >
                        {showAll ? 'Hide' : `Show ${rest.length} more contact${rest.length > 1 ? 's' : ''}`}
                    </button>
                    {showAll && (
                        <div className="flex flex-col gap-2 mt-2">
                            {rest.map((c) => (
                                <ContactRow
                                    key={c.id}
                                    contact={c}
                                    ranked={false}
                                    onStageChange={(s) => handleStageChange(c.id, s)}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
