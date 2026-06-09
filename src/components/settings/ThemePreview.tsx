import React, { useEffect, useRef } from 'react';
import { applyTheme } from '../../utils/themeEngine';
import type { CustomThemeConfig } from '../../types';
import { Activity, Briefcase, Calendar, CheckSquare, Settings as Gear, Shield, User } from 'lucide-react';

interface ThemePreviewProps {
  themeId: string;
  graphicsId: string;
  typographyId: string;
  customThemes: CustomThemeConfig[];
}

export const ThemePreview: React.FC<ThemePreviewProps> = ({ themeId, graphicsId, typographyId, customThemes }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      applyTheme(themeId, graphicsId, typographyId, customThemes, containerRef.current.id);
    }
  }, [themeId, graphicsId, typographyId, customThemes]);

  return (
    <div 
      id="theme-preview-container" 
      ref={containerRef}
      className="w-full rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl transition-all relative min-h-[400px]"
      style={{ backgroundColor: 'var(--theme-bg)', color: 'var(--theme-text)', fontFamily: 'var(--theme-font-family)' }}
    >
      {/* Background for graphics modes like cinematic/luxury-grain are handled globally for body usually, 
          but for preview we might need to fake it if the CSS targets body. 
          We updated CSS to target data-graphics="cinematic" on body. Let's make sure it works here too. */}
      
      {/* Fake Header */}
      <div className="p-6 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className="font-black uppercase tracking-widest text-sm">ArtisansOS</span>
        </div>
        <div className="flex gap-4">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Admin Portal</span>
          <div className="w-6 h-6 rounded-full bg-white/10 border border-white/5" />
        </div>
      </div>

      <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Sidebar Mockup */}
        <div className="hidden md:flex flex-col gap-2">
          <div className="p-3 bg-white/5 rounded-xl border border-white/5 flex items-center gap-3 text-primary">
            <Activity className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Dashboard</span>
          </div>
          <div className="p-3 hover:bg-white/5 rounded-xl border border-transparent flex items-center gap-3 text-zinc-400">
            <Briefcase className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Projects</span>
          </div>
          <div className="p-3 hover:bg-white/5 rounded-xl border border-transparent flex items-center gap-3 text-zinc-400">
            <User className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-widest">Clients</span>
          </div>
        </div>

        {/* Main Content Mockup */}
        <div className="md:col-span-2 space-y-6">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Overview</h2>
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-1">Live metrics preview</p>
            </div>
            <button className="px-4 py-2 bg-primary text-white rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-primary">
              New Project
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-panel p-5">
              <div className="flex justify-between mb-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Revenue</span>
                <Activity className="w-4 h-4 text-primary" />
              </div>
              <p className="text-xl font-black">₹4.2M</p>
            </div>
            <div className="glass-panel p-5">
              <div className="flex justify-between mb-3">
                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Tasks</span>
                <CheckSquare className="w-4 h-4 text-amber-500" />
              </div>
              <p className="text-xl font-black">12 Pending</p>
            </div>
          </div>

          <div className="glass-panel p-6">
            <h3 className="text-xs font-black uppercase tracking-widest mb-4 border-b border-white/5 pb-2">Recent Activity</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                  <Calendar className="w-3 h-3 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-bold">Client Meeting Scheduled</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">2 hours ago</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                  <Gear className="w-3 h-3 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-bold">Theme Settings Updated</p>
                  <p className="text-[10px] text-zinc-500 uppercase tracking-widest">Just now</p>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

