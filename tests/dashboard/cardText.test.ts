import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { cardMeta, statedSalary } from '../../src/components/dashboard/cardText.ts';

describe('statedSalary', () => {
    it('keeps a real salary', () => {
        assert.equal(statedSalary('USD 5,500 - 7,500 / month'), 'USD 5,500 - 7,500 / month');
        assert.equal(statedSalary('  USD 6,500/mes (fijo) '), 'USD 6,500/mes (fijo)');
    });

    it('drops every way the agent says "not stated"', () => {
        for (const text of ['(not stated)', 'not stated', 'Not specified', 'No indicado', 'n/a', 'unknown', '-', '--', '', null, undefined]) {
            assert.equal(statedSalary(text), null, String(text));
        }
    });
});

describe('cardMeta', () => {
    const base = { company: 'Acme', work_mode: 'Remote', location_text: 'Latin America', salary_text: null };

    it('joins company, work mode, location and pay', () => {
        assert.equal(cardMeta({ ...base, salary_text: 'USD 6,500' }), 'Acme · Remote · Latin America · USD 6,500');
    });

    it("skips a work mode the location already says, and a pay that isn't stated", () => {
        assert.equal(cardMeta({ ...base, location_text: 'Remote (LATAM)', salary_text: '(not stated)' }), 'Acme · Remote (LATAM)');
    });

    it('copes with missing fields', () => {
        assert.equal(cardMeta({ company: 'Acme', work_mode: null, location_text: null, salary_text: null }), 'Acme');
    });
});
