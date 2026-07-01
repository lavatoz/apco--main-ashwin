import { useState, useEffect } from 'react';
import { type CompanyProfile, type Client, type GlobalSettings } from '../types';
import { api, getAccessToken } from '../services/api';
import { getAuthUser } from '../utils/storage';

const DEFAULT_GLOBAL: GlobalSettings = {
  pdfOwnerPassword: 'Artisans@2026',
  pdfWatermarkEnabled: true,
  pdfQrEnabled: true,
  pdfHashEnabled: true,
  pdfSecureRenderEnabled: false,
  pdfVerifyLinkEnabled: true,
  pdfSecretSalt: `SALT_${Math.random().toString(36).substring(2, 15).toUpperCase()}`,
  customThemes: []
};

const DEFAULT_COMPANIES: CompanyProfile[] = [
  {
    id: 'comp_1',
    companyName: 'Aaha Kalyanam',
    tagline: 'Weddings That Tell Your Story',
    projectType: 'AAHA KALYANAM',
    logo: '',
    email: 'hello@aahakalyanam.com',
    phone: '9876543210',
    address: 'Creative Avenue, Kochi, Kerala',
    gstin: '32AAAAA0000A1Z5',
    pan: '',
    website: 'https://www.aahakalyanam.com',
    invoicePrefix: 'AK',
    upiId: 'aahakalyanam@okaxis',
    bankDetails: { accountName: 'AAHA KALYANAM', accountNumber: '921000000000', ifsc: 'UTIB0001234', bankName: 'Axis Bank' },
    paymentTerms: '50% Advance, 50% on Delivery',
    invoiceNotes: 'Thank you for choosing Aaha Kalyanam Productions.',
    primaryColor: '#783d0c',
    themePreset: 'classic',
    graphicsPreset: 'luxury-grain',
    typographyPreset: 'luxury',
    portalConfig: { clientPortal: true, staffPortal: true, publicBooking: true, productionWorkflow: true, revenueModule: true, marketingHub: true },
    isDefault: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'comp_2',
    companyName: 'Tiny Toes',
    tagline: 'Capturing Tiny Moments',
    projectType: 'TINY TOES',
    logo: '',
    email: 'studios@tinytoes.com',
    phone: '9876543211',
    address: 'Creative Avenue, Kochi, Kerala',
    gstin: '32BBBBB0000B1Z5',
    pan: '',
    website: 'https://www.tinytoes.com',
    invoicePrefix: 'TT',
    upiId: 'tinytoes@okicici',
    bankDetails: { accountName: 'TINY TOES STUDIOS', accountNumber: '501000000000', ifsc: 'ICIC0005678', bankName: 'ICICI Bank' },
    paymentTerms: 'Due on Receipt',
    invoiceNotes: 'Thank you for choosing Tiny Toes Studios.',
    primaryColor: '#3b82f6',
    themePreset: 'tiny-toes-pastel',
    graphicsPreset: 'editorial',
    typographyPreset: 'elegant-serif',
    portalConfig: { clientPortal: true, staffPortal: true, publicBooking: true, productionWorkflow: true, revenueModule: true, marketingHub: true },
    isDefault: false,
    createdAt: new Date().toISOString()
  }
];

// Module-level cache to share settings state across all active hook instances
let cachedCompanies: CompanyProfile[] | null = null;
let cachedGlobalSettings: GlobalSettings | null = null;
let hydrated = false;
let hydrationPromise: Promise<void> | null = null;
const listeners = new Set<() => void>();

const addListener = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const notifyListeners = () => {
  listeners.forEach(l => l());
};

export const clearCompanySettingsCache = () => {
  cachedCompanies = null;
  cachedGlobalSettings = null;
  hydrated = false;
  hydrationPromise = null;
  localStorage.removeItem('artisans_companies');
  localStorage.removeItem('artisans_global_settings');
  notifyListeners();
};

