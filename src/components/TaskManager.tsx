
import React, { useState } from 'react';
import { Plus, CheckCircle2, Circle, Clock, User, Trash2, CheckSquare } from 'lucide-react';
import { type Task, type Company, TaskStatus } from '../types';

interface TaskManagerProps {
  tasks: Task[];
  onSaveTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  companies: Company[];
  selectedBrand: string | 'All';
}

const TaskManager: React.FC<TaskManagerProps> = ({ tasks, onSaveTask, onDeleteTask, companies, selectedBrand }) => {
  const [activeStatus, setActiveStatus] = useState<TaskStatus>(TaskStatus.Todo);
  const [isAdding, setIsAdding] = useState(false);
  const [newTask, setNewTask] = useState<Partial<Task>>({ status: TaskStatus.Todo, priority: 'Medium', brand: companies[0]?.name || '' });

  const filteredTasks = tasks.filter(t => {
    const matchesBrand = selectedBrand === 'All' || t.brand === selectedBrand;
    const matchesStatus = t.status === activeStatus;
    return matchesBrand && matchesStatus;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.title && newTask.assignee) {
      onSaveTask({
        id: `TSK-${Date.now().toString().substr(-6)}`,
        title: newTask.title!,
        assignee: newTask.assignee!,
        dueDate: newTask.dueDate || new Date().toISOString().split('T')[0],
        status: newTask.status || TaskStatus.Todo,
        brand: newTask.brand || companies[0]?.name,
        priority: newTask.priority || 'Medium'
      });
      setIsAdding(false);
      setNewTask({ status: TaskStatus.Todo, priority: 'Medium', brand: companies[0]?.name || '' });
    }
  };

  const toggleStatus = (task: Task) => {
    const nextStatus = task.status === TaskStatus.Todo
      ? TaskStatus.InProgress
      : task.status === TaskStatus.InProgress
        ? TaskStatus.Done
        : TaskStatus.Todo;
    onSaveTask({ ...task, status: nextStatus });
  };

  const getPriorityColor = (p: Task['priority']) => {
    switch (p) {
      case 'High': return 'text-red-400 bg-red-400/10 border-red-400/20';
      case 'Medium': return 'text-amber-400 bg-amber-400/10 border-amber-400/20';
      case 'Low': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
    }
  };

  return (
    <div className="space-y-10 pb-24 animate-ios-slide-up">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Coordination</h1>
          <p className="text-zinc-500 font-medium">Internal team tasks and assignments</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-white text-black px-6 py-3 squircle-sm font-black uppercase text-[11px] tracking-widest flex items-center gap-2 hover:bg-zinc-200 ios-transition shadow-2xl"
        >
          <Plus className="w-5 h-5" />
          New Task
        </button>
      </div>

      <div className="bg-zinc-900/80 p-1 rounded-[1.25rem] border border-white/5 flex gap-1 w-full max-w-lg mx-auto md:mx-0">
        {[TaskStatus.Todo, TaskStatus.InProgress, TaskStatus.Done].map(status => (
          <button
            key={status}
            onClick={() => setActiveStatus(status)}
            className={`flex-1 px-5 py-3 text-[11px] font-black uppercase tracking-widest rounded-[1rem] transition-all ${activeStatus === status ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
          >
            {status}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTasks.map(task => {
          const brandColor = companies.find(c => c.name === task.brand)?.color || '#555';
          return (
            <div key={task.id} className="glass-panel p-8 squircle-lg hover:scale-[1.02] ios-transition relative group cursor-pointer overflow-hidden">
              <div className="absolute top-0 right-0 w-1 h-full opacity-40" style={{ backgroundColor: brandColor }} />

              <div className="flex justify-between items-start mb-6">
                <button onClick={() => toggleStatus(task)} className="p-2 -m-2 text-zinc-600 hover:text-white ios-transition">
                  {task.status === TaskStatus.Done ? <CheckCircle2 className="w-6 h-6 text-emerald-400" /> : <Circle className="w-6 h-6" />}
                </button>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              </div>

              <h3 className={`text-lg font-black tracking-tight mb-2 uppercase ${task.status === TaskStatus.Done ? 'text-zinc-500 line-through' : 'text-white'}`}>
                {task.title}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mb-8">{task.brand}</p>

              <div className="flex items-center justify-between pt-6 border-t border-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                    <User className="w-4 h-4 text-zinc-500" />
                  </div>
                  <span className="text-xs font-bold text-zinc-300">{task.assignee}</span>
                </div>
                <div className="flex items-center gap-2 text-zinc-500">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold">{new Date(task.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                </div>
              </div>

              <button
                onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                className="absolute bottom-6 right-6 p-2 text-zinc-800 hover:text-red-500 opacity-0 group-hover:opacity-100 ios-transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}

        {filteredTasks.length === 0 && (
          <div className="col-span-full py-40 text-center glass-panel border border-dashed squircle-lg">
            <div className="inline-block p-6 rounded-3xl bg-white/5 mb-6"><CheckSquare className="w-10 h-10 text-zinc-700" /></div>
            <p className="font-black uppercase tracking-widest text-[11px] text-zinc-600">All clear in {activeStatus} registry</p>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-zinc-900 border border-white/10 squircle-lg w-full max-w-lg p-10 shadow-2xl animate-ios-slide-up">
            <h2 className="text-3xl font-black text-white tracking-tight mb-10 text-center">New Coordination Task</h2>
            <form onSubmit={handleCreateTask} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest">Task Definition</label>
                <input required className="w-full bg-white/5 border border-white/5 squircle-sm p-4 text-sm font-bold text-white focus:bg-white/10 outline-none ios-transition" placeholder="e.g. Finalize Decor Vendor" value={newTask.title || ''} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest">Assignee</label>
                  <input required className="w-full bg-white/5 border border-white/5 squircle-sm p-4 text-sm font-bold text-white focus:bg-white/10 outline-none ios-transition" placeholder="Member name" value={newTask.assignee || ''} onChange={e => setNewTask({ ...newTask, assignee: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest">Due Date</label>
                  <input type="date" required className="w-full bg-white/5 border border-white/5 squircle-sm p-4 text-sm font-bold text-white focus:bg-white/10 outline-none ios-transition" value={newTask.dueDate || ''} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest">Brand Context</label>
                  <select className="w-full bg-white/5 border border-white/5 squircle-sm p-4 text-sm font-bold text-white outline-none" value={newTask.brand} onChange={e => setNewTask({ ...newTask, brand: e.target.value })}>
                    {companies.map(c => <option key={c.id} className="bg-zinc-900" value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest">Priority</label>
                  <select className="w-full bg-white/5 border border-white/5 squircle-sm p-4 text-sm font-bold text-white outline-none" value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value as Task['priority'] })}>
                    <option className="bg-zinc-900" value="Low">Low</option>
                    <option className="bg-zinc-900" value="Medium">Medium</option>
                    <option className="bg-zinc-900" value="High">High</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-8">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-4 bg-white/5 text-zinc-500 hover:text-white squircle-sm font-black uppercase text-[11px] tracking-widest ios-transition">Discard</button>
                <button type="submit" className="flex-1 py-4 bg-white text-black hover:bg-zinc-200 squircle-sm font-black uppercase text-[11px] tracking-widest ios-transition shadow-2xl">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;
