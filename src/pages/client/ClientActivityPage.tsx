import React from 'react';
import { ArrowLeft, CheckCircle2, Clock, IndianRupee, Package, Users, Video } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Client, Invoice, Booking } from '../../types';
import ClientPageLoader from './ClientPageLoader';
import { getDisplayId } from '../../utils/displayId';

interface ClientActivityPageProps {
  client: Client | null;
  invoices: Invoice[];
  bookings: Booking[];
}

const ClientActivityPage: React.FC<ClientActivityPageProps> = ({ client, invoices, bookings }) => {
  const navigate = useNavigate();

  if (!client) return <ClientPageLoader />;

  const isQuote = (i: Invoice) => Boolean(i.isQuotation || i.type === 'quotation' || ['Quotation', 'Draft', 'Approved'].includes(i.status) || (i.id && i.id.startsWith('AK-')));

  const allClientInvoices = invoices.filter(i => i.clientId === client.id);
  const clientInvoices = allClientInvoices.filter(i => !isQuote(i));
  const clientQuotes = allClientInvoices.filter(i => isQuote(i));
  const clientBookings = bookings.filter(b => b.clientId === client.id);

  const activities = [
    ...clientInvoices.map(inv => ({
      id: inv.id,
      title: inv.status === 'Paid' ? 'Invoice Paid' : 'Invoice Generated',
      description: `Invoice ${getDisplayId(inv.invoiceCode, inv.id)} for ₹${inv.totalAmount?.toLocaleString('en-IN')}`,
      date: new Date(inv.createdAt || inv.dueDate || Date.now()),
      type: 'invoice' as const
    })),
    ...clientQuotes.map(q => ({
      id: q.id,
      title: q.status === 'Approved' ? 'Quote Approved' : 'Quote Created',
      description: `Quote ${getDisplayId(q.quotationCode, q.id)} for ₹${q.totalAmount?.toLocaleString('en-IN')}`,
      date: new Date(q.createdAt || q.dueDate || Date.now()),
      type: 'quote' as const
    })),
    ...clientBookings.map(b => ({
      id: b.id,
      title: 'Booking Created',
      description: `Booking for ${b.title || 'Project'}`,
      date: new Date(b.date || Date.now()),
      type: 'quote' as const
    })),
    ...(client.portal?.deliverables || []).map((d, i) => ({
       id: `del_${i}`,
       title: 'Deliverable Uploaded',
       description: `${d.title} (${d.type})`,
       date: new Date(d.dateAdded || Date.now()),
       type: 'deliverable' as const
    })),
    ...((client.portal as any)?.team || []).map((t: any, i: number) => ({
       id: `team_${i}`,
       title: 'Team Assigned',
       description: `${t.name} assigned as ${t.role}`,
       date: new Date(t.date_added || Date.now()),
       type: 'team' as const
    })),
    ...(client.portal?.timeline || []).filter(t => t.status === 'Completed').map((t, i) => ({
       id: `wf_${i}`,
       title: 'Workflow Updated',
       description: `Milestone completed: ${t.title}`,
       date: new Date(t.date || Date.now()),
       type: 'workflow' as const
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  console.log("Client Activity Page Loaded");
  console.log("Current Client:", client.id);
  console.log("Activities:", activities);

  const getIcon = (type: string) => {
    switch (type) {
      case 'invoice': return <IndianRupee className="w-5 h-5 text-primary" />;
      case 'quote': return <CheckCircle2 className="w-5 h-5 text-primary" />;
      case 'deliverable': return <Video className="w-5 h-5 text-purple-500" />;
      case 'team': return <Users className="w-5 h-5 text-indigo-500" />;
      case 'workflow': return <Clock className="w-5 h-5 text-amber-500" />;
      default: return <Package className="w-5 h-5 text-zinc-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'invoice': return 'bg-primary/10 border-primary/20';
      case 'quote': return 'bg-primary/10 border-primary/20';
      case 'deliverable': return 'bg-purple-500/10 border-purple-500/20';
      case 'team': return 'bg-indigo-500/10 border-indigo-500/20';
      case 'workflow': return 'bg-amber-500/10 border-amber-500/20';
      default: return 'bg-zinc-500/10 border-zinc-500/20';
    }
  };

  const handleNavigate = (type: string) => {
    if (type === 'quote') navigate('/agreements');
    else if (type === 'invoice') navigate('/invoices');
    else if (type === 'deliverable') navigate('/deliverables');
    else navigate('/dashboard');
  };

  return (
    <div className="p-8 md:p-12 animate-ios-slide-up max-w-[900px] mx-auto">
      <div className="mb-12 flex items-center gap-6">
        <button 
          onClick={() => navigate('/dashboard')}
          className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-2">Timeline</h1>
          <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Chronological activity log for {client.name}</p>
        </div>
      </div>

      <div className="relative before:absolute before:inset-0 before:ml-[31px] md:before:ml-[39px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-white/10 before:to-transparent">
        <div className="space-y-8">
          {activities.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-white/10 rounded-3xl">
              <p className="text-xs font-bold text-zinc-600 uppercase tracking-widest">No activities recorded yet</p>
            </div>
          ) : (
            activities.map((item, index) => (
              <div key={`${item.id}-${index}`} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-16 h-16 rounded-full border-[4px] border-black bg-zinc-900 shadow-[0_0_0_2px_rgba(255,255,255,0.1)] group-hover:shadow-[0_0_0_2px_rgba(255,255,255,0.3)] transition-all shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 cursor-pointer" onClick={() => handleNavigate(item.type)}>
                  {getIcon(item.type)}
                </div>
                <div className="w-[calc(100%-5rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-3xl border border-white/5 bg-black/40 shadow-2xl hover:bg-white/[0.02] transition-colors cursor-pointer" onClick={() => handleNavigate(item.type)}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border ${getBgColor(item.type)}`}>
                      {item.type}
                    </span>
                    <time className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      {item.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </time>
                  </div>
                  <h3 className="text-lg font-black tracking-tight mb-1">{item.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientActivityPage;

