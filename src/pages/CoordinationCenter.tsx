import React, { useState, useMemo, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, List, Users, Bell,
  AlertTriangle, Clock, CheckCircle2,
  Search, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { type Task, type Client, type Invoice, type CompanyProfile } from '../types';
import { safeParse } from '../utils/storage';
import { generateGroupedAlerts, type AlertCategory, type AlertPriority } from '../utils/alertEngine';
import { api } from '../services/api';

interface CoordinationCenterProps {
  tasks: Task[];
  clients: Client[];
  invoices: Invoice[];
  companies: CompanyProfile[];
  selectedBrand: string | 'All';
  onSaveTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
}

const CoordinationCenter: React.FC<CoordinationCenterProps> = ({
  clients, invoices, companies, selectedBrand
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'events' | 'calendar' | 'staff' | 'alerts'>('overview');
  const navigate = useNavigate();

  // Calendar State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarView, setCalendarView] = useState<'Month' | 'Week' | 'Agenda'>('Month');

  // Load Staff & Projects
  const users = useMemo(() => safeParse<any[]>('users', []), []);
  const [projects, setProjects] = useState<any[]>([]);
  const staff = users.filter(u => u.role === 'Staff');

  useEffect(() => {
    let active = true;
    const fetchProjects = async () => {
      try {
        const data = await api.getProjects();
        if (active) setProjects(data);
      } catch (err) {
        console.error("Failed to fetch projects in CoordinationCenter:", err);
      }
    };
    fetchProjects();
    return () => { active = false; };
  }, []);

  // Filter Clients
  const filteredClients = useMemo(() => {
     return selectedBrand === 'All' ? clients : clients.filter(c => c.brand === selectedBrand);
  }, [clients, selectedBrand]);

  // Alert Filters State
  const [alertSearch, setAlertSearch] = useState('');
  const [alertCategory, setAlertCategory] = useState<AlertCategory | 'All'>('All');
  const [alertPriority, setAlertPriority] = useState<AlertPriority | 'All'>('All');

  // Calculate Global Event Data
  const allEvents = useMemo(() => {
    const events: any[] = [];
    filteredClients.forEach(c => {
      if (c.events && c.events.length > 0) {
        c.events.forEach(ev => {
          events.push({
            ...ev,
            clientId: c.id || c._id,
            clientName: c.name,
            brand: c.brand
          });
        });
      } else if (c.eventDate || c.weddingDate) {
         events.push({
            id: c.id + '_legacy',
            name: c.projectName || 'Main Event',
            date: c.eventDate || c.weddingDate,
            status: 'Scheduled',
            clientId: c.id || c._id,
            clientName: c.name,
            brand: c.brand
         });
      }
    });
    return events.filter(e => selectedBrand === 'All' || e.brand === (companies.find(comp => comp.id === selectedBrand)?.companyName));
  }, [filteredClients, selectedBrand, companies]);

  const thisWeekEvents = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);
    
    return allEvents.filter(e => {
      const d = new Date(e.date);
      return d >= now && d <= nextWeek;
    }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [allEvents]);

  const thisMonthEvents = useMemo(() => {
    const now = new Date();
    return allEvents.filter(e => {
      const d = new Date(e.date);
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  }, [allEvents]);



  // Calculate KPIs
  const pendingApprovalsCount = useMemo(() => {
    const relevantInvoices = invoices.filter(i => selectedBrand === 'All' || i.brandId === selectedBrand);
    return relevantInvoices.filter(i => (i.status as string) === 'pending' || (i.status as string) === 'Pending' || (i.status as string) === 'Needs Approval').length;
  }, [invoices, selectedBrand]);



  const teamUtilizationPercent = useMemo(() => {
    if (staff.length === 0) return 0;
    // Mock logic for team utilization based on assignments
    const assignedStaff = staff.filter(s => s.staffRole !== 'General Staff').length;
    return Math.round((assignedStaff / staff.length) * 100);
  }, [staff]);

  // Alerts Engine
  const groupedAlerts = useMemo(() => {
     return generateGroupedAlerts(filteredClients, projects, invoices, new Date());
  }, [filteredClients, projects, invoices]);

  const totalAlertsCount = useMemo(() => {
     return groupedAlerts.reduce((acc, g) => acc + g.alerts.length, 0);
  }, [groupedAlerts]);

  // Filter Alerts
  const filteredAlerts = useMemo(() => {
     return groupedAlerts.map(group => {
        const filteredGroupAlerts = group.alerts.filter(a => {
           const matchesCat = alertCategory === 'All' || a.category === alertCategory;
           const matchesPri = alertPriority === 'All' || a.priority === alertPriority;
           return matchesCat && matchesPri;
        });


        return {
           ...group,
           alerts: filteredGroupAlerts,
           // Recalculate highest priority for sorting
           highestPriority: filteredGroupAlerts.reduce<number>((min, a) => Math.min(min, a.priority), 3) as unknown as AlertPriority
        };
     }).filter(group => group.alerts.length > 0 && (alertSearch.trim() === '' || group.projectName.toLowerCase().includes(alertSearch.toLowerCase()) || group.clientName.toLowerCase().includes(alertSearch.toLowerCase())))
     .sort((a, b) => a.highestPriority - b.highestPriority);
  }, [groupedAlerts, alertCategory, alertPriority, alertSearch]);

  // Render Functions
  const renderOverview = () => (
    <div className="space-y-8 animate-ios-slide-up">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="glass-panel p-4 squircle-sm border border-white/5 relative overflow-hidden group">
          <CalendarIcon className="w-10 h-10 absolute -right-2 -bottom-2 text-white/5 group-hover:scale-110 transition-transform" />
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Events This Week</p>
          <h3 className="text-2xl font-black">{thisWeekEvents.length}</h3>
        </div>
        <div className="glass-panel p-4 squircle-sm border border-white/5 relative overflow-hidden group">
          <Clock className="w-10 h-10 absolute -right-2 -bottom-2 text-white/5 group-hover:scale-110 transition-transform" />
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Events This Month</p>
          <h3 className="text-2xl font-black">{thisMonthEvents.length}</h3>
        </div>
        <div className="glass-panel p-4 squircle-sm border border-white/5 relative overflow-hidden group">
          <CheckCircle2 className="w-10 h-10 absolute -right-2 -bottom-2 text-white/5 group-hover:scale-110 transition-transform" />
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Pending Approvals</p>
          <h3 className="text-2xl font-black text-amber-500">{pendingApprovalsCount}</h3>
        </div>
        <div className="glass-panel p-4 squircle-sm border border-white/5 relative overflow-hidden group">
          <Bell className="w-10 h-10 absolute -right-2 -bottom-2 text-white/5 group-hover:scale-110 transition-transform" />
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Active Alerts</p>
          <h3 className="text-2xl font-black text-red-500">{totalAlertsCount}</h3>
        </div>
        <div className="glass-panel p-4 squircle-sm border border-white/5 relative overflow-hidden group">
          <Users className="w-10 h-10 absolute -right-2 -bottom-2 text-white/5 group-hover:scale-110 transition-transform" />
          <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-1">Team Utilization</p>
          <h3 className="text-2xl font-black text-primary">{teamUtilizationPercent}%</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-panel p-6 squircle-lg border border-white/5">
          <h2 className="text-xs font-black uppercase tracking-widest mb-6">Events This Week</h2>
          <div className="space-y-2">
            {thisWeekEvents.slice(0, 10).map((ev, i) => (
              <div key={i} onClick={() => navigate('/client/' + ev.clientId)} className="flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-transparent hover:border-white/10 cursor-pointer">
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white">{ev.name}</h4>
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">{ev.clientName}</p>
                </div>
                <div className="flex-1 text-center hidden sm:block">
                  <span className="text-xs font-bold text-zinc-300">{new Date(ev.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                </div>
                <div className="flex-1 text-center">
                  <span className="px-2 py-1 bg-white/5 text-[9px] font-bold uppercase tracking-widest rounded-full text-zinc-400">0 Staff Assigned</span>
                </div>
                <div className="flex-1 text-right">
                   <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full ${ev.status === 'Ready' ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-500'}`}>
                     {ev.status || 'Scheduled'}
                   </span>
                </div>
              </div>
            ))}
            {thisWeekEvents.length === 0 && (
               <div className="py-8 text-center text-zinc-500 text-xs font-bold uppercase tracking-widest border border-dashed border-white/10 rounded-xl">
                  No events this week
               </div>
            )}
          </div>
        </div>

        <div className="glass-panel p-6 squircle-lg border border-white/5 flex flex-col justify-between">
           <div>
              <h2 className="text-xs font-black uppercase tracking-widest mb-6 flex items-center justify-between">
                 Action Required <span className="px-2 py-1 bg-red-500 text-white rounded-full text-[9px]">{totalAlertsCount}</span>
              </h2>
              <div className="space-y-3">
                {groupedAlerts.slice(0, 5).map((group, i) => (
                   <div key={i} className={`p-4 rounded-xl border flex flex-col gap-2 ${group.highestPriority === 1 ? 'bg-red-500/10 border-red-500/20 text-red-500' : group.highestPriority === 2 ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-primary/10 border-primary/20 text-primary'}`}>
                      <div className="flex justify-between items-start">
                         <h4 className="text-xs font-black uppercase tracking-widest truncate">{group.projectName}</h4>
                         <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-black/20">{group.alerts.length}</span>
                      </div>
                      <p className="text-[10px] font-bold opacity-80 truncate">{group.alerts[0].message} {group.alerts.length > 1 ? '...' : ''}</p>
                   </div>
                ))}
                {groupedAlerts.length === 0 && (
                  <div className="py-8 text-center text-primary flex flex-col items-center justify-center">
                     <CheckCircle2 className="w-8 h-8 mb-2" />
                     <span className="text-[10px] font-black uppercase tracking-widest">All Clear</span>
                  </div>
                )}
              </div>
           </div>
           {groupedAlerts.length > 0 && (
              <button onClick={() => setActiveTab('alerts')} className="w-full mt-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white transition-all flex justify-center items-center gap-2">
                 View Alerts Dashboard <ChevronRight className="w-3 h-3" />
              </button>
           )}
        </div>
      </div>
    </div>
  );

  const renderStaff = () => (
    <div className="glass-panel p-6 squircle-lg border border-white/5 animate-ios-slide-up">
      <h2 className="text-xs font-black uppercase tracking-widest mb-6">Staff Allocation</h2>
      <div className="w-full overflow-x-auto">
         <table className="w-full text-left border-collapse">
            <thead>
               <tr className="border-b border-white/10">
                  <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Staff Name</th>
                  <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Role</th>
                  <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Events Assigned</th>
                  <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Availability</th>
               </tr>
            </thead>
            <tbody>
               {staff.map((user, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                     <td className="py-4 px-4 text-sm font-bold">{user.name}</td>
                     <td className="py-4 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">{user.staffRole || 'General Staff'}</td>
                     <td className="py-4 px-4 text-xs font-bold text-zinc-300">0 Events</td>
                     <td className="py-4 px-4">
                        <span className="px-2 py-1 bg-primary/10 text-primary text-[9px] font-black uppercase tracking-widest rounded-full">Available</span>
                     </td>
                  </tr>
               ))}
               {staff.length === 0 && (
                  <tr>
                     <td colSpan={4} className="py-8 text-center text-zinc-500 text-xs font-bold uppercase tracking-widest">No staff members found</td>
                  </tr>
               )}
            </tbody>
         </table>
      </div>
    </div>
  );

  const renderEventsList = () => (
    <div className="glass-panel p-6 squircle-lg border border-white/5 animate-ios-slide-up">
      <h2 className="text-xs font-black uppercase tracking-widest mb-6">All Events Master List</h2>
      <div className="w-full overflow-x-auto">
         <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
               <tr className="border-b border-white/10">
                  <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Event</th>
                  <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Client</th>
                  <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Date</th>
                  <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Status</th>
                  <th className="py-3 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Assigned Team</th>
               </tr>
            </thead>
            <tbody>
               {allEvents.map((ev, idx) => (
                  <tr key={idx} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                     <td className="py-4 px-4 text-sm font-bold">{ev.name}</td>
                     <td className="py-4 px-4 text-xs font-bold text-zinc-400">{ev.clientName}</td>
                     <td className="py-4 px-4 text-xs font-bold text-zinc-300">{new Date(ev.date).toLocaleDateString('en-IN')}</td>
                     <td className="py-4 px-4">
                        <span className="px-2 py-1 bg-white/5 text-zinc-300 text-[9px] font-black uppercase tracking-widest rounded-full">{ev.status || 'Scheduled'}</span>
                     </td>
                     <td className="py-4 px-4 text-xs font-bold text-zinc-500">Pending Assignment</td>
                  </tr>
               ))}
               {allEvents.length === 0 && (
                  <tr>
                     <td colSpan={5} className="py-8 text-center text-zinc-500 text-xs font-bold uppercase tracking-widest">No events registered</td>
                  </tr>
               )}
            </tbody>
         </table>
      </div>
    </div>
  );

  const renderAlerts = () => (
    <div className="glass-panel p-6 md:p-10 squircle-lg border border-white/5 animate-ios-slide-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
         <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
            <Bell className="w-6 h-6 text-amber-500" />
            System Alerts Registry
         </h2>
         <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
               <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
               <input 
                  type="text" 
                  placeholder="Search clients..." 
                  value={alertSearch}
                  onChange={(e) => setAlertSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white font-bold placeholder:text-zinc-600 outline-none focus:border-amber-500/50"
               />
            </div>
            <select 
               value={alertCategory} 
               onChange={(e) => setAlertCategory(e.target.value as any)}
               className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest text-white outline-none"
            >
               <option value="All" className="bg-zinc-900">All Categories</option>
               <option value="Payments" className="bg-zinc-900">Payments</option>
               <option value="Team Allocation" className="bg-zinc-900">Team</option>
               <option value="Agreements" className="bg-zinc-900">Agreements</option>
               <option value="Deliverables" className="bg-zinc-900">Deliverables</option>
               <option value="Logistics" className="bg-zinc-900">Logistics</option>
            </select>
            <select 
               value={alertPriority} 
               onChange={(e) => setAlertPriority(e.target.value === 'All' ? 'All' : Number(e.target.value) as any)}
               className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest text-white outline-none"
            >
               <option value="All" className="bg-zinc-900">All Priorities</option>
               <option value="1" className="bg-zinc-900">Critical</option>
               <option value="2" className="bg-zinc-900">Warning</option>
               <option value="3" className="bg-zinc-900">Info</option>
            </select>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         {filteredAlerts.map((group, i) => (
            <div key={i} className={`p-6 rounded-3xl border flex flex-col gap-4 bg-white/5 ${group.highestPriority === 1 ? 'border-red-500/20' : group.highestPriority === 2 ? 'border-amber-500/20' : 'border-primary/20'}`}>
               <div className="flex justify-between items-start border-b border-white/5 pb-4">
                  <div>
                     <h3 className="text-lg font-black uppercase tracking-tight text-white">{group.projectName}</h3>
                     <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">{group.clientName}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${group.highestPriority === 1 ? 'bg-red-500/10 text-red-500' : group.highestPriority === 2 ? 'bg-amber-500/10 text-amber-500' : 'bg-primary/10 text-primary'}`}>
                     {group.highestPriority === 1 ? 'Critical' : group.highestPriority === 2 ? 'Warning' : 'Info'}
                  </span>
               </div>
               <ul className="space-y-3">
                  {group.alerts.map((a, idx) => (
                     <li key={idx} className="flex items-start gap-3">
                        <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${a.priority === 1 ? 'text-red-500' : a.priority === 2 ? 'text-amber-500' : 'text-primary'}`} />
                        <div>
                           <p className="text-xs font-bold text-white">{a.message}</p>
                           <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mt-1">{a.category}</p>
                        </div>
                     </li>
                  ))}
               </ul>
            </div>
         ))}
         {filteredAlerts.length === 0 && (
            <div className="col-span-full py-20 text-center flex flex-col items-center justify-center border border-dashed border-white/10 rounded-3xl">
               <CheckCircle2 className="w-16 h-16 mb-4 text-primary opacity-50" />
               <h3 className="text-xl font-black tracking-tight text-white uppercase">No Alerts Found</h3>
               <p className="text-xs font-bold text-zinc-500 mt-2">Adjust your filters or take a break!</p>
            </div>
         )}
      </div>
    </div>
  );

  const renderCustomCalendar = () => {
    const handlePrev = () => {
       if (calendarView === 'Month') {
          setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
       } else if (calendarView === 'Week') {
          setCurrentDate(new Date(currentDate.getTime() - 7 * 24 * 60 * 60 * 1000));
       }
    };

    const handleNext = () => {
       if (calendarView === 'Month') {
          setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
       } else if (calendarView === 'Week') {
          setCurrentDate(new Date(currentDate.getTime() + 7 * 24 * 60 * 60 * 1000));
       }
    };

    const handleToday = () => setCurrentDate(new Date());

    const title = calendarView === 'Month' 
      ? currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
      : calendarView === 'Week' 
         ? `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
         : 'Agenda View';

    const getDaysForMonth = () => {
      const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
      const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
      
      const days = [];
      for (let i = 0; i < firstDay; i++) days.push(null);
      for (let i = 1; i <= daysInMonth; i++) days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));
      return days;
    };

    const getDaysForWeek = () => {
       const days = [];
       const currentDay = currentDate.getDay();
       const startOfWeek = new Date(currentDate);
       startOfWeek.setDate(currentDate.getDate() - currentDay);
       for(let i=0; i<7; i++) {
          const d = new Date(startOfWeek);
          d.setDate(startOfWeek.getDate() + i);
          days.push(d);
       }
       return days;
    };

    const isDateToday = (d: Date) => d && d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];
    
    // Check if a date has any critical alerts
    const hasCriticalAlerts = (dateEvents: any[]) => {
       return dateEvents.some(ev => {
          const group = groupedAlerts.find(g => g.clientName === ev.clientName);
          return group && group.highestPriority === 1;
       });
    };

    // Calculate next 7 days for "upcoming" highlight
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);
    const isUpcoming = (d: Date) => d && d >= today && d <= nextWeek;

    return (
       <div className="glass-panel p-6 squircle-lg border border-white/5 animate-ios-slide-up">
           <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-6">
                 {calendarView !== 'Agenda' && (
                   <div className="flex items-center gap-3">
                      <button onClick={handlePrev} className="px-3 py-1.5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-xs font-black uppercase tracking-widest text-zinc-300">
                         &lt; {calendarView === 'Month' ? new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1).toLocaleDateString('en-US', { month: 'short' }) : 'Prev'}
                      </button>
                      <h2 className="text-xl font-black uppercase tracking-widest min-w-[150px] text-center">{title}</h2>
                      <button onClick={handleNext} className="px-3 py-1.5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors text-xs font-black uppercase tracking-widest text-zinc-300">
                         {calendarView === 'Month' ? new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1).toLocaleDateString('en-US', { month: 'short' }) : 'Next'} &gt;
                      </button>
                      <div className="w-px h-6 bg-white/10 mx-2" />
                      <button onClick={handleToday} className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-colors">
                         [ Today ]
                      </button>
                   </div>
                 )}
                 {calendarView === 'Agenda' && (
                    <h2 className="text-xl font-black uppercase tracking-widest">{title}</h2>
                 )}
              </div>
             
             <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1 border border-white/10">
                {['Month', 'Week', 'Agenda'].map((view) => (
                   <button 
                      key={view}
                      onClick={() => setCalendarView(view as any)}
                      className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                         calendarView === view ? 'bg-white/10 text-white' : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                   >
                      {view}
                   </button>
                ))}
             </div>
          </div>
          
          {calendarView === 'Agenda' ? (
             <div className="space-y-4">
                {allEvents
                   .filter(e => new Date(e.date) >= new Date(new Date().setHours(0,0,0,0)))
                   .sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                   .slice(0, 20)
                   .map((ev, i) => {
                      const isCrit = groupedAlerts.some(g => g.clientName === ev.clientName && g.highestPriority === 1);
                      return (
                         <div key={i} onClick={() => navigate('/client/' + ev.clientId)} className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 transition-colors rounded-xl border border-transparent hover:border-white/10 cursor-pointer group">
                            <div className="flex-1">
                               <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">{ev.name}</h4>
                               <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-0.5">{ev.clientName}</p>
                            </div>
                            <div className="flex-1 text-center">
                               <span className="text-xs font-bold text-zinc-300">{new Date(ev.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
                            </div>
                            <div className="flex-1 text-right">
                               {isCrit && <span className="px-2 py-1 bg-red-500/10 text-[9px] font-bold uppercase tracking-widest rounded-full text-red-500 mr-2">Critical</span>}
                               <span className={`px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-full ${ev.status === 'Ready' ? 'bg-primary/10 text-primary' : 'bg-amber-500/10 text-amber-500'}`}>
                                 {ev.status || 'Scheduled'}
                               </span>
                            </div>
                         </div>
                      );
                   })}
             </div>
          ) : (
             <div className="grid grid-cols-7 gap-2 md:gap-4">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                   <div key={d} className="text-center text-[10px] font-black uppercase tracking-widest text-zinc-500 pb-2 border-b border-white/10">{d}</div>
                ))}
                
                {(calendarView === 'Month' ? getDaysForMonth() : getDaysForWeek()).map((date, i) => {
                   if (!date) return <div key={i} className="h-24 md:h-32 rounded-xl bg-transparent" />;
                   
                   const isToday = isDateToday(date);
                   const isUpc = isUpcoming(date);
                   const dayEvents = allEvents.filter(e => e.date && new Date(e.date).toISOString().split('T')[0] === date.toISOString().split('T')[0]);
                   const isCritical = hasCriticalAlerts(dayEvents);
                   
                   let borderClass = 'border-white/5 hover:border-white/20';
                   if (isToday) borderClass = 'border-primary/50';
                   else if (isCritical) borderClass = 'border-red-500/50';
                   else if (isUpc && dayEvents.length > 0) borderClass = 'border-amber-500/30';
                   
                   return (
                      <div key={i} className={`h-24 md:h-32 p-2 rounded-xl border transition-all flex flex-col ${isToday ? 'bg-primary/10' : isCritical ? 'bg-red-500/5' : 'bg-white/5 hover:bg-white/10'} ${borderClass}`}>
                         <div className="flex justify-between items-start mb-1">
                            <span className={`text-xs font-bold ${isToday ? 'text-primary' : isCritical ? 'text-red-400' : 'text-zinc-400'}`}>
                               {date.getDate()}
                            </span>
                            {dayEvents.length > 0 && <span className={`w-2 h-2 rounded-full ${isCritical ? 'bg-red-500' : isToday ? 'bg-primary' : 'bg-amber-500'}`} />}
                         </div>
                          <div className="flex-1 space-y-2 overflow-y-auto no-scrollbar">
                             {dayEvents.map((ev, idx) => (
                                <div 
                                   key={idx} 
                                   onClick={() => navigate('/client/' + ev.clientId)}
                                   className="flex flex-col gap-1 p-2 bg-black/40 hover:bg-black/60 rounded-md cursor-pointer transition-colors border border-white/5 group"
                                >
                                   <div className="flex justify-between items-start gap-2">
                                     <span className="text-[9px] font-black uppercase text-white truncate leading-tight group-hover:text-amber-400 transition-colors">
                                        {ev.clientName}
                                     </span>
                                     <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${ev.status === 'Ready' ? 'bg-primary' : 'bg-amber-500'}`} title="Team Status Indicator" />
                                   </div>
                                   <div className="text-[8px] font-bold uppercase text-zinc-400 truncate">
                                      {ev.name || 'Event'}
                                   </div>
                                   <div className="text-[8px] font-black uppercase text-zinc-500 border-t border-white/5 pt-1 mt-1 truncate">
                                      {new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                   </div>
                                </div>
                             ))}
                          </div>
                      </div>
                   );
                })}
             </div>
          )}
       </div>
    );
  };

  return (
    <div className="space-y-8 animate-ios-slide-up max-w-[1600px] mx-auto pb-24">
      {/* Header */}
      <div>
        <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">
          Operations Center
        </h1>
        <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] mt-2">
          Enterprise Event Coordination
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 border-b border-white/10">
        {[
          { id: 'overview', label: 'Overview', icon: List },
          { id: 'events', label: 'Events List', icon: List },
          { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
          { id: 'staff', label: 'Staff Allocation', icon: Users },
          { id: 'alerts', label: 'Alerts', icon: Bell }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                isActive ? 'bg-white text-black' : 'bg-transparent text-zinc-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
              {tab.id === 'alerts' && totalAlertsCount > 0 && (
                <span className="ml-1 w-4 h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[8px]">{totalAlertsCount}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'events' && renderEventsList()}
        {activeTab === 'calendar' && renderCustomCalendar()}
        {activeTab === 'staff' && renderStaff()}
        {activeTab === 'alerts' && renderAlerts()}
      </div>
    </div>
  );
};

export default CoordinationCenter;


