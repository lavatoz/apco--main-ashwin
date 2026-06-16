
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
  Approved: 'Approved',
  'Payment Submitted': 'Payment Submitted'
} as const;

export type InvoiceStatus = typeof InvoiceStatus[keyof typeof InvoiceStatus];

export const TaskStatus = {
  Pending: 'Pending',
  Assigned: 'Assigned',
  InProgress: 'In Progress',
  AwaitingReview: 'Awaiting Review',
  Completed: 'Completed',
  Overdue: 'Overdue'
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
  eventId?: string;
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

export type UserPermission = 'dashboard' | 'clients' | 'tasks' | 'finance' | 'ai' | 'analytics' | 'system' | 'workflow' | 'operations' | 'files' | 'gallery' | 'invoices' | 'agreements' | 'messages' | 'timeline' | 'deliverables' | 'support' | 'events';

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
  linkedQuoteId?: string;
}

export interface AgreementTemplate {
  id: string;
  version: number;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
}

export type EventStatus = 'Scheduled' | 'In Preparation' | 'In Progress' | 'Completed' | 'Cancelled';

export interface ClientEvent {
  id: string;
  name: string;
  date: string;
  startTime?: string;
  endTime?: string;
  progress?: number;
  actualCompletedAt?: string;
  brideLocation?: string;
  groomLocation?: string;
  venueLocation?: string;
  notes?: string;
  status: EventStatus;
}

export interface EventLogistics {
  locationType?: 'Bride' | 'Groom';
  brideAddress?: string;
  groomAddress?: string;
  venueAddress?: string;
}

