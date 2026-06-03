import React from 'react';
import { type CompanyProfile, type Client, type Invoice, type ActiveAgreementSnapshot } from '../types';

export type DocumentType = 'quote' | 'invoice' | 'agreement' | 'proposal';

export type TemplateType = 'react' | 'canva_pdf' | 'canva_image' | 'pdf_overlay';

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  version: string;
  type: TemplateType;
  documentType: DocumentType;
  previewUrl?: string;    // For live preview thumbnails
  sourceUrl?: string;     // For Canva/PDF-based templates
  // --- Version Persistence ---
  // When a document (invoice/quote/agreement) is generated, store these two fields
  // on the document record so future re-renders use the exact same template version.
  // templateId: string    → stored on Invoice/Agreement
  // templateVersion: string → stored on Invoice/Agreement
}

export interface DocumentTotals {
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid?: number;
  balance?: number;
}

export interface TemplateProps {
  company: CompanyProfile | any;
  client?: Client;
  document: Invoice | any; // Quote/Invoice
  agreement?: ActiveAgreementSnapshot | any;
  totals?: DocumentTotals;
  branding?: any;
}

export type TemplateComponent = React.FC<TemplateProps>;

export interface RegistryItem {
  metadata: TemplateMetadata;
  component: TemplateComponent;
}

export interface FieldCoordinates {
  x: number;
  y: number;
  fontSize?: number;
  fontColor?: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
  visible?: boolean;
}

export interface TemplateFieldMap {
  clientName?: FieldCoordinates;
  invoiceNumber?: FieldCoordinates;
  date?: FieldCoordinates;
  dueDate?: FieldCoordinates;
  total?: FieldCoordinates;
  advancePaid?: FieldCoordinates;
  balanceDue?: FieldCoordinates;
  qrCode?: FieldCoordinates;
  upiDetails?: FieldCoordinates;
  itemsTable?: FieldCoordinates & { 
    rowHeight?: number;
    colWidths?: number[];
  };
}

export interface CustomTemplateMetadata extends TemplateMetadata {
  backgroundUrl: string;
  fieldMap: TemplateFieldMap;
}
