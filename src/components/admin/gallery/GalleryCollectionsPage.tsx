import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Trash2,
  Eye,
  CheckCircle,
  XCircle,
  Search,
  Image as ImageIcon,
  Calendar,
} from 'lucide-react';
import {
  type GalleryCollection,
  getAdminCollections,
  deleteCollection,
  publishCollection,
  unpublishCollection,
} from '../../../services/gallery';

export const GalleryCollectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [collections, setCollections] = useState<GalleryCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const fetchCollections = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminCollections();
      setCollections(data || []);
    } catch (err: any) {
      console.error('Failed to load collections:', err);
      setError(err.message || 'Failed to load gallery collections.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleDelete = async (id: string, title: string) => {
    if (!window.confirm(`Are you sure you want to delete collection "${title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deleteCollection(id);
      fetchCollections();
    } catch (err: any) {
      alert(err.message || 'Failed to delete collection.');
    }
  };

  const handleTogglePublish = async (id: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await unpublishCollection(id);
      } else {
        await publishCollection(id);
      }
      fetchCollections();
    } catch (err: any) {
      alert(err.message || 'Failed to change publish status.');
    }
  };

  // Extract unique categories
  const categories = ['ALL', ...Array.from(new Set(collections.map((c) => c.category)))];

  // Filter collections
  const filteredCollections = collections.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.slug.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-black text-white p-6 md:p-12 space-y-10">
      {/* Header Bar */}
      <div className="max-w-[1800px] mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-300">
              Admin Portal
            </span>
            <span className="text-zinc-600 text-xs">•</span>
            <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">Website Gallery System</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tight text-white mt-2">
            Gallery Collections
          </h1>
        </div>

        <button
          onClick={() => navigate('/ecosystem/gallery/new')}
          className="flex items-center gap-3 px-8 py-4 bg-white text-black text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-200 active:scale-95 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
        >
          <Plus className="w-4 h-4" />
          <span>Create Collection</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="max-w-[1800px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-white text-black shadow-md'
                  : 'bg-white/5 border border-white/10 text-zinc-400 hover:bg-white/10 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search collections..."
            className="w-full bg-black/60 border border-white/10 rounded-xl pl-11 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
          />
        </div>
      </div>

      {/* Main Grid Content */}
      {loading ? (
        <div className="max-w-[1800px] mx-auto py-24 flex justify-center items-center">
          <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
        </div>
      ) : error ? (
        <div className="max-w-[1800px] mx-auto py-16 text-center glass-panel rounded-3xl border border-rose-500/20 p-8 space-y-4">
          <p className="text-rose-400 text-sm font-bold uppercase tracking-wider">{error}</p>
          <button
            onClick={fetchCollections}
            className="px-6 py-2.5 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold text-white uppercase tracking-widest"
          >
            Retry
          </button>
        </div>
      ) : filteredCollections.length === 0 ? (
        <div className="max-w-[1800px] mx-auto py-24 text-center glass-panel rounded-3xl border border-white/10 p-12 space-y-4">
          <ImageIcon className="w-12 h-12 text-zinc-600 mx-auto animate-pulse" />
          <h3 className="text-xl font-black uppercase tracking-tight text-white/80">No Collections Found</h3>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest max-w-md mx-auto">
            {searchQuery || selectedCategory !== 'ALL'
              ? 'No collections matched your search filters.'
              : 'Create your first website gallery collection to display on the public website.'}
          </p>
          <button
            onClick={() => navigate('/ecosystem/gallery/new')}
            className="px-8 py-3 bg-white text-black font-black uppercase text-xs rounded-xl tracking-widest hover:bg-zinc-200"
          >
            Create Collection Now
          </button>
        </div>
      ) : (
        <div className="max-w-[1800px] mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCollections.map((item) => {
            const cover = item.coverImage || item.heroImage || item.images?.[0]?.imageUrl || '';
            const photoCount = item._count?.images ?? item.images?.length ?? 0;

            return (
              <div
                key={item.id}
                className="group relative rounded-3xl overflow-hidden glass-panel border border-white/10 hover:border-white/30 transition-all duration-500 flex flex-col justify-between"
              >
                {/* Cover Image Header */}
                <div className="relative aspect-[16/10] w-full bg-zinc-950 overflow-hidden">
                  {cover ? (
                    <img
                      src={cover}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-600">
                      <ImageIcon className="w-10 h-10 mb-2" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">No Cover Image</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                  {/* Top Badges */}
                  <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
                    <span className="px-3.5 py-1.5 rounded-full bg-black/60 border border-white/20 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-white">
                      {item.category}
                    </span>

                    <button
                      onClick={() => handleTogglePublish(item.id, item.isPublished)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border backdrop-blur-md text-[9px] font-black uppercase tracking-widest transition-all ${
                        item.isPublished
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                          : 'bg-amber-500/20 border-amber-500/50 text-amber-300'
                      }`}
                    >
                      {item.isPublished ? (
                        <>
                          <CheckCircle className="w-3 h-3 text-emerald-400" /> Published
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-amber-400" /> Draft
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Content Body */}
                <div className="p-6 md:p-8 space-y-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight text-white group-hover:text-blue-400 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-xs text-zinc-400 font-medium line-clamp-2 mt-2 leading-relaxed">
                      {item.description || <span className="italic text-zinc-600">No description set</span>}
                    </p>
                  </div>

                  {/* Metadata Row */}
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-zinc-500 pt-4 border-t border-white/5">
                    <span className="flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-zinc-400" /> {photoCount} Photos
                    </span>
                    <span className="flex items-center gap-1.5 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-zinc-400" /> {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Actions Row */}
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <button
                      onClick={() => window.open(`/collections/${item.slug}`, '_blank')}
                      title="Preview Collection"
                      className="py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 text-blue-400" />
                      <span>Preview</span>
                    </button>

                    <button
                      onClick={() => navigate(`/ecosystem/gallery/${item.id}/edit`)}
                      title="Edit Collection"
                      className="py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => handleDelete(item.id, item.title)}
                      title="Delete Collection"
                      className="py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 text-rose-400 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GalleryCollectionsPage;
