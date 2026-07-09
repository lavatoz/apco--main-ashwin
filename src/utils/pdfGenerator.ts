import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { applyBrandingFooterToDoc } from './pdfBranding';
import { aahaLogoBase64 } from './aahaLogo';
import QRCode from 'qrcode';
import { sha256 } from 'js-sha256';
import html2canvas from 'html2canvas';
import { type Invoice, type Client, type CompanyProfile, type GlobalSettings, type ActiveAgreementSnapshot } from '../types';
import { quoteTemplates, invoiceTemplates, getBrandQuoteTemplate, getBrandInvoiceTemplate } from '../templates/registry';
import { type CustomTemplateMetadata } from '../templates/types';
import { api } from '../services/api';
import { replaceAgreementPlaceholders } from './agreementUtils';
import { getDisplayId } from './displayId';

const getPdfOptions = (gSettings: GlobalSettings, customOptions: any = {}) => {
  const options: any = {
    orientation: customOptions.orientation || 'p',
    unit: customOptions.unit || 'mm',
    format: customOptions.format || 'a4'
  };
  if (gSettings.pdfOwnerPassword) {
    const useOpenPassword =
      gSettings.pdfPasswordMode === 'open-password' &&
      !!gSettings.pdfUserPassword?.trim();

    options.encryption = {
      // When open-password mode: set userPassword so viewers prompt on open.
      // When owner-only mode: empty string means no open prompt.
      userPassword: useOpenPassword ? gSettings.pdfUserPassword!.trim() : '',
      ownerPassword: gSettings.pdfOwnerPassword,
      userPermissions: ['print']
    };
  }
  return options;
};

