import React, { useRef, useState, useEffect } from 'react';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
}

const SignaturePad: React.FC<SignaturePadProps> = ({ onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI screens
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    ctx.strokeStyle = '#38bdf8'; // Sky-400 primary brand signature color
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Prevent scrolling on touch devices when drawing
    const preventDefault = (e: Event) => {
      if (e.target === canvas) {
        e.preventDefault();
      }
    };
    document.body.addEventListener('touchstart', preventDefault, { passive: false });
    document.body.addEventListener('touchend', preventDefault, { passive: false });
    document.body.addEventListener('touchmove', preventDefault, { passive: false });

    return () => {
      document.body.removeEventListener('touchstart', preventDefault);
      document.body.removeEventListener('touchend', preventDefault);
      document.body.removeEventListener('touchmove', preventDefault);
    };
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      if (e.touches.length === 0) return { x: 0, y: 0 };
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) {
      const dataUrl = canvas.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onSave('');
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-48 bg-zinc-900/80 border border-white/10 rounded-2xl cursor-crosshair touch-none"
        />
        {isDrawing && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-400 text-[8px] font-black uppercase tracking-widest rounded-md">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
            Drawing
          </div>
        )}
      </div>
      <div className="flex justify-between items-center">
        <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider font-mono">Sign inside the box above</span>
        <button
          type="button"
          onClick={clear}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded-lg border border-white/5 active:scale-95 transition-all"
        >
          Clear Pad
        </button>
      </div>
    </div>
  );
};

export default SignaturePad;
