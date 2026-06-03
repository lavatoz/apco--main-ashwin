const fs = require('fs');
const file = 'src/pages/ClientDetailsPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// 1. Add State
const stateTarget = `   const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);`;
const stateReplacement = `   const [isEditEventModalOpen, setIsEditEventModalOpen] = useState(false);
   const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
   const [editProjectForm, setEditProjectForm] = useState<any>({});`;
code = code.replace(stateTarget, stateReplacement);

// 2. Add handleUpdateProjectInfo
const handlerTarget = `   const handleDeleteEvent = async (eventId: string, eventName: string) => {`;
const handlerReplacement = `   const handleUpdateProjectInfo = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!client) return;

      const updatedClient = {
         ...client,
         name: editProjectForm.name,
         projectName: editProjectForm.projectName,
         email: editProjectForm.email,
         phone: editProjectForm.phone,
         projectType: editProjectForm.projectType,
         eventDate: editProjectForm.eventDate,
         status: editProjectForm.status,
      };

      try {
         await api.saveClient(updatedClient);
         setClient(updatedClient);
         addToast("Project Information Updated");
         setIsEditProjectModalOpen(false);
      } catch (err) {
         console.error("Failed to update project info:", err);
         addToast("Failed to update project info");
      }
   };

   const handleDeleteEvent = async (eventId: string, eventName: string) => {`;
code = code.replace(handlerTarget, handlerReplacement);

// 3. Update the header
const headerTarget = `<h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em] border-b border-white/5 pb-4">Project Information</h3>`;
const headerReplacement = `<div className="flex justify-between items-center border-b border-white/5 pb-4">
                        <h3 className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.3em]">Project Information</h3>
                        <button 
                           onClick={() => { 
                              setEditProjectForm({ 
                                 name: client.name || '', 
                                 projectName: client.projectName || '', 
                                 email: client.email || '', 
                                 phone: client.phone || '', 
                                 projectType: client.projectType || '', 
                                 eventDate: client.eventDate || client.weddingDate || '', 
                                 status: client.status || 'Active' 
                              }); 
                              setIsEditProjectModalOpen(true); 
                           }}
                           className="text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white transition-colors flex items-center gap-2"
                        >
                           <Edit2 className="w-3 h-3" /> Edit
                        </button>
                     </div>`;
code = code.replace(headerTarget, headerReplacement);

// 4. Add the Modal at the bottom
const modalTarget = `          {isEditEventModalOpen && editingEvent && createPortal(`;
const modalReplacement = `          {isEditProjectModalOpen && createPortal(
            <div className="fixed inset-0 bg-black/80 z-[200] flex items-center justify-center p-6 backdrop-blur-2xl">
               <div className="bg-zinc-900 border border-white/10 rounded-[2.5rem] w-full max-w-2xl p-12 shadow-2xl animate-ios-slide-up max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <div className="flex justify-between items-center mb-8">
                     <h2 className="text-3xl font-black text-white uppercase tracking-tight">Edit Project Info</h2>
                     <button onClick={() => setIsEditProjectModalOpen(false)} className="p-3 bg-white/5 text-zinc-600 hover:text-white rounded-full transition-all"><X className="w-6 h-6" /></button>
                  </div>
                  <form onSubmit={handleUpdateProjectInfo} className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Client Name *</label>
                           <input required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" value={editProjectForm.name || ''} onChange={e => setEditProjectForm({ ...editProjectForm, name: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Project Name *</label>
                           <input required className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" value={editProjectForm.projectName || ''} onChange={e => setEditProjectForm({ ...editProjectForm, projectName: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Email</label>
                           <input type="email" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" value={editProjectForm.email || ''} onChange={e => setEditProjectForm({ ...editProjectForm, email: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Phone Number</label>
                           <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" value={editProjectForm.phone || ''} onChange={e => setEditProjectForm({ ...editProjectForm, phone: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Project Type</label>
                           <input className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" value={editProjectForm.projectType || ''} onChange={e => setEditProjectForm({ ...editProjectForm, projectType: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Primary Event Date</label>
                           <input type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all" value={editProjectForm.eventDate || ''} onChange={e => setEditProjectForm({ ...editProjectForm, eventDate: e.target.value })} />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                           <label className="text-[11px] font-black uppercase text-zinc-500 tracking-widest px-1">Status</label>
                           <select className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold text-white outline-none focus:bg-white/10 transition-all appearance-none" value={editProjectForm.status || 'Active'} onChange={e => setEditProjectForm({ ...editProjectForm, status: e.target.value })}>
                              <option value="Lead" className="bg-zinc-900">Lead</option>
                              <option value="Active" className="bg-zinc-900">Active</option>
                              <option value="Completed" className="bg-zinc-900">Completed</option>
                              <option value="Archived" className="bg-zinc-900">Archived</option>
                           </select>
                        </div>
                     </div>
                     <button type="submit" className="w-full py-5 bg-white text-black font-black rounded-2xl text-[11px] uppercase tracking-widest shadow-2xl hover:bg-zinc-200 transition-all mt-4">
                        Save Project Info
                     </button>
                  </form>
               </div>
            </div>
          , document.body)}

          {isEditEventModalOpen && editingEvent && createPortal(`;
code = code.replace(modalTarget, modalReplacement);

fs.writeFileSync(file, code);
console.log("Edit Project Modal injected!");
