import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

interface CollectionNavigationProps {
  title?: string;
  photoCount?: number;
}

export const CollectionNavigation: React.FC<CollectionNavigationProps> = ({ title, photoCount }) => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/');
    }
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 px-6 lg:px-12 py-5 flex justify-between items-center transition-all duration-700 select-none ${
        scrolled
          ? 'bg-black/80 backdrop-blur-xl border-b border-white/10 py-3.5 shadow-2xl shadow-black/80'
          : 'bg-gradient-to-b from-black/90 via-black/40 to-transparent'
      }`}
    >
      {/* Return Button */}
      <button
        onClick={handleBack}
        className="group flex items-center gap-2.5 px-4 md:px-5 py-2 rounded-full bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white text-white hover:text-black transition-all duration-500 backdrop-blur-md cursor-pointer"
        aria-label="Back to previous page"
      >
        <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform duration-300" />
        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.25em]">Return</span>
      </button>

      {/* Collection Title & Photo Count Badge */}
      {title && (
        <div className="flex items-center gap-3">
          <span className="text-[10px] md:text-xs font-black uppercase tracking-[0.3em] text-white font-serif">
            {title}
          </span>
          {photoCount !== undefined && photoCount > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[8px] font-mono uppercase tracking-[0.2em] text-zinc-300">
              <Camera className="w-2.5 h-2.5 text-white" />
              {photoCount} Photos
            </span>
          )}
        </div>
      )}

      {/* Artisans Co. Logo Link */}
      <div
        onClick={() => navigate('/')}
        className="flex items-center gap-3 cursor-pointer group"
        aria-label="Artisans Co. Homepage"
      >
        <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-black text-sm rounded-xl group-hover:rotate-12 transition-transform duration-500 shadow-[0_0_15px_rgba(255,255,255,0.25)]">
          A
        </div>
        <span className="text-[9px] font-black tracking-[0.3em] uppercase text-white/90 group-hover:opacity-100 transition-opacity hidden md:inline">
          Artisans Co.
        </span>
      </div>
    </motion.nav>
  );
};

export default CollectionNavigation;
