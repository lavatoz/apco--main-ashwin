import React, { useState, useEffect, useRef } from 'react';

interface AnimatedDashboardProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedDashboard: React.FC<AnimatedDashboardProps> = ({ children, className = '' }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      // Calculate relative coordinates
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      setMousePos({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative min-h-screen bg-transparent text-white p-1 ${className}`}
    >
      {/* Cinematic Background Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 z-0"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '4rem 4rem',
        }}
      />

      {/* Cybernetic Accent Diagonal Line */}
      <div className="absolute inset-0 pointer-events-none z-0 bg-gradient-to-tr from-transparent via-white/[0.02] to-transparent" />

      {/* Glowing Cursor Follower */}
      {isHovered && (
        <div
          className="absolute pointer-events-none z-0 rounded-full blur-[120px] opacity-40 transition-opacity duration-500 bg-white/10"
          style={{
            left: `${mousePos.x - 200}px`,
            top: `${mousePos.y - 200}px`,
            width: '400px',
            height: '400px',
          }}
        />
      )}

      {/* Grain Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none z-0 opacity-[0.12] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Foreground Content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
};

export default AnimatedDashboard;
