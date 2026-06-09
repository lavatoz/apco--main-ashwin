import React from 'react';
import { CheckCircle2, Circle, Clock } from 'lucide-react';
import type { Client, Task } from '../../types';

interface ClientTasksProps {
  client: Client | null;
  tasks: Task[];
}

const ClientTasks: React.FC<ClientTasksProps> = ({ client, tasks }) => {
  if (!client) return null;

  // Since tasks are already globally filtered by activeClient.id in App.tsx, we just display them here.
  const pendingTasks = tasks.filter(t => t.status !== 'Done');
  const completedTasks = tasks.filter(t => t.status === 'Done');

  return (
    <div className="p-8 md:p-12 animate-ios-slide-up max-w-[1400px] mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">Assigned Tasks</h1>
        <p className="text-xl text-zinc-400 font-medium">Action Items & Approvals</p>
      </div>

      <div className="space-y-12">
        <div>
          <h2 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-6 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" /> Pending Action Required
          </h2>
          <div className="space-y-4">
            {pendingTasks.map((task, i) => (
              <div key={task.id || i} className="glass-panel p-6 squircle-lg flex items-center justify-between group hover:border-amber-500/30 transition-all border border-white/5 cursor-pointer">
                <div className="flex items-center gap-5">
                   <Circle className="w-6 h-6 text-zinc-600 group-hover:text-amber-500 transition-colors" />
                   <div>
                     <h3 className="text-lg font-black uppercase tracking-tight">{task.title}</h3>
                     <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'ASAP'}</p>
                   </div>
                </div>
                <button className="px-6 py-2.5 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-zinc-200 transition-colors shadow-xl">
                  Review
                </button>
              </div>
            ))}
            {pendingTasks.length === 0 && (
              <div className="p-10 text-center border border-dashed border-white/10 rounded-[2rem]">
                 <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">No pending tasks at this time.</p>
              </div>
            )}
          </div>
        </div>

        {completedTasks.length > 0 && (
          <div>
            <h2 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-6 flex items-center gap-2 opacity-50">
              <CheckCircle2 className="w-4 h-4" /> Completed Actions
            </h2>
            <div className="space-y-4 opacity-50">
              {completedTasks.map((task, i) => (
                <div key={task.id || i} className="p-6 bg-white/5 rounded-2xl flex items-center gap-5">
                   <CheckCircle2 className="w-5 h-5 text-primary" />
                   <div>
                     <h3 className="text-sm font-bold line-through">{task.title}</h3>
                     <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-0.5">Completed</p>
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientTasks;

