import { type ActivityLog, type Booking, type Client, type CloudConfig, type Division, type Company, type Expense, type Invoice, type Staff, type Task, type Project, type ApprovalRecord } from "../types";
import { safeParse } from "../utils/storage";


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

/**
 * Permission guard for administrative actions
 */
const checkClientBlock = (action: string) => {
  const user = safeParse<Record<string, any>>('user', {});
  if (user.role === 'Client') {
    console.error(`[SECURITY] Blocked ${user.role} from performing administrative action: ${action}`);
    throw new Error(`Permission Denied: Clients cannot perform administrative operation '${action}'`);
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

const INVOICE_KEY = 'artisans_invoices';
const LEDGER_KEY = 'ledger';
const ENTRIES_KEY = 'entries';
const LEGACY_INVOICES_KEY = 'invoices';
const APPROVALS_KEY = 'apco_approvals';

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
    {
      id: '1', name: 'AAHA Kalyanam', ownerName: 'Artisan Owner', phone: '9876543210', email: 'wedding@artisans.co', color: '#fbbf24', type: 'Wedding', description: 'Luxury Wedding Production',
      createdAt: ""
    }
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
  return safeParse<DBStructure>(STORAGE_KEY, getInitialDB());
};

const saveDB = (db: DBStructure) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...db, lastSynced: new Date().toISOString() }));
};

/**
 * MIGRATION UTILITY
 * Consolidates legacy data stores into the single source of truth
 */
const migrateInvoices = () => {
    const artisansInvoices = JSON.parse(localStorage.getItem(INVOICE_KEY) || '[]');
    if (artisansInvoices.length > 0) return; // Already migrated or fresh start

    console.log("[MIGRATION] Consolidating legacy finance records...");
    
    const ledger = JSON.parse(localStorage.getItem(LEDGER_KEY) || '[]');
    const entries = JSON.parse(localStorage.getItem(ENTRIES_KEY) || '[]');
    const legacy = JSON.parse(localStorage.getItem(LEGACY_INVOICES_KEY) || '[]');

    const unified: any[] = [];
    const seenIds = new Set();

    const processItem = (item: any, source: string) => {
        const id = item.id || item._id || `mig_${source}_${Date.now()}_${Math.random()}`;
        if (seenIds.has(String(id))) return;
        
        seenIds.add(String(id));
        unified.push({
            ...item,
            id: String(id),
            _id: String(id),
            type: item.type || (item.isQuotation ? 'quotation' : 'invoice'),
            isQuotation: item.isQuotation || item.type === 'quotation',
            status: item.status || 'Unpaid',
            createdAt: item.createdAt || item.issueDate || new Date().toISOString(),
            brandId: item.brandId || item.companyId || 'All'
        });
    };

    ledger.forEach((item: any) => processItem(item, 'ledger'));
    entries.forEach((item: any) => processItem(item, 'entries'));
    legacy.forEach((item: any) => processItem(item, 'legacy'));

    if (unified.length > 0) {
        localStorage.setItem(INVOICE_KEY, JSON.stringify(unified));
        console.log(`[MIGRATION] Successfully merged ${unified.length} records.`);
    }
};

// Auto-run migration once on load
if (typeof window !== 'undefined') {
    migrateInvoices();
}

/**
 * APPROVALS MIGRATION
 * Convert any invoices with status "Payment Submitted" into explicit ApprovalRecords
 */
const migrateApprovals = () => {
    const approvals: ApprovalRecord[] = JSON.parse(localStorage.getItem(APPROVALS_KEY) || '[]');
    const invoices: Invoice[] = JSON.parse(localStorage.getItem(INVOICE_KEY) || '[]');
    let approvalsChanged = false;

    invoices.forEach(inv => {
        if (inv.status === 'Payment Submitted' || inv.paymentVerification?.status === 'pending') {
            const approvalExists = approvals.some(a => a.targetId === inv.id && a.type === 'Client Payment Proof Approval');
            if (!approvalExists) {
                approvals.push({
                    id: `app_${Date.now()}_${Math.random()}`,
                    type: 'Client Payment Proof Approval',
                    targetId: String(inv.id),
                    targetType: 'invoice',
                    clientName: inv.client?.name || 'Unknown Client',
                    brandName: inv.brand,
                    amount: inv.totalAmount || inv.amount || 0,
                    submissionDate: inv.paymentVerification?.submittedAt || new Date().toISOString(),
                    status: 'Pending Approval',
                    metadata: { paymentVerification: inv.paymentVerification },
                    auditTrail: {}
                });
                approvalsChanged = true;
            }
        }
    });

    if (approvalsChanged) {
        localStorage.setItem(APPROVALS_KEY, JSON.stringify(approvals));
        console.log("[MIGRATION] Migrated pending verifications to Approvals module.");
    }
};

