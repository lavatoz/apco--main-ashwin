import React from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle, Award, FileText, IndianRupee } from 'lucide-react';
import { type Invoice, type Client } from '../types';

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
  client: Client | null;
  documentHash: string;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  isOpen,
  onClose,
  invoice,
  client,
  documentHash,
}) => {
  if (!isOpen || !invoice) return null;

  return createPortal(
    <div 
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'fixed',
        inset: 0,
      }}
      className="z-[100] p-4"
    >
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-2xl animate-modal-overlay" 
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2.5rem] border border-white/10 bg-zinc-950 p-8 shadow-2xl animate-modal-content">
        {/* Grain Overlay */}
        <div 
          className="absolute inset-0 pointer-events-none z-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />

        <div className="relative z-10">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-emerald-400" />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Security Registry Verification</span>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/5 border border-white/5 hover:bg-white/10 flex items-center justify-center text-zinc-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Verification Badge Block */}
          <div className="flex flex-col items-center justify-center text-center p-8 bg-zinc-900/40 border border-white/5 rounded-3xl mb-6">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-4 shadow-[0_0_24px_rgba(16,185,129,0.1)]">
              <CheckCircle className="w-10 h-10 animate-[pulse_2s_infinite]" />
            </div>
            <h4 className="text-xl font-black uppercase tracking-tight text-white">Authentic Document</h4>
            <p className="text-[10px] font-black tracking-widest uppercase text-emerald-400 mt-1">APCO Verified Registry</p>
          </div>

          {/* Details Metadata */}
          <div className="space-y-4 font-sans text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Document Profile</span>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-zinc-400" />
                  <span className="font-bold text-white uppercase">{invoice.type === 'quotation' ? 'Quotation' : 'Invoice'} #{invoice.id}</span>
                </div>
              </div>

              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Total Valuation</span>
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-4 h-4 text-zinc-400" />
                  <span className="font-bold text-white">
                    {((invoice.items || []).reduce((sum, item) => sum + (item.price * item.quantity), 0)).toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-medium">Associated Entity:</span>
                <span className="font-bold text-white">{client?.projectName || client?.name || 'Private Entity'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-medium">Generation Date:</span>
                <span className="font-mono text-zinc-400">{invoice.issueDate ? new Date(invoice.issueDate).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB')}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-zinc-500 font-medium">Verification Stamp:</span>
                <span className="font-mono text-zinc-400">{new Date().toLocaleString()}</span>
              </div>
            </div>

            {/* Document Hash Display */}
            <div className="bg-black/60 border border-white/10 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Document SHA-256 fingerprint</span>
                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Matched</span>
              </div>
              <div className="font-mono text-[10px] font-black text-white tracking-wider break-all bg-zinc-950 p-3 rounded-lg border border-white/5 select-all">
                {documentHash}
              </div>
              <span className="text-[8.5px] text-zinc-500 font-medium">
                This verification certifies that the document content, pricing, and signature logs match the exact state saved in the local registry.
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-6 py-4 bg-white text-black hover:bg-zinc-200 transition-colors font-black text-[10px] uppercase tracking-widest rounded-2xl"
          >
            Acknowledge Validation
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default VerificationModal;
