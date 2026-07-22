import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { getCollections, type GalleryCollection } from '../../services/gallery';

interface CollectionFooterNavigationProps {
  currentSlug: string;
}

export const CollectionFooterNavigation: React.FC<CollectionFooterNavigationProps> = ({ currentSlug }) => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<GalleryCollection[]>([]);

  useEffect(() => {
    getCollections()
      .then((data) => setCollections(data || []))
      .catch((err) => console.error('Failed to load collections for footer navigation:', err));
  }, []);

  if (!collections || collections.length === 0) return null;

  const currentIndex = collections.findIndex(
    (c) => c.slug.toLowerCase() === currentSlug.toLowerCase()
  );

  const safeCurrentIndex = currentIndex >= 0 ? currentIndex : 0;
  const prevIndex = (safeCurrentIndex - 1 + collections.length) % collections.length;
  const nextIndex = (safeCurrentIndex + 1) % collections.length;

  const prevCollection = collections[prevIndex];
  const nextCollection = collections[nextIndex];

  if (!prevCollection || !nextCollection || collections.length < 2) return null;

  const handleNavigate = (slug: string) => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    navigate(`/collections/${slug}`);
  };

  return (
    <section className="relative w-full py-20 px-6 md:px-16 bg-black border-t border-white/10 select-none">
      <div className="max-w-[1800px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* Previous Collection Link */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          onClick={() => handleNavigate(prevCollection.slug)}
          className="group relative p-8 md:p-12 rounded-[2.5rem] bg-zinc-950/60 border border-white/10 hover:border-white/30 transition-all duration-500 cursor-pointer backdrop-blur-md flex flex-col justify-between"
        >
          <div className="flex items-center gap-3 text-zinc-500 group-hover:text-white transition-colors mb-6">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-2 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] font-mono">Previous Collection</span>
          </div>

          <div>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-600 block mb-2">
              {prevCollection.category}
            </span>
            <h4 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-white group-hover:text-blue-400 transition-colors font-serif">
              {prevCollection.title}
            </h4>
          </div>
        </motion.div>

        {/* Next Collection Link */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          onClick={() => handleNavigate(nextCollection.slug)}
          className="group relative p-8 md:p-12 rounded-[2.5rem] bg-zinc-950/60 border border-white/10 hover:border-white/30 transition-all duration-500 cursor-pointer backdrop-blur-md flex flex-col justify-between text-right"
        >
          <div className="flex items-center justify-end gap-3 text-zinc-500 group-hover:text-white transition-colors mb-6">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] font-mono">Next Collection</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
          </div>

          <div>
            <span className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-600 block mb-2">
              {nextCollection.category}
            </span>
            <h4 className="text-2xl md:text-4xl font-black uppercase tracking-tight text-white group-hover:text-blue-400 transition-colors font-serif">
              {nextCollection.title}
            </h4>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CollectionFooterNavigation;
