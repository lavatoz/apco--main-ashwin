import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import {
  CheckCircle2, Package, Plus, X, Layers, Trash2, Loader2, Clock, Calendar, AlertCircle, Users, Activity
} from 'lucide-react';
import { type Client, type Task, TaskStatus, type Project, type ProjectStage, type CompanyProfile } from '../types';
import { safeParse } from '../utils/storage';

interface ProductionHubProps {
  clients: Client[];
  tasks: Task[];
  selectedBrand: string | 'All';
  companies: CompanyProfile[];
}

const ProductionHub: React.FC<ProductionHubProps> = ({ tasks: initialTasks, selectedBrand, clients: allClients, companies }) => {
  const location = useLocation();
  const locationState = location.state as { prefillClient?: string; brand?: string } | null;

  const [isCreating, setIsCreating] = useState(!!locationState?.prefillClient);
  const [showNewClientInput, setShowNewClientInput] = useState(false);
  const isPrefilled = !!locationState?.prefillClient;
  const [newProject, setNewProject] = useState({ 
    title: locationState?.prefillClient ? `${locationState.prefillClient} Project` : '', 
    client: locationState?.prefillClient || '', 
    brand: locationState?.brand || (selectedBrand !== 'All' ? (companies.find(c => c.id === selectedBrand)?.companyName || selectedBrand) : 'AAHA Kalyanam'), 
    eventDate: '', 
    stage: 'booked' as ProjectStage,
    totalAmount: 0
  });

  useEffect(() => {
    if (locationState?.prefillClient) {
       window.history.replaceState({}, document.title);
    }
  }, [locationState]);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [projectRegistry, setProjectRegistry] = useState<Project[]>(() => {
    const allProjects = safeParse<Project[]>('projects', []);
    return allProjects.filter(p => p.status === 'confirmed');
  });

  const [localTasks, setLocalTasks] = useState<Task[]>(initialTasks);

  useEffect(() => {
    setLocalTasks(initialTasks);
  }, [initialTasks]);

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    const project: Project = {
       id: `PRJ-${Date.now().toString().slice(-6)}`,
       name: newProject.title,
       clientId: newProject.client, 
       brand: newProject.brand,
       divisionId: (allClients.find(c => c.name === newProject.client)?.divisionId) || 'dev_01',
       type: 'General',
       date: newProject.eventDate,
       status: 'confirmed',
       stage: 'booked',
       totalAmount: newProject.totalAmount,
       services: [],
       financials: { total: newProject.totalAmount, paid: 0, balance: newProject.totalAmount },
       workflow: [],
       createdAt: new Date().toISOString()
    };
    
    const allProjects = safeParse<Project[]>('projects', []);
    const updatedAll = [...allProjects, project];
    localStorage.setItem('projects', JSON.stringify(updatedAll));
    setProjectRegistry(updatedAll.filter(p => p.status === 'confirmed'));
    
    setIsCreating(false);
    setShowNewClientInput(false);
    setNewProject({ 
        title: '', 
        client: '', 
        brand: selectedBrand !== 'All' ? (companies.find(c => c.id === selectedBrand)?.companyName || selectedBrand) : (companies[0]?.companyName || 'Artisans'), 
        eventDate: '', 
        stage: 'booked' as any,
        totalAmount: 0
    });
  };

  const confirmDelete = async () => {
    if (!projectToDelete) return;
    const targetId = projectToDelete.id;

    setIsDeleting(true);
    await new Promise(r => setTimeout(r, 450));
    
    try {
      const allProjects = safeParse<Project[]>('projects', []);
      const updated = allProjects.filter(p => p.id !== targetId);
      localStorage.setItem('projects', JSON.stringify(updated));
      setProjectRegistry(updated.filter(p => p.status === 'confirmed'));
    } catch (err) {
      console.error("Project Purge Failed", err);
    } finally {
      setIsDeleting(false);
      setProjectToDelete(null);
    }
  };

  const handleUpdateTaskStatus = (taskId: string, newStatus: string) => {
     const allTasks = safeParse<Task[]>('tasks', []);
     const updatedTasks = allTasks.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t);
     localStorage.setItem('tasks', JSON.stringify(updatedTasks));
     setLocalTasks(localTasks.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t));
     window.dispatchEvent(new Event('storage'));
  };

  const filteredTasks = localTasks.filter(t => (selectedBrand === 'All' || t.brand === selectedBrand));
  const activeProjects = projectRegistry.filter(p => p.status === 'confirmed' && (selectedBrand === 'All' || p.brand === selectedBrand));
  
  const pendingTasks = filteredTasks.filter(t => t.status !== TaskStatus.Completed);
  const overdueTasks = filteredTasks.filter(t => t.status === TaskStatus.Overdue);
  const upcomingShoots = activeProjects.filter(p => new Date(p.date) >= new Date()).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Group tasks by assignee for Team Workload
  const workloadByAssignee = pendingTasks.reduce((acc, task) => {
    const assignee = task.assignee || 'Unassigned';
    acc[assignee] = (acc[assignee] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-10 animate-ios-slide-up pb-20">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Operations</h1>
            <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em]">Production Hub & Logistics</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="bg-white text-black px-8 py-3.5 squircle-sm font-black uppercase text-[11px] tracking-widest flex items-center gap-3 hover:bg-zinc-200 transition-all shadow-2xl shadow-white/10 active:scale-95 group">
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> New Project
        </button>
      </div>

      {/* DASHBOARD METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="glass-panel p-6 squircle-lg relative overflow-hidden group border border-white/5">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Activity className="w-24 h-24 text-blue-500" /></div>
          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2 flex items-center gap-2"><Layers className="w-3 h-3"/> Active Projects</p>
          <h3 className="text-4xl font-black tracking-tight text-white">{activeProjects.length}</h3>
        </div>
        <div className="glass-panel p-6 squircle-lg relative overflow-hidden group border border-white/5">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Calendar className="w-24 h-24 text-emerald-500" /></div>
          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2 flex items-center gap-2"><Calendar className="w-3 h-3"/> Upcoming Shoots</p>
          <h3 className="text-4xl font-black tracking-tight text-white">{upcomingShoots.length}</h3>
        </div>
        <div className="glass-panel p-6 squircle-lg relative overflow-hidden group border border-white/5">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Clock className="w-24 h-24 text-amber-500" /></div>
          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2 flex items-center gap-2"><Clock className="w-3 h-3"/> Pending Tasks</p>
          <h3 className="text-4xl font-black tracking-tight text-white">{pendingTasks.length}</h3>
        </div>
        <div className="glass-panel p-6 squircle-lg relative overflow-hidden group border border-white/5">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><AlertCircle className="w-24 h-24 text-red-500" /></div>
          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-2 flex items-center gap-2"><AlertCircle className="w-3 h-3"/> Overdue Tasks</p>
          <h3 className="text-4xl font-black tracking-tight text-white">{overdueTasks.length}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* TASK MANAGEMENT */}
        <div className="lg:col-span-2 glass-panel p-8 squircle-lg space-y-6">
          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
              <Package className="w-4 h-4 text-blue-500" /> Task Management
            </h3>
          </div>
          
          <div className="space-y-4 max-h-[600px] overflow-y-auto no-scrollbar pr-2">
            {pendingTasks.length === 0 ? (
                <div className="py-16 text-center text-zinc-800">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-4 opacity-10" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">All Tasks Processed</p>
                </div>
            ) : pendingTasks.map(task => (
                <div key={task.id} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center gap-4 hover:bg-white/5 transition-all">
                  <div className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center border ${
                      task.status === TaskStatus.Overdue ? 'bg-red-500/10 border-red-500/20 text-red-500' :
                      task.status === TaskStatus.InProgress ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                      'bg-blue-500/10 border-blue-500/20 text-blue-500'
                  }`}>
                     <Layers className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-black text-xs uppercase text-white truncate mb-1">{task.title}</h4>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{task.client || 'Unknown Client'} • {task.brand}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right hidden md:block">
                       <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Assignee</p>
                       <p className="text-xs font-black text-white">{task.assignee || 'Unassigned'}</p>
                    </div>
                    <select
                       value={task.status}
                       onChange={(e) => handleUpdateTaskStatus(task.id, e.target.value)}
                       className={`bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:border-white/20 ${
                           task.status === TaskStatus.Overdue ? 'text-red-500' :
                           task.status === TaskStatus.InProgress ? 'text-amber-500' :
                           task.status === TaskStatus.Completed ? 'text-emerald-500' :
                           'text-zinc-300'
                       }`}
                    >
                       {Object.values(TaskStatus).map(s => (
                           <option key={s} value={s} className="bg-zinc-900 text-white">{s}</option>
                       ))}
                    </select>
                  </div>
                </div>
            ))}
          </div>
        </div>

        {/* SIDEBAR: WORKLOAD & SCHEDULE */}
        <div className="space-y-8">
           {/* Team Workload */}
           <div className="glass-panel p-8 squircle-lg space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
                  <Users className="w-4 h-4 text-emerald-500" /> Team Workload
                </h3>
              </div>
              <div className="space-y-3">
                 {Object.entries(workloadByAssignee).length === 0 ? (
                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest text-center py-4">No active assignments</p>
                 ) : Object.entries(workloadByAssignee).map(([assignee, count]) => (
                    <div key={assignee} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-zinc-800 rounded-full flex items-center justify-center font-black text-xs text-white uppercase">{assignee.charAt(0)}</div>
                          <p className="text-xs font-black text-white">{assignee}</p>
                       </div>
                       <div className="px-3 py-1 bg-white/10 rounded-lg text-[10px] font-black text-white">{count} Tasks</div>
                    </div>
                 ))}
              </div>
           </div>

           {/* Upcoming Schedule */}
           <div className="glass-panel p-8 squircle-lg space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-indigo-500" /> Upcoming Schedule
                </h3>
              </div>
              <div className="space-y-4">
                 {upcomingShoots.slice(0, 5).map(project => (
                    <div key={project.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 relative overflow-hidden group">
                       <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500 opacity-50 group-hover:opacity-100 transition-opacity" />
                       <div className="pl-2">
                          <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">
                             {new Date(project.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                          </p>
                          <h4 className="font-black text-sm text-white uppercase tracking-tight">{project.name}</h4>
                          <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-1">{project.stage}</p>
                       </div>
                    </div>
                 ))}
                 {upcomingShoots.length === 0 && (
                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest text-center py-4">No upcoming events</p>
                 )}
              </div>
           </div>
        </div>

      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-xl animate-ios-slide-up">
          <div className="bg-zinc-900 border border-white/10 squircle-lg w-full max-w-lg p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-white" />
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">New Project</h2>
              <button onClick={() => setIsCreating(false)} className="p-2 bg-white/5 rounded-full text-zinc-500 hover:text-white transition-all"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Project Definition</label>
                <input required className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all placeholder:text-zinc-700" placeholder="e.g. Rahul Wedding Film" value={newProject.title} onChange={e => setNewProject({...newProject, title: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Select Client</label>
                <select 
                  required 
                  disabled={isPrefilled}
                  className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all disabled:opacity-50" 
                  value={showNewClientInput ? 'NEW_CLIENT' : newProject.client} 
                  onChange={e => {
                    if (e.target.value === 'NEW_CLIENT') {
                      setShowNewClientInput(true);
                      setNewProject({...newProject, client: ''});
                    } else {
                      setShowNewClientInput(false);
                      setNewProject({...newProject, client: e.target.value});
                    }
                  }}
                >
                  <option value="" disabled hidden className="bg-zinc-900">Choose client...</option>
                  {allClients.map((c, i) => (
                    <option key={i} value={c.name || c.projectName} className="bg-zinc-900">
                      {c.name || c.projectName}
                    </option>
                  ))}
                  <option value="NEW_CLIENT" className="bg-zinc-900 text-blue-500">+ ADD NEW CLIENT</option>
                </select>
              </div>

              {showNewClientInput && (
                <div className="space-y-2 animate-ios-slide-up">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">New Client Name</label>
                  <input 
                    required 
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all placeholder:text-zinc-700" 
                    placeholder="Enter full name" 
                    value={newProject.client} 
                    onChange={e => setNewProject({...newProject, client: e.target.value})} 
                  />
                </div>
              )}
              
              <div className="grid grid-cols-1 gap-4">
                 <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Package Amount (₹)</label>
                    <input type="number" required className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all font-mono" placeholder="0" value={newProject.totalAmount} onChange={e => setNewProject({...newProject, totalAmount: Number(e.target.value)})} />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Event Date</label>
                    <input type="date" required className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" value={newProject.eventDate} onChange={e => setNewProject({...newProject, eventDate: e.target.value})} />
                 </div>
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Brand</label>
                    {selectedBrand !== 'All' ? (
                      <div className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-sm font-bold text-zinc-400 cursor-not-allowed">
                        {companies.find(c => c.id === selectedBrand)?.companyName || selectedBrand}
                        <span className="ml-2 text-[8px] opacity-40">(Locked by Global Filter)</span>
                      </div>
                    ) : (
                      <select className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none" value={newProject.brand} onChange={e => setNewProject({...newProject, brand: e.target.value})}>
                        <option value="" disabled className="bg-zinc-900">Select Brand...</option>
                        {companies.map(c => (
                          <option key={c.id} className="bg-zinc-900" value={c.companyName}>{c.companyName.split(' ')[0].toUpperCase()}</option>
                        ))}
                      </select>
                    )}
                  </div>
              </div>
              <div className="pt-6">
                 <button type="submit" className="w-full bg-white text-black px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-zinc-200 transition-all active:scale-95">Initialize Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && projectToDelete && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] animate-modal-overlay"
          onClick={() => { setIsDeleteModalOpen(false); setProjectToDelete(null); }}
        >
          <div 
            className="bg-zinc-900 border border-white/10 rounded-[3rem] w-full max-w-[400px] p-12 shadow-2xl text-center animate-modal-content m-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase mb-4">Purge Project?</h2>
            <p className="text-sm text-zinc-500 font-medium mb-10 pb-4 border-b border-white/5 leading-relaxed">
              Delete <span className="text-white font-black">{projectToDelete.name}</span>? This action will remove the project and all associated operational tracking.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setProjectToDelete(null);
                }}
                className="flex-1 py-5 bg-white/5 text-zinc-500 hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border border-white/5"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-5 bg-red-600 text-white hover:bg-red-500 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                   <>
                     <Loader2 className="w-4 h-4 animate-spin-fast" />
                     Purging...
                   </>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ProductionHub;
