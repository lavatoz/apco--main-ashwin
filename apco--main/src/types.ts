
export const BookingStatus = {
  Confirmed: 'Confirmed',
  Pending: 'Pending',
  Completed: 'Completed',
  Cancelled: 'Cancelled'
} as const;

export const InvoiceStatus = {
  Paid: 'Paid',
  Unpaid: 'Unpaid',
  Overdue: 'Overdue',
  Draft: 'Draft'
} as const;

export type Brand = 'Aaha Kalayanam' | 'Tiny Toes';

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
}

export interface Feedback {
  id: string;
  date: string;
  text: string;
  from: 'Client' | 'Company';
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  weddingDate: string; // ISO Date string or Event Date
  budget: number;
  notes: string;
  brand: Brand;
  portal?: {
    timeline: TimelineItem[];
    deliverables: Deliverable[];
    feedback: Feedback[];
  };
}

export interface Booking {
  id: string;
  clientId: string;
  title: string;
  date: string; // ISO Date string
  status: typeof BookingStatus[keyof typeof BookingStatus];
  type: string; // Flexible for Indian event types
  brand: Brand;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
}

export interface Invoice {
  id: string;
  clientId: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  status: typeof InvoiceStatus[keyof typeof InvoiceStatus];
  notes?: string;
  brand: Brand;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: 'Labor' | 'Equipment' | 'Travel' | 'Vendor' | 'Marketing' | 'Other';
  clientId?: string; // Optional: if null, it's general overhead
  brand: Brand;
}

export type ViewState = 'DASHBOARD' | 'CLIENTS' | 'CALENDAR' | 'FINANCE' | 'AI_TOOLS' | 'CLIENT_PORTAL';
