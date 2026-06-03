import React, { useState } from 'react';
import { MessageSquare, Send, ArrowRight } from 'lucide-react';
import type { Client } from '../../types';

interface ClientMessagesProps {
  client: Client | null;
}

const ClientMessages: React.FC<ClientMessagesProps> = ({ client }) => {
  const [requestText, setRequestText] = useState('');

  if (!client) return null;

  const requirements = client.requirements || [];

  return (
    <div className="p-8 md:p-12 animate-ios-slide-up max-w-[1400px] mx-auto h-[calc(100vh-80px)] flex flex-col">
      <div className="mb-8 shrink-0">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">Messages</h1>
        <p className="text-xl text-zinc-400 font-medium">Project Communication & Requirements</p>
      </div>

      <div className="flex-1 flex flex-col md:flex-row gap-8 overflow-hidden min-h-0">
        {/* Messages List */}
        <div className="flex-1 glass-panel squircle-lg flex flex-col overflow-hidden">
          <div className="p-6 border-b border-white/5 bg-white/5 shrink-0">
             <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-500" /> Collaboration Thread
             </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {requirements.map((req, i) => (
              <div key={req.id || i} className="flex flex-col gap-1 items-end">
                 <div className="bg-blue-600 text-white p-4 rounded-2xl rounded-tr-sm max-w-[80%] shadow-lg">
                    <p className="text-sm font-medium leading-relaxed">{req.text.replace(/\[From .*\]: /, '')}</p>
                 </div>
                 <div className="flex items-center gap-2 mt-1">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{new Date(req.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{req.status}</span>
                 </div>
              </div>
            ))}
            
            {requirements.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                 <MessageSquare className="w-12 h-12 mb-4 text-zinc-600" />
                 <p className="text-xs font-bold uppercase tracking-widest">No messages yet. Start the conversation!</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-white/5 bg-black/40 shrink-0">
             <div className="flex gap-2">
                <input 
                  type="text" 
                  value={requestText}
                  onChange={(e) => setRequestText(e.target.value)}
                  placeholder="Type your message..." 
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-white/20 transition-all font-medium text-white"
                />
                <button className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold uppercase text-xs tracking-widest transition-colors flex items-center justify-center active:scale-95 shadow-xl">
                   <Send className="w-4 h-4" />
                </button>
             </div>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="w-full md:w-80 space-y-6 shrink-0 overflow-y-auto">
           <div className="glass-panel p-6 squircle-lg">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-4">Assigned Team</h3>
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center font-bold font-serif text-white">A</div>
                    <div>
                       <p className="text-sm font-bold">Production Desk</p>
                       <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Primary Contact</p>
                    </div>
                 </div>
              </div>
           </div>
           
           <button className="w-full glass-panel p-6 squircle-lg group hover:bg-white/5 transition-colors text-left">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2">Need Immediate Help?</h3>
              <div className="flex items-center justify-between">
                 <span className="text-sm font-bold group-hover:text-blue-400 transition-colors">Contact Support</span>
                 <ArrowRight className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
              </div>
           </button>
        </div>
      </div>
    </div>
  );
};

export default ClientMessages;
