const fs = require('fs');
const file = 'src/pages/ClientDetailsPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add import
if (!code.includes('calculateEventStatusAndProgress')) {
    code = code.replace("import { type Client, type Project, type TimelineItem, type ClientEvent } from '../types';", 
                        "import { type Client, type Project, type TimelineItem, type ClientEvent } from '../types';\nimport { calculateEventStatusAndProgress } from '../utils/eventUtils';");
}

// 2. Add timeCounter state inside the component
if (!code.includes('timeCounter')) {
    const target = 'const [editingEvent, setEditingEvent] = useState<ClientEvent | null>(null);';
    const replacement = `const [editingEvent, setEditingEvent] = useState<ClientEvent | null>(null);
   const [timeCounter, setTimeCounter] = useState(0);

   useEffect(() => {
      const interval = setInterval(() => {
         setTimeCounter(c => c + 1);
      }, 30000); // 30 seconds
      return () => clearInterval(interval);
   }, []);`;
    code = code.replace(target, replacement);
}

// 3. Update newEventForm initial state
const formStateTarget = `   const [newEventForm, setNewEventForm] = useState<Partial<ClientEvent>>({
      name: '',
      date: '',
      brideLocation: '',
      groomLocation: '',
      venueLocation: '',
      notes: '',
      status: 'Scheduled'
   });`;
const formStateReplacement = `   const [newEventForm, setNewEventForm] = useState<Partial<ClientEvent>>({
      name: '',
      date: '',
      startTime: '09:00',
      endTime: '18:00',
      brideLocation: '',
      groomLocation: '',
      venueLocation: '',
      notes: '',
      status: 'Scheduled'
   });`;
code = code.replace(formStateTarget, formStateReplacement);

// 4. Update handleSaveEvent
const saveTarget = `         id: \`event_\${Date.now()}\`,
         name: newEventForm.name || 'Unnamed Event',
         date: newEventForm.date || new Date().toISOString().split('T')[0],
         brideLocation: newEventForm.brideLocation,
         groomLocation: newEventForm.groomLocation,
         venueLocation: newEventForm.venueLocation,
         notes: newEventForm.notes,
         status: newEventForm.status || 'Scheduled'
      };`;
const saveReplacement = `         id: \`event_\${Date.now()}\`,
         name: newEventForm.name || 'Unnamed Event',
         date: newEventForm.date || new Date().toISOString().split('T')[0],
         startTime: newEventForm.startTime,
         endTime: newEventForm.endTime,
         brideLocation: newEventForm.brideLocation,
         groomLocation: newEventForm.groomLocation,
         venueLocation: newEventForm.venueLocation,
         notes: newEventForm.notes,
         status: newEventForm.status || 'Scheduled'
      };`;
code = code.replace(saveTarget, saveReplacement);

// reset state after save
const resetTarget = `         setNewEventForm({
            name: '', date: '', brideLocation: '', groomLocation: '', venueLocation: '', notes: '', status: 'Scheduled'
         });`;
const resetReplacement = `         setNewEventForm({
            name: '', date: '', startTime: '09:00', endTime: '18:00', brideLocation: '', groomLocation: '', venueLocation: '', notes: '', status: 'Scheduled'
         });`;
code = code.replace(resetTarget, resetReplacement);

// 5. Update Add Event Modal UI
const addModalTarget = `                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Status *</label>
                           <select required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all appearance-none" value={newEventForm.status || 'Scheduled'} onChange={e => setNewEventForm({ ...newEventForm, status: e.target.value as any })}>
                              <option value="Scheduled" className="bg-zinc-900">Scheduled</option>
                              <option value="In Preparation" className="bg-zinc-900">In Preparation</option>
                              <option value="In Progress" className="bg-zinc-900">In Progress</option>
                              <option value="Completed" className="bg-zinc-900">Completed</option>
                              <option value="Cancelled" className="bg-zinc-900">Cancelled</option>
                           </select>
                        </div>`;
const addModalReplacement = `                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Start Time</label>
                           <input type="time" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" value={newEventForm.startTime || ''} onChange={e => setNewEventForm({ ...newEventForm, startTime: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">End Time</label>
                           <input type="time" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" value={newEventForm.endTime || ''} onChange={e => setNewEventForm({ ...newEventForm, endTime: e.target.value })} />
                        </div>`;
code = code.replace(addModalTarget, addModalReplacement);
// Make add modal grid 3 cols instead of 2 for date/startTime/endTime
code = code.replace(`<div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Date *</label>`, `<div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Date *</label>`);


