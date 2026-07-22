import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export const EmptyGalleryState: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full py-32 px-6 flex flex-col items-center justify-center text-center bg-black">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="max-w-md mx-auto flex flex-col items-center"
      >
        <div className="w-20 h-20 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center mb-8 backdrop-blur-md shadow-2xl">
          <Camera className="w-8 h-8 text-zinc-500 animate-pulse" />
        </div>
        <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-white mb-3 font-serif">
          No photographs available yet
        </h3>
        <p className="text-zinc-500 text-xs font-mono uppercase tracking-[0.2em] leading-relaxed mb-8">
          This editorial archive is currently being curated. Please check back soon.
        </p>
        <button
          onClick={() => navigate('/')}
          className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all duration-300 shadow-[0_0_30px_rgba(255,255,255,0.2)]"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Return to Homepage</span>
        </button>
      </motion.div>
    </div>
  );
};

export default EmptyGalleryState;
