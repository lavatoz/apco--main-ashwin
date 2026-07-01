import React, { useState, useMemo, useEffect } from 'react';
import { safeParse, getAuthUser } from '../utils/storage';
import { api, API_URL } from '../services/api';
import { CheckCircle2, FileText, Camera, Edit3, Send, Award, Download } from 'lucide-react';
import type { Project, Client, CompanyProfile } from '../types';

interface PhotographyWorkflowProps {
  selectedBrand: string | 'All';
}

const STAGE_CONFIGS: Record<string, { title: string; icon: any }> = {
  CLIENT_ONBOARDING: { title: 'Client Onboarding', icon: FileText },
  AGREEMENT: { title: 'Agreement Signing', icon: FileText },
  ADVANCE_PAYMENT: { title: 'Advance Payment Verification', icon: FileText },
  PRE_PRODUCTION: { title: 'Pre-Production Planning', icon: FileText },
  SHOOT: { title: 'Production (Shoot)', icon: Camera },
  POST_PRODUCTION: { title: 'Post-Production', icon: Edit3 },
  EDITING: { title: 'Editing Phase', icon: Edit3 },
  DELIVERY: { title: 'Final Deliverables', icon: Send },
  PROJECT_CLOSURE: { title: 'Project Closure & Review', icon: Award }
};