const renderApcoMasterLayout = async (
  doc: jsPDF,
  invoice: Invoice,
  client: Client,
  settings: CompanyProfile,
  autoSave = true
) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // Page styling parameters based on theme
  let primaryColorHex = settings.primaryColor || '#3B82F6';
  const isAaha = (settings.companyName || '').toLowerCase().includes('aaha');
  if (isAaha) {
     primaryColorHex = '#783d0c';
  }
  
  // Hex to RGB helper for jsPDF
  const hexToRgb = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [isNaN(r) ? 59 : r, isNaN(g) ? 130 : g, isNaN(b) ? 246 : b];
  };
  
  const brandPrimary: [number, number, number] = hexToRgb(primaryColorHex);
  let theme = (settings.themePreset || 'modern').toLowerCase();
  if (isAaha) {
     theme = 'classic';
  }
  
  let bgRgb: [number, number, number] = [255, 255, 255];
  let textRgb: [number, number, number] = [26, 26, 26];
  let textMutedRgb: [number, number, number] = [100, 100, 100];
  let cardBgRgb: [number, number, number] = [245, 245, 245];
  let borderRgb: [number, number, number] = [220, 220, 220];
  let fontName = 'helvetica';
  
  if (theme === 'classic') {
     bgRgb = [250, 249, 246]; // ivory
     textRgb = [30, 26, 20];
     textMutedRgb = [115, 105, 95];
     cardBgRgb = [240, 236, 228];
     borderRgb = [210, 200, 190];
     fontName = 'times';
  } else if (theme === 'luxury') {
     bgRgb = [252, 249, 242]; // cream
     textRgb = [26, 24, 22];
     textMutedRgb = [125, 115, 105];
     cardBgRgb = [245, 240, 230];
     borderRgb = [200, 185, 165]; // gold accent
     fontName = 'times';
  } else if (theme === 'minimal') {
     bgRgb = [248, 250, 252]; // slate-50
     textRgb = [51, 65, 85]; // slate-700
     textMutedRgb = [148, 163, 184]; // slate-400
     cardBgRgb = [241, 245, 249]; // slate-100
     borderRgb = [226, 232, 240]; // slate-200
     fontName = 'helvetica';
  }
  
  // Background helper
  const drawBackground = () => {
     doc.setFillColor(bgRgb[0], bgRgb[1], bgRgb[2]);
     doc.rect(0, 0, pageWidth, pageHeight, 'F');
  };
  
  drawBackground();
  
  // Header branding
  let currentY = 15;
  const logoToUse = isAaha ? aahaLogoBase64 : (invoice.companyLogoUrl || settings.logo);
  
  if (logoToUse) {
     try {
        // center logo horizontally
        const logoWidth = isAaha ? 68 : 55;
        const logoHeight = isAaha ? 22 : 18;
        const logoX = (pageWidth - logoWidth) / 2;
        doc.addImage(logoToUse, 'PNG', logoX, currentY, logoWidth, logoHeight, undefined, 'FAST');
        currentY += isAaha ? 25 : 22;
     } catch (e) {
        console.error('Failed to add logo to master PDF, falling back to text', e);
     }
  }
  
  // If logo not present or logo addition failed, render brand name
  if (!logoToUse) {
     doc.setFont(fontName, 'bold');
     doc.setFontSize(22);
     doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
     const brandNameText = (settings.companyName || 'Artisans Company').toUpperCase();
     doc.text(brandNameText, pageWidth / 2, currentY + 8, { align: 'center' });
     currentY += 12;
  }
  
  if (settings.tagline && !isAaha) {
     doc.setFont(fontName, 'italic');
     doc.setFontSize(8.5);
     doc.setTextColor(textMutedRgb[0], textMutedRgb[1], textMutedRgb[2]);
     doc.text(settings.tagline, pageWidth / 2, currentY, { align: 'center' });
     currentY += 6;
  }
  
  // Document title header matching requirements: Header: QUOTATION or Header: INVOICE
  doc.setFont(fontName, 'bold');
  doc.setFontSize(11);
  doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  const docTitle = invoice.type === 'quotation' ? 'QUOTATION' : 'INVOICE';
  
  // Center text width calculation for drawing lines
  const titleWidth = doc.getTextWidth(docTitle);
  const centerX = pageWidth / 2;
  const lineY = currentY + 2.5;
  const lineLength = 22; // length of lines on left/right
  const gap = 4; // gap between line and text
  
  doc.setDrawColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  doc.setLineWidth(0.2);
  // Left line
  doc.line(centerX - (titleWidth / 2) - gap - lineLength, lineY, centerX - (titleWidth / 2) - gap, lineY);
  // Right line
  doc.line(centerX + (titleWidth / 2) + gap, lineY, centerX + (titleWidth / 2) + gap + lineLength, lineY);
  
  doc.text(docTitle, centerX, currentY + 4, { align: 'center' });
  currentY += 11;
  
  // Draw Info Cards (Billing, Event Logistics, Document details)
  const margin = 15;
  const cardWidth = 55;
  const cardHeight = 28;
  const cardY = currentY;
  
  const drawCard = (x: number, title: string, lines: string[]) => {
     doc.setFillColor(cardBgRgb[0], cardBgRgb[1], cardBgRgb[2]);
     doc.setDrawColor(borderRgb[0], borderRgb[1], borderRgb[2]);
     doc.rect(x, cardY, cardWidth, cardHeight, 'FD');
     
     doc.setFont(fontName, 'bold');
     doc.setFontSize(7.5);
     doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
     doc.text(title, x + 4, cardY + 5);
     
     doc.setFont(fontName, 'normal');
     doc.setFontSize(7.5);
     doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
     let lineY = cardY + 10;
     for (const line of lines) {
        if (!line) continue;
        doc.text(line, x + 4, lineY);
        lineY += 4.2;
     }
  };
  
  // Card 1: Billed To
  const clientName = client.projectName || client.name || 'Private Client';
  const billingLines = [
     clientName,
     client.companyName || '',
     client.phone || '',
     client.email || ''
  ].filter(Boolean).slice(0, 4);
  drawCard(margin, 'BILLED TO', billingLines);
  
  // Card 2: Event Details
  const clientEvents = client.events || [];
  let resolvedEvent = clientEvents.find((e: any) =>
    e.name.toLowerCase().includes('wedding') || e.name.toLowerCase().includes('muhurtham')
  );
  if (!resolvedEvent && clientEvents.length > 0) {
    resolvedEvent = clientEvents[0];
  }
  
  const wDate = resolvedEvent?.date 
    ? new Date(resolvedEvent.date).toLocaleDateString('en-GB')
    : (client.weddingDate || client.eventDate || 'N/A');
  const mTime = resolvedEvent?.startTime && resolvedEvent?.endTime
    ? `${resolvedEvent.startTime} - ${resolvedEvent.endTime}`
    : 'N/A';
  const wVenue = resolvedEvent?.venueLocation || client.venueAddress || 'N/A';
  
  // Truncate venue for card space
  const venueShort = wVenue.length > 30 ? wVenue.substring(0, 27) + '...' : wVenue;
  
  drawCard(margin + cardWidth + 5, 'EVENT LOGISTICS', [
     `Date: ${wDate}`,
     `Time: ${mTime}`,
     `Venue: ${venueShort}`
  ]);
  
  // Card 3: Document details — customized document-specific fields
  const docInfoLines = invoice.type === 'quotation' ? [
     `Quote No: ${getDisplayId(invoice.quotationCode, invoice.id)}`,
     `Issued Date: ${invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}`,
     `Valid Until: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB') : 'N/A'}`,
     ...(invoice.status ? [`Quote Status: ${invoice.status}`] : [])
  ] : [
     `Invoice No: ${getDisplayId(invoice.invoiceCode, invoice.id)}`,
     `Issued Date: ${invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}`,
     `Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB') : 'N/A'}`,
     `Payment Status: ${invoice.status || 'Unpaid'}`
  ];
  drawCard(margin + (cardWidth * 2) + 10, 'DOCUMENT INFO', docInfoLines);
  
  currentY = cardY + cardHeight + 8;
  
  // Group items
  const items = invoice.items || [];
  const physicalItems = items.filter(item => 
    /album|frame|print|physical/i.test(item.description)
  );
  const digitalItems = items.filter(item => 
    /film|video|highlight|vault|digital|teaser/i.test(item.description)
  );
  const coverageItems = items.filter(item => 
    !physicalItems.includes(item) && !digitalItems.includes(item)
  );
  
  const groups = [
    { title: 'EVENT COVERAGE & SERVICES', items: coverageItems },
    { title: 'CINEMA & DIGITAL ASSETS', items: digitalItems },
    { title: 'PHYSICAL DELIVERABLES', items: physicalItems }
  ].filter(g => g.items.length > 0);
  
  // Render tables group by group
  for (const group of groups) {
     if (currentY + 22 > pageHeight - 30) {
        doc.addPage();
        drawBackground();
        currentY = 20;
     }
     
     // Group Title
     doc.setFont(fontName, 'bold');
     doc.setFontSize(8);
     doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
     doc.text(group.title, margin, currentY);
     currentY += 2;
     
     const tableRows = group.items.map((item, index) => [
        index + 1,
        item.description,
        item.quantity,
        `Rs. ${item.price.toLocaleString('en-IN')}`,
        `Rs. ${(item.quantity * item.price).toLocaleString('en-IN')}`
     ]);
     
     autoTable(doc, {
        startY: currentY,
        head: [['#', 'Description', 'Qty', 'Rate', 'Amount']],
        body: tableRows,
        headStyles: {
           fillColor: cardBgRgb,
           textColor: textRgb,
           fontSize: 7.5,
           fontStyle: 'bold',
           halign: 'center'
        },
        columnStyles: {
           0: { halign: 'center', cellWidth: 8 },
           1: { halign: 'left' },
           2: { halign: 'center', cellWidth: 15 },
           3: { halign: 'right', cellWidth: 25 },
           4: { halign: 'right', cellWidth: 25 }
        },
        styles: {
           font: fontName,
           fontSize: 7.5,
           textColor: textRgb,
           cellPadding: 4,
           lineColor: borderRgb,
           lineWidth: 0.1
        },
        alternateRowStyles: {
           fillColor: bgRgb
        },
        margin: { left: margin, right: margin, bottom: 40 }
     });
     
     currentY = (doc as any).lastAutoTable.finalY + 6;
  }
  
  if (currentY + 55 > pageHeight - 30) {
     doc.addPage();
     drawBackground();
     currentY = 20;
  }
  
  const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const taxAmount = invoice.taxPercent ? (subtotal * invoice.taxPercent / 100) : 0;
  const grandTotal = subtotal + taxAmount - (invoice.discountValue || 0) + (invoice.shippingCost || 0);
  const paidAmount = invoice.paidAmount || 0;
  const balance = grandTotal - paidAmount;
  
  // Resolve Payment schedule
  let milestones: string[] = [];
  if (invoice.paymentTerms && invoice.paymentTerms.trim() && invoice.paymentTerms !== 'Due on Receipt') {
     milestones = invoice.paymentTerms
       .split(/[\n,;]+/)
       .map(term => term.trim())
       .filter(Boolean);
  }
  
  if (milestones.length === 0) {
     const m1 = (grandTotal * 0.1).toLocaleString('en-IN');
     const m2 = (grandTotal * 0.8).toLocaleString('en-IN');
     const m3 = (grandTotal * 0.1).toLocaleString('en-IN');
     milestones = [
       `10% Booking Advance: Rs. ${m1}`,
       `80% Mid-Payment (Before Event): Rs. ${m2}`,
       `10% Final Settlement (On Delivery): Rs. ${m3}`
     ];
  }
  
  // Payment Schedule Box (Left)
  const schedWidth = 95;
  const schedHeight = 36;
  doc.setFillColor(cardBgRgb[0], cardBgRgb[1], cardBgRgb[2]);
  doc.setDrawColor(borderRgb[0], borderRgb[1], borderRgb[2]);
  doc.rect(margin, currentY, schedWidth, schedHeight, 'FD');
  
  doc.setFont(fontName, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  doc.text('PAYMENT SCHEDULE', margin + 4, currentY + 5);
  
  doc.setFont(fontName, 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
  let milY = currentY + 10;
  for (const mil of milestones.slice(0, 5)) {
     doc.text(mil, margin + 4, milY);
     milY += 4.5;
  }
  
  // Bank account details under payment schedule
  let transferY = currentY + schedHeight + 4;
  if (settings.bankDetails && (settings.bankDetails.accountNumber || settings.bankDetails.accountName)) {
     const b = settings.bankDetails;
     doc.setFont(fontName, 'normal');
     doc.setFontSize(6.5);
     doc.setTextColor(textMutedRgb[0], textMutedRgb[1], textMutedRgb[2]);
     
     const bankText = `Transfer: ${b.bankName || ''} | Acc: ${b.accountNumber || ''} | IFSC: ${b.ifsc || (b as any).ifscCode || ''}`;
     doc.text(bankText, margin, transferY);
     transferY += 3;
     if (settings.upiId) {
        doc.text(`UPI ID: ${settings.upiId}`, margin, transferY);
     }
  }
  
  // Financials breakdown (Right)
  const totalsX = pageWidth - margin;
  let totalsY = currentY + 4;
  
  const drawTotalsRow = (label: string, val: string, isBold = false) => {
     doc.setFont(fontName, isBold ? 'bold' : 'normal');
     doc.setFontSize(8);
     doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
     doc.text(label, totalsX - 65, totalsY);
     doc.text(val, totalsX, totalsY, { align: 'right' });
     totalsY += 4.5;
  };
  
  drawTotalsRow('Subtotal:', `Rs. ${subtotal.toLocaleString('en-IN')}`);
  if (invoice.discountValue) {
     drawTotalsRow('Discount:', `-Rs. ${invoice.discountValue.toLocaleString('en-IN')}`);
  }
  if (invoice.taxPercent) {
     drawTotalsRow(`Tax (${invoice.taxPercent}%):`, `Rs. ${taxAmount.toLocaleString('en-IN')}`);
  }
  if (invoice.shippingCost) {
     drawTotalsRow('Transport:', `Rs. ${invoice.shippingCost.toLocaleString('en-IN')}`);
  }
  drawTotalsRow('Paid Advance:', `Rs. ${paidAmount.toLocaleString('en-IN')}`);
  
  // Draw balance box
  totalsY += 2;
  doc.setFillColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  doc.rect(totalsX - 65, totalsY - 3, 65, 7, 'F');
  
  doc.setFont(fontName, 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(255, 255, 255);
  doc.text('BALANCE DUE:', totalsX - 62, totalsY + 2);
  doc.text(`Rs. ${Math.max(0, balance).toLocaleString('en-IN')}`, totalsX - 3, totalsY + 2, { align: 'right' });
  
  // Add QR Code next to financials if UPI set
  if (settings.upiId) {
     try {
        const upiLink = `upi://pay?pa=${encodeURIComponent(settings.upiId)}&pn=${encodeURIComponent(settings.companyName)}&am=${Number(balance)}&cu=INR`;
        const qrDataUrl = await QRCode.toDataURL(upiLink, { 
           margin: 1, 
           width: 100,
           color: { dark: '#000000', light: '#ffffff' }
        });
        doc.addImage(qrDataUrl, 'PNG', totalsX - 20, totalsY + 6, 20, 20, undefined, 'FAST');
        
        doc.setFont(fontName, 'bold');
        doc.setFontSize(5.5);
        doc.setTextColor(textMutedRgb[0], textMutedRgb[1], textMutedRgb[2]);
        doc.text('SCAN TO PAY', totalsX - 22, totalsY + 16, { align: 'right' });
     } catch (qrErr) {
        console.warn('QR Code generation failed in standard PDF', qrErr);
     }
  }
  
  // ────────────────── PAGE 2: TERMS AND CONDITIONS ──────────────────
  doc.addPage();
  doc.setFillColor(bgRgb[0], bgRgb[1], bgRgb[2]);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');
  
  let p2Y = 25;
  doc.setFont(fontName, 'bold');
  doc.setFontSize(12);
  doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  doc.text('TERMS & CONDITIONS', margin, p2Y);
  
  p2Y += 4;
  doc.setDrawColor(borderRgb[0], borderRgb[1], borderRgb[2]);
  doc.line(margin, p2Y, pageWidth - margin, p2Y);
  
  p2Y += 8;
  doc.setFont(fontName, 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(textRgb[0], textRgb[1], textRgb[2]);
  
  const terms = [
    'Booking is confirmed only upon the receipt of the booking advance.',
    'The schedule of payments must be strictly followed as detailed in the payment schedule.',
    'The deliverables will be initiated only after the full and final settlement of all dues.',
    'Raw footage/files will be stored for a maximum of 3 months from the date of the event.',
    'Any transport or lodging outside the package scope will be billed at actual cost.',
    'Post-production turn-around-time is 8 to 12 weeks from the date of final selection.'
  ];
  
  for (let i = 0; i < terms.length; i++) {
     doc.setFont(fontName, 'bold');
     doc.text(`${i + 1}.`, margin, p2Y);
     
     doc.setFont(fontName, 'normal');
     const lineText = terms[i];
     const linesSplit = doc.splitTextToSize(lineText, pageWidth - margin * 2 - 10);
     doc.text(linesSplit, margin + 6, p2Y);
     p2Y += (linesSplit.length * 4) + 2;
  }
  
  // Signatures
  p2Y = pageHeight - 75;
  doc.setDrawColor(borderRgb[0], borderRgb[1], borderRgb[2]);
  doc.line(margin, p2Y, pageWidth - margin, p2Y);
  
  p2Y += 5;
  doc.setFont(fontName, 'bold');
  doc.setFontSize(8);
  doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  doc.text('SIGNATURES & ACCEPTANCE', margin, p2Y);
  
  const sigLineY = p2Y + 20;
  doc.setDrawColor(textMutedRgb[0], textMutedRgb[1], textMutedRgb[2]);
  doc.setLineWidth(0.2);
  
  // Client line
  doc.line(margin, sigLineY, margin + 55, sigLineY);
  doc.setFont(fontName, 'bold');
  doc.setFontSize(7);
  doc.setTextColor(textMutedRgb[0], textMutedRgb[1], textMutedRgb[2]);
  doc.text('CLIENT SIGNATURE', margin, sigLineY + 4);
  doc.setFont(fontName, 'normal');
  doc.setFontSize(6.5);
  doc.text('(PENDING ELECTRONIC SIGNATURE)', margin, sigLineY - 3);
  
  // Company line
  const rightSigX = pageWidth - margin - 55;
  doc.line(rightSigX, sigLineY, pageWidth - margin, sigLineY);
  
  doc.setFont(fontName, 'bold');
  doc.setFontSize(7);
  doc.text('AUTHORIZED SIGNATORY', rightSigX, sigLineY + 4);
  
  // Decorative script name
  doc.setFont(fontName, 'italic');
  doc.setFontSize(9.5);
  doc.setTextColor(brandPrimary[0], brandPrimary[1], brandPrimary[2]);
  const brandCursive = settings.companyName || 'Artisans Company';
  doc.text(brandCursive, rightSigX + 4, sigLineY - 3);
  
  // Metadata
  doc.setProperties({
    title: `${invoice.type === 'quotation' ? 'Quotation' : 'Invoice'} ${getDisplayId(invoice.type === 'quotation' ? invoice.quotationCode : invoice.invoiceCode, invoice.id)}`,
    subject: `Document for ${client.name}`,
    author: settings.companyName,
    creator: 'Artisans OS v1.0'
  });
  
  // Apply APCO footer branding centered on all pages
  applyBrandingFooterToDoc(doc, pageWidth, pageWidth - 30);
  
  const filename = `${invoice.type === 'quotation' ? 'Quotation' : 'Invoice'}_${getDisplayId(invoice.type === 'quotation' ? invoice.quotationCode : invoice.invoiceCode, invoice.id)}_${client.projectName || client.name || 'Client'}.pdf`.replace(/[\s\/]/g, '_');
  if (autoSave) {
     doc.save(filename);
  }
  try {
     invoice.generatedPdf = doc.output('datauristring');
     await api.saveInvoice(invoice);
  } catch (err) {
     console.error('Failed to cache standard PDF', err);
  }
};

export const generateInvoicePDF = async (invoice: Invoice, client: Client, settings: CompanyProfile, autoSave = true) => {
  const globalStored = localStorage.getItem('artisans_global_settings');
  const gSettings: GlobalSettings = globalStored ? JSON.parse(globalStored) : {};
  
  const registry = invoice.type === 'quotation' ? quoteTemplates : invoiceTemplates;
  const isAaha = (settings.companyName || settings.id || '').toLowerCase().includes('aaha');
  const docTemplateId = invoice.templateId;
  const companyTemplateId = invoice.type === 'quotation' ? settings.defaultQuoteTemplate : settings.defaultInvoiceTemplate;
  const templateId = isAaha 
     ? 'apco_master_v1'
     : ((docTemplateId && registry[docTemplateId]) ? docTemplateId : companyTemplateId);
     
  const brandResolver = invoice.type === 'quotation' ? getBrandQuoteTemplate : getBrandInvoiceTemplate;
  const resolvedBrandTemplate = brandResolver(settings.id || settings.companyName);
  const templateDef = templateId && registry[templateId]
     ? registry[templateId]
     : resolvedBrandTemplate;

  if (templateDef.metadata.id === 'apco_master_v1') {
      const doc = new jsPDF(getPdfOptions(gSettings));
      await renderApcoMasterLayout(doc, invoice, client, settings, autoSave);
      return doc;
  }

  if (templateDef.metadata.type === 'canva_image') {
      const metadata = templateDef.metadata as CustomTemplateMetadata;
      const doc = new jsPDF(getPdfOptions(gSettings, { orientation: 'p', unit: 'mm', format: 'a4' }));
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.getHeight();

      if (metadata.backgroundUrl) {
         try {
            doc.addImage(metadata.backgroundUrl, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
         } catch(e) {
            console.error('Failed to add background image', e);
         }
      }

      const fields = metadata.fieldMap;
      const items = invoice.items || [];
      const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
      const tax = invoice.taxPercent ? (subtotal * invoice.taxPercent) / 100 : 0;
      const total = subtotal + tax - (invoice.discountValue || 0);
      const paidAmount = invoice.paidAmount || 0;
      const balance = total - paidAmount;

      const drawField = (key: keyof CustomTemplateMetadata['fieldMap'], value: string) => {
         const config = fields[key];
         if (!config || !config.visible) return;
         
         const x = (config.x / 100) * pdfWidth;
         const y = (config.y / 100) * pdfHeight;
         
         doc.setFontSize(config.fontSize || 12);
         const hex = config.fontColor || '#000000';
         const r = parseInt(hex.slice(1, 3), 16);
         const g = parseInt(hex.slice(3, 5), 16);
         const b = parseInt(hex.slice(5, 7), 16);
         doc.setTextColor(r, g, b);
         doc.text(value, x, y, { align: config.align as any || 'left' });
      };

      drawField('clientName', client?.projectName || client?.name || '');
      drawField('invoiceNumber', invoice.id || '');
      drawField('date', invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('en-GB') : '');
      drawField('dueDate', invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB') : '');
      drawField('total', `Rs. ${total.toLocaleString('en-IN')}`);
      drawField('advancePaid', `Rs. ${paidAmount.toLocaleString('en-IN')}`);
      drawField('balanceDue', `Rs. ${balance.toLocaleString('en-IN')}`);
      drawField('upiDetails', settings.upiId || '');

      if (fields.itemsTable?.visible) {
         const tableX = (fields.itemsTable.x / 100) * pdfWidth;
         const tableY = (fields.itemsTable.y / 100) * pdfHeight;
         
         const tableData = items.map(item => [
           item.description,
           item.quantity.toString(),
           `Rs. ${item.price.toLocaleString('en-IN')}`,
           `Rs. ${(item.quantity * item.price).toLocaleString('en-IN')}`
         ]);

         autoTable(doc, {
            startY: tableY,
            margin: { left: tableX },
            head: [], // hide headers for custom
            body: tableData,
            theme: 'plain',
            styles: {
               fontSize: fields.itemsTable.fontSize || 10,
               textColor: fields.itemsTable.fontColor || '#000000',
               cellPadding: 2
            },
            columnStyles: {
               0: { cellWidth: 80 },
               1: { halign: 'center', cellWidth: 20 },
               2: { halign: 'right', cellWidth: 30 },
               3: { halign: 'right', cellWidth: 30 }
            }
         });
      }

      const filename = `${invoice.type === 'quotation' ? 'Quotation' : 'Invoice'}_${getDisplayId(invoice.type === 'quotation' ? invoice.quotationCode : invoice.invoiceCode, invoice.id)}.pdf`;
      if (autoSave) {
         doc.save(filename);
      }
      try {
         invoice.generatedPdf = doc.output('datauristring');
         await api.saveInvoice(invoice);
      } catch (err) {
         console.error('Failed to cache custom template PDF', err);
      }
      return doc;
  }
  
  if (gSettings.pdfSecureRenderEnabled) {
     const element = document.getElementById('invoice-preview') || document.getElementById('document-preview-container');
     if (element) {
        const canvas = await html2canvas(element, {
           scale: 2,
           useCORS: true,
           backgroundColor: null, // let html2canvas use element background
        });
        const imgData = canvas.toDataURL('image/png');
        const doc = new jsPDF(getPdfOptions(gSettings, { orientation: 'p', unit: 'mm', format: 'a4' }));
        
        const imgProps = (doc as any).getImageProperties(imgData);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        
        // Metadata
        doc.setProperties({
            title: `${invoice.type === 'quotation' ? 'Quotation' : 'Invoice'} ${getDisplayId(invoice.type === 'quotation' ? invoice.quotationCode : invoice.invoiceCode, invoice.id)}`,
           subject: `Financial Document for ${client.name}`,
           author: settings.companyName,
           creator: 'Artisans OS v1.0'
        });



        const filename = `${invoice.type === 'quotation' ? 'Quotation' : 'Invoice'}_${getDisplayId(invoice.type === 'quotation' ? invoice.quotationCode : invoice.invoiceCode, invoice.id)}_SECURE.pdf`;
        if (autoSave) {
           doc.save(filename);
        }
        try {
           invoice.generatedPdf = doc.output('datauristring');
           await api.saveInvoice(invoice);
        } catch (err) {
           console.error('Failed to cache secure render PDF', err);
        }
        return doc;
     }
  }
  // Fallback: Default to premium master layout if no custom layout is selected or matches
  const doc = new jsPDF(getPdfOptions(gSettings));
  await renderApcoMasterLayout(doc, invoice, client, settings, autoSave);
  return doc;
};

export const generateAgreementPDF = async (agreement: ActiveAgreementSnapshot, client: Client, settings: CompanyProfile, autoSave = true) => {
  const quotation = (agreement as any).quotation || {};

  const globalStored = localStorage.getItem('artisans_global_settings');
  const gSettings: GlobalSettings = globalStored ? JSON.parse(globalStored) : {};

  const doc = new jsPDF(getPdfOptions(gSettings));
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  // COLORS
  const hexToRgb = (hex: string): [number, number, number] => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [isNaN(r) ? 16 : r, isNaN(g) ? 185 : g, isNaN(b) ? 129 : b];
  };
  
  const primaryColor: [number, number, number] = settings.primaryColor ? hexToRgb(settings.primaryColor) : [16, 185, 129];
  const darkGray: [number, number, number] = [30, 30, 30];
  const lightGray: [number, number, number] = [100, 100, 100];
  const borderGray: [number, number, number] = [230, 230, 230];

  // WATERMARK
  if (gSettings.pdfWatermarkEnabled) {
     doc.saveGraphicsState();
     // @ts-ignore
     if (doc.GState) {
        // @ts-ignore
        doc.setGState(new doc.GState({ opacity: 0.05 }));
     }
     doc.setTextColor(180, 180, 180);
     doc.setFontSize(35);
     doc.setFont('helvetica', 'bold');
     
     const wmText = settings.companyName.toUpperCase();
     for (let y = 30; y < pageHeight; y += 70) {
        for (let x = -20; x < pageWidth; x += 120) {
           doc.text(wmText, x, y, { angle: 45 });
        }
     }
     doc.restoreGraphicsState();
  }

  // 1. HEADER
  let currentY = 20;

  // Company Branding
  if (settings.logo) {
     try {
        doc.addImage(settings.logo, 'PNG', 20, currentY, 25, 25, undefined, 'FAST');
     } catch (e) {
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text(settings.companyName.charAt(0), 20, currentY + 15);
     }
  } else {
     doc.setFontSize(24);
     doc.setFont('helvetica', 'bold');
     doc.setTextColor(0, 0, 0);
     doc.text(settings.companyName.charAt(0), 20, currentY + 15);
  }

  // Company Details (Left)
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(settings.companyName, 50, currentY + 5);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  
  const addressLines = doc.splitTextToSize(settings.address, 70);
  doc.text(addressLines, 50, currentY + 12);

  // Document Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('AGREEMENT', pageWidth - 20, 30, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text(agreement.title || 'Service Agreement', pageWidth - 20, 38, { align: 'right' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.text(`Version: ${agreement.version}`, pageWidth - 20, 44, { align: 'right' });
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')} | DEBUG BUILD: FRONTEND_CLIENT_2026-06-25 18:45`, pageWidth - 20, 49, { align: 'right' });

  currentY = 60;

  // 2. PARTIES SECTION
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('BETWEEN', 20, currentY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(settings.companyName, 20, currentY + 7);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text('("The Provider")', 20, currentY + 12);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('AND', 120, currentY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(client.projectName || client.name || 'Private Client', 120, currentY + 7);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text('("The Client")', 120, currentY + 12);
  
  currentY += 25;
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.line(20, currentY, pageWidth - 20, currentY);
  currentY += 10;

  // 3. AGREEMENT TERMS
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('TERMS & CONDITIONS', 20, currentY);
  currentY += 8;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

  // Handle multi-line text breaking

  let bodyText = agreement.body || '';
  bodyText = bodyText
    .replace(/●/g, '-')
    .replace(/₹/g, 'Rs. ');

  bodyText = replaceAgreementPlaceholders(bodyText, {
    client,
    quotation,
    agreement,
    company: settings,
  });

  // Clean formatting markers
  bodyText = bodyText
    .replace(/^-\s*%i\s*/gim, '• ')
    .replace(/^●\s*%i\s*/gim, '• ')
    .replace(/^%i\s*/gim, '• ')
    .replace(/%i/gi, '');

  const lines = doc.splitTextToSize(bodyText, pageWidth - 40);
  
  for (let i = 0; i < lines.length; i++) {
    if (currentY > pageHeight - 40) {
       doc.addPage();
       currentY = 20;
    }
    doc.text(lines[i], 20, currentY);
    currentY += 5;
  }

  currentY += 10;
  if (currentY > pageHeight - 60) {
    doc.addPage();
    currentY = 20;
  }

  // 4. SIGNATURES
  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.line(20, currentY, pageWidth - 20, currentY);
  currentY += 10;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('SIGNATURES & ACCEPTANCE', 20, currentY);
  currentY += 10;

  if (agreement.status === 'accepted') {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('ELECTRONICALLY SIGNED BY CLIENT', 20, currentY);
    currentY += 7;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text(`${client.name || client.projectName}`, 20, currentY);
    currentY += 7;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(`Accepted on: ${agreement.acceptedAt ? new Date(agreement.acceptedAt).toLocaleString() : 'N/A'}`, 20, currentY);
    
    // Hash
    if (gSettings.pdfHashEnabled) {
      const salt = gSettings.pdfSecretSalt || 'DEFAULT_SALT';
      const hashInput = `${agreement.templateId}|${client.name}|${agreement.acceptedAt}|${salt}`;
      const hash = sha256(hashInput).substring(0, 16).toUpperCase();
      currentY += 7;
      doc.setFontSize(7);
      doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.text(`SIGNATURE HASH: ${hash}`, 20, currentY);
    }
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text('This agreement is pending signature.', 20, currentY);
  }

  // 5. METADATA & SAVE
  doc.setProperties({
    title: `Agreement - ${client.projectName || client.name}`,
    subject: `Service Agreement`,
    author: settings.companyName,
    creator: 'Artisans OS v1.0'
  });

  const agreementFilename = `Agreement_${client.projectName || client.name || 'Client'}.pdf`.replace(/[\s\/]/g, '_');
  if (autoSave) {
     doc.save(agreementFilename);
  }
  return doc;
};
