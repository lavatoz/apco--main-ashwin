/**
 * ThemePreview — completely self-contained preview widget.
 *
 * IMPORTANT: This component deliberately does NOT call applyTheme() or touch
 * document.documentElement / document.body. Doing so would immediately change
 * the live application while the user is still browsing presets.
 *
 * All theme variables are computed inline and applied via the container's
 * `style` attribute so the preview is fully isolated.
 */
import React, { useMemo, useEffect } from 'react';
import { THEME_PRESETS, TYPOGRAPHY_PRESETS } from '../../utils/themeEngine';
import type { CustomThemeConfig } from '../../types';
import {
  Activity, Briefcase, Calendar, CheckSquare,
  Settings as Gear, Shield, User
} from 'lucide-react';

interface ThemePreviewProps {
  themeId: string;
  graphicsId: string;
  typographyId: string;
  customThemes: CustomThemeConfig[];
}

interface ThemeVars {
  primary: string;
  bg: string;
  cardBg: string;
  border: string;
  text: string;
  textMuted: string;
  radius: string;
  blur: string;
  font: string;
  cardShadow: string;
  glow: string;
}

// Compute theme values from presets without touching the DOM
function resolveThemeVars(
  themeId: string,
  graphicsId: string,
  typographyId: string,
  customThemes: CustomThemeConfig[]
): ThemeVars {
  const typo = TYPOGRAPHY_PRESETS.find(t => t.id === typographyId) || TYPOGRAPHY_PRESETS[0];

  // Base defaults (artisans-noir)
  let primary = '#3b82f6';
  let bg = '#000000';
  let cardBg = 'rgba(255,255,255,0.03)';
  let border = 'rgba(255,255,255,0.06)';
  let text = '#ffffff';
  let textMuted = '#71717a';
  let radius = '1rem';
  let blur = 'blur(20px)';

  switch (themeId) {
    case 'artisans-noir':
      break;
    case 'royal-gold':
      primary = '#D4AF37'; bg = '#0f0e0c'; border = 'rgba(212,175,55,0.2)';
      cardBg = 'rgba(20,18,15,0.6)'; text = '#fdfbf7';
      break;
    case 'sapphire-executive':
      primary = '#0F52BA'; bg = '#020d24'; border = 'rgba(15,82,186,0.25)';
      cardBg = 'rgba(5,15,40,0.7)'; text = '#e6f0ff';
      break;
    case 'emerald-estate':
      primary = '#50C878'; bg = '#011208'; border = 'rgba(80,200,120,0.2)';
      cardBg = 'rgba(2,25,12,0.6)'; text = '#e8fdf0';
      break;
    case 'crimson-prestige':
      primary = '#C21807'; bg = '#140002'; border = 'rgba(194,24,7,0.25)';
      cardBg = 'rgba(30,2,5,0.7)'; text = '#ffe6e6';
      break;
    case 'violet-luxe':
      primary = '#8A2BE2'; bg = '#0d001a'; border = 'rgba(138,43,226,0.25)';
      cardBg = 'rgba(20,0,40,0.7)'; text = '#f3e6ff';
      break;
    case 'tiny-toes-pastel':
      primary = '#FFB7B2'; bg = '#FFFafb'; cardBg = '#FFFFFF';
      border = 'rgba(255,183,178,0.4)'; text = '#4a4a4a';
      textMuted = '#9ba3af'; radius = '2rem'; blur = 'none';
      break;
    case 'ivory-editorial':
      primary = '#2C3E50'; bg = '#F4F1EA'; cardBg = '#FFFFFF';
      border = 'rgba(44,62,80,0.1)'; text = '#1c1a17';
      textMuted = '#6e6b66'; radius = '0px'; blur = 'none';
      break;
    case 'signature-monochrome':
      primary = '#FFFFFF'; bg = '#000000';
      border = 'rgba(255,255,255,0.3)'; cardBg = 'rgba(255,255,255,0.05)';
      break;
    default:
      if (themeId.startsWith('custom_')) {
        const custom = customThemes.find(c => c.id === themeId);
        if (custom) {
          primary = custom.primaryColor;
          cardBg = custom.cardBackground;
          border = custom.borderColor;
          radius = custom.cardRadius;
          blur = `blur(${custom.blurIntensity})`;
        }
      }
  }

  // Graphics overrides
  let cardShadow = 'none';
  let glow = 'none';

  switch (graphicsId) {
    case 'classic':
      break;

    case 'glassmorphism':
      blur = 'blur(40px) saturate(180%)';
      cardBg = 'rgba(255, 255, 255, 0.06)';
      border = 'rgba(255, 255, 255, 0.15)';
      cardShadow = '0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.1)';
      break;

    case 'luxury-grain':
      blur = 'blur(12px) saturate(120%)';
      cardBg = 'rgba(255, 255, 255, 0.02)';
      border = 'rgba(255, 255, 255, 0.06)';
      cardShadow = '0 4px 24px rgba(0,0,0,0.4)';
      break;

    case 'cinematic':
      blur = 'blur(24px) saturate(140%)';
      cardBg = 'rgba(0, 0, 0, 0.4)';
      border = 'rgba(255, 255, 255, 0.08)';
      cardShadow = '0 20px 60px rgba(0,0,0,0.6), 0 0 80px rgba(0,0,0,0.3)';
      break;

    case 'editorial':
      blur = 'none';
      cardBg = 'rgba(255, 255, 255, 0.03)';
      border = 'rgba(255, 255, 255, 0.12)';
      radius = '0px';
      cardShadow = '0 1px 0 rgba(255,255,255,0.05)';
      break;

    case 'neon-pulse':
      blur = 'blur(30px) saturate(200%)';
      cardBg = 'rgba(0, 0, 0, 0.5)';
      border = `${primary}40`;
      cardShadow = `0 0 30px ${primary}20, 0 0 60px ${primary}10`;
      glow = `0 0 40px ${primary}30, 0 0 80px ${primary}15`;
      break;

    case 'marble-luxury':
      blur = 'blur(16px) saturate(110%)';
      cardBg = 'rgba(255, 255, 255, 0.04)';
      border = 'rgba(255, 255, 255, 0.1)';
      cardShadow = '0 8px 40px rgba(0,0,0,0.3), inset 0 0.5px 0 rgba(255,255,255,0.08)';
      break;

    case 'aurora':
      blur = 'blur(30px) saturate(160%)';
      cardBg = 'rgba(0, 0, 0, 0.3)';
      border = 'rgba(255, 255, 255, 0.08)';
      cardShadow = '0 12px 48px rgba(0,0,0,0.4)';
      glow = `0 0 120px ${primary}20`;
      break;
  }

  return { primary, bg, cardBg, border, text, textMuted, radius, blur, font: typo.family, cardShadow, glow };
}

