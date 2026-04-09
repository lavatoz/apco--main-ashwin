
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Calendar, User, Briefcase, RefreshCw, AlertTriangle, Edit2, X, Check, LayoutDashboard, ChevronRight } from 'lucide-react';
import { api } from '../services/api';

const ClientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [client, setClient] = useState<any>(null);
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    eventDate: ''
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchClient = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/clients/${id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (!res.ok) throw new Error("Client not found");
        
        const data = await res.json();
        setClient(data);
        setEditForm({
          name: data.name || data.projectName || '',
          email: data.email || '',
          phone: data.phone || '',
          eventDate: data.eventDate ? new Date(data.eventDate).toISOString().split('T')[0] : ''
        });

        const projRes = await fetch(`http://localhost:5000/api/projects`, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (projRes.ok) {
            const projects = await projRes.json();
            const found = projects.find((p: any) => 
               p.client?._id === id || 
               (typeof p.client === 'string' && p.client === id)
            );
            setProject(found);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Client not found");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) fetchClient();
  }, [id]);

  const handleUpdate = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsSaving(true);
      try {
          const updated = await api.saveClient({ _id: id, ...editForm } as any);
          setClient(updated);
          setIsEditing(false);
          api.logActivity({ action: `Updated client: ${editForm.name}`, type: 'Update', actorId: 'ADMIN', actorName: 'Admin', actorRole: 'Admin' });
      } catch (err) {
          console.error("Update failed", err);
          alert("Update failed. Please try again.");
      } finally {
          setIsSaving(false);
      }
  };

  return (
    <div className="space-y-8 animate-ios-slide-up pb-24 max-w-4xl mx-auto">
      <button 
        onClick={() => navigate('/directory')} 
        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-zinc-300 transition-colors border border-white/5 active:scale-95 w-max"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Directory
      </button>

      {error ? (
        <div className="flex flex-col items-center justify-center py-32 bg-red-500/5 border border-red-500/10 rounded-[2rem] space-y-4">
          <AlertTriangle className="w-12 h-12 text-red-500 opacity-50" />
          <h2 className="text-xl font-black text-red-500 uppercase tracking-widest">{error}</h2>
        </div>
      ) : loading ? (
        <div className="flex flex-col items-center justify-center p-32 glass-panel rounded-[2rem] border border-dashed border-zinc-800 space-y-4">
          <RefreshCw className="w-8 h-8 text-zinc-600 animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-600">Loading client...</p>
        </div>
      ) : client ? (
        <div className="glass-panel p-10 squircle-lg border border-white/5 relative overflow-hidden bg-gradient-to-br from-white/5 to-transparent shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-3xl rounded-full" />
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-10">
                <div className="space-y-4">
                    <div className="inline-block px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[9px] font-black text-zinc-500 tracking-widest uppercase font-mono">
                      ID: {client._id || id}
                    </div>
                </div>
                {!isEditing && (
                    <button 
                        onClick={() => setIsEditing(true)}
                        className="bg-white text-black p-4 rounded-2xl flex items-center gap-3 font-black uppercase text-[10px] tracking-widest hover:bg-zinc-200 transition-all shadow-xl active:scale-95"
                    >
                        <Edit2 className="w-4 h-4" /> Edit Client
                    </button>
                )}
            </div>

            <div className="flex flex-col md:flex-row gap-10">
                <div className="flex-1 space-y-8">
                  {isEditing ? (
                      <form onSubmit={handleUpdate} className="space-y-8 animate-ios-slide-up">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                              <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Full Name</label>
                                  <input 
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-white/30 transition-all" 
                                    value={editForm.name} 
                                    onChange={e => setEditForm({...editForm, name: e.target.value})} 
                                  />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Email Address</label>
                                  <input 
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-white/30 transition-all" 
                                    value={editForm.email} 
                                    onChange={e => setEditForm({...editForm, email: e.target.value})} 
                                  />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Phone Number</label>
                                  <input 
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-white/30 transition-all" 
                                    value={editForm.phone} 
                                    onChange={e => setEditForm({...editForm, phone: e.target.value})} 
                                  />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-zinc-500 tracking-widest px-1">Event Date</label>
                                  <input 
                                    type="date"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 text-sm font-bold text-white outline-none focus:border-white/30 transition-all" 
                                    value={editForm.eventDate} 
                                    onChange={e => setEditForm({...editForm, eventDate: e.target.value})} 
                                  />
                              </div>
                          </div>
                          <div className="flex gap-4 pt-8 border-t border-white/5">
                              <button 
                                type="submit" 
                                disabled={isSaving}
                                className="flex-1 bg-white text-black py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all shadow-2xl active:scale-95"
                              >
                                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-5 h-5" />}
                                  Save Modifications
                              </button>
                              <button 
                                type="button" 
                                onClick={() => setIsEditing(false)}
                                className="px-10 bg-white/5 text-white py-5 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-white/10 transition-all flex items-center gap-3 border border-white/5"
                              >
                                  <X className="w-5 h-5" /> Discard
                              </button>
                          </div>
                      </form>
                  ) : (
                      <>
                        <div className="space-y-2">
                            <h1 className="text-6xl font-black text-white tracking-tighter uppercase leading-none flex items-center gap-6">
                              <User className="w-12 h-12 text-zinc-700 hidden md:block" />
                              {client.name || client.projectName}
                            </h1>
                            {client.brandId?.name && (
                              <p className="text-[14px] font-black uppercase tracking-[0.4em] text-blue-500 flex items-center gap-3 mt-4">
                                <Briefcase className="w-5 h-5" /> {client.brandId.name}
                              </p>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-10 pt-10 border-t border-white/5">
                          <div className="space-y-3">
                            <p className="text-[11px] font-black uppercase tracking-widest text-zinc-600 flex items-center gap-3">
                              <Mail className="w-4 h-4" /> Email Address
                            </p>
                            <p className="text-lg font-bold text-zinc-200">{client.email || 'N/A'}</p>
                          </div>
                          
                          <div className="space-y-3">
                            <p className="text-[11px] font-black uppercase tracking-widest text-zinc-600 flex items-center gap-3">
                              <Phone className="w-4 h-4" /> Phone Number
                            </p>
                            <p className="text-lg font-bold font-mono text-zinc-200">{client.phone || 'N/A'}</p>
                          </div>

                          <div className="space-y-3">
                            <p className="text-[11px] font-black uppercase tracking-widest text-zinc-600 flex items-center gap-3">
                              <Calendar className="w-4 h-4" /> Event Date
                            </p>
                            <p className="text-lg font-bold text-zinc-200">
                              {client.eventDate 
                                ? new Date(client.eventDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) 
                                : 'Not Scheduled'}
                            </p>
                          </div>
                        </div>
                      </>
                  )}
                </div>
            </div>

            {project && (
                <div className="mt-8 p-10 bg-blue-600/5 border border-blue-500/10 squircle-lg flex flex-col md:flex-row items-center justify-between gap-8 group hover:bg-blue-600/10 transition-all duration-700">
                    <div className="flex items-center gap-8">
                        <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 shadow-[0_0_40px_rgba(37,99,235,0.2)] group-hover:scale-110 transition-transform">
                            <LayoutDashboard className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="text-xl font-black uppercase text-white tracking-tight">Project Hub Portal</h4>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 mt-1">Status: {project.status} • {project.images?.length || 0} Assets Loaded</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => navigate(`/portal/${project._id}`)}
                        className="bg-white text-black px-10 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center gap-3 shadow-[0_30px_60px_rgba(255,255,255,0.1)] hover:bg-zinc-200 transition-all active:scale-95 group-hover:px-12"
                    >
                        Access Gallery <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ClientDetails;
