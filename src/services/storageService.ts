
import type { Client, Invoice, Booking, Expense, Company } from '../types';

const STORAGE_KEY = 'apco_crm_data_secure_v2';

interface AppData {
  clients: Client[];
  invoices: Invoice[];
  bookings: Booking[];
  expenses: Expense[];
  companies: Company[];
  lastSynced: string;
}

const xorCipher = (text: string, key: string): string => {
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
};

export const saveToStorage = (clients: Client[], invoices: Invoice[], bookings: Booking[], expenses: Expense[], companies: Company[]) => {
  try {
    const data: AppData = {
      clients,
      invoices,
      bookings,
      expenses,
      companies,
      lastSynced: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data locally", e);
  }
};

export const loadFromStorage = (): AppData | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error("Failed to load data", e);
    return null;
  }
};

export const exportToDrive = (clients: Client[], invoices: Invoice[], bookings: Booking[], expenses: Expense[], companies: Company[], email: string) => {
  if (!email) {
    alert("Registered Email ID required to encrypt the file.");
    return;
  }

  const payload = JSON.stringify({ 
    clients, 
    invoices, 
    bookings, 
    expenses,
    companies,
    lastSynced: new Date().toISOString(),
    owner: email 
  });

  const encrypted = xorCipher(payload, email);
  const b64 = btoa(encrypted); 

  const blob = new Blob([b64], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `apco_enterprise_backup_${new Date().toISOString().split('T')[0]}.apco`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
