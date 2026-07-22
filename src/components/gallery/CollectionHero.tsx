import React from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Camera, MapPin, Calendar } from 'lucide-react';
import type { CollectionData } from '../../types/galleryTypes';

interface CollectionHeroProps {
  collection: CollectionData;
}

export const CollectionHero: React.FC<CollectionHeroProps> = ({ collection }) => {
  return (
    <section className="relative w-full h-screen min-h-[650px] flex flex-col justify-end px-6 md:px-16 pb-16 md:pb-24 overflow-hidden select-none bg-black">
      {/* Background Hero Image */}
      <motion.div
        initial={{ scale: 1.1, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.65 }}
        transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
        className="absolute inset-0 z-0"
      >
        <img
          src={collection.heroImage}
          alt={collection.title}
          className="w-full h-full object-cover grayscale contrast-115 brightness-90"
        />
        {/* Subtle Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />
        <div className="absolute inset-0 bg-radial-vignette opacity-70 pointer-events-none" />
      </motion.div>

      {/* Content Overlay */}
      <div className="relative z-10 max-w-7xl mx-auto w-full flex flex-col justify-end">
        {/* Category & Photo Count Tag */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-center gap-3 mb-6"
        >
          <span className="px-4 py-1.5 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-[9px] font-black uppercase tracking-[0.25em] text-zinc-300">
            {collection.category}
          </span>
          <span className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/60 border border-white/10 backdrop-blur-md text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400">
            <Camera className="w-3 h-3 text-white" />
            {collection.photoCount} Photos
          </span>
        </motion.div>

        {/* Collection Title */}
        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="text-6xl sm:text-7xl md:text-9xl font-black uppercase tracking-tight text-white leading-none mb-6 drop-shadow-2xl font-serif"
        >
          {collection.title}
        </motion.h1>

        {/* Editorial Description & Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.55, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-8 max-w-2xl"
          >
            <p className="text-lg md:text-2xl text-zinc-300 font-light leading-relaxed tracking-wide italic font-serif">
              "{collection.description}"
            </p>
          </motion.div>

          {(collection.location || collection.date) && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, delay: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="lg:col-span-4 flex flex-wrap lg:justify-end gap-6 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400 font-mono"
            >
              {collection.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{collection.location}</span>
                </div>
              )}
              {collection.date && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                  <span>{collection.date}</span>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Animated Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 cursor-pointer"
        onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
      >
        <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-400">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center backdrop-blur-md bg-black/30"
        >
          <ChevronDown className="w-4 h-4 text-white/80" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default CollectionHero;
