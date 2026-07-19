import { fetchApi } from './client';
import type { StandaloneAgreementTemplate, StandaloneAgreement, StandaloneAgreementSignature } from '../../types';

export const agreementsV2 = {
  getStandaloneAgreementTemplates: async (): Promise<StandaloneAgreementTemplate[]> => {
    return fetchApi('/standalone-agreement-templates');
  },

  assignStandaloneAgreement: async (clientId: string, templateId: string, linkedQuoteId?: string): Promise<StandaloneAgreement> => {
    return fetchApi('/standalone-agreements/assign', {
      method: 'POST',
      body: JSON.stringify({ clientId, templateId, linkedQuoteId })
    });
  },

  getClientStandaloneAgreement: async (clientId: string): Promise<StandaloneAgreement[]> => {
    try {
      return await fetchApi(`/clients/${clientId}/standalone-agreement`);
    } catch (err: any) {
      if (err.status === 404) {
        return [];
      }
      throw err;
    }
  },

  signStandaloneAgreement: async (agreementId: string, signerName: string, signatureImageUrl: string): Promise<StandaloneAgreementSignature> => {
    return fetchApi(`/standalone-agreements/${agreementId}/sign`, {
      method: 'POST',
      body: JSON.stringify({ signerName, signatureImageUrl })
    });
  },

  getStandaloneAgreementSignature: async (agreementId: string): Promise<StandaloneAgreementSignature | null> => {
    return fetchApi(`/standalone-agreements/${agreementId}/signature`);
  },

  uploadStandaloneAgreementDocument: async (agreementId: string, documentType: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('documentType', documentType);
    formData.append('file', file);
    return fetchApi(`/standalone-agreements/${agreementId}/documents`, {
      method: 'POST',
      body: formData
    });
  },

  getStandaloneAgreementDocuments: async (agreementId: string): Promise<any[]> => {
    return fetchApi(`/standalone-agreements/${agreementId}/documents`);
  },

  deleteStandaloneAgreementDocument: async (documentId: string): Promise<any> => {
    return fetchApi(`/standalone-agreements/documents/${documentId}`, {
      method: 'DELETE'
    });
  },

  downloadStandaloneAgreementDocument: async (documentId: string, fileName: string) => {
    const blob = await fetchApi(`/standalone-agreements/documents/${documentId}/download`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  },

  getStandaloneAgreementSignatureImageBlob: async (agreementId: string): Promise<Blob> => {
    return fetchApi(`/standalone-agreements/${agreementId}/signature/image`, { responseType: 'blob' });
  },

  linkStandaloneAgreementToQuotation: async (agreementId: string, linkedQuoteId: string): Promise<any> => {
    return fetchApi(`/standalone-agreements/${agreementId}/link-quotation`, {
      method: 'POST',
      body: JSON.stringify({ linkedQuoteId })
    });
  }
};


