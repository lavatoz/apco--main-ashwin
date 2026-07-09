import React, { useMemo, useState, useEffect } from 'react';
import { Calendar, CheckCircle2, IndianRupee, ArrowRight, Circle, Download, Heart } from 'lucide-react';
import type { Client, Invoice, Booking, Project } from '../../types';
import { useNavigate } from 'react-router-dom';
import { calculateProjectWorkflowProgress } from '../../utils/workflowUtils';
import { api } from '../../services/api';
import { getDisplayId } from '../../utils/displayId';

import ClientPageLoader from './ClientPageLoader';

interface ClientDashboardProps {
  client: Client | null;
  invoices: Invoice[];
  bookings: Booking[];
}
const ClientDashboard: React.FC<ClientDashboardProps> = ({ client: propClient, invoices, bookings }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);

  useEffect(() => {
    api.getProjects()
      .then(data => {
        if (data && Array.isArray(data)) {
          setProjects(data);
        }
      })
      .catch(err => {
        console.error("Failed to load projects in ClientDashboard:", err);
      })
      .finally(() => {
        setProjectsLoading(false);
      });
  }, []);

  // --- Derived values computed before early return so useMemo hook below is always called ---
  const isQuote = (i: Invoice) => Boolean(i.isQuotation || i.type === 'quotation' || ['Quotation', 'Draft', 'Approved'].includes(i.status) || (i.id && i.id.startsWith('AK-')));
  const allClientInvoices = propClient ? invoices.filter(i => i.clientId === propClient.id) : [];
  const clientInvoices = allClientInvoices.filter(i => !isQuote(i));
  const clientQuotes = allClientInvoices.filter(i => isQuote(i));
  const clientBookings = propClient ? bookings.filter(b => b.clientId === propClient.id) : [];

  // useMemo MUST be called before any early return (React Rules of Hooks)
  const activities = useMemo(() => {
    if (!propClient) return [];
    return [
      ...clientInvoices.map(inv => ({
        title: inv.status === 'Paid' ? 'Payment Received' : 'Payment Request',
        description: `Invoice ${getDisplayId(inv.invoiceCode, inv.id)} for ₹${inv.totalAmount?.toLocaleString('en-IN')}`,
        date: new Date(inv.createdAt || inv.dueDate || Date.now()),
        type: 'invoice'
      })),
      ...clientQuotes.map(q => ({
        title: q.status === 'Approved' ? 'Proposal Accepted' : 'Proposal Ready',
        description: `Quote ${getDisplayId(q.quotationCode, q.id)} for ₹${q.totalAmount?.toLocaleString('en-IN')}`,
        date: new Date(q.createdAt || q.dueDate || Date.now()),
        type: 'quote'
      })),
      ...clientBookings.map(b => ({
        title: 'Journey Begun',
        description: `Booking for ${b.title || 'Project'}`,
        date: new Date(b.date || Date.now()),
        type: 'quote'
      })),
      ...(propClient.portal?.deliverables || []).map(d => ({
        title: 'New Files Available',
        description: `${d.title} (${d.type})`,
        date: new Date(d.dateAdded || Date.now()),
        type: 'deliverable'
      })),
      ...((propClient.portal as any)?.team || []).map((t: any) => ({
        title: 'Your Team Is Ready',
        description: `${t.name} assigned as ${t.role}`,
        date: new Date(t.date_added || new Date().getTime()),
        type: 'team'
      })),
      ...(propClient.portal?.timeline || []).filter(t => t.status === 'Completed').map(t => ({
        title: 'Milestone Reached',
        description: `${t.title}`,
        date: new Date(t.date || new Date().getTime()),
        type: 'workflow'
      }))
    ].sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [clientInvoices, clientQuotes, clientBookings, propClient]);

  // --- Early return AFTER all hooks ---
  if (!propClient || projectsLoading) return <ClientPageLoader />;

  const client = propClient;

  const totalBalance = clientInvoices.reduce((sum, inv) => sum + ((inv.totalAmount || 0) - (inv.paidAmount || 0)), 0);

  const clientProjects = projects.filter(p => p.clientId === client.id);
  const mainProject = clientProjects[0] || null;
  const progressPercent = calculateProjectWorkflowProgress(mainProject);

  const eventDate = client.eventDate ? new Date(client.eventDate) : null;
  let countdownText = 'Date To Be Decided';
  if (eventDate) {
    const diffTime = eventDate.getTime() - new Date().getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 0) {
      countdownText = `${diffDays} Days Left Until Wedding Day`;
    } else if (diffDays === 0) {
      countdownText = 'Today is the big day!';
    } else {
      countdownText = `${Math.abs(diffDays)} Days Since Wedding Day`;
    }
  }

  const timeline = client.portal?.timeline || [];

  const visibleMilestones: any[] = [];
  let pendingCount = 0;
  for (const t of timeline) {
    if (t.status === 'Completed') {
      visibleMilestones.push({ ...t, isCompleted: true, isNext: false });
    } else {
      if (pendingCount < 3) {
        visibleMilestones.push({ ...t, isCompleted: false, isNext: pendingCount === 0 });
        pendingCount++;
      }
    }
  }
  const completedVisible = visibleMilestones.filter(m => m.isCompleted).slice(-2);
  const pendingVisible = visibleMilestones.filter(m => !m.isCompleted);
  const finalMilestones = [...completedVisible, ...pendingVisible];

  const totalFee = clientInvoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
  const totalPaid = clientInvoices.reduce((sum, inv) => sum + (inv.paidAmount || 0), 0);
  const paymentProgress = totalFee > 0 ? Math.round((totalPaid / totalFee) * 100) : 0;
  const pendingInvoices = clientInvoices.filter(i => i.status !== 'Paid').sort((a, b) => new Date(a.dueDate || Date.now()).getTime() - new Date(b.dueDate || Date.now()).getTime());
  const nextInvoice = pendingInvoices[0];

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
          <h3 className="text-2xl font-black tracking-tight">{eventDate ? eventDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'}</h3>
        </div>

        <div className="glass-panel p-6 squircle-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Heart className="w-24 h-24" /></div>
          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-4">Event Countdown</p>
          <h3 className="text-xl font-black tracking-tight leading-tight">{countdownText}</h3>
        </div>

        <div className="glass-panel p-6 squircle-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><CheckCircle2 className="w-24 h-24" /></div>
          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-4">Planning Progress</p>
          <h3 className="text-2xl font-black tracking-tight">{progressPercent}%</h3>
          <div className="w-full bg-white/5 h-1.5 rounded-full mt-4 overflow-hidden">
            <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
          </div>
        </div>

        <div className="glass-panel p-6 squircle-lg relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><IndianRupee className="w-24 h-24" /></div>
          <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-4">Remaining Balance</p>
          <h3 className={`text-2xl font-black tracking-tight ${totalBalance > 0 ? 'text-amber-500' : 'text-primary'}`}>
            ₹{totalBalance.toLocaleString('en-IN')}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Left: Recent Updates */}
        <div className="glass-panel p-8 squircle-lg">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-black uppercase tracking-widest">Recent Updates</h2>
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
                <div className={`w-2 h-2 mt-2 rounded-full ${item.type === 'invoice' ? 'bg-primary' : item.type === 'quote' ? 'bg-primary' : item.type === 'deliverable' ? 'bg-purple-500' : 'bg-amber-500'}`} />
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

        {/* Top Right: Your Gallery & Files */}
        <div className="glass-panel p-8 squircle-lg">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-black uppercase tracking-widest">Your Deliverables</h2>
            <button
              onClick={() => navigate('/deliverables')}
              className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
            >
              View Files <ArrowRight className="w-3 h-3" />
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
                <Download className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors" />
              </div>
            ))}
            {(!client.portal?.deliverables || client.portal.deliverables.length === 0) && (
              <div className="py-8 text-center border border-dashed border-white/5 rounded-2xl">
                <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">No files available yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Left: Upcoming Milestones */}
        <div className="glass-panel p-8 squircle-lg">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-black uppercase tracking-widest">Upcoming Milestones</h2>
            <button
              onClick={() => navigate('/timeline')}
              className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
            >
              Full Journey <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          <div className="space-y-4">
            {finalMilestones.map((m, i) => (
              <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border transition-colors ${m.isCompleted ? 'bg-white/5 border-transparent opacity-75' : m.isNext ? 'bg-primary/10 border-primary/20' : 'bg-transparent border-white/5'}`}>
                {m.isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                ) : m.isNext ? (
                  <Circle className="w-5 h-5 text-emerald-400 fill-emerald-500/20 shrink-0 animate-pulse" />
                ) : (
                  <Circle className="w-5 h-5 text-zinc-600 shrink-0" />
                )}
                <div>
                  <h4 className={`text-sm font-bold ${m.isNext ? 'text-white' : 'text-zinc-300'}`}>{m.title}</h4>
                  {m.date && m.isCompleted && <p className="text-[10px] text-zinc-500 mt-1">{new Date(m.date).toLocaleDateString('en-IN')}</p>}
                </div>
              </div>
            ))}
            {finalMilestones.length === 0 && (
              <div className="py-8 text-center border border-dashed border-white/5 rounded-2xl">
                <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Your journey is taking shape</p>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Right: Payment Status */}
        <div className="glass-panel p-8 squircle-lg flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-black uppercase tracking-widest">Payment Status</h2>
            <button
              onClick={() => navigate('/invoices')}
              className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white flex items-center gap-1 transition-colors"
            >
              View Invoices <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="mb-8">
            <div className="flex items-end justify-between mb-2">
              <div>
                <p className="text-xs font-bold text-zinc-400">Payment Progress</p>
                <h3 className="text-xl font-black mt-1">₹{totalPaid.toLocaleString('en-IN')} <span className="text-sm text-zinc-500 font-medium">Paid of ₹{totalFee.toLocaleString('en-IN')}</span></h3>
              </div>
              <p className="text-lg font-black text-primary">{paymentProgress}%</p>
            </div>
            <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
              <div className="bg-primary h-full rounded-full transition-all duration-1000" style={{ width: `${paymentProgress}%` }} />
            </div>
          </div>

          <div className="mt-auto">
            {nextInvoice ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Next Payment</p>
                <div className="flex justify-between items-center">
                  <h4 className="text-lg font-black">₹{((nextInvoice.totalAmount || 0) - (nextInvoice.paidAmount || 0)).toLocaleString('en-IN')} <span className="text-xs text-amber-500/70 font-medium uppercase tracking-widest ml-1">Due</span></h4>
                  <p className="text-xs font-bold text-amber-100">{nextInvoice.dueDate ? new Date(nextInvoice.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Pending'}</p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20 text-center">
                <CheckCircle2 className="w-6 h-6 text-primary mx-auto mb-2" />
                <p className="text-sm font-bold text-emerald-100">All payments are up to date</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;

