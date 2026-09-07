import { Invoice, BudgetEstimate, Client, CompanySettings, Project } from '@/types';
import { formatCurrency } from './slovak-vat';
import { PRERAB_LOGO_BASE64 } from './logo-base64';

/**
 * Generates and triggers browser print / PDF download for Slovak Invoices (Faktúra / Zálohová faktúra)
 * with official PRERAB gold branding and security watermark seal.
 */
export function printInvoiceDocument(
  invoice: Invoice,
  client: Client | undefined,
  project: Project | undefined,
  settings: CompanySettings,
  qrDataUrl?: string
) {
  const isReverse = invoice.is_reverse_charge;
  const typeTitle = 
    invoice.type === 'proforma' ? 'ZÁLOHOVÁ FAKTÚRA' :
    invoice.type === 'credit_note' ? 'DOBROPIS' : 'FAKTÚRA - DAŇOVÝ DOKLAD';

  const html = `
    <!DOCTYPE html>
    <html lang="sk">
    <head>
      <meta charset="UTF-8">
      <title>${typeTitle} ${invoice.invoice_number}</title>
      <style>
        @page { size: A4; margin: 12mm; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 0;
          font-size: 12.5px;
          line-height: 1.4;
          position: relative;
        }
        /* Security Watermark Background on PDF */
        .watermark-bg {
          position: fixed;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-30deg);
          font-size: 80px;
          font-weight: 900;
          color: rgba(197, 155, 53, 0.05);
          text-transform: uppercase;
          pointer-events: none;
          z-index: -1;
          white-space: nowrap;
          letter-spacing: 12px;
          border: 4px solid rgba(197, 155, 53, 0.05);
          padding: 20px 40px;
          border-radius: 20px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #c59b35;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        .logo-img {
          height: 48px;
          object-fit: contain;
        }
        .doc-title {
          text-align: right;
        }
        .doc-type {
          font-size: 18px;
          font-weight: 800;
          color: #0b0e14;
          letter-spacing: 0.5px;
        }
        .doc-number {
          font-size: 14px;
          color: #c59b35;
          font-weight: 700;
        }
        .parties {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 20px;
        }
        .party-box {
          background: #fbfbfd;
          padding: 12px 14px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
        }
        .party-title {
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          color: #c59b35;
          margin-bottom: 6px;
          letter-spacing: 0.5px;
        }
        .party-name {
          font-size: 14px;
          font-weight: 700;
          color: #0b0e14;
          margin-bottom: 4px;
        }
        .meta-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
          background: #f8fafc;
          padding: 10px 12px;
          border-radius: 6px;
          border-left: 3px solid #c59b35;
          margin-bottom: 20px;
          font-size: 12px;
        }
        .meta-item strong {
          display: block;
          color: #64748b;
          font-size: 10.5px;
          margin-bottom: 2px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
        }
        th {
          background: #0b0e14;
          color: #f5ecd7;
          font-weight: 700;
          text-align: left;
          padding: 8px 10px;
          font-size: 11.5px;
          border-top: 1px solid #c59b35;
        }
        td {
          padding: 8px 10px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 12px;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .summary-wrap {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-top: 15px;
        }
        .qr-section {
          display: flex;
          align-items: center;
          gap: 14px;
          background: #fbfbfd;
          padding: 10px;
          border: 1px dashed #c59b35;
          border-radius: 6px;
          width: 280px;
        }
        .qr-section img {
          width: 90px;
          height: 90px;
        }
        .qr-text {
          font-size: 10.5px;
          color: #475569;
        }
        .qr-text strong {
          color: #0b0e14;
          display: block;
          font-size: 11.5px;
          margin-bottom: 2px;
        }
        .totals-box {
          width: 270px;
          background: #fbfbfd;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 12px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 3px 0;
          font-size: 12px;
          color: #475569;
        }
        .total-main {
          display: flex;
          justify-content: space-between;
          padding-top: 8px;
          margin-top: 6px;
          border-top: 2px solid #c59b35;
          font-size: 15px;
          font-weight: 900;
          color: #0b0e14;
        }
        .reverse-notice {
          margin-top: 15px;
          padding: 8px 12px;
          background: #fffbeb;
          border-left: 3px solid #c59b35;
          font-size: 11px;
          color: #854d0e;
        }
        .footer {
          margin-top: 35px;
          display: flex;
          justify-content: space-between;
          border-top: 1px solid #e2e8f0;
          padding-top: 15px;
          font-size: 10.5px;
          color: #64748b;
        }
        .signature-box {
          border-top: 1px dotted #94a3b8;
          width: 190px;
          text-align: center;
          padding-top: 5px;
          margin-top: 35px;
          font-size: 11px;
          color: #475569;
        }
        .security-seal {
          display: inline-block;
          font-size: 9px;
          color: #c59b35;
          font-weight: 700;
          letter-spacing: 1px;
          border: 1px solid #c59b35;
          padding: 2px 6px;
          border-radius: 4px;
          margin-top: 4px;
        }
      </style>
    </head>
    <body>
      <div class="watermark-bg">PRERAB &middot; OVERENÉ</div>

      <div class="header">
        <div>
          <img src="${PRERAB_LOGO_BASE64}" alt="PRERAB" class="logo-img" />
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${settings.legal_name}</div>
        </div>
        <div class="doc-title">
          <div class="doc-type">${typeTitle}</div>
          <div class="doc-number">Číslo: <strong>${invoice.invoice_number}</strong></div>
          <div style="font-size: 11px; color: #64748b; margin-top: 2px;">VS: <strong>${invoice.variable_symbol}</strong></div>
          <div class="security-seal">ORIGINÁL &middot; KÓD ${invoice.variable_symbol}</div>
        </div>
      </div>

      <div class="parties">
        <!-- DODÁVATEĽ -->
        <div class="party-box">
          <div class="party-title">DODÁVATEĽ</div>
          <div class="party-name">${settings.name}</div>
          <div>${settings.address}</div>
          <div>${settings.zip} ${settings.city}, Slovenská republika</div>
          <div style="margin-top: 6px; font-size: 11.5px;">
            <strong>IČO:</strong> ${settings.ico} &nbsp;|&nbsp; <strong>DIČ:</strong> ${settings.dic}<br>
            <strong>IČ DPH:</strong> ${settings.ic_dph || 'Neplatca DPH'}<br>
            <strong>IBAN:</strong> ${settings.iban}<br>
            <strong>SWIFT:</strong> ${settings.swift} (${settings.bank_name})
          </div>
        </div>

        <!-- ODBERATEĽ -->
        <div class="party-box">
          <div class="party-title">ODBERATEĽ / KLIENT</div>
          <div class="party-name">${client?.company_name || client?.name || 'Klient'}</div>
          ${client?.company_name ? `<div>Kontaktná osoba: ${client?.name}</div>` : ''}
          <div>${client?.address || ''}</div>
          <div>${client?.zip || ''} ${client?.city || ''}</div>
          <div style="margin-top: 6px; font-size: 11.5px;">
            ${client?.ico ? `<strong>IČO:</strong> ${client.ico} &nbsp;|&nbsp; ` : ''}
            ${client?.dic ? `<strong>DIČ:</strong> ${client.dic}<br>` : ''}
            ${client?.ic_dph ? `<strong>IČ DPH:</strong> ${client.ic_dph}<br>` : ''}
            ${client?.phone ? `<strong>Tel:</strong> ${client.phone}<br>` : ''}
            ${client?.email ? `<strong>Email:</strong> ${client.email}` : ''}
          </div>
        </div>
      </div>

      <div class="meta-grid">
        <div class="meta-item">
          <strong>DÁTUM VYSTAVENIA</strong>
          ${invoice.issue_date}
        </div>
        <div class="meta-item">
          <strong>DÁTUM DODANIA</strong>
          ${invoice.delivery_date}
        </div>
        <div class="meta-item">
          <strong>DÁTUM SPLATNOSTI</strong>
          <span style="color: #b91c1c; font-weight: 700;">${invoice.due_date}</span>
        </div>
        <div class="meta-item">
          <strong>FORMA ÚHRADY</strong>
          Prevodný príkaz / PAY by square
        </div>
        <div class="meta-item">
          <strong>KONŠTANTNÝ SYMBOL</strong>
          ${invoice.constant_symbol || '0308'}
        </div>
        <div class="meta-item">
          <strong>ZÁKAZKA / PROJEKT</strong>
          ${project?.title || 'Stavebné práce'}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 25px;" class="text-center">#</th>
            <th>Názov položky / Popis práce</th>
            <th style="width: 55px;" class="text-center">Množ.</th>
            <th style="width: 35px;" class="text-center">MJ</th>
            <th style="width: 85px;" class="text-right">Cena bez DPH</th>
            <th style="width: 50px;" class="text-center">DPH %</th>
            <th style="width: 95px;" class="text-right">Spolu s DPH</th>
          </tr>
        </thead>
        <tbody>
          ${invoice.items.map((item, idx) => `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td>${item.description}</td>
              <td class="text-center">${item.quantity}</td>
              <td class="text-center">${item.unit}</td>
              <td class="text-right">${formatCurrency(item.unit_price)}</td>
              <td class="text-center">${isReverse ? '0%' : `${item.vat_rate}%`}</td>
              <td class="text-right"><strong>${formatCurrency(item.total_with_vat)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="summary-wrap">
        <div class="qr-section">
          ${qrDataUrl ? `<img src="${qrDataUrl}" alt="PAY by square" />` : ''}
          <div class="qr-text">
            <strong>PAY by square</strong>
            Naskenujte QR kód vo vašej bankovej aplikácii (SLSP, Tatra banka, VÚB, ČSOB...) pre okamžitú platbu.
          </div>
        </div>

        <div class="totals-box">
          <div class="total-row">
            <span>Základ dane (bez DPH):</span>
            <span>${formatCurrency(invoice.subtotal)}</span>
          </div>
          ${!isReverse && invoice.vat_rate > 0 ? `
            <div class="total-row">
              <span>DPH (${invoice.vat_rate} %):</span>
              <span>${formatCurrency(invoice.vat_amount)}</span>
            </div>
          ` : `
            <div class="total-row">
              <span>DPH:</span>
              <span>0,00 €</span>
            </div>
          `}
          <div class="total-main">
            <span>K ÚHRADE:</span>
            <span>${formatCurrency(invoice.total_amount)}</span>
          </div>
        </div>
      </div>

      ${isReverse ? `
        <div class="reverse-notice">
          <strong>UPOZORNENIE:</strong> ${settings.reverse_charge_text || 'Prenesenie daňovej povinnosti podľa § 69 ods. 12 písm. j zákona č. 222/2004 Z. z. o DPH. Daň je povinný platiť príjemca tovaru / služby.'}
        </div>
      ` : ''}

      <div class="footer">
        <div>
          Vystavil: <strong>${settings.name}</strong><br>
          Tel: ${settings.phone} | Email: ${settings.email} | Web: ${settings.web}
        </div>
        <div class="signature-box">
          Pečiatka a podpis zhotoviteľa
        </div>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  }
}

