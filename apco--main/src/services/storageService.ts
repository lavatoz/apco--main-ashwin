import type { Client, Invoice, Booking, Expense } from "../types";

const STORAGE_KEY = "apco_crm_data_secure_v1";

interface AppData {
  clients: Client[];
  invoices: Invoice[];
  bookings: Booking[];
  expenses: Expense[];
  lastSynced: string;
}

// Simple XOR encryption for demonstration purposes using the email as a key
// In a real production app, use Web Crypto API (AES-GCM)
const xorCipher = (text: string, key: string): string => {
  let result = "";
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(
      text.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return result;
};

export const saveToStorage = (
  clients: Client[],
  invoices: Invoice[],
  bookings: Booking[],
  expenses: Expense[]
) => {
  try {
    const data: AppData = {
      clients,
      invoices,
      bookings,
      expenses,
      lastSynced: new Date().toISOString(),
    };
    // Save plain text to local storage for persistence during session,
    // but the "Drive" export will be encrypted.
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

export const exportToDrive = (
  clients: Client[],
  invoices: Invoice[],
  bookings: Booking[],
  expenses: Expense[],
  email: string
) => {
  if (!email) {
    alert("Registered Email ID required to encrypt the file.");
    return;
  }

  const payload = JSON.stringify({
    clients,
    invoices,
    bookings,
    expenses,
    lastSynced: new Date().toISOString(),
    owner: email, // Bind file to this email
  });

  // Encrypt
  const encrypted = xorCipher(payload, email);
  const b64 = btoa(encrypted); // Base64 encode to ensure file safety

  const blob = new Blob([b64], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  // Custom extension for AP Co.
  a.download = `apco_secure_backup_${
    new Date().toISOString().split("T")[0]
  }.apco`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importFromDrive = async (
  file: File,
  email: string
): Promise<AppData | null> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        // 1. Decode Base64
        const decoded = atob(content);
        // 2. Decrypt with Email
        const decrypted = xorCipher(decoded, email);
        // 3. Parse JSON
        const data = JSON.parse(decrypted);

        if (data.owner && data.owner !== email) {
          reject(
            "Security Alert: This file does not belong to the registered email ID."
          );
          return;
        }

        resolve({
          clients: data.clients || [],
          invoices: data.invoices || [],
          bookings: data.bookings || [],
          expenses: data.expenses || [],
          lastSynced: data.lastSynced || new Date().toISOString(),
        });
      } catch (err) {
        reject("Decryption failed. Invalid File or Wrong Email ID.");
      }
    };
    reader.readAsText(file);
  });
};
