import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Calendar, Info, ArrowLeft, Check } from 'lucide-react';
import type { Client } from '../types';

const CreateProjectPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('Wedding');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('Pending');
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    const storedClients = localStorage.getItem('clients');
    if (storedClients) {
      const clients: Client[] = JSON.parse(storedClients);
      const found = clients.find(c => String(c.id) === String(clientId));
      if (found) setClient(found);
    }
    setLoading(false);
  }, [clientId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    setIsSubmitting(true);

    const newProject = {
      id: `proj_${Date.now()}`,
      clientId,
      divisionId: client.divisionId,
      name: projectName,
      type: projectType,
      date,
      status,
      createdAt: new Date().toISOString()
    };

    const storedProjects = localStorage.getItem('projects');
    const projects = storedProjects ? JSON.parse(storedProjects) : [];
    projects.push(newProject);
    localStorage.setItem('projects', JSON.stringify(projects));

    setTimeout(() => {
      navigate(`/portal/${clientId}`);
    }, 800);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10 text-center animate-ios-slide-up">
        <div className="w-20 h-20 bg-red-400/10 rounded-full flex items-center justify-center mb-8 border border-red-400/10">
           <Info className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Identity Match Failed</h1>
        <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em] mt-2 mb-10">Target Client ID {clientId} is missing from active memory</p>
        <button 
          onClick={() => navigate('/directory')}
          className="px-8 py-4 bg-white text-black font-black uppercase text-[10px] rounded-xl tracking-widest active:scale-95"
        >
          Return to Hub
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 animate-ios-slide-up">
      <div className="flex items-center gap-6 mb-12">
        <button onClick={() => navigate('/directory')} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-zinc-500 hover:text-white transition-all"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">New Project Initiation</h1>
          <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] mt-1 italic">Client: {client.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel p-10 squircle-lg border border-white/5 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-white/10" />
        
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Project Identifier (Name)</label>
          <div className="relative">
            <LayoutDashboard className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
            <input 
              required
              className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 pl-14 text-sm font-black text-white outline-none focus:bg-white/10 transition-all placeholder:text-zinc-800"
              placeholder="e.g. Rahul & Smriti Marriage"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Engagement Type</label>
            <div className="relative">
              <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <select 
                className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 pl-14 text-xs font-black text-white outline-none appearance-none"
                value={projectType}
                onChange={e => setProjectType(e.target.value)}
              >
                <option value="Wedding" className="bg-zinc-900">Wedding Film</option>
                <option value="Kids" className="bg-zinc-900">Kids / Maternity</option>
                <option value="Corporate" className="bg-zinc-900">Corporate Branding</option>
                <option value="General" className="bg-zinc-900">General Production</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Target Date</label>
            <div className="relative">
              <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input 
                type="date"
                required
                className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 pl-14 text-xs font-black text-white outline-none"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Initial Status</label>
          <div className="relative">
            <Info className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <select 
              className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 pl-14 text-xs font-black text-white outline-none appearance-none"
              value={status}
              onChange={e => setStatus(e.target.value)}
            >
              <option value="Pending" className="bg-zinc-900 text-amber-500">Pending Authorization</option>
              <option value="Ongoing" className="bg-zinc-900 text-blue-500">Live Production</option>
              <option value="Completed" className="bg-zinc-900 text-emerald-500">Archived / Post</option>
            </select>
          </div>
        </div>

        <div className="pt-6">
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-2xl hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <><Check className="w-4 h-4" /> Secure Project Launch</>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateProjectPage;
