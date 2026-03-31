import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Phone, Calendar, User, Briefcase, RefreshCw, AlertTriangle } from 'lucide-react';

const ClientDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchClient = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`http://localhost:5000/api/clients/${id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (!res.ok) {
          throw new Error("Client not found");
        }
        
        const data = await res.json();
        setClient(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Client not found");
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchClient();
    }
  }, [id]);

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
        <div className="glass-panel p-10 squircle-lg border border-white/5 relative overflow-hidden bg-gradient-to-br from-white/5 to-transparent">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-3xl rounded-full" />
          
          <div className="flex flex-col md:flex-row gap-10 relative z-10">
            {/* Header & Setup */}
            <div className="flex-1 space-y-8">
              <div className="space-y-4">
                <div className="inline-block px-3 py-1 bg-white/5 rounded-lg border border-white/10 text-[9px] font-black text-zinc-500 tracking-widest uppercase font-mono mt-2">
                  ID: {client._id || id}
                </div>
                <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none flex items-center gap-4">
                  <User className="w-10 h-10 text-zinc-600 hidden md:block" />
                  {client.name || client.projectName}
                </h1>
                
                {client.brandId?.name && (
                  <p className="text-[12px] font-black uppercase tracking-[0.3em] text-blue-400 flex items-center gap-2">
                    <Briefcase className="w-4 h-4" /> {client.brandId.name}
                  </p>
                )}
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-8 border-t border-white/10">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 flex items-center gap-2">
                    <Mail className="w-3 h-3" /> Email Address
                  </p>
                  <p className="text-sm font-bold text-zinc-300">{client.email || 'N/A'}</p>
                </div>
                
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 flex items-center gap-2">
                    <Phone className="w-3 h-3" /> Phone Number
                  </p>
                  <p className="text-sm font-bold font-mono text-zinc-300">{client.phone || 'N/A'}</p>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600 flex items-center gap-2">
                    <Calendar className="w-3 h-3" /> Event Date
                  </p>
                  <p className="text-sm font-bold text-zinc-300">
                    {client.eventDate 
                      ? new Date(client.eventDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) 
                      : 'Not Scheduled'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default ClientDetails;
