// Slovak Tax & DPH calculation utilities

export const SLOVAK_VAT_RATES = [
  { rate: 23, label: '23 % (Základná sadzba od 2025/2026)' },
  { rate: 19, label: '19 % (Znížená sadzba)' },
  { rate: 5, label: '5 % (Špeciálna znížená sadzba / sociálne stavby)' },
  { rate: 0, label: '0 % (Oslobodené od DPH / Neplatca)' },
];

export const REVERSE_CHARGE_CLAUSE = 
  'Prenesenie daňovej povinnosti podľa § 69 ods. 12 písm. j zákona č. 222/2004 Z. z. o dani z pridanej hodnoty. Daň je povinný platiť príjemca tovaru / služby.';

export interface VatCalculationResult {
  baseAmount: number;
  vatRate: number;
  vatAmount: number;
  totalAmount: number;
  isReverseCharge: boolean;
}

/**
 * Calculates VAT amounts given base net amount and rate.
 * Handles reverse charge (§ 69) where base = total and VAT = 0 on invoice.
 */
export function calculateVat(
  baseAmount: number,
  vatRate: number,
  isReverseCharge: boolean = false
): VatCalculationResult {
  const cleanBase = Math.round((baseAmount + Number.EPSILON) * 100) / 100;
  
  if (isReverseCharge || vatRate === 0) {
    return {
      baseAmount: cleanBase,
      vatRate: 0,
      vatAmount: 0,
      totalAmount: cleanBase,
      isReverseCharge: !!isReverseCharge,
    };
  }

  const vatAmount = Math.round((cleanBase * (vatRate / 100) + Number.EPSILON) * 100) / 100;
  const totalAmount = Math.round(((cleanBase + vatAmount) + Number.EPSILON) * 100) / 100;

  return {
    baseAmount: cleanBase,
    vatRate,
    vatAmount,
    totalAmount,
    isReverseCharge: false,
  };
}

/**
 * Formats Euro currency with Slovak formatting (e.g. 1 250,50 €)
 */
export function formatCurrency(amount: number): string {
  const rounded = Math.round((amount + Number.EPSILON) * 100) / 100;
  return new Intl.NumberFormat('sk-SK', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(rounded);
}

export const formatSlovakEur = formatCurrency;
export const formatEur = formatCurrency;

/**
 * Formats percentage
 */
export function formatPercent(value: number): string {
  return `${(Math.round((value + Number.EPSILON) * 10) / 10).toFixed(1)} %`;
}

