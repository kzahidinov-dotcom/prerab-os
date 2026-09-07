import QRCode from 'qrcode';

export interface PayBySquareData {
  iban: string;
  swift?: string;
  amount: number;
  currency?: string;
  variableSymbol?: string;
  constantSymbol?: string;
  specificSymbol?: string;
  note?: string;
  beneficiaryName?: string;
}

/**
 * Creates standard SEPA/Slovak payment QR code data
 */
export function buildSepaQrString(data: PayBySquareData): string {
  const cleanIban = (data.iban || '').replace(/\s+/g, '').toUpperCase();
  const cleanBic = (data.swift || '').replace(/\s+/g, '').toUpperCase();
  const amountStr = data.amount > 0 ? data.amount.toFixed(2) : '0.00';
  const name = (data.beneficiaryName || 'Prerab s.r.o.').substring(0, 70);
  const vs = data.variableSymbol ? data.variableSymbol.replace(/\D/g, '') : '';
  const note = (data.note || `Platba ${data.variableSymbol || ''}`).substring(0, 140);

  // Standard European SEPA QR Code format (BCD 002)
  const lines = [
    'BCD',
    '002',
    '1',
    'SCT',
    cleanBic,
    name,
    cleanIban,
    `EUR${amountStr}`,
    '', // Purpose code
    vs ? `/VS/${vs}` : '', // Remittance reference
    note,
    '',
  ];

  return lines.join('\n');
}

/**
 * Generates a Base64 PNG QR Code data URL
 */
export async function generatePaymentQrCode(data: PayBySquareData): Promise<string> {
  try {
    const payload = buildSepaQrString(data);
    const qrDataUrl = await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 256,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return '';
  }
}
