import { useEffect, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, MoreVertical, ChevronDown } from 'lucide-react';
import { dashboardApi, type JobApplication, type RoleContact } from '../../api/dashboardApi';
import { BucketChip } from './BucketChip';
import { YcBadge } from './YcBadge';
import { ContactList } from './ContactList';
import { ReviewActions } from './ReviewActions';
import { RoleFormSection } from './RoleFormSection';
import { RoleTags } from './RoleTags';
import { SkillMatch } from './SkillMatch';
import type { QueueOutletContext } from './queueContext';
import { BUCKET_BY_ID, STATUS_HELP, bucketOf, dropReasonLabel, isPostingDead, laneLabel } from './queueBuckets';
import { undoPatch, type ReviewPatch } from './reviewModel';
import { hasSkillRows } from './skillMatchModel';

const ENRICHMENT_SCORE_THRESHOLD = 80;

/** How long "Saved." stays up; longer when it carries an Undo, so there is time to reach it. */
const SAVE_NOTE_MS = 4000;
const UNDO_NOTE_MS = 8000;

type SaveNote = { kind: 'ok' | 'error'; text: string; undo?: ReviewPatch };

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
    const [saveNote, setSaveNote] = useState<SaveNote | null>(null);
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
        const timer = setTimeout(() => setSaveNote(null), saveNote.undo ? UNDO_NOTE_MS : SAVE_NOTE_MS);
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
     * the optimistic button change if the save fails. A status or stage change
     * offers Undo; `undoing` marks the save that is that Undo.
     */
    async function save(
        patch: ReviewPatch & { notes?: string },
        revert: () => void,
        { undoing = false }: { undoing?: boolean } = {},
    ) {
        const before = { status: current.status, stage: current.application_stage };
        setSaving(true);
        setSaveNote(null);
        try {
            const updated = await dashboardApi.updateApplication(applicationId, patch);
            setApplication(updated);
            setStatus(updated.status);
            setStage(updated.application_stage);
            // Keep what was typed while the request ran: only a textarea still showing the saved text is reset.
            if (patch.notes !== undefined) setNotes((typed) => (typed === patch.notes ? updated.notes : typed));
            queue?.onApplicationChanged(updated);

            const next = bucketOf(updated);
            const moved = next !== bucketOf(current);
            const undo = undoing ? null : undoPatch(before, { status: updated.status, stage: updated.application_stage });
            setSaveNote({
                kind: 'ok',
                text: undoing
                    ? moved ? `Undone. Back in ${BUCKET_BY_ID[next].label}.` : 'Undone.'
                    : moved ? `Saved. Now in ${BUCKET_BY_ID[next].label}.` : 'Saved.',
                undo: undo ?? undefined,
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

    /** A Reject / Approve / stage click. Notes typed but not saved yet go along, so the verdict and its reason land together. */
    function handleReviewChange(patch: ReviewPatch, { undoing = false }: { undoing?: boolean } = {}) {
        const previous = { status, stage };
        if (patch.status !== undefined) setStatus(patch.status);
        if (patch.stage !== undefined) setStage(patch.stage);
        return save(
            dirty && !undoing ? { ...patch, notes } : patch,
            () => {
                setStatus(previous.status);
                setStage(previous.stage);
            },
            { undoing },
        );
    }

    async function handleDelete() {
        await dashboardApi.archiveApplication(applicationId);
        queue?.onApplicationRemoved(applicationId);
        navigate('/dashboard');
    }

    const cutReason = dropReasonLabel(current.drop_reason);
    // Once he has applied, the stage says more than the verdict does ("You have an offer.").
    const idleHelp = stage === 'Not applied' ? STATUS_HELP[status] : BUCKET_BY_ID[bucket].hint;

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

            <div className="flex-1 overflow-y-auto px-5 py-4 pb-36 lg:pb-6">
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
                                ? `Didn't pass: scored ${current.score ?? '?'}, under the pass bar`
                                : `Cut by a rule${cutReason ? `: ${cutReason}` : ''}`}
                        </p>
                        <p style={{ color: 'var(--db-muted)' }}>
                            {bucket === 'didnt_pass'
                                ? 'The search agent kept it so you can re-check the score and the reasons below.'
                                : 'The search agent dropped it after reading the posting. It is kept so you can audit the rules.'}{' '}
                            <Link to="/dashboard/rules" className="underline" style={{ color: 'var(--db-accent)' }}>
                                See the bar and the rules
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
                    <div className="flex items-center justify-end gap-3 mt-2">
                        {dirty && (
                            <span className="text-[11px]" style={{ color: 'var(--db-muted)' }}>
                                Not saved yet. Reject, Approve or a stage change also saves it.
                            </span>
                        )}
                        <button
                            onClick={handleSaveNotes}
                            disabled={!dirty || saving}
                            className="shrink-0 px-4 rounded-xl text-sm font-medium disabled:opacity-40"
                            style={{ background: 'var(--db-accent)', color: '#0b0e14' }}
                        >
                            Save notes
                        </button>
                    </div>
                </div>
            </div>

            <div
                className="fixed bottom-20 lg:sticky lg:bottom-0 inset-x-0 lg:inset-x-auto z-10 px-4 py-3 flex flex-col gap-2"
                style={{ background: 'var(--db-surface)', borderTop: '1px solid var(--db-border)' }}
            >
                <ReviewActions state={{ status, stage }} saving={saving} onChange={(patch) => void handleReviewChange(patch)} />
                <div className="flex items-center gap-3 min-h-[18px]">
                    <p
                        role="status"
                        aria-live="polite"
                        className="flex-1 min-w-0 text-[11px] leading-snug"
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
                        {saving ? 'Saving…' : (saveNote?.text ?? idleHelp)}
                    </p>
                    {!saving && saveNote?.undo && (
                        <button
                            onClick={() => saveNote.undo && void handleReviewChange(saveNote.undo, { undoing: true })}
                            // Padding cancelled by negative margins: a finger-sized target that does not grow the bar when it appears.
                            className="shrink-0 px-2 py-2 -my-2 -mr-2 text-xs font-medium underline"
                            style={{ color: 'var(--db-accent)', minHeight: 0 }}
                        >
                            Undo
                        </button>
                    )}
                </div>
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
