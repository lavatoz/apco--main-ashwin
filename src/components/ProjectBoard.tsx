import React from 'react';
import { 
  Calendar, Camera, CheckCircle2, 
  Clock, Package, Image as ImageIcon, 
  Trash2, PlayCircle, Send, CheckCircle
} from 'lucide-react';

const STAGES = [
  { id: 'BOOKED', label: 'Booked', icon: Calendar, color: 'text-blue-500', nextAction: 'Mark Event Done', nextStage: 'EVENT_DONE' },
  { id: 'EVENT_DONE', label: 'Event Done', icon: Camera, color: 'text-purple-500', nextAction: 'Send for Selection', nextStage: 'SELECTION' },
  { id: 'SELECTION', label: 'Selection', icon: ImageIcon, color: 'text-amber-500', nextAction: 'Start Editing', nextStage: 'EDITING' },
  { id: 'EDITING', label: 'Editing', icon: Clock, color: 'text-rose-500', nextAction: 'Finalize Project', nextStage: null }
] as const;

interface OperationalProject {
  id: string;
  title: string;
  client: string;
  brand: string;
  stage: 'BOOKED' | 'EVENT_DONE' | 'SELECTION' | 'EDITING';
  eventDate: string;
  steps: {
    clientInfo: boolean;
    teamAssigned: boolean;
    shootDone: boolean;
    selection: boolean;
    editing: boolean;
    delivery: boolean;
  };
  totalAmount?: number;
}

interface ProjectBoardProps {
  projects: OperationalProject[];
  onUpdateStage: (id: string, stage: OperationalProject['stage']) => void;
  onDeleteProject: (id: string) => void;
  selectedBrand: string;
}

const ProjectBoard: React.FC<ProjectBoardProps> = ({ projects, onUpdateStage, onDeleteProject, selectedBrand }) => {
  
  const filteredProjects = projects.filter(p => selectedBrand === 'All' || p.brand === selectedBrand);

  const calculateProgress = (project: OperationalProject) => {
    switch (project.stage) {
      case 'BOOKED': return 25;
      case 'EVENT_DONE': return 50;
      case 'SELECTION': return 75;
      case 'EDITING': return 100;
      default: return 0;
    }
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-10 no-scrollbar min-h-[600px]">
      {STAGES.map(stage => {
        const stageProjects = filteredProjects.filter(p => p.stage === stage.id);
        return (
          <div key={stage.id} className="flex-shrink-0 w-80 flex flex-col gap-6">
            <div className="flex items-center justify-between px-3">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl bg-zinc-900 border border-white/5 ${stage.color} shadow-lg shadow-black`}>
                  <stage.icon className="w-4 h-4" />
                </div>
                <h3 className="text-[11px] font-black uppercase tracking-widest text-white">{stage.label}</h3>
              </div>
              <span className="text-[10px] font-black text-zinc-500 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                {stageProjects.length}
              </span>
            </div>

            <div className="flex-1 space-y-4 bg-white/[0.01] rounded-[2.5rem] p-4 border border-white/5 min-h-[500px]">
              {stageProjects.map(project => {
                const progress = calculateProgress(project);
                return (
                  <div 
                    key={project.id}
                    className="glass-panel p-6 squircle-lg border border-white/5 bg-zinc-900/40 hover:bg-zinc-900/60 transition-all group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="max-w-[80%]">
                        <h4 className="text-[12px] font-black text-white uppercase tracking-tight truncate">{project.title}</h4>
                        <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mt-1">
                          {project.client}
                        </p>
                      </div>
                      <button onClick={() => onDeleteProject(project.id)} className="p-2 -mr-2 text-zinc-800 hover:text-red-500 transition-colors">
                         <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between mb-2">
                       <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">
                          {progress === 100 ? 'Completed' : `Pipeline Progress: ${progress}%`}
                       </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-6 border border-white/5">
                       <div 
                          className="h-full bg-blue-500 transition-all duration-500" 
                          style={{ width: `${progress}%` }}
                       />
                    </div>
                    
                    <div className="flex items-center gap-3 mb-4">
                       <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase tracking-widest border border-blue-500/10">
                          {project.brand}
                       </span>
                       <div className="flex items-center gap-1.5 text-zinc-600">
                          <Calendar className="w-3 h-3" />
                          <span className="text-[9px] font-bold">{new Date(project.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                       </div>
                    </div>

                    <div className="pt-4 border-t border-white/5 mb-6 space-y-3">
                       <div className="flex justify-between items-center text-[10px] uppercase font-black tracking-widest text-zinc-500">
                          <span>Package Value</span>
                          <span className="text-white font-mono">₹{(project.totalAmount || 0).toLocaleString('en-IN')}</span>
                       </div>
                    </div>

                    {stage.nextStage && (
                      <button 
                         onClick={() => onUpdateStage(project.id, stage.nextStage as any)}
                         className={`w-full py-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white text-zinc-400 hover:text-black text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/btn shadow-xl shadow-black/20`}
                      >
                         {stage.id === 'BOOKED' && <PlayCircle className="w-3.5 h-3.5" />}
                         {stage.id === 'EVENT_DONE' && <Send className="w-3.5 h-3.5" />}
                         {stage.id === 'SELECTION' && <CheckCircle className="w-3.5 h-3.5" />}
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
