import { BookingStatus, InvoiceStatus, TaskStatus, type ActivityLog, type Booking, type Client, type CloudConfig, type Company, type Expense, type Invoice, type Staff, type Task } from "../types";


const STORAGE_KEY = 'apco_enterprise_db_v5';
const STAFF_KEY = 'apco_staff_registry';
const ACTIVITY_LOGS_KEY = 'apco_activity_logs';
const CLOUD_CONFIG_KEY = 'apco_cloud_config';

const delay = (ms: number = 400) => new Promise(resolve => setTimeout(resolve, ms));

interface DBStructure {
  clients: Client[];
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
  },
  {
    id: 'STAFF-002',
    name: 'Priya Verma',
    email: 'priya@artisans.co',
    loginId: 'staff_priya',
    role: 'Account Manager',
    isActive: true,
    permissions: {
      canManageClients: true,
      canManageFinance: false,
      canManageTasks: true,
      canUseAI: true,
      canManageEcosystem: false
    }
  },
  {
    id: 'STAFF-003',
    name: 'Arjun Singh',
    email: 'arjun@artisans.co',
    loginId: 'staff_arjun',
    role: 'Editor',
    isActive: true,
    permissions: {
      canManageClients: false,
      canManageFinance: false,
      canManageTasks: true,
      canUseAI: false,
      canManageEcosystem: false
    }
  }
];

