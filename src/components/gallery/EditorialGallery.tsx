import React from 'react';
import { motion } from 'framer-motion';
import GalleryImage from './GalleryImage';
import type { CollectionPhoto } from '../../types/galleryTypes';

interface EditorialGalleryProps {
  photos: CollectionPhoto[];
  onImageClick?: (index: number) => void;
}

export const EditorialGallery: React.FC<EditorialGalleryProps> = ({ photos, onImageClick }) => {
  if (!photos || photos.length === 0) return null;

  // Split photos into 3 asymmetric masonry columns for desktop, 2 for tablet
  const col1: { photo: CollectionPhoto; originalIndex: number }[] = [];
  const col2: { photo: CollectionPhoto; originalIndex: number }[] = [];
  const col3: { photo: CollectionPhoto; originalIndex: number }[] = [];

  photos.forEach((photo, idx) => {
    const mod = idx % 3;
    if (mod === 0) col1.push({ photo, originalIndex: idx });
    else if (mod === 1) col2.push({ photo, originalIndex: idx });
    else col3.push({ photo, originalIndex: idx });
  });

  return (
    <section className="relative w-full py-24 md:py-40 px-6 sm:px-10 lg:px-16 max-w-[1920px] mx-auto bg-black overflow-hidden">
      {/* Editorial Header Badge */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="mb-16 md:mb-24 flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/10 pb-8"
      >
        <div>
          <span className="text-[9px] font-black uppercase tracking-[0.35em] text-zinc-500 block mb-2 font-mono">
            Editorial Portfolio Spread
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white font-serif">
            Curated Selection
          </h2>
        </div>
        <p className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">
          {photos.length} Photographs Documented
        </p>
      </motion.div>

      {/* Responsive Masonry Layout */}

      {/* Desktop (3 Asymmetric Masonry Columns with Generous Whitespace) */}
      <div className="hidden lg:grid lg:grid-cols-3 gap-10 xl:gap-14 items-start">
        {/* Column 1 */}
        <div className="flex flex-col gap-10 xl:gap-14">
          {col1.map(({ photo, originalIndex }, i) => (
            <GalleryImage
              key={photo.id || originalIndex}
              photo={photo}
              index={i}
              onClick={() => onImageClick?.(originalIndex)}
            />
          ))}
        </div>

        {/* Column 2 (Offset downward for staggered magazine look) */}
        <div className="flex flex-col gap-10 xl:gap-14 pt-16 md:pt-24">
          {col2.map(({ photo, originalIndex }, i) => (
            <GalleryImage
              key={photo.id || originalIndex}
              photo={photo}
              index={i}
              onClick={() => onImageClick?.(originalIndex)}
            />
          ))}
        </div>

        {/* Column 3 */}
        <div className="flex flex-col gap-10 xl:gap-14 pt-8 md:pt-12">
          {col3.map(({ photo, originalIndex }, i) => (
            <GalleryImage
              key={photo.id || originalIndex}
              photo={photo}
              index={i}
              onClick={() => onImageClick?.(originalIndex)}
            />
          ))}
        </div>
      </div>

      {/* Tablet (2 Columns) */}
      <div className="hidden sm:grid lg:hidden grid-cols-2 gap-8 items-start">
        <div className="flex flex-col gap-8">
          {photos
            .filter((_, idx) => idx % 2 === 0)
            .map((photo, i) => {
              const originalIdx = i * 2;
              return (
                <GalleryImage
                  key={photo.id || originalIdx}
                  photo={photo}
                  index={i}
                  onClick={() => onImageClick?.(originalIdx)}
                />
              );
            })}
        </div>
        <div className="flex flex-col gap-8 pt-12">
          {photos
            .filter((_, idx) => idx % 2 === 1)
            .map((photo, i) => {
              const originalIdx = i * 2 + 1;
              return (
                <GalleryImage
                  key={photo.id || originalIdx}
                  photo={photo}
                  index={i}
                  onClick={() => onImageClick?.(originalIdx)}
                />
              );
            })}
        </div>
      </div>

      {/* Mobile (Single Column, Full Width) */}
      <div className="flex sm:hidden flex-col gap-8">
        {photos.map((photo, idx) => (
          <GalleryImage
            key={photo.id || idx}
            photo={photo}
            index={idx}
            onClick={() => onImageClick?.(idx)}
          />
        ))}
      </div>
    </section>
  );
};

export default EditorialGallery;
