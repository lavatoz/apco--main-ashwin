import React from 'react';
import { Image as ImageIcon, Video, FileText, Download } from 'lucide-react';
import type { Client } from '../../types';

interface ClientDeliverablesProps {
  client: Client | null;
}

const ClientDeliverables: React.FC<ClientDeliverablesProps> = ({ client }) => {
  if (!client) return null;

  const deliverables = client.portal?.deliverables || [];

  return (
    <div className="p-8 md:p-12 animate-ios-slide-up max-w-[1400px] mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">Deliverables</h1>
        <p className="text-xl text-zinc-400 font-medium">Final Assets & Exports</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {deliverables.map((d, i) => (
          <div key={d.id || i} className="glass-panel p-8 squircle-lg group hover:scale-[1.02] active:scale-[0.98] transition-all relative overflow-hidden flex flex-col h-full border border-white/5 hover:border-blue-500/30 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]">
            <div className="mb-10 flex justify-between items-start">
              <div className={`p-4 rounded-2xl bg-white/5 text-zinc-400 group-hover:bg-blue-500 group-hover:text-white transition-colors`}>
                {d.type === 'Video' ? <Video className="w-6 h-6" /> : d.type === 'Photos' ? <ImageIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
              </div>
              <a href={d.url} target="_blank" rel="noreferrer" className="p-3 bg-white/5 rounded-full hover:bg-white text-zinc-400 hover:text-black transition-all">
                <Download className="w-4 h-4" />
              </a>
            </div>
            
            <h3 className="text-xl font-black uppercase tracking-tight mb-2 group-hover:text-blue-400 transition-colors">{d.title}</h3>
            
            <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/5">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{d.type} Assets</p>
              {d.origin === 'GoogleDrive' && <span className="text-[9px] font-black uppercase text-zinc-600 bg-white/5 px-2 py-1 rounded">G-Drive</span>}
            </div>
          </div>
        ))}

        {deliverables.length === 0 && (
          <div className="col-span-full py-20 text-center glass-panel border border-dashed rounded-[2rem]">
            <p className="text-xs font-bold uppercase tracking-widest text-zinc-600">No deliverables uploaded yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientDeliverables;
