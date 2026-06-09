import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Briefcase, ArrowLeft, CheckCircle2 } from 'lucide-react';
import type { Division, Client, Project } from '../types';

const DivisionDashboard: React.FC = () => {
    const { divisionId } = useParams<{ divisionId: string }>();
    const navigate = useNavigate();
    const [division, setDivision] = useState<Division | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    const refreshData = useCallback(() => {
        const storedDivs = localStorage.getItem('divisions');
        const divs: Division[] = storedDivs ? JSON.parse(storedDivs) : [];
        const foundDiv = divs.find(d => d.id === divisionId);
        
        if (foundDiv) {
            setDivision(foundDiv);
            
            const storedClients = localStorage.getItem('clients');
            const allClients: Client[] = storedClients ? JSON.parse(storedClients) : [];
            setClients(allClients.filter(c => c.divisionId === divisionId));

            const storedProjects = localStorage.getItem('projects');
            const allProjects: Project[] = storedProjects ? JSON.parse(storedProjects) : [];
            setProjects(allProjects.filter((p: Project) => p.divisionId === divisionId));
        }
    }, [divisionId]);

    useEffect(() => {
        setLoading(true);
        refreshData();
        setLoading(false);
    }, [refreshData]);

    const handleConfirmProject = (projectId: string) => {
        const stored = localStorage.getItem('projects');
        if (!stored) return;
        const allProjects: Project[] = JSON.parse(stored);
        const updated = allProjects.map(p => 
            p.id === projectId 
            ? { ...p, status: 'confirmed' as const, stage: 'booked' as const } 
            : p
        );
        localStorage.setItem('projects', JSON.stringify(updated));
        refreshData();
    };

    if (loading) return <div className="min-h-screen bg-transparent flex items-center justify-center font-bold uppercase tracking-widest text-xs text-white">Initializing Unit...</div>;

    if (!division) return (
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-10 text-center animate-ios-slide-up">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Project Hub Not Found</h1>
            <p className="text-xs font-bold uppercase text-zinc-400 tracking-[0.2em] mt-2 mb-10">Operational Unit mapping failed for ID: {divisionId}</p>
            <button onClick={() => navigate('/ecosystem')} className="px-8 py-4 bg-white text-black font-bold uppercase text-xs rounded-xl tracking-widest active:scale-95 transition-all">Return to Enterprise</button>
        </div>
    );

    return (
        <div className="space-y-12 animate-ios-slide-up pb-20">
            <div className="flex items-center gap-6">
                <button onClick={() => navigate('/ecosystem')} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-zinc-500 hover:text-white transition-all">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight uppercase leading-none">{division.name}</h1>
                    <p className="text-xs font-bold uppercase text-zinc-400 tracking-[0.3em] mt-2 italic">{division.type} Operational Project Hub</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Statistics */}
                <div className="glass-panel p-10 squircle-lg border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-1 h-full bg-white/10 group-hover:bg-primary transition-all" />
                    <div className="flex items-center gap-6 mb-8 text-primary">
                        <Users className="w-10 h-10" />
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Active Records</p>
                            <h2 className="text-3xl font-black text-white leading-none">{clients.length} Clients</h2>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-10 squircle-lg border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-1 h-full bg-white/10 group-hover:bg-primary transition-all" />
                    <div className="flex items-center gap-6 mb-8 text-primary">
                        <Briefcase className="w-10 h-10" />
                        <div>
                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">Operations Ledger</p>
                            <h2 className="text-3xl font-black text-white leading-none">{projects.length} Active Jobs</h2>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Recent Clients */}
                <div className="space-y-6">
                    <h3 className="text-xs font-bold uppercase text-zinc-400 tracking-widest px-2">Key Personnel (Clients)</h3>
                    <div className="space-y-3">
                        {clients.map(c => (
                            <button key={c.id} onClick={() => navigate(`/client/${c.id}`)} className="w-full text-left p-6 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center group hover:bg-white/10 transition-all">
                                <div>
                                    <h4 className="text-sm font-semibold text-white uppercase">{c.name || c.projectName}</h4>
                                    <p className="text-xs font-medium text-zinc-500 uppercase mt-0.5">{c.email || 'No email'}</p>
                                </div>
                                <span className="text-xs font-bold">Details</span>
                            </button>
                        ))}
                        {clients.length === 0 && <p className="text-xs text-zinc-600 italic px-2">No personnel mapped to this unit.</p>}
                    </div>
                </div>

                {/* Recent Projects */}
                <div className="space-y-6">
                    <h3 className="text-xs font-bold uppercase text-zinc-400 tracking-widest px-2">Production Status (Projects)</h3>
                    <div className="space-y-3">
                        {projects.map(p => (
                            <div key={p.id} className="w-full p-6 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center group hover:bg-white/10 transition-all">
                                <button onClick={() => navigate(`/portal/${p.clientId}`)} className="flex-1 text-left">
                                    <h4 className="text-sm font-semibold text-white uppercase">{p.name}</h4>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-widest ${p.status === 'confirmed' ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-500'}`}>
                                            {p.status === 'confirmed' ? 'Authorization Confirmed' : 'Pending Auth'}
                                        </span>
                                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Stage: {p.stage} • {p.date}</p>
                                    </div>
                                </button>
                                <div className="flex items-center gap-3">
                                    {p.status === 'pending' && (
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleConfirmProject(p.id); }}
                                            className="px-4 py-2 bg-primary text-black font-bold uppercase text-xs rounded-lg tracking-widest hover:brightness-110 active:scale-95 transition-all flex items-center gap-2"
                                        >
                                            <CheckCircle2 className="w-3 h-3" /> Confirm
                                        </button>
                                    )}
                                    <button onClick={() => navigate(`/portal/${p.clientId}`)} className="text-xs font-bold px-2 py-1 bg-white/5 text-zinc-400 rounded border border-white/5 group-hover:text-primary uppercase transition-all tracking-widest">Navigate</button>
                                </div>
                            </div>
                        ))}
                        {projects.length === 0 && <p className="text-xs text-zinc-600 italic px-2">Operations ledger is empty.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DivisionDashboard;

