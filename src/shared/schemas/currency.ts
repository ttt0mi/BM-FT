import * as z from 'zod';

//ISO 4217: exactly 3 uppercase letters. check https://www.iso.org/iso-4217-currency-codes.html
export const CurrencySchema = z
    .string()
    .length(3, 'Currency must be a 3-letter ISO code (e.g. NGN, USD, EUR)')
    .regex(/^[A-Z]{3}$/, 'Currency must be uppercase (e.g. NGN, USD, EUR)');
