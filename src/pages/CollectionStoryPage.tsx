import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Camera, Compass } from 'lucide-react';
import { getCollection, type PublicCollectionDetail } from '../services/gallery';
import { updateSEOMetadata } from '../utils/seo';

// Helper to determine if media is video
const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  return url.toLowerCase().match(/\.(mp4|webm|ogg|mov)(\?|$)/i) !== null;
};

export const CollectionStoryPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [detail, setDetail] = useState<PublicCollectionDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchDetail = async () => {
      if (!slug) return;
      try {
        setLoading(true);
        setError('');
        const data = await getCollection(slug);
        setDetail(data);

        if (data && data.collection) {
          updateSEOMetadata(
            `${data.collection.title} Story | Artisans Co.`,
            data.collection.description || `Explore ${data.collection.title} collection story.`,
            data.collection.heroImage || data.collection.coverImage || ''
          );
        }
      } catch (err: any) {
        console.error('Failed to load collection story:', err);
        setError('The story collection could not be retrieved.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [slug]);

  const handleBack = () => {
    navigate('/curated-gallery');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col justify-center items-center p-8 font-sans">
        <div className="w-8 h-8 rounded-full border-2 border-[#C9A45D]/20 border-t-[#C9A45D] animate-spin mb-4" />
        <p className="text-xs font-mono uppercase tracking-[0.25em] text-zinc-500">Unveiling Story...</p>
      </div>
    );
  }

  if (error || !detail || !detail.collection) {
    return (
      <div className="min-h-screen bg-[#0B0B0B] text-white flex flex-col justify-center items-center p-8 text-center font-sans">
        <Compass className="w-12 h-12 text-[#C9A45D]/30 mb-6 animate-pulse" />
        <h2 className="text-3xl font-serif uppercase tracking-wider mb-4">Collection Not Found</h2>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest max-w-sm leading-relaxed mb-8">
          {error || 'The collection story you are looking for does not exist or has been archived.'}
        </p>
        <button
          onClick={handleBack}
          className="flex items-center gap-3 px-8 py-3 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Curated Gallery</span>
        </button>
      </div>
    );
  }

  const { collection } = detail;
  const coverImg = collection.heroImage || collection.coverImage || '';
  const mediaItems = collection.images || [];
  const photoCount = mediaItems.length;

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white selection:bg-[#C9A45D] selection:text-black relative overflow-x-hidden font-sans pb-10">
      {/* Matte Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none bg-noise z-0 opacity-40" />

      {/* 1. Large Hero Cover Image (Luxury Magazine Vibe) */}
      <section className="relative w-full h-[90vh] flex flex-col justify-between overflow-hidden border-b border-white/5">
        {/* Background Image */}
        <div className="absolute inset-0 bg-[#0c0c0e]">
          {coverImg && (
            <motion.img
              initial={{ scale: 1.08, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.6 }}
              transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
              src={coverImg}
              alt={collection.title}
              className="w-full h-full object-cover grayscale"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-black/20" />
        </div>

        {/* Floating Return Button */}
        <div className="relative z-20 px-6 pt-8 max-w-4xl w-full mx-auto flex justify-between items-center">
          <button
            onClick={handleBack}
            className="group flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-black/60 border border-white/10 hover:border-white/20 hover:bg-black/80 active:scale-95 transition-all duration-300 backdrop-blur-md cursor-pointer text-white"
            aria-label="Back to curated gallery"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.25em]">Return</span>
          </button>
          
          <div onClick={() => navigate('/')} className="w-8 h-8 bg-white text-black flex items-center justify-center font-serif font-black text-sm rounded-xl cursor-pointer">
            A
          </div>
        </div>

        {/* Hero Title & Info Section */}
        <div className="relative z-20 px-6 pb-12 max-w-3xl w-full mx-auto flex flex-col justify-end items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col items-center"
          >
            {/* Category badge & photo count */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[9px] font-black tracking-[0.25em] uppercase text-[#C9A45D] border border-[#C9A45D]/25 bg-black/40 px-3.5 py-1 rounded-full backdrop-blur-md">
                {collection.category || 'Portfolio'}
              </span>
              {photoCount > 0 && (
                <span className="text-[9px] font-mono tracking-[0.15em] text-zinc-400">
                  {photoCount} PHOTOS
                </span>
              )}
            </div>

            {/* Collection Title */}
            <h1 className="text-4xl md:text-5xl font-normal uppercase tracking-wide font-serif text-white mb-6 leading-tight max-w-xl">
              {collection.title}
            </h1>

            {/* Editorial quote using description */}
            {collection.description && (
              <p className="text-zinc-300 font-serif italic text-sm md:text-base tracking-wider max-w-lg leading-relaxed relative px-4">
                "{collection.description}"
              </p>
            )}
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 opacity-80 animate-pulse">
          <span className="text-[8px] font-black tracking-[0.3em] uppercase text-zinc-500">Scroll</span>
          <div className="w-[1px] h-8 bg-gradient-to-b from-[#C9A45D] to-transparent" />
        </div>
      </section>

      {/* 2. Scrollable Media Spread (Alternating luxury layout) */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 mt-16 space-y-16">
        {photoCount === 0 ? (
          <div className="text-center py-20 border border-white/5 bg-white/5 rounded-[2rem] p-8">
            <Camera className="w-8 h-8 text-zinc-600 mx-auto mb-4 animate-pulse" />
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">The story gallery is currently empty.</p>
          </div>
        ) : (
          mediaItems.map((item, idx) => {
            const isVideo = isVideoUrl(item.imageUrl) || item.isFeatured === undefined; // fallback checks
            const caption = item.caption || item.altText;

            // Define alternating layouts
            let containerClass = "w-full flex flex-col items-center py-4";
            let mediaWrapperClass = "w-full overflow-hidden rounded-[2rem] border border-white/5 shadow-2xl relative bg-[#121212]";

            if (idx % 3 === 0) {
              // Full-width Landscape Layout
              containerClass = "w-full py-6";
              mediaWrapperClass = "w-full aspect-[16/10] overflow-hidden rounded-[2rem] border border-white/5 shadow-2xl relative bg-[#121212]";
            } else if (idx % 3 === 1) {
              // Centered Portrait Layout with wide margins
              containerClass = "w-full py-8 flex justify-center";
              mediaWrapperClass = "w-[85%] aspect-[3/4] overflow-hidden rounded-[2rem] border border-white/5 shadow-2xl relative bg-[#121212]";
            } else {
              // Offset layout based on index odd/even
              const isLeft = idx % 2 === 0;
              containerClass = `w-full py-6 flex ${isLeft ? 'justify-start' : 'justify-end'}`;
              mediaWrapperClass = "w-[90%] aspect-[4/3] overflow-hidden rounded-[2rem] border border-white/5 shadow-2xl relative bg-[#121212]";
            }

            return (
              <motion.div
                key={item.id || idx}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] as any }}
                className={containerClass}
              >
                <div className={mediaWrapperClass}>
                  {isVideo ? (
                    <video
                      src={item.imageUrl}
                      controls
                      playsInline
                      muted
                      loop
                      preload="metadata"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      src={item.imageUrl}
                      alt={caption || `${collection.title} - Story Frame`}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-[2.5s] hover:scale-105"
                    />
                  )}
                  {caption && (
                    <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent pt-12">
                      <p className="text-[9px] uppercase tracking-widest text-zinc-300 font-sans font-semibold">
                        {caption}
                      </p>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })
        )}
      </section>

      {/* 3. Bottom Exhibition CTA (Focusing on selected collection in 3D) */}
      <section className="relative z-10 max-w-xl mx-auto px-6 mt-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center py-16 border-t border-white/5 rounded-t-[2rem]"
        >
          <span className="text-[9px] font-black uppercase tracking-[0.3em] text-[#C9A45D] mb-3 block">
            Immersive 3D Space
          </span>
          <h4 className="text-xl md:text-2xl font-normal font-serif text-white mb-4 uppercase tracking-wide">
            Experience the Exhibition
          </h4>
          <p className="text-zinc-500 text-[11px] font-serif max-w-sm mx-auto mb-8 leading-relaxed italic">
            Enter the virtual gallery hall to view "{collection.title}" inside our three-dimensional cinematic exhibition space.
          </p>
          
          <button
            onClick={() => navigate(`/portfolio/${collection.slug}`)}
            className="inline-flex items-center justify-center px-9 py-3.5 border border-[#C9A45D]/40 text-[#C9A45D] hover:text-black hover:bg-[#C9A45D] active:scale-95 transition-all duration-300 rounded-full font-sans text-[10px] font-bold uppercase tracking-[0.25em] shadow-[0_0_20px_rgba(201,164,93,0.05)] hover:shadow-[0_0_30px_rgba(201,164,93,0.2)] cursor-pointer"
          >
            Enter Artisans Noir
          </button>
        </motion.div>
      </section>
    </div>
  );
};

export default CollectionStoryPage;
