import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel: () => void;
  disableCloseOnClickOutside?: boolean;
}

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  onCancel,
  disableCloseOnClickOutside = false
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Handle focus management
  useEffect(() => {
    if (isOpen) {
      // Focus cancel button or dialog container
      // Specifically for danger tone (or generally), focus the cancel button to prevent accidental confirmation
      if (cancelBtnRef.current) {
        cancelBtnRef.current.focus();
      } else if (dialogRef.current) {
        dialogRef.current.focus();
      }
    }
  }, [isOpen]);

  // Handle keyboard events (Escape to close, Tab to trap focus)
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }

      if (e.key === 'Tab') {
        if (!dialogRef.current) return;
        const focusableElements = Array.from(
          dialogRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
        ) as HTMLElement[];

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const handleBackdropClick = () => {
    if (!disableCloseOnClickOutside) {
      onCancel();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 z-[10001] flex items-center justify-center p-4 backdrop-blur-[2px] animate-dialog-backdrop"
      onClick={handleBackdropClick}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        tabIndex={-1}
        className="w-full max-w-md bg-[#111827] border border-white/5 rounded-2xl p-8 shadow-2xl animate-dialog-content relative focus:outline-none"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-5">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${tone === 'danger' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-white/5 border-white/10 text-white'}`}>
            {tone === 'danger' ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <AlertCircle className="w-5 h-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="confirm-dialog-title" className="text-xl font-extrabold text-white uppercase tracking-tight mb-2.5 break-words">
              {title}
            </h3>
            <p id="confirm-dialog-message" className="text-xs font-semibold text-zinc-400 leading-relaxed break-words">
              {message}
            </p>
          </div>
        </div>
        <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3">
          <button
            ref={cancelBtnRef}
            type="button"
            onClick={onCancel}
            className="h-11 px-6 bg-white/5 text-zinc-300 hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all duration-200 active:scale-[0.98] border border-white/5 hover:border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 focus:ring-offset-2 focus:ring-offset-[#111827]"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            className={`h-11 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all duration-200 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#111827] ${
              tone === 'danger' 
                ? 'bg-red-600/90 text-white hover:bg-red-600 active:bg-red-700 focus:ring-red-500' 
                : 'bg-white text-black hover:bg-zinc-200 active:bg-zinc-300 focus:ring-white'
            }`}
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

