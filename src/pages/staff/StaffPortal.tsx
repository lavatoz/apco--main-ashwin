import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { api } from '../../services/api';
import { useCompanySettings } from '../../hooks/useCompanySettings';
import { getAuthUser } from '../../utils/storage';
import { type Task, type AttendanceRecord, type Equipment } from '../../types';
import { 
    Calendar, CheckSquare, UploadCloud, Clock, 
    Camera, User, AlertCircle, FileVideo, 
    MapPin, Play, UserCircle, Briefcase,
    Download, Trash2, FileText, Image, Loader,
    Phone, X, ChevronRight
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

const formatOnlyDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        return d.toLocaleDateString(undefined, {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    } catch {
        return dateStr;
    }
};

interface StaffPortalProps {
    selectedBrand?: string;
}

const StaffPortal: React.FC<StaffPortalProps> = ({ selectedBrand = 'All' }) => {
    const user = getAuthUser();

    const [activeTab, setActiveTab] = useState('dashboard');
    const [tasks, setTasks] = useState<Task[]>([]);
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [selectedTask, setSelectedTask] = useState<any | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [updatingTaskId, setUpdatingTaskId] = useState<string | null>(null);
    const [isSavingStatus, setIsSavingStatus] = useState(false);

    const [isClockedIn, setIsClockedIn] = useState(false);
    const [currentSession, setCurrentSession] = useState<AttendanceRecord | null>(null);

    // Upload state
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [selectedEventId, setSelectedEventId] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Raw Photos');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [uploadingIndex, setUploadingIndex] = useState(0);
    const [currentFileProgress, setCurrentFileProgress] = useState(0);
    const [projectFiles, setProjectFiles] = useState<any[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadNotification, setUploadNotification] = useState<{
        type: 'success' | 'failure';
        title: string;
        message: string;
        project: string;
        category: string;
        successCount: number;
        failedCount: number;
        duplicateCount?: number;
        failedFiles?: string[];
    } | null>(null);

    // Client-side local session maps for resolving event & uploader metadata for recent uploads
    const [localFileEventMap, setLocalFileEventMap] = useState<Record<string, string>>({});
    const [localFileUploaderMap, setLocalFileUploaderMap] = useState<Record<string, string>>({});

    const selectedProject = projects.find(p => p.id === selectedProjectId);
    const selectedProjectEvents = selectedProject?.client?.events || [];
    const selectedEvent = selectedProjectEvents.find((e: any) => e.id === selectedEventId);

    const fetchFiles = useCallback(async (projId: string) => {
        if (!projId) return;
        try {
            const filesData = await api.getFilesByProject(projId);
            setProjectFiles(filesData || []);
        } catch (err) {
            console.error("Failed to load project files", err);
        }
    }, []);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            const filesArray = Array.from(e.dataTransfer.files);
            setSelectedFiles(prev => [...prev, ...filesArray]);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const filesArray = Array.from(e.target.files);
            setSelectedFiles(prev => [...prev, ...filesArray]);
        }
    };

    const handleUpload = async () => {
        if (isUploading) return;
        if (!selectedProjectId) {
            alert("No project selected.");
            return;
        }
        if (selectedFiles.length === 0) return;
        
        setIsUploading(true);
        setUploadingIndex(0);
        setCurrentFileProgress(0);

        let successCount = 0;
        let failedCount = 0;
        let duplicateCount = 0;
        const failedFiles: string[] = [];

        const targetProjectId = selectedProjectId;
        const targetCategory = selectedCategory;
        const targetEventId = selectedEventId;
        const filesToUpload = [...selectedFiles];

        for (let i = 0; i < filesToUpload.length; i++) {
            setUploadingIndex(i);
            setCurrentFileProgress(0);

            // Verify project context before each file upload
            if (!targetProjectId || !selectedProjectId) {
                console.error("Upload aborted: No project selected.");
                const remaining = filesToUpload.length - i;
                failedCount += remaining;
                for (let j = i; j < filesToUpload.length; j++) {
                    failedFiles.push(filesToUpload[j].name);
                }
                break;
            }

            const file = filesToUpload[i];
            try {
                const response = await api.uploadProjectFileWithProgress(
                    targetProjectId,
                    targetCategory,
                    file,
                    false,
                    (percent) => {
                        setCurrentFileProgress(percent);
                    }
                );

                if (response && response.duplicate) {
                    duplicateCount++;
                } else {
                    if (response && response.id) {
                        const eventName = selectedProjectEvents.find((e: any) => e.id === targetEventId)?.name || '';
                        if (eventName) {
                            setLocalFileEventMap(prev => ({ ...prev, [response.id]: eventName }));
                        }
                        if (user?.name) {
                            setLocalFileUploaderMap(prev => ({ ...prev, [response.id]: user.name }));
                        }
                    }
                    successCount++;
                }
            } catch (err: any) {
                console.error(`Upload failed for file ${file.name}:`, err);
                failedCount++;
                failedFiles.push(file.name);
            }
        }

        const projectName = projects.find(p => p.id === targetProjectId)?.name || 'Unknown Project';
        const summaryMessage = `✅ ${successCount} file(s) uploaded successfully.\n⚠️ ${duplicateCount} duplicate file(s) were skipped.`;

        if (failedCount === 0) {
            setUploadNotification({
                type: 'success',
                title: 'Upload Complete',
                message: summaryMessage,
                project: projectName,
                category: targetCategory,
                successCount,
                failedCount,
                duplicateCount
            });
            setTimeout(() => {
                setUploadNotification(prev => prev?.type === 'success' ? null : prev);
            }, 5000);
        } else {
            const failureMessage = `✅ ${successCount} file(s) uploaded successfully.\n⚠️ ${duplicateCount} duplicate file(s) were skipped.\n❌ ${failedCount} file(s) failed to upload.`;
            setUploadNotification({
                type: 'failure',
                title: 'Upload Finished With Errors',
                message: failureMessage,
                project: projectName,
                category: targetCategory,
                successCount,
                failedCount,
                duplicateCount,
                failedFiles
            });
        }

        setSelectedFiles([]);
        setUploadingIndex(0);
        setCurrentFileProgress(0);
        const fileInput = document.getElementById('file-upload-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        try {
            fetchFiles(targetProjectId);
            const updatedProjects = await api.getProjects();
            setProjects(updatedProjects || []);
            window.dispatchEvent(new CustomEvent('projects-updated'));
        } catch (refreshErr) {
            console.error("Failed to refresh data after upload:", refreshErr);
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
            const [t, a, e, p] = await Promise.all([
                api.getTasks(),
                api.getAttendance(user?.id || ''),
                api.getEquipment(user?.id || ''),
                api.getProjects()
            ]);
            setTasks(t);
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
        const searchParams = new URLSearchParams(window.location.search);
        const tabParam = searchParams.get('tab');
        if (tabParam) {
            setActiveTab(tabParam);
        }
        const handleSync = () => {
            loadData();
        };
        window.addEventListener('tasks-updated', handleSync);
        return () => window.removeEventListener('tasks-updated', handleSync);
    }, [loadData]);

    const { companies } = useCompanySettings();
    const selectedCompany = selectedBrand === 'All'
        ? null
        : companies.find(c => c.id === selectedBrand);

    const filteredTasks = selectedBrand === 'All' ? tasks : tasks.filter(t => {
        if ((t as any).companyId === selectedBrand ||
            t.brand === selectedBrand ||
            t.divisionId === selectedBrand
        ) {
            return true;
        }

        const taskClient = (t as any).client;
        if (taskClient) {
            if (taskClient.companyId === selectedBrand ||
                taskClient.brandId === selectedBrand ||
                taskClient.divisionId === selectedBrand
            ) {
                return true;
            }
            if (selectedCompany) {
                const companyLower = selectedCompany.companyName.trim().toLowerCase();
                if ((taskClient.brand || '').trim().toLowerCase() === companyLower ||
                    (taskClient.companyName || '').trim().toLowerCase() === companyLower
                ) {
                    return true;
                }
            }
        }

        if (selectedCompany && (t.brand || '').trim().toLowerCase() === selectedCompany.companyName.trim().toLowerCase()) {
            return true;
        }

        return false;
    });

    const filteredProjects = selectedBrand === 'All' ? projects : projects.filter(p =>
        (p as any).companyId === selectedBrand ||
        p.brandId === selectedBrand ||
        p.divisionId === selectedBrand ||
        p.brand === selectedBrand ||
        (selectedCompany && (
            (p.brand || '').trim().toLowerCase() === selectedCompany.companyName.trim().toLowerCase() ||
            (p.client?.brand || '').trim().toLowerCase() === selectedCompany.companyName.trim().toLowerCase() ||
            (p.client?.companyName || '').trim().toLowerCase() === selectedCompany.companyName.trim().toLowerCase()
        ))
    );

    const myTasks = filteredTasks.filter(t => t.assignedUserId === user?.id);
    const pendingTasks = myTasks.filter(t => t.status !== 'Completed');

    // Build My Events from the assigned projects
    const myEvents: any[] = [];
    filteredProjects.forEach(p => {
        const myAssignment = p.staffAssignments?.find((a: any) => a.userId === user?.id);
        if (myAssignment && p.client) {
            const clientEvents = p.client.events || [];
            clientEvents.forEach((ev: any) => {
                if (myAssignment.eventIds?.includes(ev.id)) {
                    myEvents.push({
                        ...ev,
                        clientName: p.client.name,
                        clientPhone: p.client.phone,
                        clientAddress: p.client.address,
                        projectName: p.name,
                        role: myAssignment.role
                    });
                }
            });
        }
    });
    myEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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

    const handleUpdateStatus = async (task: Task, newStatus: string) => {
        if (isSavingStatus) return;
        setIsSavingStatus(true);
        const updated = { ...task, status: newStatus };
        try {
            await api.saveTask(updated);
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...updated } : t));
            setSelectedTask((prev: any) => prev && prev.id === task.id ? { ...prev, ...updated } : prev);
            setUpdatingTaskId(null);
            window.dispatchEvent(new CustomEvent('tasks-updated'));
        } catch (err) {
            console.error("Failed to update staff task status:", err);
            alert("Failed to update task status.");
        } finally {
            setIsSavingStatus(false);
        }
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
                                                <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {formatOnlyDate(ev.date)}</span>
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
                                        <div 
                                            key={task.id} 
                                            onClick={() => {
                                                setSelectedTask(task);
                                                setModalOpen(true);
                                            }}
                                            className="p-4 bg-black/50 rounded-2xl border border-white/5 flex items-start gap-4 cursor-pointer hover:border-white/10 transition-all"
                                        >
                                            <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0 mt-1">
                                                <AlertCircle className="w-4 h-4 text-amber-500" />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-black text-white uppercase tracking-wider mb-1">{task.title}</h4>
                                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest">Priority: {task.priority} • Due: {formatOnlyDate(task.dueDate)}</p>
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
                            <div 
                                key={task.id} 
                                onClick={() => {
                                    setSelectedTask(task);
                                    setModalOpen(true);
                                }}
                                className="p-6 glass-panel border border-white/5 squircle-sm flex items-center justify-between cursor-pointer hover:border-white/10 transition-all"
                            >
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-wider mb-2">{task.title}</h4>
                                    <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-black uppercase tracking-widest">
                                        <span className={`px-2 py-1 rounded bg-white/5 ${task.priority === 'High' ? 'text-red-400' : 'text-zinc-400'}`}>{task.priority}</span>
                                        <span>Status: {task.status}</span>
                                        <span>Due: {formatOnlyDate(task.dueDate)}</span>
                                    </div>
                                </div>
                                <div className="text-right flex items-center gap-2">
                                    {updatingTaskId === task.id ? (
                                        <div className="flex gap-2 animate-ios-slide-up">
                                            <button 
                                                disabled={isSavingStatus}
                                                onClick={() => handleUpdateStatus(task, 'In Progress')}
                                                className="touch-target px-3 py-2 bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                In Progress
                                            </button>
                                            <button 
                                                disabled={isSavingStatus}
                                                onClick={() => handleUpdateStatus(task, 'Completed')}
                                                className="touch-target px-3 py-2 bg-primary/20 text-primary hover:bg-primary/30 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Completed
                                            </button>
                                            <button 
                                                disabled={isSavingStatus}
                                                onClick={() => setUpdatingTaskId(null)}
                                                className="touch-target px-3 py-2 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedTask(task);
                                                setModalOpen(true);
                                            }}
                                            className="touch-target px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white transition-all"
                                        >
                                            Update
                                        </button>
                                    )}
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
                            <div key={ev.id} className="p-6 glass-panel border border-white/5 squircle-sm hover:border-white/10 transition-all flex flex-col gap-4 bg-white/[0.01]">
                                <div className="flex justify-between items-start border-b border-white/5 pb-3">
                                    <div>
                                        <h4 className="text-base font-black text-white uppercase tracking-wider">{ev.name}</h4>
                                        {ev.eventType && (
                                            <span className="inline-block mt-1 text-[9px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded">
                                                {ev.eventType}
                                            </span>
                                        )}
                                    </div>
                                    <span className={`px-2.5 py-1.5 rounded text-[10px] font-black uppercase tracking-widest ${
                                        ev.status === 'Completed' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
                                        ev.status === 'In Progress' ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400' :
                                        'bg-white/5 border border-white/10 text-white'
                                    }`}>
                                        {ev.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 py-2">
                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Client</span>
                                            <p className="text-sm font-bold text-zinc-200 uppercase tracking-wide">{ev.clientName}</p>
                                            {ev.clientPhone && (
                                                <p className="text-xs text-zinc-400 font-bold font-mono mt-1 flex items-center gap-1.5">
                                                    <Phone className="w-3.5 h-3.5 text-zinc-500" /> {ev.clientPhone}
                                                </p>
                                            )}
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Project</span>
                                            <p className="text-xs font-bold text-zinc-300 uppercase tracking-wide">{ev.projectName}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Date & Time</span>
                                            <p className="text-xs font-bold text-zinc-200 flex items-center gap-1.5 uppercase tracking-wider">
                                                <Calendar className="w-3.5 h-3.5 text-zinc-400" /> {formatOnlyDate(ev.date)}
                                            </p>
                                            {ev.startTime && (
                                                <p className="text-xs text-zinc-300 font-medium flex items-center gap-1.5 mt-2">
                                                    <Clock className="w-3.5 h-3.5 text-zinc-500" /> {ev.startTime} {ev.endTime ? ` - ${ev.endTime}` : ''}
                                                </p>
                                            )}
                                        </div>
                                        {ev.reportingTime && (
                                            <div>
                                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Reporting Time</span>
                                                <p className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-amber-500/70" /> {ev.reportingTime}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    <div className="space-y-4 col-span-1 sm:col-span-2 md:col-span-1">
                                        <div>
                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Location</span>
                                            <p className="text-xs text-zinc-300 font-medium leading-relaxed flex items-start gap-2 mt-1">
                                                <MapPin className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                                                <span>{ev.venueLocation || ev.clientAddress || 'No Address Specified'}</span>
                                            </p>
                                        </div>
                                        {ev.role && (
                                            <div>
                                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Role</span>
                                                <span className="inline-block mt-1 px-3 py-1 bg-white/5 border border-white/10 rounded-full font-bold text-[9px] uppercase tracking-widest text-zinc-200">
                                                    {ev.role}
                                                </span>
                                            </div>
                                        )}
                                    </div>
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
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Select Project</label>
                                            <select 
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all appearance-none" 
                                                value={selectedProjectId} 
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    setSelectedProjectId(val);
                                                    setSelectedEventId('');
                                                    fetchFiles(val);
                                                }}
                                            >
                                                <option value="" className="bg-zinc-900">-- Choose Project --</option>
                                                {filteredProjects.map(p => (
                                                    <option key={p.id} value={p.id} className="bg-zinc-900">{p.name} ({p.status})</option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Select Event</label>
                                            <select 
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all appearance-none disabled:opacity-50 disabled:cursor-not-allowed" 
                                                value={selectedEventId} 
                                                disabled={!selectedProjectId}
                                                onChange={e => setSelectedEventId(e.target.value)}
                                            >
                                                <option value="" className="bg-zinc-900">-- Choose Event --</option>
                                                {selectedProjectEvents.map((ev: any) => (
                                                    <option key={ev.id} value={ev.id} className="bg-zinc-900">{ev.name}</option>
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
                                                {['Raw Photos', 'Raw Videos', 'Edited Photos', 'Edited Videos', 'Deliverables'].map(cat => (
                                                    <option key={cat} value={cat} className="bg-zinc-900">{cat}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {isUploading ? (
                                        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-6 animate-ios-fade-in text-left">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-2">
                                                    <Loader className="w-4 h-4 animate-spin text-indigo-400" />
                                                    Uploading {uploadingIndex + 1} of {selectedFiles.length}
                                                </h3>
                                                <span className="text-[10px] font-mono text-zinc-500 bg-white/5 px-2 py-1 rounded">
                                                    Remaining: {selectedFiles.length - (uploadingIndex + 1)} files
                                                </span>
                                            </div>

                                            <div className="space-y-1.5 border-b border-white/5 pb-4">
                                                <span className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Current File</span>
                                                <p className="text-xs font-mono font-bold text-indigo-400 truncate uppercase">
                                                    {selectedFiles[uploadingIndex]?.name || 'Initializing...'}
                                                </p>
                                                <span className="text-[9px] text-zinc-500 font-mono">
                                                    Size: {selectedFiles[uploadingIndex] ? formatBytes(selectedFiles[uploadingIndex].size) : '0 Bytes'}
                                                </span>
                                            </div>

                                            {/* Overall Progress */}
                                            {(() => {
                                                const overallPercent = selectedFiles.length > 0
                                                    ? Math.round(((uploadingIndex + (currentFileProgress / 100)) / selectedFiles.length) * 100)
                                                    : 0;
                                                return (
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                                            <span>Overall Progress</span>
                                                            <span className="font-mono text-white">{overallPercent}%</span>
                                                        </div>
                                                        <div className="w-full bg-white/5 rounded-full h-2 overflow-hidden border border-white/5">
                                                            <div 
                                                                className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-300" 
                                                                style={{ width: `${overallPercent}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })()}

                                            {/* Current File Progress */}
                                            <div className="space-y-2">
                                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                                    <span>Current File Progress</span>
                                                    <span className="font-mono text-white">{currentFileProgress}%</span>
                                                </div>
                                                <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden border border-white/5">
                                                    <div 
                                                        className="bg-emerald-500 h-full rounded-full transition-all duration-300" 
                                                        style={{ width: `${currentFileProgress}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Custom Drag & Drop / Selection UI */}
                                            <div 
                                                onClick={() => document.getElementById('file-upload-input')?.click()}
                                                onDragOver={handleDragOver}
                                                onDragLeave={handleDragLeave}
                                                onDrop={handleDrop}
                                                className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer bg-white/[0.01] hover:bg-white/[0.03] ${
                                                    isDragging ? 'border-indigo-500 bg-indigo-500/5' : 'border-white/10 hover:border-indigo-500/50'
                                                }`}
                                            >
                                                <input 
                                                    type="file" 
                                                    id="file-upload-input" 
                                                    className="hidden" 
                                                    multiple
                                                    onChange={handleFileChange}
                                                />
                                                <FileVideo className="w-10 h-10 text-zinc-500 mb-4 animate-pulse-subtle" />
                                                <p className="text-sm font-bold text-white mb-1">Click to browse or drop files here</p>
                                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Max size: 100MB per file</p>
                                            </div>

                                            {/* Selected Files List */}
                                            {selectedFiles.length > 0 && (
                                                <div className="space-y-3 bg-white/[0.01] border border-white/5 rounded-2xl p-5 text-left">
                                                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                                                        <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">
                                                            Selected Files ({selectedFiles.length})
                                                        </span>
                                                        <button 
                                                            onClick={() => setSelectedFiles([])}
                                                            className="text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-300 transition-colors"
                                                        >
                                                            Clear All
                                                        </button>
                                                    </div>
                                                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1 custom-scrollbar">
                                                        {selectedFiles.map((file, idx) => (
                                                            <div key={idx} className="flex items-center justify-between p-3 bg-black/30 border border-white/5 rounded-xl text-xs gap-3">
                                                                <div className="flex items-center gap-2.5 min-w-0">
                                                                    <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                                                                    <span className="text-zinc-200 font-bold truncate uppercase tracking-wider block max-w-[200px]" title={file.name}>
                                                                        {file.name}
                                                                    </span>
                                                                    <span className="text-[9px] text-zinc-500 shrink-0 font-mono">({formatBytes(file.size)})</span>
                                                                </div>
                                                                <button 
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
                                                                    }}
                                                                    className="text-zinc-500 hover:text-red-400 p-1 rounded-lg transition-all shrink-0"
                                                                    title="Remove file"
                                                                >
                                                                    <X className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Upload Destination Preview */}
                                    {selectedProject && (
                                        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-zinc-400 bg-white/[0.02] border border-white/5 px-4 py-3 rounded-2xl mb-2">
                                            <span>{selectedProject.brand || selectedProject.client?.companyName || 'Unknown Brand'}</span>
                                            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                                            <span>{selectedProject.name}</span>
                                            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                                            <span className={selectedEvent ? 'text-indigo-400' : 'text-amber-500'}>
                                                {selectedEvent ? selectedEvent.name : 'Select Event'}
                                            </span>
                                            <ChevronRight className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                                            <span className="text-emerald-400">{selectedCategory}</span>
                                        </div>
                                    )}

                                    <button 
                                        disabled={!selectedProjectId || !selectedEventId || !selectedCategory || selectedFiles.length === 0 || isUploading} 
                                        onClick={handleUpload}
                                        className="touch-target w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader className="w-4 h-4 animate-spin" />
                                                Upload in Progress...
                                            </>
                                        ) : (
                                            `Start Upload (${selectedFiles.length} file${selectedFiles.length === 1 ? '' : 's'})`
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {selectedProjectId && (
                            <div className="glass-panel p-8 squircle-md border border-white/5 space-y-6">
                                <div className="flex justify-between items-center border-b border-white/5 pb-4">
                                    <h3 className="text-xs font-black uppercase text-zinc-500 tracking-[0.2em]">Recent Uploads</h3>
                                    <span className="text-[10px] font-mono text-zinc-500">{projectFiles.length} files total</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {projectFiles.map((file: any) => {
                                        const isImage = file.mimeType?.startsWith('image/');
                                        const fileEventName = localFileEventMap[file.id] || selectedProjectEvents[0]?.name || 'General';
                                        const fileUploadedBy = localFileUploaderMap[file.id] || user?.name || 'Staff';

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
                                                        <div className="flex flex-wrap items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                                                            <span className="text-zinc-300">{fileEventName}</span>
                                                            <span className="text-zinc-600">•</span>
                                                            <span className={`px-2 py-0.5 rounded text-[8px] ${
                                                                file.category === 'Raw Photos' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/10' :
                                                                file.category === 'Raw Videos' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/10' :
                                                                file.category === 'Edited Photos' ? 'bg-pink-500/10 text-pink-400 border border-pink-500/10' :
                                                                file.category === 'Edited Videos' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/10' :
                                                                file.category === 'Deliverables' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' :
                                                                'bg-zinc-500/10 text-zinc-400 border border-zinc-500/10'
                                                            }`}>
                                                                {file.category}
                                                            </span>
                                                            <span className="text-zinc-600">•</span>
                                                            <span>By: {fileUploadedBy}</span>
                                                            <span className="text-zinc-600">•</span>
                                                            <span>{formatDate(file.uploadedAt)}</span>
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

            {/* TASK DETAILS MODAL */}
            {modalOpen && selectedTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-ios-fade-in" onClick={() => setModalOpen(false)}>
                    <div 
                        className="w-full max-w-xl bg-zinc-950 border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col gap-6 shadow-2xl animate-ios-slide-up max-h-[90vh] overflow-y-auto" 
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start border-b border-white/5 pb-4">
                            <div>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                    selectedTask.priority === 'High' ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' : 'bg-white/5 border border-white/10 text-white'
                                }`}>
                                    {selectedTask.priority} Priority
                                </span>
                                <h3 className="text-xl font-black text-white uppercase tracking-tight mt-2 leading-tight">{selectedTask.title}</h3>
                            </div>
                            <button 
                                onClick={() => setModalOpen(false)}
                                className="p-1 rounded-full text-zinc-500 hover:text-white hover:bg-white/5 transition-all"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Content Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-xs leading-relaxed">
                            {/* Task details */}
                            <div className="space-y-4">
                                <div>
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Status</span>
                                    <span className={`inline-block px-2.5 py-1 text-[9px] font-black uppercase tracking-widest rounded-full ${
                                        selectedTask.status === 'Completed' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
                                        selectedTask.status === 'In Progress' ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400' :
                                        'bg-white/5 border border-white/10 text-white'
                                    }`}>
                                        {selectedTask.status}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Due Date</span>
                                    <p className="font-bold text-zinc-200 flex items-center gap-1.5 mt-0.5">
                                        <Calendar className="w-3.5 h-3.5 text-zinc-400" /> {formatOnlyDate(selectedTask.dueDate)}
                                    </p>
                                </div>
                            </div>

                            {/* Client Information */}
                            <div className="space-y-4">
                                <div>
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Client Profile</span>
                                    <p className="font-bold text-zinc-200 uppercase tracking-wide">{selectedTask.client?.name || 'N/A'}</p>
                                    {selectedTask.client?.phone && (
                                        <p className="text-zinc-400 font-bold font-mono mt-1 flex items-center gap-1.5">
                                            <Phone className="w-3.5 h-3.5 text-zinc-500" /> {selectedTask.client.phone}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Project</span>
                                    <p className="font-bold text-zinc-300 uppercase tracking-wide">{selectedTask.project?.name || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Related Event Information */}
                            {selectedTask.event && (
                                <div className="space-y-4 col-span-1 sm:col-span-2 border-t border-white/5 pt-4">
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Related Event Info</span>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white/[0.01] p-4 rounded-2xl border border-white/5">
                                        <div>
                                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block">Event Name</span>
                                            <p className="font-bold text-zinc-200 uppercase mt-0.5">{selectedTask.event.name}</p>
                                            {selectedTask.event.status && (
                                                <span className="inline-block mt-1.5 px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-bold text-[8px] uppercase tracking-widest">
                                                    {selectedTask.event.status}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <span className="text-[9px] font-black text-zinc-600 uppercase tracking-widest block">Event Date & Time</span>
                                            <p className="font-bold text-zinc-200 flex items-center gap-1.5 mt-1 uppercase tracking-wider">
                                                <Calendar className="w-3.5 h-3.5 text-zinc-400" /> {formatOnlyDate(selectedTask.event.date)}
                                            </p>
                                            {selectedTask.event.startTime && (
                                                <p className="text-zinc-300 font-medium flex items-center gap-1.5 mt-1">
                                                    <Clock className="w-3.5 h-3.5 text-zinc-500" /> {selectedTask.event.startTime} {selectedTask.event.endTime ? ` - ${selectedTask.event.endTime}` : ''}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Location & Optional Fields */}
                            <div className="space-y-4 col-span-1 sm:col-span-2 border-t border-white/5 pt-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Location Address</span>
                                        <p className="text-zinc-300 font-medium leading-relaxed flex items-start gap-2 mt-1">
                                            <MapPin className="w-4 h-4 text-zinc-500 shrink-0 mt-0.5" />
                                            <span>{selectedTask.event?.venueLocation || selectedTask.client?.address || 'No location address specified'}</span>
                                        </p>
                                    </div>
                                    <div className="space-y-3">
                                        {selectedTask.project?.staffAssignments && (
                                            <div>
                                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Assigned Role</span>
                                                {(() => {
                                                    const role = selectedTask.project.staffAssignments.find((sa: any) => sa.userId === user?.id)?.role;
                                                    return role ? (
                                                        <span className="inline-block mt-1 px-3 py-1 bg-white/5 border border-white/10 rounded-full font-bold text-[9px] uppercase tracking-widest text-zinc-200">
                                                            {role}
                                                        </span>
                                                    ) : (
                                                        <span className="text-zinc-500 font-bold uppercase text-[10px]">Unassigned</span>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                        {selectedTask.event?.reportingTime && (
                                            <div>
                                                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Reporting Time</span>
                                                <p className="font-bold text-amber-400 flex items-center gap-1.5">
                                                    <Clock className="w-3.5 h-3.5 text-amber-500/70" /> {selectedTask.event.reportingTime}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedTask.event?.notes && (
                                    <div className="border-t border-white/5 pt-4">
                                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Notes / Description</span>
                                        <p className="text-zinc-300 font-medium leading-relaxed bg-white/[0.01] p-3 border border-white/5 rounded-xl">
                                            {selectedTask.event.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="border-t border-white/5 pt-4 flex flex-wrap gap-3 justify-end mt-2">
                            <button 
                                disabled={isSavingStatus}
                                onClick={() => handleUpdateStatus(selectedTask, 'Pending')}
                                className="touch-target px-4 py-2.5 bg-white/5 text-zinc-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                            >
                                Mark Pending
                            </button>
                            <button 
                                disabled={isSavingStatus}
                                onClick={() => handleUpdateStatus(selectedTask, 'In Progress')}
                                className="touch-target px-4 py-2.5 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/10 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                            >
                                Mark In Progress
                            </button>
                            <button 
                                disabled={isSavingStatus}
                                onClick={() => handleUpdateStatus(selectedTask, 'Completed')}
                                className="touch-target px-4 py-2.5 bg-primary/20 text-primary hover:bg-primary/30 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                            >
                                Mark Completed
                            </button>
                            <button 
                                onClick={() => setModalOpen(false)}
                                className="touch-target px-5 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all font-bold"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            
            {uploadNotification && createPortal(
                <div className="fixed bottom-8 right-8 z-[10000] flex flex-col gap-3 pointer-events-none max-w-md w-[380px]">
                    {uploadNotification.type === 'success' ? (
                        <div className="pointer-events-auto bg-zinc-950/95 border border-emerald-500/30 rounded-3xl p-5 flex flex-col gap-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-ios-slide-up backdrop-blur-2xl border-l-4 border-l-emerald-500 animate-ios-slide-up">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-emerald-400 text-sm font-black">✓</span>
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Upload Complete</span>
                                </div>
                                <button 
                                    onClick={() => setUploadNotification(null)}
                                    className="p-1 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[11px] font-bold text-zinc-300 whitespace-pre-line">{uploadNotification.message}</p>
                            </div>
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 space-y-1.5 text-[10px] uppercase font-black tracking-wider text-zinc-400">
                                <div className="flex justify-between"><span className="text-zinc-500">Project:</span><span className="text-white truncate max-w-[200px]">{uploadNotification.project}</span></div>
                                <div className="flex justify-between"><span className="text-zinc-500">Category:</span><span className="text-white">{uploadNotification.category}</span></div>
                                <div className="flex justify-between"><span className="text-zinc-500">Uploaded:</span><span className="text-emerald-400">{uploadNotification.successCount}</span></div>
                                {uploadNotification.duplicateCount !== undefined && uploadNotification.duplicateCount > 0 && (
                                    <div className="flex justify-between"><span className="text-zinc-500">Skipped (Dup):</span><span className="text-amber-400">{uploadNotification.duplicateCount}</span></div>
                                )}
                                <div className="flex justify-between"><span className="text-zinc-500">Failed:</span><span className="text-red-400">{uploadNotification.failedCount}</span></div>
                            </div>
                        </div>
                    ) : (
                        <div className="pointer-events-auto bg-zinc-950/95 border border-red-500/30 rounded-3xl p-5 flex flex-col gap-3.5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-ios-slide-up backdrop-blur-2xl border-l-4 border-l-red-500 animate-ios-slide-up">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="text-red-400 text-sm font-black">⚠</span>
                                    <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Upload Finished With Errors</span>
                                </div>
                                <button 
                                    onClick={() => setUploadNotification(null)}
                                    className="p-1 bg-white/5 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[11px] font-bold text-red-400 whitespace-pre-line">{uploadNotification.message}</p>
                            </div>
                            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-3 space-y-1.5 text-[10px] uppercase font-black tracking-wider text-zinc-400">
                                <div className="flex justify-between"><span className="text-zinc-500">Project:</span><span className="text-white truncate max-w-[200px]">{uploadNotification.project}</span></div>
                                <div className="flex justify-between"><span className="text-zinc-500">Category:</span><span className="text-white">{uploadNotification.category}</span></div>
                                <div className="flex justify-between"><span className="text-zinc-500">Uploaded:</span><span className="text-emerald-400">{uploadNotification.successCount}</span></div>
                                {uploadNotification.duplicateCount !== undefined && uploadNotification.duplicateCount > 0 && (
                                    <div className="flex justify-between"><span className="text-zinc-500">Skipped (Dup):</span><span className="text-amber-400">{uploadNotification.duplicateCount}</span></div>
                                )}
                                <div className="flex justify-between"><span className="text-zinc-500">Failed:</span><span className="text-red-400">{uploadNotification.failedCount}</span></div>
                            </div>
                            {uploadNotification.failedFiles && uploadNotification.failedFiles.length > 0 && (
                                <div className="space-y-1.5 border-t border-white/5 pt-3">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Failed Filenames:</p>
                                    <div className="max-h-24 overflow-y-auto pr-1 custom-scrollbar space-y-1">
                                        {uploadNotification.failedFiles.map((name, idx) => (
                                            <p key={idx} className="text-[10px] font-mono text-red-300 truncate uppercase" title={name}>
                                                • {name}
                                            </p>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>,
                document.body
            )}
        </div>
    );
};

export default StaffPortal;

