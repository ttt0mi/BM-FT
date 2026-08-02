import { Decimal } from 'decimal.js';

Decimal.set({
    precision: 20,
    rounding: Decimal.ROUND_HALF_UP,
});

/**
 * Convert a unit of currency (string or number) from the client to it's minor unit (integer) for processing.
 *
 * @example
 *   toMinorUnit('12.50') // 1250n
 *   toMinorUnit(0.1)     // 10n
 *   toMinorUnit('100')   // 10000n
 */
export function toMinorUnit(amount: Decimal.Value, currency: string): bigint {
    return BigInt(
        new Decimal(amount).mul(getCurrencyScale(currency)).toDecimalPlaces(0).toNumber(),
    );
}

/**
 * Convert  minor unit (integer) to a unit of currency (string) for responses.
 *
 * @example
 *   fromMinorUnit(1250n)     // '12.50
 *   fromMinorUnit(100n)    // '1.00'
 */
export function fromMinorUnit(minorUnits: bigint, currency: string): string {
    return new Decimal(minorUnits).dividedBy(getCurrencyScale(currency)).toFixed(
        new Intl.NumberFormat('en', {
            style: 'currency',
            currency,
        }).resolvedOptions().maximumFractionDigits,
    );
}

/**
 * Safely add two minor unit amounts.
 */
export function addMinorUnits(number1: bigint, number2: bigint): bigint {
    return BigInt(new Decimal(number1).plus(number2).toNumber());
}

/**
 * Safely subtract two minor unit amounts.
 */
export function subtractMinorUnits(number1: bigint, number2: bigint): bigint {
    return BigInt(new Decimal(number1).minus(number2).toNumber());
}

/**
 * Validate that an amount string/number is a valid positive money value.
 */
export function isValidAmount(amount: unknown): boolean {
    if (typeof amount !== 'string' && typeof amount !== 'number' && typeof amount !== 'bigint')
        return false;
    try {
        const d = new Decimal(amount);
        return d.isFinite() && d.isPositive() && !d.isZero();
    } catch {
        return false;
    }
}

/**
 * Format a cent amount as a human-readable currency string.
 *
 * @example formatMoney(125050n, 'USD', en-US)  // "$1,250.50"
 */
export function formatMoney(minorUnits: bigint, currency: string, locale: string): string {
    const formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
    });

    const amount: number = new Decimal(minorUnits.toString())
        .div(getCurrencyScale(currency))
        .toNumber();
    return formatter.format(amount);
}

/**
 * Maximum transaction amount we'll accept: 100,000,000,000 (in minor units).
 * 1 billion in Two-Decimal currency, or 100 million in Three-Decimal currency.
 * This is arbitrary and can be changed at any time.
 */
export const MAX_AMOUNT_MINOR_UNITS = 100_000_000_000;

/**
 * Helper function to get the scale of the currency.
 */
function getCurrencyScale(currency: string): Decimal {
    const fractionDigits = new Intl.NumberFormat('en', {
        style: 'currency',
        currency,
    }).resolvedOptions().maximumFractionDigits as number;

    return new Decimal(10).pow(fractionDigits);
}
