import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { sha256 } from 'js-sha256';
import html2canvas from 'html2canvas';
import { type Invoice, type Client, type CompanyProfile, type GlobalSettings, type ActiveAgreementSnapshot } from '../types';
import { quoteTemplates, invoiceTemplates, getTemplate } from '../templates/registry';
import { type CustomTemplateMetadata } from '../templates/types';

export const generateInvoicePDF = async (invoice: Invoice, client: Client, settings: CompanyProfile) => {
  const globalStored = localStorage.getItem('artisans_global_settings');
  const gSettings: GlobalSettings = globalStored ? JSON.parse(globalStored) : {};
  
  const registry = invoice.type === 'quotation' ? quoteTemplates : invoiceTemplates;
  const templateId = invoice.type === 'quotation' ? settings.defaultQuoteTemplate : settings.defaultInvoiceTemplate;
  const templateDef = getTemplate(registry, templateId || 'default_v1', 'default_v1');

  if (templateDef.metadata.type === 'canva_image') {
      const metadata = templateDef.metadata as CustomTemplateMetadata;
      const doc = new jsPDF({
         orientation: 'p',
         unit: 'mm',
         format: 'a4'
      });
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

      const filename = `${invoice.type === 'quotation' ? 'Quotation' : 'Invoice'}_${invoice.id}.pdf`;
      doc.save(filename);
      return;
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
        const doc = new jsPDF({
           orientation: 'p',
           unit: 'mm',
           format: 'a4'
        });
        
        const imgProps = (doc as any).getImageProperties(imgData);
        const pdfWidth = doc.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
        
        doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        
        // Metadata
        doc.setProperties({
           title: `${invoice.type === 'quotation' ? 'Quotation' : 'Invoice'} ${invoice.id}`,
           subject: `Financial Document for ${client.name}`,
           author: settings.companyName,
           creator: 'Artisans OS v1.0'
        });

        // Still applying encryption if set
        if (gSettings.pdfOwnerPassword && typeof (doc as any).setEncryption === 'function') {
           (doc as any).setEncryption('', gSettings.pdfOwnerPassword, ['print'], 128);
        }

        const filename = `${invoice.type === 'quotation' ? 'Quotation' : 'Invoice'}_${invoice.id}_SECURE.pdf`;
        doc.save(filename);
        return;
     }
  }

  const doc = new jsPDF();
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

  // LAYER 1: WATERMARK (Background)
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
  const logoToUse = invoice.companyLogoUrl || settings.logo;
  if (logoToUse) {
     try {
        doc.addImage(logoToUse, 'PNG', 20, currentY, 25, 25, undefined, 'FAST');
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
  
  let addrY = currentY + 12 + (addressLines.length * 4);
  
  if (settings.gstin) {
    doc.setFont('helvetica', 'bold');
    doc.text(`GSTIN: ${settings.gstin}`, 50, addrY + 2);
  }

  // LAYER 2: QR CODE (Top Right)
  if (gSettings.pdfQrEnabled) {
     try {
        const qrContent = `https://artisans.app/verify/${invoice.id}`;
        const qrDataUrl = await QRCode.toDataURL(qrContent, { 
           margin: 1, 
           width: 150,
           color: { dark: '#000000', light: '#ffffff' }
        });
        doc.addImage(qrDataUrl, 'PNG', pageWidth - 45, 15, 25, 25);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
        doc.text('SCAN TO VERIFY', pageWidth - 32.5, 43, { align: 'center' });
     } catch (qrErr) {
        console.warn('QR Code generation failed', qrErr);
     }
  }

  // Document Title
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(invoice.type === 'quotation' ? 'QUOTATION' : 'INVOICE', pageWidth - 55, 60, { align: 'right' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`${invoice.type === 'quotation' ? 'Quote #' : 'Invoice #'} ${invoice.id}`, pageWidth - 55, 70, { align: 'right' });

  currentY = 85;

  // Dates (Right)
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.text(`Issue Date: ${invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}`, pageWidth - 55, currentY, { align: 'right' });
  doc.text(`Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString('en-GB') : 'N/A'}`, pageWidth - 55, currentY + 5, { align: 'right' });

  // 2. BILL TO SECTION
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('BILL TO', 20, currentY);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(client.projectName || client.name || 'Private Client', 20, currentY + 8);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  
  let clientDetailsY = currentY + 14;
  if (client.email) {
     doc.text(client.email, 20, clientDetailsY);
     clientDetailsY += 5;
  }
  if (client.phone) {
     doc.text(client.phone, 20, clientDetailsY);
     clientDetailsY += 5;
  }
  if (client.address) {
     const clientAddrLines = doc.splitTextToSize(client.address, 80);
     doc.text(clientAddrLines, 20, clientDetailsY);
     clientDetailsY += clientAddrLines.length * 4;
  }

  currentY = Math.max(clientDetailsY + 10, 110);

  // 3. SERVICES TABLE
  const tableData = invoice.items.map((item, index) => [
    index + 1,
    item.description,
    item.quantity,
    `Rs. ${item.price.toLocaleString('en-IN')}`,
    `Rs. ${(item.quantity * item.price).toLocaleString('en-IN')}`
  ]);

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Description', 'Qty', 'Rate', 'Amount']],
    body: tableData,
    headStyles: {
      fillColor: [0, 0, 0] as [number, number, number],
      textColor: [255, 255, 255] as [number, number, number],
      fontSize: 10,
      fontStyle: 'bold',
      halign: 'center'
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left' },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'right', cellWidth: 35 },
      4: { halign: 'right', cellWidth: 35 }
    },
    styles: {
      fontSize: 9,
      cellPadding: 6,
      lineColor: borderGray,
      lineWidth: 0.1
    },
    alternateRowStyles: {
      fillColor: [250, 250, 250]
    },
    margin: { left: 20, right: 20 }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;
  currentY = finalY;

  // 4. TOTALS SECTION
  const subtotal = invoice.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const taxAmount = invoice.taxPercent ? (subtotal * invoice.taxPercent / 100) : 0;
  const grandTotal = subtotal + taxAmount - (invoice.discountValue || 0) + (invoice.shippingCost || 0);

  const totalsX = pageWidth - 20;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);

  doc.text('Subtotal:', totalsX - 40, currentY);
  doc.text(`Rs. ${subtotal.toLocaleString('en-IN')}`, totalsX, currentY, { align: 'right' });
  currentY += 7;

  if (invoice.taxPercent) {
    const cgst = taxAmount / 2;
    const sgst = taxAmount / 2;
    doc.text(`CGST (${invoice.taxPercent / 2}%):`, totalsX - 40, currentY);
    doc.text(`Rs. ${cgst.toLocaleString('en-IN')}`, totalsX, currentY, { align: 'right' });
    currentY += 7;
    doc.text(`SGST (${invoice.taxPercent / 2}%):`, totalsX - 40, currentY);
    doc.text(`Rs. ${sgst.toLocaleString('en-IN')}`, totalsX, currentY, { align: 'right' });
    currentY += 7;
  }

  if (invoice.discountValue) {
    doc.text('Discount:', totalsX - 40, currentY);
    doc.text(`-Rs. ${invoice.discountValue.toLocaleString('en-IN')}`, totalsX, currentY, { align: 'right' });
    currentY += 7;
  }

  if (invoice.shippingCost) {
    doc.text('Shipping:', totalsX - 40, currentY);
    doc.text(`Rs. ${invoice.shippingCost.toLocaleString('en-IN')}`, totalsX, currentY, { align: 'right' });
    currentY += 7;
  }

  doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
  doc.line(totalsX - 60, currentY - 2, totalsX, currentY - 2);
  currentY += 5;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('TOTAL:', totalsX - 40, currentY);
  doc.text(`Rs. ${grandTotal.toLocaleString('en-IN')}`, totalsX, currentY, { align: 'right' });

  // 5. PAYMENT DETAILS (Hash & Disclaimer)
  let paymentY = finalY;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('PAYMENT DETAILS', 20, paymentY);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  paymentY += 8;

  if (settings.upiId) {
     doc.setFont('helvetica', 'bold');
     doc.text('UPI ID:', 20, paymentY);
     doc.setFont('helvetica', 'normal');
     doc.text(settings.upiId, 45, paymentY);
     paymentY += 5;
  }

  const bank = settings.bankDetails;
  if (bank && (bank.accountNumber || bank.accountName)) {
     doc.setFont('helvetica', 'bold');
     doc.text('Bank:', 20, paymentY);
     doc.setFont('helvetica', 'normal');
     doc.text(`${bank.bankName || ''}`, 45, paymentY);
     paymentY += 5;
     doc.setFont('helvetica', 'bold');
     doc.text('Acc No:', 20, paymentY);
     doc.setFont('helvetica', 'normal');
     doc.text(bank.accountNumber, 45, paymentY);
     paymentY += 5;
     doc.setFont('helvetica', 'bold');
     doc.text('IFSC:', 20, paymentY);
     doc.setFont('helvetica', 'normal');
     doc.text(bank.ifsc, 45, paymentY);
     paymentY += 8;
  }

  // LAYER 3: HASH (Fingerprint)
  if (gSettings.pdfHashEnabled) {
     const salt = gSettings.pdfSecretSalt || 'DEFAULT_SALT';
     const hashInput = `${invoice.id}|${client.name}|${grandTotal}|${invoice.issueDate}|${salt}`;
     const hash = sha256(hashInput).substring(0, 16).toUpperCase();
     
     doc.setFontSize(7);
     doc.setFont('helvetica', 'bold');
     doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
     doc.text(`DOCUMENT HASH: ${hash}`, 20, paymentY);
     paymentY += 4;
     doc.setFontSize(6);
     doc.setFont('helvetica', 'normal');
     doc.text('This hash proves document authenticity. Any change to data will invalidate this fingerprint.', 20, paymentY);
  }

  // 6. FOOTER
  const footerY = doc.internal.pageSize.getHeight() - 30;
  
  if (invoice.notes || settings.invoiceNotes) {
     doc.setFontSize(8);
     doc.setFont('helvetica', 'italic');
     doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
     const noteText = invoice.notes || settings.invoiceNotes;
     const noteLines = doc.splitTextToSize(`Notes: ${noteText}`, pageWidth - 40);
     doc.text(noteLines, 20, footerY - 10);
  }

  // LAYER 4: VERIFY FOOTER
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(`VERIFY AUTHENTICITY AT: artisans.app/verify/${invoice.id}`, pageWidth / 2, footerY + 5, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text('THANK YOU FOR YOUR BUSINESS!', pageWidth / 2, footerY + 15, { align: 'center' });
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(lightGray[0], lightGray[1], lightGray[2]);
  doc.text('This is a computer-generated document and does not require a physical signature.', pageWidth / 2, footerY + 22, { align: 'center' });

  // LAYER 5: METADATA
  doc.setProperties({
    title: `${invoice.type === 'quotation' ? 'Quotation' : 'Invoice'} ${invoice.id}`,
    subject: `Invoice for ${client.name}`,
    author: settings.companyName,
    keywords: `invoice, ${invoice.id}, ${settings.companyName}`,
    creator: 'Artisans OS v1.0'
  });

  // 7. ENCRYPTION
  if (gSettings.pdfOwnerPassword && typeof (doc as any).setEncryption === 'function') {
     (doc as any).setEncryption('', gSettings.pdfOwnerPassword, ['print'], 128);
  }

  // Save
  const filename = `${invoice.type === 'quotation' ? 'Quotation' : 'Invoice'}_${invoice.id}_${client.projectName || client.name || 'Client'}.pdf`.replace(/[\s\/]/g, '_');
  doc.save(filename);
};

export const generateAgreementPDF = async (agreement: ActiveAgreementSnapshot, client: Client, settings: CompanyProfile) => {
  const globalStored = localStorage.getItem('artisans_global_settings');
  const gSettings: GlobalSettings = globalStored ? JSON.parse(globalStored) : {};

  const doc = new jsPDF();
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
  doc.text(`Generated: ${new Date().toLocaleDateString('en-GB')}`, pageWidth - 20, 49, { align: 'right' });

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
  const bodyText = agreement.body || '';
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
  doc.save(agreementFilename);
};
