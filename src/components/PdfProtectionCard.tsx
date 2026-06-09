import React, { useState, useRef } from 'react';
import { Shield, Eye, EyeOff, ShieldAlert, KeyRound } from 'lucide-react';
import { type GlobalSettings } from '../types';

interface PdfProtectionCardProps {
  globalSettings: GlobalSettings;
  onSave: (settings: GlobalSettings) => void;
}

export const PdfProtectionCard: React.FC<PdfProtectionCardProps> = ({ globalSettings, onSave }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [glowStyle, setGlowStyle] = useState<React.CSSProperties>({});
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState(globalSettings.pdfOwnerPassword || '');
  const [isEditing, setIsEditing] = useState(false);

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

  const handleSave = () => {
    onSave({
      ...globalSettings,
      pdfOwnerPassword: password.trim() || undefined
    });
    setIsEditing(false);
  };

  const isProtected = !!globalSettings.pdfOwnerPassword;

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
            <div className={`p-3 rounded-2xl ${isProtected ? 'bg-primary/10 text-emerald-400 border border-primary/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Security Protocol</p>
              <h3 className="text-xl font-bold tracking-tight text-white uppercase">PDF Tamper Lock</h3>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isProtected ? 'bg-primary shadow-[0_0_12px_#10b981]' : 'bg-amber-500 shadow-[0_0_12px_#f59e0b]'}`} />
            <span className="text-[9px] font-black tracking-widest uppercase text-zinc-400">
              {isProtected ? 'Protected' : 'Vulnerable'}
            </span>
          </div>
        </div>

        <p className="text-xs text-zinc-400 font-medium leading-relaxed mt-2">
          Encrypts invoices with high-grade owners permissions. Prevents unverified alterations, printing modifications, or extraction.
        </p>
      </div>

      <div className="relative z-10 space-y-4">
        {isEditing ? (
          <div className="flex gap-2 relative">
            <div className="relative flex-1">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs font-mono font-bold text-white outline-none focus:border-white/20 transition-colors pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <button
              onClick={handleSave}
              className="px-4 py-3 bg-white text-black text-[10px] font-black uppercase rounded-xl hover:bg-zinc-200 transition-colors"
            >
              Set
            </button>
          </div>
        ) : (
          <div className="flex justify-between items-center bg-black/40 border border-white/5 rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <KeyRound className="w-4 h-4 text-zinc-500" />
              <div className="font-mono text-xs">
                {isProtected ? '••••••••••••' : <span className="text-zinc-600 font-sans italic">No Password Set</span>}
              </div>
            </div>
            <button
              onClick={() => setIsEditing(true)}
              className="text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors"
            >
              {isProtected ? 'Modify' : 'Configure'}
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 mt-2">
          {isProtected ? (
            <Shield className="w-3 h-3 text-primary" />
          ) : (
            <ShieldAlert className="w-3 h-3 text-amber-500" />
          )}
          <span className="text-[9px] font-bold text-zinc-500">
            {isProtected ? 'PDF output encrypted on download' : 'PDF files will not be encrypted'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PdfProtectionCard;

