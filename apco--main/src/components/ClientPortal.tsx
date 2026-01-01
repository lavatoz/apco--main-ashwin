
import React, { useState } from 'react';
import { 
  ArrowLeft, CheckCircle2, Circle, Clock, Link as LinkIcon, 
  MessageSquare, Send, Sparkles, Image, Video, FileText, Share2,
  LockKeyhole, Wallet
} from 'lucide-react';
import type { Client, TimelineItem, Deliverable, Feedback, Brand, Expense } from '../types';
import { generateStatusUpdate } from '../services/geminiService';
import { loadFromStorage, saveToStorage } from '../services/storageService';

interface ClientPortalProps {
  client: Client;
  onUpdateClient: (updatedClient: Client) => void;
  onBack: () => void;
}

const ClientPortal: React.FC<ClientPortalProps> = ({ client, onUpdateClient, onBack }) => {
  const [activeTab, setActiveTab] = useState<'timeline' | 'deliverables' | 'feedback' | 'costing'>('timeline');
  const [report, setReport] = useState<string | null>(null);
  const [loadingReport, setLoadingReport] = useState(false);
  
  // Local state for inputs
  const [newFeedback, setNewFeedback] = useState('');
  const [newLink, setNewLink] = useState({ title: '', url: '', type: 'Photos' as Deliverable['type'] });

  // Internal Costing State (Loaded from global storage simulation since expenses are global)
  // In a real app with Redux/Context, we'd pull expenses from the store. 
  // Here we'll read from storage directly for the "Private" tab to keep it simple, 
  // assuming App.tsx passes expenses down would be cleaner but requires refactoring App.tsx again.
  // Actually, let's just use local state initialized from storage for display, 
  // and we might need a way to save back.
  // Ideally, ClientPortal should receive `expenses` and `addExpense`. 
  // For now, I will create a mini-form that updates the global storage via a helper or assume props.
  // *Correction*: To do this strictly correctly without prop drilling hell, I'll read/write to localStorage 
  // directly for this "Private" feature as it's an isolated add-on requested. 
  const [internalExpenses, setInternalExpenses] = useState<Expense[]>(() => {
    const data = loadFromStorage();
    return data?.expenses.filter(e => e.clientId === client.id) || [];
  });
  const [newCost, setNewCost] = useState({ description: '', amount: '', category: 'Vendor' });

  const isWedding = client.brand === 'Aaha Kalayanam';
  const isBaby = client.brand === 'Tiny Toes';

  // Theming
  const theme = {
    bg: isWedding ? 'bg-black' : 'bg-slate-50',
    card: isWedding ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-slate-200 shadow-sm',
    textMain: isWedding ? 'text-amber-50' : 'text-slate-900',
    textSub: isWedding ? 'text-zinc-500' : 'text-slate-500',
    accent: isWedding ? 'text-yellow-500' : 'text-blue-500',
    accentBg: isWedding ? 'bg-yellow-600' : 'bg-blue-500',
    button: isWedding ? 'bg-zinc-800 hover:bg-zinc-700 text-white' : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200',
    border: isWedding ? 'border-zinc-800' : 'border-slate-200'
  };

  const portalData = client.portal || { timeline: [], deliverables: [], feedback: [] };

  const handleAddTimeline = () => {
    const newItem: TimelineItem = {
      id: Date.now().toString(),
      title: 'New Milestone',
      date: new Date().toISOString(),
      status: 'Pending',
      description: 'Description here'
    };
    const updatedClient = {
      ...client,
      portal: { ...portalData, timeline: [...portalData.timeline, newItem] }
    };
    onUpdateClient(updatedClient);
  };

  const updateTimelineStatus = (id: string, status: TimelineItem['status']) => {
    const updatedTimeline = portalData.timeline.map(t => t.id === id ? { ...t, status } : t);
    onUpdateClient({ ...client, portal: { ...portalData, timeline: updatedTimeline } });
  };

  const handleAddDeliverable = () => {
    if (!newLink.title || !newLink.url) return;
    const newItem: Deliverable = {
      id: Date.now().toString(),
      title: newLink.title,
      url: newLink.url,
      type: newLink.type,
      dateAdded: new Date().toISOString()
    };
    onUpdateClient({
      ...client,
      portal: { ...portalData, deliverables: [...portalData.deliverables, newItem] }
    });
    setNewLink({ title: '', url: '', type: 'Photos' });
  };

  const handleAddFeedback = () => {
    if (!newFeedback) return;
    const item: Feedback = {
      id: Date.now().toString(),
      text: newFeedback,
      date: new Date().toISOString(),
      from: 'Company' // Since admin is using this
    };
    onUpdateClient({
      ...client,
      portal: { ...portalData, feedback: [...portalData.feedback, item] }
    });
    setNewFeedback('');
  };

  const handleAddPrivateCost = () => {
    if (!newCost.description || !newCost.amount) return;
    
    // Create new expense
    const expense: Expense = {
      id: Date.now().toString(),
      description: newCost.description,
      amount: Number(newCost.amount),
      date: new Date().toISOString(),
      category: newCost.category as any,
      clientId: client.id,
      brand: client.brand
    };

    // Update Local State
    const updatedExpenses = [...internalExpenses, expense];
    setInternalExpenses(updatedExpenses);

    // Update Storage (This is a bit hacky side-effect to avoid full app reload, but works for local app)
    const allData = loadFromStorage();
    if (allData) {
      allData.expenses.push(expense);
      saveToStorage(allData.clients, allData.invoices, allData.bookings, allData.expenses);
    }

    setNewCost({ description: '', amount: '', category: 'Vendor' });
  };

  const handleGenerateReport = async () => {
    setLoadingReport(true);
    const text = await generateStatusUpdate(client);
    setReport(text);
    setLoadingReport(false);
  };

  return (
    <div className={`min-h-full ${theme.bg} ${theme.textMain} transition-colors p-6`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className={`p-2 rounded-full ${theme.button}`}>
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-serif font-bold tracking-tight">{client.name}</h1>
            <p className={`text-sm ${theme.textSub}`}>Project Portal • {client.brand}</p>
          </div>
        </div>
        <button 
          onClick={handleGenerateReport}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${theme.accentBg} text-white`}
        >
          {loadingReport ? <Sparkles className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
          Share Update
        </button>
      </div>

      {/* Tabs */}
      <div className={`flex gap-4 border-b ${theme.border} mb-6 overflow-x-auto`}>
        {['timeline', 'deliverables', 'feedback'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`pb-3 text-sm font-medium uppercase tracking-wider transition-colors relative whitespace-nowrap ${
              activeTab === tab ? theme.accent : theme.textSub
            }`}
          >
            {tab}
            {activeTab === tab && (
              <div className={`absolute bottom-0 left-0 w-full h-0.5 ${theme.accentBg}`} />
            )}
          </button>
        ))}
        {/* Private Tab */}
        <button
            onClick={() => setActiveTab('costing')}
            className={`pb-3 text-sm font-bold uppercase tracking-wider transition-colors relative whitespace-nowrap flex items-center gap-1 ml-auto ${
              activeTab === 'costing' ? 'text-red-500' : 'text-zinc-600'
            }`}
          >
            <LockKeyhole className="w-3 h-3" />
            Private Costing
            {activeTab === 'costing' && (
              <div className="absolute bottom-0 left-0 w-full h-0.5 bg-red-500" />
            )}
        </button>
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          
          {activeTab === 'timeline' && (
            <div className={`rounded-xl p-6 border ${theme.card}`}>
              <div className="flex justify-between items-center mb-6">
                 <h2 className="text-lg font-bold">Event Timeline</h2>
                 <button onClick={handleAddTimeline} className="text-xs font-bold uppercase tracking-wider hover:underline">+ Add Phase</button>
              </div>
              <div className="space-y-8 relative pl-2">
                {/* Vertical Line */}
                <div className={`absolute left-[15px] top-2 bottom-2 w-0.5 ${isWedding ? 'bg-zinc-800' : 'bg-slate-200'}`} />
                
                {portalData.timeline.length === 0 && <p className={theme.textSub}>No timeline milestones set.</p>}

                {portalData.timeline.map((item) => (
                  <div key={item.id} className="relative flex items-start gap-4">
                    <div className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center border-2 ${
                      item.status === 'Completed' 
                        ? (isWedding ? 'bg-yellow-600 border-yellow-600 text-black' : 'bg-blue-500 border-blue-500 text-white')
                        : (isWedding ? 'bg-black border-zinc-700' : 'bg-white border-slate-300')
                    }`}>
                      {item.status === 'Completed' ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 pt-0.5">
                      <div className="flex justify-between items-start">
                        <input 
                          value={item.title}
                          onChange={(e) => {
                             const updated = portalData.timeline.map(t => t.id === item.id ? { ...t, title: e.target.value } : t);
                             onUpdateClient({...client, portal: {...portalData, timeline: updated}});
                          }}
                          className={`font-bold bg-transparent focus:outline-none border-b border-transparent focus:border-zinc-500 ${theme.textMain}`}
                        />
                        <select
                          value={item.status}
                          onChange={(e) => updateTimelineStatus(item.id, e.target.value as any)}
                          className={`text-xs p-1 rounded ${isWedding ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-100 text-slate-600'}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Completed">Completed</option>
                        </select>
                      </div>
                      <input 
                          value={item.description || ''}
                          placeholder="Add details..."
                          onChange={(e) => {
                             const updated = portalData.timeline.map(t => t.id === item.id ? { ...t, description: e.target.value } : t);
                             onUpdateClient({...client, portal: {...portalData, timeline: updated}});
                          }}
                          className={`w-full text-sm mt-1 bg-transparent focus:outline-none ${theme.textSub}`}
                        />
                      <p className="text-xs opacity-50 mt-1">{new Date(item.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'deliverables' && (
            <div className={`rounded-xl p-6 border ${theme.card}`}>
               <h2 className="text-lg font-bold mb-6">Deliverables & Links</h2>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                 {portalData.deliverables.map((item) => (
                   <div key={item.id} className={`p-4 rounded-lg flex items-center gap-3 border ${isWedding ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-slate-200'}`}>
                     <div className={`p-2 rounded ${isWedding ? 'bg-zinc-800' : 'bg-slate-100'}`}>
                        {item.type === 'Photos' && <Image className="w-5 h-5" />}
                        {item.type === 'Video' && <Video className="w-5 h-5" />}
                        {item.type === 'Document' && <FileText className="w-5 h-5" />}
                        {item.type === 'Other' && <LinkIcon className="w-5 h-5" />}
                     </div>
                     <div className="flex-1 overflow-hidden">
                       <h4 className="font-semibold text-sm truncate">{item.title}</h4>
                       <a href={item.url} target="_blank" rel="noreferrer" className={`text-xs hover:underline truncate block ${theme.accent}`}>
                         {item.url}
                       </a>
                     </div>
                   </div>
                 ))}
               </div>

               <div className={`p-4 rounded-lg ${isWedding ? 'bg-zinc-900' : 'bg-slate-50'}`}>
                 <h3 className="text-sm font-bold mb-3">Add New Link</h3>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                   <input 
                      placeholder="Title (e.g., Pre-wedding Album)"
                      value={newLink.title}
                      onChange={(e) => setNewLink({...newLink, title: e.target.value})}
                      className={`p-2 rounded border text-sm ${isWedding ? 'bg-black border-zinc-700 text-white' : 'bg-white border-slate-300'}`}
                   />
                   <input 
                      placeholder="URL"
                      value={newLink.url}
                      onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                      className={`p-2 rounded border text-sm ${isWedding ? 'bg-black border-zinc-700 text-white' : 'bg-white border-slate-300'}`}
                   />
                   <div className="flex gap-2">
                     <select
                        value={newLink.type}
                        onChange={(e) => setNewLink({...newLink, type: e.target.value as any})}
                        className={`p-2 rounded border text-sm flex-1 ${isWedding ? 'bg-black border-zinc-700 text-white' : 'bg-white border-slate-300'}`}
                     >
                       <option value="Photos">Photos</option>
                       <option value="Video">Video</option>
                       <option value="Document">Doc</option>
                       <option value="Other">Link</option>
                     </select>
                     <button 
                        onClick={handleAddDeliverable}
                        className={`p-2 rounded ${theme.accentBg} text-white`}
                     >
                       <Send className="w-4 h-4" />
                     </button>
                   </div>
                 </div>
               </div>
            </div>
          )}

          {activeTab === 'feedback' && (
            <div className={`rounded-xl p-6 border ${theme.card}`}>
               <h2 className="text-lg font-bold mb-6">Client Feedback Log</h2>
               <div className="space-y-4 mb-6 max-h-[400px] overflow-y-auto">
                 {portalData.feedback.length === 0 && <p className={theme.textSub}>No feedback logged yet.</p>}
                 {portalData.feedback.map((item) => (
                   <div key={item.id} className={`flex gap-3 ${item.from === 'Client' ? 'flex-row' : 'flex-row-reverse'}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${item.from === 'Client' ? 'bg-gray-200 text-black' : (isWedding ? 'bg-yellow-600 text-black' : 'bg-blue-500 text-white')}`}>
                        {item.from === 'Client' ? 'C' : 'AP'}
                      </div>
                      <div className={`p-3 rounded-xl max-w-[80%] text-sm ${
                        item.from === 'Client' 
                          ? (isWedding ? 'bg-zinc-800 text-zinc-200' : 'bg-slate-100 text-slate-800')
                          : (isWedding ? 'bg-yellow-900/30 text-yellow-100 border border-yellow-900' : 'bg-blue-50 text-blue-900 border border-blue-100')
                      }`}>
                        <p>{item.text}</p>
                        <p className="text-[10px] opacity-50 mt-1 text-right">{new Date(item.date).toLocaleDateString()}</p>
                      </div>
                   </div>
                 ))}
               </div>
               
               <div className="flex gap-2">
                 <input 
                   placeholder="Log a comment or request..."
                   value={newFeedback}
                   onChange={(e) => setNewFeedback(e.target.value)}
                   className={`flex-1 p-3 rounded-lg border focus:outline-none ${isWedding ? 'bg-black border-zinc-700 text-white' : 'bg-white border-slate-300'}`}
                   onKeyDown={(e) => e.key === 'Enter' && handleAddFeedback()}
                 />
                 <button onClick={handleAddFeedback} className={`px-4 py-2 rounded-lg font-bold ${theme.accentBg} text-white`}>
                   Log
                 </button>
               </div>
            </div>
          )}

          {activeTab === 'costing' && (
            <div className={`rounded-xl p-6 border border-red-900/30 relative overflow-hidden ${isWedding ? 'bg-red-950/10' : 'bg-red-50'}`}>
                <div className="absolute top-0 right-0 p-2 bg-red-600 text-white text-[10px] uppercase font-bold tracking-wider rounded-bl-lg">Internal Only</div>
                <h2 className={`text-lg font-bold mb-6 flex items-center gap-2 ${isWedding ? 'text-red-400' : 'text-red-700'}`}>
                    <LockKeyhole className="w-5 h-5" />
                    Internal Project Costs
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    {internalExpenses.map(exp => (
                        <div key={exp.id} className={`p-4 rounded-lg flex justify-between items-center ${isWedding ? 'bg-black/50 border border-red-900/20' : 'bg-white border border-red-100'}`}>
                             <div>
                                 <p className="font-bold text-sm">{exp.description}</p>
                                 <p className="text-xs opacity-60">{exp.category} • {new Date(exp.date).toLocaleDateString()}</p>
                             </div>
                             <p className="font-mono font-bold text-red-500">- ₹{exp.amount.toLocaleString('en-IN')}</p>
                        </div>
                    ))}
                    {internalExpenses.length === 0 && <p className="text-sm opacity-50 col-span-2 text-center py-4">No internal expenses logged yet.</p>}
                </div>

                <div className={`p-4 rounded-lg ${isWedding ? 'bg-black border border-zinc-800' : 'bg-white border border-slate-200'}`}>
                    <h3 className="text-sm font-bold mb-3">Add Expense (Private)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input 
                            placeholder="Description (e.g. Photographer Payment)" 
                            value={newCost.description}
                            onChange={(e) => setNewCost({...newCost, description: e.target.value})}
                            className={`p-2 rounded border text-sm ${isWedding ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                        />
                         <input 
                            type="number"
                            placeholder="Amount (₹)" 
                            value={newCost.amount}
                            onChange={(e) => setNewCost({...newCost, amount: e.target.value})}
                            className={`p-2 rounded border text-sm ${isWedding ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                        />
                         <div className="flex gap-2">
                             <select 
                               value={newCost.category}
                               onChange={(e) => setNewCost({...newCost, category: e.target.value})}
                               className={`p-2 rounded border text-sm flex-1 ${isWedding ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-slate-50 border-slate-300'}`}
                             >
                                <option value="Vendor">Vendor</option>
                                <option value="Labor">Labor</option>
                                <option value="Travel">Travel</option>
                                <option value="Other">Other</option>
                             </select>
                             <button onClick={handleAddPrivateCost} className="px-4 py-2 bg-red-600 text-white rounded font-bold hover:bg-red-700">Add</button>
                         </div>
                    </div>
                </div>

                <div className="mt-8 pt-4 border-t border-red-900/20 text-right">
                    <span className="text-sm opacity-60 mr-2">Total Project Expenses:</span>
                    <span className="text-xl font-bold text-red-500">₹{internalExpenses.reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}</span>
                </div>
            </div>
          )}
        </div>

        {/* Sidebar / Info */}
        <div className="space-y-6">
           <div className={`rounded-xl p-6 border ${theme.card}`}>
             <h3 className="font-bold mb-4">Project Details</h3>
             <div className="space-y-4 text-sm">
               <div className="flex justify-between">
                 <span className={theme.textSub}>Event Date</span>
                 <span className="font-medium">{new Date(client.weddingDate).toLocaleDateString()}</span>
               </div>
               <div className="flex justify-between">
                 <span className={theme.textSub}>Budget</span>
                 <span className="font-medium">₹{client.budget.toLocaleString('en-IN')}</span>
               </div>
               <div className="flex justify-between">
                 <span className={theme.textSub}>Contact</span>
                 <span className="font-medium">{client.phone}</span>
               </div>
             </div>
           </div>

           {/* AI Report Modal */}
           {report && (
             <div className={`rounded-xl p-6 border ${theme.card} animate-fade-in`}>
               <div className="flex justify-between items-center mb-4">
                 <h3 className={`font-bold ${theme.accent}`}>AI Status Update</h3>
                 <button onClick={() => setReport(null)} className="text-xs hover:underline">Close</button>
               </div>
               <div className={`p-4 rounded text-sm mb-4 whitespace-pre-wrap ${isWedding ? 'bg-black border border-zinc-800' : 'bg-slate-100'}`}>
                 {report}
               </div>
               <button 
                 onClick={() => navigator.clipboard.writeText(report)}
                 className={`w-full py-2 rounded font-medium ${theme.button}`}
               >
                 Copy to Clipboard
               </button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default ClientPortal;
