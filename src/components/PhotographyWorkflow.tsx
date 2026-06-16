import React, { useState, useMemo, useEffect } from 'react';
import { safeParse } from '../utils/storage';
import { api } from '../services/api';
import { CheckCircle2, FileText, Camera, Edit3, Eye, MessageSquare, Send, Award, BarChart, HardDrive, Link, X } from 'lucide-react';
import type { Project, Client, CompanyProfile } from '../types';
import { calculateProjectWorkflowProgress } from '../utils/workflowUtils';

interface PhotographyWorkflowProps {
  selectedBrand: string | 'All';
}

const STAGES = [
  { id: '1', title: 'Client Onboarding', icon: FileText },
  { id: '2', title: 'Pre-Production Planning', icon: FileText },
  { id: '3', title: 'Production (Shoot)', icon: Camera },
  { id: '4', title: 'Post-Production', icon: Edit3 },
  { id: '5', title: 'Review & Feedback', icon: Eye },
  { id: '6', title: 'Revisions & Approvals', icon: MessageSquare },
  { id: '7', title: 'Final Deliverables', icon: Send },
  { id: '8', title: 'Offboarding', icon: Award },
  { id: '9', title: 'Analytics', icon: BarChart },
  { id: '10', title: 'Archiving', icon: HardDrive }
];