export interface Client {
  id: string;
  _id?: string;
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
  events?: ClientEvent[];
  eventType?: string;
  status: 'pending' | 'uploaded' | 'selected' | 'completed';
  activeAgreement?: ActiveAgreementSnapshot;
  eventLogistics?: EventLogistics;
  venueAddress?: string;
  groomHomeAddress?: string;
  brideHomeAddress?: string;
  assignedCoordinatorId?: string;
  assignedPhotographerId?: string;
  assignedVideographerId?: string;
  assignedEditorId?: string;
  companyId?: string;
  companyName?: string;
  createdAt?: string;
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

export type ProjectStatus = 'pending' | 'confirmed' | 'Completed';
export type NewProjectStage = 'Booked' | 'Agreement Signed' | 'Advance Paid' | 'Team Assigned' | 'Shoot Completed' | 'Selection Received' | 'Editing' | 'Delivery Ready' | 'Delivered';
export type LegacyProjectStage = 'booked' | 'event_done' | 'selection' | 'editing' | 'delivery' | 'Planning' | 'Shoot' | 'Delivery';
export type ProjectStage = NewProjectStage | LegacyProjectStage;

export interface ProjectWorkflowItem {
  name: string;
  status: 'pending' | 'completed' | 'in-progress';
}

export interface StaffAssignment {
  id?: string;
  name: string;
  type: 'internal' | 'external';
  payment?: number;
  assigned_dates?: string[];
  role?: string;
  cost?: number;
  price?: number;
  eventId?: string;
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
  status: 'pending' | 'ongoing' | 'completed';
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
  stage?: ProjectStage;
  vaultId?: string;
  driveFolderId?: string;
  workflowTrigger?: {
    event: string;
    timestamp: string;
  };
  totalAmount?: number; // Legacy
  team?: any; // Can be ProjectTeam or array based on new logic
  teamSnapshot?: any;
  staffAssignments?: any[];
  services?: InvoiceItem[];
  financials?: {
    total: number;
    paid: number;
    balance: number;
  };
  workflow?: ProjectWorkflowItem[];
  createdAt: string;
  description?: string;
  images?: {
    _id: string;
    url: string;
    isSelected: boolean;
    uploadedAt: string;
  }[];
  subTasks?: { [key: string]: SubTask[] };
  stageTracking?: {
    [stageId: string]: {
      status: 'Pending' | 'In Progress' | 'Completed';
      owner?: string;
      dateStarted?: string;
      dateCompleted?: string;
      notes?: string;
      attachments?: string[];
    }
  };
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
  divisionId?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  costPrice?: number;
  cost?: number;
  markup?: number;
  rate?: number;
  total?: number;
  role?: string;
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
  paymentVerification?: {
    utrNumber: string;
    amount: number;
    screenshot?: string;
    submittedAt: string;
    status: 'pending' | 'approved' | 'rejected';
  };
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
  // Template version persistence — set at generation time, never changed after
  templateId?: string;       // e.g. 'aaha_i_v1'
  templateVersion?: string;  // e.g. '1.0.0'
  generatedPdf?: string;
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

export interface CustomThemeConfig {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  borderColor: string;
  cardBackground: string;
  glowColor: string;
  shadowStrength: string;
  cardRadius: string;
  blurIntensity: string;
  baseTheme: string;
  graphics: string;
  typography: string;
}

export interface PortalConfig {
  clientPortal: boolean;
  staffPortal: boolean;
  publicBooking: boolean;
  productionWorkflow: boolean;
  revenueModule: boolean;
  marketingHub: boolean;
}

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
  defaultAgreementTemplate?: string;
  defaultQuoteTemplate?: string;
  defaultInvoiceTemplate?: string;
  defaultProposalTemplate?: string;
  themePreset?: string;
  graphicsPreset?: string;
  typographyPreset?: string;
  customThemeId?: string;
  portalConfig?: PortalConfig;
  createdAt: string;
}

export interface GlobalSettings {
  pdfOwnerPassword?: string;
  /** Open-password shown to clients when opening the PDF. Only active when pdfPasswordMode is 'open-password'. */
  pdfUserPassword?: string;
  /**
   * 'owner-only'   — PDF opens without a password but editing/copying are restricted (default).
   * 'open-password' — PDF requires the user password to open; owner password still controls permissions.
   */
  pdfPasswordMode?: 'owner-only' | 'open-password';
  pdfWatermarkEnabled?: boolean;
  pdfQrEnabled?: boolean;
  pdfHashEnabled?: boolean;
  pdfSecureRenderEnabled?: boolean;
  pdfVerifyLinkEnabled?: boolean;
  pdfSecretSalt?: string;
  customThemes?: CustomThemeConfig[];
  // future global settings here
}

export interface CatalogCategory {
  id: string;
  name: string;
}

export interface CatalogItem {
  id: string;
  name: string;
  internalCost: number;
  sellingPrice: number;
  categoryId: string;
  workflowStage?: ProjectStage;
}

export interface AttendanceRecord {
  id: string;
  staffId: string;
  date: string;
  clockIn: string;
  clockOut?: string;
  totalHours?: number;
}

export interface Equipment {
  id: string;
  staffId?: string;
  name: string;
  type: string; // Camera, Lens, Drone, Accessory
  serialNumber?: string;
  status: 'Assigned' | 'Available' | 'Maintenance';
}

export interface ApprovalAuditTrail {
  approvedBy?: string;
  approvedDate?: string;
  rejectedBy?: string;
  rejectedDate?: string;
  notes?: string;
}

export type ApprovalType = 
  | 'Client Payment Proof Approval'
  | 'Invoice Payment Confirmation'
  | 'Expense Reimbursement Approval'
  | 'Freelancer Payment Approval'
  | 'Vendor Payment Approval'
  | 'Quotation Approval'
  | 'Discount Approval'
  | 'Refund Approval';

export interface ApprovalRecord {
  id: string;
  type: ApprovalType;
  targetId: string; // ID of the Invoice, Expense, or Quote
  targetType: 'invoice' | 'expense' | 'quotation';
  clientName: string;
  brandName?: string;
  amount: number;
  submissionDate: string;
  status: 'Pending Approval' | 'Approved' | 'Rejected';
  notes?: string;
  metadata?: any; // To store screenshots, utr numbers, etc.
  auditTrail: ApprovalAuditTrail;
}
