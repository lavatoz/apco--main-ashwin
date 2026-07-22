import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Sparkles, AlertCircle } from 'lucide-react';
import {
  type GalleryCollection,
  getAdminCollection,
  createCollection,
  updateCollection,
  publishCollection,
  unpublishCollection,
} from '../../../services/gallery';
import GalleryImageUploader from './GalleryImageUploader';
import GalleryImageGrid from './GalleryImageGrid';
import GallerySEOEditor from './GallerySEOEditor';
import GalleryPreview from './GalleryPreview';

export const GalleryEditorPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState('Weddings');
  const [description, setDescription] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [isPublished, setIsPublished] = useState(false);
  const [heroImage, setHeroImage] = useState<string>('');
  const [coverImage, setCoverImage] = useState<string>('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [collection, setCollection] = useState<GalleryCollection | null>(null);

  const fetchCollectionDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getAdminCollection(id);
      setCollection(data);
      setTitle(data.title);
      setSlug(data.slug);
      setCategory(data.category);
      setDescription(data.description || '');
      setDisplayOrder(data.displayOrder || 0);
      setIsPublished(data.isPublished);
      setHeroImage(data.heroImage || '');
      setCoverImage(data.coverImage || '');
      setSeoTitle(data.seoTitle || '');
      setSeoDescription(data.seoDescription || '');
    } catch (err: any) {
      console.error('Failed to load collection:', err);
      setError(err.message || 'Failed to load gallery collection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isEditMode) {
      fetchCollectionDetails();
    }
  }, [id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !category.trim()) {
      setError('Title and Category are required.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const payload = {
        title,
        slug: slug || undefined,
        category,
        description,
        displayOrder: Number(displayOrder) || 0,
        isPublished,
        heroImage: heroImage || undefined,
        coverImage: coverImage || undefined,
        seoTitle,
        seoDescription,
      };

      if (isEditMode && id) {
        await updateCollection(id, payload);
      } else {
        const created = await createCollection(payload);
        navigate(`/ecosystem/gallery/${created.id}/edit`, { replace: true });
      }
      alert(`Collection ${isEditMode ? 'updated' : 'created'} successfully!`);
      if (isEditMode) fetchCollectionDetails();
    } catch (err: any) {
      console.error('Failed to save collection:', err);
      setError(err.message || 'Failed to save collection.');
    } finally {
      setSaving(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!id) return;
    try {
      if (isPublished) {
        await unpublishCollection(id);
        setIsPublished(false);
      } else {
        await publishCollection(id);
        setIsPublished(true);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to change publish status.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white p-8 flex justify-center items-center">
        <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 space-y-10">
      {/* Header Bar */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-white/10">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/ecosystem/gallery')}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-white">
              {isEditMode ? `Edit: ${title}` : 'Create New Collection'}
            </h1>
            <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">
              Website Gallery Management System
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isEditMode && slug && <GalleryPreview slug={slug} isPublished={isPublished} />}

          {isEditMode && (
            <button
              onClick={handleTogglePublish}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all ${
                isPublished
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 hover:bg-emerald-500/30'
                  : 'bg-amber-500/20 border-amber-500/50 text-amber-300 hover:bg-amber-500/30'
              }`}
            >
              {isPublished ? 'Published (Click to Unpublish)' : 'Draft (Click to Publish)'}
            </button>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-8 py-3 bg-white text-black text-xs font-black uppercase tracking-widest rounded-xl hover:bg-zinc-200 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Collection'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="max-w-7xl mx-auto p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold uppercase tracking-wider flex items-center gap-3">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Content Form */}
      <form onSubmit={handleSave} className="max-w-7xl mx-auto space-y-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left 2 Columns: Core Information */}
          <div className="lg:col-span-2 glass-panel rounded-3xl border border-white/10 p-6 md:p-8 space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tight text-white">General Information</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Royal Wedding at Udaipur"
                  required
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30"
                  >
                    <option value="Weddings">Weddings</option>
                    <option value="Pre-Weddings">Pre-Weddings</option>
                    <option value="Portraits">Portraits</option>
                    <option value="Newborn & Baby">Newborn & Baby</option>
                    <option value="Events">Events</option>
                    <option value="Commercial">Commercial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                    Slug (Auto-generated if empty)
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="royal-wedding-udaipur"
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 font-mono text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter editorial collection description..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30 resize-none"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Settings & Publishing */}
          <div className="glass-panel rounded-3xl border border-white/10 p-6 md:p-8 space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tight text-white">Display & Status</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-400 mb-2">
                  Display Order
                </label>
                <input
                  type="number"
                  min={0}
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(Number(e.target.value))}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-white/30"
                />
              </div>

              <div className="pt-4 border-t border-white/10">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="w-5 h-5 rounded border-white/20 text-white focus:ring-0 bg-black"
                  />
                  <span className="text-sm font-bold text-white uppercase tracking-wider">
                    Publish to Public Website
                  </span>
                </label>
              </div>

              {heroImage && (
                <div className="pt-4 space-y-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">Current Hero Image</p>
                  <img src={heroImage} alt="Hero" className="w-full h-32 object-cover rounded-xl border border-white/10" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SEO Section */}
        <GallerySEOEditor
          seoTitle={seoTitle}
          seoDescription={seoDescription}
          onChangeTitle={setSeoTitle}
          onChangeDescription={setSeoDescription}
          titleFallback={title || 'Collection Title'}
          descriptionFallback={description || 'Collection Description'}
        />

        {/* Image Upload & Manager Section (Enabled in Edit Mode) */}
        {isEditMode && id ? (
          <>
            <GalleryImageUploader
              collectionId={id}
              onUploadSuccess={fetchCollectionDetails}
            />

            <GalleryImageGrid
              collectionId={id}
              images={collection?.images || []}
              heroImage={heroImage}
              coverImage={coverImage}
              onSetHeroImage={(url) => setHeroImage(url)}
              onSetCoverImage={(url) => setCoverImage(url)}
              onImagesChanged={fetchCollectionDetails}
            />
          </>
        ) : (
          <div className="p-8 rounded-3xl glass-panel border border-white/10 text-center space-y-2">
            <Sparkles className="w-8 h-8 text-zinc-600 mx-auto animate-pulse" />
            <h4 className="text-lg font-bold text-white uppercase tracking-tight">Save Collection First</h4>
            <p className="text-xs text-zinc-500 uppercase tracking-widest">
              Save general collection details to unlock Google Drive image uploading and grid management.
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

export default GalleryEditorPage;
