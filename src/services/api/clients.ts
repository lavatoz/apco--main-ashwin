import { fetchApi, checkClientBlock } from './client';
import { type Client } from '../../types';

export const clients = {
  getClients: async (): Promise<Client[]> => {
    const data = await fetchApi('/clients');
    if (Array.isArray(data)) {
      return data;
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
