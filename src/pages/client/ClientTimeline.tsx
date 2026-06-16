import React, { useState, useEffect } from 'react';
import { Heart, CheckCircle2, Clock } from 'lucide-react';
import type { Client, Project } from '../../types';
import { WORKFLOW_STAGES, normalizeWorkflowStage } from '../../utils/workflowUtils';
import { api } from '../../services/api';

import ClientPageLoader from './ClientPageLoader';

interface ClientTimelineProps {
  client: Client | null;
}

const ClientTimeline: React.FC<ClientTimelineProps> = ({ client }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const hydrateProjects = async () => {
      try {
        const data = await api.getProjects();
        if (data && Array.isArray(data)) {
          setProjects(data);
        }
      } catch (err) {
        console.warn("Failed to load timeline projects from API", err);
      } finally {
        setLoading(false);
      }
    };
    hydrateProjects();
  }, []);

  if (!client || loading) return <ClientPageLoader />;

  const allProjects = projects;
  const clientProjects = allProjects.filter(p => p.clientId === client.id);
  const mainProject = clientProjects[0] || null;
  const currentStage = normalizeWorkflowStage(mainProject?.stage);
  const currentStageIdx = WORKFLOW_STAGES.indexOf(currentStage as any);
  
  const baseTimeline = client.portal?.timeline || [];
  const eventTimeline = (client.events || []).map(ev => ({
     id: ev.id,
     title: `Event: ${ev.name}`,
     description: `Scheduled. ${ev.venueLocation ? `Venue: ${ev.venueLocation}` : ''}`,
     date: ev.date,
     status: ev.status === 'Completed' ? 'Completed' : 'Pending'
  }));
  const timeline = [...baseTimeline, ...eventTimeline].sort((a, b) => new Date(a.date || '').getTime() - new Date(b.date || '').getTime());

  return (
    <div className="p-8 md:p-12 animate-ios-slide-up max-w-[1400px] mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">Workflow</h1>
        <p className="text-xl text-zinc-400 font-medium">Project Progress & Milestones</p>
      </div>

      <div className="glass-panel p-10 md:p-16 squircle-lg max-w-5xl mb-8">
        <h2 className="text-2xl font-black uppercase tracking-widest mb-12 flex items-center gap-4 text-emerald-400">
          <Clock className="w-6 h-6 text-emerald-400" /> Current Stage Progression
        </h2>
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-black/20 p-6 md:p-10 rounded-3xl border border-white/5">
           {WORKFLOW_STAGES.map((stage, idx) => {
              const isCompleted = idx < currentStageIdx;
              const isActive = idx === currentStageIdx;

              return (
                 <div
                    key={stage}
                    className={`flex flex-col items-center gap-3 flex-1 w-full md:w-auto ${isActive ? 'opacity-100 scale-110 transition-transform' : isCompleted ? 'opacity-80' : 'opacity-40'}`}
                 >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isActive ? 'border-primary bg-primary/10 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : isCompleted ? 'border-primary bg-primary' : 'border-white/10 bg-black'}`}>
                       {isCompleted && <CheckCircle2 className="w-4 h-4 text-black" strokeWidth={3} />}
                       {isActive && <div className="w-3 h-3 rounded-full bg-primary animate-pulse" />}
                    </div>
                    <span className={`text-[9px] md:text-[10px] font-black uppercase tracking-tight text-center max-w-[80px] leading-tight ${isActive ? 'text-primary' : 'text-white'}`}>
                       {stage}
                    </span>
                 </div>
              );
           })}
        </div>
      </div>

      <div className="glass-panel p-10 md:p-16 squircle-lg max-w-3xl">
        <h2 className="text-2xl font-black uppercase tracking-widest mb-12 flex items-center gap-4 text-emerald-400">
          <Heart className="w-6 h-6 fill-emerald-400" /> Journey History
        </h2>
        
        {timeline.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-white/10 rounded-[2rem]">
            <p className="text-sm font-bold text-zinc-600 uppercase tracking-widest">No milestones defined yet.</p>
          </div>
        ) : (
          <div className="space-y-12 relative pl-8">
            <div className="absolute left-[39px] top-2 bottom-2 w-px bg-white/5" />
            {timeline.map((item, index) => {
              const isCompleted = item.status === 'Completed';
              return (
                <div key={item.id || index} className="relative flex gap-10 group">
                  <div className={`z-10 w-6 h-6 rounded-full mt-1 flex items-center justify-center transition-all shadow-[0_0_0_4px_#0b0b0b] ${isCompleted ? 'bg-primary text-black' : 'bg-zinc-800 border-2 border-zinc-700'}`}>
                    {isCompleted && <CheckCircle2 className="w-4 h-4" />}
                  </div>
                  <div>
                    <h4 className={`text-xl font-black uppercase tracking-tight ${isCompleted ? 'text-emerald-400' : 'text-zinc-500'}`}>{item.title}</h4>
                    <p className="text-sm font-medium text-zinc-400 max-w-md leading-relaxed mt-2">{item.description}</p>
                    <span className="text-[10px] font-black text-zinc-600 mt-4 block uppercase tracking-[0.2em]">
                      {item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : 'TBD'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientTimeline;

