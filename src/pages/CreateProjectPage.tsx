import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Calendar, Info, ArrowLeft, Check, HardDrive } from 'lucide-react';
import type { Client, Project, StorageVault } from '../types';
import { api } from '../services/api';
import { getTeamFromClientAssignments } from '../utils/workflowUtils';

const CreateProjectPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [vaults, setVaults] = useState<StorageVault[]>([]);
  const [selectedVaultId, setSelectedVaultId] = useState('');
  
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('Wedding');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<'pending' | 'confirmed'>('pending');
  
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.getClientById(clientId!)
      .then(found => {
        if (found) setClient(found);
      })
      .catch(err => {
        console.error("Failed to fetch client via API:", err);
      })
      .finally(() => {
        setLoading(false);
      });

    api.getCloudConfig().then(config => {
      setVaults(config.vaults || []);
      if (config.vaults && config.vaults.length > 0) {
        setSelectedVaultId(config.vaults[0].id);
      }
    });
  }, [clientId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    setIsSubmitting(true);

    const initialTeam = getTeamFromClientAssignments(clientId!, null);

    const defaultStageTracking: Record<string, { status: 'Pending' | 'In Progress' | 'Completed' }> = {};
    for (let i = 1; i <= 10; i++) {
      defaultStageTracking[String(i)] = { status: 'Pending' };
    }

    const newProject: Project = {
      id: `proj_${new Date().getTime()}`,
      clientId: clientId!,
      divisionId: client.divisionId!,
      name: projectName,
      brand: client.brand,
      type: projectType,
      date,
      status,
      stage: status === 'confirmed' ? 'booked' : 'pending' as any,
      vaultId: selectedVaultId || undefined,
      team: initialTeam,
      teamSnapshot: JSON.parse(JSON.stringify(initialTeam)),
      workflow: [],
      workflowTrigger: {
        event: 'Project Initialized',
        timestamp: new Date().toISOString()
      },
      stageTracking: defaultStageTracking,
      portal: {
        timeline: [
          {
            id: `TL-${Date.now()}-init`,
            title: 'Project Initialized',
            description: `Project launched for event type: ${projectType}`,
            date: new Date().toISOString(),
            status: 'Completed'
          }
        ],
        deliverables: [],
        internalSpends: []
      },
      totalAmount: 0,
      createdAt: new Date().toISOString()
    };

    api.saveProject(newProject)
      .then(() => {
        setTimeout(() => {
          navigate(`/portal/${clientId}`);
        }, 800);
      })
      .catch(err => {
        console.error("Failed to save project via API:", err);
        setIsSubmitting(false);
      });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-10 text-center animate-ios-slide-up">
        <div className="w-20 h-20 bg-red-400/10 rounded-full flex items-center justify-center mb-8 border border-red-400/10">
           <Info className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Identity Match Failed</h1>
        <p className="text-sm text-zinc-300 mt-2 mb-10">Target Client ID {clientId} is missing from active memory</p>
        <button 
          onClick={() => navigate('/directory')}
          className="px-8 py-4 bg-white text-black font-bold uppercase text-xs rounded-xl tracking-widest active:scale-95"
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
          <p className="text-xs font-semibold uppercase text-zinc-400 tracking-[0.3em] mt-1 italic">Client: {client.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel p-10 squircle-lg border border-white/5 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-white/10" />
        
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-zinc-400 tracking-widest px-1">Project Identifier (Name)</label>
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
            <label className="text-xs font-bold uppercase text-zinc-400 tracking-widest px-1">Engagement Type</label>
            <div className="relative">
              <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <select 
                className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 pl-14 text-sm font-medium text-white outline-none appearance-none"
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
            <label className="text-xs font-bold uppercase text-zinc-400 tracking-widest px-1">Target Date</label>
            <div className="relative">
              <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input 
                type="date"
                required
                className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 pl-14 text-sm font-medium text-white outline-none"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t border-white/5">
          <label className="text-xs font-bold uppercase text-zinc-400 tracking-widest px-1">Storage & Vault Configuration</label>
          <div className="relative">
            <HardDrive className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <select 
              className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 pl-14 text-sm font-medium text-white outline-none appearance-none"
              value={selectedVaultId}
              onChange={e => setSelectedVaultId(e.target.value)}
            >
              <option value="" className="bg-zinc-900">Select Storage Account (Vault)...</option>
              {vaults.map(v => (
                <option key={v.id} value={v.id} className="bg-zinc-900">{v.name} ({v.email})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-zinc-400 tracking-widest px-1">Initial Status</label>
          <div className="relative">
            <Info className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <select 
              className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 pl-14 text-sm font-medium text-white outline-none appearance-none"
              value={status}
              onChange={e => setStatus(e.target.value as any)}
            >
              <option value="pending" className="bg-zinc-900 text-amber-500">Pending Authorization</option>
              <option value="confirmed" className="bg-zinc-900 text-primary">Confirmed</option>
            </select>
          </div>
        </div>

        <div className="pt-6">
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-5 bg-white text-black rounded-2xl font-bold uppercase text-xs tracking-widest shadow-2xl hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-3"
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
