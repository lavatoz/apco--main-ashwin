import React, { useState, useEffect } from 'react';
import { Plus, CheckCircle2, Clock, User, Trash2, CheckSquare, PlayCircle, Layers } from 'lucide-react';
import { type Task, type Company } from '../types';

interface CoordinationTask extends Task {
  client?: string;
}

interface TaskManagerProps {
  tasks: Task[];
  onSaveTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  companies: Company[];
  selectedBrand: string | 'All';
}

const STAGES = [
  { id: 'TODO', label: 'To Do', color: 'text-zinc-500' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'text-blue-500' },
  { id: 'DONE', label: 'Completed', color: 'text-emerald-500' }
] as const;

const TaskManager: React.FC<TaskManagerProps> = ({ onSaveTask, onDeleteTask, selectedBrand }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  
  const [newTask, setNewTask] = useState<Partial<CoordinationTask>>({ 
    status: 'TODO' as any, 
    priority: 'Medium', 
    brand: selectedBrand !== 'All' ? selectedBrand : 'AAHA Kalyanam' 
  });

  const [localRegistry, setLocalRegistry] = useState<CoordinationTask[]>(() => {
    try {
      const stored = localStorage.getItem('apco_tasks');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('apco_tasks', JSON.stringify(localRegistry));
  }, [localRegistry]);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.title) {
      const task: CoordinationTask = {
        id: `TSK-${Date.now().toString().slice(-6)}`,
        title: newTask.title!,
        client: newTask.client || 'General',
        assignee: newTask.assignee || 'Unassigned',
        dueDate: newTask.dueDate || new Date().toISOString().split('T')[0],
        status: 'TODO' as any,
        brand: newTask.brand || 'AAHA Kalyanam',
        priority: newTask.priority || 'Medium'
      };
      
      const updated = [...localRegistry, task];
      setLocalRegistry(updated);
      onSaveTask(task);
      setIsAdding(false);
      setNewTask({ status: 'TODO' as any, priority: 'Medium', brand: selectedBrand !== 'All' ? selectedBrand : 'AAHA Kalyanam' });
    }
  };

  const updateStatus = (taskId: string, newStatus: string) => {
    const updated = localRegistry.map(t => t.id === taskId ? { ...t, status: newStatus as any } : t);
    setLocalRegistry(updated);
    const task = updated.find(t => t.id === taskId);
    if (task) onSaveTask(task);
  };

  const removeTask = (taskId: string) => {
    const updated = localRegistry.filter(t => t.id !== taskId);
    setLocalRegistry(updated);
    onDeleteTask(taskId);
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    // Add a slight delay for better visual during drag start
    setTimeout(() => {
        (e.target as HTMLElement).classList.add('opacity-40');
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    (e.target as HTMLElement).classList.remove('opacity-40');
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      updateStatus(taskId, status);
    }
    setDragOverColumn(null);
  };

  const filteredTasks = localRegistry.filter(t => selectedBrand === 'All' || t.brand === selectedBrand);

  return (
    <div className="space-y-10 pb-24 animate-ios-slide-up">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Coordination</h1>
          <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] mt-2">Kanban Task Management</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-white text-black px-8 py-3.5 squircle-sm font-black uppercase text-[11px] tracking-widest flex items-center gap-3 hover:bg-zinc-200 ios-transition shadow-2xl shadow-white/10 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
          New Task
        </button>
      </div>

      <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar min-h-[600px]">
        {STAGES.map(stage => {
          const stageTasks = filteredTasks.filter(t => t.status === stage.id);
          const isDraggingOver = dragOverColumn === stage.id;
          
          return (
            <div 
              key={stage.id} 
              className="flex-shrink-0 w-80 flex flex-col gap-6"
              onDragOver={(e) => { e.preventDefault(); setDragOverColumn(stage.id); }}
              onDragLeave={() => setDragOverColumn(null)}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              <div className="flex items-center justify-between px-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl bg-zinc-900 border border-white/5 ${stage.color}`}>
                     <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="text-[11px] font-black uppercase tracking-widest text-white">{stage.label}</h3>
                </div>
                <span className="text-[10px] font-black text-zinc-500 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                  {stageTasks.length}
                </span>
              </div>

              <div className={`flex-1 space-y-4 rounded-[2rem] p-4 transition-all duration-300 border-2 border-dashed ${isDraggingOver ? 'bg-white/5 border-white/20' : 'bg-transparent border-transparent'}`}>
                {stageTasks.map(task => (
                  <div 
                    key={task.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    className="glass-panel p-6 border border-white/5 squircle-lg bg-zinc-900/40 hover:bg-zinc-900/60 transition-all cursor-grab active:cursor-grabbing active:scale-95 group relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${task.priority === 'High' ? 'border-red-500/20 text-red-500' : 'border-zinc-500/20 text-zinc-500'}`}>
                        {task.priority || 'Medium'}
                      </div>
                      <button onClick={() => removeTask(task.id)} className="p-1 opacity-0 group-hover:opacity-100 text-zinc-800 hover:text-red-500 transition-all">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <h3 className="text-[12px] font-black tracking-tight mb-2 uppercase text-white truncate">
                      {task.title}
                    </h3>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-6">{task.client}</p>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <Clock className="w-3 h-3 text-zinc-600" />
                        <span className="text-[9px] font-bold text-zinc-500">{new Date(task.dueDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <span className="text-[8px] font-black uppercase tracking-widest text-zinc-600">{task.brand.split(' ')[0]}</span>
                    </div>
                  </div>
                ))}
                
                {stageTasks.length === 0 && (
                  <div className="py-20 flex flex-col items-center justify-center opacity-10">
                    <CheckSquare className="w-10 h-10 mb-2" />
                    <p className="text-[9px] font-black uppercase">Column Clear</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-xl animate-ios-slide-up">
          <div className="bg-zinc-900 border border-white/10 squircle-lg w-full max-w-lg p-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-white" />
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2 text-center">New Coordination</h2>
            <p className="text-center text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-10">Add task to Kanban</p>
            
            <form onSubmit={handleCreateTask} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1 text-left block">Task Title</label>
                <input required className="w-full bg-white/5 border border-white/5 squircle-sm p-4 text-sm font-bold text-white focus:bg-white/10 outline-none ios-transition" placeholder="e.g. Call client for venue visit" value={newTask.title || ''} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1 text-left block">Client Name</label>
                <input required className="w-full bg-white/5 border border-white/5 squircle-sm p-4 text-sm font-bold text-white focus:bg-white/10 outline-none ios-transition" placeholder="e.g. Rahul & Sharma" value={newTask.client || ''} onChange={e => setNewTask({ ...newTask, client: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Due Date</label>
                  <input type="date" required className="w-full bg-white/5 border border-white/5 squircle-sm p-4 text-sm font-bold text-white outline-none focus:bg-white/10" value={newTask.dueDate || ''} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} />
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Brand</label>
                  <select className="w-full bg-white/5 border border-white/5 squircle-sm p-4 text-sm font-bold text-white outline-none" value={newTask.brand} onChange={e => setNewTask({ ...newTask, brand: e.target.value })}>
                    <option className="bg-zinc-900" value="AAHA Kalyanam">AAHA</option>
                    <option className="bg-zinc-900" value="Tiny Toes">TINY TOES</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-10">
                <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-4 bg-white/5 text-zinc-500 hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/5 transition-all">Discard</button>
                <button type="submit" className="flex-1 py-4 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl transition-all">Create Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;