export const useCompanySettings = () => {
  const [companies, setCompaniesState] = useState<CompanyProfile[]>(() => {
    if (cachedCompanies) return cachedCompanies;
    const stored = localStorage.getItem('artisans_companies');
    if (stored) {
      try {
        cachedCompanies = JSON.parse(stored);
        return cachedCompanies!;
      } catch {
        // fallback if parse fails
      }
    }
    cachedCompanies = DEFAULT_COMPANIES;
    localStorage.setItem('artisans_companies', JSON.stringify(DEFAULT_COMPANIES));
    return DEFAULT_COMPANIES;
  });

  const [globalSettings, setGlobalSettingsState] = useState<GlobalSettings>(() => {
    if (cachedGlobalSettings) return cachedGlobalSettings;
    const stored = localStorage.getItem('artisans_global_settings');
    if (stored) {
      try {
        cachedGlobalSettings = JSON.parse(stored);
        return cachedGlobalSettings!;
      } catch {
        // fallback if parse fails
      }
    }
    cachedGlobalSettings = DEFAULT_GLOBAL;
    localStorage.setItem('artisans_global_settings', JSON.stringify(DEFAULT_GLOBAL));
    return DEFAULT_GLOBAL;
  });

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('All');

  const tokenExists = !!getAccessToken();

  // Synchronize internal component state when cache updates
  useEffect(() => {
    const handleUpdate = () => {
      setCompaniesState(cachedCompanies ? [...cachedCompanies] : DEFAULT_COMPANIES);
      setGlobalSettingsState(cachedGlobalSettings ? { ...cachedGlobalSettings } : DEFAULT_GLOBAL);
    };
    return addListener(handleUpdate);
  }, []);

  // Asynchronous background hydration from backend on component mount or token status changes
  useEffect(() => {
    if (!tokenExists) {
      hydrated = false;
      return;
    }
    if (hydrated) return;
    let active = true;

    const hydrate = async () => {
      // Re-use active promise if hydration is already in progress
      if (hydrationPromise) {
        try {
          await hydrationPromise;
        } catch {
          // ignore error to let subsequent attempts run if needed
        }
        return;
      }

      hydrationPromise = (async () => {
        try {
          const [backendCompanies, backendGlobal] = await Promise.all([
            api.getCompanies(),
            api.getGlobalSettings()
          ]);

          if (!active) return;

          let changed = false;
          const authUser = getAuthUser();
          const isAdmin = authUser && authUser.role === 'Admin';

          // Handle companies list
          if (backendCompanies && Array.isArray(backendCompanies)) {
            if (backendCompanies.length > 0) {
              const currentStr = JSON.stringify(cachedCompanies);
              const backendStr = JSON.stringify(backendCompanies);
              if (currentStr !== backendStr) {
                cachedCompanies = backendCompanies;
                localStorage.setItem('artisans_companies', backendStr);
                changed = true;
              }
            } else if (isAdmin) {
              // Seed empty backend with initial defaults (Only for authorized Admin role)
              const toSeed = cachedCompanies || DEFAULT_COMPANIES;
              for (const comp of toSeed) {
                await api.saveCompany(comp.id, comp);
              }
              const fresh = await api.getCompanies();
              cachedCompanies = fresh;
              localStorage.setItem('artisans_companies', JSON.stringify(fresh));
              changed = true;
            }
          }

          // Handle global settings
          if (backendGlobal) {
            const hasKeys = Object.keys(backendGlobal).length > 0;
            if (hasKeys) {
              const currentStr = JSON.stringify(cachedGlobalSettings);
              const backendStr = JSON.stringify(backendGlobal);
              if (currentStr !== backendStr) {
                cachedGlobalSettings = backendGlobal;
                localStorage.setItem('artisans_global_settings', backendStr);
                changed = true;
              }
            } else if (isAdmin) {
              // Seed empty global settings (Only for authorized Admin role)
              const toSeed = cachedGlobalSettings || DEFAULT_GLOBAL;
              await api.saveGlobalSettings(toSeed);
              const fresh = await api.getGlobalSettings();
              cachedGlobalSettings = fresh;
              localStorage.setItem('artisans_global_settings', JSON.stringify(fresh));
              changed = true;
            }
          }

          hydrated = true;
          if (changed) {
            notifyListeners();
          }
        } catch (err) {
          console.warn("Failed to asynchronously hydrate settings from backend:", err);
          // Set hydrated = true on failure to prevent infinite request retries on permission/network error
          hydrated = true;
        }
      })();

      try {
        await hydrationPromise;
      } finally {
        hydrationPromise = null;
      }
    };

    hydrate();
    return () => { active = false; };
  }, [tokenExists]);

  const saveCompanies = async (updated: CompanyProfile[]) => {
    const previous = cachedCompanies || companies;
    cachedCompanies = updated;
    localStorage.setItem('artisans_companies', JSON.stringify(updated));
    setCompaniesState([...updated]);
    notifyListeners();

    // Sync the default company logo as the "global" logo for sidebar fallback if none selected
    const def = updated.find(c => c.isDefault) || updated[0];
    if (def && def.logo) {
      localStorage.setItem('artisans_company_logo', def.logo);
    }

    // Persist changes and deletions to backend
    try {
      // Find deleted companies (present in previous but absent in updated)
      const deletedIds = previous
        .filter(prev => !updated.some(upd => upd.id === prev.id))
        .map(prev => prev.id);

      for (const id of deletedIds) {
        await api.deleteCompany(id);
      }

      // Save or create updated companies
      for (const comp of updated) {
        await api.saveCompany(comp.id, comp);
      }
    } catch (err) {
      console.error("Failed to save company settings to backend:", err);
    }
  };

  const saveGlobalSettings = async (updated: GlobalSettings) => {
    cachedGlobalSettings = updated;
    localStorage.setItem('artisans_global_settings', JSON.stringify(updated));
    setGlobalSettingsState({ ...updated });
    notifyListeners();

    // Persist changes to backend settings service
    try {
      await api.saveGlobalSettings(updated);
    } catch (err) {
      console.error("Failed to save global settings to backend:", err);
    }
  };

  const defaultCompany = companies.find(c => c.isDefault) || companies[0] || DEFAULT_COMPANIES[0];

  // settings behaves like the single source of truth for components that haven't been updated yet
  const settings = (selectedCompanyId === 'All'
    ? defaultCompany
    : (companies.find(c => c.id === selectedCompanyId) || defaultCompany)) || DEFAULT_COMPANIES[0];

  return {
    companies,
    saveCompanies,
    settings,
    defaultCompany,
    setSelectedCompanyId,
    selectedCompanyId,
    globalSettings,
    saveGlobalSettings
  };
};

export const useCompanyForClient = (client: Client | null) => {
  const { companies, defaultCompany } = useCompanySettings();
  if (!client) return defaultCompany;

  // Match by project type or brand (case insensitive)
  const clientType = (client.projectType || client.brand || '').toUpperCase();

  const matched = companies.find(c =>
    c.projectType.toUpperCase() === clientType
  );

  return matched || defaultCompany;
};
