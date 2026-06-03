import React, { useState, useEffect, useRef } from 'react';
import { QrCode, ShieldCheck, RefreshCw } from 'lucide-react';
import QRCode from 'qrcode';
import { type GlobalSettings } from '../types';

interface QRVerifyCardProps {
  globalSettings: GlobalSettings;
  onSave: (settings: GlobalSettings) => void;
}

export const QRVerifyCard: React.FC<QRVerifyCardProps> = ({ globalSettings, onSave }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});
  const [glowStyle, setGlowStyle] = useState<React.CSSProperties>({});
  const [sampleToken, setSampleToken] = useState(() => Math.random().toString(36).substring(7).toUpperCase());

  const isEnabled = !!globalSettings.pdfQrEnabled;

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

  useEffect(() => {
    if (!canvasRef.current) return;
    
    const qrText = `https://artisans.app/verify/${sampleToken}`;
    QRCode.toCanvas(
      canvasRef.current,
      qrText,
      {
        width: 100,
        margin: 1,
        color: {
          dark: isEnabled ? '#ffffff' : '#4b5563',
          light: '#00000000', // transparent
        },
      },
      (error) => {
        if (error) console.error('QR rendering error:', error);
      }
    );
  }, [isEnabled, sampleToken]);

  const handleToggle = () => {
    onSave({
      ...globalSettings,
      pdfQrEnabled: !isEnabled,
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
              <QrCode className="w-6 h-6" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Authenticity Protocol</p>
              <h3 className="text-xl font-bold tracking-tight text-white uppercase">QR Verification</h3>
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
          Generates a unique cryptographic QR code verification badge on the header of the document, routing instantly to the online verification portal.
        </p>
      </div>

      <div className="relative z-10 flex items-center justify-between gap-6 bg-black/40 border border-white/5 rounded-2xl p-4">
        <div className="flex flex-col gap-2">
          <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Live Preview</span>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold text-zinc-400">{sampleToken}</span>
            <button 
              onClick={() => setSampleToken(Math.random().toString(36).substring(7).toUpperCase())}
              className="text-zinc-600 hover:text-white transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
          <div className="flex items-center gap-1.5 mt-1">
            <ShieldCheck className={`w-3.5 h-3.5 ${isEnabled ? 'text-emerald-400' : 'text-zinc-600'}`} />
            <span className="text-[9px] font-bold text-zinc-500">
              {isEnabled ? 'QR injected in PDF' : 'QR code disabled'}
            </span>
          </div>
        </div>

        <div className="relative shrink-0 w-[84px] h-[84px] bg-black/60 border border-white/10 rounded-xl flex items-center justify-center p-1">
          <canvas ref={canvasRef} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
};

export default QRVerifyCard;
