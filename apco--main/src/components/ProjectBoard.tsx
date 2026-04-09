
import React, { useState, useEffect } from 'react';
import { 
  Calendar, Camera, CheckCircle2, 
  Clock, Package, Image as ImageIcon, 
  Printer, ChevronRight, User
} from 'lucide-react';
import { type Project } from '../types';
import { api } from '../services/api';

const STAGES = [
  { id: 'booked', label: 'Booked', icon: Calendar, color: 'text-blue-500' },
  { id: 'event_completed', label: 'Event Done', icon: Camera, color: 'text-purple-500' },
  { id: 'photo_selection', label: 'Selection', icon: ImageIcon, color: 'text-amber-500' },
  { id: 'post_production', label: 'Editing', icon: Clock, color: 'text-rose-500' },
  { id: 'album_printing', label: 'Printing', icon: Printer, color: 'text-emerald-500' }
];

interface ProjectBoardProps {
  onOpenProject: (p: Project) => void;
}

const ProjectBoard: React.FC<ProjectBoardProps> = ({ onOpenProject }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const data = await api.getProjects();
      setProjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDragStart = (e: React.DragEvent, projectId: string) => {
    e.dataTransfer.setData('projectId', projectId);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    const projectId = e.dataTransfer.getData('projectId');
    if (!projectId) return;

    // Optimistic Update
    setProjects(prev => prev.map(p => p._id === projectId ? { ...p, status: newStatus as any } : p));

    try {
      await api.updateProjectStatus(projectId, newStatus);
    } catch (err) {
      console.error("Status update failed", err);
      fetchProjects(); // Revert on failure
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (loading) return (
      <div className="flex flex-col items-center justify-center p-20 glass-panel border-dashed border-zinc-800 animate-pulse">
          <Package className="w-10 h-10 text-zinc-800 mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-800">Synchronizing Pipeline...</p>
      </div>
  );

  return (
    <div className="flex gap-6 overflow-x-auto pb-10 no-scrollbar min-h-[600px]">
      {STAGES.map(stage => (
        <div 
          key={stage.id} 
          className="flex-shrink-0 w-80 flex flex-col gap-6"
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, stage.id)}
        >
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-zinc-900 border border-white/5 ${stage.color}`}>
                <stage.icon className="w-4 h-4" />
              </div>
              <h3 className="text-[11px] font-black uppercase tracking-widest text-white">{stage.label}</h3>
            </div>
            <span className="text-[9px] font-black text-zinc-600 bg-white/5 px-2 py-1 rounded-md">
              {projects.filter(p => (p.status || 'booked') === stage.id).length}
            </span>
          </div>

          <div className="flex-1 space-y-4 bg-zinc-900/10 rounded-[2rem] p-4 border border-white/5 min-h-[500px]">
            {projects.filter(p => (p.status || 'booked') === stage.id).map(project => (
              <div 
                key={project._id}
                draggable
                onDragStart={(e) => handleDragStart(e, project._id!)}
                onClick={() => onOpenProject(project)}
                className="glass-panel p-5 squircle-lg border border-white/5 hover:bg-white/5 transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="text-[11px] font-black text-white uppercase tracking-tight">{project.name}</h4>
                    <p className="text-[8px] font-black uppercase text-zinc-600 tracking-widest mt-1 flex items-center gap-2">
                      <User className="w-2.5 h-2.5" /> {(project.client as any)?.name || 'Unknown'}
                    </p>
                  </div>
                  <div className="p-1.5 rounded-lg bg-black text-zinc-800 group-hover:text-blue-500 transition-colors">
                    <ChevronRight className="w-3.5 h-3.5" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-2">
                   <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center">
                         <ImageIcon className="w-3 h-3 text-zinc-600" />
                      </div>
                      <span className="text-[8px] font-black text-zinc-500 uppercase">{project.images?.length || 0} Assets</span>
                   </div>
                   {project.status === 'album_printing' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                </div>
              </div>
            ))}
            
            {projects.filter(p => (p.status || 'booked') === stage.id).length === 0 && (
              <div className="h-40 flex items-center justify-center border border-dashed border-zinc-900 rounded-3xl opacity-30">
                 <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Stage Clear</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ProjectBoard;
