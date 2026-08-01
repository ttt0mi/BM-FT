import { describe, it, expect } from 'vitest';
import {
    toMinorUnit,
    fromMinorUnit,
    addMinorUnits,
    subtractMinorUnits,
    formatMoney,
    isValidAmount,
} from './utilities.js';

/**
 * Every edge case in these utilities must be explicitly proven.
 */
describe('money utilities', () => {
    describe('toMinorUnit', () => {
        it('converts a whole amount to its minor unit', () => {
            expect(toMinorUnit(12, 'NGN')).toBe(1200n);
        });

        it('converts a decimal amount to its minor unit', () => {
            expect(toMinorUnit(12.5, 'NGN')).toBe(1250n);
        });

        it('handles the classic floating point trap: 0.1 + 0.2', () => {
            expect(toMinorUnit(0.1, 'NGN')).toBe(10n);
            expect(toMinorUnit(0.2, 'NGN')).toBe(20n);
            expect(toMinorUnit(0.3, 'NGN')).toBe(30n);
        });

        it('accepts string input (safe when parsing user input)', () => {
            expect(toMinorUnit('9.99', 'NGN')).toBe(999n);
        });

        it('handles large amounts', () => {
            expect(toMinorUnit(1000000, 'NGN')).toBe(100000000n);
        });

        it('handles zero', () => {
            expect(toMinorUnit(0, 'NGN')).toBe(0n);
        });
    });

    describe('fromMinorUnit', () => {
        it('converts cents back to a decimal string', () => {
            expect(fromMinorUnit(1250n, 'NGN')).toBe('12.50');
        });

        it('always returns two decimal places', () => {
            expect(fromMinorUnit(100n, 'NGN')).toBe('1.00');
            expect(fromMinorUnit(101n, 'NGN')).toBe('1.01');
        });

        it('handles zero', () => {
            expect(fromMinorUnit(0n, 'USD')).toBe('0.00');
        });
    });

    describe('addMinorUnits / subtractMinorUnits', () => {
        it('adds two minor unit values correctly', () => {
            expect(addMinorUnits(1000n, 250n)).toBe(1250n);
        });

        it('subtracts two minor unit values correctly', () => {
            expect(subtractMinorUnits(1250n, 250n)).toBe(1000n);
        });

        it('subtractMinorUnits returns negative value for overdraft scenario', () => {
            expect(subtractMinorUnits(500n, 1000n)).toBe(-500n);
        });
    });

    describe('formatMoney', () => {
        it('formats NGN correctly', () => {
            expect(formatMoney(125050n, 'NGN', 'en-NG')).toBe('₦1,250.50');
        });

        it('formats USD correctly', () => {
            expect(formatMoney(125050n, 'USD', 'en-US')).toBe('$1,250.50');
        });

        it('formats EUR correctly for germany', () => {
            //used Intl.NumberFormat function to get the expected result due to localisation
            const expected = new Intl.NumberFormat('de-DE', {
                style: 'currency',
                currency: 'EUR',
            }).format(1250.5);

            expect(formatMoney(125050n, 'EUR', 'de-DE')).toBe(expected);
        });

        it('formats EUR correctly for france', () => {
            //used Intl.NumberFormat function to get the expected result due to localisation
            const expected = new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
            }).format(1250.5);

            expect(formatMoney(125050n, 'EUR', 'fr-FR')).toBe(expected);
        });

        it('formats zero-decimal currency correctly (YEN)', () => {
            expect(formatMoney(125050n, 'JPY', 'ja-JP')).toBe('￥125,050');
        });

        //it('formats three-decimal currency correctly (YEN)', () => {
        //    expect(formatMoney(125050n, 'JPY', 'ja-JP')).toBe('￥125,050');
        //});
    });

    describe('isValidAmount', () => {
        it('returns true for positive amounts', () => {
            expect(isValidAmount(100n)).toBe(true);
        });

        it('returns false for zero amount', () => {
            expect(isValidAmount(0n)).toBe(false);
        });

        it('returns false for negative amount', () => {
            expect(isValidAmount(-100n)).toBe(false);
        });
    });
});