const PhotographyWorkflow: React.FC<PhotographyWorkflowProps> = ({ selectedBrand }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  
  // Backend workflow integration states
  const [stages, setStages] = useState<any[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [loadingStages, setLoadingStages] = useState<boolean>(false);
  const [updatingStageId, setUpdatingStageId] = useState<string | null>(null);

  const currentUser = getAuthUser();
  const userRole = currentUser?.role || 'none';
  const userId = currentUser?.id || '';

  useEffect(() => {
    // Instantly seed from local caches to prevent blank UI state
    setUsers(safeParse<any[]>('users', []));
    setCompanies(safeParse<CompanyProfile[]>('companies', []));

    // Hydrate state from backend asynchronously
    const hydrateData = async () => {
      try {
        const [backendProjects, backendClients, backendCompanies, backendStaff] = await Promise.all([
          api.getProjects(),
          api.getClients(),
          api.getCompanies(),
          api.getStaff()
        ]);
        if (backendProjects) setProjects(backendProjects);
        if (backendClients) setClients(backendClients);
        if (backendCompanies) setCompanies(backendCompanies);
        if (backendStaff) setUsers(backendStaff);
      } catch (err) {
        console.warn("PhotographyWorkflow failed background API hydration, using cache", err);
      }
    };
    hydrateData();
    
    const handleSync = async () => {
       try {
         const backendProjects = await api.getProjects();
         setProjects(backendProjects);
       } catch (err) {
         console.warn("PhotographyWorkflow failed background API sync", err);
       }
    };
    window.addEventListener('projects-updated', handleSync);
    return () => window.removeEventListener('projects-updated', handleSync);
  }, []);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
       if (selectedBrand === 'All') return true;
       const compName = companies.find(c => c.id === selectedBrand)?.companyName;
       return p.brand === selectedBrand || p.brand === compName || p.divisionId === selectedBrand;
    });
  }, [projects, selectedBrand, companies]);

  useEffect(() => {
    if (!selectedProjectId && filteredProjects.length > 0) {
       setSelectedProjectId(filteredProjects[0].id);
    } else if (selectedProjectId && !filteredProjects.find(p => p.id === selectedProjectId)) {
       setSelectedProjectId('');
    }
  }, [filteredProjects, selectedProjectId]);

  const activeProject = filteredProjects.find(p => p.id === selectedProjectId) || null;

  // Load workflow stages for the active project
  useEffect(() => {
    if (!selectedProjectId) {
      setStages([]);
      setProgress(0);
      return;
    }

    const fetchWorkflow = async () => {
      setLoadingStages(true);
      try {
        const res = await api.getProjectWorkflow(selectedProjectId);
        setStages(res.stages || []);
        setProgress(res.progress || 0);
      } catch (err) {
        console.error("Failed to load project workflow:", err);
      } finally {
        setLoadingStages(false);
      }
    };

    fetchWorkflow();
  }, [selectedProjectId]);

  const handleInitializeWorkflow = async () => {
    if (!selectedProjectId) return;
    setLoadingStages(true);
    try {
      await api.initializeProjectWorkflow(selectedProjectId);
      const res = await api.getProjectWorkflow(selectedProjectId);
      setStages(res.stages || []);
      setProgress(res.progress || 0);
    } catch (err) {
      console.error("Failed to initialize workflow:", err);
      alert("Failed to initialize project workflow: " + (err instanceof Error ? err.message : "Server error"));
    } finally {
      setLoadingStages(false);
    }
  };

  const staffList = users.filter(u => u.role === 'Staff' || u.role === 'Admin');

  const canEditStage = (stage: any) => {
    if (userRole === 'Admin' || userRole === 'Manager') return true;
    if (userRole === 'Staff') {
      return stage.ownerId && String(stage.ownerId) === String(userId);
    }
    return false;
  };

  const updateStage = async (stageId: string, updates: any) => {
     if (!selectedProjectId || !stageId) return;

     // Keep backup for optimistic rollback
     const previousStages = [...stages];
     const previousProgress = progress;

     // 1. Find the target stage to construct optimistic state
     const targetStage = stages.find(s => s.id === stageId);
     if (!targetStage) return;

     // Optimistic updates
     const newStages = stages.map(s => {
       if (s.id === stageId) {
         let updatedStarted = s.startedAt;
         let updatedCompleted = s.completedAt;

         if (updates.status) {
           const uStatus = updates.status.toUpperCase().replace(' ', '_');
           if (uStatus === 'IN_PROGRESS' && !s.startedAt) {
             updatedStarted = new Date().toISOString();
           } else if (uStatus === 'COMPLETED') {
             if (!s.startedAt) updatedStarted = new Date().toISOString();
             updatedCompleted = new Date().toISOString();
           } else if (uStatus === 'PENDING') {
             updatedStarted = null;
             updatedCompleted = null;
           }
         }

         return {
           ...s,
           ...updates,
           startedAt: updatedStarted,
           completedAt: updatedCompleted
         };
       }
       return s;
     });

     setStages(newStages);
     setUpdatingStageId(stageId);

     // Map selections to request payload
     let ownerId = updates.ownerId;
     if (updates.owner !== undefined) {
       const staffUser = users.find(u => u.name === updates.owner || u.firstName === updates.owner || `${u.firstName} ${u.lastName}`.trim() === updates.owner);
       ownerId = staffUser ? staffUser.id : null;
     }

     const payload: any = {};
     if (updates.status !== undefined) {
       payload.status = updates.status.toUpperCase().replace(' ', '_');
     }
     if (ownerId !== undefined) {
       payload.ownerId = ownerId;
     }
     if (updates.notes !== undefined) {
       payload.notes = updates.notes;
     }

     try {
        const response = await api.updateProjectWorkflowStage(selectedProjectId, stageId, payload);
        
        // Optimistically merge simple changes
        const mergedStage = {
          ...targetStage,
          ...response,
          owner: payload.ownerId !== undefined ? (users.find(u => u.id === payload.ownerId) || null) : targetStage.owner
        };
        setStages(prev => prev.map(s => s.id === stageId ? mergedStage : s));

        // Sync fully from backend
        const freshRes = await api.getProjectWorkflow(selectedProjectId);
        if (freshRes && freshRes.stages) {
          setStages(freshRes.stages);
          setProgress(freshRes.progress);
        }
     } catch (err) {
        console.error("Workflow stage update failed", err);
        setStages(previousStages);
        setProgress(previousProgress);
        alert("Failed to save stage update: " + (err instanceof Error ? err.message : "Server error"));
     } finally {
        setUpdatingStageId(null);
     }
  };

  if (loadingStages) {
    return (
      <div className="space-y-8 animate-ios-slide-up max-w-[1600px] mx-auto pb-24">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">Production Workflow</h1>
          <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] mt-2">Stage Tracking</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 glass-panel p-8 squircle-lg border border-white/5 space-y-6 animate-pulse">
            <div className="h-4 bg-white/10 rounded w-1/3" />
            <div className="h-10 bg-white/10 rounded w-1/2" />
            <div className="h-2 bg-white/10 rounded" />
          </div>
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map(n => (
              <div key={n} className="glass-panel p-6 rounded-3xl border border-white/5 bg-white/5 flex gap-6 animate-pulse">
                <div className="w-8 h-8 rounded-lg bg-white/10" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-white/10 rounded w-1/4" />
                  <div className="h-8 bg-white/10 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-ios-slide-up max-w-[1600px] mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">
            Production Workflow
          </h1>
          <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] mt-2">
            Dynamic Stage Tracking
          </p>
        </div>
        
        {filteredProjects.length > 0 && (
           <select 
             value={selectedProjectId}
             onChange={e => setSelectedProjectId(e.target.value)}
             className="glass-panel rounded-xl px-4 py-3 text-sm font-black uppercase tracking-widest text-white outline-none min-w-[250px]"
           >
              <option value="" disabled>Select Project...</option>
              {filteredProjects.map(p => (
                 <option key={p.id} value={p.id}>{p.name} - {clients.find(c => c.id === p.clientId)?.name || 'No Client'}</option>
              ))}
           </select>
        )}
      </div>

      {!activeProject ? (
         <div className="glass-panel p-20 text-center squircle-lg border border-white/5 flex flex-col items-center justify-center">
            <Camera className="w-16 h-16 text-zinc-800 mb-6" />
            <h2 className="text-xl font-black uppercase tracking-widest text-zinc-500">No Projects Found</h2>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-2 max-w-sm">
               {selectedBrand === 'All' ? 'Create a project in the registry to start tracking workflow.' : 'No projects found for the selected brand.'}
            </p>
         </div>
      ) : stages.length === 0 ? (
         <div className="glass-panel p-20 text-center squircle-lg border border-white/5 flex flex-col items-center justify-center">
            <Camera className="w-16 h-16 text-zinc-800 mb-6" />
            <h2 className="text-xl font-black uppercase tracking-widest text-zinc-500 mb-4">No Workflow Initialized</h2>
            <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest max-w-sm mb-8">
               This project has no active workflow stages initialized on the backend.
            </p>
            {(userRole === 'Admin' || userRole === 'Manager') && (
              <button 
                onClick={handleInitializeWorkflow}
                className="bg-white text-black px-8 py-3.5 rounded-2xl flex items-center gap-3 font-black uppercase text-[10px] tracking-widest hover:bg-zinc-200 ios-transition shadow-lg active:scale-95"
              >
                Initialize Project Workflow
              </button>
            )}
         </div>
      ) : (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Progress Summary */}
            <div className="lg:col-span-1 space-y-6">
               <div className="glass-panel p-8 squircle-lg border border-white/5 animate-ios-slide-up">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-6">Workflow Progress</h3>
                  <div className="flex items-end gap-4 mb-4">
                     <h2 className="text-5xl font-black text-primary">{progress}%</h2>
                     <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Completed</p>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-6">
                     <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }} />
                  </div>
                  
                  <div className="space-y-4">
                     <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Project Name</p>
                        <p className="text-sm font-bold text-white">{activeProject.name}</p>
                     </div>
                     <div className="p-4 bg-white/5 rounded-xl border border-white/5">
                        <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Client</p>
                        <p className="text-sm font-bold text-white">{clients.find(c => c.id === activeProject.clientId)?.name || 'Unknown'}</p>
                     </div>
                  </div>
               </div>
            </div>

            {/* Right: Stage Tracking List */}
            <div className="lg:col-span-2 space-y-4">
               {stages.map((stage) => {
                  const config = STAGE_CONFIGS[stage.stageType] || { title: stage.stageType.replace(/_/g, ' '), icon: FileText };
                  const isCompleted = stage.status === 'COMPLETED';
                  const isInProgress = stage.status === 'IN_PROGRESS';
                  const isEditable = canEditStage(stage);
                  const isStageUpdating = updatingStageId === stage.id;
                  
                  return (
                     <div key={stage.id} className={`glass-panel p-6 rounded-3xl border transition-all ${isCompleted ? 'border-primary/20 bg-primary/5' : isInProgress ? 'border-amber-500/30 bg-amber-500/10' : 'border-white/5 bg-white/5'}`}>
                        <div className="flex flex-col md:flex-row gap-6">
                           
                           {/* Stage Header */}
                           <div className="flex-1 md:max-w-[220px]">
                              <div className="flex items-center gap-3 mb-2">
                                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCompleted ? 'bg-primary/20 text-primary' : isInProgress ? 'bg-amber-500/20 text-amber-500' : 'bg-white/10 text-zinc-500'}`}>
                                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <config.icon className="w-4 h-4" />}
                                 </div>
                                 <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Stage</p>
                                    <h4 className="text-sm font-black uppercase tracking-tight text-white">{config.title}</h4>
                                 </div>
                              </div>
                              
                              <select 
                                 value={stage.status || 'PENDING'}
                                 disabled={!isEditable || isStageUpdating}
                                 onChange={(e) => updateStage(stage.id, { status: e.target.value })}
                                 className={`mt-4 w-full px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg outline-none border transition-colors ${
                                    isCompleted ? 'bg-primary/10 border-primary/20 text-primary' : 
                                    isInProgress ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 
                                    'bg-black border-white/10 text-zinc-400'
                                 } ${(!isEditable || isStageUpdating) ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                 <option value="PENDING" className="bg-black text-white">Pending</option>
                                 <option value="IN_PROGRESS" className="bg-black text-white">In Progress</option>
                                 <option value="COMPLETED" className="bg-black text-white">Completed</option>
                              </select>
                           </div>

                           {/* Stage Details */}
                           <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Owner</label>
                                 <select 
                                    value={stage.ownerId || ''}
                                    disabled={!isEditable || isStageUpdating}
                                    onChange={(e) => updateStage(stage.id, { ownerId: e.target.value === '' ? null : e.target.value })}
                                    className={`w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none ${(!isEditable || isStageUpdating) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                 >
                                    <option value="">Unassigned</option>
                                    {staffList.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                 </select>
                              </div>
                              
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 font-bold">Timestamps</label>
                                 <div className="space-y-1 text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-1">
                                    <div>Started: <span className="text-zinc-300">{stage.startedAt ? new Date(stage.startedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span></div>
                                    <div>Completed: <span className="text-zinc-300">{stage.completedAt ? new Date(stage.completedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}</span></div>
                                 </div>
                              </div>

                              <div className="space-y-1 md:col-span-2">
                                 <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 font-bold">Notes & Attachments</label>
                                 <div className="flex flex-col gap-3">
                                    <input 
                                       type="text" 
                                       placeholder="Add notes..."
                                       value={stage.notes || ''}
                                       disabled={!isEditable || isStageUpdating}
                                       onChange={(e) => updateStage(stage.id, { notes: e.target.value })}
                                       className={`w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none placeholder:text-zinc-600 ${(!isEditable || isStageUpdating) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    />
                                    {stage.attachments && stage.attachments.length > 0 && (
                                       <div className="flex flex-wrap gap-2 pt-1">
                                          {stage.attachments.map((att: any, idx: number) => (
                                             <a 
                                                key={idx} 
                                                href={`${API_URL}/files/${att.fileId}/download`} 
                                                target="_blank" 
                                                rel="noreferrer" 
                                                className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
                                             >
                                                <Download className="w-3.5 h-3.5 text-zinc-500" />
                                                <span>{att.fileName}</span>
                                             </a>
                                          ))}
                                       </div>
                                    )}
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  );
               })}
            </div>
         </div>
      )}
    </div>
  );
};

export default PhotographyWorkflow;


