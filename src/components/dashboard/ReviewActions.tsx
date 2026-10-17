import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Check, MessagesSquare, MoreHorizontal, Send, Trophy, X } from 'lucide-react';
import { statusColorVar } from './dashboardTokens';
import { statusLabel } from './queueBuckets';
import { STAGES, STATUSES, nextStage, stagePatch, type ReviewPatch, type ReviewState } from './reviewModel';

const STAGE_ICONS: Record<string, ReactNode> = {
    Applied: <Send size={16} />,
    Interviewing: <MessagesSquare size={16} />,
    Offer: <Trophy size={16} />,
};

interface ReviewActionsProps {
    state: ReviewState;
    saving: boolean;
    onChange: (patch: ReviewPatch) => void;
}

/**
 * The detail screen's action bar: Reject and Approve one click each, the stage button one step
 * forward, and a ⋯ menu beside each for every other status or stage. On a phone Reject and
 * Approve shrink to icons so the stage button keeps its words.
 */
export function ReviewActions({ state, saving, onChange }: ReviewActionsProps) {
    const forward = nextStage(state.stage);
    // Approved and not applied yet: applying is the one thing left to do, so that button leads.
    const applyIsNext = state.status === 'Approved' && state.stage === 'Not applied';

    return (
        <div className="flex gap-3">
            <div className="shrink-0 sm:flex-1 min-w-0 flex flex-col gap-1">
                <Caption label="Decision" value={statusLabel(state.status)} />
                <div className="flex gap-1.5">
                    <VerdictButton
                        verdict="Rejected"
                        label="Reject"
                        icon={<X size={18} />}
                        color="var(--db-band-drop)"
                        state={state}
                        saving={saving}
                        onChange={onChange}
                    />
                    <VerdictButton
                        verdict="Approved"
                        label="Approve"
                        icon={<Check size={18} />}
                        color="var(--db-band-good)"
                        state={state}
                        saving={saving}
                        onChange={onChange}
                    />
                    <OptionMenu
                        ariaLabel="More statuses"
                        heading="Set status"
                        options={STATUSES.map((status) => ({ value: status, label: statusLabel(status), color: statusColorVar(status) }))}
                        current={state.status}
                        disabled={saving}
                        onPick={(status) => onChange({ status })}
                    />
                </div>
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-1">
                <Caption label="Application" value={state.stage} />
                <div className="flex gap-1.5">
                    {forward ? (
                        <button
                            type="button"
                            onClick={() => onChange(stagePatch(state, forward))}
                            disabled={saving}
                            title={state.status === 'Approved' ? undefined : 'Also marks it Approved'}
                            className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 px-3 rounded-xl text-sm font-medium disabled:opacity-50"
                            style={
                                applyIsNext
                                    ? { background: 'var(--db-accent)', color: '#0b0e14' }
                                    : { background: 'var(--db-surface-2)', color: 'var(--db-text)', border: '1px solid var(--db-border)' }
                            }
                        >
                            <span className="inline-flex shrink-0">{STAGE_ICONS[forward]}</span>
                            <span className="truncate">
                                <span className="sm:hidden">{forward}</span>
                                <span className="hidden sm:inline">Mark {forward.toLowerCase()}</span>
                            </span>
                        </button>
                    ) : (
                        <div
                            className="flex-1 min-w-0 inline-flex items-center justify-center gap-2 px-3 rounded-xl text-sm"
                            style={{ border: '1px dashed var(--db-border)', color: 'var(--db-muted)', minHeight: 44 }}
                        >
                            <Check size={16} className="shrink-0" />
                            <span className="truncate">{state.stage}</span>
                        </div>
                    )}
                    <OptionMenu
                        ariaLabel="More stages"
                        heading="Set stage"
                        options={STAGES.map((stage) => ({
                            value: stage,
                            label: stage,
                            hint: stagePatch(state, stage).status ? 'Also marks it Approved' : undefined,
                        }))}
                        current={state.stage}
                        disabled={saving}
                        onPick={(stage) => onChange(stagePatch(state, stage))}
                    />
                </div>
            </div>
        </div>
    );
}

