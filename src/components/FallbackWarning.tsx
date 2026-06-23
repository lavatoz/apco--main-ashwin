import React, { useState, useEffect } from 'react';
import { WifiOff, X } from 'lucide-react';

export const FallbackWarning: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleFallbackEvent = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail) {
        const active = !!customEvent.detail.active;
        setIsActive(active);
        if (!active) {
          setDismissed(false);
        }
      }
    };

    window.addEventListener('api-fallback-active', handleFallbackEvent);
    return () => window.removeEventListener('api-fallback-active', handleFallbackEvent);
  }, []);

  if (!isActive || dismissed) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[9999] animate-ios-slide-up font-sans">
      <div className="bg-amber-500/10 backdrop-blur-md border border-amber-500/20 text-amber-400 p-4 rounded-2xl shadow-2xl flex items-center gap-4 max-w-sm">
        <div className="p-2.5 bg-amber-500/20 rounded-xl text-amber-400 shrink-0">
          <WifiOff className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-black uppercase tracking-widest leading-none mb-1.5">Offline Fallback Active</p>
          <p className="text-[10px] font-medium text-zinc-400 leading-normal">
            Backend services are currently offline. Running in secure local-only fallback mode.
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 hover:bg-white/5 rounded-lg text-zinc-500 hover:text-white transition-colors self-start"
          aria-label="Dismiss warning"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default FallbackWarning;
