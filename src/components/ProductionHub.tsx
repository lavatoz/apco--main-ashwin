
import React, { useState } from 'react';
import {
  Calendar, ChevronRight, CheckCircle2,
  Layers, Package, MapPin
} from 'lucide-react';
import { type Client, type Task, type Booking, TaskStatus } from '../types';

interface ProductionHubProps {
  clients: Client[];
  tasks: Task[];
  bookings: Booking[];
  selectedBrand: string | 'All';
  onOpenClient: (client: Client) => void;
}

const ProductionHub: React.FC<ProductionHubProps> = ({ clients, tasks, bookings, selectedBrand, onOpenClient }) => {
  const [activeTab, setActiveTab] = useState<'all' | 'ops' | 'delivery'>('all');

  const filteredClients = clients.filter(c => selectedBrand === 'All' || c.brand === selectedBrand);
  const filteredTasks = tasks.filter(t => (selectedBrand === 'All' || t.brand === selectedBrand) && t.status !== TaskStatus.Done);

  const upcomingBookings = bookings.filter(b => {
    const isFuture = new Date(b.date) >= new Date();
    const matchesBrand = selectedBrand === 'All' || b.brand === selectedBrand;
    return isFuture && matchesBrand;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const getProgress = (client: Client) => {
    if (!client.portal?.timeline || client.portal.timeline.length === 0) return 0;
    const completed = client.portal.timeline.filter(t => t.status === 'Completed').length;
    return Math.round((completed / client.portal.timeline.length) * 100);
  };

  const isOverdue = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dateStr);
    return due < today;
  }

  return (
    <div className="space-y-10 animate-ios-slide-up pb-20">
      <div className="space-y-2">
        <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Operations</h1>
        <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em]">Production Pipeline & Logistics</p>
      </div>

      <div className="flex bg-zinc-900/50 p-1 rounded-[1.2rem] border border-white/5 w-full md:w-max">
        {['all', 'ops', 'delivery'].map(t => (
          <button
            key={t} onClick={() => setActiveTab(t as 'all' | 'ops' | 'delivery')}
            className={`flex-1 px-8 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === t ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Projects Card */}
        <div className="glass-panel p-8 squircle-lg space-y-8 bg-zinc-900/20">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
              <Layers className="w-4 h-4 text-blue-500" /> Active Projects
            </h3>
            <span className="text-[9px] font-black uppercase text-zinc-500">{filteredClients.length} In Progress</span>
          </div>

          <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
            {filteredClients.slice(0, 8).map(client => (
              <div key={client.id} onClick={() => onOpenClient(client)} className="p-5 bg-white/5 rounded-[1.5rem] hover:bg-white/10 transition-all cursor-pointer group border border-white/5 relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-black text-xs uppercase tracking-tight text-white">{client.projectName}</h4>
                    <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest mt-1">{client.brand}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-black text-zinc-700 group-hover:text-blue-500 transition-colors">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[8px] font-black uppercase text-zinc-600 tracking-widest">
                    <span>Completion</span>
                    <span>{getProgress(client)}%</span>
                  </div>
                  <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: `${getProgress(client)}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Action Required / Alerts */}
        <div className="glass-panel p-8 squircle-lg space-y-8 bg-zinc-900/20">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
              <Package className="w-4 h-4 text-amber-500" /> Pending Tasks
            </h3>
            <span className="text-[9px] font-black uppercase text-zinc-500">{filteredTasks.length} Require Action</span>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
            {filteredTasks.slice(0, 8).map(task => {
              const overdue = isOverdue(task.dueDate);
              return (
                <div key={task.id} className={`p-4 bg-zinc-900/50 border rounded-[1.2rem] flex items-center gap-4 group transition-all ${overdue ? 'border-red-500/30 bg-red-500/5' : 'border-white/5'}`}>
                  <div className={`w-1.5 h-8 rounded-full ${task.priority === 'High' ? 'bg-red-500' : 'bg-zinc-700'}`} />
                  <div className="flex-1 overflow-hidden">
                    <h4 className={`font-black text-xs uppercase tracking-tight truncate ${overdue ? 'text-red-400' : 'text-white'}`}>{task.title}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">{task.assignee}</p>
                      {overdue && <span className="text-[8px] font-black uppercase bg-red-500 text-black px-1.5 rounded">Overdue</span>}
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-zinc-600 font-bold">{new Date(task.dueDate).getDate()}/{new Date(task.dueDate).getMonth() + 1}</span>
                </div>
              )
            })}
            {filteredTasks.length === 0 && (
              <div className="py-20 text-center text-zinc-800">
                <CheckCircle2 className="w-10 h-10 mx-auto mb-4 opacity-20" />
                <p className="text-[10px] font-black uppercase tracking-widest">All caught up</p>
              </div>
            )}
          </div>
        </div>

        {/* Shoot Calendar Strip */}
        <div className="lg:col-span-2 glass-panel p-8 squircle-lg space-y-8 bg-zinc-900/20">
          <div className="flex items-center justify-between border-b border-white/5 pb-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-white flex items-center gap-3">
              <Calendar className="w-4 h-4 text-emerald-500" /> Production Schedule
            </h3>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
            {upcomingBookings.map(b => (
              <div key={b.id} className="min-w-[220px] p-6 bg-white/5 border border-white/5 rounded-[2rem] space-y-4 group hover:bg-white/10 transition-all">
                <div className="flex justify-between items-start">
                  <div className="bg-black p-3 rounded-xl border border-white/10 text-center min-w-[60px]">
                    <p className="text-[9px] font-black uppercase text-zinc-600">{new Date(b.date).toLocaleString([], { month: 'short' })}</p>
                    <p className="text-2xl font-black text-white leading-none">{new Date(b.date).getDate()}</p>
                  </div>
                  <span className="text-[8px] font-black uppercase text-blue-500 bg-blue-500/10 px-2 py-1 rounded-lg border border-blue-500/20">Confirmed</span>
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-tight text-white line-clamp-1">{b.title}</h4>
                  <p className="text-[8px] font-black uppercase text-zinc-500 tracking-widest mt-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-zinc-600" /> {b.brand}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductionHub;
