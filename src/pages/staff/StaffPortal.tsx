import { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { getAuthUser } from '../../utils/storage';
import { type Task, type Client, type AttendanceRecord, type Equipment } from '../../types';
import { 
    Calendar, CheckSquare, UploadCloud, Clock, 
    Camera, User, AlertCircle, FileVideo, 
    MapPin, Play, UserCircle, Briefcase,
    Download, Trash2, FileText, Image, Loader
} from 'lucide-react';

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

const StaffPortal = () => {
    const user = getAuthUser();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [clients, setClients] = useState<Client[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);

    const [isClockedIn, setIsClockedIn] = useState(false);
    const [currentSession, setCurrentSession] = useState<AttendanceRecord | null>(null);

    // Upload state
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Gallery');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [projectFiles, setProjectFiles] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const fetchFiles = useCallback(async (projId: string) => {
        if (!projId) return;
        try {
            const filesData = await api.getFilesByProject(projId);
            setProjectFiles(filesData || []);
        } catch (err) {
            console.error("Failed to load project files", err);
        }
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setSelectedFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!selectedProjectId || !selectedFile) return;
        setIsUploading(true);
        setUploadProgress(0);
        try {
            await api.uploadProjectFileWithProgress(
                selectedProjectId,
                selectedCategory,
                selectedFile,
                false,
                (percent) => {
                    setUploadProgress(percent);
                }
            );
            setSelectedFile(null);
            setUploadProgress(null);
            const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
            fetchFiles(selectedProjectId);
        } catch (err: any) {
            console.error("Upload failed", err);
            alert(err.message || "Upload failed");
            setUploadProgress(null);
        } finally {
            setIsUploading(false);
        }
    };

    const handleDeleteFile = async (fileId: string) => {
        if (!window.confirm("Are you sure you want to delete this file?")) return;
        try {
            await api.deleteProjectFile(fileId);
            fetchFiles(selectedProjectId);
        } catch (err: any) {
            console.error("Deletion failed", err);
            alert(err.message || "Failed to delete file");
        }
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [t, c, a, e, p] = await Promise.all([
                api.getTasks(),
                api.getClients(),
                api.getAttendance(user?.id || ''),
                api.getEquipment(user?.id || ''),
                api.getProjects()
            ]);
            setTasks(t);
            setClients(c);
            setAttendance(a);
            setEquipment(e);
            setProjects(p || []);

            const activeSession = a.find(record => !record.clockOut);
            if (activeSession) {
                setIsClockedIn(true);
                setCurrentSession(activeSession);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const myTasks = tasks.filter(t => t.assignee === user?.name);
    const pendingTasks = myTasks.filter(t => t.status !== 'Completed');

    // Find clients where this user is assigned
    const myClients = clients.filter(c => 
        c.assignedCoordinatorId === user?.id ||
        c.assignedPhotographerId === user?.id ||
        c.assignedVideographerId === user?.id ||
        c.assignedEditorId === user?.id ||
        // Check legacy assignment formats
        c.people?.some(p => p.loginId === user?.id)
    );

    const myEvents = myClients.flatMap(c => 
        (c.events || []).map(e => ({ ...e, clientName: c.name, projectName: c.projectName }))
    ).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const activeEvents = myEvents.filter(e => e.status !== 'Completed' && e.status !== 'Cancelled');

    const handleClockIn = async () => {
        const newRecord = {
            id: `att_${Date.now()}`,
            staffId: user?.id || '',
            date: new Date().toISOString().split('T')[0],
            clockIn: new Date().toISOString()
        };
        await api.saveAttendance(newRecord);
        setIsClockedIn(true);
        setCurrentSession(newRecord);
        loadData();
    };

    const handleClockOut = async () => {
        if (!currentSession) return;
        const outTime = new Date();
        const inTime = new Date(currentSession.clockIn);
        const hours = (outTime.getTime() - inTime.getTime()) / (1000 * 60 * 60);

        const updated = {
            ...currentSession,
            clockOut: outTime.toISOString(),
            totalHours: Number(hours.toFixed(2))
        };
        await api.saveAttendance(updated);
        setIsClockedIn(false);
        setCurrentSession(null);
        loadData();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-8 h-8 border-2 border-primary/20 border-t-emerald-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="animate-ios-slide-up space-y-8 pb-32">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-4 mt-2">
                <div className="space-y-1">
                    <h1 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter shrink-0">My Workspace</h1>
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Welcome back, {user?.name}</p>
                </div>
                <div className="flex items-center gap-4">
                    {!isClockedIn ? (
                        <button onClick={handleClockIn} className="touch-target px-6 py-3 bg-primary/10 text-primary rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-primary/20 transition-all flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Clock In
                        </button>
                    ) : (
                        <button onClick={handleClockOut} className="touch-target px-6 py-3 bg-red-500/10 text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-red-500/20 transition-all flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Clock Out
                        </button>
                    )}
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b border-white/5 mt-8 sticky top-0 z-40 bg-black/80 backdrop-blur-xl pt-4 overflow-x-auto no-scrollbar pb-2">
                {[
                    { id: 'dashboard', label: 'Dashboard', icon: Briefcase },
                    { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
                    { id: 'events', label: 'My Events', icon: Calendar },
                    { id: 'uploads', label: 'Upload Center', icon: UploadCloud },
                    { id: 'attendance', label: 'Attendance', icon: Clock },
                    { id: 'equipment', label: 'Equipment', icon: Camera },
                    { id: 'profile', label: 'Profile', icon: User }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`touch-target px-4 md:px-8 py-3 md:py-4 rounded-t-2xl font-black uppercase text-[10px] md:text-[11px] tracking-widest transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id
                            ? 'bg-zinc-900 text-white border-t border-x border-white/5 shadow-[0_-10px_20px_rgba(0,0,0,0.5)] z-10'
                            : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/5 border-t border-x border-transparent translate-y-1'
                            }`}
                    >
                        <tab.icon className="w-3 h-3 md:w-4 md:h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="pt-8 relative">
                {/* DASHBOARD TAB */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-8 animate-ios-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="glass-panel p-6 squircle-sm border border-white/5 bg-gradient-to-br from-indigo-500/10 to-transparent">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Active Events</h3>
                                    <Calendar className="w-5 h-5 text-indigo-400 opacity-50" />
                                </div>
                                <p className="text-4xl font-black text-white">{activeEvents.length}</p>
                            </div>
                            <div className="glass-panel p-6 squircle-sm border border-white/5 bg-gradient-to-br from-amber-500/10 to-transparent">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Pending Tasks</h3>
                                    <CheckSquare className="w-5 h-5 text-amber-400 opacity-50" />
                                </div>
                                <p className="text-4xl font-black text-white">{pendingTasks.length}</p>
                            </div>
                            <div className="glass-panel p-6 squircle-sm border border-white/5 bg-gradient-to-br from-emerald-500/10 to-transparent">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Assigned Equipment</h3>
                                    <Camera className="w-5 h-5 text-emerald-400 opacity-50" />
                                </div>
                                <p className="text-4xl font-black text-white">{equipment.length}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Upcoming Events */}
                            <div className="glass-panel p-8 squircle-md border border-white/5">
                                <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-6">Upcoming Shoots</h3>
                                <div className="space-y-4">
                                    {activeEvents.slice(0, 3).map(ev => (
                                        <div key={ev.id} className="p-4 bg-black/50 rounded-2xl border border-white/5">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="text-sm font-black text-white uppercase tracking-wider">{ev.name}</h4>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded">{ev.status}</span>
                                            </div>
                                            <p className="text-xs text-zinc-400 font-bold mb-3">{ev.clientName} - {ev.projectName}</p>
                                            <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                                                <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {ev.date}</span>
                                                {ev.venueLocation && <span className="flex items-center gap-1.5"><MapPin className="w-3 h-3" /> {ev.venueLocation}</span>}
                                            </div>
                                        </div>
                                    ))}
                                    {activeEvents.length === 0 && (
                                        <p className="text-xs text-zinc-600 font-mono text-center py-6 uppercase tracking-widest">No upcoming events</p>
                                    )}
                                </div>
                            </div>

                            {/* Pending Tasks */}
                            <div className="glass-panel p-8 squircle-md border border-white/5">
                                <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-6">Today's Tasks</h3>
                                <div className="space-y-4">
                                    {pendingTasks.slice(0, 5).map(task => (
                                        <div key={task.id} className="p-4 bg-black/50 rounded-2xl border border-white/5 flex items-start gap-4">
                                            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-1">
                                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-white uppercase tracking-wider mb-1">{task.title}</h4>
                                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Priority: {task.priority} • Due: {task.dueDate}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {pendingTasks.length === 0 && (
                                        <p className="text-xs text-zinc-600 font-mono text-center py-6 uppercase tracking-widest">All caught up!</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MY TASKS TAB */}
                {activeTab === 'tasks' && (
                    <div className="space-y-6 animate-ios-fade-in">
                        {myTasks.map(task => (
                            <div key={task.id} className="p-6 glass-panel border border-white/5 squircle-sm flex items-center justify-between">
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-wider mb-2">{task.title}</h4>
                                    <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                                        <span className={`px-2 py-1 rounded bg-white/5 ${task.priority === 'High' ? 'text-red-400' : 'text-zinc-400'}`}>{task.priority}</span>
                                        <span>Status: {task.status}</span>
                                        <span>Due: {task.dueDate}</span>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <button className="touch-target px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white transition-all">
                                        Update
                                    </button>
                                </div>
                            </div>
                        ))}
                        {myTasks.length === 0 && (
                            <div className="p-16 border border-white/5 border-dashed rounded-3xl flex flex-col items-center text-center bg-white/[0.01]">
                                <CheckSquare className="w-10 h-10 text-zinc-700 mb-4" />
                                <p className="text-xs font-black text-white uppercase tracking-[0.2em] mb-2">No Assigned Tasks</p>
                            </div>
                        )}
                    </div>
                )}

                {/* MY EVENTS TAB */}
                {activeTab === 'events' && (
                    <div className="space-y-6 animate-ios-fade-in">
                        {myEvents.map(ev => (
                            <div key={ev.id} className="p-6 glass-panel border border-white/5 squircle-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-wider mb-2">{ev.name}</h4>
                                    <p className="text-xs text-zinc-400 font-bold mb-3">{ev.clientName} - {ev.projectName}</p>
                                    <div className="flex flex-wrap items-center gap-4 text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {ev.date}</span>
                                        {ev.startTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {ev.startTime}</span>}
                                        {ev.venueLocation && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ev.venueLocation}</span>}
                                    </div>
                                </div>
                                <div className="shrink-0">
                                    <span className="px-3 py-1.5 bg-white/5 text-white rounded text-[10px] font-black uppercase tracking-widest">{ev.status}</span>
                                </div>
                            </div>
                        ))}
                        {myEvents.length === 0 && (
                            <div className="p-16 border border-white/5 border-dashed rounded-3xl flex flex-col items-center text-center bg-white/[0.01]">
                                <Calendar className="w-10 h-10 text-zinc-700 mb-4" />
                                <p className="text-xs font-black text-white uppercase tracking-[0.2em] mb-2">No Assigned Events</p>
                            </div>
                        )}
                    </div>
                )}

                {/* UPLOAD CENTER TAB */}
                {activeTab === 'uploads' && (
                    <div className="space-y-8 animate-ios-fade-in">
                        <div className="glass-panel p-8 squircle-md border border-white/5 bg-gradient-to-br from-indigo-500/10 to-transparent">
                            <div className="max-w-2xl mx-auto space-y-8">
                                <div className="text-center">
                                    <UploadCloud className="w-12 h-12 text-indigo-400 mx-auto mb-4 animate-pulse" />
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tight">Media Upload Center</h2>
                                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-2">Upload and link deliverables to your projects</p>
                                </div>

                                <div className="space-y-6 bg-black/50 p-8 rounded-3xl border border-white/5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Select Project</label>
                                            <select 
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all appearance-none" 
                                                value={selectedProjectId} 
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setSelectedProjectId(val);
                                                    fetchFiles(val);
                                                }}
                                            >
                                                <option value="" className="bg-zinc-900">-- Choose Project --</option>
                                                {projects.map(p => (
                                                    <option key={p.id} value={p.id} className="bg-zinc-900">{p.name} ({p.status})</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Upload Category</label>
                                            <select 
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all appearance-none" 
                                                value={selectedCategory} 
                                                onChange={e => setSelectedCategory(e.target.value)}
                                            >
                                                {['Gallery', 'Deliverables', 'Agreements', 'Invoices', 'Quotations', 'Raw Uploads'].map(cat => (
                                                    <option key={cat} value={cat} className="bg-zinc-900">{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Custom Drag & Drop / Selection UI */}
                                    <div 
                                        onClick={() => document.getElementById('file-upload-input')?.click()}
                                        className="border-2 border-dashed border-white/10 hover:border-indigo-500/50 rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer bg-white/[0.01] hover:bg-white/[0.03]"
                                    >
                                        <input 
                                            type="file" 
                                            id="file-upload-input" 
                                            className="hidden" 
                                            onChange={handleFileChange}
                                        />
                                        <FileVideo className="w-10 h-10 text-zinc-500 mb-4" />
                                        {selectedFile ? (
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-white">{selectedFile.name}</p>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">{formatBytes(selectedFile.size)}</p>
                                            </div>
                                        ) : (
                                            <>
                                                <p className="text-sm font-bold text-white mb-1">Click to browse or drop file here</p>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Max size: 100MB</p>
                                            </>
                                        )}
                                    </div>

                                    {isUploading && uploadProgress !== null && (
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                                <span>Uploading to Google Drive...</span>
                                                <span>{uploadProgress}%</span>
                                            </div>
                                            <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                                                <div 
                                                    className="bg-indigo-500 h-1.5 rounded-full transition-all duration-300" 
                                                    style={{ width: `${uploadProgress}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <button 
                                        disabled={!selectedProjectId || !selectedFile || isUploading} 
                                        onClick={handleUpload}
                                        className="touch-target w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader className="w-4 h-4 animate-spin" />
                                                Uploading...
                                            </>
                                        ) : (
                                            'Start Upload'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {selectedProjectId && (
                            <div className="glass-panel p-8 squircle-md border border-white/5 space-y-6">
                                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                    <h3 className="text-xs font-black uppercase text-zinc-500 tracking-[0.2em]">Project Uploads Registry</h3>
                                    <span className="text-[10px] font-mono text-zinc-500">{projectFiles.length} files total</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {projectFiles.map((file: any) => {
                                        const isImage = file.mimeType?.startsWith('image/');
                                        return (
                                            <div key={file.id} className="p-4 bg-black/50 rounded-2xl border border-white/5 flex items-center justify-between gap-4">
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                                                        {isImage ? (
                                                            <Image className="w-5 h-5 text-indigo-400" />
                                                        ) : (
                                                            <FileText className="w-5 h-5 text-emerald-400" />
                                                        )}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h4 className="text-xs font-black text-white truncate uppercase tracking-wider mb-1" title={file.fileName}>{file.fileName}</h4>
                                                        <div className="flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-widest">
                                                            <span className={`px-2 py-0.5 rounded text-[8px] ${
                                                                file.category === 'Gallery' ? 'bg-purple-500/10 text-purple-400' :
                                                                file.category === 'Deliverables' ? 'bg-emerald-500/10 text-emerald-400' :
                                                                file.category === 'Agreements' ? 'bg-blue-500/10 text-blue-400' :
                                                                file.category === 'Invoices' || file.category === 'Quotations' ? 'bg-amber-500/10 text-amber-400' :
                                                                'bg-zinc-500/10 text-zinc-400'
                                                            }`}>
                                                                {file.category}
                                                            </span>
                                                            <span className="text-zinc-600">•</span>
                                                            <span className="text-zinc-500">{formatDate(file.uploadedAt)}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 shrink-0">
                                                    <button 
                                                        onClick={() => api.downloadProjectFile(file.id, file.fileName)}
                                                        className="touch-target p-2 bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white rounded-xl transition-all"
                                                        title="Download file"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteFile(file.id)}
                                                        className="touch-target p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all"
                                                        title="Delete file"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {projectFiles.length === 0 && (
                                        <div className="col-span-full py-12 text-center border border-dashed border-white/5 rounded-2xl">
                                            <p className="text-xs text-zinc-600 font-mono uppercase tracking-widest">No files uploaded to this project yet.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* ATTENDANCE TAB */}
                {activeTab === 'attendance' && (
                    <div className="space-y-6 animate-ios-fade-in">
                        <div className="glass-panel p-8 squircle-md border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight mb-1">Current Status</h3>
                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                    {isClockedIn ? `Clocked in at ${new Date(currentSession?.clockIn || '').toLocaleTimeString()}` : 'Not clocked in'}
                                </p>
                            </div>
                            <div>
                                {!isClockedIn ? (
                                    <button onClick={handleClockIn} className="touch-target px-8 py-4 bg-primary text-black rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-emerald-400 transition-all flex items-center gap-2">
                                        <Play className="w-4 h-4" /> Clock In Now
                                    </button>
                                ) : (
                                    <button onClick={handleClockOut} className="touch-target px-8 py-4 bg-red-500 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-red-400 transition-all flex items-center gap-2">
                                        <Clock className="w-4 h-4" /> Clock Out
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="glass-panel p-8 squircle-md border border-white/5">
                            <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] mb-6">Attendance History</h3>
                            <div className="space-y-4">
                                {attendance.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(record => (
                                    <div key={record.id} className="p-4 bg-black/50 rounded-2xl border border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                                                <Calendar className="w-4 h-4 text-zinc-400" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-white uppercase tracking-wider">{new Date(record.date).toLocaleDateString()}</h4>
                                                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                                                    In: {new Date(record.clockIn).toLocaleTimeString()} {record.clockOut && `• Out: ${new Date(record.clockOut).toLocaleTimeString()}`}
                                                </p>
                                            </div>
                                        </div>
                                        {record.totalHours ? (
                                            <div className="text-right">
                                                <p className="text-lg font-black text-white">{record.totalHours}h</p>
                                                <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Total</p>
                                            </div>
                                        ) : (
                                            <span className="px-3 py-1 bg-amber-500/10 text-amber-500 rounded text-[9px] font-black uppercase tracking-widest">Active</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* EQUIPMENT TAB */}
                {activeTab === 'equipment' && (
                    <div className="space-y-6 animate-ios-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {equipment.map(eq => (
                                <div key={eq.id} className="p-6 glass-panel border border-white/5 squircle-sm">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                                            <Camera className="w-5 h-5 text-white" />
                                        </div>
                                        <span className="px-2 py-1 bg-primary/10 text-primary rounded text-[9px] font-black uppercase tracking-widest">{eq.status}</span>
                                    </div>
                                    <h4 className="text-lg font-black text-white uppercase tracking-tight mb-1">{eq.name}</h4>
                                    <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Type: {eq.type} • S/N: {eq.serialNumber}</p>
                                </div>
                            ))}
                        </div>
                        {equipment.length === 0 && (
                            <div className="p-16 border border-white/5 border-dashed rounded-3xl flex flex-col items-center text-center bg-white/[0.01]">
                                <Camera className="w-10 h-10 text-zinc-700 mb-4" />
                                <p className="text-xs font-black text-white uppercase tracking-[0.2em] mb-2">No Equipment Assigned</p>
                            </div>
                        )}
                    </div>
                )}

                {/* PROFILE TAB */}
                {activeTab === 'profile' && (
                    <div className="glass-panel p-8 squircle-md border border-white/5 animate-ios-fade-in">
                        <div className="flex flex-col md:flex-row items-center gap-8">
                            <div className="w-32 h-32 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                                <UserCircle className="w-16 h-16 text-zinc-500" />
                            </div>
                            <div className="text-center md:text-left space-y-2">
                                <h2 className="text-3xl font-black text-white uppercase tracking-tight">{user?.name}</h2>
                                <p className="text-sm font-bold text-zinc-400">{user?.email}</p>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 pt-2">
                                    <span className="px-3 py-1 bg-white/5 text-zinc-300 rounded text-[10px] font-black uppercase tracking-widest border border-white/10">{user?.role}</span>
                                    {user?.staffRole && <span className="px-3 py-1 bg-white/5 text-zinc-300 rounded text-[10px] font-black uppercase tracking-widest border border-white/10">{user?.staffRole}</span>}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StaffPortal;