const PhotographyWorkflow: React.FC<PhotographyWorkflowProps> = ({ selectedBrand }) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [companies, setCompanies] = useState<CompanyProfile[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  useEffect(() => {
    // Instantly seed from local caches to prevent blank UI state
    setUsers(safeParse<any[]>('users', []));
    setCompanies(safeParse<CompanyProfile[]>('companies', []));

    // Hydrate state from backend asynchronously
    const hydrateData = async () => {
      try {
        const [backendProjects, backendClients, backendCompanies] = await Promise.all([
          api.getProjects(),
          api.getClients(),
          api.getCompanies()
        ]);
        if (backendProjects) setProjects(backendProjects);
        if (backendClients) setClients(backendClients);
        if (backendCompanies) setCompanies(backendCompanies);
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
       // Try matching brand directly or through division
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

  const staffList = users.filter(u => u.role === 'Staff' || u.role === 'Admin');

  const updateStage = async (stageId: string, updates: any) => {
     if (!activeProject) return;
     const existingTracking = activeProject.stageTracking || {};
     const currentStageData = existingTracking[stageId] || { status: 'Pending' };
     
     const newTracking = {
        ...existingTracking,
        [stageId]: { ...currentStageData, ...updates }
     };

     console.log('Previous Status:', currentStageData.status);
     console.log('New Status:', updates.status || currentStageData.status);
     console.log('Stage ID:', stageId);
     console.log('Updated Workflow Object:', newTracking);

     const updatedProject = { ...activeProject, stageTracking: newTracking };
     
     // 1. Update local state to reflect instantly
     setProjects(prev => prev.map(p => p.id === updatedProject.id ? updatedProject : p));

     // 2. Initiate backend call and dispatch projects-updated event when completed
     try {
        await api.saveProject(updatedProject);
        window.dispatchEvent(new CustomEvent('projects-updated'));
     } catch (err) {
        console.error("Background project save failed", err);
        alert("Failed to save stage update to database.");
     }
  };

  const calculateProgress = () => {
     return calculateProjectWorkflowProgress(activeProject);
  };

  return (
    <div className="space-y-8 animate-ios-slide-up max-w-[1600px] mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">
            Production Workflow
          </h1>
          <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] mt-2">
            10-Step Stage Tracking
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
      ) : (
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Progress Summary */}
            <div className="lg:col-span-1 space-y-6">
               <div className="glass-panel p-8 squircle-lg border border-white/5">
                  <h3 className="text-sm font-black uppercase tracking-widest mb-6">Workflow Progress</h3>
                  <div className="flex items-end gap-4 mb-4">
                     <h2 className="text-5xl font-black text-primary">{calculateProgress()}%</h2>
                     <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Completed</p>
                  </div>
                  <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden mb-6">
                     <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${calculateProgress()}%` }} />
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
               {STAGES.map((stage) => {
                  const stageData = activeProject.stageTracking?.[stage.id] || { status: 'Pending' };
                  const isCompleted = stageData.status === 'Completed';
                  const isInProgress = stageData.status === 'In Progress';
                  
                  return (
                     <div key={stage.id} className={`glass-panel p-6 rounded-3xl border transition-all ${isCompleted ? 'border-primary/20 bg-primary/5' : isInProgress ? 'border-amber-500/30 bg-amber-500/10' : 'border-white/5 bg-white/5'}`}>
                        <div className="flex flex-col md:flex-row gap-6">
                           
                           {/* Stage Header */}
                           <div className="flex-1 md:max-w-[220px]">
                              <div className="flex items-center gap-3 mb-2">
                                 <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isCompleted ? 'bg-primary/20 text-primary' : isInProgress ? 'bg-amber-500/20 text-amber-500' : 'bg-white/10 text-zinc-500'}`}>
                                    {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <stage.icon className="w-4 h-4" />}
                                 </div>
                                 <div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Stage {stage.id}</p>
                                    <h4 className="text-sm font-black uppercase tracking-tight text-white">{stage.title}</h4>
                                 </div>
                              </div>
                              
                              <select 
                                 value={stageData.status || 'Pending'}
                                 onChange={(e) => updateStage(stage.id, { 
                                    status: e.target.value,
                                    dateStarted: e.target.value === 'In Progress' && !stageData.dateStarted ? new Date().toISOString() : stageData.dateStarted,
                                    dateCompleted: e.target.value === 'Completed' && !stageData.dateCompleted ? new Date().toISOString() : stageData.dateCompleted
                                 })}
                                 className={`mt-4 w-full px-3 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg outline-none border transition-colors ${
                                    isCompleted ? 'bg-primary/10 border-primary/20 text-primary' : 
                                    isInProgress ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 
                                    'bg-black border-white/10 text-zinc-400'
                                 }`}
                              >
                                 <option value="Pending" className="bg-black text-white">Pending</option>
                                 <option value="In Progress" className="bg-black text-white">In Progress</option>
                                 <option value="Completed" className="bg-black text-white">Completed</option>
                              </select>
                           </div>

                           {/* Stage Details */}
                           <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Owner</label>
                                 <select 
                                    value={stageData.owner || ''}
                                    onChange={(e) => updateStage(stage.id, { owner: e.target.value })}
                                    className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none"
                                 >
                                    <option value="">Unassigned</option>
                                    {staffList.map(s => <option key={s.email} value={s.name}>{s.name}</option>)}
                                 </select>
                              </div>
                              
                              <div className="space-y-1">
                                 <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Date Started</label>
                                 <input 
                                    type="date" 
                                    value={stageData.dateStarted ? new Date(stageData.dateStarted).toISOString().split('T')[0] : ''}
                                    onChange={(e) => updateStage(stage.id, { dateStarted: e.target.value ? new Date(e.target.value).toISOString() : '' })}
                                    className="w-full bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none"
                                 />
                              </div>

                              <div className="space-y-1 md:col-span-2">
                                 <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500">Notes & Attachments</label>
                                 <div className="flex gap-2">
                                    <input 
                                       type="text" 
                                       placeholder="Add notes or links..."
                                       value={stageData.notes || ''}
                                       onChange={(e) => updateStage(stage.id, { notes: e.target.value })}
                                       className="flex-1 bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs font-bold text-white outline-none placeholder:text-zinc-600"
                                    />
                                    <button 
                                       onClick={() => {
                                          const link = prompt("Enter attachment URL:");
                                          if (link) {
                                             const newAttachments = [...(stageData.attachments || []), link];
                                             updateStage(stage.id, { attachments: newAttachments });
                                          }
                                       }}
                                       className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
                                       title="Add Attachment Link"
                                    >
                                       <Link className="w-4 h-4 text-zinc-400" />
                                    </button>
                                 </div>
                                 {stageData.attachments && stageData.attachments.length > 0 && (
                                    <div className="mt-2 flex flex-wrap gap-2">
                                       {stageData.attachments.map((link, i) => (
                                          <div key={i} className="flex items-center gap-2 bg-white/5 border border-white/10 px-2 py-1 rounded text-[10px] font-bold">
                                             <a href={link} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline max-w-[150px] truncate">
                                                {link}
                                             </a>
                                             <button 
                                                onClick={() => {
                                                   const newAttachments = stageData.attachments!.filter((_, idx) => idx !== i);
                                                   updateStage(stage.id, { attachments: newAttachments });
                                                }}
                                                className="text-zinc-500 hover:text-red-400"
                                             >
                                                <X className="w-3 h-3" />
                                             </button>
                                          </div>
                                       ))}
                                    </div>
                                 )}
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


