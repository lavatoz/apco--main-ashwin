
import React, { useState, useEffect } from 'react';
import { 
  FileText, Upload, Download, 
  Search, 
  CheckCircle, Shield, User, Clock
} from 'lucide-react';

interface ArchiveFile {
    _id: string;
    name: string;
    mimetype: string;
    size: number;
    uploader: { name: string };
    createdAt: string;
    accessRoles: string[];
}

const FileManager: React.FC = () => {
    const [files, setFiles] = useState<ArchiveFile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchFiles = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/files", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setFiles(data);
            }
        } catch (err) {
            console.error("Failed to load files", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFiles();
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('accessRoles', JSON.stringify(['admin', 'staff', 'client']));

        try {
            const token = localStorage.getItem("token");
            const res = await fetch("http://localhost:5000/api/files/upload", {
                method: 'POST',
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });
            if (res.ok) {
                await fetchFiles();
            }
        } catch (err) {
            console.error("Upload failed", err);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDownload = async (fileId: string, fileName: string) => {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`http://localhost:5000/api/files/download/${fileId}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                a.remove();
            }
        } catch (err) {
            console.error("Download failed", err);
        }
    };

    const filteredFiles = files.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-10 animate-ios-slide-up pb-20">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Vault</h1>
                    <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] mt-1">Project Documents & Assets</p>
                </div>
                <label className="bg-white text-black px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-xl active:scale-95 cursor-pointer">
                    {isUploading ? <CheckCircle className="w-4 h-4 animate-bounce" /> : <Upload className="w-4 h-4" />}
                    {isUploading ? 'Securing...' : 'Upload Asset'}
                    <input type="file" className="hidden" onChange={handleUpload} disabled={isUploading} />
                </label>
            </div>

            <div className="relative group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-zinc-700 w-5 h-5 group-focus-within:text-white transition-all" />
                <input
                    type="text"
                    placeholder="Search documents by name..."
                    className="w-full pl-16 pr-6 py-6 bg-zinc-900/50 border border-white/5 squircle-lg text-sm font-bold text-white outline-none focus:bg-zinc-900 transition-all shadow-inner"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="bg-zinc-900/10 rounded-[2.5rem] border border-white/5 overflow-hidden">
                <div className="p-8">
                    {isLoading ? (
                        <div className="py-20 text-center animate-pulse">
                            <Shield className="w-10 h-10 mx-auto mb-4 text-zinc-800" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-800">Verifying Permissions...</p>
                        </div>
                    ) : filteredFiles.length === 0 ? (
                        <div className="py-20 text-center">
                            <FileText className="w-10 h-10 mx-auto mb-4 text-zinc-800" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-800">No documents indexed</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredFiles.map(file => (
                                <div key={file._id} className="glass-panel p-6 squircle-lg border border-white/5 hover:bg-white/5 transition-all group relative overflow-hidden">
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center text-blue-500 shadow-lg">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-xs font-black text-white uppercase truncate tracking-tight">{file.name}</h4>
                                            <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest mt-1">{(file.size / 1024).toFixed(1)} KB • {file.mimetype.split('/')[1]}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-[8px] font-black text-zinc-500 uppercase tracking-widest">
                                                <User className="w-2.5 h-2.5" /> {file.uploader?.name || 'System'}
                                            </div>
                                            <div className="flex items-center gap-2 text-[8px] font-black text-zinc-700 uppercase tracking-widest">
                                                <Clock className="w-2.5 h-2.5" /> {new Date(file.createdAt).toLocaleDateString()}
                                            </div>
                                        </div>
                                        <button 
                                            onClick={() => handleDownload(file._id, file.name)}
                                            className="p-3 bg-white/5 text-zinc-400 hover:text-white rounded-xl transition-all shadow-xl active:scale-90"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FileManager;
