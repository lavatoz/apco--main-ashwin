
import React, { useState } from 'react';
import { Plus, X, Trash2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { type Staff, type StaffPermissions } from '../types';

interface TeamManagerProps {
  staff: Staff[];
  onSaveStaff: (member: Staff) => void;
  onDeleteStaff: (id: string) => void;
}

const TeamManager: React.FC<TeamManagerProps> = ({ staff, onSaveStaff, onDeleteStaff }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);

  const defaultPermissions: StaffPermissions = {
    canManageClients: true,
    canManageFinance: false,
    canManageTasks: true,
    canUseAI: true,
    canManageEcosystem: false
  };

  const [form, setForm] = useState<Partial<Staff>>({
    permissions: { ...defaultPermissions },
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name && form.loginId) {
      onSaveStaff({
        id: editingStaff?.id || `STAFF-${Math.floor(1000 + Math.random() * 9000)}`,
        name: form.name!,
        email: form.email || '',
        loginId: form.loginId!,
        password: form.password || 'staff123',
        role: form.role || 'Staff',
        permissions: form.permissions || { ...defaultPermissions },
        isActive: form.isActive !== undefined ? form.isActive : true
      });
      setIsAdding(false);
      setEditingStaff(null);
      setForm({ permissions: { ...defaultPermissions }, isActive: true });
    }
  };

  const togglePermission = (key: keyof StaffPermissions) => {
    setForm({
      ...form,
      permissions: {
        ...(form.permissions || defaultPermissions),
        [key]: !((form.permissions || defaultPermissions)[key])
      }
    });
  };

  return (
    <div className="space-y-10 pb-20 animate-ios-slide-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Command Center</h1>
          <p className="text-zinc-500 font-medium tracking-tight uppercase text-[10px] tracking-[0.2em] mt-1">Staff Access & Security Registry</p>
        </div>
        <button
          onClick={() => setIsAdding(true)}
          className="bg-white text-black px-8 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center gap-3 hover:bg-zinc-200 ios-transition shadow-2xl active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Enlist Member
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {staff.map(member => (
          <div key={member.id} className="glass-panel p-10 squircle-lg relative overflow-hidden flex flex-col group border border-white/5">
            <div className={`absolute top-0 right-0 w-1 h-full ${member.isActive ? 'bg-emerald-500' : 'bg-red-500'} opacity-40`} />

            <div className="flex items-center gap-6 mb-10">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl font-black text-white group-hover:bg-white group-hover:text-black transition-all">
                {member.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tight leading-none mb-1">{member.name}</h3>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">{member.role}</p>
              </div>
            </div>

            <div className="space-y-4 pt-6 border-t border-white/5 mb-8">
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                <span>Login ID</span>
                <span className="text-white">{member.loginId}</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                <span>Security</span>
                <span className="text-zinc-700">••••••••</span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-bold text-zinc-500 uppercase tracking-widest">
                <span>Permissions</span>
                <span className="text-blue-500">{Object.values(member.permissions).filter(p => p).length} Active</span>
              </div>
            </div>

            <div className="flex gap-2 mt-auto">
              <button onClick={() => { setForm(member); setEditingStaff(member); setIsAdding(true); }} className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Reconfigure</button>
              <button onClick={() => onDeleteStaff(member.id)} className="p-4 bg-white/5 hover:bg-red-500/10 text-zinc-800 hover:text-red-500 rounded-xl transition-all"><Trash2 className="w-5 h-5" /></button>
            </div>
          </div>
        ))}
        {staff.length === 0 && (
          <div className="col-span-full py-24 text-center glass-panel border border-dashed rounded-[2.5rem]">
            <p className="text-[11px] font-black uppercase tracking-widest text-zinc-800">No staff accounts enlisted yet</p>
          </div>
        )}
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-6 backdrop-blur-2xl">
          <div className="bg-zinc-900 border border-white/10 rounded-[2.5rem] w-full max-w-xl p-12 shadow-2xl animate-ios-slide-up no-scrollbar max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">{editingStaff ? 'Update Profile' : 'Member Enlistment'}</h2>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] mt-2 italic">Artisans Co. Security Protocol</p>
              </div>
              <button onClick={() => { setIsAdding(false); setEditingStaff(null); }} className="p-3 bg-white/5 text-zinc-600 hover:text-white rounded-full"><X className="w-6 h-6" /></button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Full Identity Name</label>
                  <input required className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm font-black text-white outline-none" placeholder="e.g. Rahul Malhotra" value={form.name || ''} onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Enlistment ID</label>
                    <input required className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm font-black text-white outline-none" placeholder="e.g. staff_rahul" value={form.loginId || ''} onChange={e => setForm({ ...form, loginId: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Security Key</label>
                    <input required className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm font-black text-white outline-none" placeholder="••••••••" value={form.password || ''} onChange={e => setForm({ ...form, password: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Member Role</label>
                  <select className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm font-black text-white outline-none" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="Lead Producer" className="bg-zinc-900">Lead Producer</option>
                    <option value="Account Manager" className="bg-zinc-900">Account Manager</option>
                    <option value="Finance Associate" className="bg-zinc-900">Finance Associate</option>
                    <option value="Photographer/Editor" className="bg-zinc-900">Photographer/Editor</option>
                    <option value="Staff" className="bg-zinc-900">General Staff</option>
                  </select>
                </div>
              </div>

              <div className="p-8 bg-black/40 rounded-[2rem] border border-white/5 space-y-6">
                <h4 className="text-[11px] font-black uppercase text-zinc-600 tracking-widest mb-2 flex items-center gap-3"><ShieldCheck className="w-4 h-4" /> Access Permissions</h4>
                <div className="grid grid-cols-1 gap-4">
                  {(['canManageClients', 'canManageFinance', 'canManageTasks', 'canUseAI', 'canManageEcosystem'] as const).map(key => (
                    <button
                      key={key} type="button"
                      onClick={() => togglePermission(key)}
                      className={`p-4 rounded-xl flex items-center justify-between border transition-all ${form.permissions?.[key] ? 'bg-blue-600/10 border-blue-600/20 text-blue-500' : 'bg-white/5 border-white/5 text-zinc-700'}`}
                    >
                      <span className="text-[10px] font-black uppercase tracking-widest">{key.replace('canManage', '').replace('canUse', '').replace('canManage', '')}</span>
                      {form.permissions?.[key] ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-10">
                <button type="button" onClick={() => { setIsAdding(false); setEditingStaff(null); }} className="flex-1 py-5 bg-white/5 text-zinc-500 hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">Discard</button>
                <button type="submit" className="flex-1 py-5 bg-white text-black hover:bg-zinc-200 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl transition-all">Commit Profile</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeamManager;
