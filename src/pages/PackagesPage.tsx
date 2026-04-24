import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Packages from '../components/Packages';

const PackagesPage: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500 selection:text-white overflow-x-hidden relative">
      {/* Matte Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none bg-noise z-0 opacity-50" />

      {/* Dynamic Background Glow */}
      <div
        className="fixed inset-0 pointer-events-none z-0 transition-opacity duration-1000"
        style={{
          background: `radial-gradient(circle 800px at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.04), transparent 80%)`
        }}
      />

      {/* Navigation (Matching LandingPage style) */}
      <nav className={`fixed top-0 left-0 right-0 z-50 py-6 px-8 flex justify-between items-center transition-all duration-700 ${scrolled ? 'glass-panel-dark border-b border-white/5 py-4' : 'bg-transparent'}`}>
        <div className="flex items-center gap-4 group cursor-pointer" onClick={() => window.location.href = '/'}>
          <div className="w-10 h-10 bg-white text-black flex items-center justify-center font-black text-xl rounded-2xl group-hover:rotate-12 transition-transform duration-500 shadow-[0_0_20px_rgba(255,255,255,0.3)]">A</div>
          <span className="text-xs font-bold tracking-[0.3em] uppercase opacity-80 group-hover:opacity-100 transition-opacity">Artisans Co.</span>
        </div>

        <div className="flex items-center gap-10">
          <div className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">
            <NavLink to="/#work" className="hover:text-white hover:scale-105 transition-all duration-300">Portfolio</NavLink>
            <NavLink to="/#divisions" className="hover:text-white hover:scale-105 transition-all duration-300">Divisions</NavLink>
            <NavLink to="/#philosophy" className="hover:text-white hover:scale-105 transition-all duration-300">Studio</NavLink>
            <NavLink 
              to="/packages" 
              className={({ isActive }) => 
                `hover:text-white hover:scale-105 transition-all duration-300 relative ${isActive ? 'text-white' : ''}`
              }
            >
              {({ isActive }: { isActive: boolean }) => (
                <>
                  PACKAGES
                  <span className={`absolute -bottom-1 left-0 right-0 h-[1px] bg-white transition-transform origin-left ${isActive ? 'scale-x-100' : 'scale-x-0'}`} />
                </>
              )}
            </NavLink>
          </div>
          <button
            onClick={onLogin}
            className="group flex items-center gap-3 px-6 py-3 glass-panel rounded-full text-white text-xs font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
          >
            <span>Client Portal</span>
            <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </nav>

      <div className="pt-32">
        <Packages />
      </div>

      {/* Footer replication or component if needed */}
    </div>
  );
};

export default PackagesPage;
