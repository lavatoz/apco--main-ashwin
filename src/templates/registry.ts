import { type RegistryItem, type CustomTemplateMetadata, type DocumentType, type TemplateMetadata } from './types';
import { DefaultAgreement } from './agreements/DefaultAgreement';
import { WeddingAgreement } from './agreements/WeddingAgreement';

import { ArtisansQuote } from './quotes/ArtisansQuote';
import { AahaQuote } from './quotes/AahaQuote';
import { TinyToesQuote } from './quotes/TinyToesQuote';

import { ArtisansInvoice } from './invoices/ArtisansInvoice';
import { AahaInvoice } from './invoices/AahaInvoice';
import { TinyToesInvoice } from './invoices/TinyToesInvoice';
import { ArtisansCustomInvoice } from './invoices/ArtisansCustomInvoice';

// ─────────────────────────────────────────────────────────────────────────────
// STATIC REGISTRIES
// ─────────────────────────────────────────────────────────────────────────────

export const agreementTemplates: Record<string, RegistryItem> = {
  'default_v1': {
    metadata: { id: 'default_v1', name: 'Default Terms', description: 'Standard technical terms and conditions', version: '1.0.0', type: 'react', documentType: 'agreement' },
    component: DefaultAgreement
  },
  'wedding_v1': {
    metadata: { id: 'wedding_v1', name: 'Nuptial Agreement', description: 'Elegant serif-based template for wedding clients', version: '1.0.0', type: 'react', documentType: 'agreement' },
    component: WeddingAgreement
  },
};

export const quoteTemplates: Record<string, RegistryItem> = {
  'artisans_q_v1': {
    metadata: { id: 'artisans_q_v1', name: 'Artisans Premium', description: 'Dark, minimalist design', version: '1.0.0', type: 'react', documentType: 'quote' },
    component: ArtisansQuote
  },
  'aaha_q_v1': {
    metadata: { id: 'aaha_q_v1', name: 'Aaha Kalyanam', description: 'Warm elegant wedding design', version: '1.0.0', type: 'react', documentType: 'quote' },
    component: AahaQuote
  },
  'tinytoes_q_v1': {
    metadata: { id: 'tinytoes_q_v1', name: 'Tiny Toes', description: 'Playful soft design', version: '1.0.0', type: 'react', documentType: 'quote' },
    component: TinyToesQuote
  },
};

export const invoiceTemplates: Record<string, RegistryItem> = {
  'artisans_i_v1': {
    metadata: { id: 'artisans_i_v1', name: 'Artisans Premium', description: 'Dark, minimalist design', version: '1.0.0', type: 'react', documentType: 'invoice' },
    component: ArtisansInvoice
  },
  'artisans_custom_invoice_v1': {
    metadata: { id: 'artisans_custom_invoice_v1', name: 'Artisans Custom Design', description: 'Premium custom dark layout with textured background and Aaha calligraphy', version: '1.0.0', type: 'react', documentType: 'invoice' },
    component: ArtisansCustomInvoice
  },
  'aaha_i_v1': {
    metadata: { id: 'aaha_i_v1', name: 'Aaha Kalyanam', description: 'Warm elegant wedding design', version: '1.0.0', type: 'react', documentType: 'invoice' },
    component: AahaInvoice
  },
  'tinytoes_i_v1': {
    metadata: { id: 'tinytoes_i_v1', name: 'Tiny Toes', description: 'Playful soft design', version: '1.0.0', type: 'react', documentType: 'invoice' },
    component: TinyToesInvoice
  },
};

export const proposalTemplates: Record<string, RegistryItem> = {};

// ─────────────────────────────────────────────────────────────────────────────
// BRAND → TEMPLATE MAPPING
// Maps brand names/ids to their default template ids.
// Priority: Company Settings stored selection → brand mapping → global fallback.
// ─────────────────────────────────────────────────────────────────────────────

/** Canonical brand keyword → template id maps */
const BRAND_QUOTE_MAP: Record<string, string> = {
  aaha: 'aaha_q_v1',
  'aaha kalyanam': 'aaha_q_v1',
  tinytoes: 'tinytoes_q_v1',
  'tiny toes': 'tinytoes_q_v1',
  artisans: 'artisans_q_v1',
  'artisans production': 'artisans_q_v1',
};

const BRAND_INVOICE_MAP: Record<string, string> = {
  aaha: 'aaha_i_v1',
  'aaha kalyanam': 'aaha_i_v1',
  tinytoes: 'tinytoes_i_v1',
  'tiny toes': 'tinytoes_i_v1',
  artisans: 'artisans_i_v1',
  'artisans production': 'artisans_i_v1',
};

const BRAND_AGREEMENT_MAP: Record<string, string> = {
  aaha: 'wedding_v1',
  'aaha kalyanam': 'wedding_v1',
  tinytoes: 'default_v1',
  'tiny toes': 'default_v1',
  artisans: 'default_v1',
  'artisans production': 'default_v1',
};

/** Normalise a brand name for map lookup */
const normalizeBrand = (brand: string): string =>
  brand.toLowerCase().trim();

/** Load a company profile from localStorage by id */
const loadCompanyById = (brandId: string): Record<string, any> | null => {
  try {
    const stored = localStorage.getItem('company_settings');
    if (!stored) return null;
    const companies: any[] = JSON.parse(stored);
    return companies.find(c => c.id === brandId || c.companyName === brandId) || null;
  } catch {
    return null;
  }
};

/**
 * Resolves the best Quote template for a given brand.
 * Resolution order:
 *  1. Company Settings stored `defaultQuoteTemplate`
 *  2. BRAND_QUOTE_MAP keyword match on companyName
 *  3. Fallback: first registered quote template
 */
