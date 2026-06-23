import { fetchApi, checkClientBlock } from './client';
import { type Client } from '../../types';

export const clients = {
  getClients: async (): Promise<Client[]> => {
    const data = await fetchApi('/clients');
    if (Array.isArray(data)) {
      let companies: any[] = [];
      try {
        const stored = localStorage.getItem('artisans_companies');
        if (stored) {
          companies = JSON.parse(stored);
        }
      } catch (e) {
        // ignore
      }
      if (!companies || companies.length === 0) {
        companies = [
          { id: 'comp_1', companyName: 'Aaha Kalyanam', projectType: 'AAHA KALYANAM' },
          { id: 'comp_2', companyName: 'Tiny Toes', projectType: 'TINY TOES' }
        ];
      }

      return data.map((c: any) => {
        const company = companies.find((comp: any) => 
          (comp.companyName && c.companyName && comp.companyName.trim().toLowerCase() === c.companyName.trim().toLowerCase()) ||
          (comp.projectType && c.companyName && comp.projectType.trim().toLowerCase() === c.companyName.trim().toLowerCase())
        ) || companies[0];

        return {
          ...c,
          brand: company?.companyName || c.brand || 'Unknown',
          brandId: company?.id || c.brandId || '',
          companyId: company?.id || c.companyId || '',
          divisionId: company?.id || c.divisionId || '',
          status: c.status || 'pending',
          projectName: c.projectName || c.name || 'Unnamed Client',
          people: c.people || []
        };
      });
    }
    throw new Error("Invalid response from server: clients is not an array");
  },

  createClient: async (client: Client): Promise<Client> => {
    checkClientBlock("Manage Clients");
    
    const clientPayload = {
      name: client.name || client.projectName || "Unnamed Client",
      email: client.email || `${(client.name || "client").toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now()}@placeholder.apco`,
      phone: client.phone || null,
      address: client.address || null,
      companyName: client.companyName || client.brand || null,
      events: client.events || [],
    };

    const savedBackendClient = await fetchApi('/clients', {
      method: 'POST',
      body: JSON.stringify(clientPayload)
    });

    return {
      ...client,
      id: savedBackendClient.id,
      _id: savedBackendClient.id,
      name: savedBackendClient.name,
      email: savedBackendClient.email,
      phone: savedBackendClient.phone,
      address: savedBackendClient.address,
      companyId: client.companyId || client.divisionId,
      divisionId: client.divisionId || client.companyId,
      events: savedBackendClient.events || client.events || [],
    };
  },

  updateClient: async (id: string, client: Client): Promise<Client> => {
    checkClientBlock("Manage Clients");
    
    const clientPayload = {
      name: client.name || client.projectName || "Unnamed Client",
      email: client.email || `${(client.name || "client").toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now()}@placeholder.apco`,
      phone: client.phone || null,
      address: client.address || null,
      companyName: client.companyName || client.brand || null,
      events: client.events || [],
    };

    const savedBackendClient = await fetchApi(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clientPayload)
    });

    return {
      ...client,
      id: savedBackendClient.id,
      _id: savedBackendClient.id,
      name: savedBackendClient.name,
      email: savedBackendClient.email,
      phone: savedBackendClient.phone,
      address: savedBackendClient.address,
      companyId: client.companyId || client.divisionId,
      divisionId: client.divisionId || client.companyId,
      events: savedBackendClient.events || client.events || [],
    };
  },

  saveClient: async (client: Client): Promise<Client> => {
    const isUuid = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
    const hasBackendId = !!((client.id && isUuid(client.id)) || (client._id && isUuid(client._id)));
    const targetId = isUuid(client.id || '') ? client.id : client._id;

    if (hasBackendId && targetId) {
      return clients.updateClient(targetId, client);
    } else {
      return clients.createClient(client);
    }
  },

  getClientById: async (id: string): Promise<Client | null> => {
    const data = await fetchApi(`/clients/${id}`);
    if (data) {
      let companies: any[] = [];
      try {
        const stored = localStorage.getItem('artisans_companies');
        if (stored) {
          companies = JSON.parse(stored);
        }
      } catch (e) {
        // ignore
      }
      if (!companies || companies.length === 0) {
        companies = [
          { id: 'comp_1', companyName: 'Aaha Kalyanam', projectType: 'AAHA KALYANAM' },
          { id: 'comp_2', companyName: 'Tiny Toes', projectType: 'TINY TOES' }
        ];
      }

      const company = companies.find((comp: any) => 
        (comp.companyName && data.companyName && comp.companyName.trim().toLowerCase() === data.companyName.trim().toLowerCase()) ||
        (comp.projectType && data.companyName && comp.projectType.trim().toLowerCase() === data.companyName.trim().toLowerCase())
      ) || companies[0];

      return {
        ...data,
        brand: company?.companyName || data.brand || 'Unknown',
        brandId: company?.id || data.brandId || '',
        companyId: company?.id || data.companyId || '',
        divisionId: company?.id || data.divisionId || '',
        status: data.status || 'pending',
        projectName: data.projectName || data.name || 'Unnamed Client',
        people: data.people || []
      };
    }
    return data;
  },

  deleteClient: async (id: string) => {
    checkClientBlock("Delete Client");
    await fetchApi(`/clients/${id}`, { method: 'DELETE' });
  },

  // Gallery
  getGallery: async (clientId: string) => fetchApi(`/gallery/${clientId}`),
  uploadGalleryImages: async (clientId: string, files: File[]) => {
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));
    return fetchApi(`/gallery/upload/${clientId}`, { 
      method: 'POST', 
      body: formData 
    });
  },
  selectGalleryPhotos: async (clientId: string, selectedImages: string[]) => {
    return fetchApi(`/gallery/select/${clientId}`, { 
      method: 'POST', 
      body: JSON.stringify({ selectedImages }) 
    });
  },

  // AI search
  findMyPhotos: async (clientId: string, selfie: File) => {
    const formData = new FormData();
    formData.append('selfie', selfie);
    return fetchApi(`/ai/find-photos/${clientId}`, {
      method: 'POST',
      body: formData
    });
  }
};
