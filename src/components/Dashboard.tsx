import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck, IndianRupee, Briefcase, MapPin, Users, Package,
  ArrowUpRight, Sparkles, MessageSquare, Layers, CheckSquare, Clock,
  AlertCircle, TrendingUp, TrendingDown,
  Plus, X, Shield, Trash2, Loader2, Settings2, UserPlus, CheckCircle2
} from 'lucide-react';
import { type Booking, type Client, type Invoice, type Task, type Division, type Project, type ClientEvent } from '../types';
import { api } from '../services/api';
import { calculateEventStatusAndProgress } from '../utils/eventUtils';
import { generateGroupedAlerts } from '../utils/alertEngine';
import { useCompanySettings } from '../hooks/useCompanySettings';

interface DashboardProps {
  invoices: Invoice[];
  clients: Client[];
  bookings: Booking[];
  tasks: Task[];
  selectedBrand: string | 'All';
  userRole: 'Admin' | 'Staff' | 'Client' | 'none';
  expenses?: any[];
  divisions: Division[];
  addDivision: (division: Division) => void;
  deleteDivision: (id: string) => void;
  addClient: (client: Client) => Promise<void>;
}

const slugify = (text: string) => text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');

const Dashboard: React.FC<DashboardProps> = ({ clients, tasks, selectedBrand, userRole, divisions, addDivision, deleteDivision, addClient }) => {
  const navigate = useNavigate();
  const { companies } = useCompanySettings();

  const [summary, setSummary] = useState<any>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [timeCounter, setTimeCounter] = useState(0);
  
  // Project Registries States
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<Division | null>(null);
  const [newDiv, setNewDiv] = useState<Partial<Division>>({ type: 'Wedding' });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [divToDelete, setDivToDelete] = useState<Division | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fadingId, setFadingId] = useState<string | null>(null);

  // Create Client States
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isSubmittingClient, setIsSubmittingClient] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [clientFormData, setClientFormData] = useState({
    name: '',
    email: '',
    phone: '',
    eventDate: '',
    projectType: 'Wedding',
    companyId: selectedBrand !== 'All' ? selectedBrand : '',
    projectName: companies.find(d => d.id === selectedBrand)?.companyName || ''
  });

  useEffect(() => {
    if (selectedBrand === 'All' && companies.length === 1 && !clientFormData.companyId) {
      setClientFormData(prev => ({
        ...prev,
        companyId: companies[0].id,
        projectName: companies[0].companyName
      }));
    }
  }, [companies, selectedBrand, clientFormData.companyId]);

  const isAdmin = userRole === 'Admin';

  const confirmDelete = async () => {
    if (!divToDelete) return;
    const targetId = divToDelete.id;

    setIsDeleting(true);
    await new Promise(r => setTimeout(r, 150));

    setFadingId(targetId);
    setIsDeleteModalOpen(false);
    
    // Smooth transition
    await new Promise(r => setTimeout(r, 300));
    
    try {
      await deleteDivision(targetId);
    } catch (err) {
      console.error("Master Purge Protocol Failed", err);
    } finally {
      setIsDeleting(false);
      setDivToDelete(null);
      setFadingId(null);
    }
  };

  const handleSubmitDivision = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDiv.name && newDiv.type) {
      addDivision({
        id: isEditing ? isEditing.id : `div_${Date.now()}`,
        name: newDiv.name,
        type: newDiv.type as any,
        createdAt: isEditing ? isEditing.createdAt : new Date().toISOString(),
        description: newDiv.description || '',
        color: newDiv.color || '#3b82f6'
      });
      setIsAdding(false);
      setIsEditing(null);
      setNewDiv({ type: 'Wedding' });
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientFormData.companyId || clientFormData.companyId === 'All') {
      setFormError("Please select a specific Project Registry");
      return;
    }
    if (!clientFormData.name) {
      setFormError("Name is required");
      return;
    }

    setIsSubmittingClient(true);
    setFormError(null);

    const targetComp = companies.find(d => d.id === clientFormData.companyId);

    const clientData: Client = {
      id: String(Date.now()),
      _id: `client-${Date.now()}`,
      projectName: clientFormData.name,
      name: clientFormData.name,
      email: clientFormData.email,
      phone: clientFormData.phone,
      eventDate: clientFormData.eventDate,
      projectType: clientFormData.projectType,
      brand: targetComp?.companyName || clientFormData.projectName || 'Unknown',
      divisionId: clientFormData.companyId,
      companyId: clientFormData.companyId,
      notes: '',
      people: [],
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    try {
      await addClient(clientData);
      setClientFormData({
        name: '',
        email: '',
        phone: '',
        eventDate: '',
        projectType: 'Wedding',
        companyId: selectedBrand !== 'All' ? selectedBrand : (companies.length === 1 ? companies[0].id : ''),
        projectName: companies.find(d => d.id === selectedBrand)?.companyName || ''
      });
      setIsAddingClient(false);
    } catch (err) {
      setFormError("Failed to save data.");
    } finally {
      setIsSubmittingClient(false);
    }
  };

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const data = await api.getFinanceSummary(selectedBrand, selectedBrand === 'All' ? 'global' : 'project');
        setSummary(data);
      } catch (err) {
        console.error("Dashboard Finance Sync Failed:", err);
      }
    };
    const fetchProjects = async () => {
      try {
        const p = await api.getProjects();
        setProjects(p);
      } catch (err) {
        console.error("Dashboard Projects Sync Failed:", err);
      }
    };
    fetchSummary();
    fetchProjects();
  }, [selectedBrand]);

  useEffect(() => {
    // Tick every minute to force recalculation of "Today" events
    const interval = setInterval(() => {
       setTimeCounter(prev => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isAddingClient || isAdding || isDeleteModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isAddingClient, isAdding, isDeleteModalOpen]);

  const safeClients = useMemo(() => Array.isArray(clients) ? clients : [], [clients]);
  const safeTasks = useMemo(() => Array.isArray(tasks) ? tasks : [], [tasks]);

  const filteredClients = selectedBrand === 'All' ? safeClients : safeClients.filter(c => c && c.brand === selectedBrand);
  const filteredTasks = selectedBrand === 'All' ? safeTasks : safeTasks.filter(t => t && t.brand === selectedBrand);

  // Financials (Unified Source)
  const totalRevenue = summary?.totalRevenue || 0;
  const cashCollected = summary?.recoveredAmount || 0;
  const pendingAmount = summary?.pendingAmount || 0;

  const today = useMemo(() => {
    void timeCounter;
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, [timeCounter]);

  // Event Engine
  type ExtendedEvent = ClientEvent & { clientId: string, clientName: string, projectName: string, venue?: string, calcStatus: string, calcProgress: number };
  
  const allEvents = useMemo(() => {
      void timeCounter; // Fix for exhaustive-deps
      const events: ExtendedEvent[] = [];
      filteredClients.forEach(c => {
         if (c.events && Array.isArray(c.events)) {
             c.events.forEach(ev => {
                 const { status, progress } = calculateEventStatusAndProgress(ev);
                 events.push({
                     ...ev,
                     clientId: c.id,
                     clientName: c.name || 'Unknown',
                     projectName: c.projectName || c.name || 'Unknown',
                     venue: ev.venueLocation,
                     calcStatus: status,
                     calcProgress: progress
                 });
             });
         }
      });
      return events.sort((a,b) => new Date(`${a.date}T${a.startTime||'00:00'}`).getTime() - new Date(`${b.date}T${b.startTime||'00:00'}`).getTime());
  }, [filteredClients, timeCounter]);

  const todayEvents = useMemo(() => allEvents.filter(ev => {
      const evDate = new Date(ev.date);
      evDate.setHours(0,0,0,0);
      return evDate.getTime() === today.getTime();
  }), [allEvents, today]);

  const upcomingEvents = useMemo(() => allEvents.filter(ev => {
      const evDate = new Date(ev.date);
      evDate.setHours(0,0,0,0);
      return evDate.getTime() > today.getTime();
  }), [allEvents, today]);

  // Workflow Warnings
  let pendingAgreementsCount = 0;
  let pendingAdvancesCount = 0;
  let missingTeamsCount = 0;
  let pendingDeliveriesCount = 0;

  filteredClients.forEach(c => {
     if (!c.activeAgreement || c.activeAgreement.status !== 'accepted') {
        const hasUpcoming = c.events?.some(ev => new Date(ev.date) >= today);
        if (hasUpcoming) pendingAgreementsCount++;
     }
  });

  summary?.invoices?.forEach((inv: any) => {
      if (inv.status !== 'Paid' && inv.type !== 'quotation') {
          const isAdvance = inv.items?.some((i:any) => i.description?.toLowerCase().includes('advance'));
          if (isAdvance) pendingAdvancesCount++;
      }
  });

  upcomingEvents.forEach(ev => {
      const proj = projects.find(p => String(p.clientId) === String(ev.clientId));
      if (proj) {
           const hasTeamAssigned = proj.team && (proj.team.photographer || proj.team.videographer || proj.team.photographers?.length > 0 || proj.team.videographers?.length > 0);
           if (!hasTeamAssigned) missingTeamsCount++;
      } else {
           missingTeamsCount++;
      }
  });

  projects.forEach(p => {
      if (p.stage === 'Editing' || p.stage === 'Delivery Ready' || p.stage === 'Shoot Completed') {
         pendingDeliveriesCount++;
      }
  });

  // Alerts System
  const alerts = useMemo(() => {
    return generateGroupedAlerts(filteredClients, projects, summary?.invoices || [], today);
  }, [summary, filteredClients, today, projects]);

  // Client Profit Data
  const clientProfitData = useMemo(() => {
    const map: Record<string, { revenue: number; expenses: number }> = {};
    
    summary?.invoices?.forEach((inv: any) => {
      let cName = 'Unknown Client';
      if (inv.client) cName = inv.client.name || inv.client.projectName || cName;
      else if (inv.clientId) {
        const c = safeClients.find(cl => String(cl.id) === String(inv.clientId));
        if (c) cName = c.projectName || c.name || cName;
      } else if (inv.clientName) {
        cName = inv.clientName;
      }
      
      const amt = inv.total || inv.totalAmount || (Array.isArray(inv.items) ? inv.items.reduce((s: number, it: any) => s + ((it.price || 0) * (it.quantity || 0)), 0) : 0);
      if (!map[cName]) map[cName] = { revenue: 0, expenses: 0 };
      map[cName].revenue += amt;
    });

    summary?.expenses?.forEach((exp: any) => {
      const cName = exp.client || 'General';
      if (!map[cName]) map[cName] = { revenue: 0, expenses: 0 };
      map[cName].expenses += (Number(exp.amount) || 0);
    });

    const result = Object.entries(map).map(([name, data]) => ({
      name,
      revenue: data.revenue,
      expenses: data.expenses,
      profit: data.revenue - data.expenses
    }));

    return result.sort((a,b) => b.profit - a.profit);
  }, [summary, safeClients]);

  const totalAlertsCount = alerts.reduce((acc, group) => acc + group.alerts.length, 0);
  const eventsCount = upcomingEvents.length;
  const myTasksCount = filteredTasks.filter(t => t && t.status !== 'Done').length; 
  const activeProjectsCount = filteredClients.length;

  let metrics: any[] = [];
  if (userRole === 'Staff') {
    metrics = [
      { id: 1, label: 'My Tasks', value: myTasksCount, hex: '#FFFFFF', icon: CheckSquare, bg: 'bg-zinc-900', targetPath: '/tasks' },
      { id: 2, label: 'Active Jobs', value: activeProjectsCount, hex: '#10b981', icon: Layers, bg: 'bg-emerald-950/10', targetPath: '/directory' },
      { id: 3, label: 'Alerts', value: totalAlertsCount, hex: '#f59e0b', icon: MessageSquare, bg: 'bg-amber-950/10', targetPath: '/coordination' },
      { id: 4, label: 'Events', value: eventsCount, hex: '#3b82f6', icon: CalendarCheck, bg: 'bg-blue-950/10', targetPath: '/coordination' },
    ];
  } else {
    metrics = [
      { id: 1, label: 'Total Revenue', value: `₹${(totalRevenue / 100000).toFixed(1)}L`, hex: '#FFFFFF', icon: Briefcase, bg: 'bg-zinc-900', targetPath: '/analytics' },
      { id: 2, label: 'Cash Collected', value: `₹${(cashCollected / 100000).toFixed(1)}L`, hex: '#10b981', icon: IndianRupee, bg: 'bg-emerald-950/10', targetPath: '/ledger' },
      { id: 3, label: 'Pending Amount', value: `₹${(pendingAmount / 100000).toFixed(1)}L`, hex: '#f43f5e', icon: AlertCircle, bg: 'bg-rose-950/10', targetPath: '/revenue' },
      { id: 4, label: 'Today\'s Events', value: todayEvents.length, hex: '#3b82f6', icon: CalendarCheck, bg: 'bg-blue-950/10', targetPath: '/coordination' },
    ];
  }

  return (
    <div className="space-y-12 animate-ios-slide-up">
      {isAdmin && (
        <div className="flex justify-end -mb-6">
          <button
            onClick={() => {
              setFormError(null);
              setClientFormData({
                name: '',
                email: '',
                phone: '',
                eventDate: '',
                projectType: 'Wedding',
                companyId: selectedBrand !== 'All' ? selectedBrand : (companies.length === 1 ? companies[0].id : ''),
                projectName: companies.find(d => d.id === selectedBrand)?.companyName || ''
              });
              setIsAddingClient(true);
            }}
            className="bg-white text-black px-8 py-3.5 rounded-2xl flex items-center gap-3 font-black uppercase text-[10px] tracking-widest hover:bg-zinc-200 ios-transition shadow-lg active:scale-95"
          >
            <UserPlus className="w-5 h-5" />
            Create Client
          </button>
        </div>
      )}
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <button 
              key={m.id} 
              onClick={() => m.targetPath && navigate(m.targetPath)} 
              className={`${m.bg} border border-white/5 p-4 md:p-8 squircle-lg flex flex-col justify-between h-36 md:h-48 group cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:border-white/20 active:scale-95 text-left w-full outline-none focus:ring-2 focus:ring-white/20 relative overflow-hidden touch-target`}
              aria-label={`View ${m.label}`}
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-500" 
                style={{ background: `radial-gradient(circle at top right, ${m.hex}, transparent 70%)` }}
              />
              <div className="flex justify-between items-start relative z-10">
                <div className="p-4 rounded-2xl bg-white/5 text-white shadow-xl group-hover:bg-white group-hover:text-black transition-all duration-200">
                  <Icon className="w-6 h-6" />
                </div>
                <ArrowUpRight className="w-5 h-5 text-zinc-700 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-200" />
              </div>
              <div className="relative z-10">
                <p className="text-zinc-600 text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-1 group-hover:text-zinc-400 transition-colors truncate">{m.label}</p>
                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight truncate">{m.value}</h3>
              </div>
            </button>
          );
        })}
      </div>

      {/* Workflow Warnings Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
         <div className="bg-white/5 border border-white/10 p-4 md:p-6 squircle-lg flex flex-col justify-between hover:bg-white/10 transition-colors touch-target">
            <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center mb-4">
               <AlertCircle className="w-4 h-4 text-red-500" />
            </div>
            <h4 className="text-2xl md:text-3xl font-black text-white">{pendingAgreementsCount}</h4>
            <p className="text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Agreements Pending</p>
         </div>
         <div className="bg-white/5 border border-white/10 p-4 md:p-6 squircle-lg flex flex-col justify-between hover:bg-white/10 transition-colors touch-target">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
               <IndianRupee className="w-4 h-4 text-amber-500" />
            </div>
            <h4 className="text-2xl md:text-3xl font-black text-white">{pendingAdvancesCount}</h4>
            <p className="text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Advances Pending</p>
         </div>
         <div className="bg-white/5 border border-white/10 p-4 md:p-6 squircle-lg flex flex-col justify-between hover:bg-white/10 transition-colors touch-target">
            <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center mb-4">
               <Users className="w-4 h-4 text-orange-500" />
            </div>
            <h4 className="text-2xl md:text-3xl font-black text-white">{missingTeamsCount}</h4>
            <p className="text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Teams Missing</p>
         </div>
         <div className="bg-white/5 border border-white/10 p-4 md:p-6 squircle-lg flex flex-col justify-between hover:bg-white/10 transition-colors touch-target">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center mb-4">
               <Package className="w-4 h-4 text-primary" />
            </div>
            <h4 className="text-2xl md:text-3xl font-black text-white">{pendingDeliveriesCount}</h4>
            <p className="text-[8px] md:text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-1">Deliveries Pending</p>
         </div>
      </div>

      {/* Today's Events Section */}
      {todayEvents.length > 0 && (
        <div className="bg-primary/5 p-12 squircle-xl border border-primary/10 space-y-10 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white uppercase tracking-widest flex items-center gap-4">
              <CalendarCheck className="w-6 h-6 text-primary" /> Today's Events
            </h3>
            <div className="px-3 py-1 bg-primary/20 text-primary rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              Live Ops
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {todayEvents.map((ev, idx) => (
              <div key={ev.id || idx} onClick={() => navigate(`/project/${ev.clientId}`)} className="p-6 bg-emerald-950/20 border border-primary/20 rounded-3xl relative overflow-hidden group cursor-pointer hover:bg-emerald-950/40 transition-colors">
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-xl font-black text-white uppercase tracking-tight">{ev.name} - {ev.projectName}</h4>
                    <p className="text-xs font-bold text-zinc-400 mt-1 uppercase flex items-center gap-2">
                       <MapPin className="w-3 h-3" /> {ev.venue || 'Venue TBD'}
                    </p>
                  </div>
                  <div className="px-3 py-1 bg-white/5 rounded-lg border border-white/5 text-[10px] font-black uppercase tracking-widest">
                     {ev.calcStatus}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-black uppercase tracking-widest text-zinc-500">
                   <span className="flex items-center gap-2 text-white">
                      <Clock className="w-4 h-4 text-primary" />
                      {ev.startTime ? (
                         new Date(`${ev.date}T${ev.startTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                      ) : 'TBD'}
                   </span>
                   <span>→</span>
                   <span>
                      {ev.endTime ? (
                         new Date(`${ev.date}T${ev.endTime}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
                      ) : 'TBD'}
                   </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Alerts Section */}
        <div className="lg:col-span-2 bg-amber-500/5 border border-amber-500/10 p-12 squircle-xl space-y-10">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white uppercase tracking-widest flex items-center gap-4">
              <MessageSquare className="w-6 h-6 text-amber-500 fill-amber-500/20" /> Active Alerts
            </h3>
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span className="text-[10px] font-black uppercase text-amber-500 bg-amber-500/10 px-3 py-1.5 rounded-md">Event-Driven Automation</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {alerts.filter(g => g.highestPriority === 1).slice(0, 3).map((group, idx) => (
               <div 
                  key={idx} 
                  onClick={() => navigate(`/project/${group.clientId}`)}
                  className={`p-6 rounded-3xl border flex flex-col gap-4 group hover:bg-white/10 ios-transition cursor-pointer ${group.highestPriority === 1 ? 'border-red-500/20 bg-red-500/5' : group.highestPriority === 2 ? 'border-amber-500/20 bg-amber-500/5' : 'border-primary/20 bg-primary/5'}`}
                >
                  <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                     <AlertCircle className={`w-5 h-5 ${group.highestPriority === 1 ? 'text-red-500' : group.highestPriority === 2 ? 'text-amber-500' : 'text-primary'}`} />
                     <h4 className="text-sm font-black uppercase text-white truncate">{group.projectName}</h4>
                  </div>
                  <ul className="space-y-2">
                     {group.alerts.slice(0, 3).map((a, i) => (
                        <li key={i} className="flex items-start gap-2 text-xs font-bold text-zinc-400">
                           <span className="mt-1 w-1.5 h-1.5 rounded-full bg-white/20 shrink-0" />
                           <span className="truncate">{a.message}</span>
                        </li>
                     ))}
                     {group.alerts.length > 3 && (
                        <li className="text-[10px] font-black uppercase text-zinc-500 tracking-widest pt-2">
                           + {group.alerts.length - 3} more issues
                        </li>
                     )}
                  </ul>
               </div>
            ))}
            {alerts.length > 0 && (
               <div className="col-span-full mt-4 flex justify-end">
                  <button onClick={() => navigate('/coordination')} className="text-[10px] font-black uppercase text-amber-500 hover:text-white transition-colors tracking-widest flex items-center gap-2 bg-amber-500/10 px-4 py-2 rounded-lg">
                     View All Alerts <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
               </div>
            )}
            {alerts.length === 0 && (
              <div className="col-span-full py-10 flex flex-col items-center justify-center">
                 <CheckCircle2 className="w-12 h-12 text-primary mb-4 opacity-50" />
                 <p className="text-[10px] font-black uppercase text-primary tracking-widest">Systems Nominal</p>
              </div>
            )}
          </div>
        </div>

        {/* Events Section */}
        <div className="bg-primary/5 p-12 squircle-xl border border-primary/10 space-y-10 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-white uppercase tracking-widest flex items-center gap-4">
              <CalendarCheck className="w-6 h-6 text-primary" /> Upcoming Events
            </h3>
          </div>
          <div className="space-y-4">
            {upcomingEvents.slice(0, 5).map((ev, idx) => {
              return (
              <div 
                key={ev.id || idx} 
                onClick={() => ev.clientId && navigate(`/project/${ev.clientId}`)}
                className="p-4 bg-white/5 rounded-2xl flex items-center gap-4 border border-white/5 cursor-pointer hover:bg-white/10 transition-all active:scale-[0.98] group"
              >
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-black transition-all">
                   <CalendarCheck className="w-4 h-4" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <p className="text-xs font-black text-white tracking-widest uppercase truncate group-hover:text-blue-400 transition-all">{ev.projectName} • {ev.name}</p>
                  <p className="text-[10px] uppercase text-zinc-500 font-black tracking-widest mt-1 truncate">
                    {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    {ev.venue ? ` • ${ev.venue}` : ''}
                  </p>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-700 opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            )})}
            {eventsCount === 0 && (
               <p className="text-center py-10 text-[10px] font-black uppercase text-zinc-700 tracking-widest">No upcoming events</p>
            )}
          </div>
        </div>
      </div>

      {/* Client Performance Section */}
      <div className="space-y-8">
        <h3 className="text-base font-black text-white uppercase tracking-widest flex items-center gap-4">
          <TrendingUp className="w-6 h-6 text-primary" /> Client Profitability
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {clientProfitData.map((client, idx) => {
            const isLoss = client.profit < 0;
            const isLow = client.profit > 0 && client.profit < 10000;
            return (
              <div key={idx} className="glass-panel p-5 md:p-8 border border-white/5 squircle-xl space-y-5 hover:bg-white/5 transition-all group relative overflow-hidden bg-white/[0.02]">
                <div className={`absolute top-0 right-0 w-1 h-full ${isLoss ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-primary'}`} />
                <div>
                  <h4 className="text-xl font-black text-white uppercase tracking-tight truncate">{client.name}</h4>
                  <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] mt-1.5">Project Performance</p>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                    <span className="text-zinc-500">Revenue</span>
                    <span className="text-white">₹{client.revenue.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest">
                    <span className="text-zinc-500">Expenses</span>
                    <span className="text-zinc-400">₹{client.expenses.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="pt-4 border-t border-white/5 flex justify-between items-end">
                    <div className="flex-1">
                        <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Net Profit</p>
                        <p className={`text-2xl font-black font-mono ${isLoss ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-primary'}`}>
                           ₹{client.profit.toLocaleString('en-IN')}
                        </p>
                    </div>
                    <div className={`p-3 rounded-xl ${isLoss ? 'bg-red-500/10 text-red-500' : isLow ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                        {isLoss ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {clientProfitData.length === 0 && (
            <p className="col-span-full text-center py-20 text-[10px] font-black uppercase text-zinc-700 tracking-widest">No client data available</p>
          )}
        </div>
      </div>

      {/* PROJECT REGISTRIES SECTION */}
      <div className="space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-8">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase flex items-center gap-3">
              <Settings2 className="w-6 h-6 text-zinc-500" /> Project Registries
            </h2>
          </div>
          {isAdmin && (
            <button 
              onClick={() => { setIsEditing(null); setNewDiv({ type: 'Wedding' }); setIsAdding(true); }}
              className="bg-white text-black px-8 py-4 rounded-xl font-black uppercase text-[11px] tracking-widest flex items-center gap-3 hover:bg-zinc-200 transition-all shadow-2xl active:scale-95"
            >
              <Plus className="w-5 h-5" /> Register Projects
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {divisions.map(div => (
            <div 
              key={div.id} 
              onClick={() => navigate(`/ecosystem/brand/${slugify(div.name)}`)}
              className={`glass-panel p-10 relative group overflow-hidden transition-all duration-500 squircle-lg border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] cursor-pointer hover:scale-[1.02] hover:border-white/20 shadow-2xl ${fadingId === div.id ? 'animate-fade-out' : ''}`}
            >
              <div className="absolute top-0 right-0 w-1.5 h-full opacity-40 group-hover:opacity-100 bg-primary" />
              
              <div className="flex justify-between items-start mb-6">
                 <h3 className="font-black text-2xl text-white tracking-tighter leading-none truncate uppercase pr-4 group-hover:text-blue-400 transition-colors uppercase">{div.name}</h3>
                 {isAdmin && (
                    <div className="flex gap-2">
                       <button 
                         onClick={(e) => { e.stopPropagation(); setIsEditing(div); setNewDiv(div); setIsAdding(true); }}
                         className="p-2.5 rounded-xl bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10 transition-all border border-transparent hover:border-white/10"
                       >
                         <Shield className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={(e) => { e.stopPropagation(); setDivToDelete(div); setIsDeleteModalOpen(true); }}
                         className="p-2.5 rounded-xl bg-white/5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/10"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                 )}
              </div>

              <div className="space-y-4">
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 block">{div.type} Operational Registry</span>
                 <button 
                   onClick={(e) => { e.stopPropagation(); navigate(`/ecosystem/brand/${slugify(div.name)}`); }}
                   className="w-full py-4 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white group-hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                 >
                    Deployment View
                    <Shield className="w-3 h-3" />
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-6 backdrop-blur-2xl">
          <div className="bg-zinc-900 border border-white/10 rounded-[2.5rem] w-full max-w-xl p-12 shadow-2xl animate-ios-slide-up">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">{isEditing ? 'Update Registry' : 'Register Projects'}</h2>
              <button onClick={() => { setIsAdding(false); setIsEditing(null); setNewDiv({ type: 'Wedding' }); }} className="p-3 bg-white/5 text-zinc-600 hover:text-white rounded-full transition-all"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmitDivision} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Registry Name</label>
                <input required className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-black text-white outline-none focus:bg-white/10 transition-all" placeholder="e.g. AAHA KALYANAM" value={newDiv.name || ''} onChange={e => setNewDiv({ ...newDiv, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Operational Type</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all"
                  value={newDiv.type || 'Wedding'}
                  onChange={e => setNewDiv({ ...newDiv, type: e.target.value as any })}
                >
                  <option value="Wedding" className="bg-zinc-900 uppercase">Wedding Production</option>
                  <option value="Kids" className="bg-zinc-900 uppercase">Kids / Maternity</option>
                  <option value="Corporate" className="bg-zinc-900 uppercase">Corporate Enterprise</option>
                  <option value="Events" className="bg-zinc-900 uppercase">Special Events</option>
                </select>
              </div>
              <button type="submit" className="w-full py-5 bg-white text-black font-black rounded-2xl text-[11px] uppercase tracking-widest shadow-2xl transition-all">
                {isEditing ? 'Confirm Update' : 'Formalize Deployment'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isDeleteModalOpen && divToDelete && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9999] animate-modal-overlay"
          onClick={() => { setIsDeleteModalOpen(false); setDivToDelete(null); }}
        >
          <div 
            className="bg-zinc-900 border border-white/10 rounded-[3rem] w-full max-w-[400px] p-12 shadow-2xl text-center animate-modal-content m-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase mb-4">Purge Registry?</h2>
            <p className="text-sm text-zinc-500 font-medium mb-10 pb-4 border-b border-white/5 leading-relaxed">
              Caution: This will permanently purge the <span className="text-white font-black">{divToDelete.name}</span> registry. This structural change is irreversible.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDivToDelete(null);
                }}
                className="flex-1 py-5 bg-white/5 text-zinc-500 hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border border-white/5"
              >
                Abort
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-5 bg-red-600 text-white hover:bg-red-500 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                   <>
                     <Loader2 className="w-4 h-4 animate-spin-fast" />
                     Purging...
                   </>
                ) : 'Confirm Purge'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {isAddingClient && createPortal(
        <div 
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={() => setIsAddingClient(false)}
        >
          <div 
            className="w-full max-w-xl bg-zinc-900 border border-white/10 squircle-lg p-10 shadow-2xl animate-ios-slide-up max-h-[90vh] overflow-y-auto no-scrollbar relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">New Client</h2>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] mt-1">Add New Client</p>
              </div>
              <button disabled={isSubmittingClient} onClick={() => {
                setIsAddingClient(false);
              }} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors"><X className="w-6 h-6 text-zinc-400 hover:text-white" /></button>
            </div>

            {formError && (
              <div className="mb-6 bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-[10px] uppercase tracking-widest font-mono text-center">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateClient} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Assign to Project Registry *</label>
                {selectedBrand !== 'All' ? (
                   <div className="w-full glass-panel rounded-xl p-4 text-sm font-bold text-zinc-400 cursor-not-allowed">
                      {companies.find(d => d.id === selectedBrand)?.companyName || selectedBrand}
                      <span className="ml-2 text-[8px] opacity-40">(Locked by Global Filter)</span>
                   </div>
                ) : (
                  <select 
                    className="w-full glass-panel squircle-sm p-4 text-sm font-bold text-white outline-none disabled:opacity-50" 
                    value={clientFormData.companyId || ''} 
                    onChange={e => {
                      const id = e.target.value;
                      const comp = companies.find(d => d.id === id);
                      setClientFormData(prev => ({ ...prev, companyId: id, projectName: comp?.companyName || '' }));
                    }} 
                    disabled={isSubmittingClient}
                  >
                    {companies.length > 1 && <option value="" disabled>Select Registry</option>}
                    {companies.map(d => <option key={d.id} className="bg-zinc-900" value={d.id}>{d.companyName}</option>)}
                  </select>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Client Name *</label>
                <input className="w-full glass-panel squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none disabled:opacity-50" placeholder="e.g. Rahul & Priya" value={clientFormData.name} onChange={e => setClientFormData(prev => ({ ...prev, name: e.target.value }))} disabled={isSubmittingClient} />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Email <span className="opacity-50">(Optional)</span></label>
                <input type="email" className="w-full glass-panel squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none disabled:opacity-50" placeholder="e.g. hello@example.com" value={clientFormData.email} onChange={e => setClientFormData(prev => ({ ...prev, email: e.target.value }))} disabled={isSubmittingClient} />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Project Type *</label>
                <select className="w-full glass-panel squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none disabled:opacity-50" value={clientFormData.projectType} onChange={e => setClientFormData(prev => ({ ...prev, projectType: e.target.value }))} disabled={isSubmittingClient}>
                  <option value="Wedding" className="bg-zinc-900">Luxury Wedding</option>
                  <option value="Kids" className="bg-zinc-900">Kids & Maternity</option>
                  <option value="Corporate" className="bg-zinc-900">Corporate Production</option>
                  <option value="Fashion" className="bg-zinc-900">Fashion Editorial</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Phone <span className="opacity-50">(Optional)</span></label>
                  <input className="w-full glass-panel squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none disabled:opacity-50" placeholder="+91 98765 43210" value={clientFormData.phone} onChange={e => setClientFormData(prev => ({ ...prev, phone: e.target.value }))} disabled={isSubmittingClient} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Event Date <span className="opacity-50">(Optional)</span></label>
                  <input type="date" className="w-full glass-panel squircle-sm p-4 text-sm font-bold text-white focus:border-white/20 outline-none disabled:opacity-50" value={clientFormData.eventDate} onChange={e => setClientFormData(prev => ({ ...prev, eventDate: e.target.value }))} disabled={isSubmittingClient} />
                </div>
              </div>

              <div className="flex gap-4 pt-8 border-t border-white/5">
                <button type="button" disabled={isSubmittingClient} onClick={() => {
                  setIsAddingClient(false);
                }} className="flex-1 py-4 bg-white/5 text-zinc-500 hover:text-white squircle-sm font-black uppercase text-[11px] tracking-widest transition-all disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSubmittingClient} className="flex-1 py-4 bg-white text-black hover:bg-zinc-200 squircle-sm font-black uppercase text-[11px] tracking-widest shadow-xl transition-all disabled:opacity-50">
                  {isSubmittingClient ? 'Saving...' : 'Create Client'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Dashboard;


