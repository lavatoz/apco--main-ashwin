
import React, { useState } from 'react';
import {
  CheckCircle2,
  Package, Plus, X
} from 'lucide-react';
import { type Client, type Task, TaskStatus, type Company, type Project } from '../types';
import ProjectBoard from './ProjectBoard';

interface ProductionHubProps {
  companies: Company[];
  clients: Client[];
  tasks: Task[];
  selectedBrand: string | 'All';
  onOpenClient: (project: Project) => void;
}

const ProductionHub: React.FC<ProductionHubProps> = ({ companies, tasks, selectedBrand, onOpenClient, clients: allClients }) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newProject, setNewProject] = useState({ name: '', clientId: '', description: '' });


  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
        const token = localStorage.getItem("token");
        const res = await fetch('http://localhost:5000/api/projects', {
            method: 'POST',
            headers: { 
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                name: newProject.name,
                client: newProject.clientId,
                description: newProject.description,
                brandId: companies[0]?._id || companies[0]?.id
            })
        });
        if (res.ok) {
            setIsCreating(false);
            setNewProject({ name: '', clientId: '', description: '' });
        }
    } catch(err) {
        console.error("Project creation failed", err);
    }
  };

  const filteredTasks = tasks.filter(t => (selectedBrand === 'All' || t.brand === selectedBrand) && t.status !== TaskStatus.Done);

  return (
    <div className="space-y-10 animate-ios-slide-up pb-20">
      <div className="flex justify-between items-end">
        <div className="space-y-2">
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Operations</h1>
            <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em]">Production Pipeline & Logistics</p>
        </div>
        <button onClick={() => setIsCreating(true)} className="bg-white text-black px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-xl active:scale-95">
            <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {/* Multi-Stage Kanban Pipeline */}
      <ProjectBoard onOpenProject={onOpenClient} />

      <div className="grid grid-cols-1 gap-6">
        <div className="glass-panel p-8 squircle-lg space-y-8 bg-zinc-900/20">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
              <Package className="w-4 h-4 text-amber-500" /> Tasks
            </h3>
            <span className="text-[9px] font-black uppercase text-zinc-500">{filteredTasks.length} Pending</span>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar">
            {filteredTasks.length === 0 ? (
                <div className="py-20 text-center text-zinc-800">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-4 opacity-20" />
                    <p className="text-[10px] font-black uppercase tracking-widest">Clear Queue</p>
                </div>
            ) : filteredTasks.map(task => (
                <div key={task.id} className="p-4 bg-zinc-900/50 border border-white/5 rounded-[1.2rem] flex items-center gap-4">
                  <div className="flex-1">
                    <h4 className="font-black text-xs uppercase text-white">{task.title}</h4>
                    <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{task.assignee}</p>
                  </div>
                </div>
            ))}
          </div>
        </div>
      </div>

      {isCreating && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-xl">
          <div className="bg-zinc-900 border border-white/10 squircle-lg w-full max-w-lg p-10 shadow-2xl animate-ios-slide-up">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">New Project</h2>
              <button onClick={() => setIsCreating(false)} className="p-2 bg-white/5 rounded-full"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleCreateProject} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest">Project Title</label>
                <input required className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none" value={newProject.name} onChange={e => setNewProject({...newProject, name: e.target.value})} />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest">Link to Client</label>
                <select required className="w-full bg-black border border-white/10 rounded-xl p-4 text-sm font-bold text-white outline-none" value={newProject.clientId} onChange={e => setNewProject({...newProject, clientId: e.target.value})}>
                    <option value="">Select...</option>
                    {allClients.map(c => <option key={c._id} value={c._id || ''}>{typeof c === 'string' ? c : c.name || c.projectName}</option>)}
                </select>
              </div>
              <button type="submit" className="w-full bg-white text-black px-8 py-4 rounded-xl font-black uppercase text-[11px] tracking-widest shadow-xl hover:bg-zinc-200 transition-all">Start Project</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductionHub;
