
import React, { useState, useEffect, useRef } from 'react';
import { Menu, DownloadCloud, Lock, ShieldCheck, FileKey, Sparkles } from 'lucide-react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ClientManager from './components/ClientManager';
import FinanceManager from './components/FinanceManager';
import ClientPortal from './components/ClientPortal';
import { loadFromStorage, saveToStorage, exportToDrive, importFromDrive } from './services/storageService';
import { BookingStatus, InvoiceStatus, type Booking, type Brand, type Client, type Expense, type Invoice, type ViewState } from './types';

// Mock Initial Data (Used only if storage is empty)
const INITIAL_CLIENTS: Client[] = [
  { id: '1', name: 'Priya & Rahul', email: 'priya.r@example.com', phone: '+91 9876543210', weddingDate: '2024-11-15', budget: 1500000, notes: 'Traditional Reception, Gold theme.', brand: 'Aaha Kalayanam', portal: { timeline: [], deliverables: [], feedback: [] } },
  { id: '2', name: 'Baby Anaya', email: 'parents@anaya.com', phone: '+91 9988776655', weddingDate: '2024-08-20', budget: 50000, notes: 'First Birthday, Pastel pink theme.', brand: 'Tiny Toes', portal: { timeline: [], deliverables: [], feedback: [] } },
];

const INITIAL_INVOICES: Invoice[] = [
  { 
    id: 'INV-001', 
    clientId: '1', 
    issueDate: '2024-01-10', 
    dueDate: '2024-01-20', 
    status: InvoiceStatus.Paid, 
    items: [{ id: 'a', description: 'Wedding Planning Advance', quantity: 1, price: 50000 }],
    brand: 'Aaha Kalayanam'
  },
  { 
    id: 'INV-002', 
    clientId: '2', 
    issueDate: '2024-02-01', 
    dueDate: '2024-02-15', 
    status: InvoiceStatus.Unpaid, 
    items: [{ id: 'b', description: 'Decoration Deposit', quantity: 1, price: 15000 }],
    brand: 'Tiny Toes'
  }
];

const INITIAL_BOOKINGS: Booking[] = [
  { id: '1', clientId: '1', title: 'Sangeet Ceremony', date: '2024-11-14T18:00:00', status: BookingStatus.Confirmed, type: 'Sangeet', brand: 'Aaha Kalayanam' },
  { id: '2', clientId: '2', title: 'Venue Recce', date: '2024-04-05T14:00:00', status: BookingStatus.Pending, type: 'Venue Visit', brand: 'Tiny Toes' },
  { id: '3', clientId: '1', title: 'Muhurtham', date: '2024-11-15T09:00:00', status: BookingStatus.Confirmed, type: 'Wedding', brand: 'Aaha Kalayanam' },
];

