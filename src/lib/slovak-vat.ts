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

/**
 * Formats any date string into European/Slovak/Russian format DD.MM.YYYY (e.g. 08.09.2026)
 */
export function formatDateDmY(dateStr?: string | null): string {
  if (!dateStr) return '-';
  const clean = dateStr.trim();
  if (!clean) return '-';

  // Already DD.MM.YYYY
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(clean)) return clean;

  // ISO YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss
  const isoPart = clean.split('T')[0];
  const parts = isoPart.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    const year = parts[0];
    const month = parts[1].padStart(2, '0');
    const day = parts[2].padStart(2, '0');
    return `${day}.${month}.${year}`;
  }

  // D.M.YYYY or DD.MM.YY
  const dotParts = clean.split(' ')[0].split('.');
  if (dotParts.length === 3) {
    const day = dotParts[0].padStart(2, '0');
    const month = dotParts[1].padStart(2, '0');
    let year = dotParts[2];
    if (year.length === 2) year = `20${year}`;
    return `${day}.${month}.${year}`;
  }

  return clean;
}


