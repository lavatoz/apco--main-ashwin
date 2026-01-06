
export const BookingStatus = {
  Confirmed: 'Confirmed',
  Pending: 'Pending',
  Completed: 'Completed',
  Cancelled: 'Cancelled'
} as const;

export type BookingStatus = typeof BookingStatus[keyof typeof BookingStatus];

export const InvoiceStatus = {
  Paid: 'Paid',
  Unpaid: 'Unpaid',
  Overdue: 'Overdue',
  Draft: 'Draft',
  Quotation: 'Quotation'
} as const;

export type InvoiceStatus = typeof InvoiceStatus[keyof typeof InvoiceStatus];

export const TaskStatus = {
  Todo: 'Todo',
  InProgress: 'In Progress',
  Done: 'Done'
} as const;

export type TaskStatus = typeof TaskStatus[keyof typeof TaskStatus];

export interface StorageVault {
  id: string;
  name: string;
  email: string;
  usagePercent: number;
}

export interface InternalSpend {
  id: string;
  description: string;
  amount: number;
  date: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  type: 'Login' | 'AssetView' | 'RequirementAdded' | 'SystemUpdate' | 'FinanceUpdate' | 'TaskUpdate' | 'ClientUpdate';
  actorId: string;
  actorName: string;
  actorRole: 'Admin' | 'Staff' | 'Client';
  projectId?: string;
  clientId?: string;
  clientName?: string;
}

export interface ClientRequirement {
  id: string;
  timestamp: string;
  text: string;
  status: 'Pending' | 'Acknowledged' | 'Resolved';
}

export interface Task {
  id: string;
  title: string;
  assignee: string;
  dueDate: string;
  status: string;
  brand: string;
  priority: string;
}

export interface Company {
  id: string;
  name: string;
  ownerName: string;
  phone: string;
  email: string;
  color: string;
  type: 'Wedding' | 'Kids' | 'General';
  description?: string;
}

export interface TimelineItem {
  id: string;
  title: string;
  date: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  description?: string;
}

export interface Deliverable {
  id: string;
  title: string;
  url: string;
  type: 'Video' | 'Photos' | 'Document' | 'Other';
  dateAdded: string;
  origin: 'GoogleDrive' | 'InternalServer' | 'Other';
  isPublic?: boolean;
  assignedTo?: string;
}

export interface StaffPermissions {
  canManageClients: boolean;
  canManageFinance: boolean;
  canManageTasks: boolean;
  canUseAI: boolean;
  canManageEcosystem: boolean;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  loginId: string;
  password?: string;
  role: string;
  permissions: StaffPermissions;
  isActive: boolean;
}

export interface Person {
  id: string;
  name: string;
  role: 'Groom' | 'Bride' | 'Parent' | 'Other';
  email: string;
  phone: string;
  alternatePhone?: string;
  loginId: string;
  password?: string;
  dateOfBirth?: string;
}

export interface Client {
  id: string;
  projectName: string;
  address?: string;
  mapLocation?: string;
  weddingDate: string;
  budget: number;
  notes: string;
  brand: string;
  vaultId?: string;
  driveFolderId?: string;
  people: Person[];
  requirements?: ClientRequirement[];
  portal?: {
    timeline: TimelineItem[];
    deliverables: Deliverable[];
    internalSpends: InternalSpend[];
  };
}

export interface Booking {
  id: string;
  clientId: string;
  title: string;
  date: string;
  status: BookingStatus;
  type: string;
  brand: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  costPrice: number;
  isOutsourced?: boolean;
  vendorName?: string;
  vendorPhone?: string;
  isCostFinalized?: boolean;
}

export interface Invoice {
  id: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  status: InvoiceStatus;
  notes?: string;
  brand: string;
  isQuotation?: boolean;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  clientId?: string;
  brand: string;
}

export interface CloudConfig {
  serverUrl: string;
  vaults: StorageVault[];
  autoBackup: boolean;
  mediaOrigin: 'InternalServer' | 'GoogleDrive';
}

export type ViewState = 'DASHBOARD' | 'CLIENTS' | 'CALENDAR' | 'FINANCE' | 'AI_TOOLS' | 'CLIENT_PORTAL' | 'SETTINGS' | 'TASKS' | 'TEAM' | 'LOGS' | 'PRODUCTION';
