import React from 'react';
import { type TemplateProps } from '../types';

export const TinyToesQuote: React.FC<TemplateProps> = ({ company, client, document }) => {
  const items = document?.items || [];
  const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
  const tax = document?.taxPercent ? (subtotal * document.taxPercent) / 100 : 0;
  const total = subtotal + tax - (document?.discountValue || 0);

  return (
    <div className="bg-blue-50 text-slate-800 p-12 min-h-[800px] w-full max-w-4xl mx-auto font-sans relative shadow-2xl rounded-[3rem] overflow-hidden">
      {/* Decorative Blob */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-yellow-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70 pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-pink-200 rounded-full mix-blend-multiply filter blur-2xl opacity-70 pointer-events-none" />

      {/* Header */}
      <div className="flex justify-between items-center mb-16 relative z-10 bg-white/50 backdrop-blur-md p-8 rounded-3xl border border-white">
         <div className="flex items-center gap-4">
            {company?.logo ? (
               <img src={company.logo} alt="Logo" className="w-16 h-16 rounded-2xl object-cover shadow-sm" />
            ) : (
               <div className="w-16 h-16 bg-blue-100 text-blue-500 flex items-center justify-center rounded-2xl shadow-sm text-2xl font-black">
                  {company?.companyName?.charAt(0) || 'T'}
               </div>
            )}
            <div>
               <h1 className="text-2xl font-black text-slate-800 tracking-tight">{company?.companyName || 'Tiny Toes'}</h1>
               <p className="text-sm font-medium text-slate-500 mt-1">{company?.tagline || 'Capturing Tiny Moments'}</p>
            </div>
         </div>
         <div className="text-right">
            <h2 className="text-3xl font-black text-blue-500 tracking-tight">Quotation</h2>
            <div className="mt-2 inline-block bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Quote No.</p>
               <p className="text-sm font-black text-slate-700">{document?.id}</p>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-12 relative z-10">
         <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-3">Prepared For</h3>
            <p className="text-lg font-black text-slate-800">{client?.projectName || client?.name || 'Client'}</p>
            {client?.email && <p className="text-sm text-slate-500 mt-1 font-medium">{client.email}</p>}
         </div>
         <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 text-right">
            <h3 className="text-xs font-black text-blue-400 uppercase tracking-widest mb-3">Quote Date</h3>
            <p className="text-lg font-black text-slate-800">{document?.issueDate ? new Date(document.issueDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}</p>
         </div>
      </div>

      {/* Items */}
      <div className="mb-12 relative z-10 bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-xs font-black uppercase text-slate-400 tracking-widest">
              <th className="p-6">Package / Service</th>
              <th className="p-6 text-center">Qty</th>
              <th className="p-6 text-right">Rate</th>
              <th className="p-6 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {items.map((item: any, i: number) => (
              <tr key={i} className="border-t border-slate-100">
                <td className="p-6 text-slate-700 font-bold">{item.description}</td>
                <td className="p-6 text-center text-slate-500 font-medium">{item.quantity}</td>
                <td className="p-6 text-right text-slate-500 font-medium">₹{item.price?.toLocaleString()}</td>
                <td className="p-6 text-right text-slate-800 font-black">₹{(item.quantity * item.price).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-16 relative z-10">
         <div className="w-72 space-y-4 bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
            <div className="flex justify-between text-sm font-bold text-slate-500">
               <span>Subtotal</span>
               <span className="text-slate-700">₹{subtotal.toLocaleString()}</span>
            </div>
            {tax > 0 && (
               <div className="flex justify-between text-sm font-bold text-slate-500">
                  <span>Tax ({document?.taxPercent}%)</span>
                  <span className="text-slate-700">₹{tax.toLocaleString()}</span>
               </div>
            )}
            {document?.discountValue > 0 && (
               <div className="flex justify-between text-sm font-bold text-pink-500">
                  <span>Discount</span>
                  <span>-₹{document.discountValue.toLocaleString()}</span>
               </div>
            )}
            <div className="flex justify-between items-center text-2xl font-black text-blue-500 pt-4 border-t border-slate-100">
               <span>Total</span>
               <span>₹{total.toLocaleString()}</span>
            </div>
         </div>
      </div>

      {/* Footer */}
      <div className="mt-auto relative z-10 bg-white/50 backdrop-blur-md p-6 rounded-3xl text-center border border-white">
         <p className="text-sm font-bold text-slate-500">{company?.invoiceNotes || 'We look forward to capturing these precious moments!'}</p>
      </div>
    </div>
  );
};
