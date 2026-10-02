import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
    DEFAULT_DRAWER_WIDTH,
    DRAWER_WIDTH_KEY,
    LEGACY_DRAWER_WIDTH_KEY,
    MAX_DRAWER_WIDTH,
    MIN_DRAWER_WIDTH,
    clampDrawerWidth,
    loadDrawerWidth,
    saveDrawerWidth,
    type WidthStorage,
} from '../../src/components/dashboard/drawerWidth.ts';

function memoryStorage(initial: Record<string, string> = {}): WidthStorage & { data: Record<string, string> } {
    const data = { ...initial };
    return {
        data,
        getItem: (key) => (key in data ? data[key] : null),
        setItem: (key, value) => {
            data[key] = value;
        },
    };
}

const throwing: WidthStorage = {
    getItem() {
        throw new Error('blocked');
    },
    setItem() {
        throw new Error('blocked');
    },
};

describe('loadDrawerWidth', () => {
    it('starts at the default when nothing was ever stored', () => {
        assert.equal(loadDrawerWidth(memoryStorage()), DEFAULT_DRAWER_WIDTH);
        assert.equal(loadDrawerWidth(null), DEFAULT_DRAWER_WIDTH);
    });

    it('returns the stored width, kept inside the limits', () => {
        assert.equal(loadDrawerWidth(memoryStorage({ [DRAWER_WIDTH_KEY]: '520' })), 520);
        assert.equal(loadDrawerWidth(memoryStorage({ [DRAWER_WIDTH_KEY]: '9000' })), MAX_DRAWER_WIDTH);
        assert.equal(loadDrawerWidth(memoryStorage({ [DRAWER_WIDTH_KEY]: '10' })), MIN_DRAWER_WIDTH);
    });

    it('ignores junk and falls back to the default', () => {
        for (const junk of ['', '  ', 'wide', 'NaN', 'Infinity']) {
            assert.equal(loadDrawerWidth(memoryStorage({ [DRAWER_WIDTH_KEY]: junk })), DEFAULT_DRAWER_WIDTH, junk);
        }
    });

    it('treats the minimum left behind by the first version as never set, so the drawer is not stuck narrow', () => {
        assert.equal(loadDrawerWidth(memoryStorage({ [LEGACY_DRAWER_WIDTH_KEY]: String(MIN_DRAWER_WIDTH) })), DEFAULT_DRAWER_WIDTH);
    });

    it('keeps a width he really chose under the first version of the key', () => {
        assert.equal(loadDrawerWidth(memoryStorage({ [LEGACY_DRAWER_WIDTH_KEY]: '500' })), 500);
    });

    it('prefers the current key over the legacy one, even when he chose the minimum', () => {
        const storage = memoryStorage({ [DRAWER_WIDTH_KEY]: String(MIN_DRAWER_WIDTH), [LEGACY_DRAWER_WIDTH_KEY]: '500' });
        assert.equal(loadDrawerWidth(storage), MIN_DRAWER_WIDTH);
    });

    it('survives storage that throws', () => {
        assert.equal(loadDrawerWidth(throwing), DEFAULT_DRAWER_WIDTH);
    });
});

describe('saveDrawerWidth', () => {
    it('writes the current key and reads back', () => {
        const storage = memoryStorage();
        saveDrawerWidth(450, storage);
        assert.equal(storage.data[DRAWER_WIDTH_KEY], '450');
        assert.equal(loadDrawerWidth(storage), 450);
    });

    it('does not throw when storage does', () => {
        assert.doesNotThrow(() => saveDrawerWidth(450, throwing));
        assert.doesNotThrow(() => saveDrawerWidth(450, null));
    });
});

describe('clampDrawerWidth', () => {
    it('keeps the drawer between its limits', () => {
        assert.equal(clampDrawerWidth(100), MIN_DRAWER_WIDTH);
        assert.equal(clampDrawerWidth(400), 400);
        assert.equal(clampDrawerWidth(1000), MAX_DRAWER_WIDTH);
    });
});
