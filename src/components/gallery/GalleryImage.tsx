import React, { useState } from 'react';
import { motion } from 'framer-motion';
import type { CollectionPhoto } from '../../types/galleryTypes';

interface GalleryImageProps {
  photo: CollectionPhoto;
  index: number;
  onClick?: () => void;
}

export const GalleryImage: React.FC<GalleryImageProps> = ({ photo, index, onClick }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Aspect ratio classes for editorial magazine variance
  let aspectClass = 'aspect-[3/4]';
  if (photo.aspectRatio === 'landscape') {
    aspectClass = 'aspect-[16/10]';
  } else if (photo.aspectRatio === 'square') {
    aspectClass = 'aspect-square';
  } else if (photo.aspectRatio === 'tall') {
    aspectClass = 'aspect-[2/3] md:aspect-[4/6]';
  } else if (photo.aspectRatio === 'portrait') {
    aspectClass = 'aspect-[3/4]';
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        duration: 0.8,
        delay: (index % 3) * 0.12,
        ease: [0.215, 0.61, 0.355, 1]
      }}
      onClick={onClick}
      className={`group relative w-full ${aspectClass} overflow-hidden rounded-[2rem] md:rounded-[2.5rem] bg-zinc-950 border border-white/10 hover:border-white/30 transition-all duration-700 cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-white/5 select-none`}
    >
      {/* Loading Skeleton */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-zinc-900 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-white/10 border-t-white/40 animate-spin" />
        </div>
      )}

      {/* Main Image */}
      <img
        src={photo.url}
        alt={photo.title || 'Artisans Collection Photograph'}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={() => {
          setIsLoaded(true);
          setHasError(true);
        }}
        className={`w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 ease-out group-hover:scale-[1.03] ${
          isLoaded ? 'opacity-80' : 'opacity-0'
        }`}
      />

      {/* Luxury Matte Dark Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-40 group-hover:opacity-85 transition-opacity duration-500" />

      {/* Subtle Caption & Title Overlay */}
      {photo.title && (
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 translate-y-3 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col gap-1">
          <span className="text-[8px] font-black uppercase tracking-[0.3em] text-zinc-400 font-mono">
            {photo.aspectRatio || 'Photograph'}
          </span>
          <h4 className="text-xl md:text-2xl font-bold uppercase tracking-tight text-white font-serif">
            {photo.title}
          </h4>
        </div>
      )}
    </motion.div>
  );
};

export default GalleryImage;
