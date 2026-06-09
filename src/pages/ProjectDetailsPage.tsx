
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Users, CheckSquare, 
  Clock, Camera, Video, Edit3, 
  User as UserIcon
} from 'lucide-react';
import type { Project, Client, StaffAssignment } from '../types';
import { getProjectStageLabel, getProjectStageProgress } from '../utils/projectStages';
import { safeParse } from '../utils/storage';

const ProjectDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Basic local data fetch
    const fetchProjectData = () => {
      try {
        const storedProjects = safeParse<Project[]>('projects', []);
        const targetProject = storedProjects.find((p: Project) => p.id === id);
        
        if (targetProject) {
          setProject(targetProject);
          
          // Fetch linked client
          const storedClients = safeParse<Client[]>('clients', []);
          const targetClient = storedClients.find((c: Client) => String(c.id) === String(targetProject.clientId)) || null;
          setClient(targetClient);
        }
      } catch (error) {
        console.error("Error loading project data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjectData();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-10 text-center">
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Project Not Found</h1>
        <p className="text-zinc-500 mb-8">The requested project identifier does not exist in our registry.</p>
        <button 
          onClick={() => navigate(-1)}
          className="px-8 py-3 bg-white text-black font-bold uppercase text-xs tracking-widest rounded-xl"
        >
          Return to Hub
        </button>
      </div>
    );
  }

  const currentStage = project.stage || 'booked';

  return (
    <div className="min-h-screen bg-transparent text-white p-8 md:p-12 animate-ios-slide-up">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center gap-3 text-zinc-500 hover:text-white transition-all mb-12 group"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        <span className="text-xs font-bold uppercase tracking-[0.2em]">Back to Command Center</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Core Info */}
        <div className="lg:col-span-2 space-y-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
               <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-zinc-400 uppercase tracking-widest">
                 {project.brand}
               </span>
               <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest ${project.status === 'confirmed' ? 'bg-primary/10 text-primary border border-primary/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'}`}>
                 {project.status}
               </span>
            </div>
            <h1 className="text-6xl font-black tracking-tighter uppercase leading-none">{project.name}</h1>
            <p className="text-zinc-500 text-lg font-bold uppercase tracking-wider flex items-center gap-3">
              <UserIcon className="w-5 h-5" /> {client?.projectName || client?.name || 'Assigned Client'}
            </p>
          </div>

          {/* Progress Section */}
          <div className="glass-panel p-10 squircle-lg border border-white/5 space-y-8">
             <div className="flex justify-between items-end">
                <div>
                   <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-1">Current Production Stage</p>
                   <h3 className="text-2xl font-black uppercase">{getProjectStageLabel(currentStage)}</h3>
                </div>
                <div className="text-right">
                   <p className="text-3xl font-black">{Math.round(getProjectStageProgress(currentStage))}%</p>
                </div>
             </div>
             <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                <div 
                  className="h-full bg-white ios-transition" 
                  style={{ width: `${getProjectStageProgress(currentStage)}%` }}
                />
             </div>
             <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-600">
                <span>Kickoff</span>
                <span>Production</span>
                <span>Selection</span>
                <span>Post</span>
                <span>Delivery</span>
             </div>
          </div>

          {/* Tasks Section */}
          <div className="space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3">
              <CheckSquare className="w-5 h-5 text-zinc-400" /> Operational Coordination
            </h3>
            <div className="grid grid-cols-1 gap-8">
              {['Planning', 'Shoot', 'Editing', 'Delivery'].map((stage) => {
                 const stageTasks = project.subTasks?.[stage] || [];
                 if (stageTasks.length === 0) return null;

                 const pending = stageTasks.filter((t: any) => (t.status === 'pending' || (!t.status && !t.isCompleted)));
                 const ongoing = stageTasks.filter((t: any) => t.status === 'ongoing');
                 const completed = stageTasks.filter((t: any) => t.status === 'completed' || (!t.status && t.isCompleted));

                 const renderGroup = (tasks: any[], title: string, color: string, Icon: any) => (
                    tasks.length > 0 && (
                       <div className="space-y-3">
                          <h5 className={`text-[10px] font-bold uppercase tracking-[0.2em] text-${color}-500 opacity-80`}>{title}</h5>
                          {tasks.map((t: any) => (
                             <div key={t.id} className="p-4 bg-white/[0.03] border border-white/5 rounded-2xl flex items-center justify-between">
                                <span className={`text-xs font-bold uppercase tracking-widest ${t.status === 'completed' || t.isCompleted ? 'text-zinc-500 line-through' : 'text-zinc-300'}`}>{t.label}</span>
                                <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-${color}-500 px-3 py-1.5 rounded-lg bg-${color}-500/10`}>
                                   <Icon className="w-3 h-3" /> {title.replace('Services', '').trim()}
                                </div>
                             </div>
                          ))}
                       </div>
                    )
                 );

                 return (
                    <div key={stage} className="space-y-4">
                       <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white border-b border-white/10 pb-2">{stage}</h4>
                       {renderGroup(ongoing, 'Ongoing', 'blue', Clock)}
                       {renderGroup(pending, 'Pending', 'amber', CheckSquare)}
                       {renderGroup(completed, 'Completed', 'emerald', CheckSquare)}
                    </div>
                 );
              })}
              {(!project.subTasks || Object.values(project.subTasks).every(arr => arr.length === 0)) && (
                <div className="py-12 border-2 border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center">
                   <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">No Coordination Tasks Defined</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Logistics & Team */}
        <div className="space-y-8">
           <div className="glass-panel p-8 squircle-lg border border-white/5 space-y-8 h-fit">
              <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-3 mb-6">
                <Users className="w-5 h-5 text-zinc-400" /> Crew Deployment
              </h3>
              
              <div className="space-y-6">
                {Object.entries(project.team || {}).map(([role, val]) => {
                  if (!val || (Array.isArray(val) && val.length === 0)) return null;
                  
                  // Handle both singular (legacy) and array (new) formats
                  const assignments: StaffAssignment[] = Array.isArray(val) ? val : [val as StaffAssignment];
                  const Icon = role.includes('photo') ? Camera : role.includes('video') ? Video : role.includes('edit') ? Edit3 : Users;
                  
                  return assignments.map((staff, index) => (
                    <div key={`${role}-${index}`} className="flex items-center gap-4 group">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0 group-hover:bg-white group-hover:text-black transition-all shadow-xl shadow-white/5">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1">{role} {assignments.length > 1 ? `#${index + 1}` : ''}</p>
                        <div className="flex items-center justify-between">
                           <p className="text-sm font-semibold uppercase text-white tracking-tight">{staff.name || 'Unassigned'}</p>
                           <div className="flex flex-wrap gap-1 mt-1.5">
                              {staff.assigned_dates && staff.assigned_dates.map(d => (
                                <span key={d} className="px-1.5 py-0.5 bg-white/5 border border-white/5 rounded text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                  {new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                </span>
                              ))}
                              {staff.type === 'external' && (
                                <span className="text-[10px] font-bold">Agent</span>
                              )}
                           </div>
                        </div>
                      </div>
                    </div>
                  ));
                })}
              </div>

              <div className="pt-8 border-t border-white/5 space-y-4">
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-zinc-400">
                  <span>Engagement Value</span>
                  <span className="text-white text-lg font-bold">₹{project.financials?.total?.toLocaleString('en-IN') || project.totalAmount?.toLocaleString('en-IN') || '0'}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-zinc-400">
                  <span>Amount Paid</span>
                  <span className="text-primary text-lg font-bold">₹{project.financials?.paid?.toLocaleString('en-IN') || '0'}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-zinc-400">
                  <span>Balance Due</span>
                  <span className="text-amber-500 text-lg font-bold">₹{project.financials?.balance?.toLocaleString('en-IN') || project.totalAmount?.toLocaleString('en-IN') || '0'}</span>
                </div>
                <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-zinc-400">
                  <span>Target Date</span>
                  <span className="text-white text-lg font-bold">{new Date(project.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                </div>
              </div>
           </div>

           <div className="p-8 bg-zinc-900 border border-white/5 squircle-lg space-y-4">
              <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Client Brief</h4>
              <p className="text-sm text-zinc-300 leading-relaxed font-medium transition-all">
                {project.description || "System established for luxury production. Operational parameters set based on initial consultation. Awaiting detailed asset checklist from selection phase."}
              </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailsPage;

