import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Briefcase, Calendar, Info, ArrowLeft, Check, Camera, Video, Edit3, Users, AlertTriangle, Plus, X, Search, IndianRupee } from 'lucide-react';
import type { Client, Project, User, StaffAssignment, ProjectTeam } from '../types';

const SmartRoleDropdown: React.FC<{ 
   role: string, 
   allStaff: User[], 
   selectedId: string, 
   onChange: (id: string) => void, 
   isBusyFn: (id: string) => boolean, 
   onAddNew: () => void 
}> = ({ role, allStaff, selectedId, onChange, isBusyFn, onAddNew }) => {
   const [isOpen, setIsOpen] = useState(false);
   const [search, setSearch] = useState('');
   const wrapperRef = useRef<HTMLDivElement>(null);
   const contentRef = useRef<HTMLDivElement>(null);
   const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

   const updatePosition = () => {
      if (wrapperRef.current) {
         const rect = wrapperRef.current.getBoundingClientRect();
         setDropdownStyle({
            top: rect.bottom + 8,
            left: rect.left,
            width: rect.width
         });
      }
   };

   useEffect(() => {
      if (isOpen) {
         updatePosition();
         const handleScroll = (e: Event) => {
            if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
               setIsOpen(false);
            }
         };
         window.addEventListener('scroll', handleScroll, true);
         window.addEventListener('resize', updatePosition);
         return () => {
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', updatePosition);
         };
      }
   }, [isOpen]);

   useEffect(() => {
     const handleClickOutside = (event: MouseEvent) => {
       const target = event.target as Node;
       if (wrapperRef.current && !wrapperRef.current.contains(target)) {
         if (contentRef.current && contentRef.current.contains(target)) {
            return;
         }
         setIsOpen(false);
       }
     };
     document.addEventListener("mousedown", handleClickOutside);
     return () => document.removeEventListener("mousedown", handleClickOutside);
   }, []);

   const filteredOpts = allStaff.filter(s => s.staffRole === role && (s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase())));
   const selectedOpt = allStaff.find(s => s.id === selectedId);
   const displayValue = selectedOpt ? (selectedOpt.name || selectedOpt.email) : '';

   return (
     <div className={`relative flex-1 ${isOpen ? 'z-[9999]' : 'z-10'}`} ref={wrapperRef}>
        <div 
          onClick={() => setIsOpen(!isOpen)} 
          className={`w-full bg-white/5 border ${isBusyFn(selectedId) ? 'border-amber-500/50' : 'border-white/5'} rounded-xl p-3 flex justify-between items-center text-sm font-medium text-white hover:bg-white/10 transition-all cursor-pointer shadow-sm`}
        >
           <span className="truncate">{displayValue || 'Select Personnel...'}</span>
           <Search className="w-3 h-3 text-zinc-500 shrink-0" />
        </div>
        
        {isOpen && createPortal(
           <div 
             ref={contentRef}
             style={{ ...dropdownStyle, position: 'fixed' }}
             className="bg-zinc-900 border border-white/10 rounded-xl z-[9999] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col animate-ios-fade-in pointer-events-auto"
           >
              <div className="p-2 border-b border-white/5 shrink-0 relative">
                 <Search className="w-3 h-3 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                 <input 
                   type="text"
                   autoFocus
                   className="w-full bg-black/50 border border-white/5 rounded-lg p-2.5 pl-8 text-sm font-medium text-white placeholder:text-zinc-600 outline-none focus:border-white/20"
                   placeholder="Search database..."
                   value={search}
                   onChange={e => setSearch(e.target.value)}
                 />
              </div>
              
              <div className="max-h-[240px] overflow-y-auto no-scrollbar p-2 flex flex-col gap-1">
                 {filteredOpts.map(s => (
                    <div 
                      key={s.id} 
                      onClick={() => { onChange(s.id); setIsOpen(false); setSearch(''); }}
                      className="p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer flex justify-between items-center"
                    >
                       <div className="flex items-center gap-3 overflow-hidden">
                         <div className="w-5 h-5 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 text-[10px] font-bold uppercase shrink-0">
                            {(s.name || s.email || '?').charAt(0)}
                         </div>
                         <div className="truncate">
                           <p className="text-sm font-semibold text-white uppercase truncate">{s.name || s.email}</p>
                           <p className="text-xs font-medium text-zinc-500 truncate">{s.staffRole}</p>
                         </div>
                       </div>
                       {isBusyFn(s.id) && <span className="text-xs text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ml-2">Busy</span>}
                    </div>
                 ))}
                 
                 {filteredOpts.length === 0 && (
                    <p className="text-center text-xs font-bold p-3 uppercase opacity-50">no matches found</p>
                 )}
                 
                 <div className="h-px bg-white/5 my-1 shrink-0" />
                 
                 <div 
                    onClick={() => { onChange(''); setIsOpen(false); setSearch(''); }}
                    className="p-3 bg-white/5 hover:bg-white/10 rounded-lg cursor-pointer flex items-center justify-center text-xs font-bold text-zinc-500 uppercase tracking-widest"
                 >
                    Clear Assignment
                 </div>
              </div>
              
              <div className="border-t border-white/5 bg-black/20 p-2 shrink-0">
                 <button type="button" onClick={() => { onAddNew(); setIsOpen(false); setSearch(''); }} className="w-full py-2.5 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 rounded-lg text-xs font-bold uppercase tracking-widest transition-all">+ Add New Member</button>
              </div>
           </div>,
           document.body
        )}
     </div>
   );
}

