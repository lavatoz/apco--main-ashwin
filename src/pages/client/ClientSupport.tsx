import React from 'react';
import { HelpCircle, PhoneCall, Mail, ExternalLink, ArrowRight } from 'lucide-react';
import type { Client } from '../../types';

import ClientPageLoader from './ClientPageLoader';

interface ClientSupportProps {
  client: Client | null;
}

const ClientSupport: React.FC<ClientSupportProps> = ({ client }) => {
  if (!client) return <ClientPageLoader />;

  return (
    <div className="p-8 md:p-12 animate-ios-slide-up max-w-[1400px] mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">Support</h1>
        <p className="text-xl text-zinc-400 font-medium">We're here to help.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-panel p-8 squircle-lg group hover:border-primary/30 transition-all border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><PhoneCall className="w-24 h-24" /></div>
          <div className="relative z-10">
            <div className="p-4 bg-primary/10 text-primary rounded-2xl inline-block mb-6">
              <PhoneCall className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Call Us</h3>
            <p className="text-sm font-medium text-zinc-400 mb-6">For urgent inquiries during business hours.</p>
            <a href="tel:+919876543210" className="inline-flex items-center gap-2 text-sm font-bold text-white hover:text-emerald-400 transition-colors uppercase tracking-widest">
              +91 98765 43210 <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="glass-panel p-8 squircle-lg group hover:border-primary/30 transition-all border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><Mail className="w-24 h-24" /></div>
          <div className="relative z-10">
            <div className="p-4 bg-primary/10 text-primary rounded-2xl inline-block mb-6">
              <Mail className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight mb-2">Email Support</h3>
            <p className="text-sm font-medium text-zinc-400 mb-6">We typically reply within 24 hours.</p>
            <a href="mailto:support@artisans.os" className="inline-flex items-center gap-2 text-sm font-bold text-white hover:text-blue-400 transition-colors uppercase tracking-widest">
              support@artisans.os <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
        
        <div className="glass-panel p-8 squircle-lg group hover:border-purple-500/30 transition-all border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity"><HelpCircle className="w-24 h-24" /></div>
          <div className="relative z-10">
            <div className="p-4 bg-purple-500/10 text-purple-500 rounded-2xl inline-block mb-6">
              <HelpCircle className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tight mb-2">FAQ</h3>
            <p className="text-sm font-medium text-zinc-400 mb-6">Find answers to common questions about our process.</p>
            <button className="inline-flex items-center gap-2 text-sm font-bold text-white hover:text-purple-400 transition-colors uppercase tracking-widest">
              Read Articles <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientSupport;