// 6. Update Edit Event Modal UI
const editModalTarget = `                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Status *</label>
                           <select required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all appearance-none" value={editingEvent.status || 'Scheduled'} onChange={e => setEditingEvent({ ...editingEvent, status: e.target.value as any })}>
                              <option value="Scheduled" className="bg-zinc-900">Scheduled</option>
                              <option value="In Preparation" className="bg-zinc-900">In Preparation</option>
                              <option value="In Progress" className="bg-zinc-900">In Progress</option>
                              <option value="Completed" className="bg-zinc-900">Completed</option>
                              <option value="Cancelled" className="bg-zinc-900">Cancelled</option>
                           </select>
                        </div>`;
const editModalReplacement = `                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Start Time</label>
                           <input type="time" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" value={editingEvent.startTime || ''} onChange={e => setEditingEvent({ ...editingEvent, startTime: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">End Time</label>
                           <input type="time" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" value={editingEvent.endTime || ''} onChange={e => setEditingEvent({ ...editingEvent, endTime: e.target.value })} />
                        </div>`;
code = code.replace(editModalTarget, editModalReplacement);

// Make edit modal grid 3 cols instead of 2 for date/startTime/endTime
// We only want to replace the SECOND occurrence (which is inside edit modal) or just use a specific context.
code = code.replace(`onChange={e => setEditingEvent({ ...editingEvent, name: e.target.value })} />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Date *</label>`, `onChange={e => setEditingEvent({ ...editingEvent, name: e.target.value })} />
                     </div>
                     <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Date *</label>`);

// 7. Update Event Cards
// Need to replace the whole event card loop inner logic to calculate status
const eventCardTargetRegex = /client\.events\.map\(ev => \(\s*<div key=\{ev\.id\} className="bg-black\/50 p-6 rounded-2xl border border-white\/5 relative overflow-hidden group hover:border-white\/20 transition-all">/;
const eventCardReplacement = `client.events.map(ev => {
                              const { status: calcStatus, progress: calcProgress } = calculateEventStatusAndProgress(ev);
                              return (
                               <div key={ev.id} className="bg-black/50 p-6 rounded-2xl border border-white/5 relative overflow-hidden group hover:border-white/20 transition-all flex flex-col">
                                 {/* Dynamic Progress Bar */}
                                 {ev.startTime && ev.endTime && (
                                     <div className="absolute top-0 left-0 h-1 bg-white/5 w-full overflow-hidden">
                                        <div className="h-full bg-blue-500 transition-all duration-1000" style={{ width: \`\${calcProgress}%\` }} />
                                     </div>
                                 )}`;
code = code.replace(eventCardTargetRegex, eventCardReplacement);

// Replace status indicator
code = code.replace(/ev\.status === 'Completed' \? 'bg-emerald-500'/g, `calcStatus === 'Completed' ? 'bg-emerald-500'`);
code = code.replace(/ev\.status === 'In Progress' \? 'bg-blue-500'/g, `calcStatus === 'In Progress' ? 'bg-blue-500'`);
code = code.replace(/ev\.status === 'Cancelled' \? 'bg-red-500'/g, `calcStatus === 'Cancelled' ? 'bg-red-500'`);
code = code.replace(/>\{ev\.status\}<\/span>/g, `>{calcStatus}</span>`);

// Add mark completed button
const editBtnRegex = /<Edit2 className="w-3 h-3" \/> Edit\s*<\/button>/;
const markCompleteBtn = `<Edit2 className="w-3 h-3" /> Edit
                                        </button>
                                        {!ev.actualCompletedAt && (
                                          <button onClick={async () => {
                                             const updatedEvents = client.events.map(e => e.id === ev.id ? { ...e, status: 'Completed', actualCompletedAt: new Date().toISOString() } : e);
                                             const updatedClient = { ...client, events: updatedEvents };
                                             await api.saveClient(updatedClient);
                                             setClient(updatedClient);
                                             addToast("Marked Completed");
                                          }} className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest py-2 rounded-lg flex items-center justify-center gap-2 transition-all">
                                             <Check className="w-3 h-3" /> Complete
                                          </button>
                                        )}`;
code = code.replace(editBtnRegex, markCompleteBtn);

// Fix the closing bracket for the map
code = code.replace(/                           \)\)\s*\)\}/g, `                           )})\n                         )}`);

fs.writeFileSync(file, code);
console.log("ClientDetailsPage patched with Event Tracking!");
