import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Shield, Users, History, Settings2 } from 'lucide-react';
import type { Division } from '../types';

import { useCompanySettings } from '../hooks/useCompanySettings';

interface SettingsViewProps {
  divisions: Division[];
  addDivision: (division: Division) => void;
  deleteDivision: (id: string) => void;
  onOpenTeam: () => void;
  isAdmin: boolean;
}

const SettingsView: React.FC<SettingsViewProps> = ({ divisions, addDivision, deleteDivision, onOpenTeam, isAdmin }) => {
  const navigate = useNavigate();
  const { settings } = useCompanySettings();
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState<Division | null>(null);

  const [newDiv, setNewDiv] = useState<Partial<Division>>({ type: 'Wedding' });


  const handleSubmitDivision = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDiv.name && newDiv.type) {
      addDivision({
        id: isEditing ? isEditing.id : `div_${Date.now()}`,
        name: newDiv.name,
        type: newDiv.type as any,
        createdAt: isEditing ? isEditing.createdAt : new Date().toISOString(),
        description: newDiv.description || '',
        color: newDiv.color || '#3b82f6'
      });
      setIsAdding(false);
      setIsEditing(null);
      setNewDiv({ type: 'Wedding' });
    }
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button onClick={onOpenTeam} className="bg-blue-600/10 border border-blue-500/20 p-10 squircle-lg flex flex-col items-center gap-6 group hover:bg-blue-600 transition-all active:scale-95">
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
      )}

      <div className="space-y-10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-8">
          <div>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase flex items-center gap-3"><Settings2 className="w-6 h-6 text-zinc-500" /> Project Registries</h2>
          </div>
          {isAdmin && (
            <button onClick={() => setIsAdding(true)} className="bg-white text-black px-8 py-4 rounded-xl font-black uppercase text-[11px] tracking-widest flex items-center gap-3 hover:bg-zinc-200 transition-all shadow-2xl active:scale-95">
              <Plus className="w-5 h-5" /> Register Projects
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {divisions.map(div => (
            <div 
              key={div.id} 
              className="glass-panel p-10 relative group overflow-hidden transition-all duration-300 squircle-lg border border-white/5 bg-white/[0.01] hover:bg-white/[0.03]"
            >
              <div className="absolute top-0 right-0 w-1.5 h-full opacity-40 group-hover:opacity-100 bg-blue-500" />
              
              <div className="flex justify-between items-start mb-6">
                 <h3 className="font-black text-2xl text-white tracking-tighter leading-none truncate uppercase pr-4">{div.name}</h3>
                 {isAdmin && (
                    <div className="flex gap-2">
                       <button 
                         onClick={(e) => { e.stopPropagation(); setIsEditing(div); setNewDiv(div); setIsAdding(true); }}
                         className="p-2.5 rounded-xl bg-white/5 text-zinc-500 hover:text-white hover:bg-white/10 transition-all"
                       >
                         <Shield className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={(e) => { e.stopPropagation(); if(confirm('Purge Project Registry?')) deleteDivision(div.id); }}
                         className="p-2.5 rounded-xl bg-white/5 text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                       >
                         <X className="w-4 h-4" />
                       </button>
                    </div>
                 )}
              </div>

              <div className="space-y-4">
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 block">{div.type} Operational Registry</span>
                 <button 
                   onClick={() => navigate(`/division/${div.id}`)}
                   className="w-full py-4 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white group-hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                 >
                    Deployment View
                    <Shield className="w-3 h-3" />
                 </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isAdding && (
        <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-6 backdrop-blur-2xl">
          <div className="bg-zinc-900 border border-white/10 rounded-[2.5rem] w-full max-w-xl p-12 shadow-2xl animate-ios-slide-up">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-3xl font-black text-white uppercase tracking-tight">{isEditing ? 'Update Registry' : 'Register Projects'}</h2>
              <button onClick={() => { setIsAdding(false); setIsEditing(null); setNewDiv({ type: 'Wedding' }); }} className="p-3 bg-white/5 text-zinc-600 hover:text-white rounded-full transition-all"><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleSubmitDivision} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Registry Name</label>
                <input required className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-black text-white outline-none focus:bg-white/10 transition-all" placeholder="e.g. AAHA KALYANAM" value={newDiv.name || ''} onChange={e => setNewDiv({ ...newDiv, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Operational Type</label>
                <select 
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all"
                  value={newDiv.type || 'Wedding'}
                  onChange={e => setNewDiv({ ...newDiv, type: e.target.value as any })}
                >
                  <option value="Wedding" className="bg-zinc-900 uppercase">Wedding Production</option>
                  <option value="Kids" className="bg-zinc-900 uppercase">Kids / Maternity</option>
                  <option value="Corporate" className="bg-zinc-900 uppercase">Corporate Enterprise</option>
                  <option value="Events" className="bg-zinc-900 uppercase">Special Events</option>
                </select>
              </div>
              <button type="submit" className="w-full py-5 bg-white text-black font-black rounded-2xl text-[11px] uppercase tracking-widest shadow-2xl transition-all">
                {isEditing ? 'Confirm Update' : 'Formalize Deployment'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