const CreateProjectPage: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [allStaff, setAllStaff] = useState<User[]>([]);
  const [existingProjects, setExistingProjects] = useState<Project[]>([]);
  
  const [projectName, setProjectName] = useState('');
  const [projectType, setProjectType] = useState('Wedding');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<'pending' | 'confirmed'>('pending');
  
  const [teamSelection, setTeamSelection] = useState<Record<string, string[]>>({
    photographer: [''],
    videographer: [''],
    editor: [''],
    assistant: ['']
  });

  const [teamData, setTeamData] = useState<Record<string, StaffAssignment[]>>({
    photographer: [{ type: 'internal', name: '' }],
    videographer: [{ type: 'internal', name: '' }],
    editor: [{ type: 'internal', name: '' }],
    assistant: [{ type: 'internal', name: '' }]
  });

  const [overrides, setOverrides] = useState<Record<string, boolean[]>>({
    photographer: [false],
    videographer: [false],
    editor: [false],
    assistant: [false]
  });

  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [newStaffForm, setNewStaffForm] = useState({ name: '', role: 'photographer', contact: '' });
  const [pendingDropdownAssign, setPendingDropdownAssign] = useState<{ role: string, idx: number } | null>(null);

  useEffect(() => {
    setLoading(true);
    const storedClients = localStorage.getItem('clients');
    if (storedClients) {
      const clients: Client[] = JSON.parse(storedClients);
      const found = clients.find(c => String(c.id) === String(clientId));
      if (found) setClient(found);
    }

    const storedUsers = localStorage.getItem('users');
    if (storedUsers) {
      const users: User[] = JSON.parse(storedUsers);
      setAllStaff(users.filter(u => u.role === 'Staff'));
    }

    const storedProjects = localStorage.getItem('projects');
    if (storedProjects) {
        setExistingProjects(JSON.parse(storedProjects));
    }
    setLoading(false);
  }, [clientId]);

  const isStaffBusy = (userId: string, targetDate: string) => {
    if (!userId || !targetDate) return false;
    return existingProjects.some(p => 
      p.date === targetDate && 
      p.team && 
      Object.values(p.team).flat().some((s: any) => s && s.id === userId)
    );
  };

  const handleAddNewStaffSubmit = (e: React.FormEvent) => {
     e.preventDefault();
     const newUser: User = {
       id: `staff_${Date.now()}`,
       name: newStaffForm.name,
       email: newStaffForm.contact || `${newStaffForm.name.replace(/\s+/g,'').toLowerCase()}@staff.local`,
       role: 'Staff',
       staffRole: newStaffForm.role as any,
       isActive: true,
       permissions: []
     };
     const updatedUsers = [...JSON.parse(localStorage.getItem('users') || '[]'), newUser];
     localStorage.setItem('users', JSON.stringify(updatedUsers));
     setAllStaff(updatedUsers.filter(u => u.role === 'Staff'));
     
     if (pendingDropdownAssign) {
       handleRoleChange(pendingDropdownAssign.role, pendingDropdownAssign.idx, newUser.id);
     }
     setIsAddStaffModalOpen(false);
     setNewStaffForm({ name: '', role: 'photographer', contact: '' });
  };

  const addRow = (role: string) => {
    setTeamSelection(prev => ({ ...prev, [role]: [...prev[role], ''] }));
    setTeamData(prev => ({ ...prev, [role]: [...prev[role], { type: 'internal', name: '' }] }));
    setOverrides(prev => ({ ...prev, [role]: [...prev[role], false] }));
  };

  const removeRow = (role: string, index: number) => {
    if (teamData[role].length <= 1) return; // Keep at least one
    setTeamSelection(prev => ({ ...prev, [role]: prev[role].filter((_, i) => i !== index) }));
    setTeamData(prev => ({ ...prev, [role]: prev[role].filter((_, i) => i !== index) }));
    setOverrides(prev => ({ ...prev, [role]: prev[role].filter((_, i) => i !== index) }));
  };

  const handleRoleChange = (role: string, index: number, value: string) => {
    setTeamSelection(prev => {
        const next = [...prev[role]];
        next[index] = value;
        return { ...prev, [role]: next };
    });
    
    setOverrides(prev => {
        const next = [...prev[role]];
        next[index] = false;
        return { ...prev, [role]: next };
    });
    
    if (value) {
        const staff = allStaff.find(s => s.id === value);
        const updatedRows = [...teamData[role]];
        updatedRows[index] = { ...updatedRows[index], type: 'internal', id: value, name: staff?.name || staff?.email || '' };
        setTeamData(prev => ({ ...prev, [role]: updatedRows }));
    } else {
        const updatedRows = [...teamData[role]];
        updatedRows[index] = { ...updatedRows[index], id: undefined, name: '' };
        setTeamData(prev => ({ ...prev, [role]: updatedRows }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;

    // Check for un-overridden conflicts
    const allConflicts = Object.entries(teamSelection).some(([role, rowIds]) => 
      rowIds.some((id, idx) => id && isStaffBusy(id, date) && !overrides[role][idx])
    );
    
    if (allConflicts) {
        alert("Scheduling Conflict Detected. Please confirm override for all busy staff.");
        return;
    }

    setIsSubmitting(true);

    const finalTeam: ProjectTeam = {
      photographers: teamData.photographer.filter(s => s.id || s.name),
      videographers: teamData.videographer.filter(s => s.id || s.name),
      editors: teamData.editor.filter(s => s.id || s.name),
      assistants: teamData.assistant.filter(s => s.id || s.name)
    };

    // Keep singular versions for backward compatibility
    if (finalTeam.photographers!.length > 0) finalTeam.photographer = finalTeam.photographers![0];
    if (finalTeam.videographers!.length > 0) finalTeam.videographer = finalTeam.videographers![0];
    if (finalTeam.editors!.length > 0) finalTeam.editor = finalTeam.editors![0];
    if (finalTeam.assistants!.length > 0) finalTeam.assistant = finalTeam.assistants![0];

    const newProject: Project = {
      id: `proj_${Date.now()}`,
      clientId: clientId!,
      divisionId: client.divisionId!,
      name: projectName,
      brand: client.brand,
      type: projectType,
      date,
      status,
      stage: status === 'confirmed' ? 'booked' : 'pending' as any,
      team: finalTeam,
      totalAmount: 0,
      createdAt: new Date().toISOString()
    };

    const updatedProjects = [...existingProjects, newProject];
    localStorage.setItem('projects', JSON.stringify(updatedProjects));

    setTimeout(() => {
      navigate(`/portal/${clientId}`);
    }, 800);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10 text-center animate-ios-slide-up">
        <div className="w-20 h-20 bg-red-400/10 rounded-full flex items-center justify-center mb-8 border border-red-400/10">
           <Info className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Identity Match Failed</h1>
        <p className="text-sm text-zinc-300 mt-2 mb-10">Target Client ID {clientId} is missing from active memory</p>
        <button 
          onClick={() => navigate('/directory')}
          className="px-8 py-4 bg-white text-black font-bold uppercase text-xs rounded-xl tracking-widest active:scale-95"
        >
          Return to Hub
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-10 animate-ios-slide-up">
      <div className="flex items-center gap-6 mb-12">
        <button onClick={() => navigate('/directory')} className="p-4 bg-white/5 border border-white/10 rounded-2xl text-zinc-500 hover:text-white transition-all"><ArrowLeft className="w-5 h-5" /></button>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">New Project Initiation</h1>
          <p className="text-xs font-semibold uppercase text-zinc-400 tracking-[0.3em] mt-1 italic">Client: {client.name}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass-panel p-10 squircle-lg border border-white/5 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-white/10" />
        
        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-zinc-400 tracking-widest px-1">Project Identifier (Name)</label>
          <div className="relative">
            <LayoutDashboard className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-600" />
            <input 
              required
              className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 pl-14 text-sm font-black text-white outline-none focus:bg-white/10 transition-all placeholder:text-zinc-800"
              placeholder="e.g. Rahul & Smriti Marriage"
              value={projectName}
              onChange={e => setProjectName(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-zinc-400 tracking-widest px-1">Engagement Type</label>
            <div className="relative">
              <Briefcase className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <select 
                className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 pl-14 text-sm font-medium text-white outline-none appearance-none"
                value={projectType}
                onChange={e => setProjectType(e.target.value)}
              >
                <option value="Wedding" className="bg-zinc-900">Wedding Film</option>
                <option value="Kids" className="bg-zinc-900">Kids / Maternity</option>
                <option value="Corporate" className="bg-zinc-900">Corporate Branding</option>
                <option value="General" className="bg-zinc-900">General Production</option>
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-zinc-400 tracking-widest px-1">Target Date</label>
            <div className="relative">
              <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input 
                type="date"
                required
                className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 pl-14 text-sm font-medium text-white outline-none"
                value={date}
                onChange={e => setDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="space-y-6 pt-4 border-t border-white/5">
          <label className="text-xs font-bold uppercase text-zinc-400 tracking-widest px-2 flex justify-between">
            <span>Personnel Assignment & Logistics</span>
          </label>
          
          <div className="grid grid-cols-1 gap-4">
            {['photographer', 'videographer', 'editor', 'assistant'].map(role => {
              const RoleIcon = role === 'photographer' ? Camera : role === 'videographer' ? Video : role === 'editor' ? Edit3 : Users;
              
              return (
                <div key={role} className="p-6 bg-white/2 border border-white/5 rounded-3xl space-y-4 hover:border-white/10 transition-all">
                  <div className="flex justify-between items-center mb-2">
                     <p className="text-xs font-bold uppercase text-zinc-400 tracking-widest flex items-center gap-2">
                        <RoleIcon className="w-3 h-3" /> {role} Manifest
                     </p>
                     <button 
                        type="button" 
                        onClick={() => addRow(role)}
                        className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                        title={`Add ${role}`}
                     >
                        <Plus size={14} />
                     </button>
                  </div>

                  <div className="space-y-4">
                    {teamData[role].map((row, idx) => {
                      const isBusy = date && teamSelection[role][idx] && isStaffBusy(teamSelection[role][idx], date);
                      
                      return (
                        <div key={idx} className="space-y-4 pt-4 border-t border-white/5 first:border-0 first:pt-0">
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 space-y-1">
                              <p className="text-xs font-bold uppercase text-zinc-400 tracking-widest">Select Expert</p>
                              <div className="flex gap-2">
                                <SmartRoleDropdown 
                                   role={role}
                                   allStaff={allStaff}
                                   selectedId={teamSelection[role][idx]}
                                   onChange={val => handleRoleChange(role, idx, val)}
                                   isBusyFn={(id) => isStaffBusy(id, date)}
                                   onAddNew={() => {
                                      setPendingDropdownAssign({ role, idx });
                                      setNewStaffForm({ name: '', role: role, contact: '' });
                                      setIsAddStaffModalOpen(true);
                                   }}
                                />
                                {teamData[role].length > 1 && (
                                  <button 
                                    type="button"
                                    onClick={() => removeRow(role, idx)}
                                    className="p-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-all border border-red-500/10"
                                  >
                                    <X size={14} />
                                  </button>
                                )}
                              </div>
                            </div>

                            <div className="space-y-1 w-32 shrink-0">
                               <p className="text-xs font-bold uppercase text-zinc-400 tracking-widest text-right">Payment</p>
                               <div className="relative mt-1">
                                  <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-500" />
                                  <input 
                                    type="number"
                                    placeholder="0"
                                    className="bg-white/5 border border-white/5 rounded-xl p-3 pl-8 text-sm font-bold text-white outline-none w-full focus:border-blue-500/30"
                                    value={row.payment || ''}
                                    onChange={e => {
                                      const updated = [...teamData[role]];
                                      updated[idx] = { ...updated[idx], payment: Number(e.target.value) };
                                      setTeamData(prev => ({ ...prev, [role]: updated }));
                                    }}
                                  />
                               </div>
                            </div>
                          </div>

                          {isBusy && (
                            <div className="animate-ios-slide-up bg-amber-500/5 p-4 rounded-xl border border-amber-500/20 flex items-center justify-between">
                               <div className="flex items-center gap-3">
                                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                                   <div>
                                    <p className="text-xs font-bold text-amber-500 uppercase tracking-widest leading-none">Double Booking Conflict</p>
                                    <p className="text-xs text-zinc-400 mt-1 uppercase tracking-widest">Assigned to another unit on this date.</p>
                                  </div>
                               </div>
                               <label className="flex items-center gap-3 cursor-pointer group">
                                  <span className="text-xs font-bold text-zinc-400 uppercase group-hover:text-white transition-all tracking-widest">Confirm Override</span>
                                  <input 
                                    type="checkbox" 
                                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-amber-500 outline-none"
                                    checked={overrides[role][idx]}
                                    onChange={e => {
                                      const updated = [...overrides[role]];
                                      updated[idx] = e.target.checked;
                                      setOverrides(prev => ({ ...prev, [role]: updated }));
                                    }}
                                  />
                               </label>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-zinc-400 tracking-widest px-1">Initial Status</label>
          <div className="relative">
            <Info className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
            <select 
              className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 pl-14 text-sm font-medium text-white outline-none appearance-none"
              value={status}
              onChange={e => setStatus(e.target.value as any)}
            >
              <option value="pending" className="bg-zinc-900 text-amber-500">Pending Authorization</option>
              <option value="confirmed" className="bg-zinc-900 text-emerald-500">Confirmed</option>
            </select>
          </div>
        </div>

        <div className="pt-6">
          <button 
            type="submit"
            disabled={isSubmitting}
            className="w-full py-5 bg-white text-black rounded-2xl font-bold uppercase text-xs tracking-widest shadow-2xl hover:bg-zinc-200 transition-all active:scale-95 flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
            ) : (
              <><Check className="w-4 h-4" /> Secure Project Launch</>
            )}
          </button>
        </div>
      </form>

      {/* Add Staff Modal */}
      {isAddStaffModalOpen && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[200] flex items-center justify-center p-4 animate-ios-fade-in">
            <div className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-3xl p-8 shadow-2xl animate-ios-slide-up relative">
               <button onClick={() => setIsAddStaffModalOpen(false)} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                  <X className="w-4 h-4 text-zinc-400" />
               </button>
               <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-1">Add Personnel</h3>
               <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-6">Initialize new registry vector</p>
               
               <form onSubmit={handleAddNewStaffSubmit} className="space-y-4">
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Expert Name</label>
                     <input required autoFocus className="w-full bg-black/50 border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-white/20" value={newStaffForm.name} onChange={e => setNewStaffForm(f => ({...f, name: e.target.value}))} placeholder="Jane Doe" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Specialty Class</label>
                     <select className="w-full bg-black/50 border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-white/20 appearance-none" value={newStaffForm.role} onChange={e => setNewStaffForm(f => ({...f, role: e.target.value}))}>
                        <option value="photographer">Photographer</option>
                        <option value="videographer">Videographer</option>
                        <option value="editor">Editor</option>
                        <option value="assistant">Assistant</option>
                     </select>
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest px-1">Contact Reference (Optional)</label>
                     <input className="w-full bg-black/50 border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-white/20" value={newStaffForm.contact} onChange={e => setNewStaffForm(f => ({...f, contact: e.target.value}))} placeholder="jane@studio.com" />
                  </div>
                  <button type="submit" className="w-full py-4 mt-6 bg-white text-black rounded-xl font-bold uppercase text-xs tracking-widest hover:bg-zinc-200 transition-all active:scale-95">Commit Record</button>
               </form>
            </div>
         </div>
      )}

    </div>
  );
};

export default CreateProjectPage;
