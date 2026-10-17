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
}

export interface ReviewPatch {
    status?: string;
    stage?: string;
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
    if (before.status !== after.status) patch.status = before.status;
    if (before.stage !== after.stage) patch.stage = before.stage;
    return Object.keys(patch).length > 0 ? patch : null;
}
