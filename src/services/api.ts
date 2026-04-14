import { type ActivityLog, type Booking, type Client, type CloudConfig, type Division, type Company, type Expense, type Invoice, type Staff, type Task, type Project } from "../types";


export const API_URL = "http://localhost:5000/api";

const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {})
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error && (error.name === 'TypeError' || error.message === 'Failed to fetch')) {
      throw new Error('Network connection error');
    }
    throw error;
  }
};

const STORAGE_KEY = 'apco_enterprise_db_v5';
const STAFF_KEY = 'apco_staff_registry';
const CLOUD_CONFIG_KEY = 'apco_cloud_config';

const delay = (ms: number = 400) => new Promise(resolve => setTimeout(resolve, ms));

interface DBStructure {
  clients: Client[];
  projects: Project[];
  invoices: Invoice[];
  bookings: Booking[];
  expenses: Expense[];
  companies: Company[];
  tasks: Task[];
  lastSynced: string;
}

const getInitialStaff = (): Staff[] => [
  {
    id: 'STAFF-001',
    name: 'Rahul Malhotra',
    email: 'rahul@artisans.co',
    loginId: 'staff_rahul',
    role: 'Lead Producer',
    isActive: true,
    permissions: {
      canManageClients: true,
      canManageFinance: true,
      canManageTasks: true,
      canUseAI: true,
      canManageEcosystem: true
    }
  }
];

const getInitialDB = (): DBStructure => ({
  companies: [
    { id: '1', name: 'AAHA Kalyanam', ownerName: 'Artisan Owner', phone: '9876543210', email: 'wedding@artisans.co', color: '#fbbf24', type: 'Wedding', description: 'Luxury Wedding Production' }
  ],
  clients: [],
  projects: [],
  invoices: [],
  bookings: [],
  expenses: [],
  tasks: [],
  lastSynced: new Date().toISOString()
});

const getDB = (): DBStructure => {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : getInitialDB();
};

const saveDB = (db: DBStructure) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...db, lastSynced: new Date().toISOString() }));
};

