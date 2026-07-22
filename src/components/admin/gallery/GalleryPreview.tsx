import React from 'react';
import { ExternalLink, Eye } from 'lucide-react';

interface GalleryPreviewProps {
  slug: string;
  isPublished?: boolean;
}

export const GalleryPreview: React.FC<GalleryPreviewProps> = ({ slug, isPublished }) => {
  const previewUrl = `/collections/${slug}`;

  const handleOpenPreview = () => {
    window.open(previewUrl, '_blank');
  };

  return (
    <button
      onClick={handleOpenPreview}
      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-black uppercase tracking-widest transition-all duration-300 shadow-sm"
    >
      <Eye className="w-4 h-4 text-blue-400" />
      <span>{isPublished ? 'Live Preview' : 'Draft Preview'}</span>
      <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
    </button>
  );
};

export default GalleryPreview;
