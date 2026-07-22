import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { CollectionPhoto } from '../../types/galleryTypes';

interface LightboxProps {
  photos: CollectionPhoto[];
  initialIndex: number;
  collectionTitle?: string;
  onClose: () => void;
}

export const Lightbox: React.FC<LightboxProps> = ({
  photos,
  initialIndex,
  collectionTitle,
  onClose,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const filmstripRef = useRef<HTMLDivElement>(null);

  const totalPhotos = photos.length;
  const currentPhoto = photos[currentIndex];

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % totalPhotos);
  }, [totalPhotos]);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + totalPhotos) % totalPhotos);
  }, [totalPhotos]);

  // Lock body scroll on mount
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Preload adjacent images
  useEffect(() => {
    if (!photos || photos.length === 0) return;
    const nextIdx = (currentIndex + 1) % totalPhotos;
    const prevIdx = (currentIndex - 1 + totalPhotos) % totalPhotos;
    
    const imgNext = new Image();
    imgNext.src = photos[nextIdx].url;
    
    const imgPrev = new Image();
    imgPrev.src = photos[prevIdx].url;
  }, [currentIndex, photos, totalPhotos]);

  // Keyboard Navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, onClose]);

  // Auto-scroll filmstrip to active thumbnail
  useEffect(() => {
    if (filmstripRef.current) {
      const activeThumb = filmstripRef.current.children[currentIndex] as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentIndex]);

  // Mobile Touch Swipe Detection
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  if (!currentPhoto) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="fixed inset-0 z-[100] flex flex-col justify-between bg-black/95 backdrop-blur-2xl text-white select-none overflow-hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Image Viewer"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* Backdrop click listener */}
        <div
          className="absolute inset-0 z-0"
          onClick={onClose}
          aria-hidden="true"
        />

        {/* Top Header Bar */}
        <div className="relative z-20 flex items-center justify-between px-6 md:px-12 py-6 border-b border-white/10 bg-gradient-to-b from-black/80 to-transparent">
          {/* Left: Collection Title & Photo Info */}
          <div className="flex items-center gap-4">
            {collectionTitle && (
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300 font-serif">
                {collectionTitle}
              </span>
            )}
            {currentPhoto.title && (
              <span className="hidden sm:inline text-[9px] font-mono uppercase tracking-[0.2em] text-zinc-500 border-l border-white/10 pl-4">
                {currentPhoto.title}
              </span>
            )}
          </div>

          {/* Right: Counter & Close Button */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 text-xs font-bold font-mono tracking-widest text-zinc-400">
              <motion.span
                key={currentIndex}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="text-white font-mono"
              >
                {currentIndex + 1}
              </motion.span>
              <span>/</span>
              <span>{totalPhotos}</span>
            </div>

            <button
              onClick={onClose}
              className="group flex items-center gap-2 p-2.5 rounded-full bg-white/5 border border-white/10 hover:border-white/30 hover:bg-white text-white hover:text-black transition-all duration-300 backdrop-blur-md cursor-pointer"
              aria-label="Close image viewer"
            >
              <X className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
            </button>
          </div>
        </div>

        {/* Main Image Container */}
        <div className="relative z-10 flex-1 flex items-center justify-center p-4 md:p-8">
          {/* Floating Left Navigation Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="absolute left-4 md:left-8 z-30 p-3 md:p-4 rounded-full bg-black/60 border border-white/15 hover:border-white/40 hover:bg-white text-white hover:text-black backdrop-blur-md transition-all duration-300 cursor-pointer shadow-2xl active:scale-95"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6 md:w-8 md:h-8" />
          </button>

          {/* Main Displayed Image with AnimatePresence scale & fade */}
          <div
            className="relative max-w-[90vw] max-h-[75vh] flex items-center justify-center overflow-hidden rounded-[1.5rem] md:rounded-[2rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.9)]"
            onClick={(e) => e.stopPropagation()}
          >
            <AnimatePresence mode="wait">
              <motion.img
                key={currentIndex}
                src={currentPhoto.url}
                alt={currentPhoto.title || `Photo ${currentIndex + 1}`}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-[90vw] max-h-[75vh] object-contain select-none rounded-[1.5rem] md:rounded-[2rem]"
              />
            </AnimatePresence>
          </div>

          {/* Floating Right Navigation Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="absolute right-4 md:right-8 z-30 p-3 md:p-4 rounded-full bg-black/60 border border-white/15 hover:border-white/40 hover:bg-white text-white hover:text-black backdrop-blur-md transition-all duration-300 cursor-pointer shadow-2xl active:scale-95"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6 md:w-8 md:h-8" />
          </button>
        </div>

        {/* Bottom Filmstrip Thumbnail Navigation */}
        <div className="relative z-20 px-6 py-4 border-t border-white/10 bg-gradient-to-t from-black/90 to-transparent">
          <div
            ref={filmstripRef}
            className="flex items-center justify-center gap-3 overflow-x-auto py-2 no-scrollbar scroll-smooth max-w-5xl mx-auto"
          >
            {photos.map((photo, idx) => {
              const isActive = idx === currentIndex;
              return (
                <button
                  key={photo.id || idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentIndex(idx);
                  }}
                  className={`relative flex-shrink-0 w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden border-2 transition-all duration-300 cursor-pointer ${
                    isActive
                      ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.4)] opacity-100'
                      : 'border-white/10 hover:border-white/40 opacity-50 hover:opacity-80'
                  }`}
                  aria-label={`Jump to image ${idx + 1}`}
                >
                  <img
                    src={photo.url}
                    alt={photo.title || `Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover grayscale opacity-90"
                  />
                  {isActive && (
                    <div className="absolute inset-0 border-2 border-white rounded-xl pointer-events-none" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Lightbox;
