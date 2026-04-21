import { useState } from 'react';
import { type CompanyProfile, type Client, type GlobalSettings } from '../types';

const DEFAULT_GLOBAL: GlobalSettings = {
  pdfOwnerPassword: 'Artisans@2026',
  pdfWatermarkEnabled: true,
  pdfQrEnabled: true,
  pdfHashEnabled: true,
  pdfSecureRenderEnabled: false,
  pdfSecretSalt: `SALT_${Math.random().toString(36).substring(2, 15).toUpperCase()}`
};

const DEFAULT_COMPANIES: CompanyProfile[] = [
  {
    id: 'comp_1',
    companyName: 'Aaha Kalyanam',
    tagline: 'Weddings That Tell Your Story',
    projectType: 'AAHA KALYANAM',
    logo: '', 
    email: 'hello@aahakalyanam.com',
    phone: '',
    address: 'Creative Avenue, Kochi, Kerala',
    gstin: '32AAAAA0000A1Z5',
    pan: '',
    website: 'www.aahakalyanam.com',
    invoicePrefix: 'AK',
    upiId: 'aahakalyanam@okaxis',
    bankDetails: { accountName: 'AAHA KALYANAM', accountNumber: '921000000000', ifsc: 'UTIB0001234', bankName: 'Axis Bank' },
    paymentTerms: '50% Advance, 50% on Delivery',
    invoiceNotes: 'Thank you for choosing Aaha Kalyanam Productions.',
    primaryColor: '#d946ef',
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
    phone: '',
    address: 'Creative Avenue, Kochi, Kerala',
    gstin: '32BBBBB0000B1Z5',
    pan: '',
    website: 'www.tinytoes.com',
    invoicePrefix: 'TT',
    upiId: 'tinytoes@okicici',
    bankDetails: { accountName: 'TINY TOES STUDIOS', accountNumber: '501000000000', ifsc: 'ICIC0005678', bankName: 'ICICI Bank' },
    paymentTerms: 'Due on Receipt',
    invoiceNotes: 'Thank you for choosing Tiny Toes Studios.',
    primaryColor: '#3b82f6',
    isDefault: false,
    createdAt: new Date().toISOString()
  }
];

export const useCompanySettings = () => {
  const [companies, setCompanies] = useState<CompanyProfile[]>(() => {
    const stored = localStorage.getItem('artisans_companies');
    if (stored) return JSON.parse(stored);
    
    localStorage.setItem('artisans_companies', JSON.stringify(DEFAULT_COMPANIES));
    return DEFAULT_COMPANIES;
  });

  const [globalSettings, setGlobalSettings] = useState<GlobalSettings>(() => {
    const stored = localStorage.getItem('artisans_global_settings');
    if (stored) return JSON.parse(stored);
    
    localStorage.setItem('artisans_global_settings', JSON.stringify(DEFAULT_GLOBAL));
    return DEFAULT_GLOBAL;
  });

  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('All');

  const saveCompanies = (updated: CompanyProfile[]) => {
    localStorage.setItem('artisans_companies', JSON.stringify(updated));
    setCompanies(updated);
    
    // Also sync the default company logo as the "global" logo for sidebar fallback if none selected
    const def = updated.find(c => c.isDefault) || updated[0];
    if (def.logo) {
        localStorage.setItem('artisans_company_logo', def.logo);
    }
  };

  const saveGlobalSettings = (updated: GlobalSettings) => {
    localStorage.setItem('artisans_global_settings', JSON.stringify(updated));
    setGlobalSettings(updated);
  };

  const defaultCompany = companies.find(c => c.isDefault) || companies[0];
  
  // settings behaves like the single source of truth for components that haven't been updated yet
  const settings = selectedCompanyId === 'All' 
    ? defaultCompany 
    : (companies.find(c => c.id === selectedCompanyId) || defaultCompany);

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
