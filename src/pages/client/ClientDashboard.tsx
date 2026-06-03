import React, { useMemo } from 'react';
import { Calendar, CheckCircle2, IndianRupee, Clock, ArrowRight } from 'lucide-react';
import type { Client, Invoice, Booking, Project } from '../../types';
import { useNavigate } from 'react-router-dom';
import { getWorkflowProgress, normalizeWorkflowStage, getNextWorkflowStage } from '../../utils/workflowUtils';

interface ClientDashboardProps {
  client: Client | null;
  invoices: Invoice[];
  bookings: Booking[];
}
const ClientDashboard: React.FC<ClientDashboardProps> = ({ client: propClient, invoices, bookings }) => {
  const navigate = useNavigate();
  if (!propClient) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest">No project data available</p>
      </div>
    );
  }

  const client = propClient;

  const isQuote = (i: Invoice) => Boolean(i.isQuotation || i.type === 'quotation' || ['Quotation', 'Draft', 'Approved'].includes(i.status) || (i.id && i.id.startsWith('AK-')));
  
  const allClientInvoices = invoices.filter(i => i.clientId === client.id);
  const clientInvoices = allClientInvoices.filter(i => !isQuote(i));
  const clientQuotes = allClientInvoices.filter(i => isQuote(i));
  
  const clientBookings = bookings.filter(b => b.clientId === client.id);
  
  const totalBalance = clientInvoices.reduce((sum, inv) => sum + ((inv.totalAmount || 0) - (inv.paidAmount || 0)), 0);

  const allProjects: Project[] = JSON.parse(localStorage.getItem('projects') || '[]');
  const clientProjects = allProjects.filter(p => p.clientId === client.id);
  const mainProject = clientProjects[0] || null;

  const currentStage = normalizeWorkflowStage(mainProject?.stage);
  const progressPercent = getWorkflowProgress(currentStage);
  const nextStage = getNextWorkflowStage(currentStage);

  const activities = useMemo(() => [
    ...clientInvoices.map(inv => ({
      title: inv.status === 'Paid' ? 'Invoice Paid' : 'Invoice Generated',
      description: `Invoice ${inv.id} for ₹${inv.totalAmount?.toLocaleString('en-IN')}`,
      date: new Date(inv.createdAt || inv.dueDate || Date.now()),
      type: 'invoice'
    })),
    ...clientQuotes.map(q => ({
      title: q.status === 'Approved' ? 'Quote Approved' : 'Quote Created',
      description: `Quote ${q.id} for ₹${q.totalAmount?.toLocaleString('en-IN')}`,
      date: new Date(q.createdAt || q.dueDate || Date.now()),
      type: 'quote'
    })),
    ...clientBookings.map(b => ({
      title: 'Booking Created',
      description: `Booking for ${b.title || 'Project'}`,
      date: new Date(b.date || Date.now()),
      type: 'quote'
    })),
    ...(client.portal?.deliverables || []).map(d => ({
       title: 'Deliverable Uploaded',
       description: `${d.title} (${d.type})`,
       date: new Date(d.dateAdded || Date.now()),
       type: 'deliverable'
    })),
    ...((client.portal as any)?.team || []).map((t: any) => ({
       title: 'Team Assigned',
       description: `${t.name} assigned as ${t.role}`,
       date: new Date(t.date_added || new Date().getTime()),
       type: 'team'
    })),
    ...(client.portal?.timeline || []).filter(t => t.status === 'Completed').map(t => ({
       title: 'Workflow Updated',
       description: `Milestone completed: ${t.title}`,
       date: new Date(t.date || new Date().getTime()),
       type: 'workflow'
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime()), [clientInvoices, clientQuotes, clientBookings, client]);

  return (
    <div className="p-8 md:p-12 animate-ios-slide-up max-w-[1400px] mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">Welcome Back,</h1>
        <p className="text-xl text-zinc-400 font-medium">{client.name || client.projectName}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="glass-panel p-6 squircle-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Calendar className="w-24 h-24" /></div>
          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-4">Event Date</p>
          <h3 className="text-2xl font-black tracking-tight">{client.eventDate ? new Date(client.eventDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}</h3>
        </div>

        <div className="glass-panel p-6 squircle-lg relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><CheckCircle2 className="w-24 h-24" /></div>
           <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-4">Project Progress</p>
           <h3 className="text-2xl font-black tracking-tight">{progressPercent}%</h3>
           <div className="w-full bg-white/5 h-1.5 rounded-full mt-4 overflow-hidden">
             <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
           </div>
        </div>

        <div className="glass-panel p-6 squircle-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><IndianRupee className="w-24 h-24" /></div>
          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-4">Outstanding Balance</p>
          <h3 className={`text-2xl font-black tracking-tight ${totalBalance > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
            ₹{totalBalance.toLocaleString('en-IN')}
          </h3>
        </div>

        <div className="glass-panel p-6 squircle-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Clock className="w-24 h-24" /></div>
          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-4">Current Stage</p>
          <h3 className="text-xl font-black tracking-tight uppercase leading-tight mb-2">{currentStage}</h3>
          {nextStage && <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Next: {nextStage}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-8 squircle-lg">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-black uppercase tracking-widest">Recent Activity</h2>
            <button 
              onClick={() => navigate('/timeline')}
              className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
            >
              View All <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-6">
            {activities.slice(0, 4).map((item, i) => (
              <div key={i} className="flex gap-4 items-start group">
                <div className={`w-2 h-2 mt-2 rounded-full ${item.type === 'invoice' ? 'bg-emerald-500' : item.type === 'quote' ? 'bg-blue-500' : item.type === 'deliverable' ? 'bg-purple-500' : 'bg-amber-500'}`} />
                <div>
                  <h4 className="text-sm font-bold">{item.title}</h4>
                  <p className="text-xs text-zinc-500 mt-1">{item.description}</p>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
               <div className="py-8 text-center border border-dashed border-white/5 rounded-2xl">
                 <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">No activities recorded yet</p>
               </div>
            )}
          </div>
        </div>

        <div className="glass-panel p-8 squircle-lg">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-black uppercase tracking-widest">Available Deliverables</h2>
            <button className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white flex items-center gap-1 transition-colors">
              Go to Deliverables <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-4">
            {(client.portal?.deliverables || []).slice(0, 3).map((d, i) => (
              <div key={i} className="p-4 bg-white/5 rounded-2xl flex items-center justify-between group hover:bg-white/10 transition-colors cursor-pointer">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-black/50 flex items-center justify-center">
                       {d.type === 'Video' ? '🎥' : d.type === 'Photos' ? '📸' : '📄'}
                    </div>
                    <div>
                       <h4 className="text-sm font-bold group-hover:text-blue-400 transition-colors">{d.title}</h4>
                       <p className="text-[10px] uppercase tracking-widest text-zinc-500 mt-1">{d.type}</p>
                    </div>
                 </div>
                 <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors transform group-hover:translate-x-1" />
              </div>
            ))}
            {(!client.portal?.deliverables || client.portal.deliverables.length === 0) && (
               <div className="py-8 text-center border border-dashed border-white/5 rounded-2xl">
                 <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">No deliverables available</p>
               </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