if (typeof window !== 'undefined') {
    migrateApprovals();
}

export const api = {
  // Auth
  signup: async (userData: Record<string, unknown>) => fetchApi('/auth/signup', { method: 'POST', body: JSON.stringify(userData) }),

  // Dashboard
  getDashboard: async () => fetchApi('/dashboard'),

  // Approvals
  getApprovals: async (): Promise<ApprovalRecord[]> => {
    await delay(50);
    const data = localStorage.getItem(APPROVALS_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveApproval: async (approval: ApprovalRecord) => {
    checkClientBlock("Manage Approvals");
    await delay(50);
    const approvals: ApprovalRecord[] = JSON.parse(localStorage.getItem(APPROVALS_KEY) || "[]");
    const idx = approvals.findIndex(a => a.id === approval.id);
    if (idx >= 0) {
        approvals[idx] = approval;
    } else {
        approvals.push(approval);
    }
    localStorage.setItem(APPROVALS_KEY, JSON.stringify(approvals));
    return approval;
  },

  // Clients
  getClients: async () => {
    await delay(100);
    return safeParse<Client[]>("clients", []);
  },
  saveClient: async (client: Client) => {
    checkClientBlock("Manage Clients");
    await delay(100);
    const clients = safeParse<Client[]>("clients", []);
    const newClient = { 
      ...client, 
      _id: client._id || `client-${Date.now()}`,
      portal: client.portal || { timeline: [], deliverables: [], internalSpends: [] }
    };
    const idx = clients.findIndex((c: Client) => c._id === newClient._id);
    if (idx >= 0) {
      clients[idx] = newClient;
    } else {
      clients.push(newClient);
      
      // FIX: Ensure a login account exists for newly created clients
      const storedUsers = localStorage.getItem('users');
      const users: any[] = storedUsers ? JSON.parse(storedUsers) : [];
      const userExists = users.some(u => u.email === newClient.email || u.id === newClient.email);
      if (!userExists && newClient.email) {
          const newUser = {
              id: newClient._id,
              name: newClient.name,
              email: newClient.email,
              password: 'clientpassword', // default password
              role: 'Client',
              permissions: [],
              isActive: true
          };
          users.push(newUser);
          localStorage.setItem('users', JSON.stringify(users));
      }
    }
    localStorage.setItem("clients", JSON.stringify(clients));
    return newClient;
  },
  getClientById: async (id: string) => {
    const clients = safeParse<Client[]>("clients", []);
    return clients.find((c: Client) => c._id === id || c.id === id);
  },
  deleteClient: async (id: string) => {
    checkClientBlock("Delete Client");
    await delay(100);
    const clients = safeParse<Client[]>("clients", []);
    const filtered = clients.filter((c: any) => c.id !== id && c._id !== id);
    localStorage.setItem("clients", JSON.stringify(filtered));
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
      checkClientBlock("Manage Projects");
      
      // Update local storage first to prevent UI revert on sync events
      const projects = safeParse<Project[]>("projects", []);
      const idx = projects.findIndex((p: Project) => p.id === project.id || p._id === project._id);
      if (idx >= 0) projects[idx] = project;
      else projects.push(project);
      localStorage.setItem("projects", JSON.stringify(projects));

      if (project._id) {
          return fetchApi(`/projects/${project._id}`, { method: 'PUT', body: JSON.stringify(project) }).catch(e => {
             console.warn("Backend save failed, saved locally", e);
             return project;
          });
      }
      return fetchApi('/projects', { method: 'POST', body: JSON.stringify(project) }).catch(e => {
          console.warn("Backend save failed, saved locally", e);
          return project;
      });
  },
  updateProjectStatus: async (id: string, status: string) => {
    checkClientBlock("Update Project Status");
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

  // Unified Invoices & Quotations
  getInvoices: async () => {
    await delay(50);
    const data = localStorage.getItem(INVOICE_KEY);
    return data ? JSON.parse(data) : [];
  },
  saveInvoice: async (invoice: Invoice) => {
    checkClientBlock("Create/Edit Invoice");
    await delay(50);
    const invoices = JSON.parse(localStorage.getItem(INVOICE_KEY) || "[]");
    const newInvoice = { 
        ...invoice, 
        id: String(invoice.id || invoice._id || `inv-${Date.now()}`),
        _id: String(invoice._id || invoice.id || `inv-${Date.now()}`),
        brandId: invoice.brandId || 'All',
        type: invoice.type || (invoice.isQuotation ? 'quotation' : 'invoice')
    };
    
    const idx = invoices.findIndex((i: any) => String(i.id) === String(newInvoice.id) || String(i._id) === String(newInvoice._id));
    if (idx >= 0) {
        invoices[idx] = newInvoice;
    } else {
        invoices.push(newInvoice);
    }
    localStorage.setItem(INVOICE_KEY, JSON.stringify(invoices));
    return newInvoice;
  },
  deleteInvoice: async (id: string) => {
    checkClientBlock("Delete Invoice");
    await delay(50);
    const invoices = JSON.parse(localStorage.getItem(INVOICE_KEY) || "[]");
    
    // Find the invoice to get its ID and potentially its link to a client
    const target = invoices.find((inv: any) => String(inv.id) === String(id) || String(inv._id) === String(id));
    
    if (target) {
       // Cleanup orphaned agreements on clients
       const clients = safeParse<Client[]>("clients", []);
       const updatedClients = clients.map((c: any) => {
          if (c.activeAgreement?.linkedQuoteId === String(id)) {
             return { ...c, activeAgreement: undefined };
          }
          return c;
       });
       localStorage.setItem("clients", JSON.stringify(updatedClients));

       // Delete linked project
       const projects = safeParse<Project[]>("projects", []);
       const updatedProjects = projects.filter((p: any) => String(p.id) !== String(id));
       localStorage.setItem("projects", JSON.stringify(updatedProjects));
    }

    const filtered = invoices.filter((inv: any) => String(inv.id) !== String(id) && String(inv._id) !== String(id));
    localStorage.setItem(INVOICE_KEY, JSON.stringify(filtered));
  },

  // Unified Finance Summary
  getFinanceSummary: async (projectId?: string, mode: 'global' | 'project' = 'project') => {
    console.log(`[FINANCE_SYNC] Fetching unified summary. Mode: ${mode}, ProjectId: ${projectId}`);
    await delay(50);
    
    // Read from single source
    const allInvoices: Invoice[] = JSON.parse(localStorage.getItem(INVOICE_KEY) || "[]");
    const localExpenses: Expense[] = JSON.parse(localStorage.getItem("expenses") || "[]");

    // Unified Expenses
    const allExpenses = [...localExpenses, ...getDB().expenses];

    // Filter Logic
    let filteredInvoices = allInvoices;
    let filteredExpenses = allExpenses;

    if (mode === 'project' && projectId && projectId !== 'All') {
        filteredInvoices = allInvoices.filter(i => 
          i.brandId === projectId || 
          i.divisionId === projectId || 
          i.brand === projectId ||
          (i as any).companyName === projectId
        );
        filteredExpenses = allExpenses.filter(e => 
          e.divisionId === projectId || 
          e.brand === projectId || 
          e.client === projectId
        );
    }

    // Calculations (Requirement 6: include draft, unpaid, paid)
    const isQuote = (i: Invoice) => i.isQuotation || i.type === 'quotation' || ['Quotation', 'Draft', 'Approved'].includes(i.status);
    const revenueInvoices = filteredInvoices.filter(i => !isQuote(i));
    const quotes = filteredInvoices.filter(i => isQuote(i));

    const totalRevenue = revenueInvoices.reduce((sum, inv) => {
        const total = inv.total || inv.totalAmount || (inv.items?.reduce((s, it) => s + (it.price * it.quantity), 0) || 0);
        return sum + total;
    }, 0);

    const recoveredAmount = revenueInvoices.reduce((sum, inv) => {
        if (inv.status === 'Paid') {
            return sum + (inv.total || inv.totalAmount || (inv.items?.reduce((s, it) => s + (it.price * it.quantity), 0) || 0));
        }
        return sum + (inv.paidAmount || 0);
    }, 0);

    const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);

    return {
      totalRevenue,
      recoveredAmount,
      pendingAmount: totalRevenue - recoveredAmount,
      totalExpenses,
      profit: totalRevenue - totalExpenses,
      invoices: revenueInvoices,
      quotes: quotes,
      expenses: filteredExpenses
    };
  },

  getQuoteById: async (id: string) => {
    console.log('[API] Looking for Quote:', id);
    // Attempt real backend call first
    try {
      const resp = await fetchApi(`/quotes/${id}`);
      console.log('[API] Found in Backend:', resp);
      return resp;
    } catch (err) {
      // Fallback to unified storage (artisans_invoices)
      console.warn("Backend /quotes/:id not found, falling back to local unified store", err);
      const invoices = JSON.parse(localStorage.getItem(INVOICE_KEY) || "[]");
      const found = invoices.find((i: Invoice) => (String(i.id) === id || String(i._id) === id) && (i.isQuotation || i.type === 'quotation'));
      
      console.log('[API] Local Lookup result:', found ? 'FOUND' : 'NOT FOUND', found);
      
      if (!found) {
        throw new Error(`404: Quotation record '${id}' not found in local cluster.`);
      }
      return found;
    }
  },

  saveQuote: async (quote: Invoice) => {
    checkClientBlock("Create/Edit Quote");
    const quoteData = { 
        ...quote, 
        isQuotation: true, 
        type: 'quotation' as const,
        brandId: quote.brandId || 'All'
    };
    
    console.log('[API] Saving Quote:', quoteData);
    // Always save to unified store
    const saved = await api.saveInvoice(quoteData as any);
    console.log('[API] Quote Saved Successfully:', saved);
    return saved;
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
    checkClientBlock("Manage Divisions");
    await delay(200);
    const divisions = await api.getDivisions();
    const idx = divisions.findIndex(d => d.id === division.id);
    if (idx >= 0) divisions[idx] = division;
    else divisions.push(division);
    localStorage.setItem("divisions", JSON.stringify(divisions));
    return division;
  },
  deleteDivision: async (id: string) => {
    checkClientBlock("Manage Divisions");
    await delay(200);
    const divisions = await api.getDivisions();
    const filtered = divisions.filter(d => d.id !== id);
    localStorage.setItem("divisions", JSON.stringify(filtered));
  },

  // Companies (Legacy Ref)
  getCompanies: async () => fetchApi('/brands').catch(() => getDB().companies),

  // Expenses
  getExpenses: async () => fetchApi('/finance/expenses').catch(() => getDB().expenses),
  saveExpense: async (expense: Expense & { _id?: string }) => {
    checkClientBlock("Manage Expenses");
    if (expense._id) {
      return fetchApi(`/finance/expenses/${expense._id}`, { method: 'PUT', body: JSON.stringify(expense) });
    }
    return fetchApi('/finance/expenses', { method: 'POST', body: JSON.stringify(expense) });
  },
  deleteExpense: async (id: string) => {
    checkClientBlock("Delete Expense");
    return fetchApi(`/finance/expenses/${id}`, { method: 'DELETE' });
  },

  // Tasks
  getTasks: async () => { await delay(); return getDB().tasks; },
  saveTask: async (task: Task) => {
    checkClientBlock("Manage Tasks");
    await delay();
    const db = getDB();
    const idx = db.tasks.findIndex(t => t.id === task.id);
    if (idx >= 0) db.tasks[idx] = task;
    else db.tasks.push(task);
    saveDB(db);
  },
  deleteTask: async (id: string) => {
    checkClientBlock("Delete Task");
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
    checkClientBlock("Manage Staff");
    await delay();
    const current = await api.getStaff();
    const idx = current.findIndex(s => s.id === staff.id);
    if (idx >= 0) current[idx] = staff;
    else current.push(staff);
    localStorage.setItem(STAFF_KEY, JSON.stringify(current));
  },
  deleteStaff: async (id: string) => {
    checkClientBlock("Delete Staff");
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
  }
};