export const ThemePreview: React.FC<ThemePreviewProps> = ({
  themeId,
  graphicsId,
  typographyId,
  customThemes,
}) => {
  const vars = useMemo(
    () => resolveThemeVars(themeId, graphicsId, typographyId, customThemes),
    [themeId, graphicsId, typographyId, customThemes]
  );

  const { primary, bg, cardBg, border, textMuted, radius, text, font, blur, cardShadow, glow } = vars;

  // Dynamically load the preview font so it renders correctly
  useEffect(() => {
    const typoPreset = TYPOGRAPHY_PRESETS.find(t => t.id === typographyId) || TYPOGRAPHY_PRESETS[0];
    if (typoPreset.url) {
      const linkId = `font-${typoPreset.id}`;
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = typoPreset.url;
        document.head.appendChild(link);
      }
    }
  }, [typographyId]);

  const containerStyle: React.CSSProperties = {
    backgroundColor: bg,
    color: text,
    fontFamily: font,
  };

  // Derived helpers
  const cardStyle: React.CSSProperties = {
    backgroundColor: cardBg,
    border: `1px solid ${border}`,
    borderRadius: radius,
    padding: '1rem',
    boxShadow: cardShadow,
    backdropFilter: blur,
    WebkitBackdropFilter: blur,
  };

  const activeNavStyle: React.CSSProperties = {
    backgroundColor: `${primary}18`,
    border: `1px solid ${primary}30`,
    borderRadius: '0.75rem',
    color: primary,
    padding: '0.6rem 0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    boxShadow: glow !== 'none' ? glow : undefined,
  };

  const mutedNavStyle: React.CSSProperties = {
    color: textMuted,
    padding: '0.6rem 0.75rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    borderRadius: '0.75rem',
  };

  const buttonStyle: React.CSSProperties = {
    backgroundColor: primary,
    color: '#fff',
    border: 'none',
    borderRadius: radius,
    padding: '0.4rem 0.9rem',
    fontWeight: 800,
    fontSize: '0.65rem',
    textTransform: 'uppercase',
    letterSpacing: '0.12em',
    cursor: 'default',
    boxShadow: glow !== 'none' ? glow : undefined,
  };

  const typoPreset = TYPOGRAPHY_PRESETS.find(t => t.id === typographyId) || TYPOGRAPHY_PRESETS[0];
  const themePreset = THEME_PRESETS.find(t => t.id === themeId);

  return (
    <div
      style={containerStyle}
      className="theme-preview-container w-full rounded-[2rem] overflow-hidden border shadow-2xl transition-all relative min-h-[400px]"
      data-graphics={graphicsId}
    >
      {/* Header bar */}
      <div
        style={{
          borderBottom: `1px solid ${border}`,
          padding: '1rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div
            style={{
              width: 28, height: 28, borderRadius: '0.5rem',
              backgroundColor: primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Shield style={{ width: 14, height: 14, color: '#fff' }} />
          </div>
          <span style={{ fontWeight: 900, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', fontFamily: font }}>
            ArtisansOS
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span style={{ fontSize: '0.6rem', color: textMuted, textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>
            Admin Portal
          </span>
          <div style={{ width: 20, height: 20, borderRadius: '50%', backgroundColor: `${primary}20`, border: `1px solid ${border}` }} />
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>

        {/* Sidebar mock */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          <div style={activeNavStyle}>
            <Activity style={{ width: 13, height: 13, color: primary }} />
            <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.13em' }}>Dashboard</span>
          </div>
          <div style={mutedNavStyle}>
            <Briefcase style={{ width: 13, height: 13 }} />
            <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.13em' }}>Clients</span>
          </div>
          <div style={mutedNavStyle}>
            <User style={{ width: 13, height: 13 }} />
            <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.13em' }}>Projects</span>
          </div>
          <div style={mutedNavStyle}>
            <Gear style={{ width: 13, height: 13 }} />
            <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.13em' }}>Settings</span>
          </div>
        </div>

        {/* Main content mock */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* Page heading */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h2 style={{ fontWeight: 900, fontSize: '1.15rem', textTransform: 'uppercase', letterSpacing: '-0.02em', margin: 0, fontFamily: font }}>
                Overview
              </h2>
              <p style={{ fontSize: '0.6rem', color: textMuted, textTransform: 'uppercase', letterSpacing: '0.15em', marginTop: 2, fontWeight: 700 }}>
                Live metrics preview
              </p>
            </div>
            <button style={buttonStyle}>New Project</button>
          </div>

          {/* KPI cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.58rem', color: textMuted, textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>Revenue</span>
                <Activity style={{ width: 12, height: 12, color: primary }} />
              </div>
              <p style={{ fontWeight: 900, fontSize: '1rem', margin: 0, color: text, fontFamily: font }}>₹4.2M</p>
            </div>
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.58rem', color: textMuted, textTransform: 'uppercase', letterSpacing: '0.15em', fontWeight: 700 }}>Tasks</span>
                <CheckSquare style={{ width: 12, height: 12, color: '#f59e0b' }} />
              </div>
              <p style={{ fontWeight: 900, fontSize: '1rem', margin: 0, color: text, fontFamily: font }}>12 Pending</p>
            </div>
          </div>

          {/* Activity feed */}
          <div style={cardStyle}>
            <p style={{ fontSize: '0.6rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', borderBottom: `1px solid ${border}`, paddingBottom: '0.5rem', marginBottom: '0.65rem', color: text }}>
              Recent Activity
            </p>
            {[
              { icon: Calendar, label: 'Client Meeting Scheduled', time: '2 hours ago' },
              { icon: Gear, label: 'Theme Settings Updated', time: 'Just now' },
            ].map(({ icon: Icon, label, time }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: i === 0 ? '0.6rem' : 0 }}>
                <div style={{
                  width: 26, height: 26, borderRadius: '50%',
                  backgroundColor: cardBg, border: `1px solid ${border}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Icon style={{ width: 11, height: 11, color: textMuted }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.7rem', margin: 0, color: text, fontFamily: font }}>{label}</p>
                  <p style={{ fontSize: '0.58rem', color: textMuted, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700, margin: 0 }}>{time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Active preset labels */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: '0.5rem 1rem',
        display: 'flex', gap: '0.5rem', flexWrap: 'wrap',
        backgroundColor: `${bg}cc`,
        borderTop: `1px solid ${border}`,
      }}>
        {[
          { label: themePreset?.name || themeId },
          { label: typoPreset.name + ' type' },
          { label: graphicsId },
        ].map(({ label }) => (
          <span key={label} style={{
            fontSize: '0.55rem', fontWeight: 900, textTransform: 'uppercase',
            letterSpacing: '0.15em', color: primary,
            backgroundColor: `${primary}15`,
            border: `1px solid ${primary}30`,
            borderRadius: '2rem', padding: '0.18rem 0.55rem',
          }}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};