/**
 * Generates and prints Slovak Cenová ponuka / Výkaz výmer (Price Quote / Work Calculation)
 * with official PRERAB gold branding and watermark.
 */
export function printQuoteDocument(
  budget: BudgetEstimate,
  client: Client | undefined,
  project: Project | undefined,
  settings: CompanySettings
) {
  const html = `
    <!DOCTYPE html>
    <html lang="sk">
    <head>
      <meta charset="UTF-8">
      <title>Cenová ponuka - ${budget.title}</title>
      <style>
        @page { size: A4; margin: 12mm; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #0f172a;
          margin: 0;
          padding: 0;
          font-size: 12px;
          line-height: 1.4;
          position: relative;
        }
        .watermark-bg {
          position: fixed;
          top: 40%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-30deg);
          font-size: 70px;
          font-weight: 900;
          color: rgba(197, 155, 53, 0.05);
          text-transform: uppercase;
          pointer-events: none;
          z-index: -1;
          white-space: nowrap;
          letter-spacing: 10px;
          border: 4px solid rgba(197, 155, 53, 0.05);
          padding: 15px 30px;
          border-radius: 16px;
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #c59b35;
          padding-bottom: 12px;
          margin-bottom: 18px;
        }
        .logo-img {
          height: 44px;
          object-fit: contain;
        }
        .doc-title {
          text-align: right;
        }
        .doc-type {
          font-size: 16px;
          font-weight: 800;
          color: #0b0e14;
          letter-spacing: 0.5px;
        }
        .parties {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 18px;
        }
        .party-box {
          background: #fbfbfd;
          padding: 10px 12px;
          border-radius: 6px;
          border: 1px solid #e5e7eb;
          font-size: 11.5px;
        }
        .party-title {
          font-size: 10.5px;
          font-weight: 800;
          color: #c59b35;
          margin-bottom: 4px;
          text-transform: uppercase;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 18px;
        }
        th {
          background: #0b0e14;
          color: #f5ecd7;
          font-weight: 700;
          text-align: left;
          padding: 7px 9px;
          font-size: 11px;
          border-top: 1px solid #c59b35;
        }
        td {
          padding: 7px 9px;
          border-bottom: 1px solid #e2e8f0;
          font-size: 11px;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .totals-box {
          margin-left: auto;
          width: 270px;
          background: #fbfbfd;
          border: 1px solid #e2e8f0;
          border-radius: 6px;
          padding: 10px 12px;
        }
        .total-row {
          display: flex;
          justify-content: space-between;
          padding: 3px 0;
          font-size: 11.5px;
          color: #475569;
        }
        .total-main {
          display: flex;
          justify-content: space-between;
          padding-top: 6px;
          margin-top: 4px;
          border-top: 2px solid #c59b35;
          font-size: 15px;
          font-weight: 900;
          color: #0b0e14;
        }
        .signature-grid {
          margin-top: 35px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 35px;
          font-size: 11px;
        }
        .sig-line {
          border-top: 1px dashed #64748b;
          margin-top: 40px;
          padding-top: 5px;
          text-align: center;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <div class="watermark-bg">PRERAB &middot; ROZPOČET</div>

      <div class="header">
        <div>
          <img src="${PRERAB_LOGO_BASE64}" alt="PRERAB" class="logo-img" />
          <div style="font-size: 10px; color: #64748b; margin-top: 2px;">${settings.legal_name}</div>
        </div>
        <div class="doc-title">
          <div class="doc-type">CENOVÁ PONUKA A VÝKAZ VÝMER</div>
          <div style="font-size: 11px; color: #64748b;">Dátum: ${budget.created_at.split('T')[0]}</div>
          <div style="font-size: 11px; font-weight: 700; color: #c59b35; margin-top: 2px;">Projekt: ${project?.title || budget.title}</div>
        </div>
      </div>

      <div class="parties">
        <div class="party-box">
          <div class="party-title">ZHOTOVITEĽ</div>
          <strong>${settings.name}</strong><br>
          ${settings.address}, ${settings.zip} ${settings.city}<br>
          IČO: ${settings.ico} | DIČ: ${settings.dic}<br>
          Tel: ${settings.phone} | Email: ${settings.email}
        </div>
        <div class="party-box">
          <div class="party-title">OBJEDNÁVATEĽ</div>
          <strong>${client?.company_name || client?.name || 'Vážený zákazník'}</strong><br>
          ${client?.address || ''}, ${client?.zip || ''} ${client?.city || ''}<br>
          Tel: ${client?.phone || '-'} | Email: ${client?.email || '-'}
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th style="width: 25px;" class="text-center">#</th>
            <th>Položka / Popis stavebných a montážnych prác</th>
            <th style="width: 100px;">Miestnosť</th>
            <th style="width: 50px;" class="text-center">Množ.</th>
            <th style="width: 35px;" class="text-center">MJ</th>
            <th style="width: 80px;" class="text-right">Jedn. cena</th>
            <th style="width: 90px;" class="text-right">Spolu bez DPH</th>
          </tr>
        </thead>
        <tbody>
          ${budget.items.map((item, idx) => `
            <tr>
              <td class="text-center">${idx + 1}</td>
              <td><strong>${item.name}</strong>${item.description ? `<br><small style="color:#64748b;">${item.description}</small>` : ''}</td>
              <td>${item.room || 'Spoločné'}</td>
              <td class="text-center">${item.quantity}</td>
              <td class="text-center">${item.unit}</td>
              <td class="text-right">${formatCurrency(item.unit_price_client)}</td>
              <td class="text-right"><strong>${formatCurrency(item.total_price_client)}</strong></td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="totals-box">
        <div class="total-row">
          <span>Suma bez DPH:</span>
          <span>${formatCurrency(budget.total_client_price)}</span>
        </div>
        <div class="total-row">
          <span>DPH (${budget.vat_rate} %):</span>
          <span>${formatCurrency(budget.vat_amount)}</span>
        </div>
        <div class="total-main">
          <span>CELKOM S DPH:</span>
          <span>${formatCurrency(budget.total_with_vat)}</span>
        </div>
      </div>

      <div class="signature-grid">
        <div>
          Za zhotoviteľa:<br>
          <div class="sig-line">Pečiatka a podpis zhotoviteľa</div>
        </div>
        <div>
          Za objednávateľa (Súhlasím s rozsahom a cenou):<br>
          <div class="sig-line">Podpis objednávateľa</div>
        </div>
      </div>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 500);
  }
}
