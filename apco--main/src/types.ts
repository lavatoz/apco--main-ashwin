
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
  type: 'Login' | 'AssetView' | 'RequirementAdded' | 'SystemUpdate' | 'FinanceUpdate' | 'TaskUpdate' | 'ClientUpdate' | 'Update';
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
  _id?: string;
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
  _id: string;
  projectName: string;
  name?: string;
  address?: string;
  mapLocation?: string;
  weddingDate?: string;
  eventDate?: string;
  budget?: number;
  notes: string;
  brand: string;
  brandId?: any;
  vaultId?: string;
  driveFolderId?: string;
  people: Person[];
  requirements?: ClientRequirement[];
  portal?: {
    timeline: TimelineItem[];
    deliverables: Deliverable[];
    internalSpends: InternalSpend[];
  };
  allowedClients?: any[];
  eventType?: string;
  status: 'pending' | 'uploaded' | 'selected' | 'completed';
}

export interface GalleryImage {
  _id?: string;
  path: string;
  name?: string;
  uploadedAt: string;
}

export interface Gallery {
  _id: string;
  clientId: string;
  images: GalleryImage[];
  selectedImages: string[];
  status: 'pending' | 'uploaded' | 'selected' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  _id: string;
  name: string;
  client: string | Client;
  description?: string;
  status: 'booked' | 'event_completed' | 'photo_selection' | 'post_production' | 'album_printing';
  brandId: string;
  allowedClients?: any[];
  images: {
    _id: string;
    url: string;
    isSelected: boolean;
    uploadedAt: string;
  }[];
  assignedTo?: string;
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
}

export interface Invoice {
  _id: string;
  id?: string;
  client: any;
  project: any;
  amount: number;
  status: 'unpaid' | 'paid';
  type: 'invoice' | 'quotation';
  brandId: string;
  createdAt: string;
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