export const api = {
  // Auth
  signup: async (userData: Record<string, unknown>) => fetchApi('/auth/signup', { method: 'POST', body: JSON.stringify(userData) }),

  // Dashboard
  getDashboard: async () => fetchApi('/dashboard'),

  // Clients
  getClients: async () => {
    await delay(100);
    const data = localStorage.getItem("clients");
    return data ? JSON.parse(data) : [];
  },
  saveClient: async (client: Client) => {
    await delay(100);
    const clients = JSON.parse(localStorage.getItem("clients") || "[]");
    const newClient = { ...client, _id: client._id || `client-${Date.now()}` };
    const idx = clients.findIndex((c: Client) => c._id === newClient._id);
    if (idx >= 0) {
      clients[idx] = newClient;
    } else {
      clients.push(newClient);
    }
    localStorage.setItem("clients", JSON.stringify(clients));
    return newClient;
  },
  getClientById: async (id: string) => {
    const clients = JSON.parse(localStorage.getItem("clients") || "[]");
    return clients.find((c: Client) => c._id === id);
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

  // Projects
  getProjects: async () => fetchApi('/projects').catch(() => getDB().projects),
  getProjectById: async (id: string) => fetchApi(`/projects/${id}`),
  saveProject: async (project: Project) => {
      if (project._id) {
          return fetchApi(`/projects/${project._id}`, { method: 'PUT', body: JSON.stringify(project) });
      }
      return fetchApi('/projects', { method: 'POST', body: JSON.stringify(project) });
  },
  updateProjectStatus: async (id: string, status: string) => {
    return fetchApi(`/projects/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
  },
  uploadImages: async (projectId: string, imageUrls: string[]) => {
    return fetchApi(`/projects/${projectId}/upload`, { method: 'POST', body: JSON.stringify({ imageUrls }) });
  },
  toggleImageSelection: async (projectId: string, imageId: string) => {
    return fetchApi(`/projects/${projectId}/select`, { method: 'POST', body: JSON.stringify({ imageId }) });
  },

  // AI-based face recognition search
  findMyPhotos: async (clientId: string, selfie: File) => {
    const formData = new FormData();
    formData.append('selfie', selfie);
    return fetchApi(`/ai/find-photos/${clientId}`, {
       method: 'POST',
       body: formData
    });
  },

  // Invoices
  getInvoices: async () => {
    await delay(100);
    const data = localStorage.getItem("ledger");
    return data ? JSON.parse(data) : getDB().invoices;
  },
  saveInvoice: async (invoice: Invoice) => {
    await delay(100);
    const ledger = JSON.parse(localStorage.getItem("ledger") || "[]");
    const newInvoice = { ...invoice, _id: invoice._id || `inv-${Date.now()}` };
    const idx = ledger.findIndex((i: Invoice) => i._id === newInvoice._id);
    if (idx >= 0) {
      ledger[idx] = newInvoice;
    } else {
      ledger.push(newInvoice);
    }
    localStorage.setItem("ledger", JSON.stringify(ledger));
    return newInvoice;
  },
  updateInvoiceStatus: async (id: string, status: string) => {
    return fetchApi(`/finance/invoices/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
  },

  // Divisions (Enterprise Units)
  getDivisions: async (): Promise<Division[]> => {
    await delay(100);
    const data = localStorage.getItem("divisions");
    return data ? JSON.parse(data) : [
      { id: 'div_wedding', name: 'AAHA KALYANAM', type: 'Wedding', createdAt: new Date().toISOString() }
    ];
  },
  saveDivision: async (division: Division) => {
    await delay(200);
    const divisions = await api.getDivisions();
    const idx = divisions.findIndex(d => d.id === division.id);
    if (idx >= 0) divisions[idx] = division;
    else divisions.push(division);
    localStorage.setItem("divisions", JSON.stringify(divisions));
    return division;
  },

  // Companies (Legacy Ref)
  getCompanies: async () => fetchApi('/brands').catch(() => getDB().companies),

  // Expenses
  getExpenses: async () => fetchApi('/finance/expenses').catch(() => getDB().expenses),
  saveExpense: async (expense: Expense & { _id?: string }) => {
    if (expense._id) {
      return fetchApi(`/finance/expenses/${expense._id}`, { method: 'PUT', body: JSON.stringify(expense) });
    }
    return fetchApi('/finance/expenses', { method: 'POST', body: JSON.stringify(expense) });
  },
  deleteExpense: async (id: string) => {
    return fetchApi(`/finance/expenses/${id}`, { method: 'DELETE' });
  },

  // Tasks
  getTasks: async () => { await delay(); return getDB().tasks; },
  saveTask: async (task: Task) => {
    await delay();
    const db = getDB();
    const idx = db.tasks.findIndex(t => t.id === task.id);
    if (idx >= 0) db.tasks[idx] = task;
    else db.tasks.push(task);
    saveDB(db);
  },
  deleteTask: async (id: string) => {
    await delay();
    const db = getDB();
    db.tasks = db.tasks.filter(t => t.id !== id);
    saveDB(db);
  },

  // Staff
  getStaff: async (): Promise<Staff[]> => {
    await delay();
    const data = localStorage.getItem(STAFF_KEY);
    return data ? JSON.parse(data) : getInitialStaff();
  },
  saveStaff: async (staff: Staff) => {
    await delay();
    const current = await api.getStaff();
    const idx = current.findIndex(s => s.id === staff.id);
    if (idx >= 0) current[idx] = staff;
    else current.push(staff);
    localStorage.setItem(STAFF_KEY, JSON.stringify(current));
  },
  deleteStaff: async (id: string) => {
    await delay();
    const current = await api.getStaff();
    const filtered = current.filter(s => s.id !== id);
    localStorage.setItem(STAFF_KEY, JSON.stringify(filtered));
  },

  // Bookings
  getBookings: async () => { await delay(); return getDB().bookings; },

  // Logs
  getLogs: async (): Promise<ActivityLog[]> => {
    return fetchApi('/logs');
  },
  logActivity: async (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    // Audit logging is now handled automatically by the backend middleware 
    // for most actions, but we can keep this for custom frontend events if needed.
    return fetchApi('/logs', { method: 'POST', body: JSON.stringify(log) }).catch(() => null);
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

  // Sync Placeholder
  syncToRemote: async () => {
    await delay(1500);
    return true;
  }
};
