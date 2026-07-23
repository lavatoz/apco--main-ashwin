import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, MapPin, Camera, User } from 'lucide-react';
import { type PublicCollectionDetail, type GalleryCollection, type GalleryImage } from '../../services/gallery';

export interface ExtendedGalleryCollection extends GalleryCollection {
  location?: string | null;
  venue?: string | null;
  date?: string | null;
  weddingDate?: string | null;
  photographer?: string | null;
  chiefArtist?: string | null;
  equipment?: string | null;
  gearUsed?: string | null;
  images?: GalleryImage[];
}

interface WeddingStoryOverlayProps {
  detail: PublicCollectionDetail | null;
  loading: boolean;
  onClose: () => void;
}

// Progressive image loader with skeleton placeholder and smooth fade-in
const EditorialImage: React.FC<{
  src: string;
  alt: string;
  isTall: boolean;
}> = ({ src, alt, isTall }) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div className={`w-full relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-950 transition-all duration-300 ${
      isTall ? 'aspect-[2/3]' : 'aspect-[3/2]'
    }`}>
      {/* Skeleton Pulse loader */}
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 animate-pulse flex items-center justify-center">
          <span className="text-[8px] font-mono text-zinc-600 uppercase tracking-[0.2em]">Loading Image...</span>
        </div>
      )}

      {/* Image element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className={`w-full h-full object-cover transition-all duration-700 ${
          loaded ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
        }`}
      />
    </div>
  );
};

// Utility to resolve image URLs against host dynamically
const getFullImageUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  try {
    const urlObj = new URL(apiUrl);
    const host = `${urlObj.protocol}//${urlObj.host}`;
    return `${host}${url.startsWith('/') ? '' : '/'}${url}`;
  } catch (e) {
    return `http://localhost:3000${url.startsWith('/') ? '' : '/'}${url}`;
  }
};

export const WeddingStoryOverlay: React.FC<WeddingStoryOverlayProps> = ({
  detail,
  loading,
  onClose
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // 1. Accessibility: Focus trapping and Escape key closing
  useEffect(() => {
    // Record current focused element to restore it on unmount
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && containerRef.current) {
        const focusableElements = containerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          // Cycle focus to last on Shift + Tab
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          // Cycle focus to first on Tab
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      // Restore focus to previously active element
      if (previousActiveElementRef.current) {
        previousActiveElementRef.current.focus();
      }
    };
  }, [onClose]);

  // 2. Accessibility: Disable background scrolling & autofocus
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    
    if (closeButtonRef.current) {
      closeButtonRef.current.focus();
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full lg:w-[42%] h-full fixed top-0 left-0 bg-[#0B0B0B]/95 backdrop-blur-xl border-r border-[#C9A45D]/10 z-40 p-8 flex flex-col justify-center items-center select-none"
      >
        <div className="w-8 h-8 rounded-full border-2 border-[#C9A45D]/20 border-t-[#C9A45D] animate-spin mb-4" />
        <p className="text-[9px] font-mono uppercase tracking-[0.25em] text-[#C9A45D]">Loading Story Details...</p>
      </motion.div>
    );
  }

  if (!detail || !detail.collection) return null;


  const collection = detail.collection as ExtendedGalleryCollection;

  // Safe checks for metadata fields
  const metadataList = [
    {
      label: 'Location',
      value: collection.location || collection.venue,
      icon: MapPin
    },
    {
      label: 'Date',
      value: collection.date || collection.weddingDate,
      icon: Calendar
    },
    {
      label: 'Photographer',
      value: collection.photographer || collection.chiefArtist || 'Artisans Co. Lead',
      icon: User
    },
    {
      label: 'Equipment',
      value: collection.equipment || collection.gearUsed || 'Leica M11 & Hasselblad H6D',
      icon: Camera
    }
  ].filter(meta => meta.value);

  const images = collection.images || [];

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ x: '-100%', opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: '-100%', opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 120 }}
        className="w-full lg:w-[42%] h-full fixed top-0 left-0 bg-[#0B0B0B]/95 backdrop-blur-xl border-r border-[#C9A45D]/10 z-40 p-8 md:p-14 overflow-y-auto exhibition-scroll font-sans select-text"
        role="dialog"
        aria-modal="true"
        aria-labelledby="story-title"
      >
        <span className="sr-only">Press Escape to return to exhibition</span>

        {/* Close Button */}
        <button
          ref={closeButtonRef}
          onClick={onClose}
          className="absolute top-8 right-8 w-10 h-10 rounded-full bg-white/5 border border-white/10 hover:border-white/20 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer group focus:outline-none focus:ring-1 focus:ring-[#C9A45D]"
          aria-label="Return to Exhibition"
        >
          <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
        </button>

        {/* Brand Curation Headers */}
        <div className="mb-14">
          <span className="text-[8px] font-black uppercase tracking-[0.35em] text-[#C9A45D] block mb-1 font-mono">
            Exhibition Collection
          </span>
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
            Artisans Co. Archive
          </p>
        </div>

        {/* Title & Category */}
        <div className="mb-10">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#C9A45D] bg-[#C9A45D]/10 px-3 py-1 rounded-full border border-[#C9A45D]/20 inline-block mb-4 font-mono">
            {collection.category}
          </span>
          <h2 id="story-title" className="text-4xl md:text-5xl font-black uppercase tracking-tight text-[#F7F7F7] font-serif-luxury leading-tight">
            {collection.title}
          </h2>
        </div>

        {/* Metadata Details Grid */}
        {metadataList.length > 0 && (
          <div className="grid grid-cols-2 gap-6 py-8 border-y border-white/5 mb-10">
            {metadataList.map((meta, i) => {
              const Icon = meta.icon;
              return (
                <div key={i} className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-[#C9A45D]" />
                  </div>
                  <div>
                    <p className="text-[8px] font-mono text-zinc-500 uppercase tracking-widest mb-1">{meta.label}</p>
                    <p className="text-xs font-bold text-[#F7F7F7] uppercase tracking-wide leading-tight">{meta.value}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Narrative Description */}
        {collection.description && (
          <div className="mb-14">
            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-[#C9A45D] mb-4 font-mono">
              The Narrative
            </h3>
            <p className="text-sm text-zinc-400 font-editorial leading-relaxed first-letter:text-3xl first-letter:font-bold first-letter:text-[#C9A45D] first-letter:mr-1.5 first-letter:float-left">
              {collection.description}
            </p>
          </div>
        )}

        {/* Dynamic Editorial Photo Layout */}
        {images.length > 0 && (
          <div className="space-y-12">
            <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-[#C9A45D] mb-6 font-mono border-b border-white/5 pb-3">
              PLATES ARCHIVE ({images.length})
            </h3>
            <div className="flex flex-col gap-10">
              {images.map((img, idx) => {
                const isTall = idx % 3 === 0;
                return (
                  <motion.div
                    key={img.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-100px' }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="group relative"
                  >
                    <EditorialImage
                      src={getFullImageUrl(img.imageUrl)}
                      alt={img.altText || img.caption || `Collection Photo ${idx + 1}`}
                      isTall={isTall}
                    />
                    {img.caption && (
                      <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-3.5 text-center">
                        PL. {idx + 1} &mdash; {img.caption.toUpperCase()}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Editorial Footer Return Option */}
        <div className="mt-20 pt-10 border-t border-white/5 text-center">
          <button
            onClick={onClose}
            className="px-8 py-3.5 rounded-full bg-[#C9A45D] text-black text-[10px] font-black uppercase tracking-[0.25em] hover:bg-white hover:scale-105 transition-all duration-300 cursor-pointer shadow-[0_0_20px_rgba(201,164,93,0.3)] focus:outline-none focus:ring-1 focus:ring-[#C9A45D]"
          >
            Return to Exhibition
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default WeddingStoryOverlay;
