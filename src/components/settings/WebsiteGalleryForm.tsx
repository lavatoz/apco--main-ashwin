import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Globe, Instagram, Loader2, AlertTriangle } from 'lucide-react';
import { api } from '../../services/api';

const WebsiteGalleryForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [title, setTitle] = useState('');
  const [coverImageUrl, setCoverImageUrl] = useState('');
  const [coverImageFileId, setCoverImageFileId] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [published, setPublished] = useState(false);
  
  const [fileName, setFileName] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [uploadMetadata, setUploadMetadata] = useState<{
    filename: string;
    size: string;
    dimensions?: string;
  } | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  useEffect(() => {
    if (isEdit && id) {
      const loadGallery = async () => {
        try {
          setLoading(true);
          const item = await api.getGalleryById(id);
          if (item) {
            setTitle(item.title);
            setCoverImageUrl(item.coverImageUrl);
            setCoverImageFileId(item.coverImageFileId);
            setInstagramUrl(item.instagramUrl || '');
            setPublished(item.published);
            setFileName('Current Cover Image');
            
            const img = new Image();
            img.src = item.coverImageUrl;
            img.onload = () => {
              setUploadMetadata({
                filename: 'Current Cover',
                size: 'N/A',
                dimensions: `${img.width}x${img.height}px`
              });
            };
            img.onerror = () => {
              setUploadMetadata({
                filename: 'Current Cover',
                size: 'N/A'
              });
            };
          } else {
            navigate('/ecosystem/gallery');
          }
        } catch (err: any) {
          console.error('Failed to load website gallery details', err);
          setErrorMsg(err.message || 'Failed to load gallery details.');
        } finally {
          setLoading(false);
        }
      };
      loadGallery();
    }
  }, [id, isEdit, navigate]);

  const handleUploadFile = async (file: File) => {
    try {
      setUploading(true);
      setErrorMsg(null);
      setFileName(file.name);
      
      const res = await api.uploadCoverImage(file);
      if (res && res.imageUrl && res.fileId) {
        setCoverImageUrl(res.imageUrl);
        setCoverImageFileId(res.fileId);
        
        // Read dimensions client side
        const img = new Image();
        img.src = res.imageUrl;
        img.onload = () => {
          setUploadMetadata({
            filename: res.filename || file.name,
            size: formatFileSize(file.size),
            dimensions: `${img.width}x${img.height}px`
          });
        };
        img.onerror = () => {
          setUploadMetadata({
            filename: res.filename || file.name,
            size: formatFileSize(file.size)
          });
        };
      } else {
        throw new Error('Upload response missing imageUrl or fileId');
      }
    } catch (err: any) {
      console.error('Failed to upload cover image', err);
      setErrorMsg(err.message || 'Failed to upload cover image.');
      setFileName(null);
      setCoverImageUrl('');
      setCoverImageFileId('');
      setUploadMetadata(null);
    } finally {
      setUploading(false);
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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0] && !uploading && !loading) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && !uploading && !loading) {
      handleUploadFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !coverImageUrl || !coverImageFileId || uploading || loading) return;

    const data = {
      title: title.trim(),
      coverImageUrl,
      coverImageFileId,
      instagramUrl: instagramUrl.trim() || null,
      published
    };

    try {
      setLoading(true);
      if (isEdit && id) {
        await api.updateGallery(id, data);
        navigate('/ecosystem/gallery', { state: { toast: 'Gallery updated successfully!' } });
      } else {
        await api.createGallery(data);
        navigate('/ecosystem/gallery', { state: { toast: 'Gallery created successfully!' } });
      }
    } catch (err: any) {
      console.error('Failed to save website gallery', err);
      setErrorMsg(err.message || 'Failed to save website gallery card.');
    } finally {
      setLoading(false);
    }
  };

  const isSaveDisabled = uploading || loading || !title.trim() || !coverImageUrl || !coverImageFileId;

  return (
    <div className="max-w-3xl mx-auto space-y-12 animate-ios-slide-up pb-32">
      {/* Back button */}
      <div>
        <button 
          onClick={() => navigate('/ecosystem/gallery')}
          className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Gallery</span>
        </button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-white tracking-tight uppercase">
          {isEdit ? 'Edit Gallery Card' : 'New Gallery Card'}
        </h1>
        <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">
          {isEdit ? 'Modify portfolio metadata' : 'Configure a new portfolio showcase element'}
        </p>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="glass-panel p-6 rounded-[2rem] border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="glass-panel border border-white/5 rounded-[2.5rem] p-10 space-y-8">
        
        {/* Title Input */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Gallery Title</label>
          <input 
            type="text"
            required
            disabled={loading}
            placeholder="e.g. Royal Wedding Highlights"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-white/5 border border-white/5 focus:border-white/20 rounded-2xl p-5 text-sm font-bold text-white outline-none transition-all"
          />
        </div>

        {/* Cover Image Upload */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Cover Image</label>
          
          <div 
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`relative border border-dashed rounded-[2rem] p-10 flex flex-col items-center justify-center gap-4 transition-all overflow-hidden ${
              dragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
            }`}
          >
            {/* Background image preview */}
            {coverImageUrl && !uploading && (
              <div className="absolute inset-0 pointer-events-none opacity-20 transition-opacity">
                <img src={coverImageUrl} alt="Cover Preview" className="w-full h-full object-cover" />
              </div>
            )}

            <input 
              type="file"
              id="file-upload"
              accept="image/*"
              onChange={handleFileChange}
              disabled={uploading || loading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="p-4 bg-white/5 rounded-2xl border border-white/10 relative z-20">
              <Upload className="w-6 h-6 text-zinc-400" />
            </div>
            <div className="text-center relative z-20">
              <p className="text-xs font-black uppercase text-white tracking-wider">
                {uploading ? 'Uploading cover...' : (fileName ? fileName : 'Choose image file or drag here')}
              </p>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
                PNG, JPG or WEBP up to 5MB
              </p>
            </div>
          </div>

          {/* Upload Metadata Display */}
          {uploadMetadata && (
            <div className="mt-4 p-5 bg-white/[0.02] border border-white/5 rounded-2xl text-[10px] font-mono text-zinc-400 space-y-1">
              <p className="text-zinc-500 uppercase tracking-[0.2em] text-[8px] font-black font-sans mb-2">Upload Metadata</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="truncate"><span className="text-zinc-600 uppercase font-sans font-black text-[8px] tracking-wider block mb-0.5">Filename</span> <span className="text-white font-bold truncate block">{uploadMetadata.filename}</span></div>
                <div><span className="text-zinc-600 uppercase font-sans font-black text-[8px] tracking-wider block mb-0.5">File Size</span> <span className="text-white font-bold block">{uploadMetadata.size}</span></div>
                {uploadMetadata.dimensions && (
                  <div><span className="text-zinc-600 uppercase font-sans font-black text-[8px] tracking-wider block mb-0.5">Dimensions</span> <span className="text-white font-bold block">{uploadMetadata.dimensions}</span></div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Instagram Link */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1 flex items-center gap-2">
            <Instagram className="w-3.5 h-3.5" />
            <span>Instagram URL (Optional)</span>
          </label>
          <input 
            type="url"
            disabled={loading}
            placeholder="https://www.instagram.com/p/..."
            value={instagramUrl}
            onChange={(e) => setInstagramUrl(e.target.value)}
            className="w-full bg-white/5 border border-white/5 focus:border-white/20 rounded-2xl p-5 text-sm font-bold text-white outline-none transition-all"
          />
        </div>

        {/* Published Toggle */}
        <div className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-[2rem]">
          <div className="space-y-1">
            <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>Published Status</span>
            </h4>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">
              Visible on the landing page gallery if published is active
            </p>
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={() => setPublished(!published)}
            className={`w-14 h-8 rounded-full transition-colors duration-300 relative focus:outline-none flex items-center ${
              published ? 'bg-emerald-500' : 'bg-zinc-800'
            }`}
          >
            <div className={`w-6 h-6 rounded-full bg-white transition-all duration-300 shadow-md absolute ${
              published ? 'translate-x-7' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t border-white/5">
          <button 
            type="button"
            disabled={loading}
            onClick={() => navigate('/ecosystem/gallery')}
            className="flex-1 py-4 bg-white/5 text-zinc-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit"
            disabled={isSaveDisabled}
            className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              isSaveDisabled 
                ? 'bg-zinc-800/50 text-zinc-600 border border-white/5 cursor-not-allowed' 
                : 'bg-white text-black hover:bg-zinc-200 shadow-[0_0_35px_rgba(255,255,255,0.1)] active:scale-95'
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin text-black" />}
            <span>Save Gallery</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default WebsiteGalleryForm;
