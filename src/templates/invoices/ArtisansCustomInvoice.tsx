import React from 'react';
import { type TemplateProps } from '../types';

export const ArtisansCustomInvoice: React.FC<TemplateProps> = ({ company, client, document }) => {
  const items = document?.items || [];
  const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const tax = document?.taxPercent ? (subtotal * document.taxPercent) / 100 : 0;
  const total = subtotal + tax - (document?.discountValue || 0);
  const paidAmount = document?.paidAmount || 0;
  const balance = total - paidAmount;

  return (
    <div 
      className="text-zinc-300 p-12 min-h-[297mm] w-full max-w-[210mm] mx-auto font-sans relative flex flex-col justify-between selection:bg-amber-500/30 selection:text-white"
      style={{
        backgroundColor: '#000000',
        backgroundImage: `linear-gradient(to bottom, #000000 0%, #000000 70%, rgba(0, 0, 0, 0.5) 85%, rgba(0, 0, 0, 0) 100%), url('/assets/artisans_custom_bg.png')`,
        backgroundSize: '100% 100%',
        backgroundPosition: 'center bottom',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Absolute Decorative Frame to match mockup */}
      <div className="absolute inset-6 border border-white/5 pointer-events-none rounded-2xl" />

      <div>
        {/* Header Block */}
        <div className="flex justify-between items-start mb-8 relative z-10">
          {/* Top-Left Company Logo Fallback */}
          <div className="flex items-center gap-3">
            {company?.logo ? (
              <img 
                src={company.logo} 
                alt="Brand Logo" 
                className="w-12 h-12 rounded-lg object-cover border border-white/10" 
                onError={(e) => {
                  // Fallback to Artisans logo if image fails to load
                  (e.target as HTMLImageElement).src = '/assets/artisans_logo.png';
                }}
              />
            ) : (
              <img 
                src="/assets/artisans_logo.png" 
                alt="Artisans Logo" 
                className="w-12 h-12 rounded-lg object-cover border border-white/10" 
              />
            )}
            <div>
              <span className="text-[10px] tracking-[0.25em] text-zinc-500 font-bold uppercase block">Artisans</span>
              <span className="text-[8px] tracking-widest text-zinc-600 block uppercase">Production Company</span>
            </div>
          </div>
          
          {/* Top-Right Template Version Tag */}
          <div className="text-right">
            <span className="inline-block px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[8px] font-black uppercase text-zinc-500 tracking-widest">
              v1.0.0
            </span>
          </div>
        </div>

        {/* Center Main Aaha Wedding Logo */}
        <div className="flex flex-col items-center justify-center mb-12 relative z-10">
          <img 
            src="/assets/aaha_wedding_logo.png" 
            alt="Aaha Kalyanam" 
            className="w-72 object-contain" 
            onError={(e) => {
              // Safe fallback just in case
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>

        {/* Client & Metadata Grid */}
        <div className="grid grid-cols-2 gap-8 mb-10 px-4 relative z-10">
          {/* TO Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-black text-white uppercase tracking-[0.25em] mb-3">TO</h3>
            <div className="space-y-1">
              <p className="text-sm font-bold text-white tracking-wide uppercase">
                {client?.projectName || client?.name || 'Valued Client'}
              </p>
              {client?.name && client?.projectName && (
                <p className="text-xs text-zinc-400">{client.name}</p>
              )}
              {client?.phone && (
                <p className="text-xs text-zinc-400 font-mono">{client.phone}</p>
              )}
              {client?.email && (
                <p className="text-xs text-zinc-500 font-mono tracking-tight">{client.email}</p>
              )}
            </div>
          </div>

          {/* DATE & INVOICE NUMBER Section */}
          <div className="text-right flex flex-col justify-start items-end space-y-6">
            {/* Date block */}
            <div className="space-y-1">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.25em]">DATE</h3>
              <p className="text-xs text-zinc-400 font-mono font-medium">
                {document?.issueDate ? new Date(document.issueDate).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }) : new Date().toLocaleDateString('en-GB')}
              </p>
            </div>
            
            {/* Invoice number block */}
            <div className="space-y-1">
              <h3 className="text-xs font-black text-white uppercase tracking-[0.25em]">INVOICE NUMBER</h3>
              <p className="text-xs text-zinc-400 font-mono font-medium tracking-widest uppercase">
                {document?.id || 'INV-0000'}
              </p>
            </div>
          </div>
        </div>

        {/* Translucent Premium Invoice Table */}
        <div className="mb-10 px-2 relative z-10">
          <div className="bg-[#0c0c0e]/75 backdrop-blur-md border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] bg-white/[0.02]">
                  <th className="py-4 px-6">ITEM NAME</th>
                  <th className="py-4 px-4 text-right">PRICE</th>
                  <th className="py-4 px-4 text-center">QTY</th>
                  <th className="py-4 px-6 text-right">TOTAL</th>
                </tr>
              </thead>
              <tbody className="text-xs border-b border-white/5 divide-y divide-white/[0.02]">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-zinc-500 italic">
                      No services or items added to this invoice.
                    </td>
                  </tr>
                ) : (
                  items.map((item: any, i: number) => (
                    <tr key={i} className="hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 px-6 text-white font-bold tracking-wide">{item.description}</td>
                      <td className="py-4 px-4 text-right text-zinc-400 font-mono">₹{item.price?.toLocaleString('en-IN')}</td>
                      <td className="py-4 px-4 text-center text-zinc-400 font-mono">{item.quantity}</td>
                      <td className="py-4 px-6 text-right text-white font-mono font-bold">₹{(item.quantity * item.price).toLocaleString('en-IN')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Totals Section inside Table Card */}
            <div className="p-6 bg-white/[0.01] flex justify-end">
              <div className="w-72 space-y-3">
                <div className="flex justify-between text-xs text-zinc-400 tracking-wide font-medium">
                  <span>SUB TOTAL</span>
                  <span className="font-mono text-zinc-300">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                
                {tax > 0 && (
                  <div className="flex justify-between text-xs text-zinc-400 tracking-wide font-medium">
                    <span>GST ({document?.taxPercent}%)</span>
                    <span className="font-mono text-zinc-300">₹{tax.toLocaleString('en-IN')}</span>
                  </div>
                )}
                
                {document?.discountValue > 0 && (
                  <div className="flex justify-between text-xs text-emerald-500 tracking-wide font-medium">
                    <span>DISCOUNT</span>
                    <span className="font-mono">-₹{document.discountValue.toLocaleString('en-IN')}</span>
                  </div>
                )}

                {paidAmount > 0 && (
                  <div className="flex justify-between text-xs text-emerald-400 tracking-wide font-medium">
                    <span>ADVANCE PAID</span>
                    <span className="font-mono">-₹{paidAmount.toLocaleString('en-IN')}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-sm font-black text-white pt-3 border-t border-white/10 bg-white/[0.01] px-3 py-2 rounded-lg">
                  <span className="tracking-[0.15em] text-[10px] text-zinc-300">TOTAL</span>
                  <span className="font-mono text-white text-base">₹{Math.max(0, balance).toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Block - Overlaid perfectly over the desk background graphics */}
      <div className="grid grid-cols-2 gap-8 px-4 mt-auto mb-4 relative z-10">
        {/* Dynamic Payment & UPI Section */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-white uppercase tracking-[0.25em]">PAYMENT DETAILS</h3>
          <div className="space-y-1.5 text-[11px] text-zinc-400 font-medium font-sans">
            {company?.bankDetails?.bankName && (
              <p className="flex items-center gap-1.5">
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[8px] w-12">Bank:</span>
                <span className="text-zinc-300">{company.bankDetails.bankName}</span>
              </p>
            )}
            {company?.bankDetails?.accountNumber && (
              <p className="flex items-center gap-1.5">
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[8px] w-12">A/C No:</span>
                <span className="text-zinc-300 font-mono">{company.bankDetails.accountNumber}</span>
              </p>
            )}
            {company?.bankDetails?.ifsc && (
              <p className="flex items-center gap-1.5">
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[8px] w-12">IFSC:</span>
                <span className="text-zinc-300 font-mono">{company.bankDetails.ifsc}</span>
              </p>
            )}
            {company?.upiId && (
              <p className="flex items-center gap-1.5 pt-1.5 mt-1.5 border-t border-white/5">
                <span className="text-zinc-500 font-bold uppercase tracking-wider text-[8px] w-12">UPI ID:</span>
                <span className="text-amber-500 font-mono tracking-wide">{company.upiId}</span>
              </p>
            )}
          </div>
        </div>

        {/* Dynamic Stamp/Note Section */}
        <div className="flex flex-col justify-end items-end text-right space-y-2">
          {company?.gstin && (
            <p className="text-[10px] text-zinc-500 tracking-wider font-mono">
              GSTIN: <span className="text-zinc-400">{company.gstin}</span>
            </p>
          )}
          <p className="text-[9px] text-zinc-600 uppercase tracking-widest max-w-xs leading-normal">
            {company?.invoiceNotes || 'All payments are subject to terms and conditions.'}
          </p>
          <div className="pt-2">
            <span className="inline-block border-b border-white/10 w-28 h-6 mb-1"></span>
            <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Authorized Signature</p>
          </div>
        </div>
      </div>
    </div>
  );
};
