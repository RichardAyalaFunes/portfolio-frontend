import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FilterMenuOption {
    id: string;
    label: string;
    count: number;
    /** Muted line under the label: what lands in this option and why. */
    hint?: string;
    /** Color of the small dot before the label. */
    color?: string;
}

export interface FilterMenuGroup {
    id: string;
    heading?: string;
    options: FilterMenuOption[];
}

interface FilterMenuProps {
    ariaLabel: string;
    /** Button text while nothing is selected ("All stages", "All lanes"). */
    emptyLabel: string;
    groups: FilterMenuGroup[];
    selected: ReadonlyArray<string>;
    onToggle: (id: string) => void;
    onClear: () => void;
    /** Small muted text at the right of the button, e.g. how many roles the selection shows. */
    trailing?: string;
}

/** A checkbox dropdown: pick any number of options; picking none means "all". */
export function FilterMenu({ ariaLabel, emptyLabel, groups, selected, onToggle, onClear, trailing }: FilterMenuProps) {
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

    const selectedLabels = groups
        .flatMap((group) => group.options)
        .filter((option) => selected.includes(option.id))
        .map((option) => option.label);

    return (
        <div className="relative" ref={rootRef}>
            <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                aria-label={ariaLabel}
                aria-expanded={open}
                className="w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs"
                style={{ background: 'var(--db-surface-2)' }}
            >
                <span className="truncate text-left">{selectedLabels.length === 0 ? emptyLabel : selectedLabels.join(', ')}</span>
                <span className="flex items-center gap-2 shrink-0">
                    {trailing && <span style={{ color: 'var(--db-muted)' }}>{trailing}</span>}
                    <ChevronDown size={14} style={{ transform: open ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }} />
                </span>
            </button>

            {open && (
                <div
                    role="group"
                    aria-label={ariaLabel}
                    className="absolute left-0 right-0 top-full mt-1 z-20 rounded-xl overflow-y-auto max-h-[70vh] flex flex-col"
                    style={{ background: 'var(--db-surface)', border: '1px solid var(--db-border)' }}
                >
                    {selected.length > 0 && (
                        <button
                            type="button"
                            onClick={onClear}
                            className="text-left px-3 py-2 text-xs"
                            style={{ color: 'var(--db-accent)', borderBottom: '1px solid var(--db-border)', minHeight: 0 }}
                        >
                            Clear selection (show all)
                        </button>
                    )}
                    {groups.map((group) => (
                        <div key={group.id}>
                            {group.heading && (
                                <p
                                    className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-wide"
                                    style={{ color: 'var(--db-muted)' }}
                                >
                                    {group.heading}
                                </p>
                            )}
                            {group.options.map((option) => (
                                <label key={option.id} className="flex items-start gap-2.5 px-3 py-2 text-sm cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="mt-1"
                                        checked={selected.includes(option.id)}
                                        onChange={() => onToggle(option.id)}
                                    />
                                    <span className="flex-1 min-w-0">
                                        <span className="flex items-center gap-1.5">
                                            {option.color && (
                                                <span
                                                    aria-hidden
                                                    className="inline-block w-2 h-2 rounded-full shrink-0"
                                                    style={{ background: option.color }}
                                                />
                                            )}
                                            <span>{option.label}</span>
                                        </span>
                                        {option.hint && (
                                            <span className="block text-[11px] leading-snug" style={{ color: 'var(--db-muted)' }}>
                                                {option.hint}
                                            </span>
                                        )}
                                    </span>
                                    <span className="text-xs tabular-nums mt-0.5" style={{ color: 'var(--db-muted)' }}>
                                        {option.count}
                                    </span>
                                </label>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
