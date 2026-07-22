import React, { useState } from 'react';
import { Trash2, Edit2, Image as ImageIcon, ArrowUp, ArrowDown, Save, X } from 'lucide-react';
import { type GalleryImage, deleteImage, updateImage, reorderImages } from '../../../services/gallery';

interface GalleryImageGridProps {
  collectionId: string;
  images: GalleryImage[];
  heroImage?: string | null;
  coverImage?: string | null;
  onSetHeroImage: (url: string) => void;
  onSetCoverImage: (url: string) => void;
  onImagesChanged: () => void;
}

export const GalleryImageGrid: React.FC<GalleryImageGridProps> = ({
  images,
  heroImage,
  coverImage,
  onSetHeroImage,
  onSetCoverImage,
  onImagesChanged,
}) => {
  const [editingImage, setEditingImage] = useState<GalleryImage | null>(null);
  const [caption, setCaption] = useState('');
  const [altText, setAltText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isReordering, setIsReordering] = useState(false);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this image?')) return;
    try {
      await deleteImage(id);
      onImagesChanged();
    } catch (err: any) {
      alert(err.message || 'Failed to delete image.');
    }
  };

  const handleOpenEdit = (img: GalleryImage) => {
    setEditingImage(img);
    setCaption(img.caption || '');
    setAltText(img.altText || '');
  };

  const handleSaveMetadata = async () => {
    if (!editingImage) return;
    setIsSaving(true);
    try {
      await updateImage(editingImage.id, {
        caption,
        altText,
      });
      setEditingImage(null);
      onImagesChanged();
    } catch (err: any) {
      alert(err.message || 'Failed to update image metadata.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMove = async (currentIndex: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;

    const newImages = [...images];
    const temp = newImages[currentIndex];
    newImages[currentIndex] = newImages[targetIndex];
    newImages[targetIndex] = temp;

    const reorderedItems = newImages.map((img, idx) => ({
      id: img.id,
      displayOrder: idx + 1,
    }));

    setIsReordering(true);
    try {
      await reorderImages(reorderedItems);
      onImagesChanged();
    } catch (err: any) {
      console.error('Failed to reorder images:', err);
    } finally {
      setIsReordering(false);
    }
  };

  if (!images || images.length === 0) {
    return (
      <div className="w-full py-16 text-center glass-panel rounded-3xl border border-white/10 p-8 space-y-3">
        <ImageIcon className="w-12 h-12 text-zinc-600 mx-auto animate-pulse" />
        <h4 className="text-lg font-bold uppercase tracking-tight text-white/80">No Gallery Images Yet</h4>
        <p className="text-xs text-zinc-500 uppercase tracking-wider">
          Upload images using the uploader above to populate this collection.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full glass-panel rounded-3xl border border-white/10 p-6 md:p-8 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-xl font-black uppercase tracking-tight text-white">Gallery Images ({images.length})</h3>
          <p className="text-zinc-400 text-xs font-medium mt-1">
            Manage image captions, order, hero, and cover image selections.
          </p>
        </div>
        {isReordering && (
          <span className="text-xs text-blue-400 font-bold uppercase tracking-widest animate-pulse">
            Saving display order...
          </span>
        )}
      </div>

      {/* Images Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {images.map((img, index) => {
          const isHero = heroImage === img.imageUrl;
          const isCover = coverImage === img.imageUrl;

          return (
            <div
              key={img.id}
              className="group relative rounded-2xl overflow-hidden bg-zinc-950 border border-white/10 hover:border-white/30 transition-all duration-300 flex flex-col justify-between"
            >
              {/* Image Preview Container */}
              <div className="relative aspect-square w-full overflow-hidden bg-black">
                <img
                  src={img.imageUrl}
                  alt={img.altText || img.caption || 'Gallery Image'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />

                {/* Badges */}
                <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
                  {isHero && (
                    <span className="px-2.5 py-1 rounded-md bg-amber-500 text-black text-[9px] font-black uppercase tracking-widest shadow-lg">
                      Hero Image
                    </span>
                  )}
                  {isCover && (
                    <span className="px-2.5 py-1 rounded-md bg-blue-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg">
                      Cover Image
                    </span>
                  )}
                </div>

                {/* Top Right Quick Actions */}
                <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                  <button
                    onClick={() => handleOpenEdit(img)}
                    title="Edit Metadata"
                    className="p-2 rounded-lg bg-black/70 backdrop-blur-md border border-white/20 text-white hover:bg-white hover:text-black transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(img.id)}
                    title="Delete Image"
                    className="p-2 rounded-lg bg-black/70 backdrop-blur-md border border-white/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Move Order Controls Overlay */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10">
                  <button
                    disabled={index === 0}
                    onClick={() => handleMove(index, 'up')}
                    title="Move Up"
                    className="p-1.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/20 text-white disabled:opacity-30 hover:bg-white hover:text-black transition-colors"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    disabled={index === images.length - 1}
                    onClick={() => handleMove(index, 'down')}
                    title="Move Down"
                    className="p-1.5 rounded-lg bg-black/70 backdrop-blur-md border border-white/20 text-white disabled:opacity-30 hover:bg-white hover:text-black transition-colors"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Card Footer Details */}
              <div className="p-4 space-y-3 bg-zinc-900/60 border-t border-white/5">
                <p className="text-xs font-bold text-white truncate">
                  {img.caption || <span className="text-zinc-500 italic">No caption set</span>}
                </p>

                {/* Hero / Cover Set Buttons */}
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => onSetHeroImage(img.imageUrl)}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                      isHero
                        ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                        : 'bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {isHero ? 'Hero Set' : 'Set Hero'}
                  </button>
                  <button
                    onClick={() => onSetCoverImage(img.imageUrl)}
                    className={`flex-1 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                      isCover
                        ? 'bg-blue-500/20 border border-blue-500/50 text-blue-300'
                        : 'bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {isCover ? 'Cover Set' : 'Set Cover'}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit Image Modal */}
      {editingImage && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md glass-panel rounded-3xl border border-white/20 p-6 md:p-8 space-y-6 animate-ios-slide-up">
            <div className="flex justify-between items-center">
              <h4 className="text-lg font-black uppercase tracking-tight text-white">Edit Image Details</h4>
              <button onClick={() => setEditingImage(null)} className="text-zinc-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-white/10">
              <img src={editingImage.imageUrl} alt="Edit preview" className="w-full h-full object-cover" />
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Caption / Title
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Enter photo caption..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Alt Text (Accessibility & SEO)
                </label>
                <input
                  type="text"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Enter alt text..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setEditingImage(null)}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>
              <button
                disabled={isSaving}
                onClick={handleSaveMetadata}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-white text-black text-xs font-black uppercase tracking-widest hover:bg-zinc-200"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving...' : 'Save Metadata'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GalleryImageGrid;
