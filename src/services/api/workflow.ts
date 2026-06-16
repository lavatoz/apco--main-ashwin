import { fetchApi, checkClientBlock } from './client';
import { type ApprovalRecord, type CloudConfig } from '../../types';
import { safeParse } from '../../utils/storage';

const CLOUD_CONFIG_KEY = 'apco_cloud_config';
const delay = (ms: number = 400) => new Promise(resolve => setTimeout(resolve, ms));

export const workflow = {
  // Workflow Timeline Events
  getProjectTimeline: async (projectId: string) => {
    return fetchApi(`/workflow/projects/${projectId}/timeline`);
  },

  // Approvals
  getApprovals: async (): Promise<ApprovalRecord[]> => {
    return fetchApi('/approvals');
  },
  saveApproval: async (approval: ApprovalRecord): Promise<ApprovalRecord> => {
    checkClientBlock("Manage Approvals");
    const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const hasUuid = approval.id && isUuid(approval.id);

    let result;
    if (hasUuid) {
      result = await fetchApi(`/approvals/${approval.id}/verify`, {
        method: 'PUT',
        body: JSON.stringify({
          status: approval.status,
          notes: approval.notes || approval.auditTrail?.notes || ''
        })
      });
    } else {
      result = await fetchApi('/approvals', {
        method: 'POST',
        body: JSON.stringify(approval)
      });
    }
    return result;
  },

  // Cloud Config
  getCloudConfig: async (): Promise<CloudConfig> => {
    await delay();
    const data = localStorage.getItem(CLOUD_CONFIG_KEY);
    return data ? JSON.parse(data) : {
      serverUrl: 'https://api.artisans.co/v1',
      vaults: [
        { id: 'V1', name: 'Primary Wedding Vault', email: 'vault1@artisans.co', usagePercent: 45 },
        { id: 'V2', name: 'Kids Content Server', email: 'vault2@artisans.co', usagePercent: 12 }
      ],
      autoBackup: true,
      mediaOrigin: 'GoogleDrive'
    };
  },
  saveCloudConfig: async (config: CloudConfig) => {
    await delay();
    localStorage.setItem(CLOUD_CONFIG_KEY, JSON.stringify(config));
  },

  // Attendance (Staff Portal)
  getAttendance: async (staffId: string) => {
    await delay(100);
    const records = safeParse<any[]>('attendance_records', []);
    return records.filter(r => r.staffId === staffId);
  },
  saveAttendance: async (record: any) => {
    await delay(100);
    const records = safeParse<any[]>('attendance_records', []);
    const idx = records.findIndex(r => r.id === record.id);
    if (idx >= 0) records[idx] = record;
    else records.push(record);
    localStorage.setItem('attendance_records', JSON.stringify(records));
    return record;
  },

  // Equipment (Staff Portal)
  getEquipment: async (staffId: string) => {
    await delay(100);
    const records = safeParse<any[]>('equipment_records', [
      { id: 'EQ-001', staffId, name: 'Sony A7S III', type: 'Camera', serialNumber: 'SNY-1234', status: 'Assigned' },
      { id: 'EQ-002', staffId, name: 'Sony 24-70mm f/2.8 GM', type: 'Lens', serialNumber: 'LNS-9876', status: 'Assigned' }
    ]);
    return records.filter(r => r.staffId === staffId);
  },

  // Sync Placeholder
  syncToRemote: async () => {
    await delay(1500);
    return true;
  },

  // Personnel Registry (External Crew)
  getPersonnel: async (): Promise<any[]> => {
    return fetchApi('/personnel');
  },
  savePersonnel: async (person: any): Promise<any> => {
    checkClientBlock("Manage Personnel");
    const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const hasUuid = person.id && isUuid(person.id);
    if (hasUuid) {
      return fetchApi(`/personnel/${person.id}`, {
        method: 'PUT',
        body: JSON.stringify(person)
      });
    } else {
      return fetchApi('/personnel', {
        method: 'POST',
        body: JSON.stringify(person)
      });
    }
  },
  deletePersonnel: async (id: string): Promise<void> => {
    checkClientBlock("Manage Personnel");
    await fetchApi(`/personnel/${id}`, { method: 'DELETE' });
  },

  // Agreement Templates
  getAgreementTemplates: async (): Promise<any[]> => {
    return fetchApi('/templates/agreements');
  },
  saveAgreementTemplate: async (template: any): Promise<any> => {
    checkClientBlock("Manage Templates");
    const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const hasUuid = template.id && isUuid(template.id);
    if (hasUuid) {
      return fetchApi(`/templates/agreements/${template.id}`, {
        method: 'PUT',
        body: JSON.stringify(template)
      });
    } else {
      return fetchApi('/templates/agreements', {
        method: 'POST',
        body: JSON.stringify(template)
      });
    }
  },
  deleteAgreementTemplate: async (id: string): Promise<void> => {
    checkClientBlock("Manage Templates");
    await fetchApi(`/templates/agreements/${id}`, { method: 'DELETE' });
  },

  // Custom templates
  getCustomTemplates: async (): Promise<any[]> => {
    return fetchApi('/templates/custom');
  },
  saveCustomTemplate: async (template: any): Promise<any> => {
    checkClientBlock("Manage Templates");
    const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const hasUuid = template.id && isUuid(template.id);
    if (hasUuid) {
      return fetchApi(`/templates/custom/${template.id}`, {
        method: 'PUT',
        body: JSON.stringify(template)
      });
    } else {
      return fetchApi('/templates/custom', {
        method: 'POST',
        body: JSON.stringify(template)
      });
    }
  },
  deleteCustomTemplate: async (id: string): Promise<void> => {
    checkClientBlock("Manage Templates");
    await fetchApi(`/templates/custom/${id}`, { method: 'DELETE' });
  }
};
