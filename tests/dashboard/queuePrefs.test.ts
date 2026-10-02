import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
    QUEUE_PREFS_KEY,
    defaultQueuePrefs,
    loadQueuePrefs,
    parseQueuePrefs,
    saveQueuePrefs,
    type PrefsStorage,
} from '../../src/components/dashboard/queuePrefs.ts';

function memoryStorage(initial: Record<string, string> = {}): PrefsStorage & { data: Record<string, string> } {
    const data = { ...initial };
    return {
        data,
        getItem: (key: string) => (key in data ? data[key] : null),
        setItem: (key: string, value: string) => {
            data[key] = value;
        },
    };
}

describe('queue prefs', () => {
    it('defaults to the To review bucket, every lane, newest first', () => {
        assert.deepEqual(defaultQueuePrefs(), { buckets: ['to_review'], lanes: [], sort: 'posted_date.desc' });
        assert.deepEqual(loadQueuePrefs(memoryStorage()), defaultQueuePrefs());
    });

    it('remembers what Richard picked across loads', () => {
        const storage = memoryStorage();
        saveQueuePrefs(
            { buckets: ['to_review', 'flagged'], lanes: ['ai_engineer'], source: 'linkedin', run: '2026-10-01', sort: 'score.desc' },
            storage,
        );
        assert.deepEqual(loadQueuePrefs(storage), {
            buckets: ['to_review', 'flagged'],
            lanes: ['ai_engineer'],
            source: 'linkedin',
            run: '2026-10-01',
            sort: 'score.desc',
        });
    });

    it('keeps an explicit "All stages" choice instead of snapping back to the default', () => {
        const storage = memoryStorage();
        saveQueuePrefs({ buckets: [], lanes: [], sort: 'posted_date.desc' }, storage);
        assert.deepEqual(loadQueuePrefs(storage).buckets, []);
    });

    it('falls back to the default for the old preset names it no longer knows', () => {
        const stale = JSON.stringify({ buckets: ['To apply', 'Review queue', 'Passing'] });
        assert.deepEqual(parseQueuePrefs(stale).buckets, ['to_review']);
    });

    it('drops unknown bucket names but keeps the valid ones', () => {
        assert.deepEqual(parseQueuePrefs(JSON.stringify({ buckets: ['applied', 'nonsense'] })).buckets, ['applied']);
    });

    it('survives corrupt or hostile stored values', () => {
        assert.deepEqual(parseQueuePrefs('not json'), defaultQueuePrefs());
        assert.deepEqual(parseQueuePrefs('null'), defaultQueuePrefs());
        assert.deepEqual(parseQueuePrefs('42'), defaultQueuePrefs());
        const odd = parseQueuePrefs(JSON.stringify({ buckets: 'to_review', lanes: [1, 'ai_engineer'], source: 5, run: '', sort: 'bogus' }));
        assert.deepEqual(odd, { buckets: ['to_review'], lanes: ['ai_engineer'], source: undefined, run: undefined, sort: 'posted_date.desc' });
    });

    it('works when storage is missing or throws', () => {
        assert.deepEqual(loadQueuePrefs(null), defaultQueuePrefs());
        assert.doesNotThrow(() => saveQueuePrefs(defaultQueuePrefs(), null));
        const broken: PrefsStorage = {
            getItem: () => {
                throw new Error('blocked');
            },
            setItem: () => {
                throw new Error('quota');
            },
        };
        assert.deepEqual(loadQueuePrefs(broken), defaultQueuePrefs());
        assert.doesNotThrow(() => saveQueuePrefs(defaultQueuePrefs(), broken));
    });

    it('writes under a versioned key so older layouts cannot leak in', () => {
        const storage = memoryStorage();
        saveQueuePrefs(defaultQueuePrefs(), storage);
        assert.deepEqual(Object.keys(storage.data), [QUEUE_PREFS_KEY]);
        assert.match(QUEUE_PREFS_KEY, /_v2$/);
    });
});
