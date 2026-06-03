import React from 'react';
import { type TemplateProps } from '../types';
import { Lock, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export const DefaultAgreement: React.FC<TemplateProps> = ({ company, agreement }) => {
  const isAgreed = agreement?.status === 'accepted';

  return (
    <div className="glass-panel p-10 squircle-lg border border-white/5 bg-white/[0.01] relative flex flex-col min-h-[600px] w-full max-w-4xl mx-auto">
       <div className="flex items-center gap-4 mb-8 shrink-0">
          <FileText className="w-6 h-6 text-blue-500" />
          <h3 className="text-xl font-black uppercase tracking-widest text-white">Terms of Engagement</h3>
       </div>
       
       <div 
         className="flex-1 overflow-y-auto pr-6 no-scrollbar space-y-10 text-gray-300 text-lg leading-8 font-medium select-none agreement-body"
         onContextMenu={(e) => e.preventDefault()}
       >
          {agreement?.body ? (
             <div className="whitespace-pre-wrap py-2">
                {agreement.body}
             </div>
          ) : (
             <div className="py-20 text-center space-y-4 opacity-50">
                <AlertCircle className="w-12 h-12 mx-auto text-zinc-600" />
                <p className="text-sm font-black uppercase tracking-[0.2em] text-zinc-500">No active agreement has been assigned yet.</p>
                <p className="text-xs font-bold uppercase tracking-widest text-zinc-600">Please contact your account manager to initialize terms.</p>
             </div>
          )}
       </div>

       <div className="mt-4 text-center pb-8 border-b border-white/10 shrink-0">
         <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest flex items-center justify-center gap-2">
            <Lock size={10} className="opacity-50" /> 🔒 This agreement is view-only and securely stored on {company?.companyName || 'the platform'}. For a copy, please contact your account manager.
         </p>
       </div>

       {isAgreed && (
         <div className="mt-8 shrink-0">
            <div className="flex flex-col gap-4 animate-ios-slide-up">
               <div className="flex items-center gap-6 p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-3xl">
                  <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  <div>
                     <p className="text-lg font-black text-white uppercase tracking-widest">Agreement Accepted</p>
                     <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mt-1">Confirmed on: {new Date(agreement?.acceptedAt || new Date()).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
                  </div>
               </div>
            </div>
         </div>
       )}
    </div>
  );
};
