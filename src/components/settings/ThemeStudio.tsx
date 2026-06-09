import React, { useState } from 'react';
import type { CompanyProfile, CustomThemeConfig } from '../../types';
import { useCompanySettings } from '../../hooks/useCompanySettings';
import { THEME_PRESETS, GRAPHICS_PRESETS, TYPOGRAPHY_PRESETS } from '../../utils/themeEngine';
import { ThemePreview } from './ThemePreview';
import { Palette, Type, Monitor, Sliders, Download, Upload, Plus, Check } from 'lucide-react';

interface ThemeStudioProps {
  company: CompanyProfile;
  onUpdate: (updated: Partial<CompanyProfile>) => void;
}

export const ThemeStudio: React.FC<ThemeStudioProps> = ({ company, onUpdate }) => {
  const { globalSettings, saveGlobalSettings } = useCompanySettings();
  const [activeTab, setActiveTab] = useState<'presets' | 'builder'>('presets');
  
  const currentTheme = company.themePreset || 'artisans-noir';
  const currentGraphics = company.graphicsPreset || 'classic';
  const currentTypography = company.typographyPreset || 'executive';

  // Builder State
  const [builderState, setBuilderState] = useState<Partial<CustomThemeConfig>>({
    name: 'My Custom Theme',
    primaryColor: '#3B82F6',
    cardBackground: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    cardRadius: '1rem',
    blurIntensity: '20px',
  });

  const [importJson, setImportJson] = useState('');
  const [showImport, setShowImport] = useState(false);

  const handleSaveCustomTheme = () => {
    if (!builderState.name) return;
    const newTheme: CustomThemeConfig = {
      id: `custom_${Date.now()}`,
      name: builderState.name,
      primaryColor: builderState.primaryColor || '#3B82F6',
      secondaryColor: builderState.secondaryColor || '#3B82F6',
      accentColor: builderState.accentColor || '#3B82F6',
      borderColor: builderState.borderColor || 'rgba(255, 255, 255, 0.1)',
      cardBackground: builderState.cardBackground || 'rgba(255, 255, 255, 0.05)',
      glowColor: builderState.glowColor || 'rgba(59, 130, 246, 0.5)',
      shadowStrength: builderState.shadowStrength || '20px',
      cardRadius: builderState.cardRadius || '1rem',
      blurIntensity: builderState.blurIntensity || '20px',
      baseTheme: 'artisans-noir',
      graphics: currentGraphics,
      typography: currentTypography
    };

    const existingCustoms = globalSettings.customThemes || [];
    saveGlobalSettings({
      ...globalSettings,
      customThemes: [...existingCustoms, newTheme]
    });
    
    // Automatically select it
    onUpdate({ themePreset: newTheme.id });
    setActiveTab('presets');
  };

  const handleExport = () => {
    const exportData = {
      theme: currentTheme,
      graphics: currentGraphics,
      typography: currentTypography
    };
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    alert('Theme configuration copied to clipboard!');
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importJson);
      if (data.theme || data.graphics || data.typography) {
        onUpdate({
          themePreset: data.theme || currentTheme,
          graphicsPreset: data.graphics || currentGraphics,
          typographyPreset: data.typography || currentTypography
        });
        setShowImport(false);
        setImportJson('');
      } else {
        alert('Invalid theme format.');
      }
    } catch (e) {
      alert('Invalid JSON.');
    }
  };

  const customThemes = globalSettings.customThemes || [];

  return (
    <div className="space-y-8 mt-10 border-t border-white/5 pt-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Palette className="w-6 h-6 text-pink-500" />
          <h3 className="text-xl font-black uppercase tracking-widest text-white">Theme Studio</h3>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'presets' ? 'bg-white text-black' : 'bg-white/5 text-zinc-400 hover:text-white'}`}
          >
            Presets
          </button>
          <button 
            onClick={() => setActiveTab('builder')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'builder' ? 'bg-white text-black' : 'bg-white/5 text-zinc-400 hover:text-white'}`}
          >
            Builder
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Col: Controls */}
        <div className="space-y-8 bg-black/40 p-6 rounded-[2rem] border border-white/5 h-fit">
          
          {activeTab === 'presets' ? (
            <>
              {/* Theme Presets */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Palette className="w-3 h-3" /> Core Identity
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {THEME_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => onUpdate({ themePreset: preset.id })}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${currentTheme === preset.id ? 'bg-primary/10 border-primary/30 text-blue-400 shadow-inner' : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/20'}`}
                    >
                      <span className="text-xs font-bold uppercase tracking-widest truncate pr-2">{preset.name}</span>
                      {currentTheme === preset.id && <Check className="w-3 h-3 shrink-0" />}
                    </button>
                  ))}
                  
                  {/* Global Custom Themes */}
                  {customThemes.length > 0 && <div className="col-span-2 my-2 h-px bg-white/5" />}
                  {customThemes.map(custom => (
                    <button
                      key={custom.id}
                      onClick={() => onUpdate({ themePreset: custom.id })}
                      className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${currentTheme === custom.id ? 'bg-pink-500/10 border-pink-500/30 text-pink-400 shadow-inner' : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/20'}`}
                    >
                      <span className="text-xs font-bold uppercase tracking-widest truncate pr-2">★ {custom.name}</span>
                      {currentTheme === custom.id && <Check className="w-3 h-3 shrink-0" />}
                    </button>
                  ))}
                </div>
              </div>

              {/* Graphics Presets */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Monitor className="w-3 h-3" /> Graphics Engine
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {GRAPHICS_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => onUpdate({ graphicsPreset: preset.id })}
                      className={`p-3 rounded-xl border text-center transition-all ${currentGraphics === preset.id ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/20'}`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Typography Presets */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Type className="w-3 h-3" /> Typography
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPOGRAPHY_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => onUpdate({ typographyPreset: preset.id })}
                      className={`p-3 rounded-xl border text-center transition-all ${currentTypography === preset.id ? 'bg-primary/10 border-primary/30 text-emerald-400' : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/20'}`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-widest">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Import / Export */}
              <div className="flex gap-2 pt-4 border-t border-white/5">
                <button 
                  onClick={handleExport}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-3 h-3" /> Export Theme
                </button>
                <button 
                  onClick={() => setShowImport(!showImport)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                >
                  <Upload className="w-3 h-3" /> Import Theme
                </button>
              </div>

              {showImport && (
                <div className="space-y-3 animate-ios-slide-up">
                  <textarea 
                    className="w-full glass-panel rounded-xl p-4 text-[10px] font-mono text-zinc-400 outline-none h-24 resize-none"
                    placeholder='{"theme": "royal-gold", "graphics": "cinematic", "typography": "luxury"}'
                    value={importJson}
                    onChange={e => setImportJson(e.target.value)}
                  />
                  <button 
                    onClick={handleImport}
                    className="w-full py-3 bg-white text-black rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl"
                  >
                    Apply Import
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Custom Theme Builder */
            <div className="space-y-6 animate-ios-fade-in">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Theme Name</label>
                <input 
                  type="text" 
                  value={builderState.name}
                  onChange={e => setBuilderState(p => ({...p, name: e.target.value}))}
                  className="w-full glass-panel rounded-xl p-4 text-sm font-bold text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Primary Color</label>
                  <div className="flex gap-2 items-center">
                    <input 
                      type="color" 
                      value={builderState.primaryColor}
                      onChange={e => setBuilderState(p => ({...p, primaryColor: e.target.value}))}
                      className="w-10 h-10 bg-transparent border-none rounded cursor-pointer"
                    />
                    <span className="text-xs font-mono text-zinc-400 uppercase">{builderState.primaryColor}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Card BG (rgba)</label>
                  <input 
                    type="text" 
                    value={builderState.cardBackground}
                    onChange={e => setBuilderState(p => ({...p, cardBackground: e.target.value}))}
                    className="w-full glass-panel rounded-xl p-3 text-xs font-mono text-white outline-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Border Color</label>
                  <input 
                    type="text" 
                    value={builderState.borderColor}
                    onChange={e => setBuilderState(p => ({...p, borderColor: e.target.value}))}
                    className="w-full glass-panel rounded-xl p-3 text-xs font-mono text-white outline-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Card Radius</label>
                  <select 
                    value={builderState.cardRadius}
                    onChange={e => setBuilderState(p => ({...p, cardRadius: e.target.value}))}
                    className="w-full glass-panel rounded-xl p-3 text-xs font-bold text-white outline-none"
                  >
                    <option value="0px">0px (Sharp)</option>
                    <option value="0.5rem">0.5rem (Subtle)</option>
                    <option value="1rem">1rem (Standard)</option>
                    <option value="1.5rem">1.5rem (Soft)</option>
                    <option value="2rem">2rem (Pill)</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Blur Intensity</label>
                  <select 
                    value={builderState.blurIntensity}
                    onChange={e => setBuilderState(p => ({...p, blurIntensity: e.target.value}))}
                    className="w-full glass-panel rounded-xl p-3 text-xs font-bold text-white outline-none"
                  >
                    <option value="0px">None</option>
                    <option value="10px">10px (Light)</option>
                    <option value="20px">20px (Standard)</option>
                    <option value="40px">40px (Heavy)</option>
                  </select>
                </div>
              </div>

              <button 
                onClick={handleSaveCustomTheme}
                className="w-full py-4 bg-white text-black rounded-xl text-xs font-black uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-2 mt-4"
              >
                <Plus className="w-4 h-4" /> Save as Global Theme
              </button>
            </div>
          )}

        </div>

        {/* Right Col: Live Preview */}
        <div className="space-y-4">
          <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2 px-2">
            <Sliders className="w-3 h-3" /> Live Render Preview
          </label>
          <ThemePreview 
            themeId={activeTab === 'presets' ? currentTheme : `custom_preview`} 
            graphicsId={currentGraphics} 
            typographyId={currentTypography} 
            customThemes={activeTab === 'presets' ? customThemes : [{ ...builderState, id: 'custom_preview' } as CustomThemeConfig]}
          />
        </div>
      </div>
    </div>
  );
};


