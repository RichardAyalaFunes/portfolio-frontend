import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, MoreVertical, ChevronDown } from 'lucide-react';
import { dashboardApi, type JobApplication, type RoleContact } from '../../api/dashboardApi';
import { BucketChip } from './BucketChip';
import { YcBadge } from './YcBadge';
import { ContactList } from './ContactList';
import { RoleFormSection } from './RoleFormSection';
import { RoleTags } from './RoleTags';
import { SkillMatch } from './SkillMatch';
import type { QueueOutletContext } from './queueContext';
import { BUCKET_BY_ID, STATUS_HELP, bucketOf, dropReasonLabel, isPostingDead, laneLabel, statusLabel } from './queueBuckets';
import { hasSkillRows } from './skillMatchModel';

const ENRICHMENT_SCORE_THRESHOLD = 80;
/** The score a role needs to pass the search agent's bar (config: matching rubrics, bands). */
const PASS_BAR = 75;

const STATUSES = ['To validate', 'Approved', 'Rejected', 'Cold', 'Flagged', 'Dropped'];
const STAGES = ['Not applied', 'Applied', 'Interviewing', 'Offer', 'Closed'];

function CollapsibleSection({ title, text }: { title: string; text: string | null }) {
    const [open, setOpen] = useState(false);
    if (!text) return null;
    return (
        <div style={{ borderTop: '1px solid var(--db-border)' }} className="py-3">
            <button onClick={() => setOpen((v) => !v)} className="w-full flex items-center justify-between">
                <span className="text-sm font-medium">{title}</span>
                <ChevronDown size={16} style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }} />
            </button>
            {open && (
                <p className="text-sm mt-2 whitespace-pre-wrap" style={{ color: 'var(--db-muted)' }}>
                    {text}
                </p>
            )}
        </div>
    );
}

/** Keyed by the role id so every role starts from a clean slate (no state to reset by hand). */
export function ApplicationDetail() {
    const { applicationId } = useParams();
    if (!applicationId) return null;
    return <LoadedApplicationDetail key={applicationId} applicationId={applicationId} />;
}

