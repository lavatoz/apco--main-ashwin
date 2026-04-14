import React, { useState, useEffect } from 'react';
import { Plus, X, Trash2, Link as LinkIcon, Copy, Check, Edit2 } from 'lucide-react';
import { type User, type UserRole, type UserPermission, type Invite } from '../types';

interface UserAccessManagerProps {
  // We'll manage users directly from localStorage in this component for simplicity as requested
}

const UserAccessManager: React.FC<UserAccessManagerProps> = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastGeneratedLink, setLastGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [divisions, setDivisions] = useState<any[]>([]);

  const [staffForm, setStaffForm] = useState<any>({
    name: '',
    email: '',
    password: '',
    permissions: ['dashboard'],
    divisionIds: []
  });

  const [form, setForm] = useState<{
    email: string;
    role: UserRole;
    permissions: UserPermission[];
  }>({
    email: '',
    role: 'Staff',
    permissions: ['dashboard']
  });

  const availablePermissions: UserPermission[] = ['dashboard', 'clients', 'tasks', 'finance', 'ai', 'analytics', 'system', 'workflow'];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setUsers(JSON.parse(localStorage.getItem('users') || '[]'));
    setInvites(JSON.parse(localStorage.getItem('invites') || '[]'));
    setDivisions(JSON.parse(localStorage.getItem('divisions') || '[]'));
  };

  const generateInvite = (e: React.FormEvent) => {
    e.preventDefault();
    const token = Math.random().toString(36).substring(2, 15);
    const newInvite: Invite = {
      token,
      email: form.email,
      role: form.role,
      permissions: form.permissions,
      createdAt: new Date().toISOString()
    };

    const currentInvites = JSON.parse(localStorage.getItem('invites') || '[]');
    currentInvites.push(newInvite);
    localStorage.setItem('invites', JSON.stringify(currentInvites));
    
    setInvites(currentInvites);
    const link = `${window.location.origin}/invite/${token}`;
    setLastGeneratedLink(link);
    setForm({ email: '', role: 'Staff', permissions: ['dashboard'] });
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const newStaff: User = {
      id: `staff_${Math.random().toString(36).substring(2, 9)}`,
      name: staffForm.name,
      email: staffForm.email,
      password: staffForm.password,
      role: 'Staff',
      permissions: staffForm.permissions,
      divisionIds: staffForm.divisionIds,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    const currentUsers = JSON.parse(localStorage.getItem('users') || '[]');
    currentUsers.push(newStaff);
    localStorage.setItem('users', JSON.stringify(currentUsers));
    
    setUsers(currentUsers);
    setIsAddingStaff(false);
    setStaffForm({ name: '', email: '', password: '', permissions: ['dashboard'] });
  };

  const togglePermissionInStaffForm = (p: UserPermission) => {
    setStaffForm((prev: any) => ({
      ...prev,
      permissions: prev.permissions.includes(p) 
        ? prev.permissions.filter((x: any) => x !== p)
        : [...prev.permissions, p]
    }));
  };

  const toggleDivisionInStaffForm = (id: string) => {
    setStaffForm((prev: any) => ({
      ...prev,
      divisionIds: prev.divisionIds?.includes(id) 
        ? prev.divisionIds.filter((x: any) => x !== id)
        : [...(prev.divisionIds || []), id]
    }));
  };

  const togglePermissionInForm = (p: UserPermission) => {
    setForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(p) 
        ? prev.permissions.filter(x => x !== p)
        : [...prev.permissions, p]
    }));
  };

  const updateUserPermissions = (userId: string, p: UserPermission) => {
    const updatedUsers = users.map(u => {
      if (u.id === userId) {
        const newPerms = u.permissions.includes(p)
          ? u.permissions.filter(x => x !== p)
          : [...u.permissions, p];
        return { ...u, permissions: newPerms };
      }
      return u;
    });
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  const deleteUser = (id: string) => {
    if (id === 'admin_root') return alert('Cannot delete root admin');
    const updated = users.filter(u => u.id !== id);
    localStorage.setItem('users', JSON.stringify(updated));
    setUsers(updated);
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const togglePermission = (perm: UserPermission) => {
    if (!selectedUser) return;
    const has = selectedUser.permissions.includes(perm);
    setSelectedUser({
      ...selectedUser,
      permissions: has
        ? selectedUser.permissions.filter((p) => p !== perm)
        : [...selectedUser.permissions, perm],
    });
  };

  const toggleUserDivision = (id: string) => {
    if (!selectedUser) return;
    const has = selectedUser.divisionIds?.includes(id);
    setSelectedUser({
      ...selectedUser,
      divisionIds: has
        ? selectedUser.divisionIds?.filter((d) => d !== id)
        : [...(selectedUser.divisionIds || []), id],
    });
  };

  const savePermissions = () => {
    if (!selectedUser) return;
    const updatedUsers = users.map((u) =>
      u.id === selectedUser.id ? selectedUser : u
    );
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-10 pb-20 animate-ios-slide-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Access Control</h1>
          <p className="text-zinc-500 font-medium tracking-tight uppercase text-[10px] tracking-[0.2em] mt-1">Managed Identity & Permission Registry</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsAdding(true)}
            className="bg-white/5 text-white border border-white/10 px-6 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-white/10 transition-all active:scale-95"
          >
            Invite Client
          </button>
          <button
            onClick={() => setIsAddingStaff(true)}
            className="bg-white text-black px-8 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-zinc-200 shadow-2xl transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Staff
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-[11px] font-black uppercase text-zinc-600 tracking-widest px-2">Active Personnel</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {users?.map(user => (
              <div key={user.id} className="glass-panel p-8 squircle-lg relative overflow-hidden flex flex-col group border border-white/5">
                <div className={`absolute top-0 right-0 w-1.5 h-full ${user?.isActive ? 'bg-emerald-500' : 'bg-red-500'} opacity-40`} />
                
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl font-black text-white">
                    {user?.email?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight leading-none mb-1 truncate max-w-[150px]">{user?.email || 'N/A'}</h3>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">{user?.role || 'User'}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {availablePermissions?.map(p => (
                    <button
                      key={p}
                      onClick={() => updateUserPermissions(user.id, p)}
                      className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                        user?.permissions?.includes(p) 
                          ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-500'
                          : 'bg-white/5 border border-white/5 text-zinc-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5 mb-8">
                  {user.divisionIds?.map(divId => {
                    const div = divisions.find(d => d.id === divId);
                    return (
                      <span key={divId} className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded text-[7px] font-black uppercase tracking-widest">
                        {div?.name || 'Unmapped Div'}
                      </span>
                    );
                  })}
                  {(!user.divisionIds || user.divisionIds.length === 0) && user.role === 'Staff' && (
                    <span className="text-[7px] font-black uppercase tracking-widest text-zinc-700 italic">No Operational Units Linked</span>
                  ) }
                </div>

                <div className="flex gap-2 mt-auto pt-4">
                   <button 
                    onClick={() => openEditModal(user)} 
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                   >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                   </button>
                   <button 
                    onClick={() => openEditModal(user)} 
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-zinc-500 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                   >
                    Reconfigure
                   </button>
                   <button 
                    onClick={() => deleteUser(user.id)} 
                    disabled={user.id === 'admin_root'}
                    className="p-3 bg-white/5 hover:bg-red-500/10 text-zinc-800 hover:text-red-500 rounded-xl transition-all disabled:opacity-20"
                   >
                    <Trash2 className="w-4 h-4" />
                   </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-[11px] font-black uppercase text-zinc-600 tracking-widest px-2">Pending Onboarding</h3>
          <div className="space-y-4">
            {invites?.map(invite => (
              <div key={invite?.token} className="glass-panel p-6 rounded-3xl border border-white/5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-white truncate max-w-[150px]">{invite?.email || 'N/A'}</p>
                    <p className="text-[8px] font-black uppercase text-zinc-600 tracking-widest mt-1">{invite?.role || 'Guest'}</p>
                  </div>
                  <div className="p-2 bg-amber-500/10 rounded-lg"><LinkIcon className="w-3 h-3 text-amber-500" /></div>
                </div>
                <button
                  onClick={() => copyToClipboard(`${window.location.origin}/invite/${invite.token}`)}
                  className="w-full py-2 bg-white/5 hover:bg-white/10 text-[9px] font-black uppercase tracking-widest text-zinc-400 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  <Copy className="w-3 h-3" /> Copy Link
                </button>
              </div>
            ))}
            {invites.length === 0 && (
              <div className="p-10 border border-dashed border-white/10 rounded-[2rem] text-center">
                <p className="text-[9px] font-black uppercase text-zinc-800 tracking-widest tracking-widest">No pending invites</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-6 backdrop-blur-2xl">
          <div className="bg-zinc-900 border border-white/10 rounded-[3rem] w-full max-w-xl p-12 shadow-2xl animate-ios-slide-up">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">Identity Generation</h2>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] mt-2 italic">Controlled Access Protocol</p>
              </div>
              <button 
                onClick={() => { setIsAdding(false); setLastGeneratedLink(null); }} 
                className="p-3 bg-white/5 text-zinc-600 hover:text-white rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {lastGeneratedLink ? (
              <div className="space-y-8 py-4">
                <div className="p-8 bg-emerald-500/10 border border-emerald-500/20 rounded-3xl text-center space-y-4">
                   <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 scale-110">
                    <Check className="w-6 h-6 text-white" />
                   </div>
                   <h4 className="text-xl font-black text-white uppercase tracking-tight leading-none">Protocol Initialized</h4>
                   <p className="text-xs text-zinc-500 font-medium">Link is active for specialized onboarding.</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest px-1">Access URL</p>
                  <div className="flex gap-2">
                    <input readOnly className="flex-1 bg-black/40 border border-white/10 rounded-2xl p-5 text-xs font-mono text-zinc-400 outline-none" value={lastGeneratedLink} />
                    <button 
                      onClick={() => copyToClipboard(lastGeneratedLink)}
                      className={`px-8 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${copied ? 'bg-emerald-500 text-white' : 'bg-white text-black'}`}
                    >
                      {copied ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                
                <button 
                  onClick={() => { setIsAdding(false); setLastGeneratedLink(null); }}
                  className="w-full py-5 bg-white/5 text-zinc-500 hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"
                >
                  Dismiss Terminal
                </button>
              </div>
            ) : (
              <form onSubmit={generateInvite} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Subject Email</label>
                  <input required type="email" className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm font-black text-white outline-none" placeholder="identity@org.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Security Role</label>
                  <div className="flex gap-2">
                    {(['Staff', 'Client', 'Admin'] as UserRole[]).map(r => (
                      <button
                        key={r} type="button"
                        onClick={() => setForm({ ...form, role: r })}
                        className={`flex-1 py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${form.role === r ? 'bg-white text-black' : 'bg-white/5 text-zinc-600'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Permission Profile</label>
                  <div className="grid grid-cols-2 gap-2">
                    {availablePermissions.map(p => (
                      <button
                        key={p} type="button"
                        onClick={() => togglePermissionInForm(p)}
                        className={`py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${form.permissions.includes(p) ? 'bg-blue-600/10 border-blue-600/20 text-blue-500' : 'bg-white/5 border-white/5 text-zinc-700'}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setIsAdding(false)} className="flex-1 py-5 bg-white/5 text-zinc-500 hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">Discard</button>
                  <button type="submit" className="flex-1 py-5 bg-white text-black hover:bg-zinc-200 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl transition-all">Generate Payload</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ADD STAFF MODAL */}
      {isAddingStaff && (
        <div className="fixed inset-0 bg-black/90 z-[250] flex items-center justify-center p-6 backdrop-blur-2xl">
          <div className="bg-[#0b0b0b] border border-white/10 rounded-[3rem] w-full max-w-xl p-12 shadow-2xl animate-ios-slide-up">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">Strategic Onboarding</h2>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] mt-2 italic">Manual Personnel Provisioning</p>
              </div>
              <button 
                onClick={() => setIsAddingStaff(false)} 
                className="p-3 bg-white/5 text-zinc-600 hover:text-white rounded-full transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddStaff} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Full Name</label>
                  <input required className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm font-black text-white outline-none" placeholder="Rahul S" value={staffForm.name} onChange={e => setStaffForm({ ...staffForm, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Email ID</label>
                  <input required type="email" className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm font-black text-white outline-none" placeholder="rahul@artisans.os" value={staffForm.email} onChange={e => setStaffForm({ ...staffForm, email: e.target.value })} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Initial Password</label>
                <input required className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none" value={staffForm.password} onChange={e => setStaffForm({ ...staffForm, password: e.target.value })} />
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Infrastructure Permissions</label>
                <div className="grid grid-cols-4 gap-2">
                  {availablePermissions.map(p => (
                    <button
                      key={p} type="button"
                      onClick={() => togglePermissionInStaffForm(p)}
                      className={`py-2 px-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${staffForm.permissions.includes(p) ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-white/5 border-white/5 text-zinc-700'}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Unit Assignment (Divisions)</label>
                <div className="grid grid-cols-2 gap-2">
                  {divisions.map(d => (
                    <button
                      key={d.id} type="button"
                      onClick={() => toggleDivisionInStaffForm(d.id)}
                      className={`py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${staffForm.divisionIds?.includes(d.id) ? 'bg-blue-600/10 border-blue-600/20 text-blue-500' : 'bg-white/5 border-white/5 text-zinc-700'}`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <button type="submit" className="w-full py-5 bg-white text-black font-black rounded-2xl text-[11px] uppercase tracking-widest shadow-2xl transition-all hover:bg-zinc-200">Initialize Personnel</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* EDIT STAFF MODAL */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xl z-[300] flex items-center justify-center p-6 animate-ios-slide-up">
          <div className="bg-[#0b0b0b] border border-white/10 rounded-[2.5rem] p-10 w-full max-w-lg shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-1 bg-blue-600/50" />
             
             <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Edit Personnel Profile</h2>
                  <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mt-1">Registry ID: {selectedUser.id}</p>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white/5 rounded-full text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
             </div>

             <div className="space-y-6 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] px-1">Name</label>
                    <input className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-white/20 transition-all" value={selectedUser.name || ''} onChange={e => setSelectedUser({...selectedUser, name: e.target.value})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] px-1">Email</label>
                    <input className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-white/20 transition-all" value={selectedUser.email || ''} onChange={e => setSelectedUser({...selectedUser, email: e.target.value})} />
                  </div>
                </div>

                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] px-1">Security Token (Password)</label>
                    <input type="password" placeholder="••••••••" className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-xs font-mono text-white outline-none focus:border-white/20 transition-all" value={selectedUser.password || ''} onChange={e => setSelectedUser({...selectedUser, password: e.target.value})} />
                  </div>

                  <div className="space-y-4 pt-4 border-t border-white/5 mt-4">
                   <label className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] px-1">Operational Domain (Divisions)</label>
                   <div className="grid grid-cols-1 gap-2">
                     {divisions.map((div) => (
                       <label 
                         key={div.id} 
                         className={`flex justify-between items-center px-6 py-4 rounded-2xl cursor-pointer transition-all border ${
                           selectedUser.divisionIds?.includes(div.id)
                             ? "bg-blue-600/10 border-blue-600/20 text-blue-500"
                             : "bg-white/5 border-white/5 text-zinc-600 hover:bg-white/10"
                         }`}
                       >
                         <span className="text-[10px] font-black uppercase tracking-widest">{div.name}</span>
                         <div className="relative flex items-center">
                           <input
                             type="checkbox"
                             className="hidden"
                             checked={selectedUser.divisionIds?.includes(div.id)}
                             onChange={() => toggleUserDivision(div.id)}
                           />
                           <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                             selectedUser.divisionIds?.includes(div.id) ? "bg-blue-500 border-blue-500" : "bg-transparent border-white/10"
                           }`}>
                             {selectedUser.divisionIds?.includes(div.id) && <Check className="w-3 h-3 text-white stroke-[4px]" />}
                           </div>
                         </div>
                       </label>
                     ))}
                   </div>
                 </div>
             </div>

             <div className="pt-8 flex flex-col gap-4">
                {successMsg && (
                   <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest text-center animate-pulse">{successMsg}</p>
                )}
                <button
                  onClick={() => {
                    if (!selectedUser.email || !selectedUser.password) return alert('Email and Password are required.');
                    savePermissions();
                    setSuccessMsg('Registry Updated Successfully');
                    setTimeout(() => {
                       setSuccessMsg(null);
                    }, 2000);
                  }}
                  className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl hover:bg-zinc-200 transition-all active:scale-95"
                >
                  Synchronize Data
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserAccessManager;
