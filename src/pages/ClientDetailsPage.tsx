import * as React from 'react';
import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate } from 'react-router-dom';
import { Mail, Phone, Calendar, Briefcase, Plus, ArrowLeft, FileText, IndianRupee, Activity, X, CheckCircle2, Trash2, Edit2, Copy, Download, CreditCard, ChevronRight, Search, Camera, Video, Edit3, Users, AlertTriangle, Clock, Check, Package, MapPin, BookOpen } from 'lucide-react';
import ConfirmDialog from '../components/ConfirmDialog';
import { type Client, type Invoice, type PaymentRecord, type User as UserType, type IdDocument, type Project, type ProjectStage, type ClientEvent, type StandaloneAgreementTemplate, type StandaloneAgreement } from '../types';
import { api } from '../services/api';
import { useCompanySettings, useCompanyForClient } from '../hooks/useCompanySettings';
import { getDisplayId } from '../utils/displayId';

import { getAuthUser } from '../utils/storage';

import { WORKFLOW_STAGES, normalizeWorkflowStage, calculateProjectWorkflowProgress } from '../utils/workflowUtils';
import { DocumentPreviewModal } from '../components/DocumentPreviewModal';
import { QuotationSelectionModal } from '../components/modals/QuotationSelectionModal';
import { getBrandInvoiceTemplate, getBrandQuoteTemplate } from '../templates/registry';
import { advanceProjectWorkflow, emergencyOverrideWorkflow } from '../utils/workflowEngine';
import { calculateEventStatusAndProgress } from '../utils/eventUtils';
import { replaceAgreementPlaceholders } from '../utils/agreementUtils';

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

const formatEventDate = (dateStr: string | Date) => {
   if (!dateStr) return '';
   const d = new Date(dateStr);
   if (isNaN(d.getTime())) return '';
   const day = String(d.getDate()).padStart(2, '0');
   const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
   const month = months[d.getMonth()];
   const year = d.getFullYear();
   return `${day} ${month} ${year}`;
};

const ROLES = [
   { value: 'photographer', label: 'Photographer' },
   { value: 'videographer', label: 'Videographer' },
   { value: 'editor', label: 'Editor' },
   { value: 'assistant', label: 'Assistant' },
];