export const getBrandQuoteTemplate = (brandId: string): RegistryItem => {
  const company = loadCompanyById(brandId);
  const stored = company?.defaultQuoteTemplate;
  if (stored && quoteTemplates[stored]) return quoteTemplates[stored];

  // Name-based fallback
  const name = normalizeBrand(company?.companyName || brandId);
  for (const [keyword, templateId] of Object.entries(BRAND_QUOTE_MAP)) {
    if (name.includes(keyword)) {
      const tmpl = quoteTemplates[templateId];
      if (tmpl) return tmpl;
    }
  }

  // Global fallback
  return Object.values(quoteTemplates)[0];
};

/**
 * Resolves the best Invoice template for a given brand.
 */
export const getBrandInvoiceTemplate = (brandId: string): RegistryItem => {
  const company = loadCompanyById(brandId);
  const stored = company?.defaultInvoiceTemplate;
  if (stored && invoiceTemplates[stored]) return invoiceTemplates[stored];

  const name = normalizeBrand(company?.companyName || brandId);
  for (const [keyword, templateId] of Object.entries(BRAND_INVOICE_MAP)) {
    if (name.includes(keyword)) {
      const tmpl = invoiceTemplates[templateId];
      if (tmpl) return tmpl;
    }
  }

  return Object.values(invoiceTemplates)[0];
};

/**
 * Resolves the best Agreement template for a given brand.
 */
export const getBrandAgreementTemplate = (brandId: string): RegistryItem => {
  const company = loadCompanyById(brandId);
  const stored = company?.defaultAgreementTemplate;
  if (stored && agreementTemplates[stored]) return agreementTemplates[stored];

  const name = normalizeBrand(company?.companyName || brandId);
  for (const [keyword, templateId] of Object.entries(BRAND_AGREEMENT_MAP)) {
    if (name.includes(keyword)) {
      const tmpl = agreementTemplates[templateId];
      if (tmpl) return tmpl;
    }
  }

  return Object.values(agreementTemplates)[0];
};

// ─────────────────────────────────────────────────────────────────────────────
// DISCOVERY HELPERS
// Return TemplateMetadata arrays for dropdowns, settings screens, and previews.
// ─────────────────────────────────────────────────────────────────────────────

/** All templates of a given document type (from all registries + custom) */
export const getTemplatesByType = (documentType: DocumentType): TemplateMetadata[] => {
  const all: TemplateMetadata[] = [
    ...Object.values(quoteTemplates).map(t => t.metadata),
    ...Object.values(invoiceTemplates).map(t => t.metadata),
    ...Object.values(agreementTemplates).map(t => t.metadata),
    ...Object.values(proposalTemplates).map(t => t.metadata),
  ];
  return all.filter(m => m.documentType === documentType);
};

export const getQuoteTemplates = (): TemplateMetadata[] =>
  Object.values(quoteTemplates).map(t => t.metadata);

export const getInvoiceTemplates = (): TemplateMetadata[] =>
  Object.values(invoiceTemplates).map(t => t.metadata);

export const getAgreementTemplates = (): TemplateMetadata[] =>
  Object.values(agreementTemplates).map(t => t.metadata);

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM TEMPLATE PERSISTENCE
// ─────────────────────────────────────────────────────────────────────────────

/** Load all custom (canva_image / pdf_overlay) templates from localStorage into memory */
export const loadCustomTemplates = () => {
  try {
    const stored = localStorage.getItem('artisans_custom_templates');
    if (stored) {
      const custom: CustomTemplateMetadata[] = JSON.parse(stored);
      custom.forEach(t => {
        const item: RegistryItem = { metadata: t, component: () => null };
        if (t.documentType === 'quote') quoteTemplates[t.id] = item;
        if (t.documentType === 'invoice') invoiceTemplates[t.id] = item;
        if (t.documentType === 'agreement') agreementTemplates[t.id] = item;
      });
    }
  } catch (e) {
    console.error('Failed to load custom templates', e);
  }
};

loadCustomTemplates(); // Auto-hydrate on module load

/** Persist a custom template and hot-reload it into the registry */
export const saveCustomTemplate = (template: CustomTemplateMetadata) => {
  try {
    const stored = localStorage.getItem('artisans_custom_templates');
    const custom: CustomTemplateMetadata[] = stored ? JSON.parse(stored) : [];
    const idx = custom.findIndex(t => t.id === template.id);
    if (idx >= 0) {
      custom[idx] = template;
    } else {
      custom.push(template);
    }
    localStorage.setItem('artisans_custom_templates', JSON.stringify(custom));

    const item: RegistryItem = { metadata: template, component: () => null };
    if (template.documentType === 'quote') quoteTemplates[template.id] = item;
    if (template.documentType === 'invoice') invoiceTemplates[template.id] = item;
    if (template.documentType === 'agreement') agreementTemplates[template.id] = item;
  } catch (e) {
    console.error('Failed to save custom template', e);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GENERAL HELPER
// ─────────────────────────────────────────────────────────────────────────────

/** Safe lookup with double fallback — NEVER returns undefined, always returns a RegistryItem */
export const getTemplate = (
  registry: Record<string, RegistryItem>,
  id: string,
  defaultId: string
): RegistryItem => {
  const found = registry[id] || registry[defaultId] || Object.values(registry)[0];
  if (found) return found;

  // Absolute safety fallback — renders an error message in place of a missing template
  console.warn(`[TemplateRegistry] No template found for id="${id}" in registry. Using inline fallback.`);
  return {
    metadata: {
      id: '__fallback__',
      name: 'Fallback',
      description: 'No template available',
      version: '0.0.0',
      type: 'react',
      documentType: 'invoice',
    },
    component: () => null,
  };
};
