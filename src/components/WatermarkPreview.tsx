import React, { useState, useRef } from 'react';
import { Layers, CheckCircle2 } from 'lucide-react';
import { type GlobalSettings } from '../types';

interface WatermarkPreviewProps {
  globalSettings: GlobalSettings;
  onSave: (settings: GlobalSettings) => void;
}

export const WatermarkPreview: React.FC<WatermarkPreviewProps> = ({ globalSettings, onSave }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [glowStyle, setGlowStyle] = useState<React.CSSProperties>({});

  const isEnabled = !!globalSettings.pdfWatermarkEnabled;

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
      pdfWatermarkEnabled: !isEnabled,
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
            <div className={`p-3 rounded-2xl ${isEnabled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-zinc-800 text-zinc-500 border border-white/5'}`}>
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Anti-Forgery Protocol</p>
              <h3 className="text-xl font-bold tracking-tight text-white uppercase">Document Watermark</h3>
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
          Applies a repeated, semi-transparent diagonal branding pattern ("AAHA KALYANAM VERIFIED") across the background of generated documents to restrict scanning reproduction.
        </p>
      </div>

      {/* Grid Pattern Watermark Simulator */}
      <div className="relative z-10 overflow-hidden bg-black/40 border border-white/5 rounded-2xl p-4 h-24 flex flex-col justify-between">
        <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Pattern Simulator</span>
        
        {/* Repeating text container */}
        <div className="absolute inset-0 flex flex-wrap gap-x-12 gap-y-6 justify-center items-center pointer-events-none p-4 select-none overflow-hidden opacity-25">
          {Array.from({ length: 9 }).map((_, i) => (
            <span
              key={i}
              className={`text-[8px] font-black uppercase tracking-widest -rotate-[22deg] transition-all duration-1000 ${
                isEnabled ? 'text-white/30 animate-[pulse_3s_ease-in-out_infinite]' : 'text-zinc-800'
              }`}
            >
              AAHA VERIFIED
            </span>
          ))}
        </div>

        <div className="flex items-center gap-1.5 mt-auto relative z-10">
          <CheckCircle2 className={`w-3.5 h-3.5 ${isEnabled ? 'text-emerald-400' : 'text-zinc-600'}`} />
          <span className="text-[9px] font-bold text-zinc-500">
            {isEnabled ? 'Visual pattern active' : 'Visual pattern bypassed'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default WatermarkPreview;
