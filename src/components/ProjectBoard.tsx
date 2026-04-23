import React from 'react';
import { 
  Calendar, Camera, CheckCircle2, 
  Clock, Package, Image as ImageIcon, 
  Trash2, PlayCircle, Send, CheckCircle, AlertTriangle
} from 'lucide-react';

const STAGES = [
  { id: 'booked', label: 'Booked', icon: Calendar, color: 'text-blue-500', nextAction: 'Mark Event Done', nextStage: 'event_done' },
  { id: 'event_done', label: 'Event Done', icon: Camera, color: 'text-purple-500', nextAction: 'Send for Selection', nextStage: 'selection' },
  { id: 'selection', label: 'Selection', icon: ImageIcon, color: 'text-amber-500', nextAction: 'Start Editing', nextStage: 'editing' },
  { id: 'editing', label: 'Editing', icon: Clock, color: 'text-rose-500', nextAction: 'Ship to Delivery', nextStage: 'delivery' },
  { id: 'delivery', label: 'Delivery', icon: Send, color: 'text-emerald-500', nextAction: 'Finalize Project', nextStage: null }
] as const;

import type { Project, ProjectStage, StaffAssignment } from '../types';

interface ProjectBoardProps {
  projects: Project[];
  onUpdateStage: (id: string, stage: ProjectStage) => void;
  onDeleteProject: (id: string) => void;
  selectedBrand: string | 'All';
  fadingId?: string | null;
}

