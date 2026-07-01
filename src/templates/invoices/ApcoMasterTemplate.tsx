import React from 'react';
import { type TemplateProps } from '../types';
import { aahaLogoBase64 } from '../../utils/aahaLogo';

export const ApcoMasterTemplate: React.FC<TemplateProps> = ({ company, client, document }) => {
  const items = document?.items || [];
  const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const tax = document?.taxPercent ? (subtotal * document.taxPercent) / 100 : 0;
  const total = subtotal + tax - (document?.discountValue || 0) + (document?.shippingCost || 0);
  const paidAmount = document?.paidAmount || 0;
  const balance = total - paidAmount;

  // Resolve Brand & Theme Profile
  let primaryColor = company?.primaryColor || '#3B82F6';
  let theme = (company?.themePreset || 'modern').toLowerCase();
  
  const isAaha = (company?.companyName || '').toLowerCase().includes('aaha');
  if (isAaha) {
    theme = 'classic';
    primaryColor = '#783d0c';
  }

  // Resolve Event Details from client events
  const clientEvents = client?.events || [];
  // Resolution Priority:
  // 1. Keyword search (wedding, muhurtham)
  let resolvedEvent = clientEvents.find((e: any) =>
    e.name.toLowerCase().includes('wedding') || e.name.toLowerCase().includes('muhurtham')
  );
  // 2. Fallback: earliest event in list
  if (!resolvedEvent && clientEvents.length > 0) {
    resolvedEvent = clientEvents[0];
  }

  const weddingDate = resolvedEvent?.date 
    ? new Date(resolvedEvent.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    : (client?.weddingDate || client?.eventDate || 'N/A');

  const muhurthamTime = resolvedEvent?.startTime && resolvedEvent?.endTime
    ? `${resolvedEvent.startTime} - ${resolvedEvent.endTime}`
    : 'N/A';

  const weddingVenue = resolvedEvent?.venueLocation || client?.venueAddress || 'N/A';

  // Group services
  const physicalItems = items.filter((item: any) => 
    /album|frame|print|physical/i.test(item.description)
  );
  const digitalItems = items.filter((item: any) => 
    /film|video|highlight|vault|digital|teaser/i.test(item.description)
  );
  const coverageItems = items.filter((item: any) => 
    !physicalItems.includes(item) && !digitalItems.includes(item)
  );

  const groups = [
    { title: 'Event Coverage & Services', items: coverageItems },
    { title: 'Cinema & Digital Assets', items: digitalItems },
    { title: 'Physical Deliverables', items: physicalItems }
  ].filter(g => g.items.length > 0);

  // Resolve Payment Schedule
  let milestones: string[] = [];
  if (document?.paymentTerms && document.paymentTerms.trim() && document.paymentTerms !== 'Due on Receipt') {
    milestones = document.paymentTerms
      .split(/[\n,;]+/)
      .map((term: string) => term.trim())
      .filter(Boolean);
  }

  if (milestones.length === 0) {
    const m1 = (total * 0.1).toLocaleString('en-IN');
    const m2 = (total * 0.8).toLocaleString('en-IN');
    const m3 = (total * 0.1).toLocaleString('en-IN');
    milestones = [
      `10% Booking Advance: ₹${m1}`,
      `80% Mid-Payment (Before Event): ₹${m2}`,
      `10% Final Settlement (On Delivery): ₹${m3}`
    ];
  }

  // Theme presets definitions
  const themeClasses: Record<string, { container: string; text: string; textMuted: string; card: string; border: string; font: string }> = {
    classic: {
      container: 'bg-[#FAF9F6] border-amber-900/20',
      text: 'text-stone-900',
      textMuted: 'text-stone-500',
      card: 'bg-stone-100/50 border-stone-200',
      border: 'border-stone-200',
      font: 'font-serif'
    },
    luxury: {
      container: 'bg-[#FCF9F2] border-amber-600/30',
      text: 'text-[#1A1816]',
      textMuted: 'text-stone-500',
      card: 'bg-[#FAF5EA] border-[#EADFC9]',
      border: 'border-[#EADFC9]',
      font: 'font-serif'
    },
    minimal: {
      container: 'bg-[#F8FAFC] border-slate-200',
      text: 'text-slate-800',
      textMuted: 'text-slate-400',
      card: 'bg-slate-50 border-slate-100',
      border: 'border-slate-100',
      font: 'font-sans'
    },
    modern: {
      container: 'bg-white border-slate-200',
      text: 'text-slate-900',
      textMuted: 'text-slate-500',
      card: 'bg-slate-50 border-slate-150',
      border: 'border-slate-150',
      font: 'font-sans'
    }
  };

  const currentTheme = themeClasses[theme] || themeClasses.modern;

  // Render Footer Banner Placeholder (Matches direct drawing size ratio)
  const FooterBanner = () => (
    <div className="absolute bottom-8 left-12 right-12 text-center pointer-events-none opacity-80 border-t pt-4 border-slate-200">
      <p className="text-[10px] tracking-widest text-slate-400 uppercase font-light">
        {company?.companyName || 'ARTISANS PRODUCTION COMPANY'}
      </p>
      <p className="text-[8px] text-slate-350 mt-1">
        {company?.email} | {company?.phone || 'www.artisans.com'}
      </p>
    </div>
  );

  return (
    <div className={`flex flex-col gap-12 w-full max-w-4xl mx-auto ${currentTheme.font}`}>
      
      {/* ────────────────── PAGE 1: DETAILS & SUMMARY ────────────────── */}
      <div className={`relative w-full min-h-[1100px] p-12 shadow-xl border rounded-md ${currentTheme.container}`}>
        
        {/* Header */}
        <div className="text-center mb-10">
          {isAaha ? (
            <img 
              src={aahaLogoBase64} 
              alt="Aaha Kalyanam Logo" 
              className="max-w-[280px] max-h-[90px] mx-auto object-contain mb-4" 
            />
          ) : company?.logo ? (
            <img 
              src={company.logo} 
              alt="Brand Logo" 
              className="max-w-[230px] max-h-[75px] mx-auto object-contain mb-4" 
            />
          ) : (
            <h1 
              className="text-3xl font-black uppercase tracking-wider mb-2"
              style={{ color: primaryColor }}
            >
              {company?.companyName || 'Artisans Company'}
            </h1>
          )}
          {company?.tagline && !isAaha && (
            <p className={`text-xs italic ${currentTheme.textMuted}`}>{company.tagline}</p>
          )}
          {/* Document Title Header */}
          <div className="flex items-center justify-center gap-4 mt-6">
            <div className="h-[1px] w-20" style={{ backgroundColor: primaryColor, opacity: 0.3 }} />
            <h2 className="text-md font-bold uppercase tracking-[0.25em]" style={{ color: primaryColor }}>
              {document?.type === 'quotation' ? 'QUOTATION' : 'INVOICE'}
            </h2>
            <div className="h-[1px] w-20" style={{ backgroundColor: primaryColor, opacity: 0.3 }} />
          </div>
        </div>

        {/* Info Cards Row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          
          {/* Column 1: Client details */}
          <div className={`p-4 border rounded-lg ${currentTheme.card}`}>
            <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: primaryColor }}>
              Billed To
            </h4>
            <div className="text-xs space-y-1">
              <p className="font-bold">{client?.projectName || client?.name || 'Private Client'}</p>
              {client?.companyName && <p className={currentTheme.textMuted}>{client.companyName}</p>}
              {client?.phone && <p className={currentTheme.textMuted}>{client.phone}</p>}
              {client?.email && <p className={currentTheme.textMuted}>{client.email}</p>}
            </div>
          </div>

          {/* Column 2: Event logistics */}
          <div className={`p-4 border rounded-lg ${currentTheme.card}`}>
            <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: primaryColor }}>
              Event Logistics
            </h4>
            <div className="text-xs space-y-1">
              <p><span className="font-semibold">Date:</span> {weddingDate}</p>
              <p><span className="font-semibold">Time:</span> {muhurthamTime}</p>
              <p className="truncate"><span className="font-semibold">Venue:</span> {weddingVenue}</p>
            </div>
          </div>

          {/* Column 3: Document details */}
          <div className={`p-4 border rounded-lg ${currentTheme.card}`}>
            <h4 className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: primaryColor }}>
              Document Info
            </h4>
            <div className="text-xs space-y-1">
              <p className="font-bold uppercase">
                {document?.type === 'quotation' ? 'Quote No' : 'Invoice No'}: {document?.id}
              </p>
              <p>
                <span className="font-semibold">Issued Date:</span>{' '}
                {document?.issueDate ? new Date(document.issueDate).toLocaleDateString('en-GB') : 'N/A'}
              </p>
              <p>
                <span className="font-semibold">
                  {document?.type === 'quotation' ? 'Valid Until' : 'Due Date'}:
                </span>{' '}
                {document?.dueDate ? new Date(document.dueDate).toLocaleDateString('en-GB') : 'N/A'}
              </p>
              {document?.type !== 'quotation' ? (
                <p>
                  <span className="font-semibold">Payment Status:</span>{' '}
                  {document?.status || 'Unpaid'}
                </p>
              ) : (
                document?.status && (
                  <p>
                    <span className="font-semibold">Quote Status:</span>{' '}
                    {document.status}
                  </p>
                )
              )}
            </div>
          </div>

        </div>

        {/* Grouped Services and Deliverables */}
        <div className="space-y-6 mb-8">
          {groups.map((group, idx) => (
            <div key={idx} className="w-full">
              <h5 className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: primaryColor }}>
                {group.title}
              </h5>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b border-t ${currentTheme.border} ${currentTheme.card}`}>
                    <th className="py-2 pl-2">Description</th>
                    <th className="py-2 text-right pr-4 w-24">Price</th>
                    <th className="py-2 text-center w-16">Qty</th>
                    <th className="py-2 text-right pr-2 w-24">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map((item: any, rowIdx: number) => (
                    <tr key={rowIdx} className={`border-b ${currentTheme.border}`}>
                      <td className="py-2.5 pl-2 font-medium">{item.description}</td>
                      <td className="py-2.5 text-right pr-4 font-sans">₹{item.price?.toLocaleString()}</td>
                      <td className="py-2.5 text-center">{item.quantity}</td>
                      <td className="py-2.5 text-right pr-2 font-bold font-sans">₹{(item.price * item.quantity).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>

        {/* Dynamic Financials & Payment Schedule side-by-side */}
        <div className="grid grid-cols-5 gap-6 mt-8 mb-16">
          
          {/* Payment Schedule (3 cols) */}
          <div className={`col-span-3 p-4 border rounded-lg ${currentTheme.card}`}>
            <h5 className="text-[10px] font-bold uppercase tracking-wider mb-3" style={{ color: primaryColor }}>
              Payment Schedule
            </h5>
            <div className="text-xs space-y-2">
              {milestones.map((milestone, mIdx) => (
                <p key={mIdx} className="font-medium text-slate-700">• {milestone}</p>
              ))}
            </div>
            
            {/* Account Details */}
            {(company?.bankDetails?.bankName || company?.bankDetails?.accountNumber) && (
              <div className="mt-4 pt-3 border-t border-slate-200 text-[10px] space-y-1 text-slate-500">
                <p>
                  <span className="font-bold">Bank Transfer:</span> {company.bankDetails.bankName || ''} | Acc: {company.bankDetails.accountNumber || ''} | IFSC: {company.bankDetails.ifsc || company.bankDetails.ifscCode || ''}
                </p>
                {company?.upiId && <p><span className="font-bold">UPI ID:</span> {company.upiId}</p>}
              </div>
            )}
          </div>

          {/* Financial Breakdown (2 cols) */}
          <div className="col-span-2 space-y-3">
            <div className="flex justify-between text-xs font-medium">
              <span>Subtotal</span>
              <span className="font-sans">₹{subtotal.toLocaleString()}</span>
            </div>
            {tax > 0 && (
              <div className="flex justify-between text-xs font-medium">
                <span>Tax / GST ({document?.taxPercent}%)</span>
                <span className="font-sans">₹{tax.toLocaleString()}</span>
              </div>
            )}
            {document?.discountValue > 0 && (
              <div className="flex justify-between text-xs font-medium text-emerald-600">
                <span>Discount</span>
                <span className="font-sans">-₹{document.discountValue.toLocaleString()}</span>
              </div>
            )}
            {document?.shippingCost > 0 && (
              <div className="flex justify-between text-xs font-medium">
                <span>Shipping / Transport</span>
                <span className="font-sans">₹{document.shippingCost.toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-xs font-medium">
              <span>Advance Paid</span>
              <span className="font-sans">₹{paidAmount.toLocaleString()}</span>
            </div>

            {/* Accent colored total balance due */}
            <div 
              className="flex justify-between items-center text-white px-3 py-2 rounded-md font-bold mt-4"
              style={{ backgroundColor: primaryColor }}
            >
              <span className="text-[10px] uppercase tracking-wider font-semibold">Balance Due</span>
              <span className="text-md font-sans">₹{Math.max(0, balance).toLocaleString()}</span>
            </div>

            {/* QR Block */}
            {company?.upiId && (
              <div className="flex items-center justify-end gap-3 mt-4 text-right">
                <span className="text-[9px] font-bold text-slate-400">
                  SCAN TO PAY<br/>VIA UPI
                </span>
                <div className="w-12 h-12 bg-white border border-slate-200 rounded p-1 flex items-center justify-center">
                  <span className="text-[8px] text-slate-400 font-bold">QR</span>
                </div>
              </div>
            )}

          </div>

        </div>

        {/* Footer Branding Banner */}
        <FooterBanner />

      </div>

      {/* ────────────────── PAGE 2: TERMS & SIGNATURES ────────────────── */}
      <div className={`relative w-full min-h-[900px] p-12 shadow-xl border rounded-md ${currentTheme.container}`}>
        
        {/* Terms & Conditions */}
        <div className="mb-12">
          <h3 className="text-md font-bold uppercase tracking-wider mb-3" style={{ color: primaryColor }}>
            Terms & Conditions
          </h3>
          <div className={`h-[1px] w-full mb-6 ${currentTheme.border} border-t`} />
          <ol className="list-decimal pl-5 space-y-4 text-xs leading-relaxed text-slate-700">
            <li>Booking is confirmed only upon the receipt of the booking advance.</li>
            <li>The schedule of payments must be strictly followed as detailed in the payment schedule.</li>
            <li>The deliverables will be initiated only after the full and final settlement of all dues.</li>
            <li>Raw footage/files will be stored for a maximum of 3 months from the date of the event.</li>
            <li>Any transport or lodging outside the package scope will be billed at actual cost.</li>
            <li>Post-production turn-around-time is 8 to 12 weeks from the date of final selection.</li>
          </ol>
        </div>

        {/* Signature Area */}
        <div className="mt-24 pt-8 border-t border-slate-200">
          <h4 className="text-[10px] font-bold uppercase tracking-wider mb-12 text-slate-400">
            Signatures & Acceptance
          </h4>
          <div className="grid grid-cols-2 gap-16">
            
            {/* Client Signature */}
            <div className="space-y-4">
              <div className="h-10 flex items-end">
                <span className="text-[10px] italic text-slate-400">Pending Electronic Signature</span>
              </div>
              <div className="h-[1px] bg-slate-300 w-full" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Client Signature & Date
              </p>
            </div>

            {/* Company Signature */}
            <div className="space-y-4">
              <div className="h-10 flex items-end pl-2">
                <span className="font-serif italic text-lg font-bold" style={{ color: primaryColor }}>
                  {company?.companyName || 'Artisans Company'}
                </span>
              </div>
              <div className="h-[1px] bg-slate-300 w-full" />
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                Authorized Signatory
              </p>
            </div>

          </div>
        </div>

        {/* Footer Branding Banner */}
        <FooterBanner />

      </div>

    </div>
  );
};
