import React from 'react';
import { type TemplateProps } from '../types';
import { Heart, FileText, CheckCircle2, Lock } from 'lucide-react';

export const WeddingAgreement: React.FC<TemplateProps> = ({ company, agreement }) => {
  const isAgreed = agreement?.status === 'accepted';

  return (
    <div className="bg-white text-zinc-900 p-12 shadow-2xl relative flex flex-col min-h-[600px] w-full max-w-4xl mx-auto rounded-3xl font-serif">
       <div className="absolute top-0 left-0 w-full h-4 bg-gradient-to-r from-amber-200 via-amber-400 to-amber-200 rounded-t-3xl" />
       
       <div className="text-center mb-10">
          <Heart className="w-8 h-8 text-amber-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold tracking-widest uppercase text-amber-900">Nuptial Agreement</h2>
          <p className="text-sm font-medium text-zinc-500 uppercase tracking-[0.3em] mt-2">{company?.companyName || 'Artisans Production'}</p>
       </div>
       
       <div 
         className="flex-1 overflow-y-auto pr-6 space-y-8 text-zinc-700 text-lg leading-relaxed font-sans"
         onContextMenu={(e) => e.preventDefault()}
       >
          {agreement?.body ? (
             <div className="whitespace-pre-wrap">
                {agreement.body}
             </div>
          ) : (
             <div className="py-20 text-center">
                <FileText className="w-12 h-12 mx-auto text-zinc-300 mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest text-zinc-400">Awaiting Wedding Terms Initialization.</p>
             </div>
          )}
       </div>

       <div className="mt-12 pt-8 border-t border-zinc-200 text-center shrink-0">
         <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest flex items-center justify-center gap-2 font-sans">
            <Lock size={10} /> Securely Managed & Encrypted by {company?.companyName}
         </p>
       </div>

       {isAgreed && (
         <div className="mt-8 shrink-0 font-sans">
            <div className="flex flex-col gap-4">
               <div className="flex items-center justify-center gap-4 p-6 bg-amber-50 border border-amber-200 rounded-2xl">
                  <CheckCircle2 className="w-8 h-8 text-amber-600" />
                  <div className="text-left">
                     <p className="text-lg font-bold text-amber-900 uppercase tracking-widest">Couples Agreement Accepted</p>
                     <p className="text-xs font-medium text-amber-700 uppercase tracking-widest mt-1">Confirmed on: {new Date(agreement?.acceptedAt || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  </div>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};