const getInitialDB = (): DBStructure => ({
  companies: [
    { id: '1', name: 'AAHA Kalyanam', ownerName: 'Artisan Owner', phone: '9876543210', email: 'wedding@artisans.co', color: '#fbbf24', type: 'Wedding', description: 'Luxury Wedding Production' },
    { id: '2', name: 'Tiny Toes', ownerName: 'Artisan Owner', phone: '9876543211', email: 'kids@artisans.co', color: '#3b82f6', type: 'Kids', description: 'Premium Child Photography' }
  ],
  clients: [
    {
      id: 'ART-2025-001',
      projectName: 'Ananya & Vikram Wedding',
      weddingDate: '2025-11-20',
      budget: 1500000,
      notes: 'Grand destination wedding in Udaipur.',
      brand: 'AAHA Kalyanam',
      people: [
        { id: 'P1', name: 'Ananya Sharma', role: 'Bride', email: 'ananya@example.com', phone: '9000000001', loginId: 'ananya', dateOfBirth: '1995-05-15' },
        { id: 'P2', name: 'Vikram Singh', role: 'Groom', email: 'vikram@example.com', phone: '9000000002', loginId: 'vikram' }
      ],
      portal: {
        timeline: [
          { id: 'T1', title: 'Location Scouting', date: '2025-03-10', status: 'Completed', description: 'Udaipur palace visits' },
          { id: 'T2', title: 'Vendor Finalization', date: '2025-05-15', status: 'In Progress', description: 'Catering and Decor' },
          { id: 'T3', title: 'Shoot Schedule', date: '2025-11-20', status: 'Pending', description: 'Main Event Coverage' }
        ],
        deliverables: [
          { id: 'D1', title: 'Engagement Highlights', url: 'https://vimeo.com/12345678', type: 'Video', dateAdded: new Date().toISOString(), origin: 'InternalServer', isPublic: true },
          { id: 'D2', title: 'Pre-Wedding Album', url: 'https://drive.google.com/drive/u/0/folders/example', type: 'Photos', dateAdded: new Date().toISOString(), origin: 'GoogleDrive', isPublic: true }
        ],
        internalSpends: []
      }
    },
    {
      id: 'ART-2025-002',
      projectName: 'Baby Karan First Year',
      weddingDate: '2025-08-12',
      budget: 50000,
      notes: 'Monthly milestone shoots for Baby Karan.',
      brand: 'Tiny Toes',
      people: [
        { id: 'P3', name: 'Karan Mehra', role: 'Parent', email: 'karan@example.com', phone: '9000000003', loginId: 'karan', dateOfBirth: '2024-08-12' },
        { id: 'P4', name: 'Sonia Mehra', role: 'Parent', email: 'sonia@example.com', phone: '9000000004', loginId: 'sonia' }
      ],
      portal: {
        timeline: [
          { id: 'T4', title: '6 Month Shoot', date: '2025-02-12', status: 'Completed', description: 'Studio shoot with props' },
          { id: 'T5', title: 'First Birthday Bash', date: '2025-08-12', status: 'Pending', description: 'Grand party coverage' }
        ],
        deliverables: [
          { id: 'D3', title: 'Half Birthday Film', url: '#', type: 'Video', dateAdded: new Date().toISOString(), origin: 'InternalServer', isPublic: true }
        ],
        internalSpends: []
      }
    }
  ],
  invoices: [
    {
      id: 'INV-1001',
      clientId: 'ART-2025-001',
      issueDate: new Date().toISOString(),
      dueDate: '2025-06-01',
      brand: 'AAHA Kalyanam',
      status: InvoiceStatus.Unpaid,
      items: [
        { id: 'I1', description: 'Production Retainer', quantity: 1, price: 100000, costPrice: 40000, isOutsourced: false },
        { id: 'I2', description: 'Outsourced Lighting Gear', quantity: 1, price: 25000, costPrice: 15000, isOutsourced: true, vendorName: 'ProLight Rental' }
      ]
    },
    {
      id: 'INV-1002',
      clientId: 'ART-2025-002',
      issueDate: new Date().toISOString(),
      dueDate: '2025-03-01',
      brand: 'Tiny Toes',
      status: InvoiceStatus.Paid,
      items: [
        { id: 'I3', description: 'Package A (12 Months)', quantity: 1, price: 50000, costPrice: 10000, isOutsourced: false }
      ]
    }
  ],
  bookings: [
    { id: 'B1', clientId: 'ART-2025-001', title: 'Main Wedding', date: '2025-11-20', status: BookingStatus.Confirmed, type: 'Grand Event', brand: 'AAHA Kalyanam' },
    { id: 'B2', clientId: 'ART-2025-002', title: 'Cake Smash', date: '2025-08-10', status: BookingStatus.Confirmed, type: 'Studio', brand: 'Tiny Toes' }
  ],
  expenses: [
    { id: 'EXP-001', description: 'Instagram Ads', amount: 5000, date: new Date().toISOString(), category: 'Marketing', brand: 'AAHA Kalyanam' },
    { id: 'EXP-002', description: 'Office Rent', amount: 30000, date: new Date().toISOString(), category: 'Other', brand: 'AAHA Kalyanam' }
  ],
  tasks: [
    { id: 'TSK-1', title: 'Edit Ananya Teaser', assignee: 'Arjun Singh', dueDate: '2025-04-10', status: TaskStatus.InProgress, brand: 'AAHA Kalyanam', priority: 'High' },
    { id: 'TSK-2', title: 'Send Payment Reminder to Karan', assignee: 'Priya Verma', dueDate: '2025-04-05', status: TaskStatus.Todo, brand: 'Tiny Toes', priority: 'Medium' }
  ],
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
  // Clients
  getClients: async () => { await delay(); return getDB().clients; },
  saveClient: async (client: Client) => {
    await delay();
    const db = getDB();
    const idx = db.clients.findIndex(c => c.id === client.id);
    if (idx >= 0) db.clients[idx] = client;
    else db.clients.push(client);
    saveDB(db);
  },

  // Invoices
  getInvoices: async () => { await delay(); return getDB().invoices; },
  saveInvoice: async (invoice: Invoice) => {
    await delay();
    const db = getDB();
    const idx = db.invoices.findIndex(i => i.id === invoice.id);
    if (idx >= 0) db.invoices[idx] = invoice;
    else db.invoices.push(invoice);
    saveDB(db);
  },
  updateInvoiceStatus: async (id: string, status: InvoiceStatus) => {
    await delay();
    const db = getDB();
    const idx = db.invoices.findIndex(i => i.id === id);
    if (idx >= 0) db.invoices[idx].status = status;
    saveDB(db);
  },

  // Companies (Brands)
  getCompanies: async () => { await delay(); return getDB().companies; },
  saveCompany: async (company: Company) => {
    await delay();
    const db = getDB();
    const idx = db.companies.findIndex(c => c.id === company.id);
    if (idx >= 0) db.companies[idx] = company;
    else db.companies.push(company);
    saveDB(db);
  },

  // Expenses
  getExpenses: async () => { await delay(); return getDB().expenses; },
  saveExpense: async (expense: Expense) => {
    await delay();
    const db = getDB();
    const idx = db.expenses.findIndex(e => e.id === expense.id);
    if (idx >= 0) db.expenses[idx] = expense;
    else db.expenses.push(expense);
    saveDB(db);
  },
  deleteExpense: async (id: string) => {
    await delay();
    const db = getDB();
    db.expenses = db.expenses.filter(e => e.id !== id);
    saveDB(db);
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
    await delay();
    const data = localStorage.getItem(ACTIVITY_LOGS_KEY);
    return data ? JSON.parse(data) : [];
  },
  logActivity: async (log: Omit<ActivityLog, 'id' | 'timestamp'>) => {
    const logs = await api.getLogs();
    const newLog: ActivityLog = {
      ...log,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    localStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify(logs.slice(0, 100))); // Keep last 100 logs
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
