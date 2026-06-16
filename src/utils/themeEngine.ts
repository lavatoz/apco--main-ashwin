import type { CustomThemeConfig } from '../types';

const hexToRgb = (hex: string) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(result[3], 16)}` : '59 130 246';
};

export const THEME_PRESETS = [
  { id: 'artisans-noir', name: 'Artisans Noir (Default)', type: 'dark' },
  { id: 'royal-gold', name: 'Royal Gold', type: 'dark' },
  { id: 'sapphire-executive', name: 'Sapphire Executive', type: 'dark' },
  { id: 'emerald-estate', name: 'Emerald Estate', type: 'dark' },
  { id: 'crimson-prestige', name: 'Crimson Prestige', type: 'dark' },
  { id: 'violet-luxe', name: 'Violet Luxe', type: 'dark' },
  { id: 'tiny-toes-pastel', name: 'Tiny Toes Pastel', type: 'light' },
  { id: 'ivory-editorial', name: 'Ivory Editorial', type: 'light' },
  { id: 'signature-monochrome', name: 'Signature Monochrome', type: 'dark' }
];

export const GRAPHICS_PRESETS = [
  { id: 'classic', name: 'Classic' },
  { id: 'glassmorphism', name: 'Glassmorphism' },
  { id: 'luxury-grain', name: 'Luxury Grain' },
  { id: 'cinematic', name: 'Cinematic' },
  { id: 'editorial', name: 'Editorial' },
  { id: 'neon-pulse', name: 'Neon Pulse' },
  { id: 'marble-luxury', name: 'Marble Luxury' },
  { id: 'aurora', name: 'Aurora' }
];

export const TYPOGRAPHY_PRESETS = [
  { id: 'executive', name: 'Executive', family: 'Inter', url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap' },
  { id: 'luxury', name: 'Luxury', family: '"Playfair Display", Inter', url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;900&display=swap' },
  { id: 'editorial', name: 'Editorial', family: '"Cormorant Garamond", serif', url: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400&display=swap' },
  { id: 'modern', name: 'Modern', family: '"Space Grotesk", sans-serif', url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&display=swap' },
  { id: 'premium-bold', name: 'Premium Bold', family: '"Bebas Neue", sans-serif', url: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap' },
  { id: 'elegant-serif', name: 'Elegant Serif', family: '"DM Serif Display", serif', url: 'https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap' }
];

export const applyTheme = (
  themeId: string, 
  graphicsId: string, 
  typographyId: string, 
  customThemes: CustomThemeConfig[] = [],
  containerId?: string // Optional: restrict application to a specific container for Live Preview
) => {
  const root = containerId ? document.getElementById(containerId) : document.documentElement;
  if (!root) return;

  // 1. Typography
  const typo = TYPOGRAPHY_PRESETS.find(t => t.id === typographyId) || TYPOGRAPHY_PRESETS[0];
  
  // Dynamic font loading
  if (typo.url) {
    const linkId = `font-${typo.id}`;
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = typo.url;
      document.head.appendChild(link);
    }
  }
  
  root.style.setProperty('--theme-font-family', typo.family);

  // 2. Base Theme Properties
  let primary = '#3b82f6';
  let bg = '#000000';
  let cardBg = 'rgba(255, 255, 255, 0.01)';
  let border = 'rgba(255, 255, 255, 0.05)';
  let text = '#ffffff';
  let textMuted = '#71717a'; // zinc-500
  let radius = '1rem';
  let blur = 'blur(20px)';

  if (themeId === 'artisans-noir') {
    // Keep exactly as is
  } else if (themeId === 'royal-gold') {
    primary = '#D4AF37';
    bg = '#0f0e0c'; // Very dark warm grey
    border = 'rgba(212, 175, 55, 0.2)';
    cardBg = 'rgba(20, 18, 15, 0.6)';
    text = '#fdfbf7';
  } else if (themeId === 'sapphire-executive') {
    primary = '#0F52BA';
    bg = '#020d24'; // Deep navy
    border = 'rgba(15, 82, 186, 0.25)';
    cardBg = 'rgba(5, 15, 40, 0.7)';
    text = '#e6f0ff';
  } else if (themeId === 'emerald-estate') {
    primary = '#50C878';
    bg = '#011208'; // Deep forest green
    border = 'rgba(80, 200, 120, 0.2)';
    cardBg = 'rgba(2, 25, 12, 0.6)';
    text = '#e8fdf0';
  } else if (themeId === 'crimson-prestige') {
    primary = '#C21807';
    bg = '#140002'; // Deep burgundy
    border = 'rgba(194, 24, 7, 0.25)';
    cardBg = 'rgba(30, 2, 5, 0.7)';
    text = '#ffe6e6';
  } else if (themeId === 'violet-luxe') {
    primary = '#8A2BE2';
    bg = '#0d001a'; // Deep violet
    border = 'rgba(138, 43, 226, 0.25)';
    cardBg = 'rgba(20, 0, 40, 0.7)';
    text = '#f3e6ff';
  } else if (themeId === 'tiny-toes-pastel') {
    primary = '#FFB7B2'; // Soft pastel pink
    bg = '#FFFafb'; // Very light pastel bg
    cardBg = '#FFFFFF';
    border = 'rgba(255, 183, 178, 0.4)';
    text = '#4a4a4a';
    textMuted = '#9ba3af';
    radius = '2rem'; // Extra rounded
    blur = 'none'; // Flat design for pastel
  } else if (themeId === 'ivory-editorial') {
    primary = '#2C3E50';
    bg = '#F4F1EA'; // Warm ivory
    cardBg = '#FFFFFF';
    border = 'rgba(44, 62, 80, 0.1)';
    text = '#1c1a17';
    textMuted = '#6e6b66';
    radius = '0px'; // Sharp edges for editorial
    blur = 'none';
  } else if (themeId === 'signature-monochrome') {
    primary = '#FFFFFF';
    bg = '#000000';
    border = 'rgba(255, 255, 255, 0.3)';
    cardBg = 'rgba(255, 255, 255, 0.05)';
  } else if (themeId.startsWith('custom_')) {
    const custom = customThemes.find(c => c.id === themeId);
    if (custom) {
      primary = custom.primaryColor;
      cardBg = custom.cardBackground;
      border = custom.borderColor;
      radius = custom.cardRadius;
      blur = `blur(${custom.blurIntensity})`;
    }
  }

  // 3. Graphics Preset Overrides — each preset gets a distinct visual treatment
  let cardShadow = 'none';
  let glow = 'none';

  switch (graphicsId) {
    case 'classic':
      // Default — no overrides
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
  
  // Set Dataset for Graphics Mode so CSS can target it (body[data-graphics="..."])
  if (!containerId) {
    document.body.dataset.graphics = graphicsId;
    document.body.dataset.themeType = bg.toLowerCase() === '#000000' || bg.toLowerCase().startsWith('#0') ? 'dark' : 'light';
  } else {
    root.setAttribute('data-graphics', graphicsId);
    root.setAttribute('data-theme-type', bg.toLowerCase() === '#000000' || bg.toLowerCase().startsWith('#0') ? 'dark' : 'light');
  }

  root.style.setProperty('--theme-primary', primary);
  root.style.setProperty('--theme-bg', bg);
  root.style.setProperty('--theme-card-bg', cardBg);
  root.style.setProperty('--theme-border', border);
  root.style.setProperty('--theme-text', text);
  root.style.setProperty('--theme-text-muted', textMuted);
  root.style.setProperty('--theme-radius', radius);
  root.style.setProperty('--theme-blur', blur);

  // Apply to primary color specific classes
  // We're redefining the --primary-color variable as well so legacy components using it still work
  root.style.setProperty('--primary-color', primary);
  root.style.setProperty('--primary-color-rgb', hexToRgb(primary));

  // Graphics-specific CSS variables
  root.style.setProperty('--theme-card-shadow', cardShadow);
  root.style.setProperty('--theme-glow', glow);
};
