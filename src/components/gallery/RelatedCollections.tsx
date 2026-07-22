import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Camera, ArrowRight } from 'lucide-react';
import { getCollections, type GalleryCollection } from '../../services/gallery';

interface RelatedCollectionsProps {
  currentSlug: string;
}

export const RelatedCollections: React.FC<RelatedCollectionsProps> = ({ currentSlug }) => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<GalleryCollection[]>([]);

  useEffect(() => {
    getCollections()
      .then((data) => setCollections(data || []))
      .catch((err) => console.error('Failed to load related collections:', err));
  }, []);

  // Filter out current collection and take 3
  const related = collections
    .filter((c) => c.slug.toLowerCase() !== currentSlug.toLowerCase())
    .slice(0, 3);

  if (related.length === 0) return null;

  const handleCardClick = (slug: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(`/collections/${slug}`);
  };

  return (
    <section className="relative w-full py-24 md:py-36 px-6 md:px-16 bg-black border-t border-white/10 overflow-hidden">
      <div className="max-w-[1800px] mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-16 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4"
        >
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.35em] text-zinc-500 block mb-2 font-mono">
              Curated Recommendations
            </span>
            <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white font-serif">
              You May Also Like
            </h3>
          </div>
          <span className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">
            {related.length} Selected Collections
          </span>
        </motion.div>

        {/* Preview Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {related.map((item, index) => {
            const cover = item.coverImage || item.heroImage || item.images?.[0]?.imageUrl || '';
            const count = item.images?.length || item._count?.images || 0;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                onClick={() => handleCardClick(item.slug)}
                className="group relative rounded-[2.5rem] overflow-hidden bg-zinc-950/80 border border-white/10 hover:border-white/30 transition-all duration-500 cursor-pointer backdrop-blur-md flex flex-col justify-between"
              >
                {/* Image Container */}
                <div className="relative aspect-[4/3] w-full overflow-hidden bg-black">
                  {cover ? (
                    <img
                      src={cover}
                      alt={item.title}
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700 ease-out"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs uppercase font-bold">
                      No Image
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />

                  <span className="absolute top-4 left-4 px-3.5 py-1.5 rounded-full bg-black/60 border border-white/15 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-zinc-300">
                    {item.category}
                  </span>
                </div>

                {/* Content Details */}
                <div className="p-6 md:p-8 space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="text-2xl font-black uppercase tracking-tight text-white group-hover:text-blue-400 transition-colors font-serif">
                      {item.title}
                    </h4>
                    <span className="flex items-center gap-1.5 text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-400 bg-white/5 border border-white/10 px-2.5 py-1 rounded-full whitespace-nowrap">
                      <Camera className="w-3 h-3 text-zinc-300" />
                      {count} Photos
                    </span>
                  </div>

                  <p className="text-xs text-zinc-400 font-medium line-clamp-2 leading-relaxed">
                    {item.description || 'View editorial collection highlights.'}
                  </p>

                  <div className="pt-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
                    <span>Explore Collection</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1.5 transition-transform" />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default RelatedCollections;
