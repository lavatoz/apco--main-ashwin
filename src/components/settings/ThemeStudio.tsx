import React, { useState, useEffect } from 'react';
import type { CompanyProfile, CustomThemeConfig } from '../../types';
import { useCompanySettings } from '../../hooks/useCompanySettings';
import { THEME_PRESETS, GRAPHICS_PRESETS, TYPOGRAPHY_PRESETS } from '../../utils/themeEngine';
import { ThemePreview } from './ThemePreview';
import {
  Palette, Type, Monitor, Sliders, Download, Upload,
  Plus, Check, Eye, CheckCircle2, RotateCcw, Sparkles
} from 'lucide-react';

interface ThemeStudioProps {
  company: CompanyProfile;
  onUpdate: (updated: Partial<CompanyProfile>) => void;
}

export const ThemeStudio: React.FC<ThemeStudioProps> = ({ company, onUpdate }) => {
  const { globalSettings, saveGlobalSettings } = useCompanySettings();
  const [activeTab, setActiveTab] = useState<'presets' | 'builder'>('presets');

  // ── Active (applied) theme — read from company prop ─────────────────────────
  const activeTheme = company.themePreset || 'artisans-noir';
  const activeGraphics = company.graphicsPreset || 'classic';
  const activeTypography = company.typographyPreset || 'executive';

  // ── Preview (staging) state — what's shown in the preview pane ─────────────
  const [previewTheme, setPreviewTheme] = useState(activeTheme);
  const [previewGraphics, setPreviewGraphics] = useState(activeGraphics);
  const [previewTypography, setPreviewTypography] = useState(activeTypography);

  // Reset preview when the company (applied theme) changes externally
  useEffect(() => {
    setPreviewTheme(company.themePreset || 'artisans-noir');
    setPreviewGraphics(company.graphicsPreset || 'classic');
    setPreviewTypography(company.typographyPreset || 'executive');
  }, [company.themePreset, company.graphicsPreset, company.typographyPreset]);

  // Whether preview differs from what's applied
  const hasUnappliedChanges =
    previewTheme !== activeTheme ||
    previewGraphics !== activeGraphics ||
    previewTypography !== activeTypography;

  // ── Custom Theme Builder state ───────────────────────────────────────────────
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
  const [applySuccess, setApplySuccess] = useState(false);

  // ── Actions ──────────────────────────────────────────────────────────────────

  /** Discard preview and revert to the currently applied theme */
  const handleDiscardPreview = () => {
    setPreviewTheme(activeTheme);
    setPreviewGraphics(activeGraphics);
    setPreviewTypography(activeTypography);
  };

  /** Commit the previewed selections to localStorage via onUpdate */
  const handleApplyTheme = () => {
    onUpdate({
      themePreset: previewTheme,
      graphicsPreset: previewGraphics,
      typographyPreset: previewTypography,
    });
    setApplySuccess(true);
    setTimeout(() => setApplySuccess(false), 2500);
  };

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
      graphics: builderState.graphics || 'classic',
      typography: builderState.typography || 'executive',
    };

    const existingCustoms = globalSettings.customThemes || [];
    saveGlobalSettings({ ...globalSettings, customThemes: [...existingCustoms, newTheme] });

    // Select it in preview only (not applied yet)
    setPreviewTheme(newTheme.id);
    setActiveTab('presets');
  };

  const handleExport = () => {
    const exportData = { theme: activeTheme, graphics: activeGraphics, typography: activeTypography };
    navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
    alert('Active theme configuration copied to clipboard!');
  };

  const handleImport = () => {
    try {
      const data = JSON.parse(importJson);
      if (data.theme || data.graphics || data.typography) {
        // Import into preview staging only
        setPreviewTheme(data.theme || activeTheme);
        setPreviewGraphics(data.graphics || activeGraphics);
        setPreviewTypography(data.typography || activeTypography);
        setShowImport(false);
        setImportJson('');
      } else {
        alert('Invalid theme format.');
      }
    } catch {
      alert('Invalid JSON.');
    }
  };

  const customThemes = globalSettings.customThemes || [];

  // The full custom theme list for preview rendering (add builder preview)
  const previewCustomThemes =
    activeTab === 'presets'
      ? customThemes
      : [{ ...builderState, id: 'custom_preview' } as CustomThemeConfig, ...customThemes];

  const previewThemeId = activeTab === 'presets' ? previewTheme : 'custom_preview';

  return (
    <div className="space-y-8 mt-10 border-t border-white/5 pt-10">

      {/* Header row */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Palette className="w-6 h-6 text-pink-500" />
          <h3 className="text-xl font-black uppercase tracking-widest text-white">Theme Studio</h3>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'presets' ? 'bg-white text-black' : 'bg-white/5 text-zinc-400 hover:text-white'}`}
          >
            Presets
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('builder')}
            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all ${activeTab === 'builder' ? 'bg-white text-black' : 'bg-white/5 text-zinc-400 hover:text-white'}`}
          >
            Builder
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* ── Left Col: Selector Controls ─────────────────────────────── */}
        <div className="space-y-6 bg-black/40 p-6 rounded-[2rem] border border-white/5 h-fit">

          {/* Currently applied badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white/3 border border-white/8 rounded-xl">
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
              Applied:
            </span>
            <span className="text-[9px] font-black uppercase tracking-widest text-white">
              {THEME_PRESETS.find(t => t.id === activeTheme)?.name || activeTheme}
            </span>
            <span className="text-zinc-700 mx-1">·</span>
            <span className="text-[9px] font-black uppercase tracking-widest text-white">
              {TYPOGRAPHY_PRESETS.find(t => t.id === activeTypography)?.name || activeTypography}
            </span>
          </div>

          {activeTab === 'presets' ? (
            <>
              {/* Theme Presets */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Palette className="w-3 h-3" /> Core Identity
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {THEME_PRESETS.map(preset => {
                    const isActive = activeTheme === preset.id;
                    const isPreviewing = previewTheme === preset.id;
                    return (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => setPreviewTheme(preset.id)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all relative ${
                          isPreviewing
                            ? 'bg-pink-500/10 border-pink-500/30 text-pink-400 shadow-inner'
                            : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <span className="text-xs font-bold uppercase tracking-widest truncate pr-2">
                          {preset.name}
                        </span>
                        <div className="flex items-center gap-1 shrink-0">
                          {isActive && !isPreviewing && (
                            <span className="text-[8px] text-zinc-600 uppercase">live</span>
                          )}
                          {isPreviewing && <Eye className="w-3 h-3" />}
                          {isActive && isPreviewing && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    );
                  })}

                  {/* Custom Themes */}
                  {customThemes.length > 0 && <div className="col-span-2 my-2 h-px bg-white/5" />}
                  {customThemes.map(custom => {
                    const isPreviewing = previewTheme === custom.id;
                    const isActive = activeTheme === custom.id;
                    return (
                      <button
                        type="button"
                        key={custom.id}
                        onClick={() => setPreviewTheme(custom.id)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isPreviewing
                            ? 'bg-pink-500/10 border-pink-500/30 text-pink-400 shadow-inner'
                            : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/20'
                        }`}
                      >
                        <span className="text-xs font-bold uppercase tracking-widest truncate pr-2">
                          ★ {custom.name}
                        </span>
                        {isPreviewing && <Eye className="w-3 h-3 shrink-0" />}
                        {isActive && !isPreviewing && <Check className="w-3 h-3 shrink-0 opacity-30" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Graphics Presets */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Monitor className="w-3 h-3" /> Graphics Engine
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {GRAPHICS_PRESETS.map(preset => {
                    const isPreviewing = previewGraphics === preset.id;
                    const isActive = activeGraphics === preset.id;
                    return (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => setPreviewGraphics(preset.id)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isPreviewing
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                            : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {preset.name}
                        </span>
                        {isActive && !isPreviewing && (
                          <span className="block text-[8px] text-zinc-700 uppercase mt-0.5">active</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Typography Presets */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Type className="w-3 h-3" /> Typography
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {TYPOGRAPHY_PRESETS.map(preset => {
                    const isPreviewing = previewTypography === preset.id;
                    const isActive = activeTypography === preset.id;
                    return (
                      <button
                        type="button"
                        key={preset.id}
                        onClick={() => setPreviewTypography(preset.id)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          isPreviewing
                            ? 'bg-primary/10 border-primary/30 text-emerald-400'
                            : 'bg-white/5 border-white/5 text-zinc-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {preset.name}
                        </span>
                        {isActive && !isPreviewing && (
                          <span className="block text-[8px] text-zinc-700 uppercase mt-0.5">active</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Import / Export */}
              <div className="flex gap-2 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={handleExport}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                >
                  <Download className="w-3 h-3" /> Export
                </button>
                <button
                  type="button"
                  onClick={() => setShowImport(!showImport)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                >
                  <Upload className="w-3 h-3" /> Import
                </button>
              </div>

              {showImport && (
                <div className="space-y-3">
                  <textarea
                    className="w-full glass-panel rounded-xl p-4 text-[10px] font-mono text-zinc-400 outline-none h-24 resize-none"
                    placeholder='{"theme": "royal-gold", "graphics": "cinematic", "typography": "luxury"}'
                    value={importJson}
                    onChange={e => setImportJson(e.target.value)}
                  />
                  <p className="text-[9px] text-zinc-600 uppercase tracking-widest px-1">
                    Imported presets will appear in Preview. Click Apply to commit.
                  </p>
                  <button
                    type="button"
                    onClick={handleImport}
                    className="w-full py-3 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                  >
                    Load into Preview
                  </button>
                </div>
              )}
            </>
          ) : (
            /* ── Custom Theme Builder ──────────────────────────────────── */
            <div className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Theme Name</label>
                <input
                  type="text"
                  value={builderState.name}
                  onChange={e => setBuilderState(p => ({ ...p, name: e.target.value }))}
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
                      onChange={e => setBuilderState(p => ({ ...p, primaryColor: e.target.value }))}
                      className="w-10 h-10 bg-transparent border-none rounded cursor-pointer"
                    />
                    <span className="text-xs font-mono text-zinc-400 uppercase">{builderState.primaryColor}</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Card BG</label>
                  <input
                    type="text"
                    value={builderState.cardBackground}
                    onChange={e => setBuilderState(p => ({ ...p, cardBackground: e.target.value }))}
                    className="w-full glass-panel rounded-xl p-3 text-xs font-mono text-white outline-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Border Color</label>
                  <input
                    type="text"
                    value={builderState.borderColor}
                    onChange={e => setBuilderState(p => ({ ...p, borderColor: e.target.value }))}
                    className="w-full glass-panel rounded-xl p-3 text-xs font-mono text-white outline-none"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Card Radius</label>
                  <select
                    value={builderState.cardRadius}
                    onChange={e => setBuilderState(p => ({ ...p, cardRadius: e.target.value }))}
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
                    onChange={e => setBuilderState(p => ({ ...p, blurIntensity: e.target.value }))}
                    className="w-full glass-panel rounded-xl p-3 text-xs font-bold text-white outline-none"
                  >
                    <option value="0px">None</option>
                    <option value="10px">10px (Light)</option>
                    <option value="20px">20px (Standard)</option>
                    <option value="40px">40px (Heavy)</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Graphics Style</label>
                  <select
                    value={builderState.graphics || 'classic'}
                    onChange={e => setBuilderState(p => ({ ...p, graphics: e.target.value }))}
                    className="w-full glass-panel rounded-xl p-3 text-xs font-bold text-white outline-none"
                  >
                    {GRAPHICS_PRESETS.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Typography</label>
                  <select
                    value={builderState.typography || 'executive'}
                    onChange={e => setBuilderState(p => ({ ...p, typography: e.target.value }))}
                    className="w-full glass-panel rounded-xl p-3 text-xs font-bold text-white outline-none"
                  >
                    {TYPOGRAPHY_PRESETS.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleSaveCustomTheme}
                className="w-full py-4 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 mt-4 transition-all"
              >
                <Plus className="w-4 h-4" /> Save to Preview
              </button>
            </div>
          )}

          {/* ── Apply / Discard Action Bar ────────────────────────────── */}
          <div className={`pt-4 border-t border-white/5 space-y-3 transition-all ${hasUnappliedChanges ? 'opacity-100' : 'opacity-40'}`}>
            {hasUnappliedChanges && (
              <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" />
                Preview active — live application unchanged
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDiscardPreview}
                disabled={!hasUnappliedChanges}
                className="flex-1 py-3.5 bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-3 h-3" /> Discard
              </button>
              <button
                type="button"
                onClick={handleApplyTheme}
                disabled={!hasUnappliedChanges}
                className={`flex-[2] py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg disabled:cursor-not-allowed ${
                  applySuccess
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-black hover:bg-zinc-100 active:scale-[0.98]'
                } disabled:opacity-50`}
              >
                {applySuccess ? (
                  <><CheckCircle2 className="w-4 h-4" /> Theme Applied!</>
                ) : (
                  <><Sliders className="w-3 h-3" /> Apply Theme</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* ── Right Col: Live Preview ──────────────────────────────────── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Eye className="w-3 h-3" />
              {hasUnappliedChanges ? 'Preview (Staging)' : 'Live Render Preview'}
            </label>
            {hasUnappliedChanges && (
              <span className="text-[8px] font-black uppercase tracking-widest text-amber-500 px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                Unsaved Changes
              </span>
            )}
          </div>
          <ThemePreview
            themeId={previewThemeId}
            graphicsId={previewGraphics}
            typographyId={previewTypography}
            customThemes={previewCustomThemes}
          />
          {hasUnappliedChanges && (
            <p className="text-[9px] text-zinc-600 uppercase tracking-widest text-center px-4">
              The application portal is not yet updated. Click <span className="text-white font-bold">Apply Theme</span> to commit.
            </p>
          )}
        </div>

      </div>
    </div>
  );
};
