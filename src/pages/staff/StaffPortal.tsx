import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { getAuthUser } from '../../utils/storage';
import { type Task, type Client, type AttendanceRecord, type Equipment } from '../../types';
import { 
    Calendar, CheckSquare, UploadCloud, Clock, 
    Camera, User, AlertCircle, FileVideo, 
    MapPin, Play, UserCircle, Briefcase
} from 'lucide-react';

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
    const [uploadClient, setUploadClient] = useState('');
    const [uploadType, setUploadType] = useState('RAW Photos');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [t, c, a, e] = await Promise.all([
                api.getTasks(),
                api.getClients(),
                api.getAttendance(user?.id || ''),
                api.getEquipment(user?.id || '')
            ]);
            setTasks(t);
            setClients(c);
            setAttendance(a);
            setEquipment(e);

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
    };

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
                <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
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
                        <button onClick={handleClockIn} className="touch-target px-6 py-3 bg-emerald-500/10 text-emerald-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500/20 transition-all flex items-center gap-2">
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
                                                <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">{ev.status}</span>
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
                    <div className="glass-panel p-8 squircle-md border border-white/5 animate-ios-fade-in">
                        <div className="max-w-2xl mx-auto space-y-8">
                            <div className="text-center">
                                <UploadCloud className="w-12 h-12 text-zinc-500 mx-auto mb-4" />
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Media Upload Center</h2>
                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-2">Upload and link deliverables to your assigned projects</p>
                            </div>

                            <div className="space-y-6 bg-black/50 p-8 rounded-3xl border border-white/5">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Select Project</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all appearance-none" value={uploadClient} onChange={e => setUploadClient(e.target.value)}>
                                        <option value="" className="bg-zinc-900">-- Choose Project --</option>
                                        {myClients.map(c => (
                                            <option key={c.id} value={c.id} className="bg-zinc-900">{c.name} - {c.projectName}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Upload Type</label>
                                    <select className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all appearance-none" value={uploadType} onChange={e => setUploadType(e.target.value)}>
                                        {['RAW Photos', 'RAW Videos', 'Drone Footage', 'Edited Photos', 'Albums', 'Teasers', 'Highlights'].map(t => (
                                            <option key={t} value={t} className="bg-zinc-900">{t}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center hover:border-white/20 transition-all cursor-pointer bg-white/[0.02]">
                                    <FileVideo className="w-8 h-8 text-zinc-500 mb-4" />
                                    <p className="text-sm font-bold text-white mb-1">Click or drag files here</p>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Max size: 50GB</p>
                                </div>

                                <button disabled={!uploadClient} className="touch-target w-full py-4 bg-white text-black rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                                    Start Upload
                                </button>
                            </div>
                        </div>
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
                                    <button onClick={handleClockIn} className="touch-target px-8 py-4 bg-emerald-500 text-black rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-emerald-400 transition-all flex items-center gap-2">
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
                                        <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 rounded text-[9px] font-black uppercase tracking-widest">{eq.status}</span>
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
