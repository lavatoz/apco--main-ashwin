import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { packages } from '../data/packages';
import { Check, Sparkles } from 'lucide-react';

const Packages: React.FC = () => {
  const [activeTab, setActiveTab] = useState('elegant');
  const navigate = useNavigate();

  const activePackage = packages.find(p => p.id === activeTab) || packages[1];

  const handleChoosePackage = (pkgName: string) => {
    localStorage.setItem('selectedPackage', pkgName);
    navigate('/');
    // Trigger login modal if needed, but the request says redirect to /login
    // Given the current structure in App.tsx, navigating to root and then opening login might be better
    // but I'll follow the exact instruction "Redirect to /login" if I can.
    // Actually, App.tsx handles login as a modal when showLogin is true and authRole is 'none'.
    // If I want to trigger /login route, I should add it to App.tsx.
    navigate('/login');
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-20 relative z-10 min-h-screen flex flex-col items-center">
      {/* Header */}
      <div className="text-center mb-16 animate-ios-slide-up">
        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 text-white">
          Select Your Collection
        </h1>
        <p className="text-[10px] md:text-xs font-black uppercase tracking-[0.4em] text-zinc-500">
          CURATED FILMMAKING FOR THE MODERN WEDDING
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-12 mb-16 border-b border-white/5 pb-4 animate-ios-slide-up" style={{ animationDelay: '0.1s' }}>
        {['classic', 'elegant', 'royal'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`relative text-[11px] font-black uppercase tracking-[0.3em] transition-all duration-300 ${
              activeTab === tab ? 'text-white' : 'text-zinc-600 hover:text-white'
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute -bottom-[17px] left-0 right-0 h-[2px] bg-white animate-ios-slide-up" />
            )}
          </button>
        ))}
      </div>

      {/* Package Panel */}
      <div 
        key={activeTab} // Use key to trigger re-animation on tab switch
        className="w-full max-w-[900px] glass-panel backdrop-blur-3xl rounded-[3rem] p-8 md:p-16 border border-white/10 shadow-[0_0_100px_rgba(0,0,0,0.5)] animate-ios-slide-up"
        style={{ animationDelay: '0.2s' }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
          <div className="space-y-4">
            {activePackage.tag && (
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em] animate-pulse">
                <Sparkles className="w-3 h-3" />
                {activePackage.tag}
              </span>
            )}
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white">
              {activePackage.name}
            </h2>
            <div className="flex items-center gap-3 text-zinc-400">
              <div className="p-2 bg-white/5 rounded-lg border border-white/5">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                   <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">{activePackage.crew}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.2em] mb-2">Total Investment</p>
            <h3 className="text-4xl md:text-5xl font-black font-mono text-white tracking-tighter">
              {activePackage.price}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-16">
          {activePackage.features.map((feature, idx) => (
            <div key={idx} className="flex items-start gap-4 group">
              <div className="mt-1 w-5 h-5 rounded-full bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-white group-hover:text-black transition-all">
                <Check className="w-3 h-3" />
              </div>
              <span className="text-zinc-400 text-sm font-medium leading-tight group-hover:text-white transition-colors">{feature}</span>
            </div>
          ))}
        </div>

        <button
          onClick={() => handleChoosePackage(activePackage.name)}
          className="w-full py-6 bg-white text-black rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] hover:bg-zinc-200 transition-all duration-500 shadow-[0_20px_40px_rgba(255,255,255,0.1)] active:scale-[0.98]"
        >
          Choose Package
        </button>
      </div>
    </div>
  );
};

export default Packages;
