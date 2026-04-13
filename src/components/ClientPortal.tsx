import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Plus, Share2, Video, Image, FileText, Trash2, Users, MessageSquare, FolderOpen, Key, LockKeyhole, UserCheck, X } from 'lucide-react';
import type { Client, CloudConfig, TimelineItem, Deliverable, Person } from '../types';
import { api } from '../services/api';
import Gallery from './Gallery';

interface ClientPortalProps {
  onUpdateClient: (updatedClient: Client) => void;
  onBack: () => void;
  userRole: 'Admin' | 'Staff' | 'Client' | 'none';
}

const ClientPortal: React.FC<ClientPortalProps> = ({ onUpdateClient, onBack, userRole }) => {
  const { id } = useParams<{ id: string }>();
  console.log("PROJECT ID:", id);

  const [project, setProject] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'timeline' | 'deliverables' | 'gallery' | 'requirements' | 'people' | 'private'>('timeline');
  const [isAddingTimeline, setIsAddingTimeline] = useState(false);
  const [isAddingDeliverable, setIsAddingDeliverable] = useState(false);
  const [isAssigningClient, setIsAssigningClient] = useState(false);
  const [allClients, setAllClients] = useState<any[]>([]);
  const [selectedAssignClientId, setSelectedAssignClientId] = useState('');
  const [cloudConfig, setCloudConfig] = useState<CloudConfig | null>(null);

  const [timelineForm, setTimelineForm] = useState<Partial<TimelineItem>>({ status: 'Pending' });
  const [deliverableForm, setDeliverableForm] = useState<Partial<Deliverable>>({ type: 'Photos', origin: 'GoogleDrive', isPublic: true });

  useEffect(() => {
    const fetchProject = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/projects/${id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          console.log("Fetched project:", data);
          setProject(data);
        } else {
          console.error("Failed to fetch project");
        }
      } catch (err) {
        console.error("Error fetching project:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [id]);

  useEffect(() => {
    api.getCloudConfig().then(setCloudConfig);
    if (userRole === 'Admin' || userRole === 'Staff') {
        const fetchAllClients = async () => {
            const data = await api.getClients();
            setAllClients(data || []);
        };
        fetchAllClients();
    }
  }, [userRole]);

  if (loading) return <p className="text-white p-10 font-black uppercase tracking-widest text-[10px]">Loading...</p>;
  if (!project) return <p className="text-white p-10 font-black uppercase tracking-widest text-[10px]">No project found</p>;

  const isWedding = project.brand === 'AAHA Kalyanam';
  const theme = {
    bg: isWedding ? 'bg-black' : 'bg-slate-900',
    card: 'glass-panel',
    text: 'text-white',
    sub: 'text-zinc-500',
    accent: isWedding ? 'text-yellow-500' : 'text-blue-500'
  };

  const portal = project.portal || { timeline: [], deliverables: [], internalSpends: [] };

  const handleAddTimeline = () => {
    if (!timelineForm.title || !timelineForm.date) return;
    const item: TimelineItem = {
      id: Date.now().toString(),
      title: timelineForm.title,
      date: timelineForm.date,
      status: timelineForm.status || 'Pending',
      description: timelineForm.description
    };
    const updatedProject = {
      ...project,
      portal: { ...portal, timeline: [...(portal.timeline || []), item] }
    };
    onUpdateClient(updatedProject);
    setProject(updatedProject);
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
    const updatedProject = {
      ...project,
      portal: { ...portal, deliverables: [...(portal.deliverables || []), item] }
    };
    onUpdateClient(updatedProject);
    setProject(updatedProject);
    setIsAddingDeliverable(false);
    setDeliverableForm({ type: 'Photos', origin: 'GoogleDrive', isPublic: true });
  };

  const toggleTimelineStatus = (milestoneId: string) => {
    if (userRole === 'Client') return; // Restriction
    const updated = (portal.timeline || []).map((t: TimelineItem) => {
      if (t.id === milestoneId) {
        const nextStatus: TimelineItem['status'] = t.status === 'Completed' ? 'Pending' : 'Completed';
        return { ...t, status: nextStatus };
      }
      return t;
    });
    const updatedProject = { ...project, portal: { ...portal, timeline: updated } };
    onUpdateClient(updatedProject);
    setProject(updatedProject);
  };

  const handleAssignClient = async () => {
      if (!selectedAssignClientId) return;
      try {
          const token = localStorage.getItem("token");
          const res = await fetch(`http://localhost:5000/api/projects/${id}/assign-client`, {
              method: 'PUT',
              headers: { 
                  "Authorization": `Bearer ${token}`,
                  "Content-Type": "application/json"
               },
              body: JSON.stringify({ clientId: selectedAssignClientId })
          });
          if (res.ok) {
              const updated = await res.json();
              setProject(updated);
              setIsAssigningClient(false);
              setSelectedAssignClientId('');
          }
      } catch (err) { console.error("Assignment failed", err); }
  };

  const handleRemoveClient = async (clientId: string) => {
      try {
          const token = localStorage.getItem("token");
          const res = await fetch(`http://localhost:5000/api/projects/${id}/remove-client/${clientId}`, {
              method: 'DELETE',
              headers: { "Authorization": `Bearer ${token}` }
          });
          if (res.ok) {
              const updated = await res.json();
              setProject(updated);
          }
      } catch (err) { console.error("Removal failed", err); }
  };

  return (
    <div className={`min-h-full ${theme.bg} ${theme.text} p-6 font-sans animate-ios-slide-up`}>
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all active:scale-90 border border-white/5"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight leading-none mb-1">{project.projectName || project.name}</h1>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme.sub}`}>{project._id || project.id} • {project.brand}</p>
          </div>
        </div>
        <div className="bg-zinc-900/80 p-1 rounded-[1.25rem] border border-white/5 flex gap-1 w-full md:w-auto overflow-x-auto no-scrollbar">
          {['timeline', 'deliverables', 'gallery', 'requirements', 'people'].map(t => (
            <button
              key={t} onClick={() => setActiveTab(t as any)}
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
                {(portal.timeline || []).map((item: TimelineItem) => (
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

          {activeTab === 'gallery' && (
            <Gallery 
              clientId={typeof project.client === 'string' ? project.client : (project.client as any)?._id} 
              userRole={userRole} 
              onUpdate={async () => {
                const token = localStorage.getItem("token");
                const res = await fetch(`http://localhost:5000/api/projects/${id}`, {
                  headers: { "Authorization": `Bearer ${token}` }
                });
                if (res.ok) setProject(await res.json());
              }} 
            />
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
                {(portal.deliverables || []).map((d: Deliverable) => (
                  <div key={d.id} className="p-6 rounded-3xl bg-white/5 border border-white/5 flex items-center gap-5 group hover:border-white/20 ios-transition relative overflow-hidden">
                    <div className={`p-4 rounded-2xl ${d.origin === 'InternalServer' ? 'bg-emerald-900/40 text-emerald-400' : 'bg-blue-900/40 text-blue-400'} group-hover:scale-110 transition-transform`}>
                      {d.type === 'Video' ? <Video className="w-5 h-5" /> : d.type === 'Photos' ? <Image className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div className="overflow-hidden flex-1">
                      <h4 className="font-black text-xs truncate uppercase tracking-widest">{d.title}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-[9px] text-zinc-600 truncate font-black uppercase tracking-widest">
                          {d.assignedTo ? `Private for ${(project.people || []).find((p: Person) => p.id === d.assignedTo)?.name}` : 'Shared with All'}
                        </p>
                      </div>
                    </div>
                    <button onClick={() => {
                        const updatedProject = { ...project, portal: { ...portal, deliverables: (portal.deliverables || []).filter((item: Deliverable) => item.id !== d.id) } };
                        onUpdateClient(updatedProject);
                        setProject(updatedProject);
                    }} className="opacity-0 group-hover:opacity-100 p-2 text-zinc-800 hover:text-red-500 transition-all">
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
                {(userRole === 'Admin' || userRole === 'Staff') && (
                    <button onClick={() => setIsAssigningClient(true)} className="bg-white text-black px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-zinc-200 transition-all active:scale-95 flex items-center gap-2 shadow-xl">
                       <Plus className="w-4 h-4" /> Assign Client
                    </button>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(project.allowedClients || []).length > 0 ? (project.allowedClients as any[]).map(c => (
                  <div key={c._id} className="p-8 bg-black/40 border border-white/5 rounded-3xl group relative overflow-hidden ios-transition hover:border-white/20">
                    <div className="flex items-center gap-6">
                      <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center font-black text-white border border-white/10 uppercase">{c.name.charAt(0)}</div>
                      <div className="flex-1">
                        <h4 className="text-xl font-black text-white uppercase tracking-tight">{c.name}</h4>
                        <p className="text-[10px] lowercase text-zinc-500 tracking-widest mt-1">{c.email || 'No email registered'}</p>
                      </div>
                      {(userRole === 'Admin' || userRole === 'Staff') && (
                          <button 
                            onClick={() => handleRemoveClient(c._id)}
                            className="p-3 bg-red-500/10 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 hover:text-white"
                          >
                             <Trash2 className="w-4 h-4" />
                          </button>
                      )}
                    </div>
                  </div>
                )) : (
                    <div className="col-span-full py-20 text-center glass-panel border-dashed border-zinc-900 rounded-[2rem]">
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700">No clients assigned</p>
                    </div>
                )}
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
                {(project.requirements || []).map((req: any) => (
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
              <p className="text-zinc-500 text-xs">Sensitive internal data for {project.projectName || project.name}.</p>
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
                  value={project.vaultId || ''}
                  onChange={(e) => {
                    const updatedProject = { ...project, vaultId: e.target.value };
                    onUpdateClient(updatedProject);
                    setProject(updatedProject);
                  }}
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
                  value={project.driveFolderId || ''}
                  onChange={(e) => {
                    const updatedProject = { ...project, driveFolderId: e.target.value };
                    onUpdateClient(updatedProject);
                    setProject(updatedProject);
                  }}
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
                <span className="text-xs font-black text-white">{project.people?.length || 0} Users</span>
              </div>
              <button onClick={() => setActiveTab('people')} className="w-full py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[9px] font-black uppercase text-zinc-400 tracking-widest flex items-center justify-center gap-2">
                Manage Individual Credentials
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Assign Client Modal */}
      {isAssigningClient && (
        <div className="fixed inset-0 bg-black/80 z-[150] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-zinc-900 border border-white/10 squircle-lg w-full max-w-lg p-10 shadow-2xl animate-ios-slide-up">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-2xl font-black uppercase tracking-widest">Assign Member</h2>
              <button onClick={() => setIsAssigningClient(false)} className="p-2 bg-white/5 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-600 px-1 tracking-widest">Available Clients</label>
                <select className="w-full bg-black border border-white/5 p-4 rounded-2xl text-sm font-bold text-white outline-none" value={selectedAssignClientId} onChange={e => setSelectedAssignClientId(e.target.value)}>
                  <option value="">Select a client profile...</option>
                  {allClients.map(c => (
                    <option key={c._id} value={c._id}>{c.name} ({c.email})</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={handleAssignClient} 
                disabled={!selectedAssignClientId}
                className="w-full py-4 bg-white text-black font-black rounded-2xl text-[10px] uppercase tracking-[0.2em] shadow-xl disabled:opacity-50 transition-all active:scale-95 mt-4"
              >
                Link to Project
              </button>
            </div>
          </div>
        </div>
      )}

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
                  {(project.people || []).map((p: Person) => <option key={p.id} value={p.id}>{p.name} ({p.role})</option>)}
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
