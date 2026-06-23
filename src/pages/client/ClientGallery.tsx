import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Lock, Download, Maximize2, X, Loader } from 'lucide-react';
import type { Client } from '../../types';
import { api } from '../../services/api';
import { files as filesApi } from '../../services/api/files';
import ClientPageLoader from './ClientPageLoader';

interface ClientGalleryProps {
  client: Client | null;
}

const SecureImage: React.FC<{ fileId: string; alt: string; className?: string }> = ({ fileId, alt, className }) => {
  const [src, setSrc] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    let objectUrl = '';
    const loadSecure = async () => {
      try {
        const blob = await filesApi.getFileBlob(fileId);
        if (active) {
          objectUrl = URL.createObjectURL(blob);
          setSrc(objectUrl);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setLoading(false);
      }
    };
    loadSecure();

    return () => {
      active = false;
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [fileId]);

  if (loading) {
    return (
      <div className="w-full h-full bg-zinc-950 flex items-center justify-center min-h-[200px]">
        <Loader className="w-6 h-6 text-zinc-700 animate-spin" />
      </div>
    );
  }

  return <img src={src} alt={alt} className={className} />;
};

const ClientGallery: React.FC<ClientGalleryProps> = ({ client }) => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previewFile, setPreviewFile] = useState<any | null>(null);

  useEffect(() => {
    const fetchGalleryFiles = async () => {
      if (!client) return;
      setLoading(true);
      try {
        const allProjects = await api.getProjects();
        const clientProjects = allProjects.filter(p => p.clientId === client.id);
        const mainProject = clientProjects[0];
        if (mainProject) {
          const [rawPhotos, editedPhotos, legacyGallery] = await Promise.all([
            filesApi.getFilesByProject(mainProject.id, 'Raw Photos').catch(() => []),
            filesApi.getFilesByProject(mainProject.id, 'Edited Photos').catch(() => []),
            filesApi.getFilesByProject(mainProject.id, 'Gallery').catch(() => [])
          ]);

          const merged = [...(rawPhotos || []), ...(editedPhotos || []), ...(legacyGallery || [])];

          const uniqueMap = new Map<string, any>();
          merged.forEach(f => {
            if (f && f.id) {
              uniqueMap.set(f.id, f);
            }
          });

          const uniqueFiles = Array.from(uniqueMap.values());
          uniqueFiles.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
          setFiles(uniqueFiles);
        }
      } catch (err) {
        console.error("Failed to load gallery files", err);
      } finally {
        setLoading(false);
      }
    };
    fetchGalleryFiles();

  }, [client?.id]);

  if (!client) return <ClientPageLoader />;
  if (loading) return <ClientPageLoader />;

  return (
    <div className="p-8 md:p-12 animate-ios-slide-up max-w-[1400px] mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">Gallery</h1>
          <p className="text-xl text-zinc-400 font-medium">Curated Asset Collections</p>
        </div>
        <div className="inline-flex items-center gap-2 bg-purple-500/10 px-4 py-2 rounded-2xl border border-purple-500/20">
          <ImageIcon className="w-4 h-4 text-purple-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">{files.length} Photos</span>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="glass-panel p-16 squircle-lg text-center max-w-2xl mx-auto border border-dashed border-white/10">
          <Lock className="w-16 h-16 text-zinc-600 mx-auto mb-6" />
          <h2 className="text-2xl font-black uppercase tracking-tight mb-4">Gallery Empty or Curating</h2>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto mb-8">
            Your high-resolution gallery is currently being curated by our editors. You will receive a notification once it's available for viewing.
          </p>
          <div className="inline-block px-6 py-3 bg-white/5 rounded-full border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Status: {client.status || 'Active'}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {files.map((file) => (
            <div
              key={file.id}
              className="group relative aspect-[3/4] rounded-[2rem] overflow-hidden bg-zinc-950 border border-white/[0.03] hover:border-purple-500/50 transition-all duration-500 shadow-lg cursor-pointer"
              onClick={() => setPreviewFile(file)}
            >
              <SecureImage
                fileId={file.id}
                alt={file.fileName}
                className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-40 group-hover:opacity-80 transition-opacity duration-500" />

              <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col justify-end translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500">
                <p className="text-xs font-black text-white truncate uppercase tracking-wider mb-3" title={file.fileName}>
                  {file.fileName}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setPreviewFile(file);
                    }}
                    className="flex-1 py-3 bg-white/10 hover:bg-white text-zinc-300 hover:text-black rounded-xl backdrop-blur-xl transition-all border border-white/15 flex items-center justify-center gap-2"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Preview</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      filesApi.downloadProjectFile(file.id, file.fileName);
                    }}
                    className="p-3 bg-purple-500 hover:bg-purple-400 text-white rounded-xl transition-all shadow-md flex items-center justify-center"
                    title="Download Photo"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox Modal */}
      {previewFile && (
        <div
          className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 md:p-16 animate-ios-slide-up"
          onClick={() => setPreviewFile(null)}
        >
          <button
            className="absolute top-8 right-8 p-4 bg-white/5 hover:bg-white/10 rounded-full text-white transition-all z-[210] border border-white/10"
            onClick={() => setPreviewFile(null)}
          >
            <X className="w-6 h-6" />
          </button>

          <div
            className="relative w-full max-w-5xl h-full flex flex-col items-center justify-center gap-6"
            onClick={e => e.stopPropagation()}
          >
            <div className="relative flex-1 flex items-center justify-center overflow-hidden rounded-3xl border border-white/5 bg-zinc-950/50 shadow-2xl">
              <SecureImage
                fileId={previewFile.id}
                alt={previewFile.fileName}
                className="max-w-full max-h-full object-contain animate-ios-zoom-in"
              />
            </div>

            <div className="flex items-center justify-between w-full max-w-2xl px-4 animate-ios-slide-up">
              <p className="text-sm font-black text-white uppercase tracking-wider truncate max-w-md" title={previewFile.fileName}>
                {previewFile.fileName}
              </p>
              <button
                onClick={() => filesApi.downloadProjectFile(previewFile.id, previewFile.fileName)}
                className="px-8 py-4 bg-white hover:bg-zinc-200 text-black rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center gap-2 shadow-lg"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientGallery;
