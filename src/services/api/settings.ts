import { fetchApi } from './client';
import { type CompanyProfile } from '../../types';

export const settings = {
  getGlobalSettings: async (): Promise<any> => {
    const raw = await fetchApi('/settings/global');
    const parsed: any = {};
    for (const [key, value] of Object.entries(raw)) {
      const valStr = value as string;
      if (valStr === 'true') {
        parsed[key] = true;
      } else if (valStr === 'false') {
        parsed[key] = false;
      } else if (valStr.startsWith('{') || valStr.startsWith('[')) {
        try {
          parsed[key] = JSON.parse(valStr);
        } catch {
          parsed[key] = valStr;
        }
      } else {
        parsed[key] = valStr;
      }
    }
    return parsed;
  },

  saveGlobalSettings: async (globalSettings: any) => {
    const stringifiedSettings: Record<string, string> = {};
    for (const [key, value] of Object.entries(globalSettings)) {
      if (typeof value === 'boolean') {
        stringifiedSettings[key] = value ? 'true' : 'false';
      } else if (typeof value === 'object' && value !== null) {
        stringifiedSettings[key] = JSON.stringify(value);
      } else if (value !== undefined && value !== null) {
        stringifiedSettings[key] = String(value);
      }
    }
    return fetchApi('/settings/global', {
      method: 'POST',
      body: JSON.stringify(stringifiedSettings)
    });
  },

  getCompanies: async (): Promise<CompanyProfile[]> => {
    return fetchApi('/settings/companies');
  },

  saveCompany: async (id: string, payload: any) => {
    const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    if (isUuid(id)) {
      return fetchApi(`/settings/companies/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
    } else {
      return fetchApi('/settings/companies', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    }
  },

  deleteCompany: async (id: string) => {
    return fetchApi(`/settings/companies/${id}`, {
      method: 'DELETE'
    });
  }
};
