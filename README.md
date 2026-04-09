# APCO Business Management Dashboard

APCO is a business management dashboard for event planning brands, built with React, TypeScript, and Vite. It helps manage clients, bookings, finances, and client portals, supporting multiple brands (e.g., "Aaha Kalayanam", "Tiny Toes").

## Features

- **Dashboard:** View business metrics, revenue, and upcoming events.
- **Client Manager:** Add, search, and manage clients for each brand.
- **Finance Manager:** Track invoices, expenses, and profitability.
- **Client Portal:** Share timelines, deliverables, and feedback with clients.
- **AI Tools:** Draft emails and analyze business trends using AI (Gemini integration).
- **Data Storage:** Local storage with import/export support.
- **Multi-brand Support:** Manage multiple event brands in one place.

## Getting Started

1. **Install dependencies:**
   ```sh
   npm install
   ```
2. **Run the app:**
   ```sh
   npm run dev
   ```
3. **Open in browser:**
   Visit [http://localhost:5173](http://localhost:5173)

## Project Structure

- `src/components/` — UI components (Dashboard, ClientManager, FinanceManager, Sidebar, etc.)
- `src/services/` — Business logic and storage/AI helpers
- `src/types.ts` — TypeScript types for clients, bookings, invoices, etc.
- `public/` — Static assets

## Technologies Used
- React
- TypeScript
- Vite
- Tailwind CSS
- Local Storage
- [Gemini AI](https://ai.google.dev/gemini-api/docs) (for email/trend analysis)

## License
MIT

## Development Progress & Milestones

Based on recent development phases, we have built out the **APCO ERP** system into a feature-rich, full-stack application with a cinematic dark design system.

### 🏢 APCO ERP Core Development
1. **Authentication & Security**
   - Implemented a robust **Role-Based Authentication Flow**, ensuring separate and secure access for `staff` and `client` roles.
   - Built a **Multi-Factor Authentication (MFA)** login flow to enhance platform security.
   - Fixed several login state edge-cases preventing UI freezes and role-mismatches.

2. **Project & Workflow Management**
   - Deployed an interactive **Project Board**, featuring a drag-and-drop Kanban interface for tracking tasks and status.
   - Developed a **Secure Document Vault** for safely storing, retrieving, and managing both client and internal documents.

3. **Finance & Ledger System**
   - Built a **Real-Time Ledger System** that handles invoices and quotations.
   - Resolved UI filtering so "All", "Unpaid", "Paid", and "Quotations" tabs accurately reflect creation and payment workflows dynamically.

4. **Photography Workflow Integration**
   - Setup a heavy-duty backend for **Photography Asset Management**, allowing client selection and status tracking.
   - Synchronized the React **Gallery component** with the backend for image coordination and client approval workflows.
   - Integrated AI-based **Face Recognition** (via a specialized Python service `face_match.py`) to potentially enrich media workflows.

5. **Codebase Health & Refactoring**
   - Squashed numerous React/TypeScript warnings and runtime errors across critical components like `ClientManager.tsx` and `App.tsx` (e.g., resolving unused variable checks, dependency mismatches, and build errors).

### 🛠️ Standalone Technical Projects
Outside of the main ERP components, development has included highly specialized tasks:
- **Cybersecurity / Reverse Engineering:** Analyzed outputs from a custom "Military-grade Random Number Generator" to predict numbers and solve a CTF-style challenge.
- **Digital Forensics:** Built a recursive Python forensic tool for retail data breaches (extracting MAC times, hashing files, and flagging out-of-hours anomalies).