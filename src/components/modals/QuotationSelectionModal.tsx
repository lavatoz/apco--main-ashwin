import React, { useState, useMemo, useEffect, useRef } from 'react';
import { X, Check, Search, Loader2 } from 'lucide-react';
import { type Invoice } from '../../types';

interface QuotationSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  quotations: Invoice[];
  onConfirm: (selectedQuoteId: string | null) => void;
  isLoading?: boolean;
  title?: string;
  confirmLabel?: string;
  allowNoQuotation?: boolean;
}

export const QuotationSelectionModal: React.FC<QuotationSelectionModalProps> = ({
  isOpen,
  onClose,
  quotations,
  onConfirm,
  isLoading = false,
  title = "Select Quotation",
  confirmLabel = "Assign Agreement",
  allowNoQuotation = true
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const modalRef = useRef<HTMLDivElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  // Reset states when modal is opened/closed
  useEffect(() => {
    if (isOpen) {
      setSelectedId(null);
      setSearchQuery("");
      // Set initial focus to search input if it exists, otherwise to the modal container
      setTimeout(() => {
        if (quotations.length > 5 && searchInputRef.current) {
          searchInputRef.current.focus();
        } else {
          modalRef.current?.focus();
        }
      }, 50);
    }
  }, [isOpen, quotations]);

  // Sort quotations newest first (using createdAt or updatedAt)
  const sortedQuotes = useMemo(() => {
    return [...quotations].sort((a, b) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  }, [quotations]);

  // Filter quotations based on search query
  const filteredQuotes = useMemo(() => {
    if (!searchQuery.trim()) return sortedQuotes;
    const query = searchQuery.toLowerCase().trim();
    return sortedQuotes.filter(q => {
      const num = (q.quotationNumber || q.id || '').toLowerCase();
      const name = ((q as any).name || (q as any).description || q.notes || q.items?.[0]?.description || '').toLowerCase();
      return num.includes(query) || name.includes(query);
    });
  }, [sortedQuotes, searchQuery]);

  // Keyboard accessibility listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      } else if (e.key === 'Enter' && selectedId && !isLoading) {
        e.preventDefault();
        handleConfirmClick();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedId, isLoading]);

  const handleConfirmClick = () => {
    if (!selectedId || isLoading) return;
    if (selectedId === 'no-quotation') {
      onConfirm(null);
    } else {
      onConfirm(selectedId);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-[9999] flex items-center justify-center p-4">
      <div
        ref={modalRef}
        tabIndex={-1}
        className="w-full max-w-[700px] max-h-[90vh] overflow-y-auto bg-[#0b0b0b] border border-white/10 rounded-[24px] p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-ios-slide-up no-scrollbar relative flex flex-col focus:outline-none"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        {/* Glow accent */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/45 to-blue-600/45" />

        {/* Modal Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 id="modal-title" className="text-xl font-black text-white uppercase tracking-tighter">
              {title}
            </h2>
            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] mt-1">
              Select or skip quotation linkage
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-2 bg-white/5 rounded-full text-zinc-400 hover:text-white hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Input (only if quotations > 5) */}
        {quotations.length > 5 && (
          <div className="relative mb-5">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search quotations by number or title..."
              value={searchQuery}
              disabled={isLoading}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-xl pl-12 pr-4 py-3 text-xs font-bold text-white outline-none focus:border-white/10 transition-all placeholder:text-zinc-600"
            />
          </div>
        )}

        {/* Quotations List container */}
        <div className="flex-1 overflow-y-auto max-h-[380px] pr-1 space-y-3 no-scrollbar">
          {allowNoQuotation && (
            <div
              tabIndex={isLoading ? -1 : 0}
              onClick={() => !isLoading && setSelectedId('no-quotation')}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  !isLoading && setSelectedId('no-quotation');
                }
              }}
              className={`p-5 rounded-xl border transition-all cursor-pointer flex justify-between items-center ${
                selectedId === 'no-quotation'
                  ? 'border-primary bg-primary/5 shadow-[0_0_15px_rgba(212,175,55,0.1)]'
                  : 'border-white/5 bg-white/5 hover:bg-white/10'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <div>
                <h4 className="text-xs font-black uppercase text-white tracking-wider">
                  Continue without linking a quotation
                </h4>
                <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                  Assign template snapshot directly to client
                </p>
              </div>
              {selectedId === 'no-quotation' && (
                <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-black">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
              )}
            </div>
          )}

          {filteredQuotes.length > 0 ? (
            filteredQuotes.map((q) => {
              const isCardSelected = selectedId === q.id;
              const formattedDate = (q as any).createdAt 
                ? new Date((q as any).createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Created Today';
              const formattedUpdated = (q as any).updatedAt 
                ? new Date((q as any).updatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                : null;

              return (
                <div
                  key={q.id}
                  tabIndex={isLoading ? -1 : 0}
                  onClick={() => !isLoading && setSelectedId(q.id)}
                  onKeyDown={(e) => {
                    if (e.key === ' ' || e.key === 'Enter') {
                      e.preventDefault();
                      !isLoading && setSelectedId(q.id);
                    }
                  }}
                  className={`p-5 rounded-xl border transition-all cursor-pointer flex justify-between items-start ${
                    isCardSelected
                      ? 'border-primary bg-primary/5 shadow-[0_0_20px_rgba(212,175,55,0.15)]'
                      : 'border-white/5 bg-white/5 hover:bg-white/10'
                  } ${isLoading ? 'opacity-50 cursor-not-allowed hover:bg-white/5' : ''}`}
                >
                  <div className="space-y-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                      {q.quotationNumber || q.id}
                    </span>
                    <h4 className="text-xs font-black uppercase text-white tracking-wider">
                      {((q as any).name || (q as any).description || q.notes || q.items?.[0]?.description || 'Quotation Package')}
                    </h4>
                    <div className="flex flex-wrap gap-x-4 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                      <span>Created: {formattedDate}</span>
                      {formattedUpdated && <span>Updated: {formattedUpdated}</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-sm font-black text-primary">
                      ₹{(q.amount || q.totalAmount || 0).toLocaleString('en-IN')}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                      (q.status as string) === 'ACCEPTED' || q.status === 'Approved' || q.status === 'Paid'
                        ? 'bg-primary/20 text-primary border border-primary/20'
                        : 'bg-white/5 border border-white/10 text-zinc-400'
                    }`}>
                      {q.status}
                    </span>
                    {isCardSelected && (
                      <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center text-black shadow-lg">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          ) : quotations.length > 0 && (
            <div className="text-center py-8 text-zinc-500 text-xs font-bold uppercase tracking-widest">
              No quotations found matching "{searchQuery}"
            </div>
          )}

          {quotations.length === 0 && (
            <div className="text-center py-10 text-zinc-500 text-xs font-bold uppercase tracking-widest border border-dashed border-white/5 rounded-xl">
              No quotations exist for this client
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-5 border-t border-white/5 mt-6">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-white transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedId || isLoading}
            onClick={handleConfirmClick}
            className={`flex-1 py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              selectedId && !isLoading
                ? 'bg-white text-black hover:bg-zinc-200 active:scale-95 shadow-2xl'
                : 'bg-white/5 text-zinc-600 cursor-not-allowed'
            }`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin text-black" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};