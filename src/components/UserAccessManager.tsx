import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  X,
  Trash2,
  Link as LinkIcon,
  Copy,
  Check,
  Edit2,
  RefreshCw,
  Loader2,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { getAuthUser } from "../utils/storage";
import { type User, type UserPermission } from "../types";

interface UserAccessManagerProps {}

const UserAccessManager: React.FC<UserAccessManagerProps> = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [activeTab, setActiveTab] = useState<'team' | 'clients'>('team');
  const [roleFilter, setRoleFilter] = useState('all');
  const [availableRoles, setAvailableRoles] = useState<any[]>([]);
  
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);
  const [roleInputName, setRoleInputName] = useState("");
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  
  const [roleToReassign, setRoleToReassign] = useState<any>(null);
  const [replacementRoleId, setReplacementRoleId] = useState("");
  
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [isClientPanelOpen, setIsClientPanelOpen] = useState(false);
  const [selectedClientUser, setSelectedClientUser] = useState<User | null>(null);

  const [copied, setCopied] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [divisions, setDivisions] = useState<any[]>([]);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  useEffect(() => {
    const isAnyModalOpen = isAddingClient || isAddingStaff || isModalOpen || !!roleToReassign || isClientPanelOpen;
    if (isAnyModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isAddingClient, isAddingStaff, isModalOpen, roleToReassign, isClientPanelOpen]);

  const [isDeleting, setIsDeleting] = useState(false);
  const [fadingId, setFadingId] = useState<string | null>(null);

  useEffect(() => {
    if (isDeleteModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isDeleteModalOpen]);

  const currentUser = getAuthUser();
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

  const staffPermissions: UserPermission[] = [
    "dashboard",
    "clients",
    "tasks",
    "finance",
    "ai",
    "analytics",
    "system",
    "workflow",
  ];

  const clientPermissions: UserPermission[] = [
    "events",
    "timeline",
    "gallery",
    "deliverables",
    "invoices",
    "agreements",
    "messages",
    "support"
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setUsers(JSON.parse(localStorage.getItem("users") || "[]"));
    setDivisions(JSON.parse(localStorage.getItem("divisions") || "[]"));
    
    const savedRoles = localStorage.getItem('artisans_roles');
    if (savedRoles) {
      setAvailableRoles(JSON.parse(savedRoles));
    } else {
      const defaultRoles = [
        { id: 'photographer', name: 'Photographer' },
        { id: 'videographer', name: 'Videographer' },
        { id: 'editor', name: 'Editor' },
        { id: 'assistant', name: 'Assistant' },
      ];
      setAvailableRoles(defaultRoles);
      localStorage.setItem('artisans_roles', JSON.stringify(defaultRoles));
    }
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

  const confirmDelete = async () => {
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
    
    // 1. Loading state in modal
    setIsDeleting(true);
    await new Promise(r => setTimeout(r, 150));

    // 2. Clear modal and start fade-out
    setFadingId(targetId);
    setIsDeleteModalOpen(false);
    setUserToDelete(null);
    setIsDeleting(false);

    // 3. Cache for rollback
    const originalUsers = [...users];

    // 4. Wait for animation
    await new Promise(r => setTimeout(r, 250));

    // 5. Update UI
    setUsers(prev => prev.filter(u => u.id !== targetId));
    if (selectedClientUser?.id === targetId) {
       setIsClientPanelOpen(false);
       setSelectedClientUser(null);
    }
    
    // 6. Background persistence
    try {
        const currentUsers = JSON.parse(localStorage.getItem("users") || "[]");
        const finalUsers = currentUsers.filter((u: User) => u.id !== targetId);
        localStorage.setItem("users", JSON.stringify(finalUsers));
        showSuccess("Identity Protocol Revoked");
    } catch (err) {
        console.error("Deletion failed, rolling back", err);
        setUsers(originalUsers);
        alert("Failed to delete user. Restoring account.");
    } finally {
        setFadingId(null);
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

  const handleCreateRole = () => {
    if (!roleInputName.trim()) return;
    const newRole = {
      id: roleInputName.toLowerCase().replace(/\s+/g, '_') + '_' + Math.random().toString(36).substring(2, 5),
      name: roleInputName.trim()
    };
    const updated = [...availableRoles, newRole];
    setAvailableRoles(updated);
    localStorage.setItem('artisans_roles', JSON.stringify(updated));
    setRoleInputName("");
    setIsCreatingRole(false);
  };

  const handleUpdateRole = (id: string) => {
    if (!roleInputName.trim()) return;
    const updated = availableRoles.map(r => r.id === id ? { ...r, name: roleInputName.trim() } : r);
    setAvailableRoles(updated);
    localStorage.setItem('artisans_roles', JSON.stringify(updated));
    setEditingRoleId(null);
    setRoleInputName("");
  };

  const startDeleteRole = (role: any) => {
    const usersWithRole = users.filter(u => u.staffRole === role.id);
    if (usersWithRole.length === 0) {
      const updated = availableRoles.filter(r => r.id !== role.id);
      setAvailableRoles(updated);
      localStorage.setItem('artisans_roles', JSON.stringify(updated));
    } else {
      setRoleToReassign({ ...role, count: usersWithRole.length });
    }
  };

  const confirmReassignAndDelete = () => {
    if (!replacementRoleId || !roleToReassign) return;
    
    // 1. Reassign users
    const updatedUsers = users.map(u => u.staffRole === roleToReassign.id ? { ...u, staffRole: replacementRoleId } : u);
    setUsers(updatedUsers);
    localStorage.setItem('users', JSON.stringify(updatedUsers));
    
    // 2. Delete role
    const updatedRoles = availableRoles.filter(r => r.id !== roleToReassign.id);
    setAvailableRoles(updatedRoles);
    localStorage.setItem('artisans_roles', JSON.stringify(updatedRoles));
    
    setRoleToReassign(null);
    setReplacementRoleId("");
    showSuccess("Role Deleted & Users Reassigned");
  };

  const emailCounts = users.reduce((acc, user) => {
    if (user.email) {
      acc[user.email.toLowerCase()] = (acc[user.email.toLowerCase()] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const filteredStaff = staffUsers.filter(u => 
    (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const staffGroups = [
    { id: "admin", label: "ADMINS", icon: "🛡️", items: filteredStaff.filter(u => u.role === "Admin") },
    ...availableRoles.map(r => ({
       id: r.id,
       label: r.name.toUpperCase() + "S",
       icon: "👥",
       items: filteredStaff.filter(u => u.staffRole === r.id)
    }))
  ].filter(g => g.items.length > 0);

  const roleStats: any = {
    all: staffUsers.length,
    admin: staffUsers.filter(u => u.role === "Admin").length,
  };
  availableRoles.forEach(r => {
    roleStats[r.id] = staffUsers.filter(u => u.staffRole === r.id).length;
  });

  const filteredClients = clientUsers.filter(u => 
    (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getClientStatus = (user: User) => {
    if (user.password) return 'ACTIVE';
    if (user.inviteToken) return 'PENDING';
    return 'REVOKED';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'bg-primary/10 text-primary';
      case 'PENDING': return 'bg-amber-500/10 text-amber-500';
      case 'REVOKED': return 'bg-red-500/10 text-red-500';
      default: return 'bg-zinc-500/10 text-zinc-500';
    }
  };

  const clientActiveItems = filteredClients.filter(u => getClientStatus(u) === 'ACTIVE');
  const clientPendingItems = filteredClients.filter(u => getClientStatus(u) === 'PENDING');
  const clientRevokedItems = filteredClients.filter(u => getClientStatus(u) === 'REVOKED');

  return (
    <>
    <div className="space-y-10 pb-20 animate-ios-slide-up">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-white tracking-tight">Access Control</h1>
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-[0.2em] mt-1">Managed Identity & Permission Registry</p>
        </div>
        <div className="flex-1 max-w-md mx-8 hidden md:block">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search by name or email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-6 text-sm font-medium text-white outline-none focus:border-white/20 transition-all placeholder:text-zinc-600"
            />
          </div>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsAddingClient(true)}
            className="bg-white/5 text-white border border-white/10 px-6 py-3.5 rounded-2xl font-bold uppercase text-xs tracking-widest flex items-center gap-3 hover:bg-white/10 transition-all active:scale-95"
          >
            Add Client
          </button>
          <button
            onClick={() => setIsAddingStaff(true)}
            className="bg-white text-black px-8 py-3.5 rounded-2xl font-bold uppercase text-xs tracking-widest flex items-center gap-3 hover:bg-zinc-200 shadow-2xl transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Add Staff
          </button>
        </div>
      </div>

      {/* TABS */}
      <div className="flex items-center gap-8 border-b border-white/5 px-2">
        <button 
          onClick={() => setActiveTab('team')}
          className={`pb-4 text-xs font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === 'team' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
        >
          Team ({staffUsers.length})
          {activeTab === 'team' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('clients')}
          className={`pb-4 text-xs font-bold uppercase tracking-[0.2em] transition-all relative ${activeTab === 'clients' ? 'text-white' : 'text-zinc-600 hover:text-zinc-400'}`}
        >
          Clients ({clientUsers.length})
          {activeTab === 'clients' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full" />}
        </button>
      </div>

      <div className="space-y-12">
        {activeTab === 'team' ? (
          <div className="space-y-10">
            {/* ROLE FILTERS */}
            <div className="flex flex-wrap gap-2 px-2 pb-4 border-b border-white/5">
              {[
                { id: 'all', label: 'All', count: roleStats.all },
                { id: 'admin', label: 'Admin', count: roleStats.admin },
                ...availableRoles.map(r => ({ id: r.id, label: r.name, count: roleStats[r.id] }))
              ].map(filter => (
                <button
                  key={filter.id}
                  onClick={() => setRoleFilter(filter.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2 border ${
                    roleFilter === filter.id 
                      ? "bg-white text-black border-white" 
                      : "bg-white/5 text-zinc-500 border-white/5 hover:bg-white/10"
                  }`}
                >
                  {filter.label} 
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${roleFilter === filter.id ? "bg-black/10 text-black" : "bg-white/5 text-zinc-600"}`}>
                    {filter.count}
                  </span>
                </button>
              ))}
            </div>

            {/* STAFF SECTION */}
            <div className="space-y-12">
              {staffGroups.filter(g => roleFilter === 'all' || g.id === roleFilter).length === 0 && searchQuery && (
                 <div className="p-20 border border-dashed border-white/10 rounded-[3rem] text-center">
                    <p className="text-xs font-bold uppercase text-zinc-700 tracking-widest">No staff members found matching "{searchQuery}"</p>
                 </div>
              )}
              
              {staffGroups
                .filter(g => roleFilter === 'all' || g.id === roleFilter)
                .map((group) => (
                <div key={group.label} className="space-y-8 animate-ios-slide-up">
                  {roleFilter === 'all' && (
                    <div className="flex items-center gap-4 px-2">
                      <h3 className="text-xs font-bold uppercase text-zinc-400 tracking-[0.2em] flex items-center gap-2">
                        {group.label} ({group.items.length})
                      </h3>
                      <div className="h-px flex-1 bg-white/5" />
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {group.items.map((user) => (
                      <div key={user.id} className={`glass-panel p-8 squircle-lg relative overflow-hidden flex flex-col group border border-white/5 ${fadingId === user.id ? 'animate-fade-out' : ''}`}>
                        <div className={`absolute top-0 right-0 w-1.5 h-full ${user?.isActive ? "bg-primary" : "bg-red-500"} opacity-40`} />
                        
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
                          <div className="flex-1 overflow-hidden">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold uppercase tracking-tight leading-none truncate">{user?.name || user?.email?.split('@')[0] || "N/A"}</h3>
                            </div>
                            <p className="text-xs font-medium uppercase tracking-widest text-zinc-500 truncate">
                              {user?.email || "No Email"}
                            </p>
                          </div>
                        </div>

                        {emailCounts[(user.email || "").toLowerCase()] > 1 && (
                          <div className="mb-4 bg-amber-500/10 border border-amber-500/20 text-amber-500 px-3 py-2 rounded-lg flex items-center gap-2 animate-pulse">
                            <AlertCircle className="w-3 h-3" />
                            <span className="text-xs font-bold uppercase tracking-widest">⚠️ Duplicate Email Identified</span>
                          </div>
                        )}

                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {(user.role === 'Client' ? clientPermissions : staffPermissions)?.map((p) => (
                            <button
                              key={p}
                              onClick={() => updateUserPermissions(user.id, p)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${
                                user?.permissions?.includes(p)
                                  ? "bg-primary/10 border border-primary/20 text-primary"
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
                              <span key={divId} className="px-2 py-1 bg-primary/10 border border-primary/20 text-primary rounded text-xs font-bold uppercase tracking-widest">
                                {div?.name || "Unmapped Div"}
                              </span>
                            );
                          })}
                          {(!user.divisionIds || user.divisionIds.length === 0) && user.role === "Staff" && (
                              <span className="text-xs font-bold uppercase tracking-widest text-zinc-700 italic">No Operational Units Linked</span>
                          )}
                        </div>

                        <div className="flex gap-2 mt-auto pt-4 border-t border-white/5">
                          <button
                            onClick={() => openEditModal(user)}
                            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* CLIENTS SECTION */
          <div className="space-y-10 animate-ios-slide-up">
            {filteredClients.length === 0 && searchQuery && (
               <div className="p-20 border border-dashed border-white/10 rounded-[3rem] text-center">
                  <p className="text-xs font-bold uppercase text-zinc-700 tracking-widest">No clients found matching "{searchQuery}"</p>
               </div>
            )}

            {/* ACTIVE CLIENTS */}
            {clientActiveItems.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                  <h4 className="text-xs font-bold uppercase text-zinc-500 tracking-widest">Active ({clientActiveItems.length})</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {clientActiveItems.map(user => (
                    <div key={user.id} onClick={() => { setSelectedClientUser(user); setIsClientPanelOpen(true); }} className={`glass-panel p-6 border border-white/5 rounded-3xl cursor-pointer hover:bg-white/5 transition-all group relative ${fadingId === user.id ? 'animate-fade-out' : ''}`}>
                      <div className="absolute top-0 right-0 w-1.5 h-full bg-primary opacity-40" />
                      
                      {isAdmin && user.email !== currentUser?.email && user.id !== 'admin_root' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setUserToDelete(user); setIsDeleteModalOpen(true); }}
                            className="absolute top-4 right-4 p-2 bg-black/40 text-zinc-500 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-500 transition-all z-10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                      )}

                      <h4 className="text-sm font-bold text-white truncate max-w-[85%]">{user.name || 'Client User'}</h4>
                      <p className="text-xs font-medium text-zinc-400 truncate mb-4">{user.email}</p>
                      <div className="flex items-center gap-2">
                         <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-widest bg-primary/10 text-primary">
                           Active
                         </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* PENDING CLIENTS */}
            {clientPendingItems.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  <h4 className="text-xs font-bold uppercase text-zinc-500 tracking-widest">Pending ({clientPendingItems.length})</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {clientPendingItems.map(user => (
                    <div key={user.id} onClick={() => { setSelectedClientUser(user); setIsClientPanelOpen(true); }} className={`glass-panel p-6 border border-white/5 rounded-3xl cursor-pointer hover:bg-white/5 transition-all group relative ${fadingId === user.id ? 'animate-fade-out' : ''}`}>
                      <div className="absolute top-0 right-0 w-1.5 h-full bg-amber-500 opacity-40" />
                      
                      {isAdmin && user.email !== currentUser?.email && user.id !== 'admin_root' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setUserToDelete(user); setIsDeleteModalOpen(true); }}
                            className="absolute top-4 right-4 p-2 bg-black/40 text-zinc-500 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-500 transition-all z-10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                      )}

                      <h4 className="text-sm font-bold text-white truncate max-w-[85%]">{user.name || 'Client User'}</h4>
                      <p className="text-xs font-medium text-zinc-400 truncate mb-4">{user.email}</p>
                      <div className="flex items-center gap-2">
                         <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-widest bg-amber-500/10 text-amber-500">
                           Pending
                         </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* REVOKED CLIENTS */}
            {clientRevokedItems.length > 0 && (
              <div className="space-y-6">
                <div className="flex items-center gap-2 px-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  <h4 className="text-xs font-bold uppercase text-zinc-500 tracking-widest">Revoked ({clientRevokedItems.length})</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {clientRevokedItems.map(user => (
                    <div key={user.id} onClick={() => { setSelectedClientUser(user); setIsClientPanelOpen(true); }} className={`glass-panel p-6 border border-white/5 rounded-3xl cursor-pointer hover:bg-white/5 transition-all group relative ${fadingId === user.id ? 'animate-fade-out' : ''}`}>
                      <div className="absolute top-0 right-0 w-1.5 h-full bg-red-500 opacity-40" />
                      
                      {isAdmin && user.email !== currentUser?.email && user.id !== 'admin_root' && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setUserToDelete(user); setIsDeleteModalOpen(true); }}
                            className="absolute top-4 right-4 p-2 bg-black/40 text-zinc-500 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-500/20 hover:text-red-500 transition-all z-10"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                      )}

                      <h4 className="text-sm font-bold text-white truncate max-w-[85%]">{user.name || 'Client User'}</h4>
                      <p className="text-xs font-medium text-zinc-400 truncate mb-4">{user.email}</p>
                      <div className="flex items-center gap-2">
                         <span className="px-2 py-1 rounded text-xs font-bold uppercase tracking-widest bg-red-500/10 text-red-500">
                           Revoked
                         </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {filteredClients.length === 0 && !searchQuery && (
                <div className="p-8 border border-dashed border-white/5 rounded-[2rem] text-center col-span-full">
                    <p className="text-xs font-bold uppercase text-zinc-800 tracking-widest">No clients provisioned</p>
                </div>
            )}
          </div>
        )}
      </div>
    </div>

      {/* CLIENT ADD ONS */}
      {isAddingClient && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#0b0b0b] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl animate-ios-slide-up no-scrollbar">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">Provision Client</h2>
                <p className="text-xs font-semibold uppercase text-zinc-400 tracking-[0.2em] mt-2 italic">Client Identity Generation</p>
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
                  <label className="text-xs font-bold uppercase text-zinc-400 tracking-widest px-1">Subject Email</label>
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
                  <label className="text-xs font-bold uppercase text-zinc-400 tracking-widest px-1">Base Permission Profile</label>
                  <div className="grid grid-cols-2 gap-2">
                    {clientPermissions.map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => togglePermissionInClientForm(p)}
                        className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${clientForm.permissions.includes(p) ? "bg-blue-600/10 border-blue-600/20 text-primary" : "bg-white/5 border-white/5 text-zinc-700 hover:bg-white/10"}`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-4 pt-6">
                  <button type="button" onClick={() => setIsAddingClient(false)} className="flex-1 py-5 bg-white/5 text-zinc-500 hover:text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all">Discard</button>
                  <button type="submit" className="flex-1 py-5 bg-white text-black hover:bg-zinc-200 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-2xl transition-all active:scale-95">Initialize Profile</button>
                </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* CLIENT CONFIGURATION PANEL */}
      {isClientPanelOpen && selectedClientUser && createPortal(
        <div className="fixed top-[5vh] right-[5vw] md:right-[2vw] w-full max-w-[380px] bg-[#0b0b0b] border border-white/10 rounded-[2rem] shadow-2xl animate-ios-slide-left z-[9999] flex flex-col overflow-hidden max-h-[90vh] bottom-[5vh]">
            <div className="p-6 border-b border-white/5 relative shrink-0">
               <button onClick={() => setIsClientPanelOpen(false)} className="absolute top-5 right-5 p-2 bg-white/5 text-zinc-500 rounded-full hover:text-white transition-all"><X className="w-4 h-4"/></button>
               <h2 className="text-xl font-black text-white uppercase tracking-tighter mb-1">Client Terminal</h2>
               <p className="text-xs font-bold text-zinc-400 uppercase tracking-[0.2em]">Identity Management</p>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6 no-scrollbar">
               <div className="p-5 bg-white/5 rounded-2xl border border-white/5">
                   <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-1.5">Subject Entity</p>
                   <h3 className="text-lg font-semibold text-white truncate max-w-[200px]">{selectedClientUser.name || 'Unknown Client'}</h3>
                   <p className="text-sm font-medium text-zinc-400 mt-1">{selectedClientUser.email}</p>
                   
                   <div className="mt-4 pt-4 border-t border-white/5">
                      <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Registration Status</p>
                      <span className={`px-2.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-widest inline-block ${getStatusColor(getClientStatus(selectedClientUser))}`}>
                        {getClientStatus(selectedClientUser)}
                      </span>
                   </div>
               </div>

               <div className="space-y-3 pb-2">
                  <h4 className="text-xs font-bold uppercase text-zinc-400 tracking-widest">Authentication Link</h4>
                  {selectedClientUser.inviteLink ? (
                      <textarea readOnly value={selectedClientUser.inviteLink} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-sm font-mono text-zinc-400 outline-none resize-none h-20 leading-relaxed" />
                  ) : (
                      <div className="p-6 border border-dashed border-white/10 rounded-xl text-center">
                         <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">No Link Provisioned</p>
                      </div>
                  )}
               </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-black/90 shrink-0 space-y-3 backdrop-blur-xl">
               {selectedClientUser.inviteLink ? (
                  <div className="flex gap-2">
                     <button onClick={() => manageClientLink('copy')} className="flex-1 py-3 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-zinc-200 transition-all flex justify-center items-center gap-2 active:scale-95">
                        {copied ? <Check className="w-3.5 h-3.5"/> : <Copy className="w-3.5 h-3.5" />} Copy
                     </button>
                     <button onClick={() => manageClientLink('regenerate')} className="flex-1 py-3 bg-white/5 text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all flex justify-center items-center gap-2 border border-white/5 active:scale-95">
                        <RefreshCw className="w-3.5 h-3.5" /> Regenerate
                     </button>
                  </div>
               ) : (
                  <button onClick={() => manageClientLink('generate')} className="w-full py-3 bg-blue-600 text-white font-bold text-xs uppercase tracking-widest rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.2)] hover:scale-[0.98] transition-all flex items-center justify-center gap-2 active:scale-95">
                     <LinkIcon className="w-3.5 h-3.5" /> Generate Link
                  </button>
               )}
               <button 
                  onClick={() => {
                     const updatedUser = { ...selectedClientUser, inviteToken: undefined, inviteLink: undefined, password: undefined, isActive: false };
                     const updatedUsers = users.map(u => u.id === selectedClientUser.id ? updatedUser : u);
                     setUsers(updatedUsers);
                     localStorage.setItem('users', JSON.stringify(updatedUsers));
                     setSelectedClientUser(updatedUser);
                     showSuccess("Access Revoked");
                  }}
                  className="w-full py-3 text-red-500 hover:bg-red-500/10 border border-red-500/20 rounded-xl font-bold uppercase text-xs tracking-widest transition-all gap-2 flex items-center justify-center active:scale-95"
               >
                  <Trash2 className="w-3.5 h-3.5" /> Revoke Access
               </button>
            </div>
            
            {successMsg && (
               <div className="absolute top-6 right-1/2 translate-x-1/2 whitespace-nowrap bg-primary text-white px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest animate-fade-in-down z-[400] shadow-2xl border border-white/20">
                 {successMsg}
               </div>
            )}
        </div>,
        document.body
      )}

      {/* STRATEGIC ONBOARDING (ADD STAFF) */}
      {isAddingStaff && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#0b0b0b] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl animate-ios-slide-up no-scrollbar">
            <div className="flex justify-between items-center mb-10">
              <div>
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">Strategic Onboarding</h2>
                <p className="text-xs font-semibold uppercase text-zinc-400 tracking-[0.2em] mt-2 italic">Manual Personnel Provisioning</p>
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
                  <label className="text-xs font-bold uppercase text-zinc-400 tracking-widest px-1">Full Name</label>
                  <input
                    required
                    className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-white/20 transition-all"
                    placeholder="Rahul S"
                    value={staffForm.name}
                    onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase text-zinc-400 tracking-widest px-1">Email ID</label>
                  <input
                    required
                    type="email"
                    className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:border-white/20 transition-all"
                    placeholder="rahul@artisans.os"
                    value={staffForm.email}
                    onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-400 tracking-widest px-1">Designated Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {availableRoles.map((sr) => (
                    <div key={sr.id} className="relative group/role">
                      {editingRoleId === sr.id ? (
                        <input 
                          autoFocus
                          className="w-full bg-white text-black rounded-xl py-4 px-4 text-xs font-bold uppercase outline-none"
                          value={roleInputName}
                          onChange={e => setRoleInputName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleUpdateRole(sr.id);
                            if (e.key === 'Escape') setEditingRoleId(null);
                          }}
                          onBlur={() => setEditingRoleId(null)}
                        />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setStaffForm({ ...staffForm, staffRole: sr.id })}
                          className={`w-full py-4 pr-12 rounded-xl text-xs font-bold uppercase tracking-widest transition-all text-left px-4 ${staffForm.staffRole === sr.id ? "bg-white text-black" : "bg-white/5 text-zinc-600 hover:bg-white/10"}`}
                        >
                          {sr.name}
                        </button>
                      )}
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover/role:opacity-100 transition-all">
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setEditingRoleId(sr.id); setRoleInputName(sr.name); }}
                          className="p-1.5 hover:text-white text-zinc-600"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => { e.stopPropagation(); startDeleteRole(sr); }}
                          className="p-1.5 hover:text-red-500 text-zinc-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {isCreatingRole ? (
                     <input 
                       autoFocus
                       className="w-full bg-white/5 border border-white/20 text-white rounded-xl py-4 px-4 text-xs font-bold uppercase outline-none"
                       placeholder="Enter role name..."
                       value={roleInputName}
                       onChange={e => setRoleInputName(e.target.value)}
                       onKeyDown={e => {
                         if (e.key === 'Enter') handleCreateRole();
                         if (e.key === 'Escape') setIsCreatingRole(false);
                       }}
                       onBlur={() => setIsCreatingRole(false)}
                     />
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setIsCreatingRole(true); setRoleInputName(""); }}
                      className="w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest border border-dashed border-white/10 text-zinc-700 hover:border-white/20 hover:text-zinc-500 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-3 h-3" /> Add New Role
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase text-zinc-400 tracking-widest px-1">Infrastructure Permissions</label>
                <div className="grid grid-cols-4 gap-2">
                  {staffPermissions.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => togglePermissionInStaffForm(p)}
                      className={`py-2 px-1 rounded-lg text-xs font-bold uppercase tracking-widest transition-all border ${staffForm.permissions.includes(p) ? "bg-primary/10 border-primary/20 text-primary" : "bg-white/5 border-white/5 text-zinc-700 hover:bg-white/10"}`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold uppercase text-zinc-400 tracking-widest px-1">Unit Assignment (Divisions)</label>
                <div className="grid grid-cols-2 gap-2">
                  {divisions.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDivisionInStaffForm(d.id)}
                      className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${staffForm.divisionIds?.includes(d.id) ? "bg-blue-600/10 border-blue-600/20 text-primary" : "bg-white/5 border-white/5 text-zinc-700 hover:bg-white/10"}`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  className="w-full py-5 bg-white text-black font-bold rounded-2xl text-xs uppercase tracking-widest shadow-2xl transition-all hover:bg-zinc-200 active:scale-95"
                >
                  Initialize Personnel
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* EDIT STAFF MODAL */}
      {isModalOpen && selectedUser && createPortal(
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto bg-[#0b0b0b] border border-white/10 rounded-[2.5rem] p-10 shadow-2xl animate-ios-slide-up no-scrollbar relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-600/50" />
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Edit Personnel Profile</h2>
                <p className="text-xs font-semibold uppercase text-zinc-400 tracking-widest mt-1">Registry ID: {selectedUser.id}</p>
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
                  <label className="text-xs font-bold uppercase text-zinc-400 tracking-[0.2em] px-1">Name</label>
                  <input
                    className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-white/20 transition-all"
                    value={selectedUser.name || ""}
                    onChange={(e) => setSelectedUser({ ...selectedUser, name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase text-zinc-400 tracking-[0.2em] px-1">Email</label>
                  <input
                    className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-white/20 transition-all"
                    value={selectedUser.email || ""}
                    onChange={(e) => setSelectedUser({ ...selectedUser, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase text-zinc-400 tracking-[0.2em] px-1">Security Token (Password)</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-xs font-mono text-white outline-none focus:border-white/20 transition-all"
                  value={selectedUser.password || ""}
                  onChange={(e) => setSelectedUser({ ...selectedUser, password: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-zinc-400 tracking-[0.2em] px-1">Designated Role</label>
                <div className="grid grid-cols-2 gap-3">
                  {availableRoles.map((sr) => (
                    <div key={sr.id} className="relative group/role">
                       {editingRoleId === sr.id ? (
                         <input 
                           autoFocus
                           className="w-full bg-white text-black rounded-xl py-4 px-4 text-xs font-bold uppercase outline-none"
                           value={roleInputName}
                           onChange={e => setRoleInputName(e.target.value)}
                           onKeyDown={e => {
                             if (e.key === 'Enter') handleUpdateRole(sr.id);
                             if (e.key === 'Escape') setEditingRoleId(null);
                           }}
                           onBlur={() => setEditingRoleId(null)}
                         />
                       ) : (
                         <button
                           type="button"
                           onClick={() => setSelectedUser({ ...selectedUser, staffRole: sr.id })}
                           className={`w-full py-4 pr-12 rounded-xl text-xs font-bold uppercase tracking-widest transition-all text-left px-4 ${selectedUser.staffRole === sr.id ? "bg-white text-black" : "bg-white/5 text-zinc-600 hover:bg-white/10"}`}
                         >
                           {sr.name}
                         </button>
                       )}
                       <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1 opacity-0 group-hover/role:opacity-100 transition-all">
                         <button 
                           type="button"
                           onClick={(e) => { e.stopPropagation(); setEditingRoleId(sr.id); setRoleInputName(sr.name); }}
                           className="p-1.5 hover:text-white text-zinc-600"
                         >
                           <Edit2 className="w-3 h-3" />
                         </button>
                         <button 
                           type="button"
                           onClick={(e) => { e.stopPropagation(); startDeleteRole(sr); }}
                           className="p-1.5 hover:text-red-500 text-zinc-600"
                         >
                           <Trash2 className="w-3 h-3" />
                         </button>
                       </div>
                    </div>
                  ))}
                  
                  {isCreatingRole ? (
                     <input 
                       autoFocus
                       className="w-full bg-white/5 border border-white/20 text-white rounded-xl py-4 px-4 text-xs font-bold uppercase outline-none"
                       placeholder="Enter role name..."
                       value={roleInputName}
                       onChange={e => setRoleInputName(e.target.value)}
                       onKeyDown={e => {
                         if (e.key === 'Enter') handleCreateRole();
                         if (e.key === 'Escape') setIsCreatingRole(false);
                       }}
                       onBlur={() => setIsCreatingRole(false)}
                     />
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setIsCreatingRole(true); setRoleInputName(""); }}
                      className="w-full py-4 rounded-xl text-xs font-bold uppercase tracking-widest border border-dashed border-white/10 text-zinc-700 hover:border-white/20 hover:text-zinc-500 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-3 h-3" /> Add New Role
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5 mt-4">
                <label className="text-xs font-bold uppercase text-zinc-400 tracking-[0.2em] px-1">Operational Domain (Divisions)</label>
                <div className="grid grid-cols-1 gap-2">
                  {divisions.map((div) => (
                    <label
                      key={div.id}
                      className={`flex justify-between items-center px-6 py-4 rounded-2xl cursor-pointer transition-all border ${
                        selectedUser.divisionIds?.includes(div.id)
                          ? "bg-blue-600/10 border-blue-600/20 text-primary"
                          : "bg-white/5 border-white/5 text-zinc-600 hover:bg-white/10"
                      }`}
                    >
                      <span className="text-xs font-bold uppercase tracking-widest">{div.name}</span>
                      <div className="relative flex items-center">
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={selectedUser.divisionIds?.includes(div.id)}
                          onChange={() => toggleUserDivision(div.id)}
                        />
                        <div
                          className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                            selectedUser.divisionIds?.includes(div.id) ? "bg-primary border-primary" : "bg-transparent border-white/10"
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
                className="w-full py-5 bg-white text-black rounded-2xl font-bold uppercase text-xs tracking-[0.2em] shadow-2xl hover:bg-zinc-200 transition-all active:scale-95"
              >
                Synchronize Data
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteModalOpen && userToDelete && createPortal(
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[9998] animate-modal-overlay"
          onClick={() => { setIsDeleteModalOpen(false); setUserToDelete(null); }}
        >
          <div 
            className="bg-zinc-900 border border-white/10 rounded-[3rem] w-full max-w-[400px] p-12 shadow-2xl text-center animate-modal-content m-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-3xl font-black text-white tracking-tight uppercase mb-4">Delete User?</h2>
            <p className="text-sm text-zinc-300 font-medium mb-10 pb-4 border-b border-white/5 leading-relaxed">
              This will permanently remove access for <span className="text-white font-black">{userToDelete.email}</span>. This protocol is irreversible.
            </p>

            <div className="flex gap-4">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setUserToDelete(null);
                }}
                className="flex-1 py-5 bg-white/5 text-zinc-500 hover:text-white rounded-2xl text-xs font-bold uppercase tracking-widest transition-all border border-white/5"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 py-5 bg-red-600 text-white hover:bg-red-500 rounded-2xl text-xs font-bold uppercase tracking-widest shadow-xl shadow-red-500/20 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                   <>
                     <Loader2 className="w-4 h-4 animate-spin-fast" />
                     Deleting...
                   </>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ROLE REASSIGNMENT MODAL */}
      {roleToReassign && createPortal(
        <div className="fixed inset-0 bg-black/90 z-[9999] flex items-center justify-center p-6 backdrop-blur-2xl">
          <div className="bg-zinc-900 border border-white/10 rounded-[3rem] w-full max-w-[400px] p-10 shadow-2xl text-center">
            <div className="w-20 h-20 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-amber-500/20">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-2xl font-black text-white uppercase mb-4">Delete Role '{roleToReassign.name}'?</h2>
            <p className="text-xs text-zinc-500 font-bold leading-relaxed mb-8 px-4">
              WARNING: <span className="text-white">{roleToReassign.count}</span> personnel have this role assigned. You must pick a replacement role before deleting.
            </p>
            
            <div className="space-y-4 mb-10">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-widest block text-left px-2">Select Replacement Role</label>
              <select 
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-bold text-white outline-none appearance-none cursor-pointer"
                value={replacementRoleId}
                onChange={e => setReplacementRoleId(e.target.value)}
              >
                <option value="">Choose a role...</option>
                {availableRoles.filter(r => r.id !== roleToReassign.id).map(r => (
                  <option key={r.id} value={r.id} className="bg-zinc-900">{r.name}</option>
                ))}
              </select>
            </div>

            <div className="flex gap-4">
              <button onClick={() => { setRoleToReassign(null); setReplacementRoleId(""); }} className="flex-1 py-5 bg-white/5 text-zinc-500 hover:text-white rounded-2xl text-xs font-bold uppercase transition-all">Cancel</button>
              <button 
                onClick={confirmReassignAndDelete}
                disabled={!replacementRoleId}
                className="flex-1 py-5 bg-red-600 text-white rounded-2xl text-xs font-black uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Reassign & Delete
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

    </>
  );
};

export default UserAccessManager;