const ProjectBoard: React.FC<ProjectBoardProps> = ({ projects, onUpdateStage, onDeleteProject, selectedBrand, fadingId }) => {
  
  const filteredProjects = projects.filter(p => selectedBrand === 'All' || p.brand === selectedBrand);

  const calculateProgress = (project: Project) => {
    switch (project.stage) {
      case 'booked': return 10;
      case 'event_done': return 30;
      case 'selection': return 55;
      case 'editing': return 80;
      case 'delivery': return 100;
      default: return 0;
    }
  };

  const getProgressColor = (progress: number, isOverdue: boolean) => {
     if (isOverdue) return 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]';
     if (progress <= 30) return 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]';
     if (progress < 100) return 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]';
     return 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]';
  };

  const checkIsOverdue = (project: Project) => {
     const eventDate = new Date(project.date).getTime();
     const now = new Date().getTime();
     const thirtyDays = 30 * 24 * 60 * 60 * 1000;
     return (now - eventDate > thirtyDays) && project.stage !== 'delivery';
  };

  const isTeamMissing = (project: Project) => {
     if (!project.team) return true;
     return !project.team.photographer && !project.team.videographer && !project.team.editor && !project.team.assistant;
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-10 no-scrollbar min-h-[600px]">
      {STAGES.map(stage => {
        const stageProjects = filteredProjects.filter(p => p.stage === stage.id);
        return (
          <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col gap-6">
            <div className="flex items-center justify-between px-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl bg-zinc-900 border border-white/5 ${stage.color} shadow-[0_0_15px_rgba(0,0,0,0.5)] relative overflow-hidden`}>
                  <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <stage.icon className="w-4 h-4 relative z-10" />
                </div>
                <div>
                   <h3 className="text-[11px] font-black uppercase tracking-widest text-white">{stage.label}</h3>
                   <div className="flex items-center gap-2 mt-1">
                      <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                         <div 
                           className={`h-full ${stage.color.replace('text-', 'bg-')}`} 
                           style={{ width: `${stageProjects.length > 0 ? stageProjects.reduce((acc, p) => acc + calculateProgress(p), 0) / stageProjects.length : 0}%` }}
                         />
                      </div>
                      <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">{stageProjects.length} Items</span>
                   </div>
                </div>
              </div>
            </div>

            <div className="flex-1 space-y-4 bg-white/[0.01] rounded-[2.5rem] p-4 border border-white/5 min-h-[500px]">
              {stageProjects.map(project => {
                const progress = calculateProgress(project);
                const isOverdue = checkIsOverdue(project);
                const missingTeam = isTeamMissing(project);
                const barColor = getProgressColor(progress, isOverdue);
                
                return (
                  <div 
                    key={project.id}
                    className={`glass-panel p-6 squircle-lg border ${isOverdue ? 'border-red-500/30' : 'border-white/5'} bg-zinc-900/40 hover:bg-zinc-900/60 transition-all group relative overflow-hidden ${fadingId === project.id ? 'animate-fade-out' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="max-w-[70%]">
                        <div className="flex items-center gap-2 mb-1">
                           <h4 className="text-[12px] font-black text-white uppercase tracking-tight truncate">{project.name}</h4>
                           {missingTeam && <span title="No team assigned"><AlertTriangle className="w-3 h-3 text-amber-500" /></span>}
                        </div>
                        <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mt-1 truncate">
                          Client ID: {project.clientId}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOverdue && (
                           <span className="text-[8px] bg-red-500/10 text-red-500 px-1.5 py-0.5 rounded border border-red-500/20 font-black uppercase tracking-widest">Delayed</span>
                        )}
                        <button onClick={() => onDeleteProject(project.id)} className="p-2 -mr-2 text-zinc-800 hover:text-red-500 transition-colors">
                           <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">
                          {progress === 100 ? 'Finalized' : `${stage.label} Progress`}
                       </span>
                       <span className="text-[9px] font-black text-white font-mono">
                          {progress}%
                       </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-black rounded-full overflow-hidden mb-6 border border-white/5 relative group/bar" title={`${stage.label}: ${progress}% (Workflow automatically tracked)`}>
                       <div 
                          className={`h-full ${barColor} transition-all duration-700 ease-out`} 
                          style={{ width: `${progress}%` }}
                       />
                       <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                    </div>
                    
                    <div className="flex items-center gap-3 mb-4">
                       <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase tracking-widest border border-blue-500/10">
                          {project.brand}
                       </span>
                        <div className="flex items-center gap-1.5 text-zinc-600">
                          <Calendar className="w-3 h-3" />
                          <span className="text-[9px] font-bold">{new Date(project.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 mb-6 space-y-3">
                       <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-zinc-500">
                          <span>Package Value</span>
                          <span className="text-white font-mono">₹{(project.totalAmount || 0).toLocaleString('en-IN')}</span>
                       </div>
                       {project.team && (
                           <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                              <div className="flex justify-between items-center mb-1">
                                <p className="text-[8px] font-black uppercase text-zinc-700 tracking-widest">Assigned Personnel</p>
                                {(() => {
                                   const projectStaffIds = [
                                      project.team.photographer?.id,
                                      project.team.videographer?.id,
                                      project.team.editor?.id,
                                      project.team.assistant?.id
                                   ].filter(Boolean);

                                   const hasConflict = projects.some(other => {
                                      if (other.id === project.id || other.date !== project.date || !other.team) return false;
                                      const otherStaffIds = [
                                         other.team.photographer?.id,
                                         other.team.videographer?.id,
                                         other.team.editor?.id,
                                         other.team.assistant?.id
                                      ].filter(Boolean);
                                      return projectStaffIds.some(id => otherStaffIds.includes(id));
                                   });

                                   if (hasConflict) {
                                      return (
                                         <span className="flex items-center gap-1 text-[7px] font-black text-amber-500 uppercase tracking-widest bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                                            <AlertTriangle className="w-2.5 h-2.5" /> Conflict
                                         </span>
                                      );
                                   }
                                   return null;
                                })()}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                 {Object.entries(project.team).map(([role, val]) => {
                                    if (!val) return null;
                                    const roleLabel = role.charAt(0).toUpperCase() + role.slice(1);
                                    const staff = val as StaffAssignment;
                                    const isExternal = staff.type === 'external';
                                    
                                    return (
                                       <span key={role} className={`px-2 py-1 rounded-md text-[7px] font-black uppercase tracking-tighter flex items-center gap-1.5 ${isExternal ? 'bg-blue-500/10 text-blue-400 border border-blue-500/10' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10'}`}>
                                          <span className="opacity-50">{roleLabel}:</span> {staff.name} {isExternal && '(EXT)'}
                                       </span>
                                    );
                                 })}
                              </div>
                           </div>
                        )}
                    </div>

                    {stage.nextStage && (
                       <button 
                          onClick={() => onUpdateStage(project.id, stage.nextStage as any)}
                          className={`w-full py-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white text-zinc-400 hover:text-black text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/btn shadow-xl shadow-black/20`}
                       >
                          {stage.id === 'booked' && <PlayCircle className="w-3.5 h-3.5" />}
                          {stage.id === 'event_done' && <Send className="w-3.5 h-3.5" />}
                          {stage.id === 'selection' && <ImageIcon className="w-3.5 h-3.5" />}
                          {stage.id === 'editing' && <CheckCircle className="w-3.5 h-3.5" />}
                          {stage.nextAction}
                       </button>
                    )}

                    {!stage.nextStage && progress === 100 && (
                      <div className="flex items-center justify-center gap-2 py-3 text-emerald-500 text-[9px] font-black uppercase tracking-widest bg-emerald-500/5 rounded-xl border border-emerald-500/10">
                         <CheckCircle2 className="w-4 h-4" /> Finalized
                      </div>
                    )}
                  </div>
                );
              })}
              
              {stageProjects.length === 0 && (
                <div className="py-20 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-[2rem] opacity-20">
                   <Package className="w-8 h-8 text-zinc-500 mb-3" />
                   <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Stage Clear</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProjectBoard;
