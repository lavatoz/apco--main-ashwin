const fs = require('fs');
const file = 'src/pages/ClientDetailsPage.tsx';
let code = fs.readFileSync(file, 'utf8');

const regex = /([ \t]*<\/div>\r?\n[ \t]*\)\}\r?\n[ \t]*<\/div>\r?\n[ \t]*)(<\/div>\r?\n[ \t]*\)\))/;

const replacement = `$1{isAdmin && (
                                     <div className="flex gap-2 mt-4 pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditingEvent(ev); setIsEditEventModalOpen(true); }} className="flex-1 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg flex items-center justify-center gap-2 transition-all">
                                           <Edit2 className="w-3 h-3" /> Edit
                                        </button>
                                        <button onClick={() => handleDeleteEvent(ev.id, ev.name)} className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest py-2 rounded-lg flex items-center justify-center gap-2 transition-all">
                                           <Trash2 className="w-3 h-3" /> Delete
                                        </button>
                                     </div>
                                  )}
$2`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync(file, code);
    console.log("File patched!");
} else {
    console.log("Regex did not match.");
}
