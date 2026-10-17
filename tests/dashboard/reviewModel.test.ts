import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { STAGES, STATUSES, nextStage, stagePatch, undoPatch } from '../../src/components/dashboard/reviewModel.ts';

describe('nextStage', () => {
    it('walks the application track one step at a time', () => {
        assert.equal(nextStage('Not applied'), 'Applied');
        assert.equal(nextStage('Applied'), 'Interviewing');
        assert.equal(nextStage('Interviewing'), 'Offer');
    });

    it('offers nothing at the end of the track or for an unknown stage', () => {
        assert.equal(nextStage('Offer'), null);
        assert.equal(nextStage('Closed'), null);
        assert.equal(nextStage('toString'), null);
        assert.equal(nextStage(''), null);
    });

    it('only ever suggests a stage the backend accepts', () => {
        for (const stage of STAGES) {
            const next = nextStage(stage);
            if (next !== null) assert.ok(STAGES.includes(next), `${stage} -> ${next}`);
        }
    });
});

describe('stagePatch', () => {
    it('approves a role in the same save when he marks it applied before approving', () => {
        for (const status of STATUSES.filter((s) => s !== 'Approved')) {
            assert.deepEqual(stagePatch({ status, stage: 'Not applied' }, 'Applied'), { status: 'Approved', stage: 'Applied' }, status);
        }
    });

    it('leaves an approved role approved and only moves the stage', () => {
        assert.deepEqual(stagePatch({ status: 'Approved', stage: 'Not applied' }, 'Applied'), { stage: 'Applied' });
        assert.deepEqual(stagePatch({ status: 'Approved', stage: 'Applied' }, 'Interviewing'), { stage: 'Interviewing' });
        assert.deepEqual(stagePatch({ status: 'Approved', stage: 'Offer' }, 'Closed'), { stage: 'Closed' });
    });

    it('never touches the status when the stage goes back to Not applied', () => {
        assert.deepEqual(stagePatch({ status: 'Rejected', stage: 'Applied' }, 'Not applied'), { stage: 'Not applied' });
        assert.deepEqual(stagePatch({ status: 'To validate', stage: 'Not applied' }, 'Not applied'), { stage: 'Not applied' });
    });
});

describe('undoPatch', () => {
    it('puts back only what changed', () => {
        assert.deepEqual(
            undoPatch({ status: 'To validate', stage: 'Not applied' }, { status: 'Rejected', stage: 'Not applied' }),
            { status: 'To validate' },
        );
        assert.deepEqual(
            undoPatch({ status: 'Approved', stage: 'Not applied' }, { status: 'Approved', stage: 'Applied' }),
            { stage: 'Not applied' },
        );
    });

    it('undoes both halves of an apply that also approved', () => {
        assert.deepEqual(
            undoPatch({ status: 'Flagged', stage: 'Not applied' }, { status: 'Approved', stage: 'Applied' }),
            { status: 'Flagged', stage: 'Not applied' },
        );
    });

    it('offers no undo for a save that changed nothing', () => {
        assert.equal(undoPatch({ status: 'Approved', stage: 'Applied' }, { status: 'Approved', stage: 'Applied' }), null);
    });
});
