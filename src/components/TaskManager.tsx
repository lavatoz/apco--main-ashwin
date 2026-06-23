import React, { useState } from 'react';
import { Plus, Clock, Trash2, CheckSquare, Layers, Edit2 } from 'lucide-react';
import { type Task, type CompanyProfile, type Staff } from '../types';
import { usePermissions } from '../hooks/usePermissions';

interface CoordinationTask extends Task {
  client?: string;
}

interface TaskManagerProps {
  tasks: Task[];
  onSaveTask: (task: Task) => Promise<any>;
  onDeleteTask: (id: string) => Promise<any>;
  companies: CompanyProfile[];
  selectedBrand: string | 'All';
  isEmbedded?: boolean;
  staff: Staff[];
}

const STAGES = [
  { id: 'TODO', label: 'To Do', color: 'text-zinc-500' },
  { id: 'IN_PROGRESS', label: 'In Progress', color: 'text-primary' },
  { id: 'DONE', label: 'Completed', color: 'text-primary' }
] as const;

const TaskManager: React.FC<TaskManagerProps> = ({ tasks, onSaveTask, onDeleteTask, selectedBrand, companies, isEmbedded = false, staff }) => {
  const { canEdit, canDelete } = usePermissions();
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [fadingId, setFadingId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [newTask, setNewTask] = useState<Partial<CoordinationTask>>({ 
    status: 'TODO' as any, 
    priority: 'Medium', 
    brand: selectedBrand !== 'All' ? (companies.find(c => c.id === selectedBrand)?.companyName || selectedBrand) : (companies[0]?.companyName || 'Artisans'),
    assignee: 'Unassigned',
    assignedUserId: null
  });

  const handleStartEdit = (task: CoordinationTask) => {
    if (isSaving) return;
    setNewTask({
        title: task.title,
        client: task.client,
        dueDate: task.dueDate,
        brand: task.brand,
        priority: task.priority,
        status: task.status,
        assignee: task.assignee || 'Unassigned',
        assignedUserId: task.assignedUserId || null
    });
    setEditingTaskId(task.id);
    setIsEditing(true);
    setIsAdding(true);
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (newTask.title) {
      setIsSaving(true);
      try {
        if (isEditing && editingTaskId) {
            const t = tasks.find(x => x.id === editingTaskId);
            if (t) {
              const updated = {
                ...t,
                title: newTask.title!,
                client: newTask.client || 'General',
                dueDate: newTask.dueDate || new Date().toISOString().split('T')[0],
                brand: newTask.brand || 'AAHA Kalyanam',
                priority: newTask.priority || 'Medium',
                status: newTask.status || t.status,
                assignee: newTask.assignee || 'Unassigned',
                assignedUserId: newTask.assignedUserId || null
              };
              await onSaveTask(updated);
            }
        } else {
          const task: CoordinationTask = {
              id: `TSK-${Date.now().toString().slice(-6)}`,
              title: newTask.title!,
              client: newTask.client || 'General',
              assignee: newTask.assignee || 'Unassigned',
              assignedUserId: newTask.assignedUserId || null,
              dueDate: newTask.dueDate || new Date().toISOString().split('T')[0],
              status: 'TODO' as any,
              brand: newTask.brand || 'AAHA Kalyanam',
              priority: newTask.priority || 'Medium'
          };
          await onSaveTask(task);
        }
        
        setIsAdding(false);
        setIsEditing(false);
        setEditingTaskId(null);
        setNewTask({ status: 'TODO' as any, priority: 'Medium', brand: selectedBrand !== 'All' ? (companies.find(c => c.id === selectedBrand)?.companyName || selectedBrand) : (companies[0]?.companyName || 'Artisans'), assignee: 'Unassigned', assignedUserId: null });
      } catch (err) {
        console.error("Failed to save task in TaskManager:", err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const updateStatus = async (taskId: string, newStatus: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setIsSaving(true);
      try {
        await onSaveTask({ ...task, status: newStatus as any });
      } catch (err) {
        console.error("Failed to update task status in TaskManager:", err);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const removeTask = async (taskId: string) => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      setFadingId(taskId);
      await new Promise(r => setTimeout(r, 300));
      await onDeleteTask(taskId);
    } catch (err) {
      console.error("Failed to delete task in TaskManager:", err);
    } finally {
      setFadingId(null);
      setIsSaving(false);
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    if (isSaving) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('taskId', taskId);
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
    if (isSaving) return;
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      updateStatus(taskId, status);
    }
    setDragOverColumn(null);
  };

  const filteredTasks = tasks.filter(t => {
     if (selectedBrand === 'All') return true;
     const taskCompany = companies.find(c => c.id === t.brand || c.companyName === t.brand);
     const taskBrandId = taskCompany ? taskCompany.id : t.brand;
     const taskBrandName = taskCompany ? taskCompany.companyName : t.brand;

     const filterCompany = companies.find(c => c.id === selectedBrand || c.companyName === selectedBrand);
     const filterBrandId = filterCompany ? filterCompany.id : selectedBrand;
     const filterBrandName = filterCompany ? filterCompany.companyName : selectedBrand;

     return taskBrandId === filterBrandId || taskBrandName === filterBrandName;
  });

  return (
    <div className="space-y-10 pb-24 animate-ios-slide-up">
      <div className={`flex flex-col md:flex-row justify-between items-center gap-6 ${isEmbedded ? 'mb-4' : ''}`}>
        {!isEmbedded && (
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Coordination</h1>
            <p className="text-zinc-500 font-black uppercase text-[10px] tracking-[0.3em] mt-2">Kanban Task Management</p>
          </div>
        )}
        {canEdit && (
          <button
            onClick={() => {
                setIsEditing(false);
                setNewTask({ status: 'TODO' as any, priority: 'Medium', brand: selectedBrand !== 'All' ? (companies.find(c => c.id === selectedBrand)?.companyName || selectedBrand) : (companies[0]?.companyName || 'Artisans') });
                setIsAdding(true);
            }}
            disabled={isSaving}
            className="bg-white text-black px-8 py-3.5 squircle-sm font-black uppercase text-[11px] tracking-widest flex items-center gap-3 hover:bg-zinc-200 ios-transition shadow-2xl shadow-white/10 group disabled:opacity-50"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            New Task
          </button>
        )}
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
                    draggable={!isSaving}
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    className={`glass-panel p-6 border border-white/5 squircle-lg bg-zinc-900/40 hover:bg-zinc-900/60 transition-all cursor-grab active:cursor-grabbing active:scale-95 group relative overflow-hidden ${fadingId === task.id ? 'animate-fade-out' : ''}`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${task.priority === 'High' ? 'border-red-500/20 text-red-500' : 'border-zinc-500/20 text-zinc-500'}`}>
                        {task.priority || 'Medium'}
                      </div>
                      <div className="flex gap-2">
                        {canEdit && (
                          <button 
                              onClick={() => handleStartEdit(task)} 
                              title="Edit Task"
                              disabled={isSaving}
                              className="p-1 opacity-0 group-hover:opacity-100 text-zinc-800 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                              <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button 
                              onClick={() => removeTask(task.id)} 
                              disabled={isSaving}
                              className="p-1 opacity-0 group-hover:opacity-100 text-zinc-800 hover:text-red-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                              <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                     <h3 className="text-[12px] font-black tracking-tight mb-2 uppercase text-white truncate">
                      {task.title}
                    </h3>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500 mb-2">{task.client}</p>
                    <p className="text-[9px] font-bold text-zinc-400 mb-6 uppercase tracking-wider">Assignee: {task.assignee || 'Unassigned'}</p>

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
            <h2 className="text-3xl font-black text-white tracking-tighter uppercase mb-2 text-center">{isEditing ? 'Edit Coordination' : 'New Coordination'}</h2>
            <p className="text-center text-zinc-500 text-[10px] font-black uppercase tracking-[0.3em] mb-10">{isEditing ? 'Modify Kanban Task' : 'Add task to Kanban'}</p>
            
            <form onSubmit={handleCreateTask} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1 text-left block">Task Title</label>
                <input required disabled={isSaving} className="w-full bg-white/5 border border-white/5 squircle-sm p-4 text-sm font-bold text-white focus:bg-white/10 outline-none ios-transition disabled:opacity-50" placeholder="e.g. Call client for venue visit" value={newTask.title || ''} onChange={e => setNewTask({ ...newTask, title: e.target.value })} />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1 text-left block">Client Name</label>
                <input required disabled={isSaving} className="w-full bg-white/5 border border-white/5 squircle-sm p-4 text-sm font-bold text-white focus:bg-white/10 outline-none ios-transition disabled:opacity-50" placeholder="e.g. Rahul & Sharma" value={newTask.client || ''} onChange={e => setNewTask({ ...newTask, client: e.target.value })} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Due Date</label>
                  <input type="date" required disabled={isSaving} className="w-full bg-white/5 border border-white/5 squircle-sm p-4 text-sm font-bold text-white outline-none focus:bg-white/10 disabled:opacity-50" value={newTask.dueDate || ''} onChange={e => setNewTask({ ...newTask, dueDate: e.target.value })} />
                </div>
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Brand</label>
                  {selectedBrand !== 'All' ? (
                    <div className="w-full bg-white/5 border border-white/5 squircle-sm p-4 text-sm font-bold text-zinc-400 cursor-not-allowed">
                      {companies.find(c => c.id === selectedBrand)?.companyName || selectedBrand}
                      <span className="ml-2 text-[8px] opacity-40">(Locked by Global Filter)</span>
                    </div>
                  ) : (
                    <select disabled={isSaving} className="w-full bg-white/5 border border-white/5 squircle-sm p-4 text-sm font-bold text-white outline-none disabled:opacity-50" value={newTask.brand} onChange={e => setNewTask({ ...newTask, brand: e.target.value })}>
                      <option value="" disabled className="bg-zinc-900">Select Brand...</option>
                      {companies.map(c => (
                        <option key={c.id} className="bg-zinc-900" value={c.companyName}>{c.companyName.split(' ')[0].toUpperCase()}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 text-left">
                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Priority</label>
                  <select disabled={isSaving} className="w-full bg-white/5 border border-white/5 squircle-sm p-4 text-sm font-bold text-white outline-none disabled:opacity-50" value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value as any })}>
                    <option className="bg-zinc-900" value="Low">Low</option>
                    <option className="bg-zinc-900" value="Medium">Medium</option>
                    <option className="bg-zinc-900" value="High">High</option>
                  </select>
                </div>
                {isEditing && (
                  <div className="space-y-2 text-left">
                    <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Status</label>
                    <select disabled={isSaving} className="w-full bg-white/5 border border-white/5 squircle-sm p-4 text-sm font-bold text-white outline-none disabled:opacity-50" value={newTask.status} onChange={e => setNewTask({ ...newTask, status: e.target.value as any })}>
                      {STAGES.map(s => <option key={s.id} className="bg-zinc-900" value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Assignee</label>
                <select 
                  disabled={isSaving} 
                  className="w-full bg-white/5 border border-white/5 squircle-sm p-4 text-sm font-bold text-white outline-none disabled:opacity-50" 
                  value={newTask.assignedUserId || ''} 
                  onChange={e => {
                    const selectedId = e.target.value;
                    const selectedStaff = staff.find(s => s.id === selectedId);
                    setNewTask({ 
                      ...newTask, 
                      assignedUserId: selectedId || null, 
                      assignee: selectedStaff ? selectedStaff.name : 'Unassigned' 
                    });
                  }}
                >
                  <option value="" className="bg-zinc-900">Unassigned</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id} className="bg-zinc-900">{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-4 pt-10">
                <button type="button" disabled={isSaving} onClick={() => {
                    setIsAdding(false);
                    setIsEditing(false);
                    setEditingTaskId(null);
                }} className="flex-1 py-4 bg-white/5 text-zinc-500 hover:text-white rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/5 transition-all disabled:opacity-50">Discard</button>
                <button type="submit" disabled={isSaving} className="flex-1 py-4 bg-white text-black hover:bg-zinc-200 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {isSaving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Task')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskManager;

