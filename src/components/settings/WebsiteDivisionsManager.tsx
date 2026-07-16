import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Edit2, Trash2, Instagram, AlertTriangle, CheckCircle2, Layers, Image as ImageIcon, Film } from 'lucide-react';
import { api } from '../../services/api';
import { type WebsiteDivision } from '../../services/api/divisions';
import { getFullUrl } from '../../utils/media';

const WebsiteDivisionsManager: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [items, setItems] = useState<WebsiteDivision[]>([]);
  const [itemToDelete, setItemToDelete] = useState<WebsiteDivision | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      const data = await api.getWebsiteDivisions();
      setItems(data || []);
    } catch (err) {
      console.error('Failed to fetch divisions from backend', err);
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
      const res = await api.deleteWebsiteDivision(itemToDelete.id);
      if (res && res.success) {
        setToast('Division deleted successfully!');
        setTimeout(() => setToast(null), 3000);
        fetchItems();
      }
    } catch (err) {
      console.error('Failed to delete division', err);
    }
    setItemToDelete(null);
  };

  return (
    <div className="space-y-12 animate-ios-slide-up pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight uppercase">Website Divisions</h1>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Manage Landing Page Divisions • Portfolio Segments</p>
        </div>
        <button 
          onClick={() => navigate('/ecosystem/divisions/new')}
          className="group flex items-center gap-2 px-6 py-3.5 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Division</span>
        </button>
      </div>

      {/* Grid List */}
      {items.length === 0 ? (
        <div className="glass-panel p-20 rounded-[3rem] border border-white/5 text-center max-w-2xl mx-auto animate-ios-slide-up relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
          <div className="w-20 h-20 bg-white/[0.02] rounded-full flex items-center justify-center mx-auto mb-8 border border-white/5 shadow-inner">
            <Layers className="w-8 h-8 text-zinc-400" />
          </div>
          <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-3">No Divisions</h3>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider leading-relaxed max-w-md mx-auto mb-8">
            Create your first division segment profile to highlight custom event collections on your homepage.
          </p>
          <button 
            onClick={() => navigate('/ecosystem/divisions/new')}
            className="px-8 py-4 bg-white text-black hover:bg-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-[0_0_25px_rgba(255,255,255,0.05)]"
          >
            Create Division
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => {
            const photosCount = item.media ? item.media.filter((m: any) => m.type === 'IMAGE').length : 0;
            const videosCount = item.media ? item.media.filter((m: any) => m.type === 'VIDEO').length : 0;
            const images = item.media ? item.media.filter((m: any) => m.type === 'IMAGE').sort((a: any, b: any) => a.position - b.position) : [];
            const coverMedia = images.length > 0 ? images[0] : (item.media && item.media.length > 0 ? item.media[0] : null);
            const coverImage = coverMedia ? getFullUrl(coverMedia.url) : 'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?q=80&w=600&auto=format&fit=crop';
            return (
              <div key={item.id} className="glass-panel rounded-[2rem] border border-white/5 overflow-hidden flex flex-col group hover:border-white/10 transition-all duration-300">
                {/* Image Cover */}
                <div className="relative aspect-[16/10] overflow-hidden bg-zinc-950">
                  <img 
                    src={coverImage} 
                    alt={item.name} 
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
                  <div className="space-y-3">
                    <h3 className="text-lg font-black text-white uppercase tracking-tight leading-snug group-hover:text-primary transition-colors">{item.name}</h3>
                    <p className="text-zinc-500 text-xs font-medium line-clamp-2 leading-relaxed">{item.description}</p>
                    
                    {/* Media Counts */}
                    <div className="flex items-center gap-4 text-zinc-500 text-[9px] font-black uppercase tracking-widest pt-2">
                      <div className="flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{photosCount} Photos</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Film className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{videosCount} Videos</span>
                      </div>
                    </div>

                    {item.instagramUrl && (
                      <div className="flex items-center gap-2 text-zinc-500 mt-2 pt-1">
                        <Instagram className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-mono truncate max-w-[200px]">{item.instagramUrl}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-4 border-t border-white/5">
                    <button 
                      onClick={() => navigate(`/ecosystem/divisions/${item.id}/edit`)}
                      className="flex-1 py-3 bg-white/5 text-zinc-300 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest border border-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button 
                      onClick={() => setItemToDelete(item)}
                      className="py-3 px-4 bg-red-500/5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl border border-transparent hover:border-red-500/10 transition-all flex items-center justify-center"
                      aria-label="Delete division item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-6 backdrop-blur-2xl">
          <div className="bg-zinc-900 border border-white/10 rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl text-center animate-ios-slide-up">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-black text-white uppercase mb-2">Delete Division?</h2>
            <p className="text-[10px] text-zinc-500 font-bold leading-relaxed mb-8 px-4">
              Are you sure you want to remove "{itemToDelete.name}"? This card will be removed immediately from the mock registry.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setItemToDelete(null)} 
                className="flex-1 py-4 bg-white/5 text-zinc-500 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all border border-white/5"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm} 
                className="flex-1 py-4 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-xl shadow-red-500/10"
              >
                Delete
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

export default WebsiteDivisionsManager;
