import React from 'react';
import { type TemplateProps } from '../types';

export const AahaInvoice: React.FC<TemplateProps> = ({ company, client, document }) => {
  const items = document?.items || [];
  const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const tax = document?.taxPercent ? (subtotal * document.taxPercent) / 100 : 0;
  const total = subtotal + tax - (document?.discountValue || 0);
  const paidAmount = document?.paidAmount || 0;
  const balance = total - paidAmount;

  return (
    <div className="bg-[#FAF9F6] text-amber-950 p-16 min-h-[800px] w-full max-w-4xl mx-auto font-serif relative shadow-xl border-x-8 border-amber-900">
      {/* Decorative Border */}
      <div className="absolute inset-4 border border-amber-900/10 pointer-events-none" />
      <div className="absolute inset-5 border border-amber-900/5 pointer-events-none" />

      {/* Header */}
      <div className="text-center mb-16 relative z-10">
         {company?.logo ? (
            <img src={company.logo} alt="Logo" className="w-20 h-20 mx-auto rounded-full object-cover mb-6 border-2 border-amber-200 p-1" />
         ) : (
            <div className="w-20 h-20 mx-auto rounded-full bg-amber-50 border-2 border-amber-200 flex items-center justify-center mb-6">
               <span className="text-2xl text-amber-700 font-bold">{company?.companyName?.charAt(0) || 'A'}</span>
            </div>
         )}
         <h1 className="text-4xl font-bold tracking-widest uppercase text-amber-900">{company?.companyName || 'Aaha Kalyanam'}</h1>
         <p className="text-sm italic text-amber-700/70 mt-2 font-light">{company?.tagline || 'Weddings That Tell Your Story'}</p>
         
         <div className="flex items-center justify-center gap-4 mt-8">
             <div className="h-[1px] w-12 bg-amber-200" />
             <h2 className="text-xl uppercase tracking-[0.3em] text-amber-800">Final Invoice</h2>
             <div className="h-[1px] w-12 bg-amber-200" />
         </div>
      </div>

      <div className="flex justify-between items-end mb-16 px-4">
         <div>
            <p className="text-xs uppercase tracking-widest text-amber-700/60 mb-2">Billed To</p>
            <p className="text-xl font-bold text-amber-950">{client?.projectName || client?.name || 'The Happy Couple'}</p>
         </div>
         <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-amber-700/60 mb-2">Details</p>
            <p className="text-sm font-medium text-amber-900">INV: {document?.id}</p>
            <p className="text-sm font-medium text-amber-900">Date: {document?.issueDate ? new Date(document.issueDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}</p>
            <div className={`mt-2 inline-block px-3 py-1 text-xs uppercase tracking-widest font-bold border ${balance <= 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
               {balance <= 0 ? 'Paid in Full' : 'Payment Due'}
            </div>
         </div>
      </div>

      {/* Items */}
      <div className="mb-16 px-4">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-amber-100 text-xs uppercase text-amber-900/60 tracking-widest">
              <th className="py-4 font-bold">Service / Memory</th>
              <th className="py-4 text-center font-bold">Qty</th>
              <th className="py-4 text-right font-bold">Rate</th>
              <th className="py-4 text-right font-bold">Total</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {items.map((item: any, i: number) => (
              <tr key={i} className="border-b border-amber-50">
                <td className="py-4 text-amber-950 font-medium pr-4">{item.description}</td>
                <td className="py-4 text-center text-amber-800">{item.quantity}</td>
                <td className="py-4 text-right text-amber-800 font-sans">₹{item.price?.toLocaleString()}</td>
                <td className="py-4 text-right text-amber-950 font-sans font-bold">₹{(item.quantity * item.price).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals & Payments */}
      <div className="flex justify-between mb-16 px-4">
         {/* Payment Info */}
         <div className="w-64">
             <h3 className="text-[10px] font-black text-amber-900/60 uppercase tracking-[0.2em] mb-4">Transfer Details</h3>
             <div className="space-y-2 text-xs font-sans text-amber-800">
                {company?.bankDetails?.bankName && <p><span className="font-bold">Bank:</span> {company.bankDetails.bankName}</p>}
                {company?.bankDetails?.accountNumber && <p><span className="font-bold">Acc:</span> {company.bankDetails.accountNumber}</p>}
                {company?.bankDetails?.ifsc && <p><span className="font-bold">IFSC:</span> {company.bankDetails.ifsc}</p>}
                {company?.upiId && <p className="mt-4 pt-4 border-t border-amber-100"><span className="font-bold">UPI:</span> {company.upiId}</p>}
             </div>
         </div>

         <div className="w-72 space-y-3 bg-amber-50 p-6 rounded-2xl">
            <div className="flex justify-between text-sm text-amber-900/70 font-sans">
               <span>Subtotal</span>
               <span>₹{subtotal.toLocaleString()}</span>
            </div>
            {tax > 0 && (
               <div className="flex justify-between text-sm text-amber-900/70 font-sans">
                  <span>Tax ({document?.taxPercent}%)</span>
                  <span>₹{tax.toLocaleString()}</span>
               </div>
            )}
            {document?.discountValue > 0 && (
               <div className="flex justify-between text-sm text-emerald-600 font-sans">
                  <span>Courtesy Discount</span>
                  <span>-₹{document.discountValue.toLocaleString()}</span>
               </div>
            )}
            <div className="flex justify-between items-center text-xl font-bold text-amber-950 pt-4 border-t border-amber-200 font-sans">
               <span className="uppercase tracking-widest text-xs text-amber-900/80 font-serif font-bold">Total</span>
               <span>₹{total.toLocaleString()}</span>
            </div>
            {paidAmount > 0 && (
               <div className="flex justify-between items-center text-sm font-bold text-emerald-600 pt-2 font-sans">
                  <span className="uppercase tracking-widest text-[10px] font-serif font-bold">Paid</span>
                  <span>-₹{paidAmount.toLocaleString()}</span>
               </div>
            )}
            <div className={`flex justify-between items-center text-xl font-bold pt-4 border-t border-amber-200 font-sans ${balance > 0 ? 'text-red-700' : 'text-amber-950/50'}`}>
               <span className="uppercase tracking-widest text-xs font-serif font-bold">Balance</span>
               <span>₹{Math.max(0, balance).toLocaleString()}</span>
            </div>
         </div>
      </div>

      {/* Footer */}
      <div className="mt-auto text-center px-4">
         <p className="text-xs text-amber-800/60 leading-relaxed max-w-lg mx-auto italic">{company?.invoiceNotes || 'Thank you for allowing us to be part of your story.'}</p>
         <div className="mt-8 flex justify-center gap-6 text-[10px] uppercase tracking-widest text-amber-900/40">
            <span>{company?.email}</span>
            <span>•</span>
            <span>{company?.phone || company?.website || 'www.aahakalyanam.com'}</span>
         </div>
      </div>
    </div>
  );
};
