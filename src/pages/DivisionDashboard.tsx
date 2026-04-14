import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Briefcase, ArrowLeft } from 'lucide-react';
import type { Division, Client } from '../types';

const DivisionDashboard: React.FC = () => {
    const { divisionId } = useParams<{ divisionId: string }>();
    const navigate = useNavigate();
    const [division, setDivision] = useState<Division | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        const storedDivs = localStorage.getItem('divisions');
        const divs: Division[] = storedDivs ? JSON.parse(storedDivs) : [];
        const foundDiv = divs.find(d => d.id === divisionId);
        
        if (foundDiv) {
            setDivision(foundDiv);
            
            const storedClients = localStorage.getItem('clients');
            const allClients: Client[] = storedClients ? JSON.parse(storedClients) : [];
            setClients(allClients.filter(c => c.divisionId === divisionId));

            const storedProjects = localStorage.getItem('projects');
            const allProjects = storedProjects ? JSON.parse(storedProjects) : [];
            setProjects(allProjects.filter((p: any) => p.divisionId === divisionId));
        }
        setLoading(false);
    }, [divisionId]);

    if (loading) return <div className="min-h-screen bg-black flex items-center justify-center font-black uppercase tracking-widest text-[10px] text-white">Initializing Unit...</div>;

    if (!division) return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10 text-center animate-ios-slide-up">
            <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Division Not Found</h1>
            <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.2em] mt-2 mb-10">Operational Unit mapping failed for ID: {divisionId}</p>
            <button onClick={() => navigate('/system')} className="px-8 py-4 bg-white text-black font-black uppercase text-[10px] rounded-xl">Return to Enterprise</button>
        </div>
    );

    return (
        <div className="space-y-12 animate-ios-slide-up pb-20">
            <div className="flex items-center gap-6">
                <button onClick={() => navigate('/system')} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-zinc-500 hover:text-white transition-all">
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight uppercase leading-none">{division.name}</h1>
                    <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] mt-2 italic">{division.type} Operational Hub</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Statistics */}
                <div className="glass-panel p-10 squircle-lg border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-1 h-full bg-blue-500/20 group-hover:bg-blue-500 transition-all" />
                    <div className="flex items-center gap-6 mb-8 text-blue-500">
                        <Users className="w-10 h-10" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Active Records</p>
                            <h2 className="text-3xl font-black text-white leading-none">{clients.length} Clients</h2>
                        </div>
                    </div>
                </div>

                <div className="glass-panel p-10 squircle-lg border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-1 h-full bg-emerald-500/20 group-hover:bg-emerald-500 transition-all" />
                    <div className="flex items-center gap-6 mb-8 text-emerald-500">
                        <Briefcase className="w-10 h-10" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Operations Ledger</p>
                            <h2 className="text-3xl font-black text-white leading-none">{projects.length} Active Jobs</h2>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Recent Clients */}
                <div className="space-y-6">
                    <h3 className="text-[11px] font-black uppercase text-zinc-600 tracking-widest px-2">Key Personnel (Clients)</h3>
                    <div className="space-y-3">
                        {clients.map(c => (
                            <button key={c.id} onClick={() => navigate(`/client/${c.id}`)} className="w-full text-left p-6 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center group hover:bg-white/10 transition-all">
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase">{c.name || c.projectName}</h4>
                                    <p className="text-[9px] font-bold text-zinc-600 uppercase mt-0.5">{c.email || 'No email'}</p>
                                </div>
                                <span className="text-[8px] font-black px-2 py-1 bg-white/5 text-zinc-500 rounded border border-white/5 group-hover:text-white uppercase transition-all">Details</span>
                            </button>
                        ))}
                        {clients.length === 0 && <p className="text-[10px] text-zinc-700 italic px-2">No personnel mapped to this unit.</p>}
                    </div>
                </div>

                {/* Recent Projects */}
                <div className="space-y-6">
                    <h3 className="text-[11px] font-black uppercase text-zinc-600 tracking-widest px-2">Production Status (Projects)</h3>
                    <div className="space-y-3">
                        {projects.map(p => (
                            <button key={p.id} onClick={() => navigate(`/portal/${p.clientId}`)} className="w-full text-left p-6 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center group hover:bg-white/10 transition-all">
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase">{p.name}</h4>
                                    <p className="text-[9px] font-bold text-zinc-600 uppercase mt-0.5">{p.status} • {p.date}</p>
                                </div>
                                <span className="text-[8px] font-black px-2 py-1 bg-white/5 text-zinc-500 rounded border border-white/5 group-hover:text-blue-500 uppercase transition-all">Navigate</span>
                            </button>
                        ))}
                        {projects.length === 0 && <p className="text-[10px] text-zinc-700 italic px-2">Operations ledger is empty.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DivisionDashboard;