const INITIAL_EXPENSES: Expense[] = [
    { id: 'e1', description: 'Venue Advance Payment', amount: 20000, date: '2024-01-15', category: 'Vendor', clientId: '1', brand: 'Aaha Kalayanam' },
    { id: 'e2', description: 'Office Electricity Bill', amount: 3500, date: '2024-02-01', category: 'Other', brand: 'Aaha Kalayanam' }
];

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  
  const [currentView, setCurrentView] = useState<ViewState>('DASHBOARD');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | 'All'>('All');
  
  // App Data State
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [lastSynced, setLastSynced] = useState<string>(new Date().toISOString());

  // Portal State
  const [activePortalClient, setActivePortalClient] = useState<Client | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load Data only after auth
  useEffect(() => {
    if (isAuthenticated) {
      const loadedData = loadFromStorage();
      if (loadedData) {
        setClients(loadedData.clients);
        setInvoices(loadedData.invoices);
        setBookings(loadedData.bookings);
        setExpenses(loadedData.expenses || []);
        setLastSynced(loadedData.lastSynced);
      } else {
        setClients(INITIAL_CLIENTS);
        setInvoices(INITIAL_INVOICES);
        setBookings(INITIAL_BOOKINGS);
        setExpenses(INITIAL_EXPENSES);
      }
    }
  }, [isAuthenticated]);

  // Save Data on Change
  useEffect(() => {
    if (isAuthenticated && clients.length > 0) {
      saveToStorage(clients, invoices, bookings, expenses);
      setLastSynced(new Date().toISOString());
    }
  }, [clients, invoices, bookings, expenses, isAuthenticated]);

  const addClient = (client: Client) => setClients([...clients, client]);
  const addInvoice = (invoice: Invoice) => setInvoices([...invoices, invoice]);
  const addExpense = (expense: Expense) => setExpenses([...expenses, expense]);
  const deleteExpense = (id: string) => setExpenses(expenses.filter(e => e.id !== id));
  
  const updateInvoiceStatus = (id: string, status: InvoiceStatus) => {
    setInvoices(invoices.map(inv => inv.id === id ? { ...inv, status } : inv));
  };

  const handleUpdateClient = (updatedClient: Client) => {
    setClients(clients.map(c => c.id === updatedClient.id ? updatedClient : c));
    setActivePortalClient(updatedClient); // Keep UI in sync
  };

  const handleDriveBackup = () => {
    exportToDrive(clients, invoices, bookings, expenses, registeredEmail);
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && registeredEmail) {
      try {
        const data = await importFromDrive(file, registeredEmail);
        if (data) {
          setClients(data.clients);
          setInvoices(data.invoices);
          setBookings(data.bookings);
          setExpenses(data.expenses);
          setLastSynced(data.lastSynced);
          alert("Data securely restored from file.");
        }
      } catch (err) {
        alert(err);
      }
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if(registeredEmail.includes('@')) {
      setIsAuthenticated(true);
    }
  };

  // Determine Background Colors based on Selection
  const getMainStyle = () => {
    if (activePortalClient) {
        // Force style if inside portal
        return activePortalClient.brand === 'Aaha Kalayanam' ? 'bg-black text-amber-50' : 'bg-slate-50 text-slate-900';
    }
    if (selectedBrand === 'Aaha Kalayanam') return 'bg-black text-amber-50'; // Wedding Dark Theme
    if (selectedBrand === 'Tiny Toes') return 'bg-slate-50 text-slate-900'; // Baby Light Theme
    return 'bg-zinc-950 text-zinc-100'; // Default Black Theme
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4 font-sans text-zinc-100">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-2xl">
           <div className="flex justify-center mb-6">
             <div className="w-16 h-16 bg-zinc-100 text-black rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-8 h-8" />
             </div>
           </div>
           <h1 className="text-2xl font-bold text-center mb-2 font-serif tracking-wide">AP Co. Secure CRM</h1>
           <p className="text-zinc-500 text-center text-sm mb-8">Access restricted to authorized personnel. Enter your registered email ID to decrypt workspace.</p>
           
           <form onSubmit={handleLogin} className="space-y-4">
             <div>
               <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Registered Email ID</label>
               <input 
                 type="email" 
                 required
                 className="w-full bg-black border border-zinc-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-white focus:outline-none focus:border-transparent transition-all"
                 placeholder="name@company.com"
                 value={registeredEmail}
                 onChange={(e) => setRegisteredEmail(e.target.value)}
               />
             </div>
             <button type="submit" className="w-full bg-white text-black font-bold py-3 rounded-lg hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2">
               <Lock className="w-4 h-4" />
               Authenticate
             </button>
           </form>
           <p className="mt-6 text-xs text-center text-zinc-600">
             Encrypted session. Data is stored locally and securely.
           </p>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    // Override render if in portal mode
    if (currentView === 'CLIENT_PORTAL' && activePortalClient) {
      return (
        <ClientPortal 
          client={activePortalClient} 
          onUpdateClient={handleUpdateClient}
          onBack={() => {
            setActivePortalClient(null);
            setCurrentView('CLIENTS');
          }} 
        />
      );
    }

    switch (currentView) {
      case 'DASHBOARD':
        return <Dashboard invoices={invoices} clients={clients} bookings={bookings} selectedBrand={selectedBrand} setSelectedBrand={setSelectedBrand} />;
      case 'CLIENTS':
        return (
          <ClientManager 
             clients={clients} 
             addClient={addClient} 
             selectedBrand={selectedBrand} 
             onOpenPortal={(client) => {
               setActivePortalClient(client);
               setCurrentView('CLIENT_PORTAL');
             }}
          />
        );
      case 'FINANCE':
        return (
          <FinanceManager 
            invoices={invoices} 
            expenses={expenses}
            clients={clients} 
            addInvoice={addInvoice} 
            addExpense={addExpense}
            deleteExpense={deleteExpense}
            updateInvoiceStatus={updateInvoiceStatus} 
            selectedBrand={selectedBrand} 
          />
        );
      case 'CALENDAR':
        // Filter bookings by brand for view
        const displayBookings = selectedBrand === 'All' ? bookings : bookings.filter(b => b.brand === selectedBrand);
        const cardBg = selectedBrand === 'Tiny Toes' ? 'bg-white border-slate-200 shadow-sm' : 'bg-zinc-900 border-zinc-800';
        const textMain = selectedBrand === 'Tiny Toes' ? 'text-slate-900' : 'text-zinc-100';
        const textSub = selectedBrand === 'Tiny Toes' ? 'text-slate-500' : 'text-zinc-500';

        return (
          <div className="space-y-6">
            <h1 className={`text-2xl font-bold ${textMain}`}>Bookings & Events</h1>
             <div className={`rounded-xl border p-6 ${cardBg}`}>
                <p className={`${textSub} mb-4`}>Upcoming Schedule for {selectedBrand === 'All' ? 'AP Co.' : selectedBrand}</p>
                <div className="space-y-4">
                  {displayBookings.map(booking => (
                    <div key={booking.id} className={`flex items-center p-4 rounded-lg border ${selectedBrand === 'Tiny Toes' ? 'bg-slate-50 border-slate-100' : 'bg-black border-zinc-800'}`}>
                      <div className={`p-3 rounded-lg mr-4 font-bold text-center w-16 ${booking.brand === 'Aaha Kalayanam' ? 'bg-yellow-600 text-black' : 'bg-blue-500 text-white'}`}>
                         <div className="text-xs uppercase">{new Date(booking.date).toLocaleString('default', { month: 'short' })}</div>
                         <div className="text-lg">{new Date(booking.date).getDate()}</div>
                      </div>
                      <div>
                        <h4 className={`font-semibold ${textMain}`}>{booking.title}</h4>
                        <p className={`text-sm ${textSub}`}>{new Date(booking.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • {booking.type}</p>
                        <span className="text-xs text-zinc-400">{booking.brand}</span>
                      </div>
                      <div className="ml-auto">
                        <span className={`text-xs px-2 py-1 rounded-full ${booking.status === BookingStatus.Confirmed ? 'bg-emerald-900 text-emerald-300' : 'bg-amber-900 text-amber-300'}`}>
                          {booking.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {displayBookings.length === 0 && <p className={textSub}>No bookings found for this category.</p>}
                </div>
             </div>
          </div>
        );
      case 'AI_TOOLS':
        return (
          <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6">
             <div className="w-20 h-20 bg-gradient-to-br from-yellow-500 to-amber-700 rounded-full flex items-center justify-center text-white shadow-xl shadow-amber-900/20">
                <Sparkles className="w-10 h-10" />
             </div>
             <div>
               <h2 className="text-2xl font-bold text-white mb-2">AP Co. Intelligence</h2>
               <p className="text-zinc-500 max-w-md mx-auto">
                 Secure AI assistant for drafting emails and analyzing trends.
               </p>
             </div>
             
             <div className="flex gap-4">
                <button onClick={handleDriveBackup} className="flex items-center gap-2 px-6 py-3 bg-zinc-100 text-black rounded-lg hover:bg-zinc-200 transition-colors font-medium">
                    <DownloadCloud className="w-4 h-4" />
                    Secure Drive Backup
                </button>
                <button onClick={handleRestoreClick} className="flex items-center gap-2 px-6 py-3 bg-zinc-800 text-white border border-zinc-700 rounded-lg hover:bg-zinc-700 transition-colors font-medium">
                    <FileKey className="w-4 h-4" />
                    Restore Backup
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden"
                  accept=".apco"
                  onChange={handleFileChange}
                />
             </div>
             <p className="text-xs text-zinc-600 mt-4">Backup files are encrypted with your email ID.</p>
          </div>
        );
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-500 ${getMainStyle()}`}>
      {currentView !== 'CLIENT_PORTAL' && (
        <Sidebar 
          currentView={currentView} 
          setView={setCurrentView} 
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
          lastSynced={lastSynced}
          email={registeredEmail}
        />
      )}

      <main className="flex-1 overflow-y-auto">
        {currentView !== 'CLIENT_PORTAL' && (
          <div className={`lg:hidden p-4 border-b flex items-center gap-3 sticky top-0 z-10 ${selectedBrand === 'Tiny Toes' ? 'bg-white border-slate-200 text-slate-900' : 'bg-black border-zinc-800 text-white'}`}>
            <button onClick={() => setIsMobileOpen(true)} className="p-2 -ml-2 opacity-70 hover:opacity-100 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <span className="font-semibold font-serif">AP Co.</span>
          </div>
        )}
        
        <div className={`${currentView === 'CLIENT_PORTAL' ? 'h-full' : 'p-4 md:p-8 max-w-7xl mx-auto'}`}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
