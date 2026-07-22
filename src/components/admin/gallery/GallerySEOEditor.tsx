import React from 'react';
import { Search, Globe } from 'lucide-react';

interface GallerySEOEditorProps {
  seoTitle: string;
  seoDescription: string;
  onChangeTitle: (val: string) => void;
  onChangeDescription: (val: string) => void;
  titleFallback?: string;
  descriptionFallback?: string;
}

export const GallerySEOEditor: React.FC<GallerySEOEditorProps> = ({
  seoTitle,
  seoDescription,
  onChangeTitle,
  onChangeDescription,
  titleFallback = 'Collection Title',
  descriptionFallback = 'Collection Description snippet preview on search engines.',
}) => {
  const displayTitle = seoTitle || titleFallback;
  const displayDesc = seoDescription || descriptionFallback;

  return (
    <div className="w-full glass-panel rounded-3xl border border-white/10 p-6 md:p-8 space-y-6">
      <div className="flex items-center gap-3">
        <Globe className="w-5 h-5 text-blue-400" />
        <h3 className="text-xl font-black uppercase tracking-tight text-white">SEO & Search Optimization</h3>
      </div>

      {/* Snippet Preview */}
      <div className="p-6 rounded-2xl bg-zinc-950/80 border border-white/10 space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-2">
          <Search className="w-3 h-3" /> Search Engine Result Snippet Preview
        </p>
        <h4 className="text-lg font-bold text-blue-400 hover:underline cursor-pointer truncate">
          {displayTitle} | Artisans Co.
        </h4>
        <p className="text-xs text-emerald-400 font-mono truncate">
          https://artisans.co/collections/{titleFallback.toLowerCase().replace(/[^a-z0-9]+/g, '-')}
        </p>
        <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
          {displayDesc}
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
            SEO Title
          </label>
          <input
            type="text"
            value={seoTitle}
            onChange={(e) => onChangeTitle(e.target.value)}
            placeholder={titleFallback}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
            SEO Meta Description
          </label>
          <textarea
            rows={3}
            value={seoDescription}
            onChange={(e) => onChangeDescription(e.target.value)}
            placeholder={descriptionFallback}
            className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 transition-colors resize-none"
          />
        </div>
      </div>
    </div>
  );
};

export default GallerySEOEditor;
