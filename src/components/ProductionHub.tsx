import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  CheckCircle2, Package, Plus, X, Layers
} from 'lucide-react';
import { type Client, type Task, TaskStatus, type Project, type ProjectStage } from '../types';
import ProjectBoard from './ProjectBoard';

interface ProductionHubProps {
  clients: Client[];
  tasks: Task[];
  selectedBrand: string | 'All';
}

const ProductionHub: React.FC<ProductionHubProps> = ({ tasks, selectedBrand, clients: allClients }) => {
  const location = useLocation();
  const locationState = location.state as { prefillClient?: string; brand?: string } | null;

  const [isCreating, setIsCreating] = useState(!!locationState?.prefillClient);
  const [showNewClientInput, setShowNewClientInput] = useState(false);
  const isPrefilled = !!locationState?.prefillClient;
  const [newProject, setNewProject] = useState({ 
    title: locationState?.prefillClient ? `${locationState.prefillClient} Project` : '', 
    client: locationState?.prefillClient || '', 
    brand: locationState?.brand || (selectedBrand !== 'All' ? selectedBrand : 'AAHA Kalyanam'), 
    eventDate: '', 
    stage: 'booked' as ProjectStage,
    totalAmount: 0
  });

  useEffect(() => {
    if (locationState?.prefillClient) {
       // Clear state to prevent re-opening on manual refreshes
       window.history.replaceState({}, document.title);
    }
  }, [locationState]);

  // Unified Project Store
  const [projectRegistry, setProjectRegistry] = useState<Project[]>(() => {
    try {
      const stored = localStorage.getItem('projects');
      const allProjects: Project[] = stored ? JSON.parse(stored) : [];
      // Only show confirmed projects in Operations
      return allProjects.filter(p => p.status === 'confirmed');
    } catch {
      return [];
    }
  });

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    const project: Project = {
       id: `PRJ-${Date.now().toString().slice(-6)}`,
       name: newProject.title,
       clientId: newProject.client, // This will be the name in this case
       brand: newProject.brand,
       divisionId: (allClients.find(c => c.name === newProject.client)?.divisionId) || 'dev_01',
       type: 'General',
       date: newProject.eventDate,
       status: 'confirmed', // Requirement 6
       stage: 'booked',
       totalAmount: newProject.totalAmount,
       createdAt: new Date().toISOString()
    };
    
    // Add to main projects store
    const stored = localStorage.getItem('projects');
    const allProjects = stored ? JSON.parse(stored) : [];
    const updatedAll = [...allProjects, project];
    localStorage.setItem('projects', JSON.stringify(updatedAll));
    
    // Update local registry (filtered confirmed)
    setProjectRegistry(updatedAll.filter(p => p.status === 'confirmed'));
    
    setIsCreating(false);
    setShowNewClientInput(false);
    setNewProject({ 
        title: '', 
        client: '', 
        brand: selectedBrand !== 'All' ? selectedBrand : 'AAHA Kalyanam', 
        eventDate: '', 
        stage: 'booked' as any,
        totalAmount: 0
    });
  };

  const updateProjectStage = (id: string, stage: ProjectStage) => {
    const stored = localStorage.getItem('projects');
    const allProjects: Project[] = stored ? JSON.parse(stored) : [];
    const updated = allProjects.map(p => p.id === id ? { ...p, stage } : p);
    localStorage.setItem('projects', JSON.stringify(updated));
    setProjectRegistry(updated.filter(p => p.status === 'confirmed'));
  };

  const deleteProject = (id: string) => {
    const stored = localStorage.getItem('projects');
    const allProjects: Project[] = stored ? JSON.parse(stored) : [];
    const updated = allProjects.filter(p => p.id !== id);
    localStorage.setItem('projects', JSON.stringify(updated));
    setProjectRegistry(updated.filter(p => p.status === 'confirmed'));
  };

  const filteredTasks = tasks.filter(t => (selectedBrand === 'All' || t.brand === selectedBrand) && t.status !== TaskStatus.Done);

  return (
    <div className="space-y-10 animate-ios-slide-up pb-20">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Operations</h1>
            <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em]">Production Pipeline & Logistics</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="bg-white text-black px-8 py-3.5 squircle-sm font-black uppercase text-[11px] tracking-widest flex items-center gap-3 hover:bg-zinc-200 transition-all shadow-2xl shadow-white/10 active:scale-95 group">
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" /> New Project
        </button>
      </div>

      {/* Multi-Stage Kanban Pipeline */}
      <ProjectBoard 
        projects={projectRegistry} 
        onUpdateStage={updateProjectStage}
        onDeleteProject={deleteProject}
        selectedBrand={selectedBrand}
      />

      <div className="grid grid-cols-1 gap-6">
        <div className="glass-panel p-8 squircle-lg space-y-8 bg-zinc-900/20 border border-white/5">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
              <Layers className="w-4 h-4 text-blue-500" /> Pending Operations
            </h3>
            <span className="text-[10px] font-black uppercase text-zinc-500 bg-white/5 px-3 py-1 rounded-lg border border-white/5">{filteredTasks.length} Assigned</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTasks.length === 0 ? (
                <div className="col-span-full py-16 text-center text-zinc-800">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-4 opacity-10" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Queue Fully Processed</p>
                </div>
            ) : filteredTasks.map(task => (
                <div key={task.id} className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center gap-4 hover:bg-white/5 transition-all">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/10">
                     <Package className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h4 className="font-black text-[11px] uppercase text-white truncate">{task.title}</h4>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">{task.brand} • {task.assignee}</p>
                  </div>
                </div>
            ))}
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
                    <select className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none" value={newProject.brand} onChange={e => setNewProject({...newProject, brand: e.target.value})}>
                        <option className="bg-zinc-900" value="AAHA Kalyanam">AAHA Kalyanam</option>
                        <option className="bg-zinc-900" value="Tiny Toes">Tiny Toes</option>
                    </select>
                 </div>
              </div>
              <div className="pt-6">
                 <button type="submit" className="w-full bg-white text-black px-8 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-zinc-200 transition-all active:scale-95">Initialize Project</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionHub;
