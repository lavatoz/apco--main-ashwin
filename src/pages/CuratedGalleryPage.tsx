import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Compass } from 'lucide-react';
import { getCollections, type GalleryCollection } from '../services/gallery';
import { updateSEOMetadata } from '../utils/seo';

export const CuratedGalleryPage: React.FC = () => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<GalleryCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    window.scrollTo(0, 0);
    updateSEOMetadata(
      'Curated Gallery | Artisans Co.',
      'A curated collection of our finest stories. Explore our luxury photography and cinematography divisions.',
      ''
    );

    const fetchCollections = async () => {
      try {
        setLoading(true);
        const data = await getCollections();
        // Only show published collections
        const published = (data || []).filter(c => c.isPublished);
        setCollections(published);
      } catch (err: any) {
        console.error('Failed to load curated collections:', err);
        setError('Unable to load our curated collections. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCollections();
  }, []);

  const handleBack = () => {
    navigate('/');
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.16, 1, 0.3, 1] as any
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0B0B] text-white selection:bg-[#C9A45D] selection:text-black relative overflow-x-hidden pb-20 font-sans">
      {/* Matte Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none bg-noise z-0 opacity-40" />

      {/* Luxury Subtle Gold Glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#C9A45D]/5 rounded-full blur-[120px] pointer-events-none z-0" />

      {/* Premium Header */}
      <header className="relative z-10 px-6 pt-8 pb-4 flex justify-between items-center max-w-4xl mx-auto">
        <button
          onClick={handleBack}
          className="group flex items-center gap-2.5 px-5 py-2.5 rounded-full bg-white/5 border border-white/10 hover:border-white/20 active:scale-95 transition-all duration-300 backdrop-blur-md cursor-pointer text-white"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-[10px] font-black uppercase tracking-[0.25em]">Return</span>
        </button>

        <div onClick={() => navigate('/')} className="flex items-center gap-2 cursor-pointer group">
          <div className="w-8 h-8 bg-white text-black flex items-center justify-center font-serif font-black text-sm rounded-xl group-hover:rotate-6 transition-transform">
            A
          </div>
          <span className="text-[9px] font-black tracking-[0.3em] uppercase text-zinc-400 group-hover:text-white transition-colors">
            Artisans Co.
          </span>
        </div>
      </header>

      {/* Hero Header */}
      <main className="relative z-10 px-6 max-w-3xl mx-auto mt-8">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="text-center mb-16"
        >
          <h1 className="solan-vesta-title" style={{ fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', letterSpacing: '-0.03em' }}>
            Curated Gallery
          </h1>
          <p className="text-zinc-500 font-serif italic text-sm md:text-base tracking-wider max-w-lg mx-auto">
            "A curated collection of our finest stories."
          </p>
        </motion.div>

        {/* Dynamic List */}
        {loading ? (
          <div className="space-y-12">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-full aspect-[4/3] rounded-[2rem] bg-white/5 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-20 border border-white/5 bg-white/5 rounded-[2rem] p-8">
            <Compass className="w-10 h-10 text-zinc-600 mx-auto mb-4 animate-pulse" />
            <p className="text-zinc-400 text-xs font-bold uppercase tracking-widest mb-6">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-white text-black rounded-full text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)]"
            >
              Retry
            </button>
          </div>
        ) : collections.length === 0 ? (
          <div className="text-center py-20 border border-white/5 bg-white/5 rounded-[2rem] p-8">
            <Compass className="w-10 h-10 text-zinc-600 mx-auto mb-4 animate-pulse" />
            <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">No published collections available.</p>
          </div>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-12 md:space-y-16"
          >
            {collections.map((item) => {
              const coverImg = item.coverImage || item.heroImage || '';
              const photoCount = item._count?.images ?? item.images?.length ?? 0;

              return (
                <motion.div
                  key={item.id}
                  variants={cardVariants}
                  onClick={() => navigate(`/curated-gallery/${item.slug}`)}
                  className="group relative w-full aspect-[4/3] rounded-[2rem] overflow-hidden border border-white/5 hover:border-white/15 cursor-pointer transition-all duration-500 active:scale-[0.98] shadow-2xl shadow-black/30"
                >
                  {/* Gray background loading box */}
                  <div className="absolute inset-0 bg-[#121212] z-0 animate-pulse" />

                  {/* Black & White Cover Image */}
                  <img
                    src={coverImg}
                    alt={item.title}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-90 group-hover:scale-105 transition-all duration-[1.5s] ease-out z-10"
                  />

                  {/* Editorial Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-700 z-20" />

                  {/* Content details overlay */}
                  <div className="absolute inset-0 p-8 flex flex-col justify-end z-30">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      {/* Small Category Badge */}
                      <span className="text-[8px] font-black tracking-[0.25em] uppercase text-[#C9A45D] bg-black/40 border border-[#C9A45D]/20 px-3 py-1 rounded-full backdrop-blur-md">
                        {item.category || 'Division'}
                      </span>
                      {/* Photo Count */}
                      {photoCount > 0 && (
                        <span className="text-[8px] font-mono tracking-[0.15em] text-zinc-400">
                          {photoCount} PHOTOS
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="solan-vesta-title mb-2" style={{ fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', letterSpacing: '-0.03em' }}>
                      {item.title}
                    </h3>

                    {/* Short Description */}
                    {item.description && (
                      <p className="text-zinc-400 text-[10px] md:text-xs font-serif italic tracking-wide max-w-md line-clamp-2 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
                        {item.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default CuratedGalleryPage;
