import React, { useState } from 'react';
import { 
  Image as ImageIcon, 
  CheckCircle2, 
  Upload, 
  Maximize2, 
  X,
  Sparkles
} from 'lucide-react';
import type { Gallery as GalleryType } from '../types';
import { api, API_URL } from '../services/api';

interface GalleryProps {
  clientId: string;
  userRole: 'Admin' | 'Staff' | 'Client' | 'none';
  onUpdate?: () => void;
}

const Gallery: React.FC<GalleryProps> = ({ clientId, userRole, onUpdate }) => {
  const [gallery, setGallery] = useState<GalleryType | null>(null);
  const [selectedImage, setSelectedImage] = useState<{url: string, _id: string} | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [matchedPaths, setMatchedPaths] = useState<string[] | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const selfieInputRef = React.useRef<HTMLInputElement>(null);

  const isAdmin = userRole === 'Admin' || userRole === 'Staff';
  const isClient = userRole === 'Client';

  const fetchGallery = async () => {
    try {
      const data = await api.getGallery(clientId);
      setGallery(data);
    } catch (err) {
      console.error("Failed to fetch gallery", err);
    }
  };

  React.useEffect(() => {
    fetchGallery();
  }, [clientId]);

  const handleToggleSelect = async (imagePath: string) => {
    if (!isClient || !gallery) return;
    try {
      const isSelected = gallery.selectedImages.includes(imagePath);
      const nextSelection = isSelected 
        ? gallery.selectedImages.filter(p => p !== imagePath)
        : [...gallery.selectedImages, imagePath];
      
      await api.selectGalleryPhotos(clientId, nextSelection);
      fetchGallery();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Selection toggle failed", err);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(Array.from(e.target.files));
    }
  };

  const handleUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setIsUploading(true);
    try {
      await api.uploadGalleryImages(clientId, files);
      setIsUploading(false);
      fetchGallery();
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error("Upload failed", err);
      setIsUploading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(Array.from(e.dataTransfer.files));
    }
  };

  const handleFindMyPhotos = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selfie = e.target.files[0];
      setIsSearching(true);
      setMatchedPaths(null);
      try {
        const result = await api.findMyPhotos(clientId, selfie);
        if (result.matches) {
          setMatchedPaths(result.matches);
        } else {
          setMatchedPaths([]);
        }
      } catch (err: any) {
        console.error("AI Search failed", err);
        alert(err.message || "Face recognition failed. Please ensure the Python service is configured correctly.");
      } finally {
        setIsSearching(false);
      }
    }
  };

  const getImageUrl = (path: string) => {
    // API_URL is http://localhost:5000/api
    const serverBase = API_URL.replace('/api', '');
    return `${serverBase}/${path}`;
  };

  const images = gallery?.images || [];
  const filteredImages = matchedPaths 
    ? images.filter(img => matchedPaths.includes(img.path))
    : images;
  const selectedCount = gallery?.selectedImages?.length || 0;

  return (
    <div className="space-y-12 animate-ios-slide-up">
      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-zinc-900/40 p-8 rounded-[2.5rem] border border-white/5 backdrop-blur-2xl">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-4">
            <ImageIcon className="w-6 h-6 text-zinc-600" /> 
            Digital Asset Vault
          </h3>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-2">
            {images.length} Total Assets • {selectedCount} Selection Pool
          </p>
        </div>
        
        {isClient && (
          <div className="flex items-center gap-4">
             {matchedPaths ? (
                 <div className="flex items-center gap-3 bg-blue-500/10 px-6 py-4 rounded-3xl border border-blue-500/20">
                    <div className="text-right">
                        <p className="text-[9px] font-black uppercase text-blue-500/60 tracking-[0.2em] leading-none mb-1.5">AI Filter Active</p>
                        <p className="text-xs font-black text-white leading-none whitespace-nowrap">{filteredImages.length} Matches Found</p>
                    </div>
                    <button 
                        onClick={() => setMatchedPaths(null)}
                        className="p-2 hover:bg-white/10 rounded-full transition-all text-white"
                        title="Clear Results"
                    >
                        <X className="w-5 h-5" />
                    </button>
                 </div>
             ) : (
                <div className="flex items-center gap-4 bg-emerald-500/10 px-6 py-4 rounded-3xl border border-emerald-500/20">
                    <div className="text-right">
                        <p className="text-[9px] font-black uppercase text-emerald-500/60 tracking-[0.2em] leading-none mb-1.5">Selection Progress</p>
                        <p className="text-xs font-black text-white leading-none whitespace-nowrap">{selectedCount} Photos Chosen</p>
                    </div>
                    <CheckCircle2 className={`w-6 h-6 ${selectedCount > 0 ? 'text-emerald-400' : 'text-zinc-800'}`} />
                </div>
             )}
             
             <button 
                onClick={() => selfieInputRef.current?.click()}
                disabled={isSearching}
                className="bg-white text-black px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all active:scale-95 flex items-center gap-3 shadow-[0_20px_40px_rgba(255,255,255,0.1)] disabled:opacity-50"
             >
                {isSearching ? <Sparkles className="w-4 h-4 animate-spin" /> : <Maximize2 className="w-4 h-4" />}
                {isSearching ? "Identifying..." : "Find My Photos"}
             </button>
             <input 
                type="file" 
                ref={selfieInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFindMyPhotos}
             />
          </div>
        )}

        {isAdmin && (
          <div className="flex items-center gap-4">
             <div className="text-right hidden md:block">
                <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] leading-none mb-1.5">Work Status</p>
                <p className="text-xs font-black text-white leading-none uppercase">{gallery?.status || 'Active'}</p>
             </div>
             <button 
                onClick={() => fileInputRef.current?.click()}
                className="bg-white text-black px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-200 transition-all active:scale-95 flex items-center gap-3 shadow-[0_20px_40px_rgba(255,255,255,0.1)]"
             >
                <Upload className="w-4 h-4" /> Multi-Asset Ingestion
             </button>
             <input 
                type="file" 
                multiple 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleFileChange}
             />
          </div>
        )}
      </div>

      {/* Upload Progress (Admin Only) */}
      {isAdmin && isUploading && (
        <div className="glass-panel p-12 squircle-lg border-2 border-dashed border-zinc-800 bg-white/[0.01]">
          <div className="flex items-center justify-center gap-4 text-white">
            <Sparkles className="w-8 h-8 animate-spin text-blue-500" />
            <h4 className="text-base font-black uppercase tracking-[0.2em]">Processing Ingestion Stream...</h4>
          </div>
        </div>
      )}

      {/* Grid Layout - Masonry-like spacing */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-10">
        {filteredImages.length > 0 ? filteredImages.map((img) => {
          const isSelected = gallery?.selectedImages.includes(img.path);
          const imgUrl = getImageUrl(img.path);
          return (
            <div 
              key={img._id} 
              className={`group relative aspect-[3/4] rounded-[3rem] overflow-hidden bg-zinc-950 border-2 transition-all duration-700 ${isSelected ? 'border-emerald-500/60 shadow-[0_0_60px_rgba(52,211,153,0.15)] ring-4 ring-emerald-500/5' : 'border-white/[0.03] hover:border-white/10'}`}
            >
              {/* Background Image */}
              <img 
                src={imgUrl} 
                alt="Project asset" 
                className={`w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-110 ${isSelected ? 'opacity-70 blur-[2px] group-hover:blur-0' : 'opacity-100 group-hover:opacity-90'}`}
              />
              
              {/* Overlay Gradient (Cinema Feel) */}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-40 group-hover:opacity-70 transition-opacity duration-700" />

              {/* Selection Status Badge */}
              {isSelected && (
                <div className="absolute top-8 left-8 flex items-center gap-3 bg-emerald-500 text-[10px] font-black uppercase text-white px-5 py-2.5 rounded-2xl shadow-2xl tracking-[0.2em] animate-ios-slide-up z-20">
                   <CheckCircle2 className="w-4 h-4" /> Selected
                </div>
              )}

              {/* Hover Actions Bar */}
              <div className="absolute inset-0 flex flex-col justify-end p-8 translate-y-6 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]">
                 <div className="flex gap-3">
                    <button 
                    onClick={() => setSelectedImage({url: imgUrl, _id: img._id || img.path})}
                    className="flex-1 py-4 bg-white/10 hover:bg-white text-zinc-300 hover:text-black rounded-2xl backdrop-blur-xl transition-all border border-white/10 flex items-center justify-center gap-3"
                    >
                      <Maximize2 className="w-4 h-4" /> <span className="text-[9px] font-black uppercase tracking-widest">Preview</span>
                    </button>
                 </div>

                 {isClient && (
                    <button 
                      onClick={() => handleToggleSelect(img.path)}
                      className={`w-full mt-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl ${isSelected ? 'bg-emerald-500 text-white' : 'bg-white text-black hover:bg-zinc-200'}`}
                    >
                      {isSelected ? 'Remove from Selection' : 'Select for Final Album'}
                    </button>
                 )}
              </div>
            </div>
          );
        }) : (
          <div 
            className={`col-span-full py-48 flex flex-col items-center justify-center glass-panel rounded-[4rem] border-dashed border-2 bg-white/[0.005] transition-all ${dragActive ? 'border-blue-500 bg-blue-500/5' : 'border-zinc-900'}`}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
          >
            <div className={`w-24 h-24 rounded-[2rem] flex items-center justify-center mb-8 border transition-all ${dragActive ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.2)]' : 'bg-white/5 border-white/5 shadow-2xl'}`}>
              {isSearching ? <Sparkles className="w-10 h-10 text-blue-400 animate-pulse" /> : <ImageIcon className={`w-10 h-10 ${dragActive ? 'text-blue-400' : 'text-zinc-800'}`} />}
            </div>
            <h4 className="text-base font-black uppercase tracking-[0.4em] text-zinc-700">
                {isSearching ? 'Analyzing Faces...' : matchedPaths ? 'No Matches Found' : dragActive ? 'Drop Assets Now' : 'Repository Empty'}
            </h4>
            <p className="text-[10px] font-black text-zinc-800 mt-4 uppercase tracking-[0.2em]">
                {isSearching ? 'Running biometric scan' : matchedPaths ? 'Try a different selfie or check other galleries' : dragActive ? 'Ingestion ready' : 'Pending Studio Asset Upload'}
            </p>
          </div>
        )}
      </div>

      {/* Fullscreen Preview (Theatrical Style) */}
      {selectedImage && (
        <div className="fixed inset-0 z-[200] bg-black/98 backdrop-blur-3xl flex items-center justify-center p-6 md:p-16 animate-ios-slide-up" onClick={() => setSelectedImage(null)}>
          <button className="absolute top-10 right-10 p-5 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all z-[210] border border-white/10">
            <X className="w-7 h-7" />
          </button>
          
          <div className="relative w-full max-w-7xl h-full flex flex-col items-center justify-center gap-10" onClick={e => e.stopPropagation()}>
            <div className="relative flex-1 flex items-center justify-center overflow-hidden rounded-[2rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] border border-white/5">
               <img 
                  src={selectedImage.url} 
                  alt="Full resolution preview" 
                  className="max-w-full max-h-full object-contain animate-ios-zoom-in"
               />
            </div>
            
            {isClient && gallery && (
              <div className="flex items-center gap-6 animate-ios-slide-up">
                 <button 
                  onClick={() => { 
                    const imgPath = images.find(i => i._id === selectedImage._id || i.path === selectedImage._id)?.path;
                    if (imgPath) handleToggleSelect(imgPath); 
                    setSelectedImage(null); 
                  }}
                  className={`px-16 py-6 rounded-full font-black uppercase text-[11px] tracking-[0.3em] shadow-[0_30px_60px_rgba(255,255,255,0.05)] transition-all active:scale-95 ${gallery.selectedImages.includes(images.find(i => i._id === selectedImage._id || i.path === selectedImage._id)?.path || '') ? 'bg-emerald-500 text-white' : 'bg-white text-black hover:bg-zinc-200'}`}
                 >
                   {gallery.selectedImages.includes(images.find(i => i._id === selectedImage._id || i.path === selectedImage._id)?.path || '') ? 'Selected (Click to Remove)' : 'Add to Collection'}
                 </button>
                 <button onClick={() => setSelectedImage(null)} className="px-10 py-6 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-colors">
                    Close View
                 </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
