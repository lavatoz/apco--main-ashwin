
import React, { useState, useEffect } from 'react';
import {
  ArrowLeft, Clock, Plus, Share2, Video, Image, FileText, Trash2, Users,
  MessageSquare, FolderOpen, Key, LockKeyhole, UserCheck, X
} from 'lucide-react';
import type { Client, CloudConfig, TimelineItem, Deliverable } from '../types';
import { api } from '../services/api';

interface ClientPortalProps {
  client: Client;
  onUpdateClient: (updatedClient: Client) => void;
  onBack: () => void;
}

const ClientPortal: React.FC<ClientPortalProps> = ({ client, onUpdateClient, onBack }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'deliverables' | 'requirements' | 'people' | 'private'>('timeline');
  const [isAddingTimeline, setIsAddingTimeline] = useState(false);
  const [isAddingDeliverable, setIsAddingDeliverable] = useState(false);
  const [cloudConfig, setCloudConfig] = useState<CloudConfig | null>(null);

  const [timelineForm, setTimelineForm] = useState<Partial<TimelineItem>>({ status: 'Pending' });
  const [deliverableForm, setDeliverableForm] = useState<Partial<Deliverable>>({ type: 'Photos', origin: 'GoogleDrive', isPublic: true });

  useEffect(() => {
    api.getCloudConfig().then(setCloudConfig);
  }, []);

  const isWedding = client.brand === 'AAHA Kalyanam';
  const theme = {
    bg: isWedding ? 'bg-black' : 'bg-slate-900',
    card: 'glass-panel',
    text: 'text-white',
    sub: 'text-zinc-500',
    accent: isWedding ? 'text-yellow-500' : 'text-blue-500'
  };

  const portal = client.portal || { timeline: [], deliverables: [], internalSpends: [] };

  const handleAddTimeline = () => {
    if (!timelineForm.title || !timelineForm.date) return;
    const item: TimelineItem = {
      id: Date.now().toString(),
      title: timelineForm.title,
      date: timelineForm.date,
      status: timelineForm.status || 'Pending',
      description: timelineForm.description
    };
    onUpdateClient({
      ...client,
      portal: { ...portal, timeline: [...(portal.timeline || []), item] }
    });
    setIsAddingTimeline(false);
    setTimelineForm({ status: 'Pending' });
  };

  const handleAddDeliverable = () => {
    if (!deliverableForm.title || !deliverableForm.url) return;
    const item: Deliverable = {
      id: Date.now().toString(),
      title: deliverableForm.title,
      url: deliverableForm.url,
      type: deliverableForm.type || 'Photos',
      dateAdded: new Date().toISOString(),
      origin: deliverableForm.origin || 'GoogleDrive',
      isPublic: deliverableForm.isPublic,
      assignedTo: deliverableForm.assignedTo
    };
    onUpdateClient({
      ...client,
      portal: { ...portal, deliverables: [...(portal.deliverables || []), item] }
    });
    setIsAddingDeliverable(false);
    setDeliverableForm({ type: 'Photos', origin: 'GoogleDrive', isPublic: true });
  };

  const toggleTimelineStatus = (id: string) => {
    const updated = (portal.timeline || []).map(t => {
      if (t.id === id) {
        const nextStatus: TimelineItem['status'] = t.status === 'Completed' ? 'Pending' : 'Completed';
        return { ...t, status: nextStatus };
      }
      return t;
    });
    onUpdateClient({ ...client, portal: { ...portal, timeline: updated } });
  };

  return (
    <div className={`min-h-full ${theme.bg} ${theme.text} p-6 font-sans animate-ios-slide-up`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all active:scale-90 border border-white/5"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight leading-none mb-1">{client.projectName}</h1>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.sub}`}>{client.id} • {client.brand}</p>
          </div>
        </div>
        <div className="bg-zinc-900/80 p-1 rounded-[1.25rem] border border-white/5 flex gap-1 w-full md:w-auto overflow-x-auto no-scrollbar">
          {['timeline', 'deliverables', 'requirements', 'people'].map(t => (
            <button
              key={t} onClick={() => setActiveTab(t as 'timeline' | 'deliverables' | 'requirements' | 'people')}
              className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-[1rem] transition-all whitespace-nowrap ${activeTab === t ? 'bg-white text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
            >
              {t}
            </button>
          ))}
          <button
            onClick={() => setActiveTab('private')}
            className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-[1rem] flex items-center gap-2 transition-all whitespace-nowrap ${activeTab === 'private' ? 'bg-red-500 text-white shadow-lg' : 'text-zinc-500 hover:text-red-400'}`}
          >
            <LockKeyhole className="w-3.5 h-3.5" /> Internal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {activeTab === 'timeline' && (
            <div className="glass-panel p-10 squircle-lg relative overflow-hidden">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                  <Clock className="w-5 h-5 text-zinc-500" /> Milestone Plan
                </h2>
                <button onClick={() => setIsAddingTimeline(true)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all"><Plus className="w-5 h-5" /></button>
              </div>

              <div className="space-y-8 relative pl-6">
                <div className="absolute left-[30px] top-2 bottom-2 w-px bg-white/10" />
                {(portal.timeline || []).map(item => (
                  <div key={item.id} className="relative flex gap-8 group">
                    <button
                      onClick={() => toggleTimelineStatus(item.id)}
                      className={`z-10 w-4 h-4 rounded-full mt-1.5 border-4 border-black transition-all ${item.status === 'Completed' ? 'bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]' : 'bg-zinc-700 hover:bg-zinc-500'}`}
                    />
                    <div>
                      <h4 className={`font-black text-sm uppercase tracking-wide ${item.status === 'Completed' ? 'text-emerald-400' : 'text-white'}`}>{item.title}</h4>
                      <p className="text-xs text-zinc-500 mt-1 font-medium">{item.description}</p>
                      <span className="text-[9px] font-black text-zinc-600 mt-2 block uppercase tracking-widest">{new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'deliverables' && (
            <div className="glass-panel p-10 squircle-lg">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                  <Share2 className="w-5 h-5 text-zinc-500" /> Asset Links
                </h2>
                <button onClick={() => setIsAddingDeliverable(true)} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all"><Plus className="w-5 h-5" /></button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(portal.deliverables || []).map(d => (
                  <div key={d.id} className="p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center gap-5 group hover:border-white/20 ios-transition relative overflow-hidden">
                    <div className={`p-4 rounded-2xl ${d.origin === 'InternalServer' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-blue-900/40 text-blue-400'} group-hover:scale-110 transition-transform`}>
                      {d.type === 'Video' ? <Video className="w-5 h-5" /> : d.type === 'Photos' ? <Image className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <h4 className="font-black text-xs truncate uppercase tracking-widest">{d.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[9px] text-zinc-600 truncate font-black uppercase tracking-widest">
                          {d.assignedTo ? `Private for ${client.people.find(p => p.id === d.assignedTo)?.name}` : 'Shared with All'}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => onUpdateClient({ ...client, portal: { ...portal, deliverables: portal.deliverables.filter(item => item.id !== d.id) } })} className="opacity-0 group-hover:opacity-100 p-2 text-zinc-800 hover:text-red-500 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'people' && (
            <div className="glass-panel p-10 squircle-lg">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                  <Users className="w-5 h-5 text-zinc-500" /> Account Members
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {client.people.map(person => (
                  <div key={person.id} className="p-8 bg-black/40 border border-white/5 rounded-3xl group relative overflow-hidden">
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center font-black text-white border border-white/10">{person.name.charAt(0)}</div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-zinc-600 tracking-widest mb-1">{person.role}</p>
                        <h4 className="text-xl font-black text-white uppercase tracking-tight">{person.name}</h4>
                      </div>
                    </div>
                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="flex items-center justify-between text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                        <span>Login ID</span>
                        <span className="text-white">{person.loginId}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                        <span>Security Key</span>
                        <span className="text-white">{person.password}</span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-black uppercase text-zinc-500 tracking-widest">
                        <span>Unique UID</span>
                        <span className="text-zinc-700">{person.id}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'requirements' && (
            <div className="glass-panel p-10 squircle-lg">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-xl font-black uppercase tracking-widest flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-zinc-500" /> Add-on Requirements
                </h2>
              </div>
              <div className="space-y-4">
                {(client.requirements || []).map(req => (
                  <div key={req.id} className="p-6 bg-white/5 border border-white/5 rounded-3xl flex justify-between items-start group">
                    <div className="flex gap-4">
                      <div className={`w-2 h-2 rounded-full mt-1.5 ${req.status === 'Pending' ? 'bg-amber-500 animate-pulse' : req.status === 'Acknowledged' ? 'bg-blue-400' : 'bg-emerald-400'}`} />
                      <div>
                        <p className="text-sm font-bold text-white leading-relaxed">{req.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'private' && (
            <div className="glass-panel p-10 squircle-lg border-red-500/10 bg-red-950/5 relative overflow-hidden">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-2xl font-black uppercase tracking-tighter text-red-500 flex items-center gap-3">
                  <UserCheck className="w-6 h-6" /> Internal Management
                </h2>
              </div>
              <p className="text-zinc-500 text-xs">Sensitive internal data for {client.projectName}.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-panel p-8 squircle-lg space-y-6">
            <h3 className="font-black uppercase tracking-widest text-[10px] mb-2 flex items-center gap-3 text-zinc-500">
              <FolderOpen className="w-4 h-4" /> Multi-Vault Assignment
            </h3>
            <div className="space-y-4">
              <div className="p-5 bg-black/40 border border-white/5 rounded-2xl">
                <label className="text-[9px] text-zinc-600 uppercase font-black mb-2 block">Storage Account (Vault)</label>
                <select
                  className="w-full bg-transparent text-xs font-bold text-white outline-none focus:text-blue-400 transition-colors"
                  value={client.vaultId || ''}
                  onChange={(e) => onUpdateClient({ ...client, vaultId: e.target.value })}
                >
                  <option value="" className="bg-zinc-900">Select Account...</option>
                  {cloudConfig?.vaults.map(v => (
                    <option key={v.id} value={v.id} className="bg-zinc-900">{v.name} ({v.email})</option>
                  ))}
                </select>
              </div>
              <div className="p-5 bg-black/40 border border-white/5 rounded-2xl">
                <label className="text-[9px] text-zinc-600 uppercase font-black mb-2 block">Project Folder ID</label>
                <input
                  className="w-full bg-transparent text-xs font-bold text-white outline-none focus:text-blue-400 transition-colors"
                  placeholder="Paste ID from URL"
                  value={client.driveFolderId || ''}
                  onChange={(e) => onUpdateClient({ ...client, driveFolderId: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="glass-panel p-8 squircle-lg">
            <h3 className="font-black uppercase tracking-widest text-[10px] mb-8 flex items-center gap-3 text-zinc-500">
              <Key className="w-4 h-4" /> Global Project Keys
            </h3>
            <div className="space-y-4">
              <div className="p-4 bg-black/40 border border-white/5 rounded-2xl flex items-center justify-between">
                <span className="text-[9px] font-black text-zinc-700 uppercase tracking-widest">Active Members</span>
                <span className="text-xs font-black text-white">{client.people.length} Users</span>
              </div>
              <button onClick={() => setActiveTab('people')} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase text-zinc-400 tracking-widest flex items-center justify-center gap-2">
                Manage Individual Credentials
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Deliverable Modal */}
      {isAddingDeliverable && (
        <div className="fixed inset-0 bg-black/80 z-[150] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-zinc-900 border border-white/10 squircle-lg w-full max-w-lg p-10 shadow-2xl animate-ios-slide-up">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black uppercase tracking-widest">Link Assets</h2>
              <button onClick={() => setIsAddingDeliverable(false)} className="p-2 bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-6">
              <input className="w-full bg-black border border-white/5 p-4 rounded-2xl text-sm font-bold" value={deliverableForm.title || ''} onChange={e => setDeliverableForm({ ...deliverableForm, title: e.target.value })} placeholder="Label (e.g. Wedding Teaser)" />
              <input className="w-full bg-black border border-white/5 p-4 rounded-2xl text-sm font-bold" value={deliverableForm.url || ''} onChange={e => setDeliverableForm({ ...deliverableForm, url: e.target.value })} placeholder="URL Link" />
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-600 px-1 tracking-widest">Assign visibility to</label>
                <select className="w-full bg-black border border-white/5 p-4 rounded-2xl text-sm font-bold" value={deliverableForm.assignedTo || ''} onChange={e => setDeliverableForm({ ...deliverableForm, assignedTo: e.target.value })}>
                  <option value="">Everyone in Project</option>
                  {client.people.map(p => <option key={p.id} value={p.id}>{p.name} ({p.role})</option>)}
                </select>
              </div>
              <button onClick={handleAddDeliverable} className="w-full py-4 bg-white text-black font-black rounded-2xl text-xs uppercase tracking-widest mt-4">Publish Link</button>
            </div>
          </div>
        </div>
      )}

      {isAddingTimeline && (
        <div className="fixed inset-0 bg-black/80 z-[150] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-zinc-900 border border-white/10 squircle-lg w-full max-w-lg p-10 shadow-2xl animate-ios-slide-up">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black uppercase tracking-widest">New Milestone</h2>
              <button onClick={() => setIsAddingTimeline(false)} className="p-2 bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-6">
              <input className="w-full bg-black border border-white/5 p-4 rounded-2xl text-sm font-bold" value={timelineForm.title || ''} onChange={e => setTimelineForm({ ...timelineForm, title: e.target.value })} placeholder="Phase Name" />
              <input type="date" className="w-full bg-black border border-white/5 p-4 rounded-2xl text-sm font-bold" value={timelineForm.date || ''} onChange={e => setTimelineForm({ ...timelineForm, date: e.target.value })} />
              <button onClick={handleAddTimeline} className="w-full py-4 bg-white text-black font-black rounded-2xl text-xs uppercase tracking-widest">Add Phase</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientPortal;
