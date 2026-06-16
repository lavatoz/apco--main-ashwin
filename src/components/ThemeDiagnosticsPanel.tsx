import React from 'react';
import { useCompanySettings } from '../hooks/useCompanySettings';
import { Palette, Monitor, Type, X } from 'lucide-react';

const ThemeDiagnosticsPanel: React.FC = () => {
    const { settings } = useCompanySettings();
    const [isVisible, setIsVisible] = React.useState(false);

    if (!isVisible) {
        return (
            <button
                onClick={() => setIsVisible(true)}
                className="fixed bottom-4 left-4 z-[99999] p-3 bg-zinc-900/80 backdrop-blur-md border border-white/10 hover:border-white/20 rounded-full text-zinc-400 hover:text-white transition-all shadow-xl active:scale-95 flex items-center justify-center"
                title="Open Theme Diagnostics"
            >
                <Palette className="w-4 h-4 text-primary" />
            </button>
        );
    }

    return (
        <div className="fixed bottom-4 left-4 z-[99999] w-80 bg-black/80 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden animate-ios-slide-up">
            <div className="bg-white/10 px-4 py-3 flex justify-between items-center border-b border-white/10">
                <div className="flex items-center gap-2">
                    <Palette className="w-4 h-4 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-white">Theme Diagnostics</span>
                </div>
                <button onClick={() => setIsVisible(false)} className="text-zinc-400 hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                </button>
            </div>
            
            <div className="p-4 space-y-3">
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Active Brand</span>
                    <span className="text-[10px] font-bold text-white uppercase truncate ml-2">{settings.companyName}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><Palette className="w-3 h-3"/> Theme Preset</span>
                    <span className="text-[10px] font-bold text-white uppercase">{settings.themePreset || 'artisans-noir'}</span>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><Monitor className="w-3 h-3"/> Graphics</span>
                    <span className="text-[10px] font-bold text-white uppercase">{settings.graphicsPreset || 'classic'}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-3">
                    <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><Type className="w-3 h-3"/> Typography</span>
                    <span className="text-[10px] font-bold text-white uppercase">{settings.typographyPreset || 'executive'}</span>
                </div>

                <div className="pt-1">
                    <span className="text-[8px] font-black text-primary uppercase tracking-[0.2em] block mb-2">Injected CSS Variables</span>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: 'var(--theme-bg)' }} />
                            <span className="text-[8px] font-mono text-zinc-400 uppercase truncate">--theme-bg</span>
                        </div>
                        <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: 'var(--theme-card-bg)' }} />
                            <span className="text-[8px] font-mono text-zinc-400 uppercase truncate">--card-bg</span>
                        </div>
                        <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: 'var(--theme-primary)' }} />
                            <span className="text-[8px] font-mono text-zinc-400 uppercase truncate">--primary</span>
                        </div>
                        <div className="bg-white/5 p-2 rounded-lg border border-white/5 flex items-center gap-2">
                            <div className="w-3 h-3 border border-white/20 shrink-0" style={{ borderColor: 'var(--theme-border)' }} />
                            <span className="text-[8px] font-mono text-zinc-400 uppercase truncate">--border</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ThemeDiagnosticsPanel;
