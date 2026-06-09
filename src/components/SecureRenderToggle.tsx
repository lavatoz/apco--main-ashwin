import React, { useState, useRef } from 'react';
import { ShieldCheck, EyeOff, Ban } from 'lucide-react';
import { type GlobalSettings } from '../types';

interface SecureRenderToggleProps {
  globalSettings: GlobalSettings;
  onSave: (settings: GlobalSettings) => void;
}

export const SecureRenderToggle: React.FC<SecureRenderToggleProps> = ({ globalSettings, onSave }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [glowStyle, setGlowStyle] = useState<React.CSSProperties>({});

  const isEnabled = !!globalSettings.pdfSecureRenderEnabled;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = -(y - centerY) / (rect.height / 8);
    const rotateY = (x - centerX) / (rect.width / 8);

    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-2px)`,
      transition: 'transform 0.1s ease-out',
    });

    setGlowStyle({
      background: `radial-gradient(250px circle at ${x}px ${y}px, rgba(255, 255, 255, 0.08), transparent 80%)`,
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0px)',
      transition: 'transform 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
    });
    setGlowStyle({});
  };

  const handleToggle = () => {
    onSave({
      ...globalSettings,
      pdfSecureRenderEnabled: !isEnabled,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ ...tiltStyle }}
      className="relative overflow-hidden rounded-[2rem] border border-white/5 bg-zinc-950/40 backdrop-blur-xl p-8 transition-all duration-300 hover:border-white/15 hover:bg-zinc-950/60 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col justify-between h-[360px]"
    >
      {/* Glow Hover Layer */}
      <div className="absolute inset-0 pointer-events-none z-0" style={glowStyle} />

      <div className="relative z-10 flex flex-col gap-4">
        {/* Title Block */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl ${isEnabled ? 'bg-primary/10 text-emerald-400 border border-primary/20' : 'bg-zinc-800 text-zinc-500 border border-white/5'}`}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Anti-Copy Protocol</p>
              <h3 className="text-xl font-bold tracking-tight text-white uppercase">Secure Render Mode</h3>
            </div>
          </div>
          
          <button
            onClick={handleToggle}
            className={`w-12 h-6 rounded-full transition-all duration-300 flex items-center p-0.5 ${isEnabled ? 'bg-white justify-end' : 'bg-zinc-850 border border-white/10 justify-start'}`}
          >
            <span className={`w-4 h-4 rounded-full transition-all ${isEnabled ? 'bg-black' : 'bg-zinc-500'}`} />
          </button>
        </div>

        <p className="text-xs text-zinc-400 font-medium leading-relaxed mt-2">
          Renders the document using a non-interactive image canvas inside the PDF instead of standard text characters. Disables highlighting, copying, or scraping metadata.
        </p>
      </div>

      <div className="relative z-10 space-y-3 bg-black/40 border border-white/5 rounded-2xl p-4">
        <div className="flex justify-between items-center">
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Security Actions</span>
          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${isEnabled ? 'bg-emerald-950 text-emerald-400 border border-primary/10' : 'bg-zinc-850 text-zinc-600 border border-white/5'}`}>
            {isEnabled ? 'Enforced' : 'Disabled'}
          </span>
        </div>

        <div className="flex items-center justify-between border-t border-white/5 pt-3">
          <div className="flex items-center gap-2">
            <EyeOff className={`w-4 h-4 ${isEnabled ? 'text-white' : 'text-zinc-650'}`} />
            <span className="text-[10px] font-bold text-zinc-400">Anti-Text Selection</span>
          </div>
          <div className="flex items-center gap-2">
            <Ban className={`w-4 h-4 ${isEnabled ? 'text-white' : 'text-zinc-650'}`} />
            <span className="text-[10px] font-bold text-zinc-400">Scrape Defeat</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecureRenderToggle;

