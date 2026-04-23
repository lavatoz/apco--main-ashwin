import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Folder, PlayCircle, CheckCircle, AlertTriangle 
} from 'lucide-react';
import { api } from '../services/api';
import type { Division, Client, Project } from '../types';

const BrandDetailPage: React.FC = () => {
    const { brandId } = useParams<{ brandId: string }>();
    const navigate = useNavigate();
    const [division, setDivision] = useState<Division | null>(null);
    const [clients, setClients] = useState<Client[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const divs = await api.getDivisions();
                
                const slugify = (text: string) => text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
                
                const foundDiv = divs.find(d => slugify(d.name) === brandId || d.id === brandId);
                
                if (foundDiv) {
                    setDivision(foundDiv);
                    const [allClients, allProjects] = await Promise.all([
                        api.getClients(),
                        api.getProjects()
                    ]);
                    
                    const filteredClients = allClients.filter((c: Client) => c.brand === foundDiv.id || c.brand === foundDiv.name || c.divisionId === foundDiv.id);
                    setClients(filteredClients);
                    
                    const filteredProjects = allProjects.filter((p: Project) => p.divisionId === foundDiv.id || p.brand === foundDiv.id || p.brand === foundDiv.name);
                    setProjects(filteredProjects);
                }
            } catch (err) {
                console.error("Error fetching brand details:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [brandId]);

    const stats = useMemo(() => {
        const total = clients.length;
        let activeCount = 0;
        let completedCount = 0;
        let pendingCount = 0;
        
        const activeStages = ['booked', 'event_done', 'selection', 'editing', 'delivery'];
        
        clients.forEach(client => {
            const project = projects.find(p => p.clientId === client.id || p.clientId === client._id);
            const status = (client.status || '').toLowerCase();
            const stage = (project?.stage || '').toLowerCase();
            
            if (status === 'completed' || status === 'delivered' || stage === 'delivered' || stage === 'complete') {
                completedCount++;
            } else {
                if (project) {
                    if (stage === 'booked') {
                        const team = project.team;
                        const isMissing = !team || (!team.photographer && !team.videographer && !team.editor && !team.assistant);
                        if (isMissing) {
                            pendingCount++;
                        } else {
                            activeCount++;
                        }
                    } else if (activeStages.includes(stage)) {
                        activeCount++;
                    } else {
                        activeCount++;
                    }
                } else {
                    activeCount++;
                }
            }
        });
        
        return { total, activeCount, completedCount, pendingCount };
    }, [clients, projects]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] animate-pulse">
                <div className="w-12 h-12 border-4 border-zinc-900 border-t-white rounded-full animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Synchronizing Brand Data...</p>
            </div>
        );
    }

    if (!division) {
        return (
            <div className="p-20 text-center animate-ios-slide-up">
                <h2 className="text-2xl font-black text-white uppercase mb-4">Brand Prototype Not Found</h2>
                <button onClick={() => navigate('/ecosystem')} className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all underline">Return to System Core</button>
            </div>
        );
    }

    const { total, activeCount, completedCount, pendingCount } = stats;

    return (
        <div className="space-y-12 animate-ios-slide-up pb-20 max-w-7xl mx-auto">
            <div className="flex items-center gap-6">
                <button 
                  onClick={() => navigate('/ecosystem')} 
                  className="p-4 bg-white/5 border border-white/10 rounded-2xl text-zinc-500 hover:text-white transition-all group"
                >
                    <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                </button>
                <div>
                    <button 
                        onClick={() => navigate('/ecosystem')} 
                        className="text-[10px] font-black uppercase text-zinc-600 tracking-widest hover:text-zinc-400 transition-all mb-2 block"
                    >
                        ← Back to Ecosystem
                    </button>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">{division.name}</h1>
                    <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] mt-3 italic">{division.description || `${division.type} Vertical Production`}</p>
                </div>
            </div>

            <div className="space-y-8">
                <h2 className="text-[11px] font-black uppercase text-zinc-600 tracking-[0.3em] px-2">Operational Overview</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="glass-panel p-8 border border-white/5 squircle-xl bg-white/[0.02] relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: division.color ? `${division.color}20` : '#71717a20' }} />
                        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: division.color || '#71717a' }} />
                        
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                                <Folder className="w-5 h-5 text-zinc-400" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-4xl font-black text-white mb-1">{total}</h3>
                            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Total Projects</p>
                        </div>
                    </div>

                    <div className="glass-panel p-8 border border-white/5 squircle-xl bg-white/[0.02] relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/10" />
                        <div className="absolute top-0 left-0 w-1 h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
                        
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/10 text-blue-500">
                                <PlayCircle className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-4xl font-black text-white mb-1">{activeCount}</h3>
                            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Active (In Progress)</p>
                        </div>
                    </div>

                    <div className="glass-panel p-8 border border-white/5 squircle-xl bg-white/[0.02] relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/10" />
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
                        
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/10 text-emerald-500">
                                <CheckCircle className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-4xl font-black text-white mb-1">{completedCount}</h3>
                            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Completed</p>
                        </div>
                    </div>

                    <div className="glass-panel p-8 border border-white/5 squircle-xl bg-white/[0.02] relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/10" />
                        <div className="absolute top-0 left-0 w-1 h-full bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]" />
                        
                        <div className="flex justify-between items-start mb-6">
                            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/10 text-amber-500">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-4xl font-black text-white mb-1">{pendingCount}</h3>
                            <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Pending (Needs Attention)</p>
                        </div>
                    </div>
                </div>

                {total === 0 && (
                    <div className="py-20 text-center border border-dashed border-white/5 rounded-[3rem] bg-white/[0.01] animate-ios-slide-up">
                        <p className="text-[10px] font-black uppercase text-zinc-800 tracking-[0.2em]">No operational records for {division.name}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BrandDetailPage;
