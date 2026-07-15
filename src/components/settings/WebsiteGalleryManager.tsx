import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Edit2, Trash2, Globe, Instagram, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { type WebsiteGallery } from '../../services/api/websiteGallery';

const WebsiteGalleryManager: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<WebsiteGallery[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<WebsiteGallery | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getGalleries();
      setItems(data);
    } catch (err: any) {
      console.error('Failed to fetch website galleries', err);
      setError(err.message || 'Failed to load website galleries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  useEffect(() => {
    if (location.state?.toast) {
      setToast(location.state.toast);
      window.history.replaceState({}, document.title);
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [location]);

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    try {
      setLoading(true);
      setError(null);
      await api.deleteGallery(itemToDelete.id);
      setToast('Gallery deleted successfully!');
      setTimeout(() => setToast(null), 3000);
      await fetchItems();
      setItemToDelete(null);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to delete gallery item');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-12 animate-ios-slide-up pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">Website Gallery</h1>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Manage Public Portfolio • Landing Page Highlights</p>
        </div>
        <button 
          onClick={() => navigate('/ecosystem/gallery/new')}
          className="group flex items-center gap-2 px-6 py-3.5 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Gallery</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="glass-panel p-6 rounded-[2rem] border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-bold flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span>{error}</span>
          </div>
          <button 
            onClick={fetchItems} 
            className="px-4 py-2 border border-red-500/25 hover:bg-red-500/10 rounded-xl transition-all uppercase tracking-widest text-[9px] font-black"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loader for action transition */}
      {loading && items.length > 0 && (
        <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-black uppercase tracking-widest bg-white/5 border border-white/5 px-4 py-2 rounded-full w-max mx-auto animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-white" />
          <span>Updating list...</span>
        </div>
      )}

      {/* Grid List */}
      {loading && items.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="glass-panel rounded-[2rem] border border-white/5 overflow-hidden flex flex-col animate-pulse">
              <div className="aspect-[16/10] bg-white/5" />
              <div className="p-6 flex-1 space-y-4">
                <div className="h-4 bg-white/10 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2" />
                <div className="pt-4 border-t border-white/5 flex gap-2">
                  <div className="h-10 bg-white/5 rounded-xl flex-1" />
                  <div className="h-10 bg-white/5 rounded-xl w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="glass-panel p-20 rounded-[3rem] border border-white/5 text-center max-w-2xl mx-auto animate-ios-slide-up relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
          <div className="w-20 h-20 bg-white/[0.02] rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-inner">
            <Globe className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-3">No Portfolio Highlights</h3>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider leading-relaxed max-w-md mx-auto mb-8">
            Create your first public portfolio showcase card to highlight your event cinematography on the landing page curated gallery.
          </p>
          <button 
            onClick={() => navigate('/ecosystem/gallery/new')}
            className="px-8 py-4 bg-white text-black hover:bg-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_25px_rgba(255,255,255,0.05)]"
          >
            Create Gallery Card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="glass-panel rounded-[2rem] border border-white/5 overflow-hidden flex flex-col group hover:border-white/10 transition-all duration-300">
              {/* Image Cover */}
              <div className="relative aspect-[16/10] overflow-hidden bg-zinc-950">
                <img 
                  src={item.coverImageUrl} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                
                {/* Published Status Badge */}
                <div className="absolute top-4 right-4">
                  <span className={`px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border backdrop-blur-md ${
                    item.published 
                      ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/20' 
                      : 'bg-zinc-950/80 text-zinc-400 border-white/10'
                  }`}>
                    {item.published ? 'Published' : 'Draft'}
                  </span>
                </div>
              </div>

              {/* Contents */}
              <div className="p-6 flex-1 flex flex-col justify-between gap-6">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight leading-snug group-hover:text-primary transition-colors">{item.title}</h3>
                  {item.instagramUrl && (
                    <div className="flex items-center gap-2 text-zinc-500 mt-2">
                      <Instagram className="w-3.5 h-3.5" />
                      <span className="text-[9px] font-mono truncate max-w-[200px]">{item.instagramUrl}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t border-white/5">
                  <button 
                    onClick={() => navigate(`/ecosystem/gallery/${item.id}/edit`)}
                    className="flex-1 py-3 bg-white/5 text-zinc-300 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>
                  <button 
                    onClick={() => setItemToDelete(item)}
                    className="py-3 px-4 bg-red-500/5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-500/10 transition-all flex items-center justify-center"
                    aria-label="Delete gallery item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-6 backdrop-blur-2xl">
          <div className="bg-zinc-900 border border-white/10 rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl text-center animate-ios-slide-up">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-black text-white uppercase mb-2">Delete Gallery Card?</h2>
            <p className="text-[10px] text-zinc-500 font-bold leading-relaxed mb-8 px-4">
              Are you sure you want to remove "{itemToDelete.title}"? This card and its associated Cover Image on Google Drive will be deleted.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setItemToDelete(null)} 
                className="flex-1 py-4 bg-white/5 text-zinc-500 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all border border-white/5"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm} 
                className="flex-1 py-4 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-xl shadow-red-500/10 flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-12 right-12 z-[200] bg-white text-black px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center gap-3 animate-ios-slide-up border border-zinc-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>{toast}</span>
        </div>
      )}
    </div>
  );
};

export default WebsiteGalleryManager;
