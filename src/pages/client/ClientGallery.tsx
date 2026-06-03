import React from 'react';
import { Image as ImageIcon, Lock, ArrowRight } from 'lucide-react';
import type { Client } from '../../types';

interface ClientGalleryProps {
  client: Client | null;
}

const ClientGallery: React.FC<ClientGalleryProps> = ({ client }) => {
  if (!client) return null;

  return (
    <div className="p-8 md:p-12 animate-ios-slide-up max-w-[1400px] mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">Gallery</h1>
        <p className="text-xl text-zinc-400 font-medium">Curated Asset Collections</p>
      </div>

      {client.status === 'pending' || client.status === 'selected' ? (
        <div className="glass-panel p-16 squircle-lg text-center max-w-2xl mx-auto border border-dashed border-white/10">
          <Lock className="w-16 h-16 text-zinc-600 mx-auto mb-6" />
          <h2 className="text-2xl font-black uppercase tracking-tight mb-4">Gallery Locked</h2>
          <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto mb-8">
            Your high-resolution gallery is currently being curated by our editors. You will receive a notification once it's available for viewing.
          </p>
          <div className="inline-block px-6 py-3 bg-white/5 rounded-full border border-white/5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
            Status: {client.status}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           <div className="glass-panel p-8 squircle-lg group hover:scale-[1.02] transition-all border border-white/5 cursor-pointer flex flex-col h-full min-h-[300px] justify-between relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="flex justify-between items-start relative z-10">
                <div className="p-4 bg-white/5 rounded-2xl group-hover:bg-purple-500 group-hover:text-white transition-colors">
                  <ImageIcon className="w-6 h-6" />
                </div>
                <ArrowRight className="w-5 h-5 text-zinc-600 group-hover:text-white transition-all transform group-hover:translate-x-1 group-hover:-translate-y-1" />
              </div>
              <div className="relative z-10">
                <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Highlights</h3>
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Selected Best Shots</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ClientGallery;
