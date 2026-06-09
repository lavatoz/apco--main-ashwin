import React from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/70 z-[10001] flex items-center justify-center p-4 backdrop-blur-sm animate-ios-fade-in"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md glass-panel rounded-3xl p-8 shadow-2xl animate-ios-slide-up relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${tone === 'danger' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-white/5 border-white/10 text-white'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">{title}</h3>
            <p className="text-[11px] font-bold text-zinc-400 leading-relaxed">{message}</p>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-white/5 text-zinc-400 hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all border border-transparent hover:border-white/10"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${tone === 'danger' ? 'bg-red-500 text-white hover:bg-red-400' : 'bg-white text-black hover:bg-zinc-200'}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default ConfirmDialog;

