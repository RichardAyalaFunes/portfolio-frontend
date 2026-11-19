/**
 * What the detail screen's quick actions write.
 *
 * Reject and Approve are one click each, and the stage button offers the one step forward
 * (Not applied -> Applied -> Interviewing -> Offer). Every other status or stage sits in the
 * button's menu. Each click saves straight away, so each one can be undone.
 *
 * Dependency-free on purpose (type imports only), like the other pure dashboard modules, so
 * `node --test` can run its tests without a bundler.
 */

export const STATUSES: ReadonlyArray<string> = ['To validate', 'Approved', 'Rejected', 'Flagged', 'Cold', 'Dropped'];
export const STAGES: ReadonlyArray<string> = ['Not applied', 'Applied', 'Interviewing', 'Offer', 'Closed'];

export interface ReviewState {
    status: string;
    stage: string;
    /** Rejected because it repeats another role (the server keeps this as a reason on the rejection). */
    duplicate?: boolean;
}

export interface ReviewPatch {
    status?: string;
    stage?: string;
    /** Only 'duplicate' is known. Sent together with status Rejected. */
    rejection_reason?: string;
}

/** The save for the Duplicate action: a rejection that says why, so the search agent does not read it as taste. */
export const DUPLICATE_PATCH: ReviewPatch = { status: 'Rejected', rejection_reason: 'duplicate' };

/** True for a role Richard rejected as a duplicate. Works on the API shape (`extras.rejection_reason`). */
export function isDuplicate(role: { status: string; extras?: Record<string, unknown> | null }): boolean {
    return role.status === 'Rejected' && role.extras?.rejection_reason === 'duplicate';
}

/**
 * Whether a key press in the notes box saves the note: Enter on its own. Shift+Enter keeps its
 * meaning (a new line), and Enter while an input method is composing a word (accents, CJK)
 * confirms the word instead.
 */
export function savesNote(e: { key: string; shiftKey: boolean; altKey?: boolean; isComposing?: boolean }): boolean {
    return e.key === 'Enter' && !e.shiftKey && !e.altKey && !e.isComposing;
}

const FORWARD: Record<string, string> = {
    'Not applied': 'Applied',
    Applied: 'Interviewing',
    Interviewing: 'Offer',
};

/** The one forward step the stage button offers, or null at the end of the track (Offer, Closed). */
export function nextStage(stage: string): string | null {
    return Object.hasOwn(FORWARD, stage) ? FORWARD[stage] : null;
}

/**
 * The save for moving a role to `stage`. Every stage after Not applied means he sent the
 * application, and he only applies to a role he accepted, so a role not yet Approved is
 * approved in the same save: one click instead of Approve, then Applied.
 */
export function stagePatch(state: ReviewState, stage: string): ReviewPatch {
    if (stage !== 'Not applied' && state.status !== 'Approved') return { status: 'Approved', stage };
    return { stage };
}

/** The save that puts back what a quick action changed, or null when it changed nothing. */
export function undoPatch(before: ReviewState, after: ReviewState): ReviewPatch | null {
    const patch: ReviewPatch = {};
    // Duplicate is a reason on a rejection, so changing it is a status change: putting back a duplicate
    // means rejecting again with the reason, and putting back a plain rejection drops the reason.
    if (before.status !== after.status || Boolean(before.duplicate) !== Boolean(after.duplicate)) {
        patch.status = before.status;
        if (before.duplicate) patch.rejection_reason = 'duplicate';
    }
    if (before.stage !== after.stage) patch.stage = before.stage;
    return Object.keys(patch).length > 0 ? patch : null;
}
