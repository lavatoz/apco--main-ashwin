import { fetchApi } from './client';

export interface DocumentVerificationResult {
  verified?: boolean;
  verificationStatus: string;
  documentId?: string;
  documentType?: string;
  documentNumber?: string;
  company?: string;
  brand?: string;
  client?: string;
  clientName?: string;
  generatedAt?: string;
  generatedDate?: string;
  sha256VerificationResult?: string;
  message?: string;
}

export const documents = {
  verifyDocument: async (documentId: string): Promise<DocumentVerificationResult> => {
    return fetchApi(`/verify/${encodeURIComponent(documentId)}`);
  }
};
