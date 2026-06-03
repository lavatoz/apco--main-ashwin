const fs = require('fs');
const file = 'src/pages/ClientDetailsPage.tsx';
let code = fs.readFileSync(file, 'utf8');

// The event card rendering block is around here:
// {(ev.brideLocation || ev.groomLocation || ev.venueLocation) && (
//    <div className="pt-3 mt-3 border-t border-white/5 space-y-2">
//        ...
//    </div>
// )}
// </div>
// </div>

// Let's find the closing div sequence for the card:
const marker = '                                     )}\n                                  </div>\n                               </div>\n                           ))';

if (!code.includes(marker)) {
    console.error("Marker not found exactly! Using a more lenient regex.");
    
    // We can use a regex to match the end of the event loop.
    // The loop looks like `client.events.map(ev => (` and ends with `</div>\n                           ))`
    // But since it's hard to match reliably, let's just find the loop.
}

const replacement = `                                     )}
                                  </div>
                                  {isAdmin && (
                                     <div className="flex gap-2 mt-4 pt-4 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => { setEditingEvent(ev); setIsEditEventModalOpen(true); }} className="flex-1 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest py-2 rounded-lg flex items-center justify-center gap-2 transition-all">
                                           <Edit2 className="w-3 h-3" /> Edit
                                        </button>
                                        <button onClick={() => handleDeleteEvent(ev.id, ev.name)} className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest py-2 rounded-lg flex items-center justify-center gap-2 transition-all">
                                           <Trash2 className="w-3 h-3" /> Delete
                                        </button>
                                     </div>
                                  )}
                               </div>
                           ))`;

if (code.includes(marker)) {
    code = code.replace(marker, replacement);
    fs.writeFileSync(file, code);
    console.log("File patched successfully!");
} else {
    // try removing carriage returns in marker
    const noCRMarker = marker.replace(/\\r/g, '');
    const codeNoCR = code.replace(/\\r/g, '');
    
    if (codeNoCR.includes(noCRMarker)) {
        let parts = codeNoCR.split(noCRMarker);
        code = parts[0] + replacement + parts[1];
        fs.writeFileSync(file, code);
        console.log("File patched successfully (CR removed)!");
    } else {
        console.log("Still could not find the target!");
    }
}
