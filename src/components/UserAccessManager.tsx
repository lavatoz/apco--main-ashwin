import React, { useState, useEffect } from "react";
import {
  Plus,
  X,
  Trash2,
  Link as LinkIcon,
  Copy,
  Check,
  Edit2,
  RefreshCw,
} from "lucide-react";
import { type User, type UserPermission } from "../types";

interface UserAccessManagerProps {}

const UserAccessManager: React.FC<UserAccessManagerProps> = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isClientPanelOpen, setIsClientPanelOpen] = useState(false);
  const [selectedClientUser, setSelectedClientUser] = useState<User | null>(null);

  const [copied, setCopied] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [divisions, setDivisions] = useState<any[]>([]);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const [softDeletedUser, setSoftDeletedUser] = useState<{user: User; timeout: NodeJS.Timeout} | null>(null);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (softDeletedUser && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [softDeletedUser, countdown]);

  const currentUserStr = localStorage.getItem("auth_user");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const isAdmin = currentUser?.role === "Admin";

  const staffUsers = users.filter(u => u.role === "Staff" || u.role === "Admin");
  const clientUsers = users.filter(u => u.role === "Client");

  const [staffForm, setStaffForm] = useState<any>({
    name: "",
    email: "",
    password: "",
    staffRole: "photographer",
    permissions: ["dashboard"],
    divisionIds: [],
  });

  const [clientForm, setClientForm] = useState<{
    email: string;
    permissions: UserPermission[];
  }>({
    email: "",
    permissions: ["dashboard", "files"],
  });

  const availablePermissions: UserPermission[] = [
    "dashboard",
    "clients",
    "tasks",
    "finance",
    "ai",
    "analytics",
    "system",
    "workflow",
  ];
  const staffRoles: any[] = [
    { id: "photographer", label: "Photographer" },
    { id: "videographer", label: "Videographer" },
    { id: "editor", label: "Editor" },
    { id: "assistant", label: "Assistant" },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setUsers(JSON.parse(localStorage.getItem("users") || "[]"));
    setDivisions(JSON.parse(localStorage.getItem("divisions") || "[]"));
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleAddClientAccess = (e: React.FormEvent) => {
    e.preventDefault();
    const newClient: User = {
      id: `client_${Math.random().toString(36).substring(2, 9)}`,
      email: clientForm.email,
      role: "Client",
      permissions: clientForm.permissions,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const currentUsers = JSON.parse(localStorage.getItem("users") || "[]");
    currentUsers.push(newClient);
    localStorage.setItem("users", JSON.stringify(currentUsers));

    setUsers(currentUsers);
    setIsAddingClient(false);
    setClientForm({ email: "", permissions: ["dashboard", "files"] });
    showSuccess("Client Identity Provisioned");
  };

  const handleAddStaff = (e: React.FormEvent) => {
    e.preventDefault();
    const newStaff: User = {
      id: `staff_${Math.random().toString(36).substring(2, 9)}`,
      name: staffForm.name,
      email: staffForm.email,
      password: staffForm.password,
      role: "Staff",
      staffRole: staffForm.staffRole,
      permissions: staffForm.permissions,
      divisionIds: staffForm.divisionIds,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const currentUsers = JSON.parse(localStorage.getItem("users") || "[]");
    currentUsers.push(newStaff);
    localStorage.setItem("users", JSON.stringify(currentUsers));

    setUsers(currentUsers);
    setIsAddingStaff(false);
    setStaffForm({
      name: "",
      email: "",
      password: "",
      staffRole: "photographer",
      permissions: ["dashboard"],
      divisionIds: [],
    });
    showSuccess("Staff Provisioned");
  };

  const togglePermissionInStaffForm = (p: UserPermission) => {
    setStaffForm((prev: any) => ({
      ...prev,
      permissions: prev.permissions.includes(p)
        ? prev.permissions.filter((x: any) => x !== p)
        : [...prev.permissions, p],
    }));
  };

  const toggleDivisionInStaffForm = (id: string) => {
    setStaffForm((prev: any) => ({
      ...prev,
      divisionIds: prev.divisionIds?.includes(id)
        ? prev.divisionIds.filter((x: any) => x !== id)
        : [...(prev.divisionIds || []), id],
    }));
  };

  const togglePermissionInClientForm = (p: UserPermission) => {
    setClientForm((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(p)
        ? prev.permissions.filter((x) => x !== p)
        : [...prev.permissions, p],
    }));
  };

  const updateUserPermissions = (userId: string, p: UserPermission) => {
    const updatedUsers = users.map((u) => {
      if (u.id === userId) {
        const newPerms = u.permissions.includes(p)
          ? u.permissions.filter((x) => x !== p)
          : [...u.permissions, p];
        return { ...u, permissions: newPerms };
      }
      return u;
    });
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
  };

  const confirmDelete = () => {
    if (!userToDelete) return;
    if (userToDelete.id === "admin_root") {
      alert("Cannot delete root admin");
      setIsDeleteModalOpen(false);
      return;
    }
    if (userToDelete.email === currentUser?.email) {
      alert("You cannot delete your own account");
      setIsDeleteModalOpen(false);
      return;
    }
    
    const targetId = userToDelete.id;
    const targetUser = userToDelete;
    
    // Soft Delete (UI only instantly)
    const updated = users.filter((u) => u.id !== targetId);
    setUsers(updated);
    if (selectedClientUser?.id === targetId) {
       setIsClientPanelOpen(false);
       setSelectedClientUser(null);
    }
    
    setCountdown(5);
    const timeout = setTimeout(() => {
        // Permanent Delete Execution
        const currentUsers = JSON.parse(localStorage.getItem("users") || "[]");
        const finalUsers = currentUsers.filter((u: User) => u.id !== targetId);
        localStorage.setItem("users", JSON.stringify(finalUsers));
        setSoftDeletedUser(null);
    }, 5000);
    
    setSoftDeletedUser({ user: targetUser, timeout });
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
  };

  const undoDelete = () => {
    if (softDeletedUser) {
        clearTimeout(softDeletedUser.timeout);
        setUsers(prev => [...prev, softDeletedUser.user]);
        setSoftDeletedUser(null);
    }
  };

  const openEditModal = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
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
    const updatedUsers = users.map((u) => u.id === selectedUser.id ? selectedUser : u);
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    setUsers(updatedUsers);
    setIsModalOpen(false);
    setSelectedUser(null);
  };

  const manageClientLink = (action: 'generate' | 'copy' | 'regenerate') => {
    if (!selectedClientUser) return;
    
    if (action === 'copy' && selectedClientUser.inviteLink) {
        copyToClipboard(selectedClientUser.inviteLink);
        return;
    }

    const token = Math.random().toString(36).substring(2, 15);
    const updatedUser = { 
        ...selectedClientUser, 
        inviteToken: token, 
        inviteLink: `${window.location.origin}/invite/${token}` 
    };
    
    const updatedUsers = users.map(u => u.id === selectedClientUser.id ? updatedUser : u);
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    setSelectedClientUser(updatedUser);
    showSuccess(action === 'regenerate' ? 'Link Regenerated' : 'Link Generated');
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
            onClick={() => setIsAddingClient(true)}
            className="bg-white/5 text-white border border-white/10 px-6 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-white/10 transition-all active:scale-95"
          >
            Add Client
          </button>
          <button
            onClick={() => setIsAddingStaff(true)}
            className="bg-white text-black px-8 py-3.5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-zinc-200 shadow-2xl transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        </div>
      </div>

      <div className="space-y-12">
        {/* STAFF SECTION */}
        <div className="space-y-6">
          <h3 className="text-[11px] font-black uppercase text-zinc-600 tracking-widest px-2">Internal Personnel (Staff / Admin)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {staffUsers.map((user) => (
              <div key={user.id} className="glass-panel p-8 squircle-lg relative overflow-hidden flex flex-col group border border-white/5">
                <div className={`absolute top-0 right-0 w-1.5 h-full ${user?.isActive ? "bg-emerald-500" : "bg-red-500"} opacity-40`} />
                
                {isAdmin && user.email !== currentUser?.email && user.id !== 'admin_root' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); setUserToDelete(user); setIsDeleteModalOpen(true); }}
                    className="absolute top-4 right-4 p-2 bg-black/40 text-zinc-500 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-500 transition-all z-10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}

                <div className="flex items-center gap-4 mb-6 mt-2">
                  <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl font-black text-white">
                    {user?.email?.charAt(0).toUpperCase() || "?"}
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase tracking-tight leading-none mb-1 truncate max-w-[150px]">{user?.email || "N/A"}</h3>
                    <p className="text-[9px] font-black uppercase tracking-widest text-zinc-600">
                      {user?.role || "User"} {user.staffRole && `• ${user.staffRole}`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-2">
                  {availablePermissions?.map((p) => (
                    <button
                      key={p}
                      onClick={() => updateUserPermissions(user.id, p)}
                      className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${
                        user?.permissions?.includes(p)
                          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
                          : "bg-white/5 border border-white/5 text-zinc-700"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5 mb-8">
                  {user.divisionIds?.map((divId) => {
                    const div = divisions.find((d) => d.id === divId);
                    return (
                      <span key={divId} className="px-2 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded text-[7px] font-black uppercase tracking-widest">
                        {div?.name || "Unmapped Div"}
                      </span>
                    );
                  })}
                  {(!user.divisionIds || user.divisionIds.length === 0) && user.role === "Staff" && (
                      <span className="text-[7px] font-black uppercase tracking-widest text-zinc-700 italic">No Operational Units Linked</span>
                  )}
                </div>

                <div className="flex gap-2 mt-auto pt-4 border-t border-white/5">
                  <button
                    onClick={() => openEditModal(user)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-3.5 h-3.5" /> Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CLIENTS SECTION */}
        <div className="space-y-6">
          <h3 className="text-[11px] font-black uppercase text-zinc-600 tracking-widest px-2">External Agents (Clients)</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             {clientUsers.map(user => (
               <div key={user.id} onClick={() => { setSelectedClientUser(user); setIsClientPanelOpen(true); }} className="glass-panel p-6 border border-white/5 rounded-3xl cursor-pointer hover:bg-white/5 transition-all group relative">
                 <div className={`absolute top-0 right-0 w-1.5 h-full ${user.password ? 'bg-emerald-500' : 'bg-amber-500'} opacity-40`} />
                 
                 {isAdmin && user.email !== currentUser?.email && user.id !== 'admin_root' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); setUserToDelete(user); setIsDeleteModalOpen(true); }}
                      className="absolute top-4 right-4 p-2 bg-black/40 text-zinc-500 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-500 transition-all z-10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                 )}

                 <h4 className="text-sm font-black text-white truncate max-w-[85%]">{user.name || 'Client User'}</h4>
                 <p className="text-[9px] font-bold text-zinc-500 truncate mb-4">{user.email}</p>
                 <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded text-[7px] font-black uppercase tracking-widest ${user.password ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                      {user.password ? 'Active' : 'Pending'}
                    </span>
                 </div>
               </div>
             ))}
             {clientUsers.length === 0 && (
                 <div className="p-10 border border-dashed border-white/10 rounded-[2rem] text-center col-span-full">
                     <p className="text-[9px] font-black uppercase text-zinc-800 tracking-widest">No clients provisioned</p>
                 </div>
             )}
          </div>
        </div>
      </div>

      {/* CLIENT ADD ONS */}
      {isAddingClient && (
        <div className="fixed inset-0 bg-black/90 z-[200] flex items-center justify-center p-6 backdrop-blur-2xl">
          <div className="bg-zinc-900 border border-white/10 rounded-[3rem] w-full max-w-xl p-12 shadow-2xl animate-ios-slide-up">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">Provision Client</h2>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] mt-2 italic">Client Identity Generation</p>
              </div>
              <button
                onClick={() => setIsAddingClient(false)}
                className="p-3 bg-white/5 text-zinc-600 hover:text-white rounded-full"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleAddClientAccess} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Subject Email</label>
                  <input
                    required
                    type="email"
                    className="w-full bg-white/5 border border-white/5 rounded-2xl p-5 text-sm font-black text-white outline-none focus:border-white/20 transition-all"
                    placeholder="client@organization.com"
                    value={clientForm.email}
                    onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Base Permission Profile</label>
                  <div className="grid grid-cols-2 gap-2">
                    {availablePermissions.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePermissionInClientForm(p)}
                        className={`py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${clientForm.permissions.includes(p) ? "bg-blue-600/10 border-blue-600/20 text-blue-500" : "bg-white/5 border-white/5 text-zinc-700 hover:bg-white/10"}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setIsAddingClient(false)} className="flex-1 py-5 bg-white/5 text-zinc-500 hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all">Discard</button>
                  <button type="submit" className="flex-1 py-5 bg-white text-black hover:bg-zinc-200 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95">Initialize Profile</button>
                </div>
            </form>
          </div>
        </div>
      )}

      {/* CLIENT CONFIGURATION PANEL */}
      {isClientPanelOpen && selectedClientUser && (
        <div className="fixed top-[5vh] right-[5vw] md:right-[2vw] w-full max-w-[380px] bg-[#0b0b0b] border border-white/10 rounded-[2rem] shadow-2xl animate-ios-slide-left z-[300] flex flex-col overflow-hidden max-h-[90vh] bottom-[5vh]">
            <div className="p-6 border-b border-white/5 relative shrink-0">
               <button onClick={() => setIsClientPanelOpen(false)} className="absolute top-5 right-5 p-2 bg-white/5 text-zinc-500 rounded-full hover:text-white transition-all"><X className="w-4 h-4"/></button>
               <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-1">Client Terminal</h2>
               <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.2em]">Identity Management</p>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6 no-scrollbar">
               <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                   <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-1.5">Subject Entity</p>
                   <h3 className="text-base font-black text-white truncate max-w-[200px]">{selectedClientUser.name || 'Unknown Client'}</h3>
                   <p className="text-[9px] font-bold text-zinc-400 mt-1">{selectedClientUser.email}</p>
                   
                   <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-2">Registration Status</p>
                      <span className={`px-2.5 py-1.5 rounded-lg text-[7px] font-black uppercase tracking-widest inline-block ${selectedClientUser.password ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                        {selectedClientUser.password ? 'Active (Authenticated)' : 'Pending (Invited)'}
                      </span>
                   </div>
               </div>

               <div className="space-y-3 pb-2">
                  <h4 className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Authentication Link</h4>
                  {selectedClientUser.inviteLink ? (
                      <textarea readOnly value={selectedClientUser.inviteLink} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-[9px] font-mono text-zinc-400 outline-none resize-none h-20 leading-relaxed" />
                  ) : (
                      <div className="p-6 border border-dashed border-white/10 rounded-xl text-center">
                         <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">No Link Provisioned</p>
                      </div>
                  )}
               </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-black/90 shrink-0 space-y-3 backdrop-blur-xl">
               {selectedClientUser.inviteLink ? (
                  <div className="flex gap-2">
                     <button onClick={() => manageClientLink('copy')} className="flex-1 py-3 bg-white text-black font-black text-[9px] uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-all flex justify-center items-center gap-2 active:scale-95">
                        {copied ? <Check className="w-3.5 h-3.5"/> : <Copy className="w-3.5 h-3.5" />} Copy
                     </button>
                     <button onClick={() => manageClientLink('regenerate')} className="flex-1 py-3 bg-white/5 text-zinc-400 hover:text-white font-black text-[9px] uppercase tracking-widest rounded-xl transition-all flex justify-center items-center gap-2 border border-white/5 active:scale-95">
                        <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                     </button>
                  </div>
               ) : (
                  <button onClick={() => manageClientLink('generate')} className="w-full py-3 bg-blue-600 text-white font-black text-[9px] uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:scale-[0.98] transition-all flex items-center justify-center gap-2 active:scale-95">
                     <LinkIcon className="w-3.5 h-3.5" /> Generate Link
                  </button>
               )}
               <button 
                  onClick={() => { setUserToDelete(selectedClientUser); setIsDeleteModalOpen(true); }}
                  className="w-full py-3 text-red-500 hover:bg-red-500/10 border border-red-500/20 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all gap-2 flex items-center justify-center active:scale-95"
               >
                  <Trash2 className="w-3.5 h-3.5" /> Revoke Access
               </button>
            </div>
            
            {successMsg && (
               <div className="absolute top-6 right-1/2 translate-x-1/2 whitespace-nowrap bg-emerald-500 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest animate-fade-in-down z-[400] shadow-2xl border border-white/20">
                 {successMsg}
               </div>
            )}
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
                  <input
                    required
                    className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm font-black text-white outline-none focus:border-white/20 transition-all"
                    placeholder="Rahul S"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Email ID</label>
                  <input
                    required
                    type="email"
                    className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm font-black text-white outline-none focus:border-white/20 transition-all"
                    placeholder="rahul@artisans.os"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Designated Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {staffRoles.map((sr) => (
                    <button
                      key={sr.id}
                      type="button"
                      onClick={() => setStaffForm({ ...staffForm, staffRole: sr.id })}
                      className={`py-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${staffForm.staffRole === sr.id ? "bg-white text-black" : "bg-white/5 text-zinc-600 hover:bg-white/10"}`}
                    >
                      {sr.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Infrastructure Permissions</label>
                <div className="grid grid-cols-4 gap-2">
                  {availablePermissions.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePermissionInStaffForm(p)}
                      className={`py-2 px-1 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${staffForm.permissions.includes(p) ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-white/5 border-white/5 text-zinc-700 hover:bg-white/10"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Unit Assignment (Divisions)</label>
                <div className="grid grid-cols-2 gap-2">
                  {divisions.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDivisionInStaffForm(d.id)}
                      className={`py-3 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${staffForm.divisionIds?.includes(d.id) ? "bg-blue-600/10 border-blue-600/20 text-blue-500" : "bg-white/5 border-white/5 text-zinc-700 hover:bg-white/10"}`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full py-5 bg-white text-black font-black rounded-2xl text-[11px] uppercase tracking-widest shadow-2xl transition-all hover:bg-zinc-200 active:scale-95"
                >
                  Initialize Personnel
                </button>
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
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 bg-white/5 rounded-full text-zinc-500 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6 max-h-[500px] overflow-y-auto no-scrollbar pr-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] px-1">Name</label>
                  <input
                    className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-white/20 transition-all"
                    value={selectedUser.name || ""}
                    onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] px-1">Email</label>
                  <input
                    className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-white/20 transition-all"
                    value={selectedUser.email || ""}
                    onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] px-1">Security Token (Password)</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-xs font-mono text-white outline-none focus:border-white/20 transition-all"
                  value={selectedUser.password || ""}
                  onChange={(e) => setSelectedUser({ ...selectedUser, password: e.target.value })}
                />
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
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                            selectedUser.divisionIds?.includes(div.id) ? "bg-blue-500 border-blue-500" : "bg-transparent border-white/10"
                          }`}
                        >
                          {selectedUser.divisionIds?.includes(div.id) && <Check className="w-3 h-3 text-white stroke-[4px]" />}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-8 flex flex-col gap-4">
              <button
                onClick={() => {
                  if (!selectedUser.email || !selectedUser.password) return alert("Email and Password are required.");
                  savePermissions();
                  showSuccess("Registry Updated Successfully");
                }}
                className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] shadow-2xl hover:bg-zinc-200 transition-all active:scale-95"
              >
                Synchronize Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 bg-black/90 z-[350] flex items-center justify-center p-6 backdrop-blur-2xl">
          <div className="bg-zinc-900 border border-white/10 rounded-[3rem] w-full max-w-md p-12 shadow-2xl animate-ios-slide-up text-center">
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase mb-4">Delete User?</h2>
            <p className="text-sm text-zinc-500 font-medium mb-10 pb-4 border-b border-white/5">
              This will permanently remove access for <span className="text-white font-black">{userToDelete.email}</span>. This protocol is irreversible.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
                className="flex-1 py-5 bg-white/5 text-zinc-500 hover:text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-5 bg-red-600 text-white hover:bg-red-500 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-2xl transition-all active:scale-95"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SOFT DELETE TOAST */}
      {softDeletedUser && (
         <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-[#0b0b0b] border border-white/10 p-5 rounded-2xl shadow-2xl z-[500] flex items-center gap-8 animate-ios-slide-up">
            <div className="flex items-center gap-4">
               <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                  <Trash2 className="w-4 h-4 text-red-500" />
               </div>
               <div>
                 <p className="text-sm font-black text-white leading-none mb-1">User Deleted</p>
                 <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Permanently removing in {countdown}s</p>
               </div>
            </div>
            <button 
              onClick={undoDelete}
              className="px-6 py-3 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-zinc-200 transition-all active:scale-95"
            >
              Undo
            </button>
         </div>
      )}
    </div>
  );
};

export default UserAccessManager;
