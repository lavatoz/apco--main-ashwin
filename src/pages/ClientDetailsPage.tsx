import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, Phone, Calendar, Briefcase, Plus, ArrowLeft, FileText, IndianRupee, Activity, X, CheckCircle2, Trash2, Edit2, Copy, Download, CreditCard, ChevronRight, Search, Camera, Video, Edit3, Users, AlertTriangle, Clock, Check, Package, MapPin } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { type Client, type Invoice, type PaymentRecord, type User as UserType, type ClientAgreement, type IdDocument, type Project, type ProjectStage, type AgreementTemplate, type ActiveAgreementSnapshot, type ClientEvent } from '../types';
import { api } from '../services/api';
import { useCompanySettings, useCompanyForClient } from '../hooks/useCompanySettings';

import { getAuthUser } from '../utils/storage';

import { WORKFLOW_STAGES, getWorkflowProgress, normalizeWorkflowStage } from '../utils/workflowUtils';
import { DocumentPreviewModal } from '../components/DocumentPreviewModal';
import { getBrandQuoteTemplate, getBrandInvoiceTemplate } from '../templates/registry';
import { advanceProjectWorkflow, emergencyOverrideWorkflow } from '../utils/workflowEngine';
import { calculateEventStatusAndProgress } from '../utils/eventUtils';

const SUGGESTIONS = {
   physical: [
      { name: "Photo Album (50 pages)", price: 6000 },
      { name: "Premium Album (100 pages)", price: 12000 },
      { name: "Photo Frame", price: 2500 },
      { name: "Mini Album", price: 3000 },
   ],
   digital: [
      { name: "Highlight Video (3 min)", price: 15000 },
      { name: "Full Wedding Film", price: 50000 },
      { name: "Teaser Video", price: 8000 },
      { name: "Instagram Reel", price: 3000 },
   ],
   team: [
      { name: "Joel", role: "photographer" },
      { name: "Arun", role: "videographer" },
      { name: "Nikhil", role: "editor" },
      { name: "Ajay", role: "assistant" },
   ],
};

const CATEGORY_KEYWORDS = {
   physical: ["album", "frame", "photo", "print", "box", "canvas"],
   digital: ["video", "film", "reel", "cinema", "teaser", "highlight", "edit"],
};

const ROLES = [
   { value: 'photographer', label: 'Photographer' },
   { value: 'videographer', label: 'Videographer' },
   { value: 'editor', label: 'Editor' },
   { value: 'assistant', label: 'Assistant' },
];


const SmartRoleDropdown: React.FC<{
   role: string,
   allStaff: UserType[],
   selectedId: string,
   onChange: (id: string) => void,
   onAddNew: () => void,
   onDelete?: (id: string) => void,
   onEdit?: (staff: UserType) => void,
   isBusyFn?: (id: string) => boolean,
   onAddMember?: (member: UserType) => void
}> = ({ role, allStaff, selectedId, onChange, onDelete, onEdit, isBusyFn, onAddMember }) => {
   const [isOpen, setIsOpen] = useState(false);
   const [search, setSearch] = useState('');
   const wrapperRef = useRef<HTMLDivElement>(null);
   const contentRef = useRef<HTMLDivElement>(null);

   const [isAddingInDropdown, setIsAddingInDropdown] = useState(false);
   const [newMemberNameInDropdown, setNewMemberNameInDropdown] = useState('');
   const [newMemberRoleInDropdown, setNewMemberRoleInDropdown] = useState(role);

   const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
   const [editName, setEditName] = useState('');
   const [editRole, setEditRole] = useState('');

   const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);



   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         const target = event.target as Node;
         if (wrapperRef.current && !wrapperRef.current.contains(target)) {
            if (contentRef.current && contentRef.current.contains(target)) {
               return;
            }
            setIsOpen(false);
            setIsAddingInDropdown(false);
            setInlineEditingId(null);
            setDeleteConfirmId(null);
         }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
   }, []);

   const filteredOpts = allStaff.filter(s => s.staffRole === role && (s.name?.toLowerCase().includes(search.toLowerCase()) || s.email?.toLowerCase().includes(search.toLowerCase())));
   const selectedOpt = allStaff.find(s => s.id === selectedId);
   const displayValue = selectedOpt ? (selectedOpt.name || selectedOpt.email) : '';

   const handleAddSaved = (e: React.MouseEvent) => {
      e.preventDefault(); e.stopPropagation();
      if (!newMemberNameInDropdown.trim()) return;
      const newUser: UserType = {
         id: `staff_${Date.now()}`,
         name: newMemberNameInDropdown,
         email: `${newMemberNameInDropdown.toLowerCase().replace(/\s/g, '')}@artisans.local`,
         role: 'Staff',
         staffRole: newMemberRoleInDropdown as any,
         isActive: true,
         permissions: []
      };
      onAddMember?.(newUser);
      if (newMemberRoleInDropdown === role) {
         onChange(newUser.id);
      }
      setIsAddingInDropdown(false);
      setNewMemberNameInDropdown('');
      setSearch('');
   };

   const handleEditSave = (e: React.MouseEvent, id: string) => {
      e.preventDefault(); e.stopPropagation();
      if (!editName.trim()) return;
      const original = allStaff.find(s => s.id === id);
      if (!original) return;

      const updated: UserType = {
         ...original,
         name: editName,
         staffRole: editRole as any
      };
      onEdit?.(updated);
      setInlineEditingId(null);
   };

   return (
      <div className={`relative flex-1 ${isOpen ? 'z-[9999]' : 'z-10'}`} ref={wrapperRef}>
         <div
            onMouseDown={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setIsOpen(!isOpen); } }}
            tabIndex={0}
            className={`w-full bg-white/[0.03] border ${isOpen ? 'border-indigo-500/50 ring-4 ring-indigo-500/10' : (isBusyFn && isBusyFn(selectedId) ? 'border-amber-500/50' : 'border-white/5')} rounded-xl p-3.5 flex justify-between items-center text-[10px] font-black text-white hover:bg-white/[0.08] transition-all cursor-pointer shadow-sm group outline-none`}
         >
            <div className="flex items-center gap-3 overflow-hidden">
               {selectedOpt ? (
                  <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[9px] font-black uppercase shrink-0 shadow-lg shadow-indigo-500/20">
                     {(selectedOpt.name || selectedOpt.email || '?').charAt(0)}
                  </div>
               ) : (
                  <div className="w-5 h-5 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                     <Users className="w-2.5 h-2.5 text-zinc-500 group-hover:text-zinc-400 transition-colors" />
                  </div>
               )}
               <span className="truncate">{displayValue || 'Select Personnel...'}</span>
            </div>
            <div className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
               <Plus className="w-3 h-3 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
            </div>
         </div>

         {isOpen && (
            <div
               ref={contentRef}
               className="absolute left-0 right-0 top-[calc(100%+8px)] bg-[#0c0c0e] border border-white/10 rounded-2xl z-[10000] shadow-[0_30px_90px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-ios-fade-in pointer-events-auto backdrop-blur-xl"
            >
               {isAddingInDropdown ? (
                  <div className="p-5 space-y-4 animate-ios-slide-up" onMouseDown={e => e.stopPropagation()}>
                     <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">Initialize Registry</p>
                     <div className="space-y-3">
                        <div className="space-y-1">
                           <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-1">Full Name</label>
                           <input
                              autoFocus
                              placeholder="Ex. Jane Doe"
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] font-bold text-white outline-none focus:border-indigo-500/50 transition-all"
                              value={newMemberNameInDropdown}
                              onChange={e => setNewMemberNameInDropdown(e.target.value)}
                           />
                        </div>
                        <div className="space-y-1">
                           <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-1">Functional Class</label>
                           <select
                              className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] font-bold text-white outline-none focus:border-indigo-500/50 transition-all appearance-none"
                              value={newMemberRoleInDropdown}
                              onChange={e => setNewMemberRoleInDropdown(e.target.value)}
                           >
                              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                           </select>
                        </div>
                     </div>
                     <div className="flex gap-2 pt-2">
                        <button onClick={handleAddSaved} className="flex-1 py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 shadow-xl shadow-white/10">Commit Person</button>
                        <button onClick={() => setIsAddingInDropdown(false)} className="px-4 py-3 bg-white/5 text-zinc-500 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
                     </div>
                  </div>
               ) : (
                  <>
                     <div className="p-3 border-b border-white/5 shrink-0 relative bg-white/[0.02]">
                        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-6 top-1/2 -translate-y-1/2" />
                        <input
                           type="text"
                           autoFocus
                           className="w-full bg-black/40 border border-white/5 rounded-xl p-3 pl-10 text-[10px] font-bold text-white placeholder:text-zinc-600 outline-none focus:border-white/20 transition-all font-mono"
                           placeholder="SEARCH PERSONNEL..."
                           value={search}
                           onChange={e => setSearch(e.target.value)}
                        />
                     </div>

                     <div className="max-h-[280px] overflow-y-auto no-scrollbar p-2 flex flex-col gap-1.5 custom-scrollbar">
                        {filteredOpts.map(s => {
                           const isEditing = inlineEditingId === s.id;
                           const isDeleting = deleteConfirmId === s.id;

                           if (isEditing) {
                              return (
                                 <div key={s.id} className="p-3 bg-white/5 rounded-xl space-y-3 animate-ios-fade-in" onMouseDown={e => e.stopPropagation()}>
                                    <input
                                       autoFocus
                                       className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-[10px] font-bold text-white outline-none focus:border-indigo-500/50"
                                       value={editName}
                                       onChange={e => setEditName(e.target.value)}
                                    />
                                    <div className="flex items-center gap-2">
                                       <select
                                          className="flex-1 bg-black/40 border border-white/10 rounded-lg p-2 text-[9px] font-black text-zinc-400 uppercase outline-none"
                                          value={editRole}
                                          onChange={e => setEditRole(e.target.value)}
                                       >
                                          {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                       </select>
                                       <button onClick={(e) => handleEditSave(e, s.id)} className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-all"><Check size={12} /></button>
                                       <button onClick={() => setInlineEditingId(null)} className="p-2 bg-white/5 text-zinc-500 rounded-lg hover:bg-white/10 transition-all"><X size={12} /></button>
                                    </div>
                                 </div>
                              );
                           }

                           if (isDeleting) {
                              return (
                                 <div key={s.id} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between animate-ios-slide-up" onMouseDown={e => e.stopPropagation()}>
                                    <span className="text-[9px] font-black text-red-500 uppercase tracking-widest px-1">Are you sure?</span>
                                    <div className="flex items-center gap-2">
                                       <button
                                          onClick={(e) => {
                                             e.preventDefault(); e.stopPropagation();
                                             onDelete?.(s.id);
                                             setDeleteConfirmId(null);
                                          }}
                                          className="px-3 py-1.5 bg-red-500 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-red-600 transition-all"
                                       >
                                          Delete
                                       </button>
                                       <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-1.5 bg-white/5 text-zinc-500 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Cancel</button>
                                    </div>
                                 </div>
                              );
                           }

                           return (
                              <div
                                 key={s.id}
                                 onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onChange(s.id);
                                    setIsOpen(false);
                                    setSearch('');
                                 }}
                                 className="p-3 hover:bg-white/[0.05] rounded-xl cursor-pointer flex justify-between items-center transition-all group/item"
                              >
                                 <div className="flex items-center gap-3 overflow-hidden">
                                    <div className={`w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 text-[11px] font-black uppercase shrink-0 group-hover/item:bg-indigo-500 group-hover/item:text-white transition-all shadow-sm`}>
                                       {(s.name || s.email || '?').charAt(0)}
                                    </div>
                                    <div className="truncate">
                                       <p className="text-[10px] font-black text-white uppercase truncate tracking-wide">{s.name || s.email}</p>
                                       <p className="text-[8px] font-bold text-zinc-500 truncate uppercase mt-0.5 flex items-center gap-1">
                                          <div className="w-1 h-1 rounded-full bg-zinc-700" />
                                          {s.staffRole || 'Member'}
                                       </p>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-1.5 opacity-0 group-hover/item:opacity-100 transition-opacity">
                                    <button
                                       type="button"
                                       onMouseDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setEditName(s.name || '');
                                          setEditRole(s.staffRole || '');
                                          setInlineEditingId(s.id);
                                       }}
                                       className="p-1.5 hover:bg-white/10 rounded-lg text-zinc-500 hover:text-white transition-all"
                                    >
                                       <Edit2 size={12} />
                                    </button>
                                    <button
                                       type="button"
                                       onMouseDown={(e) => {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          setDeleteConfirmId(s.id);
                                       }}
                                       className="p-1.5 hover:bg-red-500/10 rounded-lg text-zinc-500 hover:text-red-500 transition-all"
                                    >
                                       <Trash2 size={12} />
                                    </button>
                                    {isBusyFn && isBusyFn(s.id) ? (
                                       <span className="text-[7px] text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase font-black tracking-tighter">Busy</span>
                                    ) : (
                                       <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                                    )}
                                 </div>
                              </div>
                           );
                        })}

                        {filteredOpts.length === 0 && (
                           <div className="py-12 flex flex-col items-center justify-center gap-3 opacity-50">
                              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                                 <Users className="w-5 h-5 text-zinc-500" />
                              </div>
                              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">No members found</p>
                           </div>
                        )}

                        {selectedId && !inlineEditingId && !deleteConfirmId && (
                           <>
                              <div className="h-px bg-white/5 my-1 shrink-0" />
                              <div
                                 onMouseDown={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onChange('');
                                    setIsOpen(false);
                                    setSearch('');
                                 }}
                                 className="p-3 hover:bg-red-500/10 rounded-xl cursor-pointer flex items-center justify-center gap-2 group/clear transition-all"
                              >
                                 <X className="w-3 h-3 text-zinc-600 group-hover/clear:text-red-500 transition-colors" />
                                 <span className="text-[9px] font-black text-zinc-600 group-hover/clear:text-red-500 uppercase tracking-widest transition-colors">Clear Assignment</span>
                              </div>
                           </>
                        )}
                     </div>

                     <div className="border-t border-white/5 bg-black/40 p-4 shrink-0 relative z-[1000]">
                        <button
                           type="button"
                           onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              console.log('Add New Person clicked');
                              setNewMemberNameInDropdown(search);
                              setNewMemberRoleInDropdown(role);
                              setIsAddingInDropdown(true);
                           }}
                           className="w-full py-3.5 bg-white text-black hover:bg-zinc-200 active:scale-[0.98] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-2xl shadow-indigo-500/10 pointer-events-auto cursor-pointer relative z-[1001]"
                        >
                           + Add New Person
                        </button>
                     </div>
                  </>
               )}
            </div>
         )}
      </div>
   );
};


