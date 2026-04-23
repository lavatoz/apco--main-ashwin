
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
  Partial: 'Partial',
  Overdue: 'Overdue',
  Draft: 'Draft',
  Quotation: 'Quotation',
  Approved: 'Approved'
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
  divisionId?: string;
  priority: string;
  client?: string;
}

export interface Division {
  id: string;
  name: string;
  type: 'Wedding' | 'Kids' | 'Corporate' | 'Events' | 'General';
  createdAt: string;
  description?: string;
  color?: string;
}

export interface Company extends Division {
  ownerName?: string;
  phone?: string;
  email?: string;
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

export type UserRole = 'Admin' | 'Staff' | 'Client';

export type StaffRole = string;

export type UserPermission = 'dashboard' | 'clients' | 'tasks' | 'finance' | 'ai' | 'analytics' | 'system' | 'workflow' | 'operations' | 'files';

export interface User {
  id: string;
  email: string;
  password?: string;
  role: UserRole;
  staffRole?: StaffRole;
  permissions: UserPermission[];
  divisionIds?: string[];
  isActive: boolean;
  name?: string;
  createdAt?: string;
  inviteToken?: string;
  inviteLink?: string;
}

export interface Invite {
  token: string;
  email: string;
  role: UserRole;
  permissions: UserPermission[];
  createdAt: string;
}

export interface ActiveAgreementSnapshot {
  templateId: string;
  version: number;
  title: string;
  body: string;
  assignedAt: string;
  status: 'pending' | 'accepted' | 'revoked';
  acceptedAt?: string;
}

export interface AgreementTemplate {
  id: string;
  version: number;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
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
  brandId?: string;
  divisionId?: string;
  email?: string;
  phone?: string;
  projectType?: string;
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
  activeAgreement?: ActiveAgreementSnapshot;
}

export interface GalleryImage {
  _id?: string;
  path: string;
  name?: string;
  uploadedAt: string;
}

export interface ClientAgreement {
  clientId: string;
  version: number;
  status: "pending" | "accepted" | "expired" | "revoked";
  acceptedAt?: string;
  expiresAt?: string;
  termsText?: string;
  title?: string;
}

export interface IdDocument {
  clientId: string;
  type: "id_proof";
  fileName: string;
  fileUrl: string;
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

export type ProjectStatus = 'pending' | 'confirmed';
export type ProjectStage = 'booked' | 'event_done' | 'selection' | 'editing' | 'delivery';

export interface StaffAssignment {
  id?: string;
  name: string;
  type: 'internal' | 'external';
  payment?: number;
  assigned_dates?: string[];
}

export interface ProjectTeam {
  photographer?: StaffAssignment;
  videographer?: StaffAssignment;
  editor?: StaffAssignment;
  assistant?: StaffAssignment;
  photographers?: StaffAssignment[];
  videographers?: StaffAssignment[];
  editors?: StaffAssignment[];
  assistants?: StaffAssignment[];
}

export interface SubTask {
  id: string;
  label: string;
  isCompleted: boolean;
}

export interface Project {
  id: string;
  _id?: string;
  name: string;
  clientId: string;
  divisionId: string;
  brand: string;
  type: string;
  date: string;
  status: ProjectStatus;
  stage: ProjectStage;
  totalAmount?: number;
  team?: ProjectTeam;
  createdAt: string;
  description?: string;
  images?: {
    _id: string;
    url: string;
    isSelected: boolean;
    uploadedAt: string;
  }[];
  subTasks?: { [key in ProjectStage]?: SubTask[] };
}

export interface Booking {
  id: string;
  clientId: string;
  title: string;
  date: string;
  status: BookingStatus;
  type: string;
  brand: string;
  divisionId?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  costPrice?: number;
}

export interface PaymentRecord {
  id: string;
  amount: number;
  date: string;
}

export interface Invoice {
  _id?: string;
  id: string;
  clientId: string;
  client?: any;
  project?: any;
  amount?: number;
  totalAmount?: number;
  paidAmount?: number;
  paymentHistory?: PaymentRecord[];
  status: InvoiceStatus;
  type?: 'invoice' | 'quotation';
  isQuotation?: boolean;
  items: InvoiceItem[];
  brand?: string;
  brandId?: string;
  divisionId?: string;
  createdAt?: string;
  issueDate?: string;
  dueDate: string;
  companyLogoUrl?: string;
  paymentTerms?: string;
  taxPercent?: number;
  discountValue?: number;
  discountType?: 'flat' | 'percent';
  shippingCost?: number;
  notes?: string;
  termsSummary?: string;
  agreementAgreed?: boolean;
  agreementAccepted?: boolean;
  agreementDate?: string;
  approvalTimestamp?: string;
  idProofName?: string;
  convertedFrom?: string;
  total?: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  clientId?: string;
  client?: string;
  brand: string;
  divisionId?: string;
}

export interface CloudConfig {
  serverUrl: string;
  vaults: StorageVault[];
  autoBackup: boolean;
  mediaOrigin: 'InternalServer' | 'GoogleDrive';
}

export type ViewState = 'DASHBOARD' | 'CLIENTS' | 'CALENDAR' | 'FINANCE' | 'AI_TOOLS' | 'CLIENT_PORTAL' | 'SETTINGS' | 'TASKS' | 'TEAM' | 'LOGS' | 'PRODUCTION';

export interface CompanyProfile {
  id: string;
  companyName: string;
  tagline: string;
  projectType: string; // The link to Client.brand or Client.projectType
  logo: string; // base64
  email: string;
  phone: string;
  address: string;
  gstin: string;
  pan: string;
  website: string;
  invoicePrefix: string;
  upiId: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    ifsc: string;
    bankName: string;
  };
  paymentTerms: string;
  invoiceNotes: string;
  primaryColor: string;
  isDefault: boolean;
  createdAt: string;
}

export interface GlobalSettings {
  pdfOwnerPassword?: string;
  pdfWatermarkEnabled?: boolean;
  pdfQrEnabled?: boolean;
  pdfHashEnabled?: boolean;
  pdfSecureRenderEnabled?: boolean;
  pdfSecretSalt?: string;
  // future global settings here
}
