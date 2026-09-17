import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ExternalLink, MoreVertical, ChevronDown } from 'lucide-react';
import { dashboardApi, type JobApplication, type RoleContact } from '../../api/dashboardApi';
import { StatusChip } from './StatusChip';
import { YcBadge } from './YcBadge';
import { ContactList } from './ContactList';
import { RoleFormSection } from './RoleFormSection';

const ENRICHMENT_SCORE_THRESHOLD = 80;

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

export function ApplicationDetail() {
    const { applicationId } = useParams();
    const navigate = useNavigate();
    const [application, setApplication] = useState<JobApplication | null>(null);
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState('');
    const [stage, setStage] = useState('');
    const [saving, setSaving] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [error, setError] = useState(false);

    useEffect(() => {
        if (!applicationId) return;
        setApplication(null);
        setError(false);
        dashboardApi
            .getApplication(applicationId)
            .then((app) => {
                setApplication(app);
                setNotes(app.notes);
                setStatus(app.status);
                setStage(app.application_stage);
            })
            .catch(() => setError(true));
    }, [applicationId]);

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

    const dirty = notes !== application.notes;

    async function handleSave() {
        if (!applicationId) return;
        setSaving(true);
        try {
            const updated = await dashboardApi.updateApplication(applicationId, { notes });
            setApplication(updated);
        } finally {
            setSaving(false);
        }
    }

    async function handleStatusChange(nextStatus: string) {
        setStatus(nextStatus);
        if (!applicationId) return;
        setSaving(true);
        try {
            const updated = await dashboardApi.updateApplication(applicationId, { status: nextStatus });
            setApplication(updated);
        } finally {
            setSaving(false);
        }
    }

    async function handleStageChange(nextStage: string) {
        setStage(nextStage);
        if (!applicationId) return;
        setSaving(true);
        try {
            const updated = await dashboardApi.updateApplication(applicationId, { stage: nextStage });
            setApplication(updated);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete() {
        if (!applicationId) return;
        await dashboardApi.archiveApplication(applicationId);
        navigate('/dashboard');
    }

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

            <div className="flex-1 overflow-y-auto px-5 py-4 pb-32">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h1 className="text-lg font-medium leading-snug">{application.title}</h1>
                        <p style={{ color: 'var(--db-muted)' }}>{application.company}</p>
                    </div>
                    <button
                        onClick={() => setConfirmDelete(true)}
                        className="hidden lg:block text-xs shrink-0"
                        style={{ color: 'var(--db-band-drop)' }}
                    >
                        Delete
                    </button>
                </div>

                <div className="flex items-center gap-2 mt-3">
                    <StatusChip status={application.status} />
                    {application.source === 'ycombinator' && <YcBadge />}
                    {application.score !== null && (
                        <span className="text-xs" style={{ color: 'var(--db-muted)' }}>
                            Score {application.score}
                        </span>
                    )}
                </div>

                {application.jd_url && (
                    <a
                        href={application.jd_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 mt-4 px-4 py-2 rounded-xl text-sm font-medium"
                        style={{ background: 'var(--db-surface-2)' }}
                    >
                        Open posting <ExternalLink size={14} />
                    </a>
                )}

                <div className="grid grid-cols-2 gap-3 mt-5 text-sm">
                    <Fact label="Location" value={application.location_text} />
                    <Fact label="Work mode" value={application.work_mode} />
                    <Fact label="Type" value={application.employment_type} />
                    <Fact label="Salary" value={application.salary_text} />
                    <Fact label="Group" value={application.group} />
                    <Fact label="Source" value={application.source} />
                </div>

                {application.why_apply && (
                    <div
                        className="mt-5 p-3 rounded-xl text-sm"
                        style={{ background: 'color-mix(in srgb, var(--db-band-good) 12%, transparent)' }}
                    >
                        <p className="font-medium mb-1" style={{ color: 'var(--db-band-good)' }}>
                            Why apply
                        </p>
                        <p style={{ color: 'var(--db-text)' }}>{application.why_apply}</p>
                    </div>
                )}
                {application.why_not && (
                    <div
                        className="mt-3 p-3 rounded-xl text-sm"
                        style={{ background: 'color-mix(in srgb, var(--db-band-drop) 12%, transparent)' }}
                    >
                        <p className="font-medium mb-1" style={{ color: 'var(--db-band-drop)' }}>
                            Why not
                        </p>
                        <p style={{ color: 'var(--db-text)' }}>{application.why_not}</p>
                    </div>
                )}

                {application.score !== null && application.score >= ENRICHMENT_SCORE_THRESHOLD && (
                    <>
                        <ContactList
                            applicationId={application.id}
                            contacts={application.contacts}
                            onUpdated={(contacts: RoleContact[]) =>
                                setApplication((prev) => (prev ? { ...prev, contacts } : prev))
                            }
                        />
                        <RoleFormSection form={application.application_form} />
                    </>
                )}

                <div className="mt-2">
                    <CollapsibleSection title="Considerations" text={application.considerations} />
                    <CollapsibleSection title="Eligibility" text={application.eligibility_text} />
                    <CollapsibleSection title="Requirements" text={application.requirements_excerpt} />
                </div>

                <div className="mt-5">
                    <label className="text-xs uppercase tracking-wide" style={{ color: 'var(--db-muted)' }}>
                        Notes
                    </label>
                    <textarea
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
                        className="flex-1 px-3 py-2.5 rounded-xl text-sm"
                    >
                        {STATUSES.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                    <select
                        value={stage}
                        onChange={(e) => handleStageChange(e.target.value)}
                        disabled={saving}
                        className="flex-1 px-3 py-2.5 rounded-xl text-sm"
                    >
                        {STAGES.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>
                </div>
                <button
                    onClick={handleSave}
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
        <div>
            <p className="text-xs" style={{ color: 'var(--db-muted)' }}>
                {label}
            </p>
            <p>{value}</p>
        </div>
    );
}
