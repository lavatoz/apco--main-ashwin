import React from 'react';
import { type TemplateProps } from '../types';
import { Shield } from 'lucide-react';

export const ArtisansInvoice: React.FC<TemplateProps> = ({ company, client, document }) => {
  const items = document?.items || [];
  const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const tax = document?.taxPercent ? (subtotal * document.taxPercent) / 100 : 0;
  const total = subtotal + tax - (document?.discountValue || 0);
  const paidAmount = document?.paidAmount || 0;
  const balance = total - paidAmount;

  return (
    <div className="bg-[#09090b] text-zinc-300 p-12 min-h-[800px] w-full max-w-4xl mx-auto font-sans relative border border-white/10">
      {/* Header */}
      <div className="flex justify-between items-start mb-16 border-b border-white/10 pb-8">
        <div className="flex items-center gap-4">
           {company?.logo ? (
              <img src={company.logo} alt="Logo" className="w-16 h-16 rounded-xl object-cover" />
           ) : (
              <div className="w-16 h-16 bg-white/5 border border-white/10 flex items-center justify-center rounded-xl">
                 <Shield className="w-8 h-8 text-white" />
              </div>
           )}
           <div>
              <h1 className="text-2xl font-black text-white uppercase tracking-widest">{company?.companyName || 'Artisans'}</h1>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{company?.tagline || 'Strategic Production'}</p>
           </div>
        </div>
        <div className="text-right">
           <h2 className="text-4xl font-black text-white uppercase tracking-tighter">Tax Invoice</h2>
           <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">INV: {document?.id}</p>
           <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
             DATE: {document?.issueDate ? new Date(document.issueDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}
           </p>
           <div className={`mt-4 inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${balance <= 0 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
              {balance <= 0 ? 'PAID IN FULL' : 'PAYMENT PENDING'}
           </div>
        </div>
      </div>

      {/* Bill To */}
      <div className="mb-12 flex justify-between">
         <div>
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Billed To</h3>
            <p className="text-lg font-bold text-white uppercase">{client?.projectName || client?.name || 'Client'}</p>
            {client?.email && <p className="text-sm text-zinc-400 mt-1">{client.email}</p>}
            {client?.phone && <p className="text-sm text-zinc-400 mt-1">{client.phone}</p>}
         </div>
         <div className="text-right max-w-xs">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">From</h3>
            <p className="text-sm text-zinc-400">{company?.address}</p>
            {company?.gstin && <p className="text-sm text-zinc-400 mt-1">GSTIN: {company.gstin}</p>}
         </div>
      </div>

      {/* Items */}
      <div className="mb-12">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-[10px] font-black uppercase text-zinc-500 tracking-widest">
              <th className="py-4 font-normal">Description</th>
              <th className="py-4 text-center font-normal">Qty</th>
              <th className="py-4 text-right font-normal">Rate</th>
              <th className="py-4 text-right font-normal">Amount</th>
            </tr>
          </thead>
          <tbody className="text-sm border-b border-white/10">
            {items.map((item: any, i: number) => (
              <tr key={i} className="border-b border-white/5 last:border-0">
                <td className="py-4 text-white font-medium">{item.description}</td>
                <td className="py-4 text-center text-zinc-400">{item.quantity}</td>
                <td className="py-4 text-right text-zinc-400 font-mono">₹{item.price?.toLocaleString()}</td>
                <td className="py-4 text-right text-white font-mono">₹{(item.quantity * item.price).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-between mb-16">
         {/* Payment Info */}
         <div className="w-64">
             <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] mb-4">Payment Info</h3>
             <div className="space-y-2 text-xs font-mono text-zinc-400">
                {company?.bankDetails?.bankName && <p>Bank: {company.bankDetails.bankName}</p>}
                {company?.bankDetails?.accountNumber && <p>Acc: {company.bankDetails.accountNumber}</p>}
                {company?.bankDetails?.ifsc && <p>IFSC: {company.bankDetails.ifsc}</p>}
                {company?.upiId && <p className="mt-4 pt-4 border-t border-white/5">UPI: {company.upiId}</p>}
             </div>
         </div>
         
         {/* Numbers */}
         <div className="w-64 space-y-3">
            <div className="flex justify-between text-sm text-zinc-400 font-mono">
               <span>Subtotal</span>
               <span>₹{subtotal.toLocaleString()}</span>
            </div>
            {tax > 0 && (
               <div className="flex justify-between text-sm text-zinc-400 font-mono">
                  <span>Tax ({document?.taxPercent}%)</span>
                  <span>₹{tax.toLocaleString()}</span>
               </div>
            )}
            {document?.discountValue > 0 && (
               <div className="flex justify-between text-sm text-emerald-500 font-mono">
                  <span>Discount</span>
                  <span>-₹{document.discountValue.toLocaleString()}</span>
               </div>
            )}
            <div className="flex justify-between items-center text-xl font-black text-white pt-4 border-t border-white/10 font-mono">
               <span className="uppercase tracking-widest text-sm text-zinc-500">Total</span>
               <span>₹{total.toLocaleString()}</span>
            </div>
            {paidAmount > 0 && (
               <div className="flex justify-between items-center text-sm font-black text-emerald-500 pt-2 font-mono">
                  <span className="uppercase tracking-widest text-[10px]">Paid</span>
                  <span>-₹{paidAmount.toLocaleString()}</span>
               </div>
            )}
            <div className={`flex justify-between items-center text-xl font-black pt-4 border-t border-white/10 font-mono ${balance > 0 ? 'text-amber-500' : 'text-zinc-500'}`}>
               <span className="uppercase tracking-widest text-sm">Balance</span>
               <span>₹{Math.max(0, balance).toLocaleString()}</span>
            </div>
         </div>
      </div>

      {/* Footer */}
      <div className="mt-auto pt-8 border-t border-white/10 flex justify-between items-end">
         <div>
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Thank you for your business</p>
            <p className="text-xs text-zinc-600 max-w-md leading-relaxed">{company?.invoiceNotes || 'Payment is due within 15 days.'}</p>
         </div>
         <div className="text-right">
             <div className="w-32 h-12 border-b border-white/20 mb-2"></div>
             <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Authorized Signature</p>
         </div>
      </div>
    </div>
  );
};