const ClientDetailsPage: React.FC = () => {
   const { id } = useParams<{ id: string }>();
   const navigate = useNavigate();

   const [client, setClient] = useState<Client | null>(null);
   const [loading, setLoading] = useState(true);
   const [activeTab, setActiveTab] = useState<'overview' | 'quotes' | 'invoices' | 'payments' | 'agreements' | 'team'>('overview');
   const [project, setProject] = useState<Project | null>(null);
   const [showEmergencyOverride, setShowEmergencyOverride] = useState(false);

   // Event Schedule State
   const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
   const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
   const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
   const [editProjectForm, setEditProjectForm] = useState<any>({});
   const [editingEvent, setEditingEvent] = useState<ClientEvent | null>(null);
   const [, setTimeCounter] = useState(0);

   useEffect(() => {
      const interval = setInterval(() => {
         setTimeCounter(c => c + 1);
      }, 30000); // 30 seconds
      return () => clearInterval(interval);
   }, []);
   const [newEventForm, setNewEventForm] = useState<Partial<ClientEvent>>({
      name: '',
      date: '',
      startTime: '09:00',
      endTime: '18:00',
      brideLocation: '',
      groomLocation: '',
      venueLocation: '',
      notes: '',
      status: 'Scheduled'
   });

   const handleSaveEvent = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!client) return;

      const newEvent: ClientEvent = {
         id: `event_${Date.now()}`,
         name: newEventForm.name || 'Unnamed Event',
         date: newEventForm.date || new Date().toISOString().split('T')[0],
         startTime: newEventForm.startTime,
         endTime: newEventForm.endTime,
         brideLocation: newEventForm.brideLocation,
         groomLocation: newEventForm.groomLocation,
         venueLocation: newEventForm.venueLocation,
         notes: newEventForm.notes,
         status: newEventForm.status || 'Scheduled'
      };

      const updatedEvents = [...(client.events || []), newEvent];
      const updatedClient = { ...client, events: updatedEvents };

      try {
         await api.saveClient(updatedClient);
         setClient(updatedClient);

         // Automatically create a coordination task
         await api.saveTask({
            id: `task_coord_${Date.now()}`,
            title: `Coordination for ${newEvent.name} - ${client.projectName || client.name}`,
            assignee: 'Unassigned',
            dueDate: newEvent.date,
            status: 'Pending',
            brand: client.brand || 'Artisans',
            divisionId: client.divisionId,
            priority: 'High',
            client: client.id,
            eventId: newEvent.id
         });

         addToast("Event and Coordination Task Created");
         setIsAddEventModalOpen(false);
         setNewEventForm({
            name: '', date: '', startTime: '09:00', endTime: '18:00', brideLocation: '', groomLocation: '', venueLocation: '', notes: '', status: 'Scheduled'
         });
      } catch (err) {
         console.error("Failed to save event:", err);
         addToast("Failed to create event");
      }
   };

   const handleUpdateEvent = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!client || !editingEvent) return;

      const oldEvent = client.events?.find(ev => ev.id === editingEvent.id);
      if (!oldEvent) return;

      const updatedEvents = (client.events || []).map(ev =>
         ev.id === editingEvent.id ? editingEvent : ev
      );

      let updatedClient = { ...client, events: updatedEvents };

      try {
         // If date changed, handle coordination tasks and timeline sync
         if (oldEvent.date !== editingEvent.date) {
            // Log timeline event
            const timelineEvent = {
               id: Date.now().toString(),
               title: 'Event Rescheduled',
               description: `Event "${editingEvent.name}" was rescheduled to ${new Date(editingEvent.date).toLocaleDateString()}.`,
               date: new Date().toISOString(),
               status: 'Completed' as const,
               category: 'system'
            };
            updatedClient = {
               ...updatedClient,
               portal: {
                  ...(updatedClient.portal || { timeline: [], deliverables: [], internalSpends: [] }),
                  timeline: [...(updatedClient.portal?.timeline || []), timelineEvent]
               }
            };

            // Update associated task date
            const allTasks = await api.getTasks();
            const associatedTask = allTasks.find(t => t.eventId === editingEvent.id || (t.title.includes('Coordination for ' + oldEvent.name) && t.client === client.id));
            if (associatedTask) {
               await api.saveTask({
                  ...associatedTask,
                  title: `Coordination for ${editingEvent.name} - ${client.projectName || client.name}`,
                  dueDate: editingEvent.date,
                  eventId: editingEvent.id
               });
            }
         } else if (oldEvent.name !== editingEvent.name) {
            // Just update task name if it changed without date changing
            const allTasks = await api.getTasks();
            const associatedTask = allTasks.find(t => t.eventId === editingEvent.id || (t.title.includes('Coordination for ' + oldEvent.name) && t.client === client.id));
            if (associatedTask) {
               await api.saveTask({
                  ...associatedTask,
                  title: `Coordination for ${editingEvent.name} - ${client.projectName || client.name}`
               });
            }
         }

         await api.saveClient(updatedClient);
         setClient(updatedClient);

         addToast("Event Updated Successfully");
         setIsEditEventModalOpen(false);
         setEditingEvent(null);
      } catch (err) {
         console.error("Failed to update event:", err);
         addToast("Failed to update event");
      }
   };

   const handleUpdateProjectInfo = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!client) return;

      const updatedClient = {
         ...client,
         name: editProjectForm.name,
         projectName: editProjectForm.projectName,
         email: editProjectForm.email,
         phone: editProjectForm.phone,
         projectType: editProjectForm.projectType,
         eventDate: editProjectForm.eventDate,
         status: editProjectForm.status,
      };

      try {
         await api.saveClient(updatedClient);
         setClient(updatedClient);
         addToast("Project Information Updated");
         setIsEditProjectModalOpen(false);
      } catch (err) {
         console.error("Failed to update project info:", err);
         addToast("Failed to update project info");
      }
   };

   const handleDeleteEvent = async (eventId: string, eventName: string) => {
      if (!client) return;
      if (!window.confirm(`Are you sure you want to delete the event "${eventName}"? This action cannot be undone.`)) return;

      const updatedEvents = (client.events || []).filter(ev => ev.id !== eventId);
      const updatedClient = { ...client, events: updatedEvents };

      try {
         await api.saveClient(updatedClient);
         setClient(updatedClient);

         // Delete associated task
         const allTasks = await api.getTasks();
         const associatedTask = allTasks.find(t => t.eventId === eventId || (t.title.includes('Coordination for ' + eventName) && t.client === client.id));
         if (associatedTask) {
            await api.deleteTask(associatedTask.id);
         }

         addToast("Event Deleted Successfully");
      } catch (err) {
         console.error("Failed to delete event:", err);
         addToast("Failed to delete event");
      }
   };


   // Team Assignment State
   const [allStaff, setAllStaff] = useState<UserType[]>([]);
   const [teamCategories, setTeamCategories] = useState<{ id: string, name: string, members: { memberId: string, assigned_dates: string[], assigned_events?: string[] }[] }[]>([]);
   const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
   const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
   const [newStaffForm, setNewStaffForm] = useState({ name: '', role: 'photographer', contact: '' });
   const [pendingDropdownAssign, setPendingDropdownAssign] = useState<{ role: string, idx: number } | null>(null);

   const [pendingConfirm, setPendingConfirm] = useState<{
      title: string;
      message: string;
      tone?: 'default' | 'danger';
      onConfirm: () => void;
      confirmLabel?: string;
   } | null>(null);

   const requestConfirmation = (config: {
      title: string;
      message: string;
      tone?: 'default' | 'danger';
      onConfirm: () => void;
      confirmLabel?: string;
   }) => {
      setPendingConfirm(config);
   };



   const handleAddArtisanMember = (m: UserType) => {
      // Sync to global users for Team Placement
      const storedUsers = JSON.parse(localStorage.getItem('users') || '[]');
      localStorage.setItem('users', JSON.stringify([...storedUsers, m]));
      setAllStaff(prev => [...prev, m]);
   };

   // Agreement Templates State
   const [agreementTemplates, setAgreementTemplates] = useState<AgreementTemplate[]>([]);
   const [clientAgreement, setClientAgreement] = useState<ClientAgreement | null>(null);
   const [idDocument, setIdDocument] = useState<IdDocument | null>(null);

   // templates hydration
   useEffect(() => {
      const stored = localStorage.getItem('artisans_agreement_templates');
      if (stored) {
         setAgreementTemplates(JSON.parse(stored));
      } else {
         const defaultTemp: AgreementTemplate = {
            id: 'v1',
            version: 1,
            title: 'Standard Operational Terms',
            body: "Apex Production Co. Standard Terms of Engagement. By signing, the client agrees to the production timeline and payment schedule outlined in the quotation.",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
         };
         setAgreementTemplates([defaultTemp]);
         localStorage.setItem('artisans_agreement_templates', JSON.stringify([defaultTemp]));
      }
   }, []);

   // editing state
   const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
   const [termsEditTitle, setTermsEditTitle] = useState('');
   const [termsEditText, setTermsEditText] = useState('');
   const [isAgreed, setIsAgreed] = useState(false);

   const currentUser = getAuthUser() || {};
   const isAdmin = currentUser?.role?.toLowerCase() === 'admin';

   const [clientQuotes, setClientQuotes] = useState<Invoice[]>([]);
   const [clientInvoices, setClientInvoices] = useState<Invoice[]>([]);

   // Modular Builder State
   const [isModalOpen, setIsModalOpen] = useState(false);
   const [modalType, setModalType] = useState<'quotation' | 'invoice'>('quotation');
   const [editDocId, setEditDocId] = useState<string | null>(null);
   const [autoGeneratedId, setAutoGeneratedId] = useState<string>('');
   const [builderCategory, setBuilderCategory] = useState<'physical' | 'digital' | 'team'>('physical');
   const [searchQuery, setSearchQuery] = useState("");
   const [showSuggestions, setShowSuggestions] = useState(false);
   const [isAddingNewInSearch, setIsAddingNewInSearch] = useState(false);
   const [newMemberRoleInSearch, setNewMemberRoleInSearch] = useState('photographer');
   const [newMemberPhoneInSearch, setNewMemberPhoneInSearch] = useState('');
   const [newMemberEmailInSearch, setNewMemberEmailInSearch] = useState('');
   const [newMemberRateInSearch, setNewMemberRateInSearch] = useState('');

   const [personnelRegistry, setPersonnelRegistry] = useState<any[]>(() => {
      const stored = localStorage.getItem('personnel_registry');
      if (stored) return JSON.parse(stored);
      return SUGGESTIONS.team.map((t, idx) => ({ ...t, id: `pr_${idx}`, status: 'Active' }));
   });

   const savePersonnelRegistry = (newRegistry: any[]) => {
      setPersonnelRegistry(newRegistry);
      localStorage.setItem('personnel_registry', JSON.stringify(newRegistry));
   };

   const handleDeletePersonnel = (id: string, e: React.MouseEvent) => {
      e.preventDefault(); e.stopPropagation();
      if (!window.confirm("Are you sure you want to remove this person from the registry?")) return;

      const personToRemove = personnelRegistry.find(p => p.id === id);
      const newRegistry = personnelRegistry.filter(p => p.id !== id);
      savePersonnelRegistry(newRegistry);

      if (personToRemove) {
         setCategorizedItems(prev => ({
            ...prev,
            team: prev.team.filter(t => t.name !== personToRemove.name)
         }));
      }
      addToast("Personnel removed from registry");
   };

   const [editingPersonnel, setEditingPersonnel] = useState<any | null>(null);

   const handleSavePersonnelEdit = () => {
      if (!editingPersonnel || !editingPersonnel.name.trim()) return;
      const newRegistry = personnelRegistry.map(p => p.id === editingPersonnel.id ? editingPersonnel : p);
      savePersonnelRegistry(newRegistry);

      const oldPerson = personnelRegistry.find(p => p.id === editingPersonnel.id);
      if (oldPerson && oldPerson.name !== editingPersonnel.name) {
         setCategorizedItems(prev => ({
            ...prev,
            team: prev.team.map(t => t.name === oldPerson.name ? { ...t, name: editingPersonnel.name, role: editingPersonnel.role } : t)
         }));
      } else if (oldPerson && oldPerson.role !== editingPersonnel.role) {
         setCategorizedItems(prev => ({
            ...prev,
            team: prev.team.map(t => t.name === oldPerson.name ? { ...t, role: editingPersonnel.role } : t)
         }));
      }

      setEditingPersonnel(null);
      addToast("Personnel updated");
   };

   const searchRef = useRef<HTMLDivElement>(null);
   const [formDueDate, setFormDueDate] = useState('');

   const [categorizedItems, setCategorizedItems] = useState<{
      physical: { id: string; name: string; quantity: number; price: number }[];
      digital: { id: string; name: string; quantity: number; price: number }[];
      team: { id: string; name: string; role: string; cost?: number }[];
   }>({
      physical: [],
      digital: [],
      team: []
   });

   const [lastDeletedItem, setLastDeletedItem] = useState<{
      category: 'physical' | 'digital' | 'team';
      item: any;
      index: number;
   } | null>(null);
   const [toasts, setToasts] = useState<{ id: string; message: string; onUndo?: () => void }[]>([]);


   // Helper to add item to a category
   const addItemToCategory = (category: 'physical' | 'digital' | 'team') => {
      setCategorizedItems(prev => ({
         ...prev,
         [category]: [
            ...prev[category],
            category === 'team'
               ? { id: `team_${Date.now()}`, name: '', role: 'photographer', cost: 0 }
               : { id: `${category}_${Date.now()}`, name: '', quantity: 1, price: 0 }
         ]
      }));
   };

   // Helper to update item in a category
   const updateCategorizedItem = (category: 'physical' | 'digital' | 'team', id: string, field: string, value: any) => {
      setCategorizedItems(prev => ({
         ...prev,
         [category]: prev[category].map(item => item.id === id ? { ...item, [field]: value } : item)
      }));
   };

   const addToast = (message: string, onUndo?: (id: string) => void) => {
      const id = Math.random().toString(36).substr(2, 9);
      setToasts(prev => [...prev, { id, message, onUndo: onUndo ? () => onUndo(id) : undefined }]);
      setTimeout(() => {
         setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
   };

   // Helper to remove item from a category
   const removeCategorizedItem = (category: 'physical' | 'digital' | 'team', id: string) => {
      const itemToDelete = categorizedItems[category].find(it => it.id === id);
      const itemIndex = categorizedItems[category].findIndex(it => it.id === id);
      if (!itemToDelete) return;

      if (!window.confirm('Are you sure you want to delete this?')) return;

      setLastDeletedItem({ category, item: itemToDelete, index: itemIndex });
      setCategorizedItems(prev => ({
         ...prev,
         [category]: prev[category].filter(item => item.id !== id)
      }));

      addToast("Item deleted", (toastId) => handleUndoDelete(toastId));
   };

   const handleSearchChange = (query: string) => {
      setSearchQuery(query);

      setShowSuggestions(!!query);
      setIsAddingNewInSearch(false);

      const lowerQuery = query.toLowerCase();

      const isPhysical = CATEGORY_KEYWORDS.physical.some(k => lowerQuery.includes(k));
      const isDigital = CATEGORY_KEYWORDS.digital.some(k => lowerQuery.includes(k));
      const isTeam = SUGGESTIONS.team.some(t => t.name.toLowerCase().includes(lowerQuery));

      if (isPhysical) setBuilderCategory('physical');
      else if (isDigital) setBuilderCategory('digital');
      else if (isTeam) setBuilderCategory('team');
   };

   const addSelectedSuggestion = (suggestion: any, category: 'physical' | 'digital' | 'team') => {
      const exists = categorizedItems[category].some(item => item.name === suggestion.name);
      if (exists) {
         setCategorizedItems(prev => ({
            ...prev,
            [category]: prev[category].filter(item => item.name !== suggestion.name)
         }));
         addToast("Item removed");
         return;
      }

      setCategorizedItems(prev => ({
         ...prev,
         [category]: [
            ...prev[category],
            category === 'team'
               ? { id: `team_${Date.now()}`, name: suggestion.name, role: suggestion.role, cost: 0 }
               : { id: `${category}_${Date.now()}`, name: suggestion.name, quantity: 1, price: suggestion.price }
         ]
      }));
      addToast("Item assigned");
   };

   const handleAddFromSearch = () => {
      console.log("ADDING:", searchQuery);
      if (!searchQuery.trim()) return;

      const newItem = builderCategory === 'team'
         ? { id: `team_${Date.now()}`, name: searchQuery, role: 'photographer', cost: 0 }
         : { id: `${builderCategory}_${Date.now()}`, name: searchQuery, quantity: 1, price: 0 };

      setCategorizedItems(prev => ({
         ...prev,
         [builderCategory]: [...prev[builderCategory], newItem]
      }));

      addToast(`${builderCategory === 'team' ? 'Person' : builderCategory === 'physical' ? 'Item' : 'Service'} added`);
      setSearchQuery("");
      setShowSuggestions(false);
      setIsAddingNewInSearch(false);
   };

   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
            setShowSuggestions(false);
         }
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
   }, []);

   const handleUndoDelete = (toastId?: string) => {
      if (!lastDeletedItem) return;
      const { category, item, index } = lastDeletedItem;
      setCategorizedItems(prev => {
         const newList = [...prev[category]];
         newList.splice(index, 0, item);
         return { ...prev, [category]: newList };
      });
      setLastDeletedItem(null);
      if (toastId) {
         setToasts(prev => prev.filter(t => t.id !== toastId));
      }
   };

   const [formCompanyLogoUrl, setFormCompanyLogoUrl] = useState('');
   const [formPaymentTerms, setFormPaymentTerms] = useState('Due on Receipt');
   const [formTaxPercent, setFormTaxPercent] = useState<number>(0);
   const [formDiscountValue, setFormDiscountValue] = useState<number>(0);
   const [formDiscountType, setFormDiscountType] = useState<'flat' | 'percent'>('flat');
   const [formShippingCost, setFormShippingCost] = useState<number>(0);
   const [formNotes, setFormNotes] = useState('');
   const [formTermsSummary, setFormTermsSummary] = useState('');

   const { companies, settings: currentContextCompany } = useCompanySettings();
   const matchedCompany = useCompanyForClient(client);
   const [selectedCompanyIdForDoc, setSelectedCompanyIdForDoc] = useState<string>('');

   const [isSubmitting, setIsSubmitting] = useState(false);
   const [successMsg, setSuccessMsg] = useState<string | null>(null);

   // Sync selectedCompanyIdForDoc when client changes
   useEffect(() => {
      if (matchedCompany && !selectedCompanyIdForDoc) {
         setSelectedCompanyIdForDoc(matchedCompany.id);
      }
   }, [matchedCompany]);

   const generateAutoId = (type: 'quotation' | 'invoice', companyId: string) => {
      const company = companies.find(c => c.id === companyId) || matchedCompany || currentContextCompany;
      const prefix = company.invoicePrefix || (type === 'quotation' ? 'QT' : 'INV');
      return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`;
   };

   // Right Side Preview Drawer Logic
   const [previewDoc, setPreviewDoc] = useState<Invoice | null>(null);

   // Handle body scroll lock for modals
   useEffect(() => {
      if (isModalOpen || !!previewDoc || isAddStaffModalOpen) {
         document.body.style.overflow = 'hidden';
      } else {
         document.body.style.overflow = 'auto';
      }
      return () => {
         document.body.style.overflow = 'auto';
      };
   }, [isModalOpen, previewDoc, isAddStaffModalOpen]);


   const calculateSubtotal = () => {
      const physicalSub = categorizedItems.physical.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0);
      const digitalSub = categorizedItems.digital.reduce((acc, curr) => acc + (curr.quantity * curr.price), 0);
      // Team costs are optional in subtotal based on requirement
      return physicalSub + digitalSub;
   };
   const calculateFinalTotal = () => {
      const sub = calculateSubtotal();
      const taxAmount = (sub * formTaxPercent) / 100;
      const discAmount = formDiscountType === 'percent' ? (sub * formDiscountValue) / 100 : formDiscountValue;
      return Math.max(0, sub + taxAmount - discAmount + formShippingCost);
   };

   const openModal = (type: 'quotation' | 'invoice', existingDoc?: Invoice) => {
      setModalType(type);
      if (existingDoc) {
         setEditDocId(existingDoc.id);
         setAutoGeneratedId(existingDoc.id);
         setSelectedCompanyIdForDoc(existingDoc.brandId || '');
         setFormDueDate(existingDoc.dueDate || '');

         // Hydrate categorized items from existing items list
         const hyd: any = { physical: [], digital: [], team: [] };
         (existingDoc.items || []).forEach((it: any) => {
            if (it.id?.startsWith('physical')) hyd.physical.push({ id: it.id, name: it.description, quantity: it.quantity, price: it.price });
            else if (it.id?.startsWith('digital')) hyd.digital.push({ id: it.id, name: it.description, quantity: it.quantity, price: it.price });
            else if (it.id?.startsWith('team')) hyd.team.push({ id: it.id, name: it.description, role: 'Personnel', cost: it.price });
            else hyd.physical.push({ id: `physical_${Date.now()}_${Math.random()}`, name: it.description, quantity: it.quantity, price: it.price });
         });
         setCategorizedItems(hyd);
         setFormCompanyLogoUrl(existingDoc.companyLogoUrl || '');
         setFormPaymentTerms(existingDoc.paymentTerms || '');
         setFormTaxPercent(existingDoc.taxPercent || 0);
         setFormDiscountValue(existingDoc.discountValue || 0);
         setFormDiscountType(existingDoc.discountType || 'flat');
         setFormShippingCost(existingDoc.shippingCost || 0);
         setFormNotes(existingDoc.notes || '');
         setFormTermsSummary(existingDoc.termsSummary || '');
      } else {
         const company = matchedCompany || currentContextCompany;
         setEditDocId(null);
         setSelectedCompanyIdForDoc(company.id || '');
         setAutoGeneratedId(generateAutoId(type, company.id || ''));
         setFormDueDate(new Date().toISOString().split('T')[0]);
         setCategorizedItems({ physical: [], digital: [], team: [] });
         setFormCompanyLogoUrl(company.logo || '');
         setFormPaymentTerms(company.paymentTerms || 'Due on Receipt');
         setFormTaxPercent(0);
         setFormDiscountValue(0);
         setFormDiscountType('flat');
         setFormShippingCost(0);
         setFormNotes(company.invoiceNotes || '');
         setFormTermsSummary('');
      }
      setSuccessMsg(null);
      setIsModalOpen(true);
   };

   const handleDeleteQuote = (quoteId: string) => {
      requestConfirmation({
         title: "Delete Quote",
         message: "Are you sure you want to delete this quotation? This action cannot be undone.",
         tone: "danger",
         onConfirm: () => {
            setClientQuotes(prev => prev.filter(q => q.id !== quoteId));
            const stored = JSON.parse(localStorage.getItem("quotes") || "[]");
            const updated = stored.filter((q: any) => q.id !== quoteId);
            localStorage.setItem("quotes", JSON.stringify(updated));
            window.dispatchEvent(new Event("finance-updated"));
         }
      });
   };

   const handleDeleteInvoice = (invoiceId: string) => {
      requestConfirmation({
         title: "Delete Invoice",
         message: "Are you sure you want to delete this invoice? This action cannot be undone.",
         tone: "danger",
         onConfirm: () => {
            setClientInvoices(prev => prev.filter(i => i.id !== invoiceId));
            const stored = JSON.parse(localStorage.getItem("invoices") || "[]");
            const updated = stored.filter((i: any) => i.id !== invoiceId);
            localStorage.setItem("invoices", JSON.stringify(updated));
            window.dispatchEvent(new Event("finance-updated"));
         }
      });
   };

   const handleDuplicate = async (e: React.MouseEvent, doc: Invoice) => {
      e.stopPropagation();
      const duplicateId = `${doc.type === 'quotation' ? 'QT' : 'INV'}-${Math.floor(10000 + Math.random() * 90000)}-COPY`;
      const duplicateDoc: Invoice = {
         ...doc,
         _id: `inv_id_${Date.now()}`,
         id: duplicateId,
         status: doc.type === 'quotation' ? 'Quotation' : 'Unpaid',
         paidAmount: 0,
         paymentHistory: [],
         createdAt: new Date().toISOString().split('T')[0],
         issueDate: new Date().toISOString().split('T')[0]
      };
      try {
         await api.saveInvoice(duplicateDoc);
         if (duplicateDoc.type === 'quotation') setClientQuotes(prev => [duplicateDoc, ...prev]);
         else setClientInvoices(prev => [duplicateDoc, ...prev]);
      } catch (err) {
         console.error('Failed to duplicate:', err);
      }
   };

   const markAsPaid = async (e: React.MouseEvent, activeInvoice: Invoice) => {
      e.stopPropagation();
      if (activeInvoice.status === 'Paid') return;
      const total = activeInvoice.totalAmount || activeInvoice.amount || 0;
      const amountToAdd = total - (activeInvoice.paidAmount || 0);
      if (amountToAdd <= 0) return;

      const paymentRecord: PaymentRecord = {
         id: `PAY-${Date.now()}`,
         amount: amountToAdd,
         date: new Date().toISOString().split('T')[0]
      };

      const history = activeInvoice.paymentHistory ? [...activeInvoice.paymentHistory] : [];
      history.push(paymentRecord);

      const updatedInvoice: Invoice = {
         ...activeInvoice,
         paidAmount: total,
         status: 'Paid',
         paymentHistory: history
      };

      try {
         await api.saveInvoice(updatedInvoice);
         setClientInvoices(prev => prev.map(inv => inv.id === activeInvoice.id ? updatedInvoice : inv));
         if (previewDoc?.id === activeInvoice.id) setPreviewDoc(updatedInvoice);
         if (project) {
            await advanceProjectWorkflow(project.id, 'Advance Paid', `Invoice ${updatedInvoice.id} paid in full`);
         }
      } catch (err) {
         console.error(err);
      }
   };


   const handleCreateDocument = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!client) return;

      // Flatten items for document saving
      const allItems = [
         ...categorizedItems.physical.map(it => ({ id: it.id, description: it.name, quantity: it.quantity, price: it.price })),
         ...categorizedItems.digital.map(it => ({ id: it.id, description: it.name, quantity: it.quantity, price: it.price })),
         ...categorizedItems.team.map(it => ({ id: it.id, description: it.name, quantity: 1, price: it.cost || 0 }))
      ];

      const validItems = allItems.filter(item => item.description.trim() !== '' || (item.price && item.price > 0));
      if (validItems.length === 0) {
         alert("Please add at least one service or deliverable.");
         return;
      }

      setIsSubmitting(true);
      const totalAmount = calculateFinalTotal();

      let existingDoc: Invoice | undefined;
      if (editDocId) {
         existingDoc = modalType === 'quotation'
            ? clientQuotes.find(q => q.id === editDocId)
            : clientInvoices.find(i => i.id === editDocId);
      }

      const draftState = (e.nativeEvent as SubmitEvent)?.submitter?.getAttribute('data-action') === 'draft';
      const docId = existingDoc?.id || autoGeneratedId;
      const selectedCompany = companies.find(c => c.id === selectedCompanyIdForDoc) || matchedCompany || currentContextCompany;

      const newDoc: Invoice = {
         ...existingDoc,
         _id: existingDoc?._id || `inv_id_${Date.now()}`,
         id: docId,
         brand: selectedCompany.companyName,
         brandId: selectedCompany.id,
         clientId: client.id,
         client: { id: client.id, name: client.name },
         amount: calculateSubtotal(),
         totalAmount: totalAmount,
         paidAmount: existingDoc?.paidAmount || 0,
         paymentHistory: existingDoc?.paymentHistory || [],
         status: draftState ? 'Draft' : existingDoc?.status || (modalType === 'quotation' ? 'Quotation' : 'Unpaid'),
         type: modalType,
         isQuotation: modalType === 'quotation',
         items: validItems,
         createdAt: existingDoc?.createdAt || new Date().toISOString().split('T')[0],
         issueDate: existingDoc?.issueDate || new Date().toISOString().split('T')[0],
         dueDate: formDueDate || new Date().toISOString().split('T')[0],
         companyLogoUrl: formCompanyLogoUrl,
         paymentTerms: formPaymentTerms,
         taxPercent: formTaxPercent,
         discountValue: formDiscountValue,
         discountType: formDiscountType,
         shippingCost: formShippingCost,
         notes: formNotes,
         termsSummary: formTermsSummary,
      };

      // Stamp the template version used at generation time
      if (!existingDoc) {
         const resolver = modalType === 'quotation' ? getBrandQuoteTemplate : getBrandInvoiceTemplate;
         const resolvedTemplate = resolver(selectedCompany.id || selectedCompany.companyName);
         newDoc.templateId = resolvedTemplate.metadata.id;
         newDoc.templateVersion = resolvedTemplate.metadata.version;
      }

      if (editDocId && modalType !== 'quotation' && newDoc.status !== 'Draft') {
         const paid = newDoc.paidAmount || 0;
         if (paid === 0) newDoc.status = 'Unpaid';
         else if (paid < totalAmount) newDoc.status = 'Partial';
         else newDoc.status = 'Paid';
      }

      try {
         const savedDoc = modalType === 'quotation'
            ? await api.saveQuote(newDoc)
            : await api.saveInvoice(newDoc);

         if (modalType === 'quotation') {
            setClientQuotes(prev => {
               const idx = prev.findIndex(q => q.id === savedDoc.id);
               if (idx >= 0) { const next = [...prev]; next[idx] = savedDoc; return next; }
               return [savedDoc, ...prev];
            });
         } else {
            setClientInvoices(prev => {
               const idx = prev.findIndex(i => i.id === savedDoc.id);
               if (idx >= 0) { const next = [...prev]; next[idx] = savedDoc; return next; }
               return [savedDoc, ...prev];
            });
         }

         setSuccessMsg(`${modalType === 'quotation' ? 'Quote' : 'Invoice'} successfully ${editDocId ? 'updated' : 'issued'}!`);
         if (previewDoc && previewDoc.id === savedDoc.id) setPreviewDoc(savedDoc);

         // Trigger global finance sync for App.tsx state
         window.dispatchEvent(new CustomEvent('finance-updated'));

         setTimeout(() => {
            setIsModalOpen(false);
            setSuccessMsg(null);
            setEditDocId(null);

            if (modalType === 'quotation' && !draftState) {
               navigate(`/agreement/${savedDoc.id}`);
            }
         }, 1500);
      } catch (err) {
         console.error(err);
      } finally {
         setIsSubmitting(false);
      }
   };



   const handleAddNewTemplate = () => {
      const nextV = agreementTemplates.length > 0 ? Math.max(...agreementTemplates.map(g => g.version)) + 1 : 1;
      setTermsEditTitle(`V${nextV} - New Agreement`);
      setTermsEditText("Insert agreement clauses here...");
      setEditingTemplateId('new');
   };

   const handleEditTemplate = (id: string, title: string, text: string) => {
      setTermsEditTitle(title);
      setTermsEditText(text);
      setEditingTemplateId(id);
   };

   const handleSaveTermsVersion = () => {
      let updated = [...agreementTemplates];
      if (editingTemplateId === 'new') {
         const nextV = updated.length > 0 ? Math.max(...updated.map(g => g.version)) + 1 : 1;
         updated.push({
            id: 'v' + Date.now(),
            version: nextV,
            title: termsEditTitle,
            body: termsEditText,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
         });
      } else {
         updated = updated.map(t => t.id === editingTemplateId ? { ...t, title: termsEditTitle, body: termsEditText, updatedAt: new Date().toISOString() } : t);
      }
      localStorage.setItem('artisans_agreement_templates', JSON.stringify(updated));
      setAgreementTemplates(updated);
      setEditingTemplateId(null);
   };

   const handleDeleteTemplate = (id: string) => {
      if (confirm("WARNING: This will globally delete this agreement template. Assigned snapshots will remain unaffected. Continue?")) {
         const updated = agreementTemplates.filter(t => t.id !== id);
         localStorage.setItem('artisans_agreement_templates', JSON.stringify(updated));
         setAgreementTemplates(updated);
      }
   };

   const handleAssignToClient = (temp: AgreementTemplate) => {
      if (confirm(`Assign snapshot of ${temp.title} to this client?`)) {
         const snapshot: ActiveAgreementSnapshot = {
            templateId: temp.id,
            version: temp.version,
            title: temp.title,
            body: temp.body,
            assignedAt: new Date().toISOString(),
            status: 'pending'
         };

         // Update Client Record
         const storedClients = JSON.parse(localStorage.getItem('clients') || '[]');
         const updatedClients = storedClients.map((c: Client) => {
            if (c.id === id || c._id === id) {
               return { ...c, activeAgreement: snapshot };
            }
            return c;
         });
         localStorage.setItem('clients', JSON.stringify(updatedClients));

         // Update local state UI
         setClientAgreement({
            clientId: id!,
            version: temp.version,
            status: 'pending',
            termsText: temp.body,
            title: temp.title
         });

         alert(`Agreement ${temp.title} assigned to client.`);
      }
   };

   const handleRevokeAgreement = () => {
      if (confirm("Remove active agreement from client? This will prevent them from accepting until re-assigned.")) {
         const storedClients = JSON.parse(localStorage.getItem('clients') || '[]');
         const updatedClients = storedClients.map((c: Client) => {
            if (c.id === id || c._id === id) {
               const prev = c.activeAgreement;
               return { ...c, activeAgreement: prev ? { ...prev, status: 'revoked' } : undefined };
            }
            return c;
         });
         localStorage.setItem('clients', JSON.stringify(updatedClients));
         setClientAgreement(null);
      }
   };

   const handleAcceptAgreement = () => {
      if (!isAgreed || !clientAgreement) return;
      const acceptedDate = new Date();

      // Update Client Record Snapshot
      const storedClients = JSON.parse(localStorage.getItem('clients') || '[]');
      const updatedClients = storedClients.map((c: Client) => {
         if (c.id === id || c._id === id) {
            if (c.activeAgreement) {
               return {
                  ...c,
                  activeAgreement: {
                     ...c.activeAgreement,
                     status: 'accepted' as any,
                     acceptedAt: acceptedDate.toISOString()
                  }
               };
            }
         }
         return c;
      });
      localStorage.setItem('clients', JSON.stringify(updatedClients));

      const ag: ClientAgreement = {
         ...clientAgreement,
         status: 'accepted',
         acceptedAt: acceptedDate.toISOString()
      };
      setClientAgreement(ag);
   };

   const handleUploadIdProof = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
         const file = e.target.files[0];
         const newDoc: IdDocument = {
            clientId: id!,
            type: "id_proof",
            fileName: file.name,
            fileUrl: URL.createObjectURL(file)
         };
         localStorage.setItem(`id_document_${id}`, JSON.stringify(newDoc));
         setIdDocument(newDoc);
      }
   };

   useEffect(() => {
      let isMounted = true;

      const fetchClientData = async () => {
         setLoading(true);

         const storedClients = localStorage.getItem('clients');
         let foundClient: Client | null = null;
         if (storedClients) {
            const clients: Client[] = JSON.parse(storedClients);
            foundClient = clients.find(c => c.id === id || c._id === id) || null;
            if (isMounted) setClient(foundClient);
         }

         if (foundClient) {
            // Hydrate Agreement Templates
            const storedTemps = localStorage.getItem('artisans_agreement_templates');
            if (storedTemps) {
               setAgreementTemplates(JSON.parse(storedTemps));
            }

            // Hydrate Client Agreement from Snapshot
            if (foundClient.activeAgreement) {
               const ca = foundClient.activeAgreement;
               setClientAgreement({
                  clientId: id!,
                  version: ca.version,
                  status: ca.status as any,
                  acceptedAt: ca.acceptedAt,
                  termsText: ca.body,
                  title: ca.title
               });
            }

            const cd = JSON.parse(localStorage.getItem(`id_document_${id}`) || 'null');
            if (cd) setIdDocument(cd);

            try {
               const allLedger = await api.getInvoices();
               const relevantDocs = allLedger.filter((item: Invoice) =>
                  item.clientId === foundClient!.id ||
                  item.clientId === foundClient!._id ||
                  item.clientId === id ||
                  (item.client && (item.client.id === id || item.client._id === id))
               );

               if (isMounted) {
                  const isQuote = (item: Invoice) => item.isQuotation || item.type === 'quotation' || ['Quotation', 'Draft', 'Approved'].includes(item.status);
                  setClientQuotes(relevantDocs.filter((item: Invoice) => isQuote(item)).reverse());
                  setClientInvoices(relevantDocs.filter((item: Invoice) => !isQuote(item)).reverse());
               }
            } catch (err) {
               console.error("Failed to fetch client documents", err);
            }

            const storedUsers = localStorage.getItem('users');
            if (storedUsers) {
               const parsedUsers = JSON.parse(storedUsers);
               if (isMounted) setAllStaff(parsedUsers.filter((u: any) => u.role === 'Staff'));
            }

            const cTeam = JSON.parse(localStorage.getItem(`client_team_${id}`) || 'null');
            if (cTeam && isMounted) {
               if (Array.isArray(cTeam)) {
                  // New dynamic format
                  setTeamCategories(cTeam);
               } else {
                  // Legacy object format migration
                  const migrated: any[] = [];
                  for (const role in cTeam) {
                     const members = (cTeam[role] && cTeam[role].length > 0)
                        ? (typeof cTeam[role][0] === 'string'
                           ? cTeam[role].map((str: string) => ({ memberId: str, assigned_dates: [] }))
                           : cTeam[role].map((item: any) => ({
                              memberId: item.memberId || '',
                              assigned_dates: item.assigned_dates || (item.assigned_date ? [item.assigned_date] : [])
                           })))
                        : [{ memberId: '', assigned_dates: [] }];

                     migrated.push({
                        id: `cat_${role}`,
                        name: role.charAt(0).toUpperCase() + role.slice(1),
                        members
                     });
                  }
                  setTeamCategories(migrated);
               }
            } else if (isMounted) {
               // Default categories if nothing in storage
               setTeamCategories([
                  { id: 'cat_photo', name: 'Photographer', members: [{ memberId: '', assigned_dates: [] }] },
                  { id: 'cat_video', name: 'Videographer', members: [{ memberId: '', assigned_dates: [] }] }
               ]);
            }

            const storedProjects = localStorage.getItem('projects');
            if (storedProjects) {
               const projects: Project[] = JSON.parse(storedProjects);
               const foundProject = projects.find(p => p.clientId === id || p.clientId === foundClient?.id || p.clientId === foundClient?._id);
               if (isMounted) setProject(foundProject || null);
            }
         }

         if (isMounted) setLoading(false);
      };

      fetchClientData();
      return () => { isMounted = false; };
   }, [id]);

   const handleDeleteStaff = (staffId: string) => {
      if (!confirm("Are you sure you want to remove this staff member? This will clear them from current assignments.")) return;
      const stored = JSON.parse(localStorage.getItem('users') || '[]');
      const updated = stored.filter((u: any) => u.id !== staffId);
      localStorage.setItem('users', JSON.stringify(updated));
      setAllStaff(updated.filter((u: any) => u.role === 'Staff'));

      setTeamCategories(prev => {
         const next = prev.map(cat => ({
            ...cat,
            members: cat.members.map(m => m.memberId === staffId ? { ...m, memberId: '' } : m)
         }));
         localStorage.setItem(`client_team_${id}`, JSON.stringify(next));
         syncToProjects(next);
         return next;
      });
   };

   const handleEditStaff = (staff: UserType) => {
      const stored = JSON.parse(localStorage.getItem('users') || '[]');
      const updated = stored.map((u: any) => u.id === staff.id ? { ...u, ...staff } : u);
      localStorage.setItem('users', JSON.stringify(updated));
      setAllStaff(updated.filter((u: any) => u.role === 'Staff'));
   };

   const handleAddNewStaffSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const stored = JSON.parse(localStorage.getItem('users') || '[]');

      if (editingStaffId) {
         const updated = stored.map((u: any) => u.id === editingStaffId ? {
            ...u,
            name: newStaffForm.name,
            email: newStaffForm.contact,
            staffRole: newStaffForm.role
         } : u);
         localStorage.setItem('users', JSON.stringify(updated));
         setAllStaff(updated.filter((u: any) => u.role === 'Staff'));
         setEditingStaffId(null);
      } else {
         const newUser: UserType = {
            id: `staff_${Date.now()}`,
            name: newStaffForm.name,
            email: newStaffForm.contact || `${newStaffForm.name.replace(/\s+/g, '').toLowerCase()}@staff.local`,
            role: 'Staff',
            staffRole: newStaffForm.role as any,
            isActive: true,
            permissions: []
         };
         const updatedUsers = [...stored, newUser];
         localStorage.setItem('users', JSON.stringify(updatedUsers));
         setAllStaff(updatedUsers.filter((u: any) => u.role === 'Staff'));

         if (pendingDropdownAssign) {
            handleMemberChange(pendingDropdownAssign.role, pendingDropdownAssign.idx, newUser.id);
         }
      }
      setIsAddStaffModalOpen(false);
      setNewStaffForm({ name: '', role: 'photographer', contact: '' });
   };
   const syncToProjects = async (categories: any[]) => {
      const stored = localStorage.getItem('projects');
      if (!stored) return;
      const projects: any[] = JSON.parse(stored);
      const pIdx = projects.findIndex(p => p.clientId === id || p.id === project?.id);
      if (pIdx >= 0) {
         const projectTeam: any = {};
         let hasEditor = false;
         let hasMember = false;

         categories.forEach(cat => {
            const key = cat.name.toLowerCase().replace(/\s/g, '') + 's';
            projectTeam[key] = cat.members.map((item: any) => {
               const staff = allStaff.find(s => s.id === item.memberId);
               if (staff && item.memberId) {
                  hasMember = true;
                  if (cat.name.toLowerCase().includes('editor') || staff.role.toLowerCase().includes('editor')) {
                     hasEditor = true;
                  }
               }
               return {
                  id: item.memberId,
                  name: staff?.name || 'Unassigned',
                  type: staff?.role === 'Staff' ? 'internal' : staff?.role === 'Admin' ? 'internal' : 'external',
                  assigned_dates: item.assigned_dates || [],
                  assigned_events: item.assigned_events || []
               };
            });
         });
         projects[pIdx].team = projectTeam;
         localStorage.setItem('projects', JSON.stringify(projects));
         setProject(projects[pIdx]);

         // Workflow auto-advance based on assignments
         if (hasEditor) {
            await advanceProjectWorkflow(projects[pIdx].id, 'Editing', 'Editor assigned to project');
         } else if (hasMember) {
            await advanceProjectWorkflow(projects[pIdx].id, 'Team Assigned', 'Team member assigned');
         }
      }
   };
   const handleMemberChange = (catId: string, mIdx: number, val: string) => {
      setTeamCategories(prev => {
         const next = prev.map(cat => {
            if (cat.id !== catId) return cat;
            const nextMembers = [...cat.members];
            nextMembers[mIdx] = { ...nextMembers[mIdx], memberId: val };
            return { ...cat, members: nextMembers };
         });
         localStorage.setItem(`client_team_${id}`, JSON.stringify(next));
         syncToProjects(next);
         return next;
      });
   };



   const handleAddEventToMember = (catId: string, mIdx: number, eventId: string) => {
      setTeamCategories(prev => {
         const next = prev.map(cat => {
            if (cat.id !== catId) return cat;
            const nextMembers = [...cat.members];
            const currentEvents = nextMembers[mIdx].assigned_events || [];
            if (currentEvents.includes(eventId)) return cat;
            nextMembers[mIdx] = {
               ...nextMembers[mIdx],
               assigned_events: [...currentEvents, eventId]
            };
            return { ...cat, members: nextMembers };
         });
         localStorage.setItem(`client_team_${id}`, JSON.stringify(next));
         syncToProjects(next);
         return next;
      });
   };

   const handleRemoveEvent = (catId: string, mIdx: number, eIdx: number) => {
      setTeamCategories(prev => {
         const next = prev.map(cat => {
            if (cat.id !== catId) return cat;
            const nextMembers = [...cat.members];
            const nextEvents = [...(nextMembers[mIdx].assigned_events || [])];
            nextEvents.splice(eIdx, 1);
            nextMembers[mIdx] = { ...nextMembers[mIdx], assigned_events: nextEvents };
            return { ...cat, members: nextMembers };
         });
         localStorage.setItem(`client_team_${id}`, JSON.stringify(next));
         syncToProjects(next);
         return next;
      });
   };

   const addMemberRow = (catId: string) => {
      setTeamCategories(prev => {
         const next = prev.map(cat => {
            if (cat.id !== catId) return cat;
            return { ...cat, members: [...cat.members, { memberId: '', assigned_dates: [] }] };
         });
         localStorage.setItem(`client_team_${id}`, JSON.stringify(next));
         syncToProjects(next);
         return next;
      });
   };

   const removeMemberRow = (catId: string, mIdx: number) => {
      setTeamCategories(prev => {
         const next = prev.map(cat => {
            if (cat.id !== catId) return cat;
            if (cat.members.length <= 1) return cat;
            return { ...cat, members: cat.members.filter((_, i) => i !== mIdx) };
         });
         localStorage.setItem(`client_team_${id}`, JSON.stringify(next));
         syncToProjects(next);
         return next;
      });
   };

   const handleAddCategory = () => {
      const name = prompt("Enter category name (e.g. Photographer, Drone Pilot)");
      if (!name) return;
      setTeamCategories(prev => {
         const next = [...prev, { id: `cat_${Date.now()}`, name, members: [{ memberId: '', assigned_dates: [] }] }];
         localStorage.setItem(`client_team_${id}`, JSON.stringify(next));
         syncToProjects(next);
         return next;
      });
   };

   const handleEditCategory = (id: string) => {
      const cat = teamCategories.find(c => c.id === id);
      const name = prompt("Edit category name", cat?.name);
      if (!name) return;
      setTeamCategories(prev => {
         const next = prev.map(c => c.id === id ? { ...c, name } : c);
         localStorage.setItem(`client_team_${id}`, JSON.stringify(next));
         syncToProjects(next);
         return next;
      });
   };

   const handleDeleteCategory = (id: string) => {
      if (!confirm("Delete this category and all its assignments?")) return;
      setTeamCategories(prev => {
         const next = prev.filter(c => c.id !== id);
         localStorage.setItem(`client_team_${id}`, JSON.stringify(next));
         syncToProjects(next);
         return next;
      });
   };

   if (loading) {
      return (
         <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
               <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Connecting Workspace...</p>
            </div>
         </div>
      );
   }

   if (!client) {
      return (
         <div className="min-h-screen bg-black flex flex-col items-center justify-center p-10 text-center animate-ios-slide-up">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mb-8 border border-red-500/10">
               <span className="text-red-500 text-4xl font-black">!</span>
            </div>
            <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4">Client Null Space</h1>
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-[0.2em] mb-10">Historical Record Missing from Registry</p>
            <button onClick={() => navigate('/directory')} className="px-10 py-4 bg-white text-black text-[11px] font-black uppercase rounded-2xl tracking-widest active:scale-95 transition-all outline-none">
               Return to Directory
            </button>
         </div>
      );
   }

   const allPayments = clientInvoices.flatMap(i => i.paymentHistory || []);
   // Other financial bounds processing handled natively within their respective tabs

   return (
      <div className="animate-ios-slide-up space-y-8 pb-32">
         {/* HEADER TOP MODULE */}
         <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 mb-4 mt-2">
            <div className="flex items-start gap-5">
               <button onClick={() => navigate('/directory')} className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl text-zinc-500 hover:text-white transition-all active:scale-90">
                  <ArrowLeft className="w-5 h-5" />
               </button>
               <div className="space-y-1">
                  <div className="flex items-center gap-3">
                     <h1 className="text-3xl lg:text-4xl font-black text-white uppercase tracking-tighter shrink-0">{client.name || 'Anonymous client'}</h1>
                     <span className="px-2 py-1 bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1 border border-emerald-500/20">
                        <Activity className="w-3 h-3" /> Active
                     </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                     <span className="flex items-center gap-1.5"><Mail className="w-3 h-3 text-zinc-700" /> {client.email || 'N/A'}</span>
                     <span>•</span>
                     <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-zinc-700" /> {client.phone || 'N/A'}</span>
                     <span>•</span>
                     <span className="flex items-center gap-1.5 text-blue-400"><Briefcase className="w-3 h-3 opacity-50" /> {client.projectType || client.projectName || 'General'}</span>
                     <span>•</span>
                     <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3 text-zinc-700" /> {client.eventDate || client.weddingDate || 'No Date'}</span>
                  </div>
               </div>
            </div>
            <div className="flex items-center gap-3 w-full xl:w-auto overflow-x-auto no-scrollbar pt-2 xl:pt-0 pb-2">
               <button onClick={() => openModal('quotation')} className="touch-target shrink-0 px-6 py-3.5 bg-white/5 text-white border border-white/5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10 hover:border-white/20 transition-all active:scale-95 flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Create Quote
               </button>
               <button onClick={() => openModal('invoice')} className="touch-target shrink-0 px-6 py-3.5 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-zinc-200 transition-all active:scale-95 flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.1)]">
                  <Plus className="w-4 h-4 text-black/50" /> Create Invoice
               </button>
            </div>
         </div>

         {/* Tabs */}
         <div className="flex items-center gap-2 border-b border-white/5 mt-8 sticky top-0 z-40 bg-black/80 backdrop-blur-xl pt-4 overflow-x-auto no-scrollbar">
            {(['overview', 'quotes', 'invoices', 'payments', 'agreements', 'team'] as const).map((tab) => (
               <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`touch-target px-4 md:px-8 py-3 md:py-4 rounded-t-2xl font-black uppercase text-[11px] tracking-widest transition-all whitespace-nowrap ${activeTab === tab
                     ? 'bg-zinc-900 text-white border-t border-x border-white/5 shadow-[0_-10px_20px_rgba(0,0,0,0.5)] z-10'
                     : 'text-zinc-600 hover:text-zinc-300 hover:bg-white/5 border-t border-x border-transparent translate-y-1'
                     }`}
               >
                  {tab}
               </button>
            ))}
         </div>

         <div className="pt-8 relative min-h-[400px]">
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
               <div className="animate-ios-fade-in space-y-8">
                  {/* Removed team assignment from here */}
                  {/* Project Information */}
                  <div className="glass-panel p-8 squircle-md border border-white/5 space-y-6">
                     <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em]">Project Information</h3>
                        <button
                           onClick={() => {
                              setEditProjectForm({
                                 name: client.name || '',
                                 projectName: client.projectName || '',
                                 email: client.email || '',
                                 phone: client.phone || '',
                                 projectType: client.projectType || '',
                                 eventDate: client.eventDate || client.weddingDate || '',
                                 status: client.status || 'Active'
                              });
                              setIsEditProjectModalOpen(true);
                           }}
                           className="text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors flex items-center gap-2"
                        >
                           <Edit2 className="w-3 h-3" /> Edit
                        </button>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        <div>
                           <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Client ID</p>
                           <p className="text-sm font-bold text-white">{client.id || (client as any)._id}</p>
                        </div>
                        <div>
                           <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Client Name</p>
                           <p className="text-sm font-bold text-white">{client.name}</p>
                        </div>
                        <div>
                           <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Project Name</p>
                           <p className="text-sm font-bold text-white">{client.projectName}</p>
                        </div>
                        <div>
                           <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Project Type</p>
                           <p className="text-sm font-bold text-white capitalize">{client.projectType}</p>
                        </div>
                        <div>
                           <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Primary Event Date</p>
                           <p className="text-sm font-bold text-white">{client.eventDate || client.weddingDate || 'TBD'}</p>
                        </div>
                        <div>
                           <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Email</p>
                           <p className="text-sm font-bold text-white truncate" title={client.email}>{client.email}</p>
                        </div>
                        <div>
                           <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Phone Number</p>
                           <p className="text-sm font-bold text-white">{client.phone}</p>
                        </div>
                        <div>
                           <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Status</p>
                           <span className="px-2 py-1 bg-white/10 rounded text-[10px] font-bold text-white uppercase tracking-widest">{client.status}</span>
                        </div>
                     </div>
                  </div>

                  {/* Event Schedule Module */}
                  <div className="glass-panel p-8 squircle-md border border-white/5 space-y-6">
                     <div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em]">Event Schedule</h3>
                        <button
                           onClick={() => setIsAddEventModalOpen(true)}
                           className="touch-target text-[10px] font-black uppercase tracking-widest text-white bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all flex items-center gap-2"
                        >
                           <Plus className="w-3 h-3" /> Add Event
                        </button>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {!client.events || client.events.length === 0 ? (
                           <p className="text-xs text-zinc-600 font-mono py-6 col-span-full uppercase tracking-[0.2em] text-center">No events scheduled</p>
                        ) : (
                           client.events.map(ev => {
                              const { status: calcStatus, progress: calcProgress } = calculateEventStatusAndProgress(ev);
                              return (
                                 <div key={ev.id} className="bg-black/50 p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-white/20 transition-all flex flex-col">
                                    {/* Dynamic Progress Bar */}
                                    {ev.startTime && ev.endTime && (
                                       <div className="absolute top-0 left-0 h-1 bg-white/5 w-full overflow-hidden">
                                          <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${calcProgress}%` }} />
                                       </div>
                                    )}
                                    <div className={`absolute top-0 right-0 w-1.5 h-full ${calcStatus === 'Completed' ? 'bg-emerald-500' :
                                       calcStatus === 'In Progress' ? 'bg-blue-500' :
                                          calcStatus === 'Cancelled' ? 'bg-red-500' :
                                             'bg-amber-500'
                                       }`} />
                                    <div className="flex justify-between items-start mb-4">
                                       <h4 className="text-sm font-black text-white uppercase tracking-wider">{ev.name}</h4>
                                       <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500 bg-white/5 px-2 py-1 rounded">{calcStatus}</span>
                                    </div>
                                    <div className="space-y-3">
                                       <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium">
                                          <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                                          {new Date(ev.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                       </div>
                                       {(ev.brideLocation || ev.groomLocation || ev.venueLocation) && (
                                          <div className="pt-3 mt-3 border-t border-white/5 space-y-2">
                                             {ev.venueLocation && (
                                                <div className="flex items-start gap-2 text-xs text-zinc-400">
                                                   <MapPin className="w-3 h-3 text-blue-500 shrink-0 mt-0.5" />
                                                   <span className="truncate">{ev.venueLocation}</span>
                                                </div>
                                             )}
                                             {ev.brideLocation && (
                                                <div className="flex items-start gap-2 text-xs text-zinc-400">
                                                   <MapPin className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                                                   <span className="truncate">Bride: {ev.brideLocation}</span>
                                                </div>
                                             )}
                                             {ev.groomLocation && (
                                                <div className="flex items-start gap-2 text-xs text-zinc-400">
                                                   <MapPin className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" />
                                                   <span className="truncate">Groom: {ev.groomLocation}</span>
                                                </div>
                                             )}
                                          </div>
                                       )}
                                    </div>
                                    {isAdmin && (
                                       <div className="flex gap-2 mt-4 pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => { setEditingEvent(ev); setIsEditEventModalOpen(true); }} className="flex-1 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg flex items-center justify-center gap-2 transition-all">
                                             <Edit2 className="w-3 h-3" /> Edit
                                          </button>
                                          {!ev.actualCompletedAt && (
                                             <button onClick={async () => {
                                                const updatedEvents = (client.events || []).map(e => e.id === ev.id ? { ...e, status: 'Completed' as const, actualCompletedAt: new Date().toISOString() } : e);
                                                const updatedClient = { ...client, events: updatedEvents };
                                                await api.saveClient(updatedClient);
                                                setClient(updatedClient);
                                                addToast("Marked Completed");
                                             }} className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest py-2 rounded-lg flex items-center justify-center gap-2 transition-all">
                                                <Check className="w-3 h-3" /> Complete
                                             </button>
                                          )}
                                          <button onClick={() => handleDeleteEvent(ev.id, ev.name)} className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest py-2 rounded-lg flex items-center justify-center gap-2 transition-all">
                                             <Trash2 className="w-3 h-3" /> Delete
                                          </button>
                                       </div>
                                    )}
                                 </div>
                              )
                           })
                        )}
                     </div>
                  </div>


                  <div className="glass-panel p-8 squircle-md border border-white/5">
                     <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] border-b border-white/5 pb-4 mb-4">Recent Network Activity</h3>
                     <div className="space-y-4">
                        {/* Mix Quotes & Invoices latest 3 bounds */}
                        {[...clientQuotes, ...clientInvoices].sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()).slice(0, 3).map(doc => (
                           <div key={doc.id} onClick={() => setPreviewDoc(doc)} className="flex items-center justify-between p-4 bg-black/50 border border-white/5 rounded-2xl cursor-pointer hover:bg-white/5 group border-l-2 !border-l-indigo-500/50">
                              <div className="flex items-center gap-4">
                                 <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center flex-shrink-0">
                                    {doc.type === 'quotation' ? <FileText className="w-4 h-4 text-indigo-400" /> : <IndianRupee className="w-4 h-4 text-indigo-400" />}
                                 </div>
                                 <div>
                                    <p className="text-xs font-black text-white uppercase tracking-widest">{doc.type === 'quotation' ? 'Quote Issued' : 'Invoice Generated'}</p>
                                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">Ref {doc.id} • {doc.createdAt}</p>
                                 </div>
                              </div>
                              <div className="flex items-center gap-4">
                                 <p className="text-sm font-black text-white">₹{(doc.totalAmount || doc.amount || 0).toLocaleString()}</p>
                                 <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-opacity" />
                              </div>
                           </div>
                        ))}
                        {clientQuotes.length === 0 && clientInvoices.length === 0 && (
                           <p className="text-xs text-zinc-600 font-mono text-center py-6 block uppercase tracking-[0.2em]">Zero Historical Markers Found</p>
                        )}
                     </div>
                  </div>
               </div>
            )}

            {/* QUOTES TAB */}
            {activeTab === 'quotes' && (
               <div className="animate-ios-fade-in space-y-4">
                  {clientQuotes.length === 0 ? (
                     <div className="p-16 border border-white/5 border-dashed rounded-3xl flex flex-col items-center text-center bg-white/[0.01]">
                        <FileText className="w-10 h-10 text-zinc-700 mb-4" />
                        <p className="text-xs font-black text-white uppercase tracking-[0.2em] mb-2">No Quotes Drafted</p>
                        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Price breakdown will be calculated here</p>
                     </div>
                  ) : (
                     clientQuotes.map(quote => (
                        <div key={quote.id} onClick={(e) => { const target = e.target as HTMLElement; if (target.closest("[data-action-button]")) return; setPreviewDoc(quote); }} className="p-5 glass-panel border border-white/5 squircle-sm hover:bg-white/5 cursor-pointer flex items-center justify-between group transition-all">
                           <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0">
                                 <FileText className="w-5 h-5 text-zinc-400" />
                              </div>
                              <div>
                                 <p className="text-xs font-black text-white uppercase tracking-[0.2em] mb-1.5">{quote.id}</p>
                                 <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest flex items-center gap-2">
                                    <span>{quote.createdAt || quote.issueDate}</span>
                                    <span>•</span>
                                    <span className="text-indigo-400">{quote.status}</span>
                                 </p>
                              </div>
                           </div>
                           <div className="flex items-center gap-4">
                              <p className="text-lg tracking-tighter font-black text-white flex items-center gap-1">
                                 <span className="text-zinc-600 font-sans text-xs">₹</span>{(quote.totalAmount || quote.amount || 0).toLocaleString()}
                              </p>
                              <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                 <button data-action-button onClick={(e) => { e.stopPropagation(); handleDuplicate(e, quote); }} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 active:scale-90"><Copy className="w-4 h-4" /></button>
                                 <button data-action-button onClick={(e) => { e.stopPropagation(); openModal('quotation', quote); }} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 active:scale-90"><Edit2 className="w-4 h-4" /></button>
                                 <button data-action-button onClick={(e) => { e.stopPropagation(); handleDeleteQuote(quote.id); }} className="p-2 rounded-lg transition active:scale-90 bg-red-500/10 text-red-400 hover:bg-red-500/30 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                              </div>
                           </div>
                        </div>
                     ))
                  )}
               </div>
            )}

            {/* INVOICES TAB */}
            {activeTab === 'invoices' && (
               <div className="animate-ios-fade-in space-y-4">
                  {clientInvoices.length === 0 ? (
                     <div className="p-16 border border-white/5 border-dashed rounded-3xl flex flex-col items-center text-center bg-white/[0.01]">
                        <IndianRupee className="w-10 h-10 text-zinc-700 mb-4" />
                        <p className="text-xs font-black text-white uppercase tracking-[0.2em] mb-2">No Active Invoices</p>
                        <p className="text-[12px] font-bold text-zinc-600 uppercase tracking-widest">Financial claims will trace through this conduit</p>
                     </div>
                  ) : (
                     clientInvoices.map(invoice => {
                        const total = invoice.totalAmount || invoice.amount || 0;
                        const paid = invoice.paidAmount || 0;
                        const remaining = Math.max(total - paid, 0);
                        const isPaid = invoice.status === 'Paid';
                        let markerClass = 'bg-amber-500/50';
                        let badgeClass = 'bg-amber-500/10 text-amber-500';
                        if (isPaid) { markerClass = 'bg-emerald-500/50'; badgeClass = 'bg-emerald-500/10 text-emerald-500'; }
                        else if (invoice.status === 'Partial') { markerClass = 'bg-blue-500/50'; badgeClass = 'bg-blue-500/10 text-blue-500'; }

                        return (
                           <div key={invoice.id} onClick={(e) => { const target = e.target as HTMLElement; if (target.closest("[data-action-button]")) return; setPreviewDoc(invoice); }} className="p-5 glass-panel border border-white/5 squircle-sm hover:bg-white/5 cursor-pointer flex items-center justify-between group transition-all overflow-hidden relative">
                              <div className={`absolute left-0 top-0 bottom-0 w-1 ${markerClass}`} />
                              <div className="flex flex-col md:flex-row md:items-center justify-between w-full pl-3 gap-6">

                                 <div className="flex items-center gap-4">
                                    <div>
                                       <div className="flex items-center gap-3 mb-1.5">
                                          <p className="text-xs font-black text-white uppercase tracking-[0.2em]">{invoice.id}</p>
                                          <span className={`px-2 py-0.5 rounded text-[12px] font-black uppercase tracking-widest ${badgeClass}`}>{invoice.status}</span>
                                       </div>
                                       <p className="text-[12px] font-black text-zinc-600 uppercase tracking-widest">Due: {invoice.dueDate}</p>
                                    </div>
                                 </div>

                                 <div className="flex items-center gap-8 md:gap-16">
                                    <div className="hidden lg:flex flex-col items-end">
                                       <p className="text-[12px] font-black text-zinc-500 uppercase tracking-widest mb-1">Recovered</p>
                                       <p className="text-sm font-bold text-emerald-400 font-mono">₹{paid.toLocaleString()}</p>
                                    </div>
                                    <div className="hidden lg:flex flex-col items-end">
                                       <p className="text-[12px] font-black text-zinc-500 uppercase tracking-widest mb-1">Remaining</p>
                                       <p className="text-sm font-bold text-amber-400 font-mono">₹{remaining.toLocaleString()}</p>
                                    </div>
                                    <div className="flex flex-col items-end relative min-w-[120px]">
                                       <div className="flex items-center gap-2 absolute right-0 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-900 shrink-0 pl-6 drop-shadow-2xl z-10 hidden md:flex">
                                          {!isPaid && (
                                             <button data-action-button onClick={(e) => {
                                                if (clientAgreement?.status !== 'accepted') { e.stopPropagation(); alert("Cannot log payment. Agreement pending or expired."); return; }
                                                markAsPaid(e, invoice);
                                             }} className={`text-[9px] font-black uppercase tracking-widest py-2 px-3 rounded mr-2 transition-all ${clientAgreement?.status !== 'accepted' ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 active:scale-95'}`}>Mark Paid</button>
                                          )}
                                          <button data-action-button onClick={(e) => { e.stopPropagation(); openModal('invoice', invoice); }} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 active:scale-90"><Edit2 className="w-4 h-4" /></button>
                                          <button data-action-button onClick={(e) => {
                                             e.stopPropagation();
                                             if (clientAgreement?.status !== 'accepted') { alert("Cannot download. Agreement pending or expired."); return; }
                                          }} className={`p-2 rounded-lg transition-all ${clientAgreement?.status !== 'accepted' ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-400 hover:text-white hover:bg-white/10 active:scale-90'}`}><Download className="w-4 h-4" /></button>
                                          <button data-action-button onClick={(e) => { e.stopPropagation(); handleDeleteInvoice(invoice.id); }} className="p-2 rounded-lg transition active:scale-90 bg-red-500/10 text-red-400 hover:bg-red-500/30 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                                       </div>
                                       <p className="text-lg tracking-tighter font-black text-white group-hover:opacity-0 transition-opacity md:group-hover:opacity-100! flex items-center gap-1">
                                          <span className="text-zinc-600 font-sans text-xs">₹</span>{total.toLocaleString()}
                                       </p>
                                    </div>
                                 </div>
                              </div>
                           </div>
                        );
                     })
                  )}
               </div>
            )}

            {/* PAYMENTS TAB (History readout) */}
            {activeTab === 'payments' && (
               <div className="animate-ios-fade-in space-y-4">
                  {allPayments.length === 0 ? (
                     <div className="p-16 border border-white/5 border-dashed rounded-3xl flex flex-col items-center text-center bg-white/[0.01]">
                        <CreditCard className="w-10 h-10 text-zinc-700 mb-4" />
                        <p className="text-xs font-black text-white uppercase tracking-[0.2em] mb-2">No Payment Ledgers Found</p>
                        <p className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest">Logged payments will flow sequentially</p>
                     </div>
                  ) : (
                     allPayments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(pay => (
                        <div key={pay.id} className="p-5 glass-panel border border-white/5 squircle-sm flex items-center justify-between hover:bg-white/5 transition-all">
                           <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                 <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                              </div>
                              <div>
                                 <p className="text-xs font-black text-white uppercase tracking-[0.2em] space-x-2"><span>Funds Secured</span> <span className="opacity-30">•</span> <span className="text-zinc-500 font-mono tracking-wider">{pay.id}</span></p>
                                 <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mt-1">Date: {pay.date}</p>
                              </div>
                           </div>
                           <p className="text-lg font-black text-emerald-400 tracking-tighter font-mono">+₹{pay.amount.toLocaleString()}</p>
                        </div>
                     ))
                  )}
               </div>
            )}

            {/* AGREEMENTS TAB */}
            {activeTab === 'agreements' && (
               <div className="animate-ios-fade-in space-y-6">

                  {/* CLIENT AGREEMENT BLOCK */}
                  <div className="glass-panel p-8 squircle-md border border-white/5 relative overflow-hidden bg-white/[0.01]">
                     {clientAgreement?.status === 'expired' && <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />}
                     {clientAgreement?.status === 'accepted' && <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500" />}
                     {(!clientAgreement || clientAgreement.status === 'pending') && <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />}

                     <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div>
                           <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Active Agreement Parameters</h3>
                           <p className="text-[12px] font-black text-zinc-500 uppercase tracking-widest mb-6">Currently Issued Bound To Client Entity</p>
                           <div className="flex flex-wrap items-center gap-4">
                              <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${clientAgreement?.status === 'accepted' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                 clientAgreement?.status === 'expired' ? 'bg-red-500/10 text-red-500 border-red-500/20' :
                                    'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                 }`}>
                                 Status: {clientAgreement?.status || 'No Assignment'}
                              </span>
                              {clientAgreement?.acceptedAt && (
                                 <span className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest">
                                    Accepted: {new Date(clientAgreement.acceptedAt).toLocaleDateString()}
                                 </span>
                              )}
                              {clientAgreement?.expiresAt && (
                                 <span className={`text-[10px] font-bold uppercase tracking-widest ${clientAgreement.status === 'expired' ? 'text-red-400' : 'text-zinc-500'}`}>
                                    Expires: {new Date(clientAgreement.expiresAt).toLocaleDateString()}
                                 </span>
                              )}
                           </div>
                        </div>
                        <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                           {isAdmin && clientAgreement && (
                              <div className="flex items-center gap-2">
                                 <button onClick={handleRevokeAgreement} className="px-6 py-3 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border border-red-500/20 active:scale-95 text-center">Revoke Map</button>
                              </div>
                           )}
                           {!isAdmin && clientAgreement && clientAgreement.status !== 'accepted' && (
                              <div className="flex flex-col items-end gap-3 w-full p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                 <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" className="w-4 h-4 accent-white bg-black/50 border border-white/20 rounded cursor-pointer" checked={isAgreed} onChange={e => setIsAgreed(e.target.checked)} />
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">I Agree to Terms & Conditions</span>
                                 </label>
                                 <button onClick={handleAcceptAgreement} disabled={!isAgreed} className="px-6 py-3 w-full bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl shadow-xl hover:bg-zinc-200 transition-all active:scale-95 disabled:opacity-50">Accept & Continue</button>
                              </div>
                           )}
                        </div>
                     </div>

                     {/* Render read-only text if assigned */}
                     {clientAgreement ? (
                        <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                           <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Assigned Contract (V{clientAgreement.version})</h4>
                           <div className="p-6 bg-black/30 rounded-2xl text-sm font-mono text-zinc-400 whitespace-pre-wrap border border-white/5">
                              {clientAgreement.termsText}
                           </div>
                        </div>
                     ) : (
                        <div className="mt-8 text-center text-xs font-mono text-zinc-500 border border-white/5 border-dashed p-6 rounded-2xl">
                           NO AGREEMENT HAS BEEN ASSIGNED YET.
                        </div>
                     )}
                  </div>

                  {/* MASTER TEMPLATES (ADMIN ONLY) */}
                  {isAdmin && (
                     <div className="glass-panel p-8 squircle-md border border-white/5 bg-white/[0.01]">
                        <div className="flex items-center justify-between mb-8">
                           <div>
                              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-1">Global Templates List</h3>
                              <p className="text-[12px] font-black text-zinc-500 uppercase tracking-widest">Available map options to assign</p>
                           </div>
                           <button onClick={handleAddNewTemplate} className="px-6 py-3 bg-white/5 text-zinc-300 hover:text-white hover:bg-white/10 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95 text-center shadow">+ New Template</button>
                        </div>

                        {editingTemplateId && (
                           <div className="mb-8 p-6 bg-black/50 border border-indigo-500/20 rounded-2xl animate-ios-slide-up">
                              <h4 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Editing Logic Sequence</h4>
                              <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold text-white focus:outline-none focus:border-white/20 mb-3 font-mono uppercase" placeholder="TEMPLATE TITLE" value={termsEditTitle} onChange={e => setTermsEditTitle(e.target.value)} />
                              <textarea className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm font-bold text-white focus:outline-none focus:border-white/20 min-h-[150px] mb-4" value={termsEditText} onChange={e => setTermsEditText(e.target.value)} />
                              <div className="flex justify-end gap-3">
                                 <button onClick={() => setEditingTemplateId(null)} className="px-6 py-3 bg-white/5 text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all">Discard</button>
                                 <button onClick={handleSaveTermsVersion} className="px-6 py-3 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-xl hover:bg-indigo-600">Save Sequence</button>
                              </div>
                           </div>
                        )}

                        <div className="space-y-3">
                           {agreementTemplates.map(temp => {
                              const isAssigned = clientAgreement?.title === temp.title || (client?.activeAgreement?.templateId === temp.id && client?.activeAgreement?.status !== 'revoked');

                              return (
                                 <div key={temp.id} className={`p-4 bg-black/30 border shrink-0 rounded-2xl flex flex-col md:flex-row md:items-center justify-between group hover:bg-white/5 transition-all ${isAssigned ? 'border-emerald-500/40 border-l-4 border-l-emerald-500' : 'border-white/5'}`}>
                                    <div className="mb-4 md:mb-0">
                                       <div className="flex items-center gap-3">
                                          <p className="text-sm font-black text-white uppercase tracking-widest mb-1">{temp.title}</p>
                                          {isAssigned && <span className="bg-emerald-500 text-black text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">Assigned</span>}
                                       </div>
                                       <p className="text-[12px] font-bold text-zinc-500 uppercase tracking-widest font-mono">v{temp.version} • Text Block Length: {temp.body?.length || 0} chars</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                       <button
                                          onMouseDown={(e) => { e.preventDefault(); handleAssignToClient(temp); }}
                                          className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 shadow border ${isAssigned
                                             ? 'bg-emerald-500 text-black border-emerald-500'
                                             : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 border-emerald-500/20'
                                             }`}
                                       >
                                          {isAssigned ? 'Assigned ✓' : 'Assign to Client'}
                                       </button>
                                       <button onMouseDown={(e) => { e.preventDefault(); handleEditTemplate(temp.id, temp.title, temp.body); }} className="p-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
                                       <button onMouseDown={(e) => { e.preventDefault(); handleDeleteTemplate(temp.id); }} className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded-lg transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                 </div>
                              );
                           })}
                        </div>
                     </div>
                  )}

                  {/* ID UPLOAD */}
                  <div className="glass-panel p-8 squircle-md border border-white/5 bg-white/[0.01]">
                     <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Legal Identity Proof</h3>
                     <p className="text-[12px] font-black text-zinc-500 uppercase tracking-widest mb-6">Requires matching government ID. One file limit.</p>

                     <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex-1">
                           {idDocument ? (
                              <div className="flex items-center gap-4 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
                                 <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                 </div>
                                 <div>
                                    <p className="text-xs font-black text-white tracking-wider">{idDocument.fileName}</p>
                                    <p className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-widest mt-1">Verified Document</p>
                                 </div>
                              </div>
                           ) : (
                              <div className="p-6 border border-white/5 border-dashed rounded-2xl text-center bg-black/50">
                                 <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">No Identity Document Present</p>
                              </div>
                           )}
                        </div>

                        <div className="flex flex-col gap-3 min-w-[200px]">
                           {!isAdmin && (
                              <label className="px-6 py-3 bg-white/5 text-white hover:bg-white/10 border border-white/5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer text-center active:scale-95">
                                 Upload ID Proof
                                 <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleUploadIdProof} />
                              </label>
                           )}
                           {idDocument && (
                              <button onClick={() => window.open(idDocument.fileUrl)} className="px-6 py-3 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all text-center">View Artifact</button>
                           )}
                        </div>
                     </div>
                  </div>
               </div>
            )}

            {/* TEAM TAB */}
            {activeTab === 'team' && (
               <div className="animate-ios-fade-in space-y-8 relative z-[100]">
                  <div className="glass-panel p-8 squircle-md border border-white/5 space-y-6">
                     <div className="flex justify-between items-center bg-black/20 p-4 border border-white/5 rounded-2xl mb-4">
                        <div>
                           <h3 className="text-base font-bold text-white uppercase tracking-tight flex items-center gap-2">
                              <Users className="w-4 h-4 text-emerald-500" /> Team Assignment
                           </h3>
                           <p className="text-sm font-medium text-zinc-400 uppercase tracking-wide mt-1">Assign and manage operational staff for this client</p>
                        </div>
                        <button
                           onClick={handleAddCategory}
                           className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-semibold text-white hover:bg-white/10 transition-all active:scale-95"
                        >
                           <Plus size={16} /> Add Category
                        </button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {teamCategories.map(category => {
                           const role = category.name.toLowerCase();
                           const RoleIcon = role.includes('photo') ? Camera : role.includes('video') ? Video : role.includes('edit') ? Edit3 : Users;

                           return (
                              <div key={category.id} className="p-5 bg-white/2 border border-white/5 rounded-2xl space-y-5 hover:border-white/10 transition-all shadow-xl relative group/cat">
                                 <div className="flex justify-between items-center border-b border-white/5 pb-3">
                                    <div className="flex items-center gap-3">
                                       <p className="text-sm font-semibold uppercase text-zinc-300 tracking-wide flex items-center gap-2">
                                          <RoleIcon className="w-4 h-4 text-zinc-400" /> {category.name} Manifest
                                       </p>
                                       <div className="flex gap-1 opacity-0 group-hover/cat:opacity-100 transition-opacity">
                                          <button onClick={() => handleEditCategory(category.id)} className="p-1.5 text-zinc-500 hover:text-white transition-colors"><Edit2 size={12} /></button>
                                          <button onClick={() => handleDeleteCategory(category.id)} className="p-1.5 text-zinc-500 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                                       </div>
                                    </div>
                                    <button
                                       type="button"
                                       onMouseDown={(e) => { e.preventDefault(); addMemberRow(category.id); }}
                                       className="w-8 h-8 rounded-full bg-white/5 border border-white/5 flex items-center justify-center text-zinc-500 hover:text-white hover:bg-white/10 transition-all active:scale-95"
                                       title={`Add Member to ${category.name}`}
                                    >
                                       <Plus size={14} />
                                    </button>
                                 </div>

                                 <div className="space-y-5">
                                    {category.members.map((rowVal, idx) => (
                                       <div key={idx} className="flex flex-col gap-4 p-5 bg-black/20 rounded-xl border border-white/5 shadow-inner group/row">
                                          <div className="w-full">
                                             <SmartRoleDropdown
                                                role={category.name}
                                                allStaff={allStaff}
                                                selectedId={rowVal?.memberId || ''}
                                                onChange={val => handleMemberChange(category.id, idx, val)}
                                                onAddNew={() => {
                                                   setEditingStaffId(null);
                                                   setPendingDropdownAssign({ role: category.id, idx });
                                                   setNewStaffForm({ name: '', role: category.name, contact: '' });
                                                   setIsAddStaffModalOpen(true);
                                                }}
                                                onDelete={handleDeleteStaff}
                                                onEdit={handleEditStaff}
                                                onAddMember={handleAddArtisanMember}
                                             />
                                          </div>

                                          <div className="space-y-4">
                                             <p className="text-sm font-semibold uppercase text-zinc-300 tracking-wide px-1">
                                                Assigned Events
                                             </p>
                                             <div className="flex flex-wrap gap-3">
                                                {(rowVal.assigned_events || []).map((eventId, eIdx) => {
                                                   const assignedEv = client?.events?.find(e => e.id === eventId);
                                                   return (
                                                      <div key={eIdx} className={`relative flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full group/chip hover:border-white/20 transition-all shadow-sm`}>
                                                         <Calendar className="w-3 h-3 text-zinc-500" />
                                                         <span className="text-sm font-medium text-zinc-200 uppercase tracking-widest whitespace-nowrap">
                                                            {assignedEv ? `${assignedEv.name} (${new Date(assignedEv.date).toLocaleDateString()})` : 'Unknown Event'}
                                                         </span>
                                                         <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); handleRemoveEvent(category.id, idx, eIdx); }}
                                                            className="relative z-10 ml-2 flex items-center justify-center w-6 h-6 rounded-full text-zinc-400 hover:text-red-400 hover:bg-red-500/20 transition duration-200 active:scale-90"
                                                         >
                                                            <X size={14} />
                                                         </button>
                                                      </div>
                                                   )
                                                })}
                                                <select
                                                   className="flex items-center gap-2 px-4 py-2 bg-black/50 border border-white/5 border-dashed rounded-lg cursor-pointer hover:bg-white/10 hover:border-white/20 transition-all text-sm font-medium text-zinc-300 uppercase tracking-widest outline-none appearance-none"
                                                   onChange={(e) => {
                                                      if (e.target.value) {
                                                         handleAddEventToMember(category.id, idx, e.target.value);
                                                         e.target.value = '';
                                                      }
                                                   }}
                                                   value=""
                                                >
                                                   <option value="" disabled>+ Assign Event</option>
                                                   {client?.events?.map(ev => (
                                                      <option key={ev.id} value={ev.id}>{ev.name} ({new Date(ev.date).toLocaleDateString()})</option>
                                                   ))}
                                                </select>
                                             </div>

                                             {category.members.length > 1 && (
                                                <button
                                                   type="button"
                                                   onClick={() => removeMemberRow(category.id, idx)}
                                                   className="w-full py-2.5 bg-red-500/5 text-red-500/60 text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-red-500/10 hover:text-red-500 transition-all border border-red-500/5 flex items-center justify-center gap-2"
                                                   title="Remove Assignment Segment"
                                                >
                                                   <Trash2 size={12} /> Remove Member Segment
                                                </button>
                                             )}
                                          </div>

                                       </div>
                                    ))}
                                 </div>
                              </div>
                           );
                        })}
                     </div>
                  </div>
               </div>
            )}

            {/* WORKFLOW & PROGRESS SECTION */}
            <div className="glass-panel p-8 squircle-md border border-white/5 space-y-8 bg-white/[0.01]">
               <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <div>
                     <h3 className="text-xl font-black text-white uppercase tracking-tighter">Workflow & Progress</h3>
                     <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Real-time operational velocity tracker</p>
                  </div>
                  {project && (
                     <div className="flex items-center gap-3">
                        {(() => {
                           const eventDate = new Date(project.date).getTime();
                           const now = new Date().getTime();
                           const thirtyDays = 30 * 24 * 60 * 60 * 1000;
                           const isOverdue = (now - eventDate > thirtyDays) && project.stage !== 'delivery';
                           return isOverdue && (
                              <span className="text-[8px] bg-red-500/10 text-red-500 px-2 py-1 rounded border border-red-500/20 font-black uppercase tracking-widest animate-pulse">Delayed</span>
                           );
                        })()}
                        <div className="flex flex-col items-end">
                           <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Operational Status</span>
                           <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mt-1 ${project.stage === 'delivery' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                              project.stage === 'booked' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                                 'bg-amber-500/10 text-amber-500 border border-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                              }`}>
                              {project.stage === 'delivery' ? 'Completed' : project.stage === 'booked' ? 'Pending' : 'In Progress'}
                           </span>
                        </div>
                     </div>
                  )}
               </div>

               {!project ? (
                  <div className="py-12 border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center text-center">
                     <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-4">
                        <AlertTriangle className="w-6 h-6 text-zinc-600" />
                     </div>
                     <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">No corresponding project vector localized</p>
                     <button onClick={() => navigate(`/create-project/${id}`)} className="mt-4 px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/5 text-[9px] font-black text-white uppercase tracking-widest rounded-xl transition-all">Initialize Project</button>
                  </div>
               ) : (
                  <>
                     <div className="space-y-10">
                        {/* Large Progress Bar */}
                        <div className="space-y-4">
                           <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                              <div>
                                 <span className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] block mb-1">Active Stage</span>
                                 <span className="text-2xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
                                    {normalizeWorkflowStage(project.stage)}
                                    <span className="text-zinc-700">/</span>
                                    <span className="text-sm text-zinc-500 opacity-50">100% Target</span>
                                 </span>
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                 <div className="flex items-center gap-4">
                                    <div className="text-right">
                                       <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Triggered By</span>
                                       <span className="text-xs font-bold text-white">{project.workflowTrigger?.event || 'System Initialization'}</span>
                                    </div>
                                    <div className="w-px h-8 bg-white/10 mx-2"></div>
                                    <div className="text-left">
                                       <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Last Updated</span>
                                       <span className="text-xs font-bold text-white">
                                          {project.workflowTrigger?.timestamp ? new Date(project.workflowTrigger.timestamp).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : new Date(project.createdAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}
                                       </span>
                                    </div>
                                 </div>
                                 <div className="flex items-center gap-2 mt-2">
                                    {normalizeWorkflowStage(project.stage) !== 'Shoot Completed' && normalizeWorkflowStage(project.stage) !== 'Delivered' && normalizeWorkflowStage(project.stage) !== 'Selection Received' && normalizeWorkflowStage(project.stage) !== 'Editing' && normalizeWorkflowStage(project.stage) !== 'Delivery Ready' && (
                                       <button
                                          onClick={async () => {
                                             await advanceProjectWorkflow(project.id, 'Shoot Completed', 'Admin Marked Shoot Completed');
                                             const updatedProjects = JSON.parse(localStorage.getItem('projects') || '[]');
                                             setProject(updatedProjects.find((p: any) => p.id === project.id) || project);
                                          }}
                                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest text-white rounded-lg transition-colors border border-white/5"
                                       >
                                          Mark Shoot Completed
                                       </button>
                                    )}
                                    {normalizeWorkflowStage(project.stage) === 'Shoot Completed' && (
                                       <button
                                          onClick={async () => {
                                             await advanceProjectWorkflow(project.id, 'Selection Received', 'Selections Received');
                                             const updatedProjects = JSON.parse(localStorage.getItem('projects') || '[]');
                                             setProject(updatedProjects.find((p: any) => p.id === project.id) || project);
                                          }}
                                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest text-white rounded-lg transition-colors border border-white/5"
                                       >
                                          Selections Received
                                       </button>
                                    )}
                                    {normalizeWorkflowStage(project.stage) === 'Editing' && (
                                       <button
                                          onClick={async () => {
                                             await advanceProjectWorkflow(project.id, 'Delivery Ready', 'Final deliverables uploaded');
                                             const updatedProjects = JSON.parse(localStorage.getItem('projects') || '[]');
                                             setProject(updatedProjects.find((p: any) => p.id === project.id) || project);
                                          }}
                                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest text-white rounded-lg transition-colors border border-white/5"
                                       >
                                          Delivery Ready
                                       </button>
                                    )}
                                    {normalizeWorkflowStage(project.stage) === 'Delivery Ready' && (
                                       <button
                                          onClick={async () => {
                                             const balance = project.financials?.balance ?? 0;
                                             if (balance > 0) {
                                                alert('Cannot mark as Delivered: Outstanding balance is ₹' + balance.toLocaleString('en-IN'));
                                                return;
                                             }
                                             await advanceProjectWorkflow(project.id, 'Delivered', 'Admin Marked Project Delivered');
                                             const updatedProjects = JSON.parse(localStorage.getItem('projects') || '[]');
                                             setProject(updatedProjects.find((p: any) => p.id === project.id) || project);
                                          }}
                                          className="px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-[9px] font-black uppercase tracking-widest text-emerald-400 rounded-lg transition-colors border border-emerald-500/30"
                                       >
                                          Mark Delivered
                                       </button>
                                    )}
                                    <button
                                       onClick={() => setShowEmergencyOverride(!showEmergencyOverride)}
                                       className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-[9px] font-black uppercase tracking-widest text-red-500 rounded-lg transition-colors"
                                    >
                                       Emergency Override
                                    </button>
                                 </div>

                                 {showEmergencyOverride && (
                                    <div className="mt-2 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 animate-ios-fade-in">
                                       <AlertTriangle className="w-4 h-4 text-red-500" />
                                       <select
                                          value={normalizeWorkflowStage(project.stage)}
                                          onChange={async (e) => {
                                             if (confirm('Are you sure you want to force this workflow stage? This should only be used for corrections.')) {
                                                const newStage = e.target.value as ProjectStage;
                                                await emergencyOverrideWorkflow(project.id, newStage);
                                                const updatedProjects = JSON.parse(localStorage.getItem('projects') || '[]');
                                                setProject(updatedProjects.find((p: any) => p.id === project.id) || project);
                                                setShowEmergencyOverride(false);
                                             }
                                          }}
                                          className="bg-black/50 border border-red-500/20 rounded-lg px-3 py-1.5 text-xs font-bold text-red-400 outline-none cursor-pointer hover:bg-black/80 transition-all"
                                       >
                                          {WORKFLOW_STAGES.map(stage => (
                                             <option key={stage} value={stage}>{stage}</option>
                                          ))}
                                       </select>
                                    </div>
                                 )}
                              </div>
                           </div>

                           <div className="h-4 w-full bg-black/50 border border-white/5 rounded-full overflow-hidden p-1 relative group">
                              <div
                                 className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                                 style={{ width: `${getWorkflowProgress(project.stage)}%` }}
                              >
                                 <div className="w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-stripe_1s_linear_infinite]" />
                              </div>
                           </div>
                           <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-500 tracking-widest mt-2 px-1">
                              <span>Initiated</span>
                              <span>{getWorkflowProgress(project.stage)}% Complete</span>
                           </div>
                        </div>

                        {/* STAGE STEPPER */}
                        <div className="flex flex-wrap gap-2 items-center justify-between bg-black/20 p-6 rounded-3xl border border-white/5">
                           {WORKFLOW_STAGES.map((stage, idx) => {
                              const currentStage = normalizeWorkflowStage(project.stage);
                              const currentIdx = WORKFLOW_STAGES.indexOf(currentStage as any);
                              const isCompleted = idx < currentIdx;
                              const isActive = idx === currentIdx;

                              return (
                                 <div
                                    key={stage}
                                    className={`flex flex-col items-center gap-2 flex-1 min-w-[60px] ${isActive ? 'opacity-100 scale-110 transition-transform' : isCompleted ? 'opacity-70' : 'opacity-30'}`}
                                 >
                                    <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center border-2 ${isActive ? 'border-emerald-500 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : isCompleted ? 'border-emerald-500 bg-emerald-500' : 'border-white/10 bg-black'}`}>
                                       {isCompleted && <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-black" strokeWidth={3} />}
                                       {isActive && <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-emerald-500" />}
                                    </div>
                                    <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-tight text-center ${isActive ? 'text-emerald-500' : 'text-white'}`}>
                                       {stage.split(' ').join('\n')}
                                    </span>
                                 </div>
                              );
                           })}
                        </div>

                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                           <div className="p-5 bg-black/20 border border-white/5 rounded-2xl space-y-2">
                              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Financial Clearance</p>
                              <div className="space-y-1">
                                 <p className="text-sm font-black text-white font-mono">₹{clientInvoices.reduce((a, c) => a + (c.paidAmount || 0), 0).toLocaleString()} <span className="text-zinc-600 text-[10px] font-sans">/</span> ₹{clientInvoices.reduce((a, c) => a + (c.totalAmount || 0), 0).toLocaleString()}</p>
                                 <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden mt-2">
                                    <div
                                       className="h-full bg-emerald-500"
                                       style={{ width: `${Math.min(100, (clientInvoices.reduce((a, c) => a + (c.paidAmount || 0), 0) / (clientInvoices.reduce((a, c) => a + (c.totalAmount || 0), 0) || 1)) * 100)}%` }}
                                    />
                                 </div>
                              </div>
                           </div>

                           <div className="p-5 bg-black/20 border border-white/5 rounded-2xl space-y-2">
                              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Schedule Vector</p>
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/10">
                                    <Calendar className="w-4 h-4 text-blue-500" />
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-wider">{project.date ? new Date(project.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Pending assignment'}</p>
                                    <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Deployment Date</p>
                                 </div>
                              </div>
                           </div>

                           <div className="p-5 bg-black/20 border border-white/5 rounded-2xl space-y-2">
                              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Data Stewardship</p>
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/10">
                                    <Search className="w-4 h-4 text-indigo-500" />
                                 </div>
                                 <div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-wider">{project.images?.length || 0} Artifacts</p>
                                    <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">Registry Volume</p>
                                 </div>
                              </div>
                           </div>

                        </div>
                     </div>

                     {/* Footer Info */}
                     <div className="flex flex-col md:flex-row justify-between items-center text-[8px] font-black text-zinc-700 uppercase tracking-[0.3em] pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2">
                           <Clock className="w-3 h-3" />
                           <span>System Latency: 12ms</span>
                           <span className="opacity-20 ml-4">•</span>
                           <span>Project ID: {project?.id}</span>
                           <span className="opacity-20 ml-4">•</span>
                           <span>Last Updated: {project?.createdAt ? new Date(project.createdAt).toLocaleDateString() : ''}</span>
                        </div>
                        <div className="mt-2 md:mt-0">
                           Synced via APCO Global Operations Registry
                        </div>
                     </div>
                  </>
               )}
            </div>
         </div>



         {/* -------------------- UNIFIED FINANCIAL BUILDER MODAL -------------------- */}
         {isModalOpen && createPortal(
            <div
               className="fixed inset-0 bg-black/90 md:bg-black/70 z-[9999] flex items-center justify-center p-0 md:p-4 pt-safe md:pt-4 backdrop-blur-md md:backdrop-blur-sm animate-ios-fade-in"
               onClick={() => setIsModalOpen(false)}
            >
               <div
                  className="w-full h-full md:h-auto md:max-w-4xl max-h-none md:max-h-[90vh] overflow-y-auto bg-zinc-950 md:bg-zinc-900 border border-white/10 rounded-none md:rounded-2xl p-6 md:p-10 shadow-2xl relative animate-ios-slide-up no-scrollbar pb-safe md:pb-10"
                  onClick={(e) => e.stopPropagation()}
               >
                  <button onClick={() => setIsModalOpen(false)} className="touch-target absolute top-4 md:top-6 right-4 md:right-6 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                     <X className="w-5 h-5 text-zinc-400 hover:text-white" />
                  </button>

                  <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Financial Bounds Builder</h2>
                  <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-10 overflow-hidden text-ellipsis whitespace-nowrap opacity-60">Architect: {client?.name}</p>

                  {successMsg ? (
                     <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-ios-fade-in">
                        <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center">
                           <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        </div>
                        <p className="text-lg font-black text-white uppercase tracking-widest text-center mt-4">{successMsg}</p>
                     </div>
                  ) : (
                     <form onSubmit={handleCreateDocument} className="space-y-8 animate-ios-fade-in">
                        {/* 1. HEADER SECTION */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 glass-panel border border-white/5 squircle-sm">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Structure Type</label>
                              <div className="flex bg-black border border-white/10 squircle-sm p-1">
                                 <button type="button" onClick={() => { setModalType('quotation'); setAutoGeneratedId(generateAutoId('quotation', selectedCompanyIdForDoc)); }} className={`touch-target flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${modalType === 'quotation' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>Quotation</button>
                                 <button type="button" onClick={() => { setModalType('invoice'); setAutoGeneratedId(generateAutoId('invoice', selectedCompanyIdForDoc)); }} className={`touch-target flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${modalType === 'invoice' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>Invoice</button>
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Issuing Brand (Company)</label>
                              <select
                                 className="w-full bg-black border border-white/10 squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none appearance-none cursor-pointer"
                                 value={selectedCompanyIdForDoc}
                                 onChange={(e) => {
                                    const cid = e.target.value;
                                    setSelectedCompanyIdForDoc(cid);
                                    const comp = companies.find(c => c.id === cid);
                                    if (comp) {
                                       setFormCompanyLogoUrl(comp.logo || '');
                                       setFormPaymentTerms(comp.paymentTerms || 'Due on Receipt');
                                       setFormNotes(comp.invoiceNotes || '');
                                       setAutoGeneratedId(generateAutoId(modalType, cid));
                                    }
                                 }}
                              >
                                 {companies.map(c => (
                                    <option key={c.id} value={c.id}>{c.companyName}</option>
                                 ))}
                              </select>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Auto-Generated ID</label>
                              <input disabled className="w-full bg-black/50 border border-white/10 squircle-sm p-4 text-sm font-bold text-zinc-500 cursor-not-allowed outline-none font-mono" value={autoGeneratedId} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Effective Timestamp</label>
                              <input required type="date" className="w-full bg-black border border-white/10 squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} disabled={isSubmitting} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Payment Terms</label>
                              <input type="text" placeholder="e.g. Due on Receipt, Net 30" className="w-full bg-black border border-white/10 squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none" value={formPaymentTerms} onChange={e => setFormPaymentTerms(e.target.value)} disabled={isSubmitting} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Custom Brand Logo URL (Override)</label>
                              <input type="url" placeholder="https://..." className="w-full bg-black border border-white/10 squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none" value={formCompanyLogoUrl} onChange={e => setFormCompanyLogoUrl(e.target.value)} disabled={isSubmitting} />
                           </div>
                        </div>

                        {/* 2. CLIENT INFO */}
                        <div className="grid grid-cols-1 gap-6 p-6 glass-panel border border-white/5 squircle-sm bg-white/[0.01]">
                           <div className="space-y-2 flex flex-col">
                              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1 mb-1">Bill To (Auto-filled)</label>
                              <div className="w-full h-full bg-black/50 border border-white/10 squircle-sm p-4 text-sm font-bold text-zinc-400 opacity-70">
                                 <span className="text-white text-base">{client?.name}</span> <br />
                                 <span className="text-xs font-mono mt-1 block">{client?.email || 'N/A'}</span>
                                 <span className="text-xs font-mono block">{client?.phone || 'N/A'}</span>
                              </div>
                           </div>
                        </div>

                        {/* 3. UNIFIED SERVICE BUILDER */}
                        <div className="space-y-6">
                           <h3 className="text-sm font-black uppercase text-white tracking-[0.2em] border-b border-white/5 pb-4">Operational Vector Composition</h3>

                           <div className="glass-panel bg-white/[0.01] border border-white/5 rounded-3xl flex flex-col shadow-2xl overflow-visible">
                              {/* Header with Dropdown and Add Button */}
                              <div className="flex justify-between items-center px-6 py-5 bg-white/[0.02] border-b border-white/5 relative">
                                 <div className="flex items-center gap-4">
                                    <select
                                       className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-[10px] font-black text-white uppercase tracking-widest outline-none focus:border-white/20 transition-all cursor-pointer appearance-none min-w-[180px]"
                                       value={builderCategory}
                                       onChange={(e) => setBuilderCategory(e.target.value as any)}
                                    >
                                       <option value="physical">Physical Deliverables</option>
                                       <option value="digital">Digital Deliverables</option>
                                       <option value="team">Team / Personnel</option>
                                    </select>
                                    <div className="w-px h-4 bg-white/10 mx-1" />
                                    <div className="flex items-center gap-2 opacity-50">
                                       {builderCategory === 'physical' && <Package size={14} className="text-emerald-500" />}
                                       {builderCategory === 'digital' && <Video size={14} className="text-blue-500" />}
                                       {builderCategory === 'team' && <Users size={14} className="text-indigo-500" />}
                                       <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                          {builderCategory === 'physical' && 'Physical Assets'}
                                          {builderCategory === 'digital' && 'Digital Media'}
                                          {builderCategory === 'team' && 'Personnel Registry'}
                                       </span>
                                    </div>
                                 </div>
                                 <button
                                    type="button"
                                    onClick={() => addItemToCategory(builderCategory)}
                                    className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-xl shadow-white/5"
                                 >
                                    <Plus size={18} />
                                 </button>
                              </div>

                              {/* Smart Search Input */}
                              <div className="px-6 py-4 bg-white/[0.01] border-b border-white/5 relative" ref={searchRef}>
                                 <div className="relative group">
                                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-white transition-colors">
                                       <Search size={14} />
                                    </div>
                                    <input
                                       type="text"
                                       placeholder="Search or add items, videos, or team..."
                                       className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 pl-11 pr-4 text-sm font-bold text-white outline-none focus:border-white/10 focus:bg-black/60 transition-all placeholder:text-zinc-700"
                                       value={searchQuery}
                                       onChange={(e) => handleSearchChange(e.target.value)}
                                       onKeyDown={(e) => {
                                          if (e.key === 'Enter') handleAddFromSearch();
                                       }}
                                       onFocus={() => {
                                          if (searchQuery) setShowSuggestions(true);
                                       }}
                                    />
                                    {showSuggestions && (
                                       <div
                                          className="absolute left-0 right-0 top-[calc(100%+8px)] bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl z-[10000] overflow-hidden animate-ios-slide-up"
                                       >
                                          <div className="max-h-[350px] overflow-y-auto no-scrollbar py-2">
                                             {isAddingNewInSearch ? (
                                                <div className="p-5 space-y-4 animate-ios-slide-up">
                                                   <div className="flex items-center justify-between">
                                                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest px-1">Initialize Personnel</p>
                                                      <button onClick={() => setIsAddingNewInSearch(false)} className="text-zinc-500 hover:text-white transition-colors"><X size={14} /></button>
                                                   </div>
                                                   <div className="space-y-3">
                                                      <div className="space-y-1">
                                                         <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-1">Expert Name</label>
                                                         <input
                                                            autoFocus
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] font-bold text-white outline-none focus:border-indigo-500/50 transition-all"
                                                            value={searchQuery}
                                                            onChange={e => setSearchQuery(e.target.value)}
                                                         />
                                                      </div>
                                                      <div className="space-y-1">
                                                         <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-1">Functional Class</label>
                                                         <select
                                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] font-bold text-white outline-none focus:border-indigo-500/50 transition-all appearance-none"
                                                            value={newMemberRoleInSearch}
                                                            onChange={e => setNewMemberRoleInSearch(e.target.value)}
                                                         >
                                                            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                                         </select>
                                                      </div>
                                                      <div className="flex gap-3">
                                                         <div className="space-y-1 flex-1">
                                                            <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-1">Phone (Optional)</label>
                                                            <input
                                                               className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] font-bold text-white outline-none focus:border-indigo-500/50 transition-all"
                                                               value={newMemberPhoneInSearch}
                                                               onChange={e => setNewMemberPhoneInSearch(e.target.value)}
                                                               placeholder="e.g. +91 9876543210"
                                                            />
                                                         </div>
                                                         <div className="space-y-1 flex-1">
                                                            <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-1">Email (Optional)</label>
                                                            <input
                                                               className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-[11px] font-bold text-white outline-none focus:border-indigo-500/50 transition-all"
                                                               value={newMemberEmailInSearch}
                                                               onChange={e => setNewMemberEmailInSearch(e.target.value)}
                                                               placeholder="name@example.com"
                                                            />
                                                         </div>
                                                      </div>
                                                      <div className="space-y-1">
                                                         <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-1">Cost / Rate (Optional)</label>
                                                         <div className="relative">
                                                            <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={12} />
                                                            <input
                                                               type="number"
                                                               className="w-full bg-white/5 border border-white/10 rounded-xl p-3 pl-8 text-[11px] font-bold text-white outline-none focus:border-indigo-500/50 transition-all"
                                                               value={newMemberRateInSearch}
                                                               onChange={e => setNewMemberRateInSearch(e.target.value)}
                                                               placeholder="0"
                                                            />
                                                         </div>
                                                      </div>
                                                   </div>
                                                   <button
                                                      type="button"
                                                      onClick={() => {
                                                         const newId = `team_${Date.now()}`;
                                                         const newPerson = {
                                                            id: newId,
                                                            name: searchQuery,
                                                            role: newMemberRoleInSearch,
                                                            phone: newMemberPhoneInSearch,
                                                            email: newMemberEmailInSearch,
                                                            cost: Number(newMemberRateInSearch) || 0,
                                                            status: 'Active' as const
                                                         };
                                                         savePersonnelRegistry([...personnelRegistry, newPerson]);
                                                         setCategorizedItems(prev => ({ ...prev, team: [...prev.team, { id: newId, name: searchQuery, role: newMemberRoleInSearch, cost: Number(newMemberRateInSearch) || 0 }] }));
                                                         setSearchQuery("");
                                                         setNewMemberPhoneInSearch("");
                                                         setNewMemberEmailInSearch("");
                                                         setNewMemberRateInSearch("");
                                                         setShowSuggestions(false);
                                                         setIsAddingNewInSearch(false);
                                                         addToast("Personnel added to registry and assigned");
                                                      }}
                                                      className="w-full py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-[0.98] shadow-xl shadow-white/10"
                                                   >
                                                      Add & Assign to Project
                                                   </button>
                                                </div>
                                             ) : (
                                                <>
                                                   {Object.entries(SUGGESTIONS).map(([category, items]) => {
                                                      const isTeam = category === 'team';
                                                      const sourceList = isTeam ? personnelRegistry : items;
                                                      const filtered = sourceList.filter((it: any) => it.name.toLowerCase().includes(searchQuery.toLowerCase()));
                                                      if (filtered.length === 0) return null;
                                                      return (
                                                         <div key={category} className="px-2 pb-6">
                                                            <div className="px-3 py-3 flex items-center justify-between opacity-50 border-b border-white/5 mb-2">
                                                               <div className="flex items-center gap-2">
                                                                  {category === 'physical' && <Package size={14} />}
                                                                  {category === 'digital' && <Video size={14} />}
                                                                  {category === 'team' && <Users size={14} />}
                                                                  <span className="text-[11px] font-black uppercase tracking-widest">{category}</span>
                                                               </div>
                                                               {isTeam && <span className="text-[9px] font-black tracking-widest uppercase">Manage Registry</span>}
                                                            </div>
                                                            {filtered.map((it: any, idx: number) => {
                                                               const isSelected = categorizedItems[category as 'physical' | 'digital' | 'team'].some(existing => existing.name === it.name);
                                                               return (
                                                                  <div key={it.id || idx} className="relative group/item">
                                                                     <button
                                                                        type="button"
                                                                        onMouseDown={(e) => { e.preventDefault(); addSelectedSuggestion(it, category as any); }}
                                                                        className={`w-full flex items-center justify-between px-4 py-4 rounded-xl transition-all text-left ${isSelected ? 'bg-indigo-500/10 border border-indigo-500/20' : 'hover:bg-white/5 border border-transparent'}`}
                                                                     >
                                                                        <div className="flex items-center gap-3">
                                                                           {isSelected ? <Check size={18} className="text-indigo-400" /> : <div className="w-4 h-4 rounded-full border border-white/20 group-hover/item:border-white/50" />}
                                                                           <span className={`text-[15px] font-bold transition-colors ${isSelected ? 'text-indigo-400' : 'text-zinc-300 group-hover/item:text-white'}`}>{it.name}</span>
                                                                        </div>
                                                                        <span className={`text-[11px] font-black font-mono px-3 py-1.5 rounded-md ${isSelected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-emerald-500'}`}>
                                                                           {isSelected ? 'ASSIGNED' : ((it as any).price ? `₹${(it as any).price.toLocaleString()}` : (it as any).role.toUpperCase())}
                                                                        </span>
                                                                     </button>
                                                                     {isTeam && (
                                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity bg-[#0c0c0e] px-1 py-1 rounded-lg border border-white/10 shadow-xl" onMouseDown={(e) => e.stopPropagation()}>
                                                                           <button
                                                                              type="button"
                                                                              onClick={(e) => { e.stopPropagation(); setEditingPersonnel(it); }}
                                                                              className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-md transition-all flex items-center gap-1"
                                                                           >
                                                                              <Edit2 size={12} />
                                                                           </button>
                                                                           <button
                                                                              type="button"
                                                                              onClick={(e) => handleDeletePersonnel(it.id, e)}
                                                                              className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-md transition-all flex items-center gap-1"
                                                                           >
                                                                              <Trash2 size={12} />
                                                                           </button>
                                                                        </div>
                                                                     )}
                                                                  </div>
                                                               )
                                                            })}
                                                         </div>
                                                      );
                                                   })}

                                                   {(!personnelRegistry.some(p => p.name.toLowerCase().includes(searchQuery.toLowerCase())) && Object.values(SUGGESTIONS).every(items => items.filter(it => it.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0)) && (
                                                      <button
                                                         type="button"
                                                         onClick={handleAddFromSearch}
                                                         className="w-full py-12 text-center flex flex-col items-center gap-2 hover:bg-white/5 transition-all group"
                                                      >
                                                         <Plus size={20} className="text-zinc-600 group-hover:text-white transition-colors" />
                                                         <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em] group-hover:text-white transition-colors">Add "{searchQuery}" to {builderCategory} registry</p>
                                                      </button>
                                                   )}

                                                   <div className="px-2 pt-2 border-t border-white/5">
                                                      <button
                                                         type="button"
                                                         onClick={handleAddFromSearch}
                                                         className="w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 rounded-xl transition-all text-white text-left group"
                                                      >
                                                         <div className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-zinc-500 group-hover:bg-white group-hover:text-black transition-all">
                                                            <Plus size={14} />
                                                         </div>
                                                         <div className="flex flex-col items-start">
                                                            <span className="text-[10px] font-bold">
                                                               {builderCategory === 'physical' && `+ Add '${searchQuery}' as new item`}
                                                               {builderCategory === 'digital' && `+ Add '${searchQuery}' as new service`}
                                                               {builderCategory === 'team' && `+ Add '${searchQuery}' as new person`}
                                                            </span>
                                                            <span className="text-[7px] font-black text-zinc-600 uppercase tracking-widest italic">Initialize into {builderCategory} manifest</span>
                                                         </div>
                                                      </button>
                                                   </div>
                                                </>
                                             )}
                                          </div>
                                          {editingPersonnel && (
                                             <div className="absolute inset-0 bg-zinc-900 z-50 flex flex-col animate-ios-slide-up p-5">
                                                <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-4">
                                                   <h3 className="text-sm font-black uppercase tracking-widest text-white">Edit Personnel</h3>
                                                   <button onClick={() => setEditingPersonnel(null)} className="text-zinc-500 hover:text-white transition-colors"><X size={16} /></button>
                                                </div>
                                                <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                                                   <div className="space-y-1">
                                                      <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-1">Expert Name</label>
                                                      <input
                                                         className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-indigo-500/50 transition-all"
                                                         value={editingPersonnel.name}
                                                         onChange={e => setEditingPersonnel({ ...editingPersonnel, name: e.target.value })}
                                                      />
                                                   </div>
                                                   <div className="space-y-1">
                                                      <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-1">Functional Class</label>
                                                      <select
                                                         className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-[11px] font-bold text-white outline-none focus:border-indigo-500/50 transition-all appearance-none"
                                                         value={editingPersonnel.role}
                                                         onChange={e => setEditingPersonnel({ ...editingPersonnel, role: e.target.value })}
                                                      >
                                                         {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                                      </select>
                                                   </div>
                                                   <div className="flex gap-3">
                                                      <div className="space-y-1 flex-1">
                                                         <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-1">Phone</label>
                                                         <input
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-[11px] font-bold text-white outline-none focus:border-indigo-500/50 transition-all"
                                                            value={editingPersonnel.phone || ''}
                                                            onChange={e => setEditingPersonnel({ ...editingPersonnel, phone: e.target.value })}
                                                         />
                                                      </div>
                                                      <div className="space-y-1 flex-1">
                                                         <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-1">Email</label>
                                                         <input
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-[11px] font-bold text-white outline-none focus:border-indigo-500/50 transition-all"
                                                            value={editingPersonnel.email || ''}
                                                            onChange={e => setEditingPersonnel({ ...editingPersonnel, email: e.target.value })}
                                                         />
                                                      </div>
                                                   </div>
                                                   <div className="flex gap-3">
                                                      <div className="space-y-1 flex-1">
                                                         <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-1">Cost / Rate</label>
                                                         <input
                                                            type="number"
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-[11px] font-bold text-white outline-none focus:border-indigo-500/50 transition-all"
                                                            value={editingPersonnel.cost || ''}
                                                            onChange={e => setEditingPersonnel({ ...editingPersonnel, cost: Number(e.target.value) || 0 })}
                                                         />
                                                      </div>
                                                      <div className="space-y-1 flex-1">
                                                         <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest px-1">Status</label>
                                                         <select
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-[11px] font-bold text-white outline-none focus:border-indigo-500/50 transition-all appearance-none"
                                                            value={editingPersonnel.status || 'Active'}
                                                            onChange={e => setEditingPersonnel({ ...editingPersonnel, status: e.target.value })}
                                                         >
                                                            <option value="Active">Active</option>
                                                            <option value="Inactive">Inactive</option>
                                                         </select>
                                                      </div>
                                                   </div>
                                                </div>
                                                <button
                                                   type="button"
                                                   onClick={handleSavePersonnelEdit}
                                                   className="mt-4 w-full py-3.5 bg-indigo-500 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-400 transition-all active:scale-[0.98] shadow-xl shadow-indigo-500/20"
                                                >
                                                   Save Changes
                                                </button>
                                             </div>
                                          )}
                                       </div>
                                    )}
                                 </div>
                              </div>

                              {/* Dynamic Content */}
                              <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[500px] no-scrollbar min-h-[300px]">
                                 {builderCategory === 'physical' && (
                                    <>
                                       {categorizedItems.physical.map(item => (
                                          <div key={item.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-3 group hover:border-white/10 transition-all">
                                             <div className="flex items-center justify-between gap-3">
                                                <input
                                                   placeholder="Asset Name (e.g. Album)"
                                                   className="flex-1 bg-transparent border-none text-[11px] font-bold text-white outline-none placeholder:text-zinc-700"
                                                   value={item.name}
                                                   onChange={e => updateCategorizedItem('physical', item.id, 'name', e.target.value)}
                                                />
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                   <div className="p-1.5 bg-emerald-500/10 rounded-lg">
                                                      <Edit2 size={10} className="text-emerald-500" />
                                                   </div>
                                                </div>
                                             </div>
                                             <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/5">
                                                <div className="flex items-center gap-2">
                                                   <span className="text-[8px] font-black text-zinc-600 uppercase">Qty</span>
                                                   <input
                                                      type="number"
                                                      className="w-12 bg-white/5 border border-white/5 rounded-lg p-1 text-[10px] font-bold text-white text-center"
                                                      value={item.quantity}
                                                      onChange={e => updateCategorizedItem('physical', item.id, 'quantity', parseInt(e.target.value) || 1)}
                                                   />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                   <span className="text-[8px] font-black text-zinc-600 uppercase">Rate</span>
                                                   <input
                                                      type="number"
                                                      className="w-24 bg-white/5 border border-white/5 rounded-lg p-1 text-[10px] font-bold text-emerald-500 text-right font-mono"
                                                      value={item.price}
                                                      onChange={e => updateCategorizedItem('physical', item.id, 'price', parseFloat(e.target.value) || 0)}
                                                   />
                                                </div>
                                                <button type="button" onClick={() => removeCategorizedItem('physical', item.id)} className="p-2 text-zinc-700 hover:text-red-500 transition-colors">
                                                   <Trash2 size={12} />
                                                </button>
                                             </div>
                                          </div>
                                       ))}
                                       {categorizedItems.physical.length === 0 && (
                                          <div className="py-20 text-center flex flex-col items-center gap-5">
                                             <div className="w-20 h-20 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                                <Package className="w-10 h-10 text-zinc-800" />
                                             </div>
                                             <div className="space-y-1">
                                                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500">No physical deliverables added</p>
                                                <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">Start by adding your first asset to the manifest</p>
                                             </div>
                                             <button
                                                type="button"
                                                onClick={() => addItemToCategory('physical')}
                                                className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2"
                                             >
                                                <Plus size={14} className="text-emerald-500" /> Add First Item
                                             </button>
                                          </div>
                                       )}
                                    </>
                                 )}

                                 {builderCategory === 'digital' && (
                                    <>
                                       {categorizedItems.digital.map(item => (
                                          <div key={item.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-3 group hover:border-white/10 transition-all">
                                             <div className="flex items-center justify-between gap-3">
                                                <input
                                                   placeholder="Service Name (e.g. Cinema)"
                                                   className="flex-1 bg-transparent border-none text-[11px] font-bold text-white outline-none placeholder:text-zinc-700"
                                                   value={item.name}
                                                   onChange={e => updateCategorizedItem('digital', item.id, 'name', e.target.value)}
                                                />
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                   <div className="p-1.5 bg-blue-500/10 rounded-lg">
                                                      <Edit2 size={10} className="text-blue-500" />
                                                   </div>
                                                </div>
                                             </div>
                                             <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/5">
                                                <div className="flex items-center gap-2">
                                                   <span className="text-[8px] font-black text-zinc-600 uppercase">Qty</span>
                                                   <input
                                                      type="number"
                                                      className="w-12 bg-white/5 border border-white/5 rounded-lg p-1 text-[10px] font-bold text-white text-center"
                                                      value={item.quantity}
                                                      onChange={e => updateCategorizedItem('digital', item.id, 'quantity', parseInt(e.target.value) || 1)}
                                                   />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                   <span className="text-[8px] font-black text-zinc-600 uppercase">Rate</span>
                                                   <input
                                                      type="number"
                                                      className="w-24 bg-white/5 border border-white/5 rounded-lg p-1 text-[10px] font-bold text-blue-500 text-right font-mono"
                                                      value={item.price}
                                                      onChange={e => updateCategorizedItem('digital', item.id, 'price', parseFloat(e.target.value) || 0)}
                                                   />
                                                </div>
                                                <button type="button" onClick={() => removeCategorizedItem('digital', item.id)} className="p-2 text-zinc-700 hover:text-red-500 transition-colors">
                                                   <Trash2 size={12} />
                                                </button>
                                             </div>
                                          </div>
                                       ))}
                                       {categorizedItems.digital.length === 0 && (
                                          <div className="py-20 text-center flex flex-col items-center gap-5">
                                             <div className="w-20 h-20 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex items-center justify-center">
                                                <Video className="w-10 h-10 text-zinc-800" />
                                             </div>
                                             <div className="space-y-1">
                                                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500">No digital deliverables added</p>
                                                <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">Configure cinematic services and digital assets</p>
                                             </div>
                                             <button
                                                type="button"
                                                onClick={() => addItemToCategory('digital')}
                                                className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2"
                                             >
                                                <Plus size={14} className="text-blue-500" /> Add First Media
                                             </button>
                                          </div>
                                       )}
                                    </>
                                 )}

                                 {builderCategory === 'team' && (
                                    <>
                                       {categorizedItems.team.map(item => (
                                          <div key={item.id} className="p-4 bg-black/40 border border-white/5 rounded-2xl space-y-3 group hover:border-white/10 transition-all">
                                             <div className="flex items-center justify-between gap-3">
                                                <input
                                                   placeholder="Expert Name"
                                                   className="flex-1 bg-transparent border-none text-[11px] font-bold text-white outline-none placeholder:text-zinc-700"
                                                   value={item.name}
                                                   onChange={e => updateCategorizedItem('team', item.id, 'name', e.target.value)}
                                                />
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                   <div className="p-1.5 bg-indigo-500/10 rounded-lg">
                                                      <Edit2 size={10} className="text-indigo-500" />
                                                   </div>
                                                </div>
                                             </div>
                                             <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/5">
                                                <select
                                                   className="bg-white/5 border border-white/5 rounded-lg p-1 text-[9px] font-black text-zinc-400 uppercase tracking-widest outline-none"
                                                   value={item.role}
                                                   onChange={e => updateCategorizedItem('team', item.id, 'role', e.target.value)}
                                                >
                                                   {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                                </select>
                                                <div className="flex items-center gap-2">
                                                   <span className="text-[8px] font-black text-zinc-600 uppercase">Cost</span>
                                                   <input
                                                      type="number"
                                                      className="w-20 bg-white/5 border border-white/5 rounded-lg p-1 text-[10px] font-bold text-indigo-400 text-right font-mono"
                                                      value={item.cost}
                                                      onChange={e => updateCategorizedItem('team', item.id, 'cost', parseFloat(e.target.value) || 0)}
                                                   />
                                                </div>
                                                <button type="button" onClick={() => removeCategorizedItem('team', item.id)} className="p-2 text-zinc-700 hover:text-red-500 transition-colors">
                                                   <Trash2 size={12} />
                                                </button>
                                             </div>
                                          </div>
                                       ))}
                                       {categorizedItems.team.length === 0 && (
                                          <div className="py-20 text-center flex flex-col items-center gap-5">
                                             <div className="w-20 h-20 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex items-center justify-center">
                                                <Users className="w-10 h-10 text-zinc-800" />
                                             </div>
                                             <div className="space-y-1">
                                                <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500">No team members assigned</p>
                                                <p className="text-[9px] font-bold text-zinc-700 uppercase tracking-widest">Register personnel for this operational vector</p>
                                             </div>
                                             <button
                                                type="button"
                                                onClick={() => addItemToCategory('team')}
                                                className="px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all active:scale-95 flex items-center gap-2"
                                             >
                                                <Plus size={14} className="text-indigo-500" /> Add First Personnel
                                             </button>
                                          </div>
                                       )}
                                    </>
                                 )}
                              </div>
                           </div>
                        </div>

                        {/* 4. FINANCIAL BREAKDOWN & EXTRA TEXT */}
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 border-t border-white/5 pt-8">
                           <div className="lg:col-span-7 flex flex-col gap-4">
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Notes (Optional)</label>
                                 <textarea rows={3} placeholder="Thanks for your business..." className="w-full bg-black/50 border border-white/5 squircle-sm p-4 text-sm font-bold text-white focus:border-white/10 outline-none resize-none" value={formNotes} onChange={e => setFormNotes(e.target.value)} disabled={isSubmitting} />
                              </div>
                              <div className="space-y-2">
                                 <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Terms Summary</label>
                                 <textarea rows={2} placeholder="Short terms text (not full agreement)..." className="w-full bg-black/50 border border-white/5 squircle-sm p-4 text-sm font-bold text-white focus:border-white/10 outline-none resize-none mx-0" value={formTermsSummary} onChange={e => setFormTermsSummary(e.target.value)} disabled={isSubmitting} />
                              </div>
                           </div>
                           <div className="lg:col-span-5 flex flex-col gap-3 p-6 glass-panel border border-white/5 squircle-sm h-fit">
                              <div className="flex items-center justify-between py-2 border-b border-white/5">
                                 <span className="text-[11px] font-black uppercase text-zinc-400 tracking-widest">Subtotal</span>
                                 <span className="font-mono font-bold text-white">₹{calculateSubtotal().toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between py-2 border-b border-white/5 gap-4">
                                 <span className="text-[11px] font-black uppercase text-zinc-400 tracking-widest whitespace-nowrap">Tax (%)</span>
                                 <input type="number" min="0" step="0.1" className="w-24 bg-black border border-white/10 rounded-lg p-2 text-sm font-bold text-white text-right outline-none" value={formTaxPercent} onChange={e => setFormTaxPercent(parseFloat(e.target.value) || 0)} disabled={isSubmitting} />
                              </div>
                              <div className="flex items-center justify-between py-2 border-b border-white/5 gap-4">
                                 <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-black uppercase text-zinc-400 tracking-widest whitespace-nowrap">Discount</span>
                                    <button type="button" onClick={() => setFormDiscountType(formDiscountType === 'flat' ? 'percent' : 'flat')} className="px-2 py-1 bg-white/5 rounded text-[8px] font-bold uppercase text-white hover:bg-white/10 transition-colors">
                                       {formDiscountType === 'flat' ? '₹ FLAT' : '% PCT'}
                                    </button>
                                 </div>
                                 <input type="number" min="0" step="0.1" className="w-24 bg-black border border-white/10 rounded-lg p-2 text-sm font-bold text-white text-right outline-none" value={formDiscountValue} onChange={e => setFormDiscountValue(parseFloat(e.target.value) || 0)} disabled={isSubmitting} />
                              </div>
                              <div className="flex items-center justify-between py-2 border-b border-white/5 gap-4">
                                 <span className="text-[11px] font-black uppercase text-zinc-400 tracking-widest whitespace-nowrap">Shipping (₹)</span>
                                 <input type="number" min="0" className="w-24 bg-black border border-white/10 rounded-lg p-2 text-sm font-bold text-white text-right outline-none" value={formShippingCost} onChange={e => setFormShippingCost(parseFloat(e.target.value) || 0)} disabled={isSubmitting} />
                              </div>
                              <div className="flex flex-col gap-1 items-end pt-4">
                                 <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">Calculated Balance Output</span>
                                 <span className="text-4xl font-black text-white tracking-tighter shrink-0 mb-2">₹{calculateFinalTotal().toLocaleString()}</span>
                              </div>
                           </div>
                        </div>

                        {/* Footer Block / Actions */}
                        <div className="pt-6 flex flex-col md:flex-row md:items-center justify-between gap-6 border-t border-white/5">
                           <div className="flex-1 w-full flex items-center gap-3">
                              <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-5 bg-white/5 text-zinc-400 hover:text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all disabled:opacity-50 border border-transparent hover:border-white/10">Cancel</button>
                           </div>
                           <div className="flex items-center gap-3 w-full md:w-auto">
                              <button type="submit" data-action="draft" disabled={isSubmitting} className="flex-1 md:flex-none px-8 py-5 bg-white/10 text-white hover:bg-white/20 border border-white/10 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-xl transition-all disabled:opacity-50">
                                 {isSubmitting ? 'Syncing...' : 'Save Draft'}
                              </button>
                              <button type="submit" data-action="generate" disabled={isSubmitting} className="flex-1 md:flex-none px-12 py-5 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_0_30px_rgba(255,255,255,0.2)] transition-all disabled:opacity-50">
                                 {isSubmitting ? 'Syncing...' : (editDocId ? `Update Core ${modalType === 'quotation' ? 'Quote' : 'Inv'}` : `Generate ${modalType === 'quotation' ? 'Quote' : 'Invoice'}`)}
                              </button>
                           </div>
                        </div>
                     </form>
                  )}
               </div>
            </div>
            , document.body)}

         {/* -------------------- RIGHT SIDE PREVIEW MODAL -------------------- */}
         {previewDoc && createPortal(
            <DocumentPreviewModal
               documentData={previewDoc}
               client={client || {} as any}
               company={companies.find(c => c.id === previewDoc.brandId) || companies.find(c => c.companyName === previewDoc.brand) || currentContextCompany || companies[0]}
               type={previewDoc.type === 'quotation' ? 'quote' : 'invoice'}
               onClose={() => setPreviewDoc(null)}
            />
            , document.body)}
         {/* Add Staff Modal */}
         {isAddStaffModalOpen && createPortal(
            <div
               className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-ios-fade-in"
               onClick={() => setIsAddStaffModalOpen(false)}
            >
               <div
                  className="w-full max-w-sm bg-zinc-950 border border-white/10 rounded-3xl p-8 shadow-2xl animate-ios-slide-up relative"
                  onClick={(e) => e.stopPropagation()}
               >
                  <button onClick={() => setIsAddStaffModalOpen(false)} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                     <X className="w-4 h-4 text-zinc-400" />
                  </button>
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-1">{editingStaffId ? 'Update Personnel' : 'Add Personnel'}</h3>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6">{editingStaffId ? 'Synchronize structural data' : 'Initialize new registry vector'}</p>

                  <form onSubmit={handleAddNewStaffSubmit} className="space-y-4">
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Expert Name</label>
                        <input required autoFocus className="w-full bg-black/50 border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-white/20" value={newStaffForm.name} onChange={e => setNewStaffForm(f => ({ ...f, name: e.target.value }))} placeholder="Jane Doe" />
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Specialty Class</label>
                        <select className="w-full bg-black/50 border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-white/20 appearance-none" value={newStaffForm.role} onChange={e => setNewStaffForm(f => ({ ...f, role: e.target.value }))}>
                           <option value="photographer">Photographer</option>
                           <option value="videographer">Videographer</option>
                           <option value="editor">Editor</option>
                           <option value="assistant">Assistant</option>
                        </select>
                     </div>
                     <div className="space-y-1">
                        <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Contact Reference (Optional)</label>
                        <input className="w-full bg-black/50 border border-white/5 rounded-xl p-4 text-sm font-bold text-white outline-none focus:border-white/20" value={newStaffForm.contact} onChange={e => setNewStaffForm(f => ({ ...f, contact: e.target.value }))} placeholder="jane@studio.com" />
                     </div>
                     <button type="submit" className="w-full py-4 mt-6 bg-white text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-zinc-200 transition-all active:scale-95">
                        {editingStaffId ? 'Update Record' : 'Commit Record'}
                     </button>
                  </form>
               </div>
            </div>
            , document.body)}

         {createPortal(
            <div className="fixed bottom-8 right-8 z-[10000] flex flex-col gap-3 pointer-events-none">
               {toasts.map(toast => (
                  <div
                     key={toast.id}
                     className="pointer-events-auto bg-zinc-900/90 border border-white/10 rounded-2xl p-4 flex items-center gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-ios-slide-up backdrop-blur-xl group min-w-[240px] border-l-4 border-l-red-500"
                  >
                     <div className="flex items-center gap-3 flex-1">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white">{toast.message}</span>
                     </div>
                     {toast.onUndo && (
                        <button
                           onClick={(e) => {
                              e.preventDefault();
                              toast.onUndo?.();
                           }}
                           className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-indigo-400 hover:text-indigo-300 transition-all active:scale-95"
                        >
                           Undo
                        </button>
                     )}
                  </div>
               ))}
            </div>,
            document.body
         )}

         {pendingConfirm && (
            <ConfirmDialog
               isOpen={!!pendingConfirm}
               title={pendingConfirm.title}
               message={pendingConfirm.message}
               confirmLabel={pendingConfirm.confirmLabel}
               tone={pendingConfirm.tone}
               onConfirm={() => {
                  pendingConfirm.onConfirm();
                  setPendingConfirm(null);
               }}
               onCancel={() => setPendingConfirm(null)}
            />
         )}
         {isAddEventModalOpen && createPortal(
            <div className="fixed inset-0 bg-black/90 md:bg-black/80 z-[200] flex items-center justify-center p-0 md:p-6 backdrop-blur-md md:backdrop-blur-2xl">
               <div className="bg-zinc-950 md:bg-zinc-900 border border-white/10 rounded-none md:rounded-[2.5rem] w-full h-full md:h-auto md:max-w-xl p-6 md:p-12 shadow-2xl animate-ios-slide-up overflow-y-auto custom-scrollbar pb-safe md:pb-12 pt-safe md:pt-12">
                  <div className="flex justify-between items-center mb-8">
                     <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Add Event</h2>
                     <button onClick={() => setIsAddEventModalOpen(false)} className="touch-target p-3 bg-white/5 text-zinc-600 hover:text-white rounded-full transition-all"><X className="w-6 h-6" /></button>
                  </div>
                  <form onSubmit={handleSaveEvent} className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Event Name *</label>
                        <input required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" placeholder="e.g. Mehendi" value={newEventForm.name || ''} onChange={e => setNewEventForm({ ...newEventForm, name: e.target.value })} />
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Date *</label>
                           <input required type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" value={newEventForm.date || ''} onChange={e => setNewEventForm({ ...newEventForm, date: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Start Time</label>
                           <input type="time" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" value={newEventForm.startTime || ''} onChange={e => setNewEventForm({ ...newEventForm, startTime: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">End Time</label>
                           <input type="time" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" value={newEventForm.endTime || ''} onChange={e => setNewEventForm({ ...newEventForm, endTime: e.target.value })} />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Venue Location</label>
                        <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" placeholder="Main Venue Address" value={newEventForm.venueLocation || ''} onChange={e => setNewEventForm({ ...newEventForm, venueLocation: e.target.value })} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Bride Location <span className="opacity-50">(Optional)</span></label>
                        <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" placeholder="Getting Ready Location" value={newEventForm.brideLocation || ''} onChange={e => setNewEventForm({ ...newEventForm, brideLocation: e.target.value })} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Groom Location <span className="opacity-50">(Optional)</span></label>
                        <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" placeholder="Getting Ready Location" value={newEventForm.groomLocation || ''} onChange={e => setNewEventForm({ ...newEventForm, groomLocation: e.target.value })} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Notes</label>
                        <textarea className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all min-h-[80px]" placeholder="Any specific requirements or team notes..." value={newEventForm.notes || ''} onChange={e => setNewEventForm({ ...newEventForm, notes: e.target.value })} />
                     </div>
                     <button type="submit" className="w-full py-5 bg-white text-black font-black rounded-2xl text-[11px] uppercase tracking-widest shadow-2xl hover:bg-zinc-200 transition-all mt-4">
                        Save Event
                     </button>
                  </form>
               </div>
            </div>
            , document.body)}

         {isEditProjectModalOpen && createPortal(
            <div className="fixed inset-0 bg-black/90 md:bg-black/80 z-[200] flex items-center justify-center p-0 md:p-6 backdrop-blur-md md:backdrop-blur-2xl">
               <div className="bg-zinc-950 md:bg-zinc-900 border border-white/10 rounded-none md:rounded-[2.5rem] w-full h-full md:h-auto md:max-w-2xl p-6 md:p-12 shadow-2xl animate-ios-slide-up overflow-y-auto custom-scrollbar pb-safe md:pb-12 pt-safe md:pt-12">
                  <div className="flex justify-between items-center mb-8">
                     <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Edit Project Info</h2>
                     <button onClick={() => setIsEditProjectModalOpen(false)} className="touch-target p-3 bg-white/5 text-zinc-600 hover:text-white rounded-full transition-all"><X className="w-6 h-6" /></button>
                  </div>
                  <form onSubmit={handleUpdateProjectInfo} className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Client Name *</label>
                           <input required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" value={editProjectForm.name || ''} onChange={e => setEditProjectForm({ ...editProjectForm, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Project Name *</label>
                           <input required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" value={editProjectForm.projectName || ''} onChange={e => setEditProjectForm({ ...editProjectForm, projectName: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Email</label>
                           <input type="email" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" value={editProjectForm.email || ''} onChange={e => setEditProjectForm({ ...editProjectForm, email: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Phone Number</label>
                           <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" value={editProjectForm.phone || ''} onChange={e => setEditProjectForm({ ...editProjectForm, phone: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Project Type</label>
                           <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" value={editProjectForm.projectType || ''} onChange={e => setEditProjectForm({ ...editProjectForm, projectType: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Primary Event Date</label>
                           <input type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" value={editProjectForm.eventDate || ''} onChange={e => setEditProjectForm({ ...editProjectForm, eventDate: e.target.value })} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Status</label>
                           <select className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all appearance-none" value={editProjectForm.status || 'Active'} onChange={e => setEditProjectForm({ ...editProjectForm, status: e.target.value })}>
                              <option value="Lead" className="bg-zinc-900">Lead</option>
                              <option value="Active" className="bg-zinc-900">Active</option>
                              <option value="Completed" className="bg-zinc-900">Completed</option>
                              <option value="Archived" className="bg-zinc-900">Archived</option>
                           </select>
                        </div>
                     </div>
                     <button type="submit" className="w-full py-5 bg-white text-black font-black rounded-2xl text-[11px] uppercase tracking-widest shadow-2xl hover:bg-zinc-200 transition-all mt-4">
                        Save Project Info
                     </button>
                  </form>
               </div>
            </div>
            , document.body)}

         {isEditEventModalOpen && editingEvent && createPortal(
            <div className="fixed inset-0 bg-black/90 md:bg-black/80 z-[200] flex items-center justify-center p-0 md:p-6 backdrop-blur-md md:backdrop-blur-2xl">
               <div className="bg-zinc-950 md:bg-zinc-900 border border-white/10 rounded-none md:rounded-[2.5rem] w-full h-full md:h-auto md:max-w-xl p-6 md:p-12 shadow-2xl animate-ios-slide-up overflow-y-auto custom-scrollbar pb-safe md:pb-12 pt-safe md:pt-12">
                  <div className="flex justify-between items-center mb-8">
                     <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">Edit Event</h2>
                     <button onClick={() => { setIsEditEventModalOpen(false); setEditingEvent(null); }} className="touch-target p-3 bg-white/5 text-zinc-600 hover:text-white rounded-full transition-all"><X className="w-6 h-6" /></button>
                  </div>
                  <form onSubmit={handleUpdateEvent} className="space-y-6">
                     <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Event Name *</label>
                        <input required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" placeholder="e.g. Mehendi" value={editingEvent.name || ''} onChange={e => setEditingEvent({ ...editingEvent, name: e.target.value })} />
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Date *</label>
                           <input required type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" value={editingEvent.date || ''} onChange={e => setEditingEvent({ ...editingEvent, date: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Start Time</label>
                           <input type="time" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" value={editingEvent.startTime || ''} onChange={e => setEditingEvent({ ...editingEvent, startTime: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">End Time</label>
                           <input type="time" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" value={editingEvent.endTime || ''} onChange={e => setEditingEvent({ ...editingEvent, endTime: e.target.value })} />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Venue Location</label>
                        <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" placeholder="Main Venue Address" value={editingEvent.venueLocation || ''} onChange={e => setEditingEvent({ ...editingEvent, venueLocation: e.target.value })} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Bride Location <span className="opacity-50">(Optional)</span></label>
                        <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" placeholder="Getting Ready Location" value={editingEvent.brideLocation || ''} onChange={e => setEditingEvent({ ...editingEvent, brideLocation: e.target.value })} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Groom Location <span className="opacity-50">(Optional)</span></label>
                        <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" placeholder="Getting Ready Location" value={editingEvent.groomLocation || ''} onChange={e => setEditingEvent({ ...editingEvent, groomLocation: e.target.value })} />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Notes</label>
                        <textarea className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all min-h-[80px]" placeholder="Any specific requirements or team notes..." value={editingEvent.notes || ''} onChange={e => setEditingEvent({ ...editingEvent, notes: e.target.value })} />
                     </div>
                     <button type="submit" className="w-full py-5 bg-white text-black font-black rounded-2xl text-[11px] uppercase tracking-widest shadow-2xl hover:bg-zinc-200 transition-all mt-4">
                        Update Event
                     </button>
                  </form>
               </div>
            </div>
            , document.body)}
      </div>
   );
};

export default ClientDetailsPage;