function Caption({ label, value }: { label: string; value: string }) {
    return (
        <p className="text-[11px] truncate" style={{ color: 'var(--db-muted)' }}>
            <span className="uppercase tracking-wide">{label}</span>
            <span aria-hidden> · </span>
            <span style={{ color: 'var(--db-text)' }}>{value}</span>
        </p>
    );
}

interface VerdictButtonProps {
    verdict: 'Approved' | 'Rejected';
    label: string;
    icon: ReactNode;
    color: string;
    state: ReviewState;
    saving: boolean;
    onChange: (patch: ReviewPatch) => void;
}

/** Tinted while it is an option, solid once it is the role's status (then there is nothing to click). */
function VerdictButton({ verdict, label, icon, color, state, saving, onChange }: VerdictButtonProps) {
    const active = state.status === verdict;
    return (
        <button
            type="button"
            onClick={() => onChange({ status: verdict })}
            disabled={saving || active}
            aria-label={active ? `${verdict} (current status)` : label}
            title={active ? `${verdict}. Use ⋯ to change it.` : label}
            className={`w-12 sm:w-auto sm:flex-1 inline-flex items-center justify-center gap-1.5 sm:px-3 rounded-xl text-sm font-medium ${active ? '' : 'disabled:opacity-50'}`}
            style={
                active
                    ? { background: color, color: '#0b0e14', border: `1px solid ${color}` }
                    : {
                          background: `color-mix(in srgb, ${color} 12%, transparent)`,
                          color,
                          border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
                      }
            }
        >
            {icon}
            <span className="hidden sm:inline">{active ? verdict : label}</span>
        </button>
    );
}

interface MenuOption {
    value: string;
    label: string;
    color?: string;
    hint?: string;
}

interface OptionMenuProps {
    ariaLabel: string;
    heading: string;
    options: MenuOption[];
    current: string;
    disabled: boolean;
    onPick: (value: string) => void;
}

/** The ⋯ button: every value, the current one ticked. Opens upward because it lives in a bottom bar. */
function OptionMenu({ ariaLabel, heading, options, current, disabled, onPick }: OptionMenuProps) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        function handlePointerDown(e: MouseEvent) {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
        }
        function handleKeyDown(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }
        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [open]);

    return (
        <div className="relative shrink-0" ref={rootRef}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                disabled={disabled}
                aria-label={ariaLabel}
                aria-haspopup="menu"
                aria-expanded={open}
                className="w-11 inline-flex items-center justify-center rounded-xl disabled:opacity-50"
                style={{ background: 'var(--db-surface-2)', border: '1px solid var(--db-border)' }}
            >
                <MoreHorizontal size={18} />
            </button>

            {open && (
                <div
                    role="menu"
                    aria-label={heading}
                    className="absolute right-0 bottom-full mb-2 z-30 w-56 rounded-xl overflow-hidden py-1 shadow-lg"
                    style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)' }}
                >
                    <p className="px-3 pt-1.5 pb-1 text-[10px] font-semibold uppercase tracking-wide" style={{ color: 'var(--db-muted)' }}>
                        {heading}
                    </p>
                    {options.map((option) => {
                        const selected = option.value === current;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                role="menuitemradio"
                                aria-checked={selected}
                                onClick={() => {
                                    setOpen(false);
                                    if (!selected) onPick(option.value);
                                }}
                                className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-[var(--db-surface-2)]"
                                style={{ minHeight: 40 }}
                            >
                                {option.color && (
                                    <span aria-hidden className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: option.color }} />
                                )}
                                <span className="flex-1 min-w-0">
                                    <span className="block">{option.label}</span>
                                    {option.hint && !selected && (
                                        <span className="block text-[11px] leading-snug" style={{ color: 'var(--db-muted)' }}>
                                            {option.hint}
                                        </span>
                                    )}
                                </span>
                                {selected && <Check size={14} className="shrink-0" style={{ color: 'var(--db-accent)' }} />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
