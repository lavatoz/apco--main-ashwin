import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, Globe, Instagram, Image as ImageIcon, Film, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { getFullUrl } from '../../utils/media';

const MediaUploadCard = ({ 
  type, 
  index, 
  value, 
  fileName, 
  onChange 
}: { 
  type: 'photo' | 'video'; 
  index: number; 
  value: string; 
  fileName: string; 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  return (
    <div className="relative border border-white/10 hover:border-white/20 bg-white/5 rounded-3xl p-6 flex flex-col items-center justify-center min-h-[220px] transition-all duration-300 group overflow-hidden">
      {/* Background preview */}
      {value && (
        <div className="absolute inset-0 z-0">
          {type === 'photo' ? (
            <img src={value} alt="Preview" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
          ) : (
            <video 
              src={value} 
              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" 
              controls 
              muted 
              loop 
              playsInline 
              preload="metadata"
            />
          )}
          <div className="absolute inset-0 bg-black/40 pointer-events-none z-0" />
        </div>
      )}

      {/* Hidden file input */}
      <input 
        type="file"
        ref={fileInputRef}
        accept={type === 'photo' ? 'image/*' : 'video/*'}
        onChange={onChange}
        className="hidden"
      />

      <div className="relative z-10 flex flex-col items-center justify-center text-center gap-4 w-full h-full">
        {value ? (
          <div className="bg-zinc-950/60 border border-white/5 backdrop-blur-md rounded-2xl p-2.5 flex flex-col items-center gap-2.5 w-full max-w-[140px]">
            <div className="p-1.5 bg-white/10 rounded-xl border border-white/10">
              {type === 'photo' ? <ImageIcon className="w-4 h-4 text-emerald-400" /> : <Film className="w-4 h-4 text-emerald-400" />}
            </div>
            <div className="w-full">
              <p className="text-[9px] font-black uppercase text-white tracking-widest">{type === 'photo' ? `Photo ${index + 1}` : 'Video Reel'}</p>
              {fileName && !fileName.toLowerCase().includes('preview') && (
                <p className="text-[8px] font-mono text-zinc-400 uppercase tracking-wider mt-1 truncate w-full px-1">{fileName}</p>
              )}
            </div>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-[8px] font-black uppercase tracking-widest text-white border border-white/10 rounded-lg transition-all active:scale-95"
            >
              Replace
            </button>
          </div>
        ) : (
          <>
            <div className="p-3.5 bg-white/5 rounded-2xl border border-white/5 group-hover:border-white/10 transition-all duration-300">
              <Upload className="w-5 h-5 text-zinc-500 group-hover:text-zinc-400 transition-colors" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase text-zinc-400 group-hover:text-white tracking-widest transition-colors">{type === 'photo' ? `Upload Photo ${index + 1}` : 'Video Reel'}</p>
              <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">{type === 'photo' ? 'Select File' : 'Upload a cinematic reel'}</p>
            </div>
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-5 py-2.5 bg-white text-black hover:bg-zinc-200 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 shadow-lg shadow-white/5"
            >
              Choose File
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const WebsiteDivisionForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [instagramUrl, setInstagramUrl] = useState('');
  const [published, setPublished] = useState(false);
  
  // Preview source states (either local Blob URL or Google Drive URL)
  const [photos, setPhotos] = useState<string[]>(['', '', '']);
  const [videos, setVideos] = useState<string[]>(['']);

  // Backend Google Drive URL states for form submission
  const [photoUrls, setPhotoUrls] = useState<string[]>(['', '', '']);
  const [videoUrls, setVideoUrls] = useState<string[]>(['']);

  const [photoNames, setPhotoNames] = useState<string[]>(['', '', '']);
  const [photoFileIds, setPhotoFileIds] = useState<string[]>(['', '', '']);
  const [videoNames, setVideoNames] = useState<string[]>(['']);
  const [videoFileIds, setVideoFileIds] = useState<string[]>(['']);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Keep references to active preview lists to avoid stale closures during unmount
  const photosRef = useRef(photos);
  const videosRef = useRef(videos);

  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  useEffect(() => {
    videosRef.current = videos;
  }, [videos]);

  // Clean up Blob URLs on unmount
  useEffect(() => {
    return () => {
      photosRef.current.forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      videosRef.current.forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  useEffect(() => {
    if (isEdit && id) {
      const loadDivision = async () => {
        try {
          setLoading(true);
          const item = await api.getWebsiteDivisionById(id);
          if (item) {
            setName(item.name);
            setDescription(item.description);
            setInstagramUrl(item.instagramUrl || '');
            setPublished(item.published);
            
            const imageMedia = item.media ? item.media.filter((m: any) => m.type === 'IMAGE') : [];
            const videoMedia = item.media ? item.media.filter((m: any) => m.type === 'VIDEO') : [];

            const newPhotos = ['', '', ''];
            const newPhotoUrls = ['', '', ''];
            const newPhotoFileIds = ['', '', ''];
            const newPhotoNames = ['', '', ''];
            imageMedia.forEach((m: any) => {
              const index = m.position - 1;
              if (index >= 0 && index < 3) {
                newPhotos[index] = getFullUrl(m.url);
                newPhotoUrls[index] = m.url;
                newPhotoFileIds[index] = m.fileId;
                newPhotoNames[index] = `Active Cover ${index + 1}`;
              }
            });
            setPhotos(() => newPhotos);
            setPhotoUrls(() => newPhotoUrls);
            setPhotoFileIds(() => newPhotoFileIds);
            setPhotoNames(() => newPhotoNames);

            const newVideos = [''];
            const newVideoUrls = [''];
            const newVideoFileIds = [''];
            const newVideoNames = [''];
            videoMedia.forEach((m: any) => {
              const index = m.position - 4;
              if (index === 0) {
                newVideos[index] = getFullUrl(m.url);
                newVideoUrls[index] = m.url;
                newVideoFileIds[index] = m.fileId;
                newVideoNames[index] = `Active Footage ${index + 1}`;
              }
            });
            setVideos(() => newVideos);
            setVideoUrls(() => newVideoUrls);
            setVideoFileIds(() => newVideoFileIds);
            setVideoNames(() => newVideoNames);
          } else {
            navigate('/ecosystem/divisions');
          }
        } catch (err: any) {
          console.error('Failed to load division config', err);
          if (err.status === 404) {
            navigate('/ecosystem/divisions', { state: { toast: 'This division no longer exists.' } });
          } else {
            setErrorMsg(err.message || 'Failed to load division details.');
          }
        } finally {
          setLoading(false);
        }
      };
      loadDivision();
    }
  }, [id, isEdit, navigate]);

  const handlePhotoChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Revoke the old Blob URL if it was local to prevent memory leak
      const oldUrl = photos[index];
      if (oldUrl && oldUrl.startsWith('blob:')) {
        URL.revokeObjectURL(oldUrl);
      }

      // Generate local Object URL for immediate preview
      const localUrl = URL.createObjectURL(file);
      
      setPhotos(prev => {
        const next = [...prev];
        next[index] = localUrl;
        return next;
      });

      setPhotoNames(prev => {
        const next = [...prev];
        next[index] = file.name;
        return next;
      });

      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await api.uploadDivisionMedia(file);
        if (res && res.url && res.fileId) {
          // Replace local Blob URL with final Google Drive URL
          setPhotos(prev => {
            const next = [...prev];
            next[index] = res.url;
            return next;
          });

          // Revoke the local Object URL as it's no longer needed
          URL.revokeObjectURL(localUrl);

          setPhotoUrls(prev => {
            const next = [...prev];
            next[index] = res.url;
            return next;
          });

          setPhotoFileIds(prev => {
            const next = [...prev];
            next[index] = res.fileId;
            return next;
          });
        } else {
          throw new Error('Upload response missing url or fileId');
        }
      } catch (err: any) {
        console.error('Failed to upload division photo', err);
        setErrorMsg(err.message || 'Failed to upload image.');
        
        // Remove preview if upload failed
        setPhotos(prev => {
          const next = [...prev];
          next[index] = '';
          return next;
        });
        URL.revokeObjectURL(localUrl);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleVideoChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Revoke the old Blob URL if it was local to prevent memory leak
      const oldUrl = videos[index];
      if (oldUrl && oldUrl.startsWith('blob:')) {
        URL.revokeObjectURL(oldUrl);
      }

      // Generate local Object URL for immediate preview
      const localUrl = URL.createObjectURL(file);
      
      setVideos(prev => {
        const next = [...prev];
        next[index] = localUrl;
        return next;
      });

      setVideoNames(prev => {
        const next = [...prev];
        next[index] = file.name;
        return next;
      });

      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await api.uploadDivisionMedia(file);
        if (res && res.url && res.fileId) {
          // Replace local Blob URL with final Google Drive URL
          setVideos(prev => {
            const next = [...prev];
            next[index] = res.url;
            return next;
          });

          // Revoke the local Object URL as it's no longer needed
          URL.revokeObjectURL(localUrl);

          setVideoUrls(prev => {
            const next = [...prev];
            next[index] = res.url;
            return next;
          });

          setVideoFileIds(prev => {
            const next = [...prev];
            next[index] = res.fileId;
            return next;
          });
        } else {
          throw new Error('Upload response missing url or fileId');
        }
      } catch (err: any) {
        console.error('Failed to upload division video', err);
        setErrorMsg(err.message || 'Failed to upload video.');

        // Remove preview if upload failed
        setVideos(prev => {
          const next = [...prev];
          next[index] = '';
          return next;
        });
        URL.revokeObjectURL(localUrl);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      setErrorMsg('Division Name and Description are required.');
      return;
    }

    // Build media array with positions using backend urls
    const mediaList: { type: 'IMAGE' | 'VIDEO'; position: number; url: string; fileId: string }[] = [];

    photoUrls.forEach((url, i) => {
      if (url) {
        mediaList.push({
          type: 'IMAGE',
          position: i + 1,
          url,
          fileId: photoFileIds[i],
        });
      }
    });

    videoUrls.forEach((url, i) => {
      if (url) {
        mediaList.push({
          type: 'VIDEO',
          position: i + 4,
          url,
          fileId: videoFileIds[i],
        });
      }
    });

    const data = {
      name: name.trim(),
      description: description.trim(),
      instagramUrl: instagramUrl.trim() || null,
      published,
      coverMediaId: null,
      media: mediaList,
    };

    try {
      setLoading(true);
      if (isEdit && id) {
        await api.updateWebsiteDivision(id, data);
        navigate('/ecosystem/divisions', { state: { toast: 'Division updated successfully!' } });
      } else {
        await api.createWebsiteDivision(data);
        navigate('/ecosystem/divisions', { state: { toast: 'Division created successfully!' } });
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to save division details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-12 animate-ios-slide-up pb-32">
      {/* Back button */}
      <div>
        <button 
          onClick={() => navigate('/ecosystem/divisions')}
          className="group flex items-center gap-2 text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Back to Divisions</span>
        </button>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-4xl font-black text-white tracking-tight uppercase">
          {isEdit ? 'Edit Division Card' : 'New Division Card'}
        </h1>
        <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">
          {isEdit ? 'Modify mock segment metadata' : 'Configure a new segment highlight card'}
        </p>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="glass-panel p-6 rounded-[2rem] border border-red-500/20 bg-red-500/5 text-red-400 text-xs font-bold flex items-center gap-2">
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="glass-panel border border-white/5 rounded-[2.5rem] p-10 space-y-8">
        
        {/* Name Input */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Division Name</label>
          <input 
            type="text"
            required
            placeholder="e.g. Destination Weddings"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full bg-white/5 border border-white/5 focus:border-white/20 rounded-2xl p-5 text-sm font-bold text-white outline-none transition-all"
          />
        </div>

        {/* Description Input */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1">Short Description</label>
          <textarea 
            required
            rows={3}
            placeholder="Describe the aesthetic and scope of this division segment..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-white/5 border border-white/5 focus:border-white/20 rounded-2xl p-5 text-sm font-bold text-white outline-none transition-all resize-none"
          />
        </div>

        {/* Instagram Link */}
        <div className="space-y-2">
          <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest px-1 flex items-center gap-2">
            <Instagram className="w-3.5 h-3.5" />
            <span>Instagram URL (Optional)</span>
          </label>
          <input 
            type="url"
            placeholder="https://www.instagram.com/..."
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
              Determine if the division profile segment is visible on the landing page
            </p>
          </div>
          <button
            type="button"
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

        {/* Media Upload Section */}
        <div className="space-y-6 pt-6 border-t border-white/5">
          <div>
            <h3 className="text-sm font-black text-white uppercase tracking-tight">Media Attachments</h3>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Configure up to 3 photos and 1 video reel (Simulated In-Browser)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MediaUploadCard type="photo" index={0} value={photos[0]} fileName={photoNames[0]} onChange={(e) => handlePhotoChange(0, e)} />
            <MediaUploadCard type="photo" index={1} value={photos[1]} fileName={photoNames[1]} onChange={(e) => handlePhotoChange(1, e)} />
            <MediaUploadCard type="photo" index={2} value={photos[2]} fileName={photoNames[2]} onChange={(e) => handlePhotoChange(2, e)} />
          </div>

          <div className="pt-4 flex justify-center">
            <div className="w-full md:w-1/2">
              <MediaUploadCard type="video" index={0} value={videos[0]} fileName={videoNames[0]} onChange={(e) => handleVideoChange(0, e)} />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-6 border-t border-white/5">
          <button 
            type="button"
            onClick={() => navigate('/ecosystem/divisions')}
            className="flex-1 py-4 bg-white/5 text-zinc-500 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/5 transition-all"
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="flex-1 py-4 bg-white text-black hover:bg-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-[0_0_35px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin text-black" />}
            <span>Save Division</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default WebsiteDivisionForm;
