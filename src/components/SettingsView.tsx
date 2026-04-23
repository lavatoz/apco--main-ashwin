import React, { useState, useEffect } from 'react';
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { Shield, Users, History, Trash2, Edit2, Plus, X, AlertTriangle } from 'lucide-react';
import { useCompanySettings } from '../hooks/useCompanySettings';
import { type User } from '../types';

interface Role {
  id: string;
  name: string;
  icon: string;
}

interface SettingsViewProps {
  onOpenTeam: () => void;
  isAdmin: boolean;
}

const SettingsView: React.FC<SettingsViewProps> = ({ onOpenTeam, isAdmin }) => {
  const { settings } = useCompanySettings();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isAddingRole, setIsAddingRole] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState({ name: '', icon: '👥' });
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const availableIcons = ['📷', '🎬', '✂️', '👥', '🚁', '💄', '🌸', '🎵', '🎨', '👔'];

  useEffect(() => {
    const savedRoles = localStorage.getItem('artisans_roles');
    if (savedRoles) {
      setRoles(JSON.parse(savedRoles));
    } else {
      const defaultRoles = [
        { id: 'photographer', name: 'Photographer', icon: '📷' },
        { id: 'videographer', name: 'Videographer', icon: '🎬' },
        { id: 'editor', name: 'Editor', icon: '✂️' },
        { id: 'assistant', name: 'Assistant', icon: '👥' },
      ];
      setRoles(defaultRoles);
      localStorage.setItem('artisans_roles', JSON.stringify(defaultRoles));
    }
  }, []);

  const saveRoles = (updatedRoles: Role[]) => {
    setRoles(updatedRoles);
    localStorage.setItem('artisans_roles', JSON.stringify(updatedRoles));
  };

  const handleAddRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roleForm.name.trim()) return;

    if (editingRole) {
      const updatedRoles = roles.map(r => r.id === editingRole.id ? { ...r, name: roleForm.name, icon: roleForm.icon } : r);
      saveRoles(updatedRoles);
      setEditingRole(null);
    } else {
      const newRole: Role = {
        id: roleForm.name.toLowerCase().replace(/\s+/g, '_'),
        name: roleForm.name,
        icon: roleForm.icon,
      };
      saveRoles([...roles, newRole]);
    }

    setIsAddingRole(false);
    setRoleForm({ name: '', icon: '👤' });
  };

  const startEdit = (role: Role) => {
    setEditingRole(role);
    setRoleForm({ name: role.name, icon: role.icon });
    setIsAddingRole(true);
  };

  const handleDeleteRole = () => {
    if (!roleToDelete) return;
    const updatedRoles = roles.filter(r => r.id !== roleToDelete.id);
    saveRoles(updatedRoles);
    setRoleToDelete(null);
  };

  const getUsersWithRole = (roleId: string) => {
    const users: User[] = JSON.parse(localStorage.getItem('users') || '[]');
    return users.filter(u => u.staffRole === roleId);
  };

  return (
    <div className="space-y-12 animate-ios-slide-up pb-32">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="p-5 rounded-2xl bg-zinc-900 border border-white/5 shadow-2xl">
            <Shield className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight uppercase">{settings.companyName} Ecosystem</h1>
            <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">Master Control Panel • Secure Infrastructure</p>
          </div>
        </div>
      </div>

      {isAdmin && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <button 
              onClick={onOpenTeam}
              className="bg-blue-600/10 border border-blue-500/20 p-10 squircle-lg flex flex-col items-center gap-6 group hover:bg-blue-600 transition-all active:scale-95"
            >
              <div className="p-6 bg-blue-600 rounded-2xl group-hover:bg-white group-hover:text-blue-600 transition-all shadow-xl">
                <Users className="w-10 h-10" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-black uppercase text-white group-hover:text-white">Team Registry</h3>
                <p className="text-[10px] font-black uppercase text-blue-500 group-hover:text-white/60 tracking-widest mt-2">Manage Staff Access & Permissions</p>
              </div>
            </button>

            <div className="bg-zinc-900/50 border border-white/5 p-10 squircle-lg flex flex-col items-center gap-6 relative overflow-hidden group">
              <div className="p-6 bg-white/5 rounded-2xl border border-white/10 group-hover:bg-white group-hover:text-black transition-all">
                <History className="w-10 h-10" />
              </div>
              <div className="text-center">
                <h3 className="text-2xl font-black uppercase text-white">System Logs</h3>
                <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mt-2">Historical Audit Trail of Operations</p>
              </div>
              <p className="absolute bottom-6 text-[8px] font-black uppercase text-zinc-800 tracking-[0.3em]">Master Access Only</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-xl font-black text-white uppercase tracking-tighter">Strategic Roles</h3>
              <button 
                onClick={() => { setEditingRole(null); setRoleForm({ name: '', icon: '👤' }); setIsAddingRole(true); }}
                className="p-2 bg-white/5 text-zinc-400 hover:text-white transition-all rounded-lg flex items-center gap-2 border border-white/5"
              >
                <Plus className="w-4 h-4" /> <span className="text-[9px] font-black uppercase tracking-widest">Add Role</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {roles.map(role => (
                <div key={role.id} className="glass-panel p-6 border border-white/5 rounded-3xl group relative overflow-hidden">
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-3xl">{role.icon}</span>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => startEdit(role)} className="p-1.5 bg-white/5 text-zinc-500 hover:text-white rounded-lg"><Edit2 className="w-3 h-3" /></button>
                      <button onClick={() => setRoleToDelete(role)} className="p-1.5 bg-white/5 text-zinc-500 hover:text-red-500 rounded-lg"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight">{role.name}</h4>
                  <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mt-1">ID: {role.id}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ADD/EDIT ROLE MODAL */}
      {isAddingRole && (
        <div className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-6 backdrop-blur-2xl">
          <div className="bg-zinc-900 border border-white/10 rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl animate-ios-slide-up">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-white uppercase">{editingRole ? 'Update Role' : 'New Strategic Role'}</h2>
              <button onClick={() => setIsAddingRole(false)} className="p-2 text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddRole} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Role Name</label>
                <input 
                  required
                  className="w-full bg-white/5 border border-white/5 rounded-xl p-4 text-xs font-bold text-white outline-none focus:border-white/20"
                  placeholder="e.g. Drone Operator"
                  value={roleForm.name}
                  onChange={e => setRoleForm({ ...roleForm, name: e.target.value })}
                />
              </div>
              <div className="space-y-4">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Role Symbol</label>
                
                {/* Main Picker Toggle */}
                <div className="relative">
                  <button 
                    type="button"
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-4 hover:bg-white/10 transition-all group"
                  >
                    <span className="text-3xl group-hover:scale-110 transition-transform">{roleForm.icon || '👤'}</span>
                    <span className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Click to change symbol</span>
                  </button>

                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-4 z-[400] animate-ios-slide-up shadow-2xl">
                      <div className="fixed inset-0" onClick={() => setShowEmojiPicker(false)} />
                      <div className="relative">
                        <EmojiPicker 
                          theme={Theme.DARK}
                          onEmojiClick={(emojiData) => {
                            setRoleForm({ ...roleForm, icon: emojiData.emoji });
                            setShowEmojiPicker(false);
                          }}
                          width={320}
                          height={400}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Pick Presets */}
                <div className="space-y-2">
                   <p className="text-[8px] font-black text-zinc-700 uppercase tracking-[0.2em] px-1">Quick Presets</p>
                   <div className="flex flex-wrap gap-2">
                    {availableIcons.map(icon => (
                      <button 
                        key={icon}
                        type="button"
                        onClick={() => { setRoleForm({ ...roleForm, icon }); setShowEmojiPicker(false); }}
                        className={`text-xl p-2 rounded-xl transition-all border ${roleForm.icon === icon ? 'bg-white/10 border-white/20 scale-110' : 'bg-white/5 border-transparent hover:bg-white/10'}`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <button type="submit" className="w-full py-4 bg-white text-black font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-zinc-200 transition-all">
                {editingRole ? 'Update Protocol' : 'Initialize Role'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* DELETE ROLE MODAL */}
      {roleToDelete && (
        <div className="fixed inset-0 bg-black/90 z-[300] flex items-center justify-center p-6 backdrop-blur-2xl">
          <div className="bg-zinc-900 border border-white/10 rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl text-center">
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-red-500/20">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-black text-white uppercase mb-2">Delete role '{roleToDelete.name}'?</h2>
            <p className="text-[10px] text-zinc-500 font-bold leading-relaxed mb-8 px-4">
              {getUsersWithRole(roleToDelete.id).length > 0 
                ? `WARNING: ${getUsersWithRole(roleToDelete.id).length} team members currently have this role assigned. You must re-assign them before deleting this role.`
                : "This role is not currently assigned to any personnel and can be safely removed."}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setRoleToDelete(null)} className="flex-1 py-4 bg-white/5 text-zinc-500 hover:text-white rounded-xl text-[10px] font-black uppercase transition-all">Cancel</button>
              {getUsersWithRole(roleToDelete.id).length === 0 && (
                <button onClick={handleDeleteRole} className="flex-1 py-4 bg-red-600 text-white rounded-xl text-[10px] font-black uppercase transition-all shadow-xl shadow-red-500/10">Delete</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