const SecureSignatureImage: React.FC<{ agreementId: string; className?: string }> = ({ agreementId, className }) => {
   const [src, setSrc] = useState<string>('');
   const [loading, setLoading] = useState(true);

   useEffect(() => {
      let active = true;
      let objectUrl = '';
      const load = async () => {
         try {
            const blob = await api.getStandaloneAgreementSignatureImageBlob(agreementId);
            if (active) {
               objectUrl = URL.createObjectURL(blob);
               setSrc(objectUrl);
            }
         } catch (err) {
            console.error("Failed to load signature image", err);
         } finally {
            if (active) setLoading(false);
         }
      };
      load();
      return () => {
         active = false;
         if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
         }
      };
   }, [agreementId]);

   if (loading) {
      return (
         <div className="flex items-center justify-center p-4">
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest animate-pulse">Loading Signature...</span>
         </div>
      );
   }

   if (!src) {
      return (
         <div className="flex items-center justify-center p-4 border border-white/5 bg-zinc-950/20 rounded-xl">
            <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest">Image Unavailable</span>
         </div>
      );
   }

   return <img src={src} alt="Client Digital Signature" className={className} />;
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
   const [isSaving, setIsSaving] = useState(false);

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
      if (isSaving) return;
      setIsSaving(true);

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
         setIsAddEventModalOpen(false);
         setNewEventForm({
            name: '', date: '', startTime: '09:00', endTime: '18:00', brideLocation: '', groomLocation: '', venueLocation: '', notes: '', status: 'Scheduled'
         });
         setIsSaving(false);
         addToast("Event Created successfully");

         // Separately attempt coordination task creation if a valid project is available
         if (project?.id) {
            try {
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
                  eventId: newEvent.id,
                  projectId: project.id
               });
            } catch (taskErr) {
               console.error("Failed to create coordination task:", taskErr);
               addToast("Event created, but failed to create Coordination Task");
            }
         }
      } catch (err) {
         console.error("Failed to save event:", err);
         addToast(`Error saving event: ${err instanceof Error ? err.message : 'Unknown error'}`);
         setIsSaving(false);
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
         address: editProjectForm.address,
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

   // Personnel Selector Modal State
   const [isPersonnelBrowserOpen, setIsPersonnelBrowserOpen] = useState(false);

   // Quotation selection modal states
   const [isQuoteSelectorOpen, setIsQuoteSelectorOpen] = useState(false);
   const [quoteSelectorContext, setQuoteSelectorContext] = useState<{
      type: 'assign' | 'link-legacy';
      template?: StandaloneAgreementTemplate;
      agreementId?: string;
   } | null>(null);
   const [isAssigningQuote, setIsAssigningQuote] = useState(false);
   const quoteSelectorButtonRef = useRef<HTMLButtonElement | null>(null);

   const [pendingSelectorAssign, setPendingSelectorAssign] = useState<{
      categoryId: string;
      memberIndex: number;
      role: string;
   } | null>(null);
    const [browserSelectedStaffId, setBrowserSelectedStaffId] = useState<string>('');
    const [browserSearch, setBrowserSearch] = useState('');
    const [activeDropdown, setActiveDropdown] = useState<{ catId: string; memberIdx: number } | null>(null);

   const getStaffRosterStatus = (staffId: string) => {
      const staff = allStaff.find(s => s.id === staffId);
      if (!staff) return 'Available';

      if (!staff.isActive || (staff as any).status === 'On Leave' || (staff as any).isOnLeave) {
         return 'On Leave';
      }

      // Check if assigned to this client
      const isAssignedToCurrent = teamCategories.some(cat =>
         cat.members.some((m: any) => m.memberId === staffId)
      );
      if (isAssignedToCurrent) {
         return 'Assigned';
      }

      return 'Available';
   };

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



    // Standalone Agreement Templates State
    const [agreementTemplates, setAgreementTemplates] = useState<StandaloneAgreementTemplate[]>([]);
    const [clientAgreements, setClientAgreements] = useState<StandaloneAgreement[]>([]);
    const currentAgreement = clientAgreements[0] || null;
    const [idDocument, setIdDocument] = useState<IdDocument | null>(null);




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

   const [personnelRegistry, setPersonnelRegistry] = useState<any[]>([]);

   const handleDeletePersonnel = async (id: string, e: React.MouseEvent) => {
      e.preventDefault(); e.stopPropagation();
      if (!window.confirm("Are you sure you want to remove this person from the registry?")) return;

      const personToRemove = personnelRegistry.find(p => p.id === id);
      try {
         await api.deletePersonnel(id);
         setPersonnelRegistry(prev => prev.filter(p => p.id !== id));
         if (personToRemove) {
            setCategorizedItems(prev => ({
               ...prev,
               team: prev.team.filter(t => t.name !== personToRemove.name)
            }));
         }
         addToast("Personnel removed from registry");
      } catch (err) {
         console.error(err);
         addToast("Failed to remove personnel from registry");
      }
   };

   const [editingPersonnel, setEditingPersonnel] = useState<any | null>(null);

   const handleSavePersonnelEdit = async () => {
      if (!editingPersonnel || !editingPersonnel.name.trim()) return;
      try {
         const payload = {
            id: editingPersonnel.id,
            name: editingPersonnel.name,
            role: editingPersonnel.role,
            phone: editingPersonnel.phone || null,
            email: editingPersonnel.email || null,
            rate: editingPersonnel.rate !== undefined ? Number(editingPersonnel.rate) : Number(editingPersonnel.cost) || 0,
            status: editingPersonnel.status || 'Active'
         };
         const saved = await api.savePersonnel(payload);
         setPersonnelRegistry(prev => prev.map(p => p.id === editingPersonnel.id ? saved : p));

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
      } catch (err) {
         console.error(err);
         addToast("Failed to update personnel");
      }
   };

   const handleAddAndAssignPersonnel = async () => {
      const newPerson = {
         name: searchQuery,
         role: newMemberRoleInSearch,
         phone: newMemberPhoneInSearch || null,
         email: newMemberEmailInSearch || null,
         rate: Number(newMemberRateInSearch) || 0,
         status: 'Active'
      };
      try {
         const saved = await api.savePersonnel(newPerson);
         setPersonnelRegistry(prev => [...prev, saved]);
         setCategorizedItems(prev => ({
            ...prev,
            team: [...prev.team, { id: saved.id, name: searchQuery, role: newMemberRoleInSearch, cost: Number(newMemberRateInSearch) || 0 }]
         }));
         setSearchQuery("");
         setNewMemberPhoneInSearch("");
         setNewMemberEmailInSearch("");
         setNewMemberRateInSearch("");
         setShowSuggestions(false);
         setIsAddingNewInSearch(false);
         addToast("Personnel added to registry and assigned");
      } catch (err) {
         console.error(err);
         addToast("Failed to register and assign personnel");
      }
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
   const [formProjectId, setFormProjectId] = useState<string>('');
   const [formClientId, setFormClientId] = useState<string>('');

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
   }, [matchedCompany, selectedCompanyIdForDoc]);

   const generateAutoId = (type: 'quotation' | 'invoice', companyId: string) => {
      const company = companies.find(c => c.id === companyId) || matchedCompany || currentContextCompany;
      const prefix = company.invoicePrefix || (type === 'quotation' ? 'QT' : 'INV');
      return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}-${new Date().getFullYear()}`;
   };

   // Right Side Preview Drawer Logic
   const [previewDoc, setPreviewDoc] = useState<Invoice | null>(null);

   // Handle body scroll lock for modals
   useEffect(() => {
      if (isModalOpen || !!previewDoc || isAddStaffModalOpen || isQuoteSelectorOpen) {
         document.body.style.overflow = 'hidden';
      } else {
         document.body.style.overflow = 'auto';
      }
      return () => {
         document.body.style.overflow = 'auto';
      };
   }, [isModalOpen, previewDoc, isAddStaffModalOpen, isQuoteSelectorOpen]);


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

      const nextProjectId = existingDoc
         ? ((existingDoc as any).projectId || existingDoc.project?.id || existingDoc.project || project?.id || '')
         : (project?.id || '');
      const nextClientId = existingDoc
         ? (existingDoc.clientId || existingDoc.client?.id || existingDoc.client || client?.id || '')
         : (client?.id || '');

      setFormProjectId(nextProjectId);
      setFormClientId(nextClientId);

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
             api.deleteQuote(quoteId)
                .then(() => {
                   setClientQuotes(prev => prev.filter(q => q.id !== quoteId));
                   window.dispatchEvent(new Event("finance-updated"));
                   addToast("Quotation deleted successfully");
                })
                .catch(err => {
                   console.error("Failed to delete quotation:", err);
                   addToast("Failed to delete quotation: " + (err instanceof Error ? err.message : "Unknown error"));
                });
          }
       });
    };

   const handleDeleteInvoice = (invoiceId: string) => {
      requestConfirmation({
         title: "Delete Invoice",
         message: "Are you sure you want to delete this invoice? This action cannot be undone.",
         tone: "danger",
         onConfirm: () => {
            api.deleteInvoice(invoiceId)
               .then(() => {
                  setClientInvoices(prev => prev.filter(i => i.id !== invoiceId));
                  window.dispatchEvent(new Event("finance-updated"));
               })
               .catch(err => console.error("Failed to delete invoice:", err));
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
         projectId: doc.projectId || project?.id,
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

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const isUuid = (str: string) => uuidRegex.test(str);

      const projectId = formProjectId;

      if (!projectId) {
         alert("Project ID is missing. Please ensure an active project is selected for this client.");
         return;
      }

      if (projectId === '00000000-0000-0000-0000-000000000000') {
         alert("Invalid Project ID: default zero UUID is not allowed. Please select a valid active project.");
         return;
      }

      if (!isUuid(projectId)) {
         alert("Invalid Project ID format. A valid UUID is required.");
         return;
      }

      if (!project || projectId !== project.id) {
         alert(`Project ID mismatch. Expected active project ID: ${project?.id || 'none'}.`);
         return;
      }

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
         clientId: formClientId || client.id,
         client: { id: client.id, name: client.name },
         projectId: formProjectId,
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
         if (modalType === 'quotation') {
            const resolvedTemplate = getBrandQuoteTemplate(selectedCompany.id || selectedCompany.companyName);
            newDoc.templateId = resolvedTemplate.metadata.id;
            newDoc.templateVersion = resolvedTemplate.metadata.version;
         } else {
            const resolvedTemplate = getBrandInvoiceTemplate(selectedCompany.id || selectedCompany.companyName);
            newDoc.templateId = resolvedTemplate.metadata.id;
            newDoc.templateVersion = resolvedTemplate.metadata.version;
         }
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
            // Automatically pre-generate the PDF on the backend
            api.generateQuotationPDF(savedDoc.id).catch(err => {
               console.error("Failed to pre-generate quotation PDF on backend:", err);
            });

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

            // Removed automatic navigation to agreement/confirmation page
            // Admins must remain on the client page Quotation section.
         }, 1500);
      } catch (err) {
         console.error(err);
      } finally {
         setIsSubmitting(false);
      }
   };



   const handleAssignToClient = async (temp: StandaloneAgreementTemplate, e?: React.MouseEvent<HTMLButtonElement>) => {
      if (!client) return;

      if (e) {
         quoteSelectorButtonRef.current = e.currentTarget;
      }

      setQuoteSelectorContext({
         type: 'assign',
         template: temp
      });
      setIsQuoteSelectorOpen(true);
   };

   const handleLinkLegacyAgreement = async (agreementId: string, e?: React.MouseEvent<HTMLButtonElement>) => {
      if (!clientQuotes || clientQuotes.length === 0) {
         addToast("No quotations found for this client. Please create a quotation first.");
         return;
      }

      if (e) {
         quoteSelectorButtonRef.current = e.currentTarget;
      }

      setQuoteSelectorContext({
         type: 'link-legacy',
         agreementId: agreementId
      });
      setIsQuoteSelectorOpen(true);
   };

   const handleConfirmQuoteSelection = async (selectedQuoteId: string | null) => {
      if (!client || !quoteSelectorContext) return;

      setIsAssigningQuote(true);
      try {
         if (quoteSelectorContext.type === 'assign') {
            const temp = quoteSelectorContext.template!;
            await api.assignStandaloneAgreement(client.id, temp.id, selectedQuoteId || undefined);
            addToast(`Agreement "${temp.name}" assigned successfully.`);
            
            // Re-fetch standalone agreements
            const res = await api.getClientStandaloneAgreement(client.id);
            const agreements = Array.isArray(res) ? res : [res];
            setClientAgreements(agreements);
         } else if (quoteSelectorContext.type === 'link-legacy') {
            const agreementId = quoteSelectorContext.agreementId!;
            if (!selectedQuoteId) {
               addToast("A quotation must be selected for legacy agreements.");
               setIsAssigningQuote(false);
               return;
            }
            await api.linkStandaloneAgreementToQuotation(agreementId, selectedQuoteId);
            addToast("Agreement successfully linked to quotation.");
            
            // Re-fetch standalone agreements
            const res = await api.getClientStandaloneAgreement(client.id);
            const agreements = Array.isArray(res) ? res : [res];
            setClientAgreements(agreements);
         }
      } catch (err: any) {
         console.error("Failed to confirm quotation linkage:", err);
         const errMsg = err.data?.message || err.message || "";
         if (errMsg.toLowerCase().includes("already has an active pending agreement")) {
            addToast("Client already has an active pending agreement");
         } else {
            addToast(errMsg || "Failed to link agreement");
         }
      } finally {
         setIsAssigningQuote(false);
         setIsQuoteSelectorOpen(false);
         // Restore focus to the button that triggered the modal
         setTimeout(() => {
            quoteSelectorButtonRef.current?.focus();
            quoteSelectorButtonRef.current = null;
         }, 50);
      }
   };

   const handleCloseQuoteSelector = () => {
      setIsQuoteSelectorOpen(false);
      // Restore focus to the button that triggered the modal
      setTimeout(() => {
         quoteSelectorButtonRef.current?.focus();
         quoteSelectorButtonRef.current = null;
      }, 50);
   };

   const handleUploadIdProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
         const file = e.target.files[0];
         if (!project) {
            alert("A project must be created for this client before uploading identity documents.");
            return;
         }

         try {
            const renamedFile = new File([file], `ID_Proof_${(client?.name || 'Client').replace(/[^a-zA-Z0-9]/g, '_')}_${file.name}`, { type: file.type });
            const uploadedFile = await api.uploadFile(project.id, 'Agreements', renamedFile, true);

            const newDoc: IdDocument = {
               clientId: id!,
               type: "id_proof",
               fileName: file.name,
               fileUrl: `/files/${uploadedFile.id}/download`
            };
            setIdDocument(newDoc);
            addToast("ID Proof Uploaded & Secured");
         } catch (err) {
            console.error("Failed to upload ID proof", err);
            addToast("Failed to upload ID proof");
         }
      }
   };

   useEffect(() => {
      let isMounted = true;

      const fetchClientData = async () => {
         setLoading(true);

         let foundClient: Client | null = null;
         try {
            foundClient = await api.getClientById(id!);
            if (isMounted && foundClient) setClient(foundClient);
         } catch (err) {
            console.error("Failed to fetch client details from backend", err);
         }

         if (foundClient) {
            // Hydrate Standalone Agreement Templates from backend
            try {
               const templates = await api.getStandaloneAgreementTemplates();
               setAgreementTemplates(templates || []);
            } catch (err) {
               console.error("Failed to load standalone templates from backend", err);
            }

            // Hydrate Personnel Registry from backend
            try {
               const registry = await api.getPersonnel();
               if (registry && isMounted) {
                  setPersonnelRegistry(registry);
               }
            } catch (err) {
               console.error("Failed to load personnel from backend", err);
            }

            // Hydrate Client Standalone Agreements from backend
            try {
               const res = await api.getClientStandaloneAgreement(id!);
               if (isMounted) {
                  const agreements = Array.isArray(res) ? res : [res];
                  setClientAgreements(agreements);
               }
            } catch (err: any) {
               if (isMounted) {
                  if (err.status === 404) {
                     setClientAgreements([]);
                  } else {
                     console.error("Failed to fetch client standalone agreements", err);
                  }
               }
            }

            // Staged files migrated to Google Drive + PostgreSQL.

            let foundProject: Project | null = null;
            try {
               const projects = await api.getProjects();
               foundProject = projects.find(p => p.clientId === id || p.clientId === foundClient?.id || p.clientId === foundClient?._id) || null;
               if (isMounted) setProject(foundProject);

               if (foundProject) {
                  const projectFiles = await api.getFilesByProject(foundProject.id, 'Agreements');
                  const idFile = projectFiles.find((f: any) => f.fileName.startsWith('ID_Proof_'));
                  if (idFile && isMounted) {
                     const cleanName = idFile.fileName.replace(/^ID_Proof_[a-zA-Z0-9_]+?_/, '');
                     setIdDocument({
                        clientId: id!,
                        type: "id_proof",
                        fileName: cleanName,
                        fileUrl: `/files/${idFile.id}/download`
                     });
                  }
               }
            } catch (err) {
               console.error("Failed to fetch projects or ID document from backend", err);
            }

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

            let staffRoster: UserType[] = [];
            try {
               const staffList = await api.getStaff();
               staffRoster = staffList.map(s => ({
                  id: s.id,
                  email: s.email,
                  role: 'Staff',
                  staffRole: s.role,
                  isActive: s.isActive,
                  name: s.name,
                  permissions: []
               }));
               if (isMounted) setAllStaff(staffRoster);
            } catch (err) {
               console.error("Failed to fetch staff roster from backend", err);
            }

            const defaultRoles = ['Photographer', 'Videographer', 'Editor', 'Assistant', 'Drone Operator', 'Designer'];
            if (foundProject && isMounted) {
               const nextCats = getProjectTeamCategories(foundProject);
               setTeamCategories(nextCats);
            } else if (isMounted) {
               setTeamCategories(
                  defaultRoles.map(r => ({
                     id: `cat_${r.toLowerCase().replace(/\s/g, '')}`,
                     name: r,
                     members: [{ memberId: '', assigned_dates: [] }]
                  }))
               );
            }
         }

         if (isMounted) setLoading(false);
      };

      fetchClientData();
      return () => { isMounted = false; };
   }, [id]);

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

         if (isPersonnelBrowserOpen) {
            setBrowserSelectedStaffId(newUser.id);
         } else if (pendingDropdownAssign) {
            handleMemberChange(pendingDropdownAssign.role, pendingDropdownAssign.idx, newUser.id);
         }
      }
      setIsAddStaffModalOpen(false);
      setNewStaffForm({ name: '', role: 'photographer', contact: '' });
   };

   const mapUiRoleToDbRole = (uiRole: string): string => {
      const clean = uiRole.replace(/\s/g, '').toLowerCase();
      if (clean === 'photographer') return 'Photographer';
      if (clean === 'videographer') return 'Videographer';
      if (clean === 'editor') return 'Editor';
      if (clean === 'assistant') return 'Assistant';
      if (clean === 'droneoperator') return 'DroneOperator';
      if (clean === 'designer') return 'Designer';
      return uiRole;
   };

   const getProjectTeamCategories = (proj: Project) => {
      const defaultRoles = ['Photographer', 'Videographer', 'Editor', 'Assistant', 'Drone Operator', 'Designer'];
      const assignments = proj.staffAssignments || [];

      return defaultRoles.map(roleName => {
         const cleanRoleName = roleName.replace(/\s/g, '').toLowerCase();
         const dbRole = mapUiRoleToDbRole(roleName);

         const matchingAssignments = assignments.filter((a: any) =>
            a.role === dbRole
         );

         const members = matchingAssignments.length > 0
            ? matchingAssignments.map((a: any) => ({
               memberId: a.userId,
               assigned_dates: a.assignedAt ? [a.assignedAt] : [],
               assigned_events: a.eventIds || []
            }))
            : [{ memberId: '', assigned_dates: [] }];

         return {
            id: `cat_${cleanRoleName}`,
            name: roleName,
            members
         };
      });
   };

   const handleMemberChange = async (catId: string, mIdx: number, val: string) => {
      if (!project) {
         addToast("Cannot assign crew: No project exists for this client");
         return;
      }

      const category = teamCategories.find(c => c.id === catId);
      if (!category) return;

      const oldMemberId = category.members[mIdx]?.memberId;
      const dbRole = mapUiRoleToDbRole(category.name);

      try {
         if (oldMemberId) {
            await api.unassignStaff(project.id, oldMemberId);
         }

         if (val) {
            await api.assignStaff(project.id, val, dbRole);
            addToast(`Assigned ${category.name}`);
         } else {
            addToast(`Unassigned ${category.name}`);
         }

         const updatedProj = await api.getProjectById(project.id);
         if (updatedProj) {
            setProject(updatedProj);
            const nextCats = getProjectTeamCategories(updatedProj);
            setTeamCategories(nextCats);
         }
      } catch (err: any) {
         console.error("Failed to update staff assignment:", err);
         addToast(err?.message || "Failed to update staff assignment");
      }
   };

   const handleAddEventToMember = async (catId: string, mIdx: number, eventId: string) => {
      if (!project) return;
      const category = teamCategories.find(c => c.id === catId);
      if (!category) return;
      const userId = category.members[mIdx]?.memberId;
      if (!userId) return;

      const currentEvents = category.members[mIdx].assigned_events || [];
      if (currentEvents.includes(eventId)) return;
      const updatedEvents = [...currentEvents, eventId];

      setTeamCategories(prev => {
         return prev.map(cat => {
            if (cat.id !== catId) return cat;
            const nextMembers = [...cat.members];
            nextMembers[mIdx] = {
               ...nextMembers[mIdx],
               assigned_events: updatedEvents
            };
            return { ...cat, members: nextMembers };
         });
      });

      try {
         await api.updateStaffAssignedEvents(project.id, userId, updatedEvents);
         const assignedEv = client?.events?.find(e => e.id === eventId);
         const eventName = assignedEv ? assignedEv.name : "Event";
         addToast(`Event "${eventName}" assigned successfully`);

         const updatedProj = await api.getProjectById(project.id);
         if (updatedProj) {
            setProject(updatedProj);
            const nextCats = getProjectTeamCategories(updatedProj);
            setTeamCategories(nextCats);
         }
      } catch (err: any) {
         console.error("Failed to persist event assignment:", err);
         addToast("Failed to save event assignment: " + (err.message || "Unknown error"));
      }
   };

   const handleRemoveEvent = async (catId: string, mIdx: number, eIdx: number) => {
      if (!project) return;
      const category = teamCategories.find(c => c.id === catId);
      if (!category) return;
      const userId = category.members[mIdx]?.memberId;
      if (!userId) return;

      const nextEvents = [...(category.members[mIdx].assigned_events || [])];
      const eventId = nextEvents[eIdx];
      nextEvents.splice(eIdx, 1);

      setTeamCategories(prev => {
         return prev.map(cat => {
            if (cat.id !== catId) return cat;
            const nextMembers = [...cat.members];
            nextMembers[mIdx] = { ...nextMembers[mIdx], assigned_events: nextEvents };
            return { ...cat, members: nextMembers };
         });
      });

      try {
         await api.updateStaffAssignedEvents(project.id, userId, nextEvents);
         const assignedEv = client?.events?.find(e => e.id === eventId);
         const eventName = assignedEv ? assignedEv.name : "Event";
         addToast(`Event "${eventName}" removed successfully`);

         const updatedProj = await api.getProjectById(project.id);
         if (updatedProj) {
            setProject(updatedProj);
            const nextCats = getProjectTeamCategories(updatedProj);
            setTeamCategories(nextCats);
         }
      } catch (err: any) {
         console.error("Failed to persist event removal:", err);
         addToast("Failed to save event removal: " + (err.message || "Unknown error"));
      }
   };

   const addMemberRow = (catId: string) => {
      setTeamCategories(prev => {
         return prev.map(cat => {
            if (cat.id !== catId) return cat;
            return { ...cat, members: [...cat.members, { memberId: '', assigned_dates: [] }] };
         });
      });
   };

   const removeMemberRow = async (catId: string, mIdx: number) => {
      if (!project) return;
      const category = teamCategories.find(c => c.id === catId);
      if (!category) return;
      const memberId = category.members[mIdx]?.memberId;

      try {
         if (memberId) {
            await api.unassignStaff(project.id, memberId);
            addToast("Unassigned crew member");
         }

         const updatedProj = await api.getProjectById(project.id);
         if (updatedProj) {
            setProject(updatedProj);
            const nextCats = getProjectTeamCategories(updatedProj);
            setTeamCategories(nextCats);
         } else {
            setTeamCategories(prev => prev.map(cat => {
               if (cat.id !== catId) return cat;
               return { ...cat, members: cat.members.filter((_, i) => i !== mIdx) };
            }));
         }
      } catch (err: any) {
         console.error("Failed to remove staff assignment:", err);
         addToast(err?.message || "Failed to remove staff assignment");
      }
   };

   const handleAddCategory = () => {
      const name = prompt("Enter category name (e.g. Photographer, Drone Pilot)");
      if (!name) return;
      setTeamCategories(prev => {
         return [...prev, { id: `cat_${Date.now()}`, name, members: [{ memberId: '', assigned_dates: [] }] }];
      });
   };

   const handleEditCategory = (id: string) => {
      const cat = teamCategories.find(c => c.id === id);
      const name = prompt("Edit category name", cat?.name);
      if (!name) return;
      setTeamCategories(prev => {
         return prev.map(c => c.id === id ? { ...c, name } : c);
      });
   };

   const handleDeleteCategory = (id: string) => {
      if (!confirm("Delete this category and all its assignments?")) return;
      setTeamCategories(prev => {
         return prev.filter(c => c.id !== id);
      });
   };

   if (loading) {
      return (
         <div className="min-h-screen bg-transparent flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
               <div className="w-8 h-8 border-2 border-primary/20 border-t-emerald-500 rounded-full animate-spin" />
               <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Connecting Workspace...</p>
            </div>
         </div>
      );
   }

   if (!client) {
      return (
         <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-10 text-center animate-ios-slide-up">
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
                     <span className="px-2 py-1 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest rounded flex items-center gap-1 border border-primary/20">
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
                                 status: client.status || 'Active',
                                 address: client.address || ''
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
                           <p className="text-sm font-bold text-white">{getDisplayId(client.clientCode, client.id || (client as any)._id)}</p>
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
                        <div className="col-span-1 sm:col-span-2 md:col-span-4 border-t border-white/5 pt-4 mt-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
                           <div>
                              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Billing / Mailing Address</p>
                              <p className="text-sm font-bold text-white whitespace-pre-wrap">{client.address || 'Not Provided'}</p>
                           </div>
                           <div>
                              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Additional Notes</p>
                              <p className="text-sm font-bold text-white whitespace-pre-wrap">{client.notes || 'Not Provided'}</p>
                           </div>
                        </div>

                        <div className="col-span-1 sm:col-span-2 md:col-span-4 border-t border-white/5 pt-4 mt-2 space-y-4">
                           <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em]">Logistics & Addresses</p>
                           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                              <div>
                                 <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Location Type</p>
                                 <p className="text-sm font-bold text-white uppercase">{client.eventLogistics?.locationType ? `${client.eventLogistics.locationType}'s Side` : 'Not Provided'}</p>
                              </div>
                              <div>
                                 <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Bride Home Address</p>
                                 <p className="text-sm font-bold text-white whitespace-pre-wrap">{client.eventLogistics?.brideAddress || 'Not Provided'}</p>
                              </div>
                              <div>
                                 <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Groom Home Address</p>
                                 <p className="text-sm font-bold text-white whitespace-pre-wrap">{client.eventLogistics?.groomAddress || 'Not Provided'}</p>
                              </div>
                              <div>
                                 <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mb-1">Venue Address</p>
                                 <p className="text-sm font-bold text-white whitespace-pre-wrap">{client.eventLogistics?.venueAddress || 'Not Provided'}</p>
                              </div>
                           </div>
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
                                          <div className="h-full bg-primary transition-all duration-1000" style={{ width: `${calcProgress}%` }} />
                                       </div>
                                    )}
                                    <div className={`absolute top-0 right-0 w-1.5 h-full ${calcStatus === 'Completed' ? 'bg-primary' :
                                       calcStatus === 'In Progress' ? 'bg-primary' :
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
                                                   <MapPin className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                                                   <span className="truncate">{ev.venueLocation}</span>
                                                </div>
                                             )}
                                             {ev.brideLocation && (
                                                <div className="flex items-start gap-2 text-xs text-zinc-400">
                                                   <MapPin className="w-3 h-3 text-primary shrink-0 mt-0.5" />
                                                   <span className="truncate">Bride: {ev.brideLocation}</span>
                                                </div>
                                             )}
                                             {ev.groomLocation && (
                                                <div className="flex items-start gap-2 text-xs text-zinc-400">
                                                   <MapPin className="w-3 h-3 text-primary shrink-0 mt-0.5" />
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
                                             }} className="flex-1 bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-black uppercase tracking-widest py-2 rounded-lg flex items-center justify-center gap-2 transition-all">
                                                <Check className="w-3 h-3" /> Complete
                                             </button>
                                          )}
                                          <button onClick={() => handleDeleteEvent(ev.id, ev.name)} className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest py-2 rounded-lg flex items-center justify-center gap-2 transition-all">
                                             <Trash2 className="w-3 h-3" /> Delete
                                          </button>
                                       </div>
                                    )}
                                 </div>
                              );
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
                                 <p className="text-xs font-black text-white uppercase tracking-[0.2em] mb-1.5">{getDisplayId(quote.quotationCode, quote.id)}</p>
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
                        if (isPaid) { markerClass = 'bg-primary/50'; badgeClass = 'bg-primary/10 text-primary'; }
                        else if (invoice.status === 'Partial') { markerClass = 'bg-primary/50'; badgeClass = 'bg-primary/10 text-primary'; }

                        return (
                           <div key={invoice.id} onClick={(e) => { const target = e.target as HTMLElement; if (target.closest("[data-action-button]")) return; setPreviewDoc(invoice); }} className="p-5 glass-panel border border-white/5 squircle-sm hover:bg-white/5 cursor-pointer flex items-center justify-between group transition-all overflow-hidden relative">
                              <div className={`absolute left-0 top-0 bottom-0 w-1 ${markerClass}`} />
                              <div className="flex flex-col md:flex-row md:items-center justify-between w-full pl-3 gap-6">

                                 <div className="flex items-center gap-4">
                                    <div>
                                       <div className="flex items-center gap-3 mb-1.5">
                                          <p className="text-xs font-black text-white uppercase tracking-[0.2em]">
                                            {getDisplayId(
                                              (invoice.isQuotation || invoice.type === 'quotation') ? invoice.quotationCode : invoice.invoiceCode,
                                              invoice.id
                                            )}
                                          </p>
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
                                                if (currentAgreement?.status !== 'SIGNED') { e.stopPropagation(); alert("Cannot log payment. Agreement pending or expired."); return; }
                                                markAsPaid(e, invoice);
                                             }} className={`text-[9px] font-black uppercase tracking-widest py-2 px-3 rounded mr-2 transition-all ${currentAgreement?.status !== 'SIGNED' ? 'bg-zinc-800 text-zinc-600 cursor-not-allowed' : 'bg-primary/10 text-primary hover:bg-primary/20 active:scale-95'}`}>Mark Paid</button>
                                          )}
                                          <button data-action-button onClick={(e) => { e.stopPropagation(); openModal('invoice', invoice); }} className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 active:scale-90"><Edit2 className="w-4 h-4" /></button>
                                          <button data-action-button onClick={(e) => {
                                             e.stopPropagation();
                                             if (currentAgreement?.status !== 'SIGNED') { alert("Cannot download. Agreement pending or expired."); return; }
                                          }} className={`p-2 rounded-lg transition-all ${currentAgreement?.status !== 'SIGNED' ? 'text-zinc-600 cursor-not-allowed' : 'text-zinc-400 hover:text-white hover:bg-white/10 active:scale-90'}`}><Download className="w-4 h-4" /></button>
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
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                 <CheckCircle2 className="w-4 h-4 text-primary" />
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

                  {/* CURRENT STANDALONE AGREEMENT */}
                  <div className="glass-panel p-8 squircle-md border border-white/5 relative overflow-hidden bg-white/[0.01]">
                     {currentAgreement?.status === 'SIGNED' && <div className="absolute top-0 left-0 w-full h-1 bg-primary" />}
                     {currentAgreement?.status === 'REVOKED' && <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />}
                     {(!currentAgreement || currentAgreement.status === 'PENDING') && <div className="absolute top-0 left-0 w-full h-1 bg-amber-500" />}

                     <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                        <div className="w-full">
                           <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Current Agreement</h3>
                           <p className="text-[12px] font-black text-zinc-500 uppercase tracking-widest mb-6">Currently Active Standalone Agreement Parameters</p>

                           {currentAgreement ? (
                              <div className="space-y-6">
                                 <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6 bg-black/20 rounded-2xl border border-white/5">
                                    <div>
                                       <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Template Name</span>
                                       <span className="text-sm font-bold text-white uppercase">{currentAgreement.title || currentAgreement.template?.name || 'N/A'}</span>
                                    </div>
                                    <div>
                                       <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Version</span>
                                       <span className="text-sm font-bold text-white font-mono">{currentAgreement.template?.version || 'N/A'}</span>
                                    </div>
                                    <div>
                                       <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Assigned Date</span>
                                       <span className="text-sm font-bold text-white">{currentAgreement.assignedAt ? new Date(currentAgreement.assignedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
                                    </div>
                                    <div>
                                       <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1.5">Status</span>
                                       <span className={`px-2.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                          currentAgreement.status === 'SIGNED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                          currentAgreement.status === 'REVOKED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                          'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                       }`}>
                                          {currentAgreement.status}
                                       </span>
                                    </div>
                                 </div>

                                 {!currentAgreement.linkedQuoteId && (
                                    <div className="p-5 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-start gap-4">
                                       <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                                       <div>
                                          <h4 className="text-xs font-black uppercase tracking-wider text-rose-400 mb-1">Legacy Agreement Detected</h4>
                                          <p className="text-[11px] font-medium text-zinc-400 leading-normal mb-3">
                                             This is a legacy agreement and must be relinked to a quotation before a PDF can be generated.
                                          </p>
                                          {isAdmin && (
                                             <button
                                                onClick={(e) => handleLinkLegacyAgreement(currentAgreement.id, e)}
                                                className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                                             >
                                                Link to Quotation
                                             </button>
                                          )}
                                       </div>
                                    </div>
                                 )}

                                 <div className="space-y-2">
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">Agreement Document Body</span>
                                    <div className="p-6 bg-black/30 rounded-2xl text-sm font-mono text-zinc-400 whitespace-pre-wrap border border-white/5 max-h-[300px] overflow-y-auto custom-scrollbar mb-6">
                                       {(() => {
                                          const linkedQuote = clientQuotes.find((q: any) => q.id === currentAgreement.linkedQuoteId);
                                          return replaceAgreementPlaceholders(currentAgreement.generatedContent, {
                                             client,
                                             quotation: linkedQuote,
                                             project: project || linkedQuote?.project,
                                             agreement: currentAgreement
                                          });
                                       })()}
                                    </div>
                                 </div>

                                 {currentAgreement.status === 'SIGNED' && currentAgreement.signatures && currentAgreement.signatures.length > 0 && (
                                    <div className="p-6 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 space-y-4">
                                       <div className="flex items-center gap-3">
                                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                          <span className="text-xs font-black text-white uppercase tracking-widest">Digitally Signed & Validated</span>
                                       </div>
                                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                                          <div>
                                             <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Signer Name</p>
                                             <p className="text-sm font-bold text-white uppercase">{currentAgreement.signatures[0].signerName}</p>
                                             <p className="text-[10px] font-bold text-zinc-400 mt-2">
                                                Signed: {new Date(currentAgreement.signatures[0].signedAt).toLocaleString('en-GB')}
                                             </p>
                                          </div>
                                          <div className="bg-zinc-950/50 p-4 rounded-xl border border-white/5 inline-block text-center max-w-[200px]">
                                             <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-2 text-left">Signature Drawing</p>
                                             <SecureSignatureImage 
                                                agreementId={currentAgreement.id}
                                                className="max-h-16 max-w-full mx-auto select-none pointer-events-none filter invert brightness-200" 
                                             />
                                          </div>
                                       </div>
                                    </div>
                                 )}
                              </div>
                           ) : (
                              <div className="text-center py-10 text-xs font-mono text-zinc-500 border border-white/5 border-dashed rounded-2xl bg-black/20">
                                 NO ACTIVE STANDALONE AGREEMENT ASSIGNED.
                              </div>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* AGREEMENT HISTORY SECTION */}
                  <div className="glass-panel p-8 squircle-md border border-white/5 bg-white/[0.01]">
                     <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-2">Agreement History</h3>
                     <p className="text-[12px] font-black text-zinc-500 uppercase tracking-widest mb-6">Historical Log of Assigned Standalone Agreements</p>

                     {clientAgreements && clientAgreements.length > 1 ? (
                        <div className="space-y-3">
                           {clientAgreements.slice(1).map((agreement) => (
                              <div key={agreement.id} className="p-5 bg-black/30 border border-white/5 rounded-2xl flex flex-col md:flex-row md:items-center justify-between group hover:bg-white/5 transition-all">
                                 <div className="mb-4 md:mb-0 space-y-1">
                                    <div className="flex items-center gap-3">
                                       <p className="text-sm font-black text-white uppercase tracking-widest">{agreement.title || agreement.template?.name || 'N/A'}</p>
                                       <span className="text-[10px] font-bold text-zinc-600 uppercase font-mono">v{agreement.template?.version || 'N/A'}</span>
                                    </div>
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                       Assigned: {new Date(agreement.assignedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                       {agreement.signedAt && ` • Signed: ${new Date(agreement.signedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                                    </p>
                                 </div>
                                 <div className="flex items-center gap-4">
                                    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${
                                       agreement.status === 'SIGNED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                       agreement.status === 'REVOKED' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                                       'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                    }`}>
                                       {agreement.status}
                                    </span>
                                 </div>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <div className="text-center py-8 text-xs font-mono text-zinc-500 border border-white/5 border-dashed rounded-2xl bg-black/20">
                           NO STANDALONE AGREEMENT RECORDS IN REGISTER.
                        </div>
                     )}
                  </div>

                  {/* MASTER TEMPLATES (ADMIN ONLY) */}
                  {isAdmin && (
                     <div className="glass-panel p-8 squircle-md border border-white/5 bg-white/[0.01]">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                           <div>
                              <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-1">Client Agreement Selection</h3>
                              <p className="text-[12px] font-black text-zinc-500 uppercase tracking-widest">Select an agreement from the master library to deploy to this client</p>
                           </div>
                           <a 
                              href="/settings?tab=agreements"
                              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all border border-white/10 flex items-center gap-1.5 shrink-0"
                           >
                              <BookOpen className="w-3.5 h-3.5 text-primary" /> Manage Agreement Library
                           </a>
                        </div>

                        <div className="space-y-3">
                           {agreementTemplates.map(temp => {
                              const isAssigned = currentAgreement && currentAgreement.templateId === temp.id && currentAgreement.status !== 'REVOKED';

                              return (
                                 <div key={temp.id} className={`p-5 bg-black/30 border shrink-0 rounded-2xl flex flex-col md:flex-row md:items-center justify-between group hover:bg-white/5 transition-all ${isAssigned ? 'border-primary/40 border-l-4 border-l-emerald-500' : 'border-white/5'}`}>
                                    <div className="mb-4 md:mb-0 space-y-1">
                                       <div className="flex items-center gap-3">
                                          <p className="text-sm font-black text-white uppercase tracking-widest">{temp.name}</p>
                                          {isAssigned && <span className="bg-primary text-black text-[7px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">Assigned</span>}
                                       </div>
                                       <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest font-mono">
                                          v{temp.version} • Content Length: {temp.content?.length || 0} chars
                                       </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                       <button
                                          onClick={(e) => handleAssignToClient(temp, e)}
                                          className={`px-4 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all active:scale-95 shadow border ${isAssigned
                                             ? 'bg-primary text-black border-primary'
                                             : 'bg-primary/10 text-primary hover:bg-primary/20 border-primary/20'
                                             }`}
                                       >
                                          {isAssigned ? 'Assigned ✓' : 'Assign to Client'}
                                       </button>
                                    </div>
                                 </div>
                              );
                           })}
                           {agreementTemplates.length === 0 && (
                              <div className="text-center py-6 text-xs font-mono text-zinc-500 border border-white/5 border-dashed rounded-2xl bg-black/20">
                                 NO STANDALONE AGREEMENT TEMPLATES FOUND.
                              </div>
                           )}
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
                              <div className="flex items-center gap-4 p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                                 <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                                    <CheckCircle2 className="w-4 h-4 text-primary" />
                                 </div>
                                 <div>
                                    <p className="text-xs font-black text-white tracking-wider">{idDocument.fileName}</p>
                                    <p className="text-[9px] font-bold text-primary/80 uppercase tracking-widest mt-1">Verified Document</p>
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
                              <button
                                 onClick={() => {
                                    if (idDocument.fileUrl.startsWith('blob:') || idDocument.fileUrl.startsWith('data:')) {
                                       window.open(idDocument.fileUrl);
                                    } else {
                                       const match = idDocument.fileUrl.match(/\/files\/([a-f0-9-]+)\/download/);
                                       const fileId = match ? match[1] : idDocument.fileUrl;
                                       api.downloadProjectFile(fileId, idDocument.fileName)
                                          .catch(err => console.error("Failed to view ID document", err));
                                    }
                                 }}
                                 className="px-6 py-3 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all text-center"
                              >
                                 View Artifact
                              </button>
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
                              <Users className="w-4 h-4 text-primary" /> Team Assignment
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
                                    {category.members.map((rowVal, idx) => {
                                       const selectedStaff = allStaff.find(s => s.id === rowVal?.memberId);
                                       const staffStatus = selectedStaff ? getStaffRosterStatus(selectedStaff.id) : null;
                                       return (
                                          <div key={idx} className="flex flex-col gap-4 p-5 bg-black/20 rounded-xl border border-white/5 shadow-inner group/row">
                                             <div className="w-full">
                                                <button
                                                   type="button"
                                                   onClick={() => {
                                                      setPendingSelectorAssign({ categoryId: category.id, memberIndex: idx, role: category.name });
                                                      setBrowserSelectedStaffId(rowVal?.memberId || '');
                                                      setBrowserSearch('');
                                                      setIsPersonnelBrowserOpen(true);
                                                   }}
                                                   className="w-full bg-white/[0.03] border border-white/5 hover:border-white/10 hover:bg-white/[0.08] rounded-xl p-3.5 flex justify-between items-center text-xs font-semibold text-white transition-all cursor-pointer shadow-sm group outline-none"
                                                >
                                                   <div className="flex items-center gap-3 overflow-hidden">
                                                      {selectedStaff ? (
                                                         <>
                                                            <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-black uppercase shrink-0 shadow-lg shadow-indigo-500/20">
                                                               {(selectedStaff.name || selectedStaff.email || '?').charAt(0)}
                                                            </div>
                                                            <div className="text-left truncate">
                                                               <p className="text-xs font-bold text-white uppercase truncate tracking-wide">{selectedStaff.name || selectedStaff.email}</p>
                                                               <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">{selectedStaff.staffRole || category.name}</p>
                                                            </div>
                                                         </>
                                                      ) : (
                                                         <>
                                                            <div className="w-6 h-6 rounded-full bg-white/5 flex items-center justify-center shrink-0">
                                                               <Users className="w-3.5 h-3.5 text-zinc-500 group-hover:text-zinc-400 transition-colors" />
                                                            </div>
                                                            <span className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Select Personnel...</span>
                                                         </>
                                                      )}
                                                   </div>
                                                   <div className="flex items-center gap-3 shrink-0">
                                                      {selectedStaff && staffStatus && (
                                                         <span className={`text-[8px] px-2 py-0.5 rounded-full uppercase font-black tracking-widest ${staffStatus === 'Available' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
                                                               staffStatus === 'Assigned' ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400' :
                                                                  'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                                                            }`}>
                                                            {staffStatus}
                                                         </span>
                                                      )}
                                                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-400 transition-colors shrink-0" />
                                                   </div>
                                                </button>
                                             </div>

                                             <div className="space-y-4">
                                                <p className="text-xs font-black text-zinc-400 uppercase tracking-[0.2em] px-1">
                                                   Assigned Events
                                                </p>
                                                
                                                {(() => {
                                                   const assignedEventsList = rowVal.assigned_events || [];
                                                   const unassignedEvents = (client?.events || []).filter(ev => !assignedEventsList.includes(ev.id));
                                                   
                                                   return (
                                                      <>
                                                         {assignedEventsList.length === 0 ? (
                                                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest py-1 px-1">
                                                               No events assigned.
                                                            </p>
                                                         ) : (
                                                            <div className="flex flex-col gap-2 w-full">
                                                               {assignedEventsList.map((eventId, eIdx) => {
                                                                  const assignedEv = client?.events?.find(e => e.id === eventId);
                                                                  return (
                                                                     <div key={eIdx} className="flex items-center justify-between w-full px-4 py-3 bg-white/[0.02] border border-white/5 rounded-xl group/chip hover:bg-white/[0.04] hover:border-white/10 transition-all duration-200">
                                                                        <div className="flex items-center gap-3 min-w-0">
                                                                           <Calendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                                                                           <span className="text-xs font-bold text-zinc-200 uppercase tracking-widest truncate">
                                                                              {assignedEv ? `${assignedEv.name} (${formatEventDate(assignedEv.date)})` : 'Unknown Event'}
                                                                           </span>
                                                                        </div>
                                                                        <button
                                                                           type="button"
                                                                           onClick={(e) => { e.stopPropagation(); handleRemoveEvent(category.id, idx, eIdx); }}
                                                                           className="flex items-center justify-center w-7 h-7 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all duration-200 active:scale-95 shrink-0"
                                                                           title="Remove Event Assignment"
                                                                        >
                                                                           <X size={14} />
                                                                        </button>
                                                                     </div>
                                                                  );
                                                               })}
                                                            </div>
                                                         )}

                                                         <div className="relative inline-block">
                                                            <button
                                                               type="button"
                                                               onClick={(e) => {
                                                                  e.stopPropagation();
                                                                  if (activeDropdown?.catId === category.id && activeDropdown?.memberIdx === idx) {
                                                                     setActiveDropdown(null);
                                                                  } else {
                                                                     setActiveDropdown({ catId: category.id, memberIdx: idx });
                                                                  }
                                                               }}
                                                               className="flex items-center gap-2 px-3.5 py-2 bg-white/5 border border-white/10 hover:border-white/20 text-zinc-300 hover:text-white hover:bg-white/10 rounded-full transition-all text-[11px] font-black uppercase tracking-widest cursor-pointer outline-none"
                                                            >
                                                               <Plus size={12} /> Add Event
                                                            </button>
                                                            {activeDropdown?.catId === category.id && activeDropdown?.memberIdx === idx && (
                                                               <>
                                                                  <div 
                                                                     className="fixed inset-0 z-40" 
                                                                     onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setActiveDropdown(null);
                                                                     }} 
                                                                  />
                                                                  <div className="absolute left-0 mt-2 w-64 bg-zinc-950 border border-white/10 rounded-xl shadow-2xl z-50 py-1.5 max-h-60 overflow-y-auto">
                                                                     {unassignedEvents.length === 0 ? (
                                                                        <div className="px-4 py-3 text-xs font-bold text-zinc-500 uppercase tracking-wider text-center">
                                                                           No other events available
                                                                        </div>
                                                                     ) : (
                                                                        unassignedEvents.map(ev => (
                                                                           <button
                                                                              key={ev.id}
                                                                              type="button"
                                                                              onClick={(e) => {
                                                                                 e.stopPropagation();
                                                                                 handleAddEventToMember(category.id, idx, ev.id);
                                                                                 setActiveDropdown(null);
                                                                              }}
                                                                              className="w-full text-left px-4 py-2.5 text-xs font-bold text-zinc-300 hover:text-white hover:bg-white/5 uppercase tracking-wider transition-colors flex flex-col gap-0.5"
                                                                           >
                                                                              <span className="truncate">{ev.name}</span>
                                                                              <span className="text-[9px] text-zinc-500 font-medium">
                                                                                 ({formatEventDate(ev.date)})
                                                                              </span>
                                                                           </button>
                                                                        ))
                                                                     )}
                                                                  </div>
                                                               </>
                                                            )}
                                                         </div>
                                                      </>
                                                   );
                                                })()}
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
                                       );
                                    })}
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
                           <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full mt-1 ${project.stage === 'delivery' ? 'bg-primary/10 text-primary border border-primary/20' :
                              project.stage === 'booked' ? 'bg-primary/10 text-primary border border-primary/20' :
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
                                             const updatedProj = await api.getProjectById(project.id);
                                             if (updatedProj) setProject(updatedProj);
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
                                             const updatedProj = await api.getProjectById(project.id);
                                             if (updatedProj) setProject(updatedProj);
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
                                             const updatedProj = await api.getProjectById(project.id);
                                             if (updatedProj) setProject(updatedProj);
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
                                             const updatedProj = await api.getProjectById(project.id);
                                             if (updatedProj) setProject(updatedProj);
                                          }}
                                          className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-[9px] font-black uppercase tracking-widest text-emerald-400 rounded-lg transition-colors border border-primary/30"
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
                                          onChange={(e) => {
                                             const newStage = e.target.value as ProjectStage;
                                             requestConfirmation({
                                                title: 'Force Workflow Stage',
                                                message: 'This action bypasses the normal workflow progression and should only be used to correct operational mistakes.',
                                                confirmLabel: 'Force Stage',
                                                tone: 'danger',
                                                onConfirm: async () => {
                                                   await emergencyOverrideWorkflow(project.id, newStage);
                                                   const updatedProj = await api.getProjectById(project.id);
                                                   if (updatedProj) setProject(updatedProj);
                                                   setShowEmergencyOverride(false);
                                                }
                                             });
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
                                 style={{ width: `${calculateProjectWorkflowProgress(project)}%` }}
                              >
                                 <div className="w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[progress-stripe_1s_linear_infinite]" />
                              </div>
                           </div>
                           <div className="flex justify-between items-center text-[10px] font-black uppercase text-zinc-500 tracking-widest mt-2 px-1">
                              <span>Initiated</span>
                              <span>{calculateProjectWorkflowProgress(project)}% Complete</span>
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
                                    <div className={`w-6 h-6 md:w-8 md:h-8 rounded-full flex items-center justify-center border-2 ${isActive ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : isCompleted ? 'border-primary bg-primary' : 'border-white/10 bg-black'}`}>
                                       {isCompleted && <CheckCircle2 className="w-3 h-3 md:w-4 md:h-4 text-black" strokeWidth={3} />}
                                       {isActive && <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-primary" />}
                                    </div>
                                    <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-tight text-center ${isActive ? 'text-primary' : 'text-white'}`}>
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
                                       className="h-full bg-primary"
                                       style={{ width: `${Math.min(100, (clientInvoices.reduce((a, c) => a + (c.paidAmount || 0), 0) / (clientInvoices.reduce((a, c) => a + (c.totalAmount || 0), 0) || 1)) * 100)}%` }}
                                    />
                                 </div>
                              </div>
                           </div>

                           <div className="p-5 bg-black/20 border border-white/5 rounded-2xl space-y-2">
                              <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Schedule Vector</p>
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/10">
                                    <Calendar className="w-4 h-4 text-primary" />
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
                  className="w-full h-full md:h-auto md:max-w-4xl max-h-none md:max-h-[90vh] overflow-y-auto glass-panel rounded-none md:rounded-2xl p-6 md:p-10 shadow-2xl relative animate-ios-slide-up no-scrollbar pb-safe md:pb-10"
                  onClick={(e) => e.stopPropagation()}
               >
                  <button onClick={() => setIsModalOpen(false)} className="touch-target absolute top-4 md:top-6 right-4 md:right-6 p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                     <X className="w-5 h-5 text-zinc-400 hover:text-white" />
                  </button>

                  <h2 className="text-3xl font-black text-white uppercase tracking-tight mb-2">Financial Bounds Builder</h2>
                  <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-10 overflow-hidden text-ellipsis whitespace-nowrap opacity-60">Architect: {client?.name}</p>

                  {successMsg ? (
                     <div className="flex flex-col items-center justify-center py-20 space-y-4 animate-ios-fade-in">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                           <CheckCircle2 className="w-10 h-10 text-primary" />
                        </div>
                        <p className="text-lg font-black text-white uppercase tracking-widest text-center mt-4">{successMsg}</p>
                     </div>
                  ) : (
                     <form onSubmit={handleCreateDocument} className="space-y-8 animate-ios-fade-in">
                        {/* 1. HEADER SECTION */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 glass-panel border border-white/5 squircle-sm">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Structure Type</label>
                              <div className="flex glass-panel squircle-sm p-1">
                                 <button type="button" onClick={() => { setModalType('quotation'); setAutoGeneratedId(generateAutoId('quotation', selectedCompanyIdForDoc)); }} className={`touch-target flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${modalType === 'quotation' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>Quotation</button>
                                 <button type="button" onClick={() => { setModalType('invoice'); setAutoGeneratedId(generateAutoId('invoice', selectedCompanyIdForDoc)); }} className={`touch-target flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${modalType === 'invoice' ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}>Invoice</button>
                              </div>
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Issuing Brand (Company)</label>
                              <select
                                 className="w-full glass-panel squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none appearance-none cursor-pointer"
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
                              <input required type="date" className="w-full glass-panel squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} disabled={isSubmitting} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Payment Terms</label>
                              <input type="text" placeholder="e.g. Due on Receipt, Net 30" className="w-full glass-panel squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none" value={formPaymentTerms} onChange={e => setFormPaymentTerms(e.target.value)} disabled={isSubmitting} />
                           </div>
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Custom Brand Logo URL (Override)</label>
                              <input type="url" placeholder="https://..." className="w-full glass-panel squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none" value={formCompanyLogoUrl} onChange={e => setFormCompanyLogoUrl(e.target.value)} disabled={isSubmitting} />
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
                                       {builderCategory === 'physical' && <Package size={14} className="text-primary" />}
                                       {builderCategory === 'digital' && <Video size={14} className="text-primary" />}
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
                                                      onClick={handleAddAndAssignPersonnel}
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
                                                                        <span className={`text-[11px] font-black font-mono px-3 py-1.5 rounded-md ${isSelected ? 'bg-indigo-500/20 text-indigo-400' : 'bg-white/5 text-primary'}`}>
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
                                                   <div className="p-1.5 bg-primary/10 rounded-lg">
                                                      <Edit2 size={10} className="text-primary" />
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
                                                      className="w-24 bg-white/5 border border-white/5 rounded-lg p-1 text-[10px] font-bold text-primary text-right font-mono"
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
                                                <Plus size={14} className="text-primary" /> Add First Item
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
                                                   <div className="p-1.5 bg-primary/10 rounded-lg">
                                                      <Edit2 size={10} className="text-primary" />
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
                                                      className="w-24 bg-white/5 border border-white/5 rounded-lg p-1 text-[10px] font-bold text-primary text-right font-mono"
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
                                                <Plus size={14} className="text-primary" /> Add First Media
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
                                 <input type="number" min="0" step="0.1" className="w-24 glass-panel rounded-lg p-2 text-sm font-bold text-white text-right outline-none" value={formTaxPercent} onChange={e => setFormTaxPercent(parseFloat(e.target.value) || 0)} disabled={isSubmitting} />
                              </div>
                              <div className="flex items-center justify-between py-2 border-b border-white/5 gap-4">
                                 <div className="flex items-center gap-2">
                                    <span className="text-[11px] font-black uppercase text-zinc-400 tracking-widest whitespace-nowrap">Discount</span>
                                    <button type="button" onClick={() => setFormDiscountType(formDiscountType === 'flat' ? 'percent' : 'flat')} className="px-2 py-1 bg-white/5 rounded text-[8px] font-bold uppercase text-white hover:bg-white/10 transition-colors">
                                       {formDiscountType === 'flat' ? '₹ FLAT' : '% PCT'}
                                    </button>
                                 </div>
                                 <input type="number" min="0" step="0.1" className="w-24 glass-panel rounded-lg p-2 text-sm font-bold text-white text-right outline-none" value={formDiscountValue} onChange={e => setFormDiscountValue(parseFloat(e.target.value) || 0)} disabled={isSubmitting} />
                              </div>
                              <div className="flex items-center justify-between py-2 border-b border-white/5 gap-4">
                                 <span className="text-[11px] font-black uppercase text-zinc-400 tracking-widest whitespace-nowrap">Shipping (₹)</span>
                                 <input type="number" min="0" className="w-24 glass-panel rounded-lg p-2 text-sm font-bold text-white text-right outline-none" value={formShippingCost} onChange={e => setFormShippingCost(parseFloat(e.target.value) || 0)} disabled={isSubmitting} />
                              </div>
                              <div className="flex flex-col gap-1 items-end pt-4">
                                 <span className="text-[10px] font-black uppercase text-primary tracking-widest">Calculated Balance Output</span>
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

         {isQuoteSelectorOpen && createPortal(
            <QuotationSelectionModal
               isOpen={isQuoteSelectorOpen}
               onClose={handleCloseQuoteSelector}
               quotations={clientQuotes}
               onConfirm={handleConfirmQuoteSelection}
               isLoading={isAssigningQuote}
               title={quoteSelectorContext?.type === 'link-legacy' ? 'Link Legacy Agreement' : 'Link Agreement Quotation'}
               confirmLabel={quoteSelectorContext?.type === 'link-legacy' ? 'Link to Quotation' : 'Assign Agreement'}
            />
            , document.body)}

         {isPersonnelBrowserOpen && pendingSelectorAssign && createPortal(
            <div
               className="fixed inset-0 bg-black/80 z-[9990] flex items-center justify-center p-4 backdrop-blur-md animate-ios-fade-in"
               onClick={() => setIsPersonnelBrowserOpen(false)}
            >
               <div
                  className="w-full max-w-4xl bg-[#0c0c0e] border border-white/10 rounded-3xl p-6 shadow-2xl animate-ios-slide-up relative flex flex-col max-h-[85vh] min-h-[500px]"
                  style={{ width: '800px' }}
                  onClick={(e) => e.stopPropagation()}
               >
                  {/* Modal Header */}
                  <div className="flex justify-between items-center pb-4 border-b border-white/5 mb-4 shrink-0">
                     <div>
                        <h3 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-2">
                           Select Crew <span className="text-indigo-400">•</span> {pendingSelectorAssign.role} manifest
                        </h3>
                        <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">
                           Search, filter, and assign personnel to the team manifest
                        </p>
                     </div>
                     <div className="flex items-center gap-3">
                        <button
                           type="button"
                           onClick={() => {
                              setEditingStaffId(null);
                              setPendingDropdownAssign(null);
                              setNewStaffForm({ name: '', role: pendingSelectorAssign.role.toLowerCase(), contact: '' });
                              setIsAddStaffModalOpen(true);
                           }}
                           className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 border border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all active:scale-95 shadow-lg shadow-indigo-500/10 animate-pulse-subtle"
                        >
                           + Add New Person
                        </button>
                        <button
                           onClick={() => setIsPersonnelBrowserOpen(false)}
                           className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
                        >
                           <X className="w-4 h-4 text-zinc-400" />
                        </button>
                     </div>
                  </div>

                  {/* Search input */}
                  <div className="mb-4 shrink-0 relative">
                     <Search className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                     <input
                        type="text"
                        autoFocus
                        className="w-full bg-black/40 border border-white/5 rounded-xl p-3.5 pl-12 text-xs font-bold text-white placeholder:text-zinc-600 outline-none focus:border-white/20 transition-all font-mono"
                        placeholder="SEARCH BY NAME, ROLE, PHONE OR EMAIL..."
                        value={browserSearch}
                        onChange={e => setBrowserSearch(e.target.value)}
                     />
                  </div>

                  {/* Roster Cards List */}
                  <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 custom-scrollbar min-h-0">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-4">
                        {(() => {
                           const browserSearchLower = browserSearch.toLowerCase();

                           // Operational roles: Photographer, Videographer, Editor, Designer, DroneOperator, Assistant, Coordinator
                           const operationalRoles = ['photographer', 'videographer', 'editor', 'designer', 'droneoperator', 'assistant', 'coordinator'];
                           const excludedRoles = ['client', 'systemadmin'];

                           const filteredRoster = allStaff.filter(s => {
                              if (!s.isActive) {
                                 return false;
                              }

                              const staffRoleLower = s.staffRole?.toLowerCase().replace(/\s/g, '') || '';
                              const isOperational = operationalRoles.includes(staffRoleLower);
                              const isExcluded = excludedRoles.includes(staffRoleLower);

                              if (!isOperational || isExcluded) {
                                 return false;
                              }

                              const nameMatch = s.name?.toLowerCase().includes(browserSearchLower);
                              const roleMatch = s.staffRole?.toLowerCase().includes(browserSearchLower);
                              const contactMatch = s.email?.toLowerCase().includes(browserSearchLower);
                              return nameMatch || roleMatch || contactMatch;
                           });

                           if (filteredRoster.length === 0) {
                              return (
                                 <div className="col-span-full py-16 flex flex-col items-center justify-center gap-3 opacity-50">
                                    <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5">
                                       <Users className="w-6 h-6 text-zinc-500" />
                                    </div>
                                    <div className="text-center">
                                       <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">No staff members found</p>
                                       <p className="text-[10px] font-bold text-zinc-600 uppercase tracking-wider mt-1">Try searching another query or add a new person</p>
                                    </div>
                                 </div>
                              );
                           }

                           const targetRole = pendingSelectorAssign.role.toLowerCase();
                           const sortedRoster = [...filteredRoster].sort((a, b) => {
                              const aMatch = a.staffRole?.toLowerCase() === targetRole;
                              const bMatch = b.staffRole?.toLowerCase() === targetRole;
                              if (aMatch && !bMatch) return -1;
                              if (!aMatch && bMatch) return 1;
                              return 0;
                           });

                           return sortedRoster.map(s => {
                              const isSelected = browserSelectedStaffId === s.id;
                              const status = getStaffRosterStatus(s.id);
                              const badgeClass = status === 'Available' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
                                 status === 'Assigned' ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400' :
                                    'bg-rose-500/10 border border-rose-500/20 text-rose-400';

                              return (
                                 <div
                                    key={s.id}
                                    onClick={() => setBrowserSelectedStaffId(s.id)}
                                    onDoubleClick={() => {
                                       handleMemberChange(pendingSelectorAssign.categoryId, pendingSelectorAssign.memberIndex, s.id);
                                       setIsPersonnelBrowserOpen(false);
                                    }}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex items-center justify-between group/card ${isSelected
                                          ? 'bg-indigo-500/10 border-indigo-500/50 shadow-lg shadow-indigo-500/5'
                                          : 'bg-white/[0.02] border-white/5 hover:border-white/10 hover:bg-white/[0.04]'
                                       }`}
                                 >
                                    <div className="flex items-center gap-3.5 overflow-hidden">
                                       <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black uppercase shrink-0 transition-all ${isSelected
                                             ? 'bg-indigo-500 text-white'
                                             : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                          }`}>
                                          {(s.name || s.email || '?').charAt(0)}
                                       </div>
                                       <div className="truncate">
                                          <p className="text-xs font-bold text-white uppercase truncate tracking-wide">{s.name || s.email}</p>
                                          <p className="text-[10px] font-bold text-zinc-500 truncate uppercase mt-0.5 flex items-center gap-1.5">
                                             <span>{s.staffRole || 'Member'}</span>
                                             {s.email && (
                                                <>
                                                   <span className="text-zinc-700">•</span>
                                                   <span className="normal-case font-medium text-zinc-400 truncate max-w-[150px]">{s.email}</span>
                                                </>
                                             )}
                                          </p>
                                       </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                       <span className={`text-[8px] px-2.5 py-1 rounded-full uppercase font-black tracking-widest ${badgeClass}`}>
                                          {status}
                                       </span>
                                       <div className={`w-5 h-5 rounded-full flex items-center justify-center border transition-all ${isSelected
                                             ? 'bg-indigo-500 border-indigo-500 text-white'
                                             : 'border-white/10 text-transparent group-hover/card:border-white/30'
                                          }`}>
                                          <Check className="w-3 h-3" />
                                       </div>
                                    </div>
                                 </div>
                              );
                           });
                        })()}
                     </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-4 border-t border-white/5 mt-4 shrink-0 flex justify-between items-center gap-3">
                     <button
                        type="button"
                        onClick={() => {
                           handleMemberChange(pendingSelectorAssign.categoryId, pendingSelectorAssign.memberIndex, '');
                           setIsPersonnelBrowserOpen(false);
                        }}
                        className="px-5 py-3 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                     >
                        Clear Assignment
                     </button>
                     <div className="flex items-center gap-3">
                        <button
                           type="button"
                           onClick={() => setIsPersonnelBrowserOpen(false)}
                           className="px-5 py-3 bg-white/5 hover:bg-white/10 text-zinc-400 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                           Cancel
                        </button>
                        <button
                           type="button"
                           onClick={() => {
                              handleMemberChange(pendingSelectorAssign.categoryId, pendingSelectorAssign.memberIndex, browserSelectedStaffId);
                              setIsPersonnelBrowserOpen(false);
                           }}
                           disabled={!browserSelectedStaffId}
                           className="px-6 py-3 bg-white hover:bg-zinc-200 text-black disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-[0.98] shadow-xl shadow-white/5 font-bold"
                        >
                           Confirm Assignment
                        </button>
                     </div>
                  </div>
               </div>
            </div>
            , document.body)}

         {/* Add Staff Modal */}
         {isAddStaffModalOpen && createPortal(
            <div
               className="fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm animate-ios-fade-in"
               onClick={() => setIsAddStaffModalOpen(false)}
            >
               <div
                  className="w-full max-w-sm glass-panel rounded-3xl p-8 shadow-2xl animate-ios-slide-up relative"
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
               <div className="glass-panel rounded-none md:rounded-[2.5rem] w-full h-full md:h-auto md:max-w-xl p-6 md:p-12 shadow-2xl animate-ios-slide-up overflow-y-auto custom-scrollbar pb-safe md:pb-12 pt-safe md:pt-12">
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
                     <button 
                        type="submit" 
                        disabled={isSaving}
                        className="w-full py-5 bg-white text-black font-black rounded-2xl text-[11px] uppercase tracking-widest shadow-2xl hover:bg-zinc-200 transition-all mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
                     >
                        {isSaving ? 'Saving...' : 'Save Event'}
                     </button>
                  </form>
               </div>
            </div>
            , document.body)}

         {isEditProjectModalOpen && createPortal(
            <div className="fixed inset-0 bg-black/90 md:bg-black/80 z-[200] flex items-center justify-center p-0 md:p-6 backdrop-blur-md md:backdrop-blur-2xl">
               <div className="glass-panel rounded-none md:rounded-[2.5rem] w-full h-full md:h-auto md:max-w-2xl p-6 md:p-12 shadow-2xl animate-ios-slide-up overflow-y-auto custom-scrollbar pb-safe md:pb-12 pt-safe md:pt-12">
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
                        <div className="space-y-2 md:col-span-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Address</label>
                           <textarea className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all min-h-[80px]" value={editProjectForm.address || ''} onChange={e => setEditProjectForm({ ...editProjectForm, address: e.target.value })} />
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
               <div className="glass-panel rounded-none md:rounded-[2.5rem] w-full h-full md:h-auto md:max-w-xl p-6 md:p-12 shadow-2xl animate-ios-slide-up overflow-y-auto custom-scrollbar pb-safe md:pb-12 pt-safe md:pt-12">
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