function LoadedApplicationDetail({ applicationId }: { applicationId: string }) {
    const navigate = useNavigate();
    const queue = useOutletContext<QueueOutletContext | undefined>();
    const [application, setApplication] = useState<JobApplication | null>(null);
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState('');
    const [stage, setStage] = useState('');
    const [saving, setSaving] = useState(false);
    const [saveNote, setSaveNote] = useState<{ kind: 'ok' | 'error'; text: string } | null>(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        let cancelled = false;
        dashboardApi
            .getApplication(applicationId)
            .then((app) => {
                if (cancelled) return;
                setApplication(app);
                setNotes(app.notes);
                setStatus(app.status);
                setStage(app.application_stage);
            })
            .catch(() => {
                if (!cancelled) setError(true);
            });
        return () => {
            cancelled = true;
        };
    }, [applicationId]);

    useEffect(() => {
        if (saveNote?.kind !== 'ok') return;
        const timer = setTimeout(() => setSaveNote(null), 4000);
        return () => clearTimeout(timer);
    }, [saveNote]);

    if (error) {
        return (
            <div className="p-6">
                <p style={{ color: 'var(--db-band-drop)' }}>Could not load this application.</p>
            </div>
        );
    }
    if (!application) {
        return (
            <div className="p-6 flex flex-col gap-3">
                <div className="dashboard-skeleton h-6 w-2/3" />
                <div className="dashboard-skeleton h-4 w-1/3" />
                <div className="dashboard-skeleton h-32" />
            </div>
        );
    }

    const current = application;
    const dirty = notes !== current.notes;
    const bucket = bucketOf(current);

    /**
     * Saves a change, then puts the server's copy into the queue's list so the
     * list on the left reflects the new status/stage straight away. `revert` undoes
     * the optimistic select change if the save fails.
     */
    async function save(patch: { status?: string; stage?: string; notes?: string }, revert: () => void) {
        setSaving(true);
        setSaveNote(null);
        try {
            const updated = await dashboardApi.updateApplication(applicationId, patch);
            setApplication(updated);
            setStatus(updated.status);
            setStage(updated.application_stage);
            if (patch.notes !== undefined) setNotes(updated.notes);
            queue?.onApplicationChanged(updated);

            const next = bucketOf(updated);
            setSaveNote({
                kind: 'ok',
                text: next === bucketOf(current) ? 'Saved.' : `Saved. Now in ${BUCKET_BY_ID[next].label}.`,
            });
        } catch {
            revert();
            setSaveNote({ kind: 'error', text: 'Could not save. Check your connection and try again.' });
        } finally {
            setSaving(false);
        }
    }

    function handleSaveNotes() {
        return save({ notes }, () => {});
    }

    function handleStatusChange(nextStatus: string) {
        const previous = status;
        setStatus(nextStatus);
        return save({ status: nextStatus }, () => setStatus(previous));
    }

    function handleStageChange(nextStage: string) {
        const previous = stage;
        setStage(nextStage);
        return save({ stage: nextStage }, () => setStage(previous));
    }

    async function handleDelete() {
        await dashboardApi.archiveApplication(applicationId);
        queue?.onApplicationRemoved(applicationId);
        navigate('/dashboard');
    }

    const cutReason = dropReasonLabel(current.drop_reason);

    return (
        <div className="flex flex-col min-h-full">
            <div className="flex items-center justify-between px-4 py-3 lg:hidden" style={{ borderBottom: '1px solid var(--db-border)' }}>
                <button onClick={() => navigate('/dashboard')} aria-label="Back">
                    <ArrowLeft size={20} />
                </button>
                <div className="relative">
                    <button onClick={() => setMenuOpen((v) => !v)} aria-label="More options">
                        <MoreVertical size={20} />
                    </button>
                    {menuOpen && (
                        <div
                            className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden z-10"
                            style={{ background: 'var(--db-surface-2)', border: '1px solid var(--db-border)' }}
                        >
                            <button
                                onClick={() => {
                                    setMenuOpen(false);
                                    setConfirmDelete(true);
                                }}
                                className="px-4 py-2.5 text-sm whitespace-nowrap"
                                style={{ color: 'var(--db-band-drop)' }}
                            >
                                Delete
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 pb-44">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-lg font-medium leading-snug">{current.title}</h1>
                        <p style={{ color: 'var(--db-muted)' }}>{current.company}</p>
                    </div>
                    <button
                        onClick={() => setConfirmDelete(true)}
                        className="hidden lg:block text-xs shrink-0"
                        style={{ color: 'var(--db-band-drop)' }}
                    >
                        Delete
                    </button>
                </div>

                <div className="flex items-center gap-2 mt-3 flex-wrap">
                    <BucketChip bucket={bucket} />
                    {isPostingDead(current) && bucket !== 'no_longer_open' && (
                        <span className="text-xs" style={{ color: 'var(--db-muted)' }}>
                            Posting closed
                        </span>
                    )}
                    {current.source === 'ycombinator' && <YcBadge />}
                    {current.score !== null && (
                        <span className="text-xs" style={{ color: 'var(--db-muted)' }}>
                            Score {current.score}
                        </span>
                    )}
                </div>

                {current.tags?.length > 0 && (
                    <div className="mt-2">
                        <RoleTags tags={current.tags} />
                    </div>
                )}

                {(bucket === 'didnt_pass' || bucket === 'dropped') && (
                    <div className="mt-4 p-3 rounded-xl text-sm" style={{ background: 'var(--db-surface-2)' }}>
                        <p className="font-medium mb-1">
                            {bucket === 'didnt_pass'
                                ? `Didn't pass: scored ${current.score ?? '?'}, the bar is ${PASS_BAR}`
                                : `Cut by a rule${cutReason ? `: ${cutReason}` : ''}`}
                        </p>
                        <p style={{ color: 'var(--db-muted)' }}>
                            {bucket === 'didnt_pass'
                                ? 'The search agent kept it so you can re-check the score and the reasons below.'
                                : 'The search agent dropped it after reading the posting. It is kept so you can audit the rules.'}{' '}
                            <Link to="/dashboard/rules" className="underline" style={{ color: 'var(--db-accent)' }}>
                                See the rules
                            </Link>
                        </p>
                    </div>
                )}

                {current.jd_url && (
                    <a
                        href={current.jd_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl text-sm font-medium"
                        style={{ background: 'var(--db-surface-2)' }}
                    >
                        Open posting <ExternalLink size={14} />
                    </a>
                )}

                <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
                    <Fact label="Location" value={current.location_text} />
                    <Fact label="Work mode" value={current.work_mode} />
                    <Fact label="Type" value={current.employment_type} />
                    <Fact label="Salary" value={current.salary_text} />
                    <Fact label="Lane" value={current.group ? laneLabel(current.group) : null} />
                    <Fact label="Also fits" value={current.secondary_lanes?.length ? current.secondary_lanes.map(laneLabel).join(', ') : null} />
                    <Fact label="Source" value={current.source} />
                </div>

                {current.why_apply && (
                    <div
                        className="mt-5 p-3 rounded-xl text-sm"
                        style={{ background: 'color-mix(in srgb, var(--db-band-good) 12%, transparent)' }}
                    >
                        <p className="font-medium mb-1" style={{ color: 'var(--db-band-good)' }}>
                            Why apply
                        </p>
                        <p style={{ color: 'var(--db-text)' }}>{current.why_apply}</p>
                    </div>
                )}
                {current.why_not && (
                    <div
                        className="mt-3 p-3 rounded-xl text-sm"
                        style={{ background: 'color-mix(in srgb, var(--db-band-drop) 12%, transparent)' }}
                    >
                        <p className="font-medium mb-1" style={{ color: 'var(--db-band-drop)' }}>
                            Why not
                        </p>
                        <p style={{ color: 'var(--db-text)' }}>{current.why_not}</p>
                    </div>
                )}

                {hasSkillRows(current.skill_match) && <SkillMatch data={current.skill_match} />}

                {current.score !== null && current.score >= ENRICHMENT_SCORE_THRESHOLD && (
                    <>
                        <ContactList
                            applicationId={current.id}
                            contacts={current.contacts}
                            onUpdated={(contacts: RoleContact[]) =>
                                setApplication((prev) => (prev ? { ...prev, contacts } : prev))
                            }
                        />
                        <RoleFormSection form={current.application_form} />
                    </>
                )}

                <div className="mt-2">
                    <CollapsibleSection title="Considerations" text={current.considerations} />
                    <CollapsibleSection title="Eligibility" text={current.eligibility_text} />
                    <CollapsibleSection title="Requirements" text={current.requirements_excerpt} />
                    <CollapsibleSection title="Found by search lines" text={current.discovery_queries?.join('\n') || null} />
                </div>

                <div className="mt-5">
                    <label htmlFor="role-notes" className="text-xs uppercase tracking-wide" style={{ color: 'var(--db-muted)' }}>
                        Notes
                    </label>
                    <textarea
                        id="role-notes"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        rows={4}
                        className="w-full mt-2 p-3 rounded-xl text-sm resize-none"
                    />
                </div>
            </div>

            <div
                className="fixed bottom-20 lg:sticky lg:bottom-0 inset-x-0 lg:inset-x-auto px-4 py-3 flex flex-col gap-2"
                style={{ background: 'var(--db-surface)', borderTop: '1px solid var(--db-border)' }}
            >
                <div className="flex gap-2">
                    <select
                        value={status}
                        onChange={(e) => handleStatusChange(e.target.value)}
                        disabled={saving}
                        aria-label="Status"
                        className="flex-1 px-3 py-2.5 rounded-xl text-sm"
                    >
                        {STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {statusLabel(s)}
                            </option>
                        ))}
                    </select>
                    <select
                        value={stage}
                        onChange={(e) => handleStageChange(e.target.value)}
                        disabled={saving}
                        aria-label="Stage"
                        className="flex-1 px-3 py-2.5 rounded-xl text-sm"
                    >
                        {STAGES.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>
                <p
                    role="status"
                    aria-live="polite"
                    className="text-[11px] leading-snug"
                    style={{
                        color: saving
                            ? 'var(--db-muted)'
                            : saveNote
                              ? saveNote.kind === 'error'
                                  ? 'var(--db-band-drop)'
                                  : 'var(--db-band-good)'
                              : 'var(--db-muted)',
                    }}
                >
                    {saving ? 'Saving…' : (saveNote?.text ?? STATUS_HELP[status])}
                </p>
                <button
                    onClick={handleSaveNotes}
                    disabled={!dirty || saving}
                    className="w-full py-2.5 rounded-xl font-medium disabled:opacity-40"
                    style={{ background: 'var(--db-accent)', color: '#0b0e14' }}
                >
                    {saving ? 'Saving…' : 'Save notes'}
                </button>
            </div>

            {confirmDelete && (
                <div className="fixed inset-0 z-40 flex items-center justify-center px-6">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmDelete(false)} />
                    <div
                        className="relative w-full max-w-sm rounded-2xl p-5 flex flex-col gap-4"
                        style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)' }}
                    >
                        <p>Delete this application? It's kept for history but removed from the queue.</p>
                        <div className="flex gap-2">
                            <button onClick={() => setConfirmDelete(false)} className="flex-1 py-2 rounded-xl" style={{ background: 'var(--db-surface-2)' }}>
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 py-2 rounded-xl font-medium"
                                style={{ background: 'var(--db-band-drop)', color: '#0b0e14' }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function Fact({ label, value }: { label: string; value: string | null }) {
    if (!value) return null;
    return (
        <div className="min-w-0">
            <p className="text-xs" style={{ color: 'var(--db-muted)' }}>
                {label}
            </p>
            <p className="break-words">{value}</p>
        </div>
    );
}
