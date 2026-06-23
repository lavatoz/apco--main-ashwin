import React, { useState, useEffect } from 'react';
import { ImageIcon, Video, FileText, Download, AlertCircle } from 'lucide-react';
import type { Client } from '../../types';
import { api } from '../../services/api';
import ClientPageLoader from './ClientPageLoader';

interface ClientDeliverablesProps {
  client: Client | null;
}

const formatBytes = (bytes: number, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

const formatDate = (dateStr: string) => {
    try {
        return new Date(dateStr).toLocaleDateString(undefined, {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch {
        return dateStr;
    }
};

const ClientDeliverables: React.FC<ClientDeliverablesProps> = ({ client }) => {
  const [files, setFiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeliverables = async () => {
      if (!client) return;
      setLoading(true);
      try {
        const allProjects = await api.getProjects();
        const clientProjects = allProjects.filter(p => p.clientId === client.id);
        const mainProject = clientProjects[0];
        if (mainProject) {
          const [deliverables, editedVideos] = await Promise.all([
            api.getFilesByProject(mainProject.id, 'Deliverables').catch(() => []),
            api.getFilesByProject(mainProject.id, 'Edited Videos').catch(() => [])
          ]);
          const merged = [...(deliverables || []), ...(editedVideos || [])];
          const uniqueMap = new Map<string, any>();
          merged.forEach(f => {
            if (f && f.id) uniqueMap.set(f.id, f);
          });
          const uniqueFiles = Array.from(uniqueMap.values());
          uniqueFiles.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
          setFiles(uniqueFiles);
        }
      } catch (err) {
        console.error("Failed to load deliverables", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDeliverables();
  }, [client?.id]);

  if (!client) return <ClientPageLoader />;
  if (loading) return <ClientPageLoader />;

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.startsWith('image/')) return <ImageIcon className="w-6 h-6" />;
    if (mimeType?.startsWith('video/')) return <Video className="w-6 h-6" />;
    return <FileText className="w-6 h-6" />;
  };

  return (
    <div className="p-8 md:p-12 animate-ios-slide-up max-w-[1400px] mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">Deliverables</h1>
          <p className="text-xl text-zinc-400 font-medium">Final Assets & Exports</p>
        </div>
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 px-4 py-2 rounded-2xl border border-emerald-500/20">
          <FileText className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">{files.length} Files</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {files.map((file) => (
          <div 
            key={file.id} 
            className="glass-panel p-8 squircle-lg group hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden flex flex-col h-full border border-white/5 hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(52,211,153,0.1)]"
          >
            <div className="mb-10 flex justify-between items-start">
              <div className="p-4 rounded-2xl bg-white/5 text-zinc-400 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                {getFileIcon(file.mimeType)}
              </div>
              <button 
                onClick={() => api.downloadProjectFile(file.id, file.fileName)}
                className="p-3 bg-white/5 rounded-full hover:bg-white text-zinc-400 hover:text-black transition-all"
                title="Download file"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
            
            <h3 className="text-xl font-black uppercase tracking-tight mb-2 group-hover:text-emerald-400 transition-colors truncate" title={file.fileName}>
              {file.fileName}
            </h3>
            
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-6">
              Size: {formatBytes(file.size || 0)}
            </p>
            
            <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
              <p className="text-[9px] font-mono text-zinc-600">Uploaded {formatDate(file.uploadedAt)}</p>
              <span className="text-[9px] font-black uppercase text-zinc-600 bg-white/5 px-2 py-1 rounded">G-Drive</span>
            </div>
          </div>
        ))}

        {files.length === 0 && (
          <div className="col-span-full py-20 text-center glass-panel border border-dashed rounded-[2rem] border-white/10">
            <AlertCircle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-lg font-black uppercase text-zinc-400 mb-2">No Deliverables</h3>
            <p className="text-xs text-zinc-600 uppercase tracking-widest">Your final assets will be listed here once published.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDeliverables;
